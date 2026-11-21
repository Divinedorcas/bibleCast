<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use App\Services\Bible\BibleProviderException;
use App\Services\Bible\BibleProviderInterface;
use App\Services\Bible\PassageResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BibleController extends Controller
{
    protected PassageResolver $passageResolver;

    public function __construct(PassageResolver $passageResolver)
    {
        $this->passageResolver = $passageResolver;
    }

    /**
     * Get list of available active Bible translations.
     *
     * @return JsonResponse
     */
    public function translations(): JsonResponse
    {
        $translations = Translation::active()
            ->select('id', 'code', 'name', 'provider', 'is_default', 'is_active')
            ->orderBy('is_default', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Translations retrieved successfully.',
            'data'    => $translations,
        ]);
    }

    /**
     * Search and retrieve scripture text by reference and translation.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function passage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference'   => ['required', 'string', 'max:150'],
            'translation' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            $data = $this->passageResolver->resolve(
                $validated['reference'],
                $validated['translation'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Passage retrieved successfully.',
                'data'    => $data,
            ]);
        } catch (BibleProviderException $e) {
            $statusCode = $e->isNotFound() ? 404 : ($e->isNetworkError() ? 503 : 422);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => $e->getCode(),
            ], $statusCode);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching the passage: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search Bible text or query scriptures.
     *
     * @param  Request  $request
     * @param  BibleProviderInterface  $provider
     * @return JsonResponse
     */
    public function search(Request $request, BibleProviderInterface $provider): JsonResponse
    {
        $validated = $request->validate([
            'query'       => ['required', 'string', 'max:200'],
            'translation' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            $data = $provider->search(
                $validated['query'],
                $validated['translation'] ?? 'kjv'
            );

            return response()->json([
                'success' => true,
                'message' => 'Search completed successfully.',
                'data'    => $data,
            ]);
        } catch (BibleProviderException $e) {
            $statusCode = $e->isNotFound() ? 404 : ($e->isNetworkError() ? 503 : 422);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => $e->getCode(),
            ], $statusCode);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during search: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse speech transcript and extract canonical scripture reference.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function parseReference(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transcript' => ['required', 'string', 'max:500'],
        ]);

        $result = $this->passageResolver->parseReferenceFromTranscript($validated['transcript']);

        return response()->json([
            'success' => true,
            'message' => $result['detected'] ? 'Reference detected successfully.' : 'No scripture reference detected.',
            'data'    => $result,
        ]);
    }
}
