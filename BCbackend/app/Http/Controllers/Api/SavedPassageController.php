<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedPassage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedPassageController extends Controller
{
    /**
     * View saved passages / favourites.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        $query = SavedPassage::query()->latest();

        if ($userId) {
            $query->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)->orWhereNull('user_id');
            });
        }

        $saved = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Saved passages retrieved successfully.',
            'data'    => $saved,
        ]);
    }

    /**
     * Save passage / add to favourites.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference'        => ['required', 'string', 'max:150'],
            'translation_code' => ['nullable', 'string', 'max:20'],
            'label'            => ['nullable', 'string', 'max:100'],
            'passage_text'     => ['required', 'string'],
            'verses_json'      => ['nullable', 'array'],
        ]);

        $userId = $request->user()?->id;
        $translation = strtolower($validated['translation_code'] ?? 'kjv');

        // Prevent duplicate saves for same reference & translation
        $saved = SavedPassage::updateOrCreate(
            [
                'user_id'          => $userId,
                'reference'        => $validated['reference'],
                'translation_code' => $translation,
            ],
            [
                'label'        => $validated['label'] ?? null,
                'passage_text' => $validated['passage_text'],
                'verses_json'  => $validated['verses_json'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Passage saved to favourites successfully.',
            'data'    => $saved,
        ], 201);
    }

    /**
     * Remove favourite passage.
     *
     * @param  int|string  $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $passage = SavedPassage::find($id);

        if (!$passage) {
            return response()->json([
                'success' => false,
                'message' => 'Saved passage not found.',
            ], 404);
        }

        $passage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Passage removed from favourites successfully.',
        ]);
    }
}
