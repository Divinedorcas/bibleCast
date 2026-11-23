<?php

namespace App\Http\Controllers\Api;

use App\Events\ProjectionUpdated;
use App\Http\Controllers\Controller;
use App\Models\Projection;
use App\Models\ProjectionQueue;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectionQueueController extends Controller
{
    /**
     * List all queue items ordered by sort sequence.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $serviceId = $request->query('service_id');
        $status = $request->query('status');

        $query = ProjectionQueue::with('user:id,name,role')->ordered();

        if ($serviceId) {
            $query->where('service_id', $serviceId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $items = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Projection queue retrieved successfully.',
            'data'    => $items,
        ]);
    }

    /**
     * Add a passage to the queue.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference'        => ['required', 'string', 'max:100'],
            'translation_code' => ['nullable', 'string', 'max:20'],
            'passage_text'     => ['nullable', 'string'],
            'passage_preview'  => ['nullable', 'string', 'max:255'],
            'verses_json'      => ['nullable', 'array'],
            'service_id'       => ['nullable', 'integer'],
            'sort_order'       => ['nullable', 'integer'],
            'status'           => ['nullable', 'string', 'in:pending,projected,skipped'],
        ]);

        $userId = $request->user()?->id;
        $text = $validated['passage_text'] ?? '';
        $preview = $validated['passage_preview'] ?? (!empty($text) ? mb_substr(strip_tags($text), 0, 250) : null);

        // Calculate sort order if not given
        $maxSort = ProjectionQueue::max('sort_order') ?? 0;
        $sortOrder = isset($validated['sort_order']) ? (int) $validated['sort_order'] : ($maxSort + 1);

        $queueItem = ProjectionQueue::create([
            'service_id'       => $validated['service_id'] ?? null,
            'user_id'          => $userId,
            'reference'        => $validated['reference'],
            'translation_code' => strtolower($validated['translation_code'] ?? 'kjv'),
            'passage_text'     => $text,
            'passage_preview'  => $preview,
            'verses_json'      => $validated['verses_json'] ?? null,
            'sort_order'       => $sortOrder,
            'status'           => $validated['status'] ?? 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Passage added to queue successfully.',
            'data'    => $queueItem->load('user:id,name,role'),
        ], 201);
    }

    /**
     * Remove a passage from the queue.
     *
     * @param  int  $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $item = ProjectionQueue::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Passage removed from queue successfully.',
        ]);
    }

    /**
     * Reorder queue items.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'              => ['required', 'array'],
            'items.*'            => ['nullable'],
        ]);

        $items = $validated['items'];

        foreach ($items as $index => $itemData) {
            if (is_numeric($itemData)) {
                ProjectionQueue::where('id', (int) $itemData)->update(['sort_order' => $index]);
            } elseif (is_array($itemData) && isset($itemData['id'])) {
                $sort = $itemData['sort_order'] ?? $index;
                ProjectionQueue::where('id', (int) $itemData['id'])->update(['sort_order' => $sort]);
            }
        }

        $updatedQueue = ProjectionQueue::with('user:id,name,role')->ordered()->get();

        return response()->json([
            'success' => true,
            'message' => 'Projection queue reordered successfully.',
            'data'    => $updatedQueue,
        ]);
    }

    /**
     * Project selected passage from queue to sanctuary screen.
     *
     * @param  Request  $request
     * @param  int  $id
     * @return JsonResponse
     */
    public function project(Request $request, $id): JsonResponse
    {
        $item = ProjectionQueue::findOrFail($id);
        $text = $item->passage_text ?: ($item->passage_preview ?: $item->reference);

        // Clear previous active projection
        Projection::where('status', 'projected')->update([
            'status'     => 'cleared',
            'cleared_at' => Carbon::now(),
        ]);

        // Create new projection record
        $projection = Projection::create([
            'service_id'       => $item->service_id,
            'user_id'          => $request->user()?->id ?? $item->user_id,
            'reference'        => $item->reference,
            'translation_code' => $item->translation_code,
            'passage_text'     => $text,
            'verses_json'      => $item->verses_json ?? [],
            'status'           => 'projected',
            'mode'             => 'queue',
            'projected_at'     => Carbon::now(),
        ]);

        // Mark queue item as projected
        $item->update(['status' => 'projected']);

        // Broadcast to authorized projector display channel
        ProjectionUpdated::dispatch(
            $projection->reference,
            $projection->translation_code,
            $projection->passage_text,
            $projection->status,
            $projection->projected_at?->toIso8601String() ?? Carbon::now()->toIso8601String(),
            $projection->verses_json ?? [],
            null,
            $request->user()?->name
        );

        return response()->json([
            'success' => true,
            'message' => "Passage '{$item->reference}' projected successfully from queue.",
            'data'    => [
                'projection' => $projection->load('user:id,name,role'),
                'queue_item' => $item->fresh()->load('user:id,name,role'),
            ],
        ]);
    }

    /**
     * Clear all items from queue.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function clear(Request $request): JsonResponse
    {
        $serviceId = $request->input('service_id');
        $query = ProjectionQueue::query();

        if ($serviceId) {
            $query->where('service_id', $serviceId);
        }

        $deletedCount = $query->delete();

        return response()->json([
            'success' => true,
            'message' => 'Projection queue cleared successfully.',
            'deleted' => $deletedCount,
        ]);
    }
}
