<?php

namespace App\Http\Controllers\Api;

use App\Events\ProjectionUpdated;
use App\Events\ScriptureDetected;
use App\Http\Controllers\Controller;
use App\Models\DetectedReference;
use App\Models\Projection;
use App\Models\Service;
use App\Services\Bible\PassageResolver;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpeechController extends Controller
{
    protected PassageResolver $passageResolver;

    public function __construct(PassageResolver $passageResolver)
    {
        $this->passageResolver = $passageResolver;
    }

    /**
     * Step 1-6 End-to-End Workflow:
     * Receive speech transcription, detect scripture reference, validate bounds,
     * retrieve passage, persist pending detection, and notify operator.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function processTranscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transcript'  => ['required', 'string', 'max:1000'],
            'service_id'  => ['nullable', 'integer'],
            'translation' => ['nullable', 'string', 'max:20'],
        ]);

        $result = $this->passageResolver->processTranscription(
            $validated['transcript'],
            $validated['service_id'] ?? null,
            $validated['translation'] ?? null,
            $request->user()
        );

        $status = $result['success'] ? 200 : (isset($result['valid']) && !$result['valid'] ? 422 : 400);

        return response()->json($result, $status);
    }

    /**
     * List speech detections (pending, approved, rejected).
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min((int) ($request->query('limit', 20)), 100);
        $status = $request->query('status');
        $serviceId = $request->query('service_id');

        $query = DetectedReference::with(['service:id,name,service_key', 'reviewer:id,name,role'])
            ->orderBy('id', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($serviceId) {
            $query->where('service_id', $serviceId);
        }

        $detections = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'message' => 'Detections retrieved successfully.',
            'data'    => $detections,
        ]);
    }

    /**
     * Record a spoken detection directly.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transcript_snippet' => ['required', 'string'],
            'detected_reference' => ['required', 'string', 'max:100'],
            'confidence_score'   => ['nullable', 'numeric', 'between:0,1'],
            'service_id'         => ['nullable', 'integer'],
            'translation_code'   => ['nullable', 'string', 'max:20'],
        ]);

        $translation = $validated['translation_code'] ?? 'kjv';

        // Retrieve passage data if available
        $passageData = null;
        try {
            $passageData = $this->passageResolver->resolve($validated['detected_reference'], $translation);
        } catch (\Throwable $e) {
            // Non-blocking fallback
        }

        $detection = DetectedReference::create([
            'service_id'         => $validated['service_id'] ?? (Service::where('status', 'in_progress')->value('id')),
            'transcript_snippet' => $validated['transcript_snippet'],
            'detected_reference' => $validated['detected_reference'],
            'translation_code'   => $translation,
            'passage_text'       => $passageData['text'] ?? null,
            'verses_json'        => $passageData['verses'] ?? null,
            'confidence_score'   => $validated['confidence_score'] ?? 0.90,
            'status'             => 'pending',
        ]);

        // Send to operator for review
        event(new ScriptureDetected($detection, $passageData ?? []));

        return response()->json([
            'success' => true,
            'message' => 'Detection recorded and queued for review.',
            'data'    => $detection,
        ], 201);
    }

    /**
     * Get a single detection by ID.
     *
     * @param  int  $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $detection = DetectedReference::with(['service', 'reviewer'])->find($id);

        if (!$detection) {
            return response()->json([
                'success' => false,
                'message' => 'Detection record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $detection,
        ]);
    }

    /**
     * Detect scripture reference directly from Bible passage text or spoken quote.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function detectPassageText(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'        => ['required', 'string', 'max:5000'],
            'translation' => ['nullable', 'string', 'max:20'],
        ]);

        $result = $this->passageResolver->detectFromPassageText(
            $validated['text'],
            $validated['translation'] ?? null
        );

        return response()->json([
            'success'  => true,
            'detected' => $result['detected'],
            'message'  => $result['detected'] ? 'Bible passage detected.' : 'No matching passage detected.',
            'data'     => $result,
        ]);
    }

    /**
     * Operator Review Action (Approve / Reject).
     *
     * @param  Request  $request
     * @param  int  $id
     * @return JsonResponse
     */
    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
        ]);

        $detection = DetectedReference::find($id);

        if (!$detection) {
            return response()->json([
                'success' => false,
                'message' => 'Detection record not found.',
            ], 404);
        }

        $userId = $request->user()?->id;

        if ($validated['action'] === 'approve') {
            $detection->approve($userId);

            // Automatically project scripture to sanctuary displays upon approval
            $passageText = $detection->passage_text;
            $verses = $detection->verses_json;

            // If passage text was not cached on detection, fetch it now
            if (empty($passageText)) {
                try {
                    $resolved = $this->passageResolver->resolve($detection->detected_reference, $detection->translation_code);
                    $passageText = $resolved['text'];
                    $verses = $resolved['verses'];
                    $detection->passage_text = $passageText;
                    $detection->verses_json = $verses;
                    $detection->save();
                } catch (\Throwable $e) {}
            }

            // Clear any previous active projection
            Projection::where('status', 'projected')->update([
                'status'     => 'cleared',
                'cleared_at' => Carbon::now(),
            ]);

            // Create new projection record
            $projection = Projection::create([
                'reference'        => $detection->detected_reference,
                'translation_code' => $detection->translation_code,
                'passage_text'     => $passageText ?? '',
                'verses_json'      => $verses ?? [],
                'user_id'          => $userId,
                'service_id'       => $detection->service_id,
                'mode'             => 'voice_detected',
                'status'           => 'projected',
                'projected_at'     => Carbon::now(),
            ]);

            // Broadcast real-time display update
            event(new ProjectionUpdated(
                $projection->reference,
                $projection->translation_code,
                $projection->passage_text,
                'projected',
                $projection->projected_at?->toIso8601String(),
                $projection->verses_json ?? [],
                null,
                $request->user()?->name ?? 'Operator'
            ));

            return response()->json([
                'success' => true,
                'message' => "Scripture '{$detection->detected_reference}' approved and projected live.",
                'data'    => [
                    'detection'  => $detection->fresh(),
                    'projection' => $projection,
                ],
            ]);
        }

        // Otherwise reject
        $detection->reject($userId);

        return response()->json([
            'success' => true,
            'message' => "Detection '{$detection->detected_reference}' has been rejected.",
            'data'    => [
                'detection' => $detection->fresh(),
            ],
        ]);
    }
}
