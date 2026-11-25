<?php

namespace App\Services\Bible;

use App\Events\ScriptureDetected;
use App\Models\DetectedReference;
use App\Models\Service;
use App\Models\Translation;
use App\Models\User;
use App\Services\Speech\ReferenceParser;
use Illuminate\Support\Str;

class PassageResolver
{
    protected BibleProviderInterface $provider;
    protected ReferenceParser $referenceParser;

    public function __construct(
        BibleProviderInterface $provider,
        ?ReferenceParser $referenceParser = null
    ) {
        $this->provider = $provider;
        $this->referenceParser = $referenceParser ?? app(ReferenceParser::class);
    }

    /**
     * Get the ReferenceParser instance.
     */
    public function getReferenceParser(): ReferenceParser
    {
        return $this->referenceParser;
    }

    /**
     * Resolve a passage with translation fallback.
     *
     * @param  string  $reference
     * @param  string|null  $translationCode
     * @return array
     */
    public function resolve(string $reference, ?string $translationCode = null): array
    {
        $translation = null;
        if ($translationCode) {
            $translation = Translation::active()->where('code', strtolower($translationCode))->first();
        }

        if (!$translation) {
            $translation = Translation::active()->default()->first()
                ?? Translation::active()->first();
        }

        $code = $translation ? $translation->code : ($translationCode ?: 'kjv');

        $passageData = $this->provider->getPassage($reference, $code);

        // Normalize verses array structure to match API standard: [{ verse, text, ... }]
        $formattedVerses = array_map(function ($v) {
            return [
                'verse' => (int) ($v['verse'] ?? 0),
                'text'  => trim($v['text'] ?? ''),
            ];
        }, $passageData['verses'] ?? []);

        return [
            'reference'        => $passageData['reference'] ?? $reference,
            'translation'      => $passageData['translation'] ?? $code,
            'translation_name' => $translation ? $translation->name : ($passageData['translation_name'] ?? strtoupper($code)),
            'text'             => trim($passageData['text'] ?? ''),
            'verses'           => $formattedVerses,
        ];
    }

    /**
     * Parse speech transcript and extract Bible reference if detected.
     * Backward-compatible delegation to ReferenceParser.
     *
     * @param  string  $transcript
     * @return array
     */
    public function parseReferenceFromTranscript(string $transcript): array
    {
        return $this->referenceParser->parse($transcript);
    }

    /**
     * Detect references and analyze scripture content from Bible passage text.
     *
     * @param  string  $text
     * @param  string|null  $translationCode
     * @return array
     */
    public function detectFromPassageText(string $text, ?string $translationCode = null): array
    {
        $detection = $this->referenceParser->detectFromPassageText(
            $text,
            $translationCode,
            $this->provider
        );

        $parsedStructure = $this->referenceParser->parsePassageText($text, $detection['reference'] ?? null);
        $allReferences = $this->referenceParser->extractAll($text);

        return [
            'success'            => true,
            'detected'           => $detection['detected'],
            'match_type'         => $detection['match_type'] ?? null,
            'primary_reference'  => $detection['reference'] ?? ($allReferences[0]['reference'] ?? null),
            'confidence'         => $detection['confidence'] ?? (count($allReferences) ? 0.95 : 0.0),
            'clean_text'         => $parsedStructure['clean_text'],
            'verses'             => $parsedStructure['verses'],
            'all_references'     => $allReferences,
            'cross_references'   => $this->referenceParser->detectCrossReferences($text),
        ];
    }

    /**
     * The End-to-End Speech Recognition & Detection Workflow:
     * 1. Receive transcription.
     * 2. Detect a potential Bible reference or scripture quotation.
     * 3. Validate the reference.
     * 4. Retrieve the passage.
     * 5. Create a pending detection.
     * 6. Send it to the operator for review.
     *
     * @param  string  $transcript        Preacher or speaker transcript snippet.
     * @param  int|null  $serviceId       Optional church service ID.
     * @param  string|null  $translationCode Optional target Bible translation.
     * @param  User|null  $operator       Optional operator triggering detection.
     * @return array
     */
    public function processTranscription(
        string $transcript,
        ?int $serviceId = null,
        ?string $translationCode = null,
        ?User $operator = null
    ): array {
        // -------------------------------------------------------------
        // Step 1: Receive transcription
        // -------------------------------------------------------------
        $cleanTranscript = trim($transcript);
        if (empty($cleanTranscript)) {
            return [
                'success'  => false,
                'step'     => 1,
                'detected' => false,
                'message'  => 'Empty transcription received.',
                'data'     => null,
            ];
        }

        // -------------------------------------------------------------
        // Step 2: Detect a potential Bible reference or quoted passage text
        // -------------------------------------------------------------
        $detection = $this->referenceParser->parse($cleanTranscript);
        $cachedPassageText = null;
        $cachedVerses = null;

        // If no explicit citation found, attempt passage text detection
        if (!$detection['detected'] || empty($detection['reference'])) {
            $passageMatch = $this->referenceParser->detectFromPassageText(
                $cleanTranscript,
                $translationCode,
                $this->provider
            );

            if ($passageMatch['detected'] && !empty($passageMatch['reference'])) {
                $parsed = $this->referenceParser->parse($passageMatch['reference']);
                if ($parsed['detected']) {
                    $detection = $parsed;
                    $cachedPassageText = $passageMatch['passage_text'] ?? null;
                    $cachedVerses = $passageMatch['verses'] ?? null;
                }
            }
        }

        if (!$detection['detected'] || empty($detection['reference'])) {
            return [
                'success'  => true,
                'step'     => 2,
                'detected' => false,
                'message'  => 'No scripture reference detected in transcription.',
                'data'     => null,
            ];
        }

        // -------------------------------------------------------------
        // Step 3: Validate the reference
        // -------------------------------------------------------------
        $validation = $this->referenceParser->validate(
            $detection['book'],
            $detection['chapter'],
            $detection['verse_start'],
            $detection['verse_end']
        );

        if (!$validation['is_valid']) {
            return [
                'success'   => false,
                'step'      => 3,
                'detected'  => true,
                'valid'     => false,
                'message'   => $validation['reason'] ?? 'Invalid scripture reference bounds.',
                'reference' => $detection['reference'],
                'data'      => null,
            ];
        }

        $canonicalReference = $validation['canonical_reference'] ?? $detection['reference'];

        // -------------------------------------------------------------
        // Step 4: Retrieve the passage
        // -------------------------------------------------------------
        if ($cachedPassageText) {
            $passageData = [
                'reference'        => $canonicalReference,
                'translation'      => $translationCode ?: 'kjv',
                'translation_name' => strtoupper($translationCode ?: 'kjv'),
                'text'             => $cachedPassageText,
                'verses'           => $cachedVerses ?? [],
            ];
        } else {
            try {
                $passageData = $this->resolve($canonicalReference, $translationCode);
            } catch (\Throwable $e) {
                // Graceful fallback if external provider is unreachable or passage fails lookup
                $passageData = [
                    'reference'        => $canonicalReference,
                    'translation'      => $translationCode ?: 'kjv',
                    'translation_name' => strtoupper($translationCode ?: 'kjv'),
                    'text'             => '',
                    'verses'           => [],
                    'warning'          => 'Passage retrieval encountered an error: ' . $e->getMessage(),
                ];
            }
        }

        // -------------------------------------------------------------
        // Step 5: Create a pending detection
        // -------------------------------------------------------------
        // Associate with active service if not explicitly passed
        if (!$serviceId) {
            $activeService = Service::where('status', 'in_progress')->first()
                ?? Service::where('status', 'scheduled')->orderBy('service_date')->first();
            $serviceId = $activeService ? $activeService->id : null;
        }

        $pendingRecord = DetectedReference::create([
            'service_id'         => $serviceId,
            'transcript_snippet' => $detection['snippet'] ?? $cleanTranscript,
            'detected_reference' => $canonicalReference,
            'translation_code'   => $passageData['translation'] ?? ($translationCode ?: 'kjv'),
            'passage_text'       => $passageData['text'] ?? '',
            'verses_json'        => $passageData['verses'] ?? [],
            'confidence_score'   => $detection['confidence'] ?? 0.95,
            'status'             => 'pending',
            'created_at'         => now(),
        ]);

        // -------------------------------------------------------------
        // Step 6: Send it to the operator for review
        // -------------------------------------------------------------
        // Broadcast the real-time event so operator displays update instantly
        event(new ScriptureDetected($pendingRecord, $passageData));

        return [
            'success'  => true,
            'step'     => 6,
            'detected' => true,
            'valid'    => true,
            'message'  => "Scripture detected and queued for operator review: {$canonicalReference}",
            'data'     => [
                'detection_id'       => $pendingRecord->id,
                'reference'          => $canonicalReference,
                'book'               => $validation['book'],
                'chapter'            => $validation['chapter'],
                'verse_start'        => $validation['verse_start'],
                'verse_end'          => $validation['verse_end'],
                'translation'        => $pendingRecord->translation_code,
                'confidence'         => (float) $pendingRecord->confidence_score,
                'transcript_snippet' => $pendingRecord->transcript_snippet,
                'passage'            => $passageData,
                'status'             => $pendingRecord->status,
                'service_id'         => $serviceId,
                'created_at'         => $pendingRecord->created_at->toIso8601String(),
            ],
        ];
    }
}
