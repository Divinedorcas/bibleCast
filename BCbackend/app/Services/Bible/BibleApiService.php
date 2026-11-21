<?php

namespace App\Services\Bible;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * BibleApiService
 *
 * Concrete implementation of BibleProviderInterface backed by
 * https://bible-api.com — a free REST API for public-domain
 * Bible translations.
 *
 * Implements:
 * - Retrieving a passage (getPassage)
 * - Searching Bible text (search)
 * - Listing available translations (getTranslations)
 *
 * Content safety rule: This service NEVER stores or hard-codes verse
 * text verbatim in repository code. All text is fetched dynamically and
 * reviewed by an operator before projection.
 */
class BibleApiService implements BibleProviderInterface
{
    private const BASE_URL          = 'https://bible-api.com';
    private const CACHE_TTL_SECONDS = 3600;   // 1 hour per verse
    private const TIMEOUT_SECONDS   = 10;

    /**
     * Detailed translation metadata supported by bible-api.com.
     */
    private const TRANSLATIONS_META = [
        [
            'code'     => 'kjv',
            'name'     => 'King James Version',
            'language' => 'en',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'web',
            'name'     => 'World English Bible',
            'language' => 'en',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'bbe',
            'name'     => 'Bible in Basic English',
            'language' => 'en',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'oeb-cw',
            'name'     => 'Open English Bible (Commonwealth)',
            'language' => 'en',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'webbe',
            'name'     => 'World English Bible (British Edition)',
            'language' => 'en',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'clementine',
            'name'     => 'Clementine Latin Vulgate',
            'language' => 'la',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'almeida',
            'name'     => 'João Ferreira de Almeida',
            'language' => 'pt',
            'provider' => 'bible-api.com',
        ],
        [
            'code'     => 'rccv',
            'name'     => 'Romanian Corrected Cornilescu Version',
            'language' => 'ro',
            'provider' => 'bible-api.com',
        ],
    ];

    // ─── BibleProviderInterface ───────────────────────────────────────────

    /**
     * {@inheritdoc}
     *
     * Retrieve a passage by reference.
     */
    public function getPassage(string $reference, string $translation = 'kjv'): array
    {
        $reference   = trim($reference);
        $translation = strtolower(trim($translation));
        $cacheKey    = 'bible:' . md5($reference . ':' . $translation);

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($reference, $translation) {
            return $this->fetchFromApi($reference, $translation);
        });
    }

    /**
     * {@inheritdoc}
     *
     * Search Bible text.
     * Evaluates whether the query is a scripture reference or keyword phrase,
     * resolves matches, and returns a structured result set.
     */
    public function search(string $query, string $translation = 'kjv'): array
    {
        $query = trim($query);
        $translation = strtolower(trim($translation));

        if (empty($query)) {
            return [
                'query'   => $query,
                'total'   => 0,
                'results' => [],
            ];
        }

        // 1. Check if query is or contains a recognizable reference (e.g. "John 3:16", "Romans 8:28")
        $canonicalRef = $this->resolveReference($query);
        $searchRef = $canonicalRef ?: $query;

        try {
            $passage = $this->getPassage($searchRef, $translation);

            return [
                'query'   => $query,
                'total'   => 1,
                'results' => [
                    [
                        'reference'   => $passage['reference'],
                        'translation' => $passage['translation'],
                        'text'        => $passage['text'],
                        'verses'      => $passage['verses'] ?? [],
                    ],
                ],
            ];
        } catch (BibleProviderException $e) {
            // If reference wasn't found directly, return structured empty results instead of crashing
            if ($e->isNotFound()) {
                return [
                    'query'   => $query,
                    'total'   => 0,
                    'results' => [],
                ];
            }

            throw $e;
        }
    }

    /**
     * {@inheritdoc}
     *
     * List all available translations supported by this provider.
     */
    public function getTranslations(): array
    {
        return self::TRANSLATIONS_META;
    }

    /**
     * {@inheritdoc}
     *
     * Basic spoken-to-canonical resolver.
     * Handles ordinals ("first" -> "1"), spoken chapters/verses ("chapter 8 verse 28" -> "8:28").
     */
    public function resolveReference(string $spokenText): ?string
    {
        $text = trim($spokenText);

        // Normalize ordinals: "first" → "1", "second" → "2", "third" → "3"
        $ordinals = [
            '/\bfirst\b/i'  => '1',
            '/\bsecond\b/i' => '2',
            '/\bthird\b/i'  => '3',
        ];
        $text = preg_replace(array_keys($ordinals), array_values($ordinals), $text);

        // Normalize "chapter X verse Y" → "X:Y"
        $text = preg_replace('/chapter\s+(\d+)\s+verse\s+(\d+)/i', '$1:$2', $text);

        // Normalize "verse X" with existing context → ":X"
        $text = preg_replace('/\bverse\s+(\d+)/i', ':$1', $text);

        // Collapse extra whitespace
        $text = preg_replace('/\s+/', ' ', $text);

        return $text ?: null;
    }

    /**
     * {@inheritdoc}
     */
    public function getProviderName(): string
    {
        return 'bible-api.com';
    }

    /**
     * {@inheritdoc}
     */
    public function getSupportedTranslations(): array
    {
        return array_column(self::TRANSLATIONS_META, 'code');
    }

    // ─── Internal HTTP Fetcher ────────────────────────────────────────────

    /**
     * Make the HTTP call to bible-api.com.
     *
     * @throws BibleProviderException On network failure, bad reference, or upstream error
     */
    private function fetchFromApi(string $reference, string $translation): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['Accept' => 'application/json'])
                ->get(self::BASE_URL . '/' . rawurlencode($reference), [
                    'translation' => $translation,
                ]);
        } catch (ConnectionException $e) {
            Log::warning('BibleApiService: connection failed', [
                'reference'   => $reference,
                'translation' => $translation,
                'error'       => $e->getMessage(),
            ]);
            throw new BibleProviderException(
                'Could not reach the Bible API. Check server connectivity.',
                BibleProviderException::ERR_NETWORK,
                $e
            );
        }

        // 404 → reference not found
        if ($response->status() === 404) {
            throw new BibleProviderException(
                "Reference \"{$reference}\" was not found. Please check the book, chapter, and verse.",
                BibleProviderException::ERR_NOT_FOUND
            );
        }

        // Other non-200 responses
        if (!$response->successful()) {
            Log::error('BibleApiService: unexpected status', [
                'status'    => $response->status(),
                'reference' => $reference,
                'body'      => $response->body(),
            ]);
            throw new BibleProviderException(
                "Bible API returned HTTP {$response->status()}.",
                BibleProviderException::ERR_UPSTREAM
            );
        }

        $data = $response->json();

        // Guard: API must return at least one verse
        if (empty($data['verses'])) {
            throw new BibleProviderException(
                "No verses returned for \"{$reference}\" ({$translation}).",
                BibleProviderException::ERR_EMPTY
            );
        }

        return [
            'reference'        => $data['reference']        ?? $reference,
            'translation'      => $data['translation_id']   ?? $translation,
            'translation_name' => $data['translation_name'] ?? strtoupper($translation),
            'verses'           => $data['verses'],
            'text'             => $data['text']             ?? '',
        ];
    }
}
