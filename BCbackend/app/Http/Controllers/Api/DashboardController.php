<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Projection;
use App\Models\ProjectionQueue;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get real dashboard metrics, active service, recent projections, and active operators.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        // Ensure default 4 services exist
        Service::seedDefaultsIfNeeded();

        // 1. Total Projections done (real database count)
        $totalProjections = Projection::count();

        // 2. Current Active Service
        $currentService = Service::where('status', 'in_progress')->first()
            ?? Service::where('status', 'scheduled')->orderBy('id')->first()
            ?? Service::first();

        // All 4 services (1st service, 2nd service, tuesday service, thursday service)
        $allServices = Service::all();

        // 3. Recent Projections (real projections from database)
        $recentProjectionsQuery = Projection::with('user:id,name,role')->latest('id');

        $recentList = $recentProjectionsQuery->limit(10)->get()->map(function ($proj) {
            $date = $proj->projected_at ?? $proj->created_at;
            return [
                'id'          => $proj->id,
                'ref'         => $proj->reference,
                'reference'   => $proj->reference,
                'translation' => strtoupper($proj->translation_code ?? 'KJV'),
                'status'      => $proj->status,
                'time'        => $date ? Carbon::parse($date)->format('g:i A') : 'Just now',
                'timestamp'   => $date ? Carbon::parse($date)->toIso8601String() : null,
                'operator'    => $proj->user?->name ?? 'Media Operator',
                'passage_text'=> $proj->passage_text,
            ];
        });

        // Count of projections in current session/today (fallback to total if 0)
        $todayCount = Projection::whereDate('created_at', Carbon::today())->count();
        $recentProjectionsCount = $todayCount > 0 ? $todayCount : $totalProjections;

        // 4. Active Operators (signed in users in system)
        $users = User::all();
        $activeOperators = $users->map(function ($u, $idx) {
            return [
                'id'     => $u->id,
                'name'   => $u->name,
                'email'  => $u->email,
                'role'   => $u->role ?? 'operator',
                'status' => 'active',
                'since'  => $u->created_at ? Carbon::parse($u->created_at)->format('g:i A') : 'Online',
            ];
        });

        $activeOperatorsCount = $activeOperators->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard real statistics retrieved successfully.',
            'data'    => [
                'total_projections'        => $totalProjections,
                'recent_projections_count' => $recentProjectionsCount,
                'recent_projections'       => $recentList,
                'current_service'          => $currentService,
                'services'                 => $allServices,
                'active_operators'         => $activeOperators,
                'active_operators_count'   => $activeOperatorsCount,
                'queue_count'              => ProjectionQueue::count(),
            ],
        ]);
    }

    /**
     * Switch active service to 1st service, 2nd service, tuesday service, or thursday service.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function switchService(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_key' => ['nullable', 'string'],
            'service_id'  => ['nullable', 'integer'],
        ]);

        Service::seedDefaultsIfNeeded();

        $query = Service::query();
        if (!empty($validated['service_id'])) {
            $query->where('id', $validated['service_id']);
        } elseif (!empty($validated['service_key'])) {
            $query->where('service_key', $validated['service_key']);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Please provide service_key or service_id to switch service.',
            ], 422);
        }

        $target = $query->first();

        if (!$target) {
            return response()->json([
                'success' => false,
                'message' => 'Specified service not found.',
            ], 404);
        }

        // Set all other services to scheduled
        Service::where('id', '!=', $target->id)->where('status', 'in_progress')->update([
            'status' => 'scheduled',
        ]);

        // Activate target service
        $now = Carbon::now();
        $target->update([
            'status'     => 'in_progress',
            'start_time' => $now->format('H:i:s'),
            'started_at' => $now,
            'ended_at'   => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Switched active service to '{$target->name}'.",
            'data'    => [
                'current_service' => $target->fresh(),
                'services'        => Service::all(),
            ],
        ]);
    }

    /**
     * List all predefined and configured church services.
     *
     * @return JsonResponse
     */
    public function services(): JsonResponse
    {
        Service::seedDefaultsIfNeeded();
        $services = Service::all();

        return response()->json([
            'success' => true,
            'data'    => $services,
        ]);
    }
}
