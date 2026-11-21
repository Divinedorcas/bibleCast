<?php

namespace App\Services\Bible;

/**
 * BibleProviderInterface
 *
 * Contract that every Bible data provider must satisfy.
 * Defines methods for:
 * - Retrieving a passage
 * - Searching Bible text
 * - Listing available translations
 */
interface BibleProviderInterface
{
    /**
     * Retrieve a single verse or scripture passage by reference.
     *
     * @param  string  $reference    Human-readable reference, e.g. "John 3:16" or "Romans 8:28-30"
     * @param  string  $translation  Provider-specific translation code, e.g. "kjv", "web"
     *
     * @return array{
     *   reference:   string,
     *   translation: string,
     *   verses: array<int, array{book_id?: string, book_name?: string, chapter?: int, verse: int, text: string}>,
     *   text:        string,
     * }
     *
     * @throws \App\Services\Bible\BibleProviderException
     */
    public function getPassage(string $reference, string $translation = 'kjv'): array;

    /**
     * Search Bible text or query scriptures.
     *
     * @param  string  $query        Search query (reference string or scripture search keywords)
     * @param  string  $translation  Translation code to search within
     *
     * @return array{
     *   query:   string,
     *   total:   int,
     *   results: array<int, array{reference: string, translation: string, text: string, verses?: array}>
     * }
     *
     * @throws \App\Services\Bible\BibleProviderException
     */
    public function search(string $query, string $translation = 'kjv'): array;

    /**
     * List all available translations supported by this provider.
     *
     * @return array<int, array{code: string, name: string, language?: string, provider?: string}>
     */
    public function getTranslations(): array;

    /**
     * Resolve a plain-text spoken reference to a canonical Bible reference string.
     *
     * @param  string  $spokenText  e.g. "first corinthians thirteen four"
     * @return string|null          e.g. "1 Corinthians 13:4", or null if unresolvable
     */
    public function resolveReference(string $spokenText): ?string;

    /**
     * Return the provider's identifier string.
     *
     * @return string  e.g. "bible-api.com"
     */
    public function getProviderName(): string;

    /**
     * List translation codes supported by this provider.
     *
     * @return string[]  e.g. ["kjv", "web", "bbe"]
     */
    public function getSupportedTranslations(): array;
}
