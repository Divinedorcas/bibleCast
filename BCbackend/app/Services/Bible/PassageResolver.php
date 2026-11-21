<?php

namespace App\Services\Bible;

use App\Models\Translation;
use Illuminate\Support\Str;

class PassageResolver
{
    protected BibleProviderInterface $provider;

    public function __construct(BibleProviderInterface $provider)
    {
        $this->provider = $provider;
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
     *
     * @param  string  $transcript
     * @return array
     */
    public function parseReferenceFromTranscript(string $transcript): array
    {
        $detected = false;
        $matchedReference = null;
        $book = null;
        $chapter = null;
        $verseStart = null;
        $verseEnd = null;
        $confidence = 0.0;

        $booksList = [
            'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
            'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
            '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
            'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm', 'Proverbs',
            'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
            'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
            'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
            'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew',
            'Mark', 'Luke', 'John', 'Acts', 'Romans',
            '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
            'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
            'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
            '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
        ];

        $cleaned = trim($transcript);
        // Replace words like 'first', 'second', 'third' before book names
        $cleaned = preg_replace('/\bfirst\b/i', '1', $cleaned);
        $cleaned = preg_replace('/\bsecond\b/i', '2', $cleaned);
        $cleaned = preg_replace('/\bthird\b/i', '3', $cleaned);

        // Pattern 1: Book [Chapter:Verse] or Book Chapter Verse or Book Chapter Verse-Verse
        // e.g. "John 3:16", "Romans 8:28", "Romans chapter 8 verse 28", "John 3 verse 16"
        foreach ($booksList as $b) {
            $escapedBook = preg_quote($b, '/');
            // Regex matching book name followed by chapter/verse indicators
            $pattern = '/\b(' . $escapedBook . ')\s*(?:chapter\s*)?(\d+)[:\s]*(?:verse\s*)?(\d+)(?:\s*(?:to|-)\s*(\d+))?/i';

            if (preg_match($pattern, $cleaned, $matches)) {
                $detected = true;
                $book = $b === 'Psalms' ? 'Psalm' : $b;
                $chapter = (int) $matches[2];
                $verseStart = (int) $matches[3];
                $verseEnd = !empty($matches[4]) ? (int) $matches[4] : null;

                $matchedReference = $verseEnd
                    ? "{$book} {$chapter}:{$verseStart}-{$verseEnd}"
                    : "{$book} {$chapter}:{$verseStart}";

                $confidence = 0.95;
                break;
            }
        }

        return [
            'detected'    => $detected,
            'reference'   => $matchedReference,
            'book'        => $book,
            'chapter'     => $chapter,
            'verse_start' => $verseStart,
            'verse_end'   => $verseEnd,
            'confidence'  => $confidence,
        ];
    }
}
