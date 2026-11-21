<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Projection;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectionController extends Controller
{
    /**
     * View projection history.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        $limit = min((int) ($request->query('limit', 20)), 100);
        $serviceId = $request->query('service_id');

        $query = Projection::with('user:id,name,role')->history();

        if ($serviceId) {
            $query->where('service_id', $serviceId);
        }

        $history = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'message' => 'Projection history retrieved successfully.',
            'data'    => $history,
        ]);
    }

    /**
     * Record a new scripture projection.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference'        => ['required', 'string', 'max:150'],
            'translation_code' => ['nullable', 'string', 'max:20'],
            'passage_text'     => ['required', 'string'],
            'verses_json'      => ['nullable', 'array'],
            'service_id'       => ['nullable', 'integer'],
            'mode'             => ['nullable', 'string', 'in:manual,voice_detected,queue'],
        ]);

        $userId = $request->user()?->id;

        // Clear any previous active projection
        Projection::where('status', 'projected')->update([
            'status'     => 'cleared',
            'cleared_at' => Carbon::now(),
        ]);

        $projection = Projection::create([
            'service_id'       => $validated['service_id'] ?? null,
            'user_id'          => $userId,
            'reference'        => $validated['reference'],
            'translation_code' => strtolower($validated['translation_code'] ?? 'kjv'),
            'passage_text'     => $validated['passage_text'],
            'verses_json'      => $validated['verses_json'] ?? null,
            'status'           => 'projected',
            'mode'             => $validated['mode'] ?? 'manual',
            'projected_at'     => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Scripture projected and recorded to history successfully.',
            'data'    => $projection->load('user:id,name,role'),
        ], 201);
    }

    /**
     * Get current active projection.
     *
     * @return JsonResponse
     */
    public function current(): JsonResponse
    {
        $current = Projection::with('user:id,name,role')->active()->first();

        return response()->json([
            'success' => true,
            'data'    => $current,
        ]);
    }

    /**
     * Clear screen.
     *
     * @return JsonResponse
     */
    public function clear(): JsonResponse
    {
        Projection::where('status', 'projected')->update([
            'status'     => 'cleared',
            'cleared_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Projection screen cleared successfully.',
        ]);
    }
}
