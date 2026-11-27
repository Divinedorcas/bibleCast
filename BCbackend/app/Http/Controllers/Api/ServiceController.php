<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * List all church services (supports status, date, and search filters).
     */
    public function index(Request $request): JsonResponse
    {
        Service::seedDefaultsIfNeeded();

        $status = $request->query('status');
        $date = $request->query('date');
        $search = trim((string) $request->query('search', ''));

        $query = Service::with('creator:id,name')
            ->withCount(['projections', 'detectedReferences', 'queueItems']);

        if ($status) {
            $normalizedStatus = $status === 'previous' ? 'completed' : $status;
            $query->where('status', $normalizedStatus);
        }

        if ($date) {
            $query->whereDate('service_date', $date);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('preacher_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $services = $query
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END")
            ->orderByDesc('service_date')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Services retrieved successfully.',
            'data'    => $services,
        ]);
    }

    /**
     * List completed / previous church services ordered most recent first.
     */
    public function previous(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 25), 1), 100);

        $services = Service::with('creator:id,name')
            ->withCount(['projections', 'detectedReferences', 'queueItems'])
            ->previous()
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Previous services retrieved successfully.',
            'data'    => $services,
        ]);
    }

    /**
     * Create or schedule a new church service.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:191'],
            'preacher_name' => ['nullable', 'string', 'max:120'],
            'description'   => ['nullable', 'string', 'max:1000'],
            'service_date'  => ['nullable', 'date'],
            'start_time'    => ['nullable', 'string', 'max:20'],
            'end_time'      => ['nullable', 'string', 'max:20'],
            'status'        => ['nullable', 'string', 'in:scheduled,in_progress'],
        ]);

        $status = $validated['status'] ?? 'scheduled';
        $now = Carbon::now();

        if ($status === 'in_progress') {
            Service::where('status', 'in_progress')->update(['status' => 'scheduled']);
        }

        $service = Service::create([
            'name'          => trim($validated['name']),
            'preacher_name' => !empty($validated['preacher_name']) ? trim($validated['preacher_name']) : null,
            'description'   => !empty($validated['description']) ? trim($validated['description']) : null,
            'service_key'   => Service::generateUniqueKey($validated['name']),
            'service_date'  => $validated['service_date'] ?? $now->toDateString(),
            'start_time'    => $this->normalizeTime($validated['start_time'] ?? null)
                ?? ($status === 'in_progress' ? $now->format('H:i:s') : null),
            'end_time'      => $this->normalizeTime($validated['end_time'] ?? null),
            'status'        => $status,
            'started_at'    => $status === 'in_progress' ? $now : null,
            'created_by'    => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => $status === 'in_progress'
                ? "Service '{$service->name}' created and started."
                : "Service '{$service->name}' scheduled successfully.",
            'data'    => $this->hydrateCounts($service),
        ], 201);
    }

    /**
     * View full details and projection log for a single church service.
     */
    public function show(int $id): JsonResponse
    {
        $service = Service::with([
            'creator:id,name,role',
            'projections' => fn ($q) => $q->with('user:id,name')->latest('id')->limit(50),
            'detectedReferences' => fn ($q) => $q->latest('id')->limit(20),
        ])
            ->withCount(['projections', 'detectedReferences', 'queueItems'])
            ->find($id);

        if (!$service) {
            return $this->notFoundResponse();
        }

        return response()->json([
            'success' => true,
            'data'    => $service,
        ]);
    }

    /**
     * Edit an existing church service's metadata or schedule.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::find($id);
        if (!$service) {
            return $this->notFoundResponse();
        }

        $validated = $request->validate([
            'name'          => ['sometimes', 'required', 'string', 'max:191'],
            'preacher_name' => ['nullable', 'string', 'max:120'],
            'description'   => ['nullable', 'string', 'max:1000'],
            'service_date'  => ['nullable', 'date'],
            'start_time'    => ['nullable', 'string', 'max:20'],
            'end_time'      => ['nullable', 'string', 'max:20'],
            'status'        => ['nullable', 'string', 'in:scheduled,in_progress,completed'],
        ]);

        $payload = [];
        foreach (['name', 'preacher_name', 'description', 'service_date'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = is_string($validated[$field]) ? trim($validated[$field]) : $validated[$field];
            }
        }

        if (array_key_exists('start_time', $validated)) {
            $payload['start_time'] = $this->normalizeTime($validated['start_time']);
        }
        if (array_key_exists('end_time', $validated)) {
            $payload['end_time'] = $this->normalizeTime($validated['end_time']);
        }

        if (!empty($validated['status']) && $validated['status'] !== $service->status) {
            $payload['status'] = $validated['status'];
            if ($validated['status'] === 'in_progress') {
                Service::where('id', '!=', $service->id)
                    ->where('status', 'in_progress')
                    ->update(['status' => 'scheduled']);
                $payload['started_at'] = $service->started_at ?? Carbon::now();
                $payload['ended_at'] = null;
            } elseif ($validated['status'] === 'completed') {
                $payload['ended_at'] = Carbon::now();
                $payload['end_time'] = $payload['end_time'] ?? Carbon::now()->format('H:i:s');
            }
        }

        $service->update($payload);

        return response()->json([
            'success' => true,
            'message' => "Service '{$service->name}' updated successfully.",
            'data'    => $this->hydrateCounts($service->fresh()),
        ]);
    }

    /**
     * Schedule or reschedule a service for a specific date and time.
     */
    public function schedule(Request $request, int $id): JsonResponse
    {
        $service = Service::find($id);
        if (!$service) {
            return $this->notFoundResponse();
        }

        $validated = $request->validate([
            'service_date'  => ['required', 'date'],
            'start_time'    => ['nullable', 'string', 'max:20'],
            'end_time'      => ['nullable', 'string', 'max:20'],
            'name'          => ['nullable', 'string', 'max:191'],
            'preacher_name' => ['nullable', 'string', 'max:120'],
            'description'   => ['nullable', 'string', 'max:1000'],
        ]);

        $service->update([
            'name'          => !empty($validated['name']) ? trim($validated['name']) : $service->name,
            'preacher_name' => array_key_exists('preacher_name', $validated)
                ? ($validated['preacher_name'] ? trim($validated['preacher_name']) : null)
                : $service->preacher_name,
            'description'   => array_key_exists('description', $validated)
                ? ($validated['description'] ? trim($validated['description']) : null)
                : $service->description,
            'service_date'  => $validated['service_date'],
            'start_time'    => $this->normalizeTime($validated['start_time'] ?? null) ?? $service->start_time,
            'end_time'      => array_key_exists('end_time', $validated)
                ? $this->normalizeTime($validated['end_time'])
                : $service->end_time,
            'status'        => 'scheduled',
            'ended_at'      => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Service '{$service->name}' scheduled for {$validated['service_date']}.",
            'data'    => $this->hydrateCounts($service->fresh()),
        ]);
    }

    /**
     * Start a scheduled church service and mark it as actively in progress.
     */
    public function start(int $id): JsonResponse
    {
        $service = Service::find($id);
        if (!$service) {
            return $this->notFoundResponse();
        }

        if ($service->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Completed services cannot be started directly. Reschedule or create a new service instead.',
            ], 422);
        }

        $now = Carbon::now();

        Service::where('id', '!=', $service->id)
            ->where('status', 'in_progress')
            ->update(['status' => 'scheduled']);

        $service->update([
            'status'       => 'in_progress',
            'service_date' => $service->service_date ?? $now->toDateString(),
            'start_time'   => $service->start_time ?? $now->format('H:i:s'),
            'started_at'   => $now,
            'ended_at'     => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Service '{$service->name}' is now LIVE.",
            'data'    => $this->hydrateCounts($service->fresh()),
        ]);
    }

    /**
     * End / conclude an active or scheduled church service and archive it in previous services.
     */
    public function end(int $id): JsonResponse
    {
        $service = Service::find($id);
        if (!$service) {
            return $this->notFoundResponse();
        }

        if ($service->status === 'completed') {
            return response()->json([
                'success' => true,
                'message' => "Service '{$service->name}' was already completed.",
                'data'    => $this->hydrateCounts($service),
            ]);
        }

        $now = Carbon::now();
        $service->update([
            'status'   => 'completed',
            'end_time' => $now->format('H:i:s'),
            'ended_at' => $now,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Service '{$service->name}' has ended and moved to previous services.",
            'data'    => $this->hydrateCounts($service->fresh()),
        ]);
    }

    /**
     * Delete a scheduled or previous service (active services must be ended first).
     */
    public function destroy(int $id): JsonResponse
    {
        $service = Service::find($id);
        if (!$service) {
            return $this->notFoundResponse();
        }

        if ($service->status === 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a currently active service. End the service first.',
            ], 422);
        }

        $name = $service->name;
        $service->delete();

        return response()->json([
            'success' => true,
            'message' => "Service '{$name}' deleted successfully.",
        ]);
    }

    protected function normalizeTime(?string $time): ?string
    {
        if ($time === null || trim($time) === '') {
            return null;
        }

        $trimmed = trim($time);
        if (preg_match('/^\d{2}:\d{2}$/', $trimmed)) {
            return "{$trimmed}:00";
        }

        return $trimmed;
    }

    protected function hydrateCounts(Service $service): Service
    {
        return $service->load('creator:id,name')
            ->loadCount(['projections', 'detectedReferences', 'queueItems']);
    }

    protected function notFoundResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Church service not found.',
        ], 404);
    }
}
