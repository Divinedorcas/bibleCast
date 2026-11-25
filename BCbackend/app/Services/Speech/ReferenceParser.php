<?php

namespace App\Services\Speech;

use App\Models\Projection;
use App\Models\ProjectionQueue;
use App\Models\SavedPassage;
use App\Services\Bible\BibleProviderInterface;

class ReferenceParser
{
    /**
     * Complete canon of 66 Bible books with maximum chapter counts.
     * Maps canonical name to total chapter count.
     */
    protected const CANON_BOOKS = [
        // Old Testament
        'Genesis'         => 50,
        'Exodus'          => 40,
        'Leviticus'       => 27,
        'Numbers'         => 36,
        'Deuteronomy'     => 34,
        'Joshua'          => 24,
        'Judges'          => 21,
        'Ruth'            => 4,
        '1 Samuel'        => 31,
        '2 Samuel'        => 24,
        '1 Kings'         => 22,
        '2 Kings'         => 25,
        '1 Chronicles'    => 29,
        '2 Chronicles'    => 36,
        'Ezra'            => 10,
        'Nehemiah'        => 13,
        'Esther'          => 10,
        'Job'             => 42,
        'Psalm'           => 150,
        'Proverbs'        => 31,
        'Ecclesiastes'    => 12,
        'Song of Solomon' => 8,
        'Isaiah'          => 66,
        'Jeremiah'        => 52,
        'Lamentations'    => 5,
        'Ezekiel'         => 48,
        'Daniel'          => 12,
        'Hosea'           => 14,
        'Joel'            => 3,
        'Amos'            => 9,
        'Obadiah'         => 1,
        'Jonah'           => 4,
        'Micah'           => 7,
        'Nahum'           => 3,
        'Habakkuk'        => 3,
        'Zephaniah'       => 3,
        'Haggai'          => 2,
        'Zechariah'       => 14,
        'Malachi'         => 4,

        // New Testament
        'Matthew'         => 28,
        'Mark'            => 16,
        'Luke'            => 24,
        'John'            => 21,
        'Acts'            => 28,
        'Romans'          => 16,
        '1 Corinthians'   => 16,
        '2 Corinthians'   => 13,
        'Galatians'       => 6,
        'Ephesians'       => 6,
        'Philippians'     => 4,
        'Colossians'      => 4,
        '1 Thessalonians' => 5,
        '2 Thessalonians' => 3,
        '1 Timothy'       => 6,
        '2 Timothy'       => 4,
        'Titus'           => 3,
        'Philemon'        => 1,
        'Hebrews'         => 13,
        'James'           => 5,
        '1 Peter'         => 5,
        '2 Peter'         => 3,
        '1 John'          => 5,
        '2 John'          => 1,
        '3 John'          => 1,
        'Jude'            => 1,
        'Revelation'      => 22,
    ];

    /**
     * Map of spoken names, abbreviations, and common speech variants to canonical names.
     */
    protected const BOOK_ALIASES = [
        'psalms'              => 'Psalm',
        'psalm'               => 'Psalm',
        'song of songs'       => 'Song of Solomon',
        'song of solomon'     => 'Song of Solomon',
        'canticles'           => 'Song of Solomon',
        'revelations'         => 'Revelation',
        'revelation'          => 'Revelation',
        'first samuel'        => '1 Samuel',
        '1st samuel'          => '1 Samuel',
        'second samuel'       => '2 Samuel',
        '2nd samuel'          => '2 Samuel',
        'first kings'         => '1 Kings',
        '1st kings'           => '1 Kings',
        'second kings'        => '2 Kings',
        '2nd kings'           => '2 Kings',
        'first chronicles'    => '1 Chronicles',
        '1st chronicles'      => '1 Chronicles',
        'second chronicles'   => '2 Chronicles',
        '2nd chronicles'      => '2 Chronicles',
        'first corinthians'   => '1 Corinthians',
        '1st corinthians'     => '1 Corinthians',
        'second corinthians'  => '2 Corinthians',
        '2nd corinthians'     => '2 Corinthians',
        'first thessalonians' => '1 Thessalonians',
        '1st thessalonians'   => '1 Thessalonians',
        'second thessalonians'=> '2 Thessalonians',
        '2nd thessalonians'   => '2 Thessalonians',
        'first timothy'       => '1 Timothy',
        '1st timothy'         => '1 Timothy',
        'second timothy'      => '2 Timothy',
        '2nd timothy'         => '2 Timothy',
        'first peter'         => '1 Peter',
        '1st peter'           => '1 Peter',
        'second peter'        => '2 Peter',
        '2nd peter'           => '2 Peter',
        'first john'          => '1 John',
        '1st john'            => '1 John',
        'second john'         => '2 John',
        '2nd john'            => '2 John',
        'third john'          => '3 John',
        '3rd john'            => '3 John',
    ];

    /**
     * Parse speech transcript or text and detect the primary Bible reference.
     *
     * @param  string  $transcript
     * @return array
     */
    public function parse(string $transcript): array
    {
        $cleaned = trim($transcript);
        if (empty($cleaned)) {
            return $this->emptyResult();
        }

        // Pre-normalize spoken numbers (e.g. "first" to "1", word numbers to digits)
        $normalized = $this->normalizeSpokenText($cleaned);

        // Try single-chapter books first (e.g., Jude, Obadiah, Philemon, 2 John, 3 John)
        $singleChapterResult = $this->matchSingleChapterBook($normalized, $cleaned);
        if ($singleChapterResult['detected']) {
            return $singleChapterResult;
        }

        // Try standard multi-chapter books
        $multiResult = $this->matchStandardScripture($normalized, $cleaned);
        if ($multiResult['detected']) {
            return $multiResult;
        }

        return $this->emptyResult();
    }

    /**
     * Extract ALL Bible references present in a block of text or passage.
     *
     * @param  string  $text
     * @return array<int, array>
     */
    public function extractAll(string $text): array
    {
        $cleaned = trim($text);
        if (empty($cleaned)) {
            return [];
        }

        $normalized = $this->normalizeSpokenText($cleaned);
        $results = [];
        $seen = [];

        $books = array_keys(self::CANON_BOOKS);
        usort($books, fn($a, $b) => strlen($b) - strlen($a));

        foreach ($books as $book) {
            $aliases = [$book];
            if ($book === 'Psalm') {
                $aliases[] = 'Psalms';
            } elseif ($book === 'Song of Solomon') {
                $aliases[] = 'Song of Songs';
            } elseif ($book === 'Revelation') {
                $aliases[] = 'Revelations';
            }

            $bookRegex = '(?:' . implode('|', array_map(fn($a) => preg_quote($a, '/'), $aliases)) . ')';

            // Pattern A: Colon syntax (e.g. John 3:16, Romans 8:28-30)
            $patternColon = '/\b(' . $bookRegex . ')\s*(?:chapter\s*)?(\d+)\s*:\s*(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';
            if (preg_match_all($patternColon, $normalized, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
                foreach ($matches as $m) {
                    $offset = $m[0][1];
                    $matchText = $m[0][0];
                    $canonical = $this->getCanonicalBookName($m[1][0]) ?? $book;
                    $chapter = (int) $m[2][0];
                    $verseStart = (int) $m[3][0];
                    $verseEnd = !empty($m[4][0]) ? (int) $m[4][0] : null;

                    $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                    if ($validation['is_valid']) {
                        $ref = $validation['canonical_reference'];
                        if (!isset($seen[$ref])) {
                            $seen[$ref] = true;
                            $results[] = [
                                'reference'   => $ref,
                                'book'        => $canonical,
                                'chapter'     => $chapter,
                                'verse_start' => $verseStart,
                                'verse_end'   => $verseEnd,
                                'confidence'  => 0.96,
                                'offset'      => $offset,
                                'snippet'     => $this->extractSnippet($cleaned, $matchText),
                            ];
                        }
                    }
                }
            }

            // Pattern B: Conversational keywords (e.g. John chapter 3 verse 16)
            $patternWords = '/\b(' . $bookRegex . ')\s+chapter\s+(\d+)\s*(?:verses?\s*|v\.?\s*)(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';
            if (preg_match_all($patternWords, $normalized, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
                foreach ($matches as $m) {
                    $offset = $m[0][1];
                    $matchText = $m[0][0];
                    $canonical = $this->getCanonicalBookName($m[1][0]) ?? $book;
                    $chapter = (int) $m[2][0];
                    $verseStart = (int) $m[3][0];
                    $verseEnd = !empty($m[4][0]) ? (int) $m[4][0] : null;

                    $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                    if ($validation['is_valid']) {
                        $ref = $validation['canonical_reference'];
                        if (!isset($seen[$ref])) {
                            $seen[$ref] = true;
                            $results[] = [
                                'reference'   => $ref,
                                'book'        => $canonical,
                                'chapter'     => $chapter,
                                'verse_start' => $verseStart,
                                'verse_end'   => $verseEnd,
                                'confidence'  => 0.98,
                                'offset'      => $offset,
                                'snippet'     => $this->extractSnippet($cleaned, $matchText),
                            ];
                        }
                    }
                }
            }
        }

        // Sort references by their order of appearance in the text
        usort($results, fn($a, $b) => $a['offset'] <=> $b['offset']);

        return array_map(function ($r) {
            unset($r['offset']);
            return $r;
        }, $results);
    }

    /**
     * Detect a Bible passage when given the text of a passage, transcript quote, or citation.
     *
     * Detection strategy:
     * 1. Direct scripture citation parsing (e.g. "Romans 8:28").
     * 2. Matching against previously stored/saved church passages in the database.
     * 3. External provider text search fallback (if provider instance is supplied).
     *
     * @param  string  $text
     * @param  string|null  $translation
     * @param  BibleProviderInterface|null  $provider
     * @return array
     */
    public function detectFromPassageText(
        string $text,
        ?string $translation = null,
        ?BibleProviderInterface $provider = null
    ): array {
        $cleanText = trim($text);
        if (empty($cleanText)) {
            return [
                'detected'   => false,
                'match_type' => null,
                'message'    => 'Empty passage text provided.',
            ];
        }

        // Strategy 1: Check for explicit Bible reference in the text
        $citation = $this->parse($cleanText);
        if ($citation['detected'] && ($citation['is_valid'] ?? true)) {
            return [
                'detected'         => true,
                'match_type'       => 'citation',
                'reference'        => $citation['reference'],
                'book'             => $citation['book'],
                'chapter'          => $citation['chapter'],
                'verse_start'      => $citation['verse_start'],
                'verse_end'        => $citation['verse_end'],
                'translation'      => $translation ?: 'kjv',
                'confidence'       => $citation['confidence'],
                'matched_snippet'  => $citation['snippet'],
                'passage_text'     => null,
            ];
        }

        // Strategy 2: Match against known passages in local database (saved passages, queues, projections)
        $dbMatch = $this->matchPassageToDatabase($cleanText);
        if ($dbMatch) {
            return [
                'detected'         => true,
                'match_type'       => 'database_passage',
                'reference'        => $dbMatch['reference'],
                'translation'      => $dbMatch['translation_code'],
                'passage_text'     => $dbMatch['passage_text'],
                'verses'           => $dbMatch['verses_json'] ?? [],
                'source'           => $dbMatch['source'],
                'confidence'       => $dbMatch['confidence'],
                'matched_snippet'  => $this->extractSnippet($cleanText, substr($cleanText, 0, 80)),
            ];
        }

        // Strategy 3: Query external Bible provider search if provider is supplied
        if ($provider) {
            try {
                $searchResult = $provider->search($cleanText, $translation ?: 'kjv');
                if (!empty($searchResult['results'])) {
                    $topResult = $searchResult['results'][0];
                    return [
                        'detected'         => true,
                        'match_type'       => 'provider_search',
                        'reference'        => $topResult['reference'],
                        'translation'      => $topResult['translation'] ?? ($translation ?: 'kjv'),
                        'passage_text'     => $topResult['text'],
                        'verses'           => $topResult['verses'] ?? [],
                        'confidence'       => 0.90,
                        'matched_snippet'  => $this->extractSnippet($cleanText, substr($cleanText, 0, 80)),
                    ];
                }
            } catch (\Throwable $e) {
                // Provider search failed gracefully
            }
        }

        return [
            'detected'   => false,
            'match_type' => null,
            'message'    => 'No Bible passage match found for the given text.',
        ];
    }

    /**
     * Match input text against known passage texts in local database records.
     *
     * @param  string  $input
     * @return array|null
     */
    public function matchPassageToDatabase(string $input): ?array
    {
        $normalizedInput = $this->sanitizeForMatching($input);
        if (strlen($normalizedInput) < 10) {
            return null;
        }

        $inputWords = array_filter(explode(' ', $normalizedInput), fn($w) => strlen($w) > 2);
        if (empty($inputWords)) {
            return null;
        }

        // 1. Search in Saved Passages
        try {
            $saved = SavedPassage::select('reference', 'translation_code', 'passage_text', 'verses_json')->get();
            foreach ($saved as $item) {
                if ($match = $this->evaluateTextSimilarity($normalizedInput, $inputWords, $item, 'saved_passage')) {
                    return $match;
                }
            }
        } catch (\Throwable $e) {}

        // 2. Search in Projection Queues
        try {
            $queued = ProjectionQueue::whereNotNull('passage_text')
                ->select('reference', 'translation_code', 'passage_text', 'verses_json')
                ->get();
            foreach ($queued as $item) {
                if ($match = $this->evaluateTextSimilarity($normalizedInput, $inputWords, $item, 'projection_queue')) {
                    return $match;
                }
            }
        } catch (\Throwable $e) {}

        // 3. Search in Recent Projections
        try {
            $projections = Projection::latest()->limit(50)
                ->select('reference', 'translation_code', 'passage_text', 'verses_json')
                ->get();
            foreach ($projections as $item) {
                if ($match = $this->evaluateTextSimilarity($normalizedInput, $inputWords, $item, 'projection_history')) {
                    return $match;
                }
            }
        } catch (\Throwable $e) {}

        return null;
    }

    /**
     * Parse raw Bible passage text into structured components (reference header, translation, verses).
     *
     * @param  string  $passageText
     * @param  string|null  $fallbackReference
     * @return array
     */
    public function parsePassageText(string $passageText, ?string $fallbackReference = null): array
    {
        $clean = trim($passageText);
        if (empty($clean)) {
            return [
                'reference'   => $fallbackReference,
                'translation' => null,
                'clean_text'  => '',
                'verses'      => [],
                'verse_count' => 0,
            ];
        }

        // Detect reference header if present on the first line
        $firstLine = strtok($clean, "\r\n");
        $detectedRef = null;
        $translation = null;

        if ($firstLine) {
            // Check for translation tag e.g. (KJV), (NIV), KJV
            if (preg_match('/\b(KJV|WEB|BBE|NIV|ESV|NKJV|NLT|NASB|ASV)\b/i', $firstLine, $tMatch)) {
                $translation = strtolower($tMatch[1]);
            }

            $refResult = $this->parse($firstLine);
            if ($refResult['detected'] && ($refResult['is_valid'] ?? true)) {
                $detectedRef = $refResult['reference'];
            }
        }

        $effectiveReference = $detectedRef ?: $fallbackReference;

        // Parse individual verse markers: e.g. [16] text, 16. text, 16 text
        $verses = [];
        $lines = preg_split('/(?=\[\d+\]|\b\d{1,3}[:\.]\s+|\n\d{1,3}\s+)/', $clean);

        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            if (empty($trimmedLine)) continue;

            // Pattern: [16] verse text OR 16. verse text
            if (preg_match('/^(?:\[?(\d{1,3})\]?[\.:\s]+)(.+)$/s', $trimmedLine, $vMatch)) {
                $vNum = (int) $vMatch[1];
                $vText = trim($this->cleanPassageText($vMatch[2]));
                if (!empty($vText)) {
                    $verses[] = [
                        'verse' => $vNum,
                        'text'  => $vText,
                    ];
                }
            }
        }

        // If no explicit verse markers detected, treat whole text as verse 1
        $cleanText = $this->cleanPassageText($clean);
        if (empty($verses)) {
            $verses[] = [
                'verse' => 1,
                'text'  => $cleanText,
            ];
        }

        return [
            'reference'   => $effectiveReference,
            'translation' => $translation,
            'clean_text'  => $cleanText,
            'verses'      => $verses,
            'verse_count' => count($verses),
        ];
    }

    /**
     * Clean passage text for stage projection (remove brackets, footnotes, verse numbers).
     *
     * @param  string  $text
     * @return string
     */
    public function cleanPassageText(string $text): string
    {
        $clean = $text;

        // Remove verse numbers like [16], (16), 16.
        $clean = preg_replace('/\[\d+\]/', '', $clean);
        $clean = preg_replace('/^\d{1,3}[\.:\s]+/m', '', $clean);

        // Remove bracketed footnotes e.g. [a], [1], {note}
        $clean = preg_replace('/\[[a-zA-Z]\]/', '', $clean);
        $clean = preg_replace('/\{[^}]+\}/', '', $clean);

        // Collapse whitespace
        $clean = preg_replace('/\s+/', ' ', $clean);

        return trim($clean);
    }

    /**
     * Detect cross-references mentioned within passage text.
     *
     * @param  string  $passageText
     * @return array
     */
    public function detectCrossReferences(string $passageText): array
    {
        return $this->extractAll($passageText);
    }

    /**
     * Validate an extracted reference against the canon rules.
     *
     * @param  string  $book
     * @param  int  $chapter
     * @param  int|null  $verseStart
     * @param  int|null  $verseEnd
     * @return array
     */
    public function validate(string $book, int $chapter, ?int $verseStart = null, ?int $verseEnd = null): array
    {
        $canonicalBook = $this->getCanonicalBookName($book);

        if (!$canonicalBook) {
            return [
                'is_valid'            => false,
                'reason'              => "Unknown Bible book: '{$book}'.",
                'canonical_reference' => null,
            ];
        }

        $maxChapters = self::CANON_BOOKS[$canonicalBook] ?? 1;

        if ($chapter < 1 || $chapter > $maxChapters) {
            return [
                'is_valid'            => false,
                'reason'              => "{$canonicalBook} has {$maxChapters} chapters. Chapter {$chapter} is out of bounds.",
                'canonical_reference' => null,
            ];
        }

        if ($verseStart !== null && $verseStart < 1) {
            return [
                'is_valid'            => false,
                'reason'              => "Verse number must be at least 1.",
                'canonical_reference' => null,
            ];
        }

        if ($verseEnd !== null) {
            if ($verseStart === null || $verseEnd < $verseStart) {
                return [
                    'is_valid'            => false,
                    'reason'              => "Ending verse ({$verseEnd}) cannot be less than starting verse ({$verseStart}).",
                    'canonical_reference' => null,
                ];
            }

            if (($verseEnd - $verseStart) > 176) {
                return [
                    'is_valid'            => false,
                    'reason'              => "Passage verse range exceeds maximum readable limit.",
                    'canonical_reference' => null,
                ];
            }
        }

        // Build canonical reference string
        $reference = $this->formatReferenceString($canonicalBook, $chapter, $verseStart, $verseEnd);

        return [
            'is_valid'            => true,
            'reason'              => null,
            'canonical_reference' => $reference,
            'book'                => $canonicalBook,
            'chapter'             => $chapter,
            'verse_start'         => $verseStart,
            'verse_end'           => $verseEnd,
        ];
    }

    /**
     * Format canonical reference string from components.
     */
    public function formatReferenceString(string $book, int $chapter, ?int $verseStart = null, ?int $verseEnd = null): string
    {
        if ($verseStart === null) {
            return "{$book} {$chapter}";
        }

        if ($verseEnd !== null && $verseEnd !== $verseStart) {
            return "{$book} {$chapter}:{$verseStart}-{$verseEnd}";
        }

        return "{$book} {$chapter}:{$verseStart}";
    }

    /**
     * Get canonical name of a Bible book from any alias or raw input.
     */
    public function getCanonicalBookName(string $book): ?string
    {
        $trimmed = trim($book);
        $lower = strtolower($trimmed);

        // Check exact match in canon
        foreach (self::CANON_BOOKS as $canonName => $chapters) {
            if (strtolower($canonName) === $lower) {
                return $canonName;
            }
        }

        // Check alias map
        if (isset(self::BOOK_ALIASES[$lower])) {
            return self::BOOK_ALIASES[$lower];
        }

        return null;
    }

    /**
     * Check if a book is a single-chapter book.
     */
    public function isSingleChapterBook(string $book): bool
    {
        $canonical = $this->getCanonicalBookName($book);
        return $canonical && (self::CANON_BOOKS[$canonical] ?? 0) === 1;
    }

    /**
     * Get maximum chapters for a canonical book.
     */
    public function getMaxChapters(string $book): int
    {
        $canonical = $this->getCanonicalBookName($book);
        return $canonical ? (self::CANON_BOOKS[$canonical] ?? 1) : 0;
    }

    /**
     * Normalize colloquial speech numbers and phrasing.
     */
    protected function normalizeSpokenText(string $text): string
    {
        $normalized = $text;

        // Normalize spoken ordinals for book names
        $normalized = preg_replace('/\bfirst\b/i', '1', $normalized);
        $normalized = preg_replace('/\bsecond\b/i', '2', $normalized);
        $normalized = preg_replace('/\bthird\b/i', '3', $normalized);
        $normalized = preg_replace('/\b1st\b/i', '1', $normalized);
        $normalized = preg_replace('/\b2nd\b/i', '2', $normalized);
        $normalized = preg_replace('/\b3rd\b/i', '3', $normalized);

        // Convert common compound number words in chapter/verse contexts
        $wordNumbers = [
            'twenty-eight' => '28', 'twenty eight' => '28',
            'twenty-four'  => '24', 'twenty four'  => '24',
            'twenty-three' => '23', 'twenty three' => '23',
            'twenty-one'   => '21', 'twenty one'   => '21',
            'twenty'       => '20',
            'thirteen'     => '13',
            'fourteen'     => '14',
            'fifteen'      => '15',
            'sixteen'      => '16',
            'seventeen'    => '17',
            'eighteen'     => '18',
            'nineteen'     => '19',
            'ten'          => '10',
            'eleven'       => '11',
            'twelve'       => '12',
            'one'          => '1',
            'two'          => '2',
            'three'        => '3',
            'four'         => '4',
            'five'         => '5',
            'six'          => '6',
            'seven'        => '7',
            'eight'        => '8',
            'nine'         => '9',
        ];

        // Replace number words that follow 'chapter', 'verse', 'verses', or book names
        foreach ($wordNumbers as $word => $digit) {
            $normalized = preg_replace('/(?<=\bchapter\s|\bverse\s|\bverses\s|\bto\s|\bthrough\s|\b-\s)' . preg_quote($word, '/') . '\b/i', $digit, $normalized);
        }

        return $normalized;
    }

    /**
     * Match single chapter books (Jude, Philemon, Obadiah, 2 John, 3 John).
     */
    protected function matchSingleChapterBook(string $text, string $original): array
    {
        $singleChapterBooks = ['Jude', 'Philemon', 'Obadiah', '2 John', '3 John'];

        foreach ($singleChapterBooks as $bookName) {
            $escaped = preg_quote($bookName, '/');
            // Matches e.g. "Jude verse 24", "Jude 24", "Jude 1:24", "Jude verses 20 to 25"
            $pattern = '/\b(' . $escaped . ')\s*(?:chapter\s*1\s*[:\s]*)?(?:verses?\s*|v\.?\s*)?(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';

            if (preg_match($pattern, $text, $matches)) {
                $canonical = $bookName;
                $chapter = 1;
                $verseStart = (int) $matches[2];
                $verseEnd = !empty($matches[3]) ? (int) $matches[3] : null;

                $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                $refString = $validation['is_valid']
                    ? $validation['canonical_reference']
                    : $this->formatReferenceString($canonical, $chapter, $verseStart, $verseEnd);

                return [
                    'detected'    => true,
                    'reference'   => $refString,
                    'book'        => $canonical,
                    'chapter'     => $chapter,
                    'verse_start' => $verseStart,
                    'verse_end'   => $verseEnd,
                    'is_valid'    => $validation['is_valid'],
                    'confidence'  => 0.96,
                    'snippet'     => $this->extractSnippet($original, $matches[0]),
                ];
            }
        }

        return ['detected' => false];
    }

    /**
     * Match standard multi-chapter scripture references.
     */
    protected function matchStandardScripture(string $text, string $original): array
    {
        $books = array_keys(self::CANON_BOOKS);

        // Sort book names by length descending to match "1 Thessalonians" before "1 The..."
        usort($books, fn($a, $b) => strlen($b) - strlen($a));

        foreach ($books as $book) {
            $aliases = [$book];
            if ($book === 'Psalm') {
                $aliases[] = 'Psalms';
            } elseif ($book === 'Song of Solomon') {
                $aliases[] = 'Song of Songs';
            } elseif ($book === 'Revelation') {
                $aliases[] = 'Revelations';
            }

            $bookRegex = '(?:' . implode('|', array_map(fn($a) => preg_quote($a, '/'), $aliases)) . ')';

            // Pattern 1: Explicit "chapter X verse Y [to Z]" or "chapter X : Y"
            // e.g. "John chapter 3 verse 16", "Romans chapter 8 verse 28 to 30", "1 Corinthians chapter 13 verses 4 to 8"
            $pattern1 = '/\b(' . $bookRegex . ')\s+chapter\s+(\d+)\s*(?:verses?\s*|v\.?\s*|:\s*)(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';
            if (preg_match($pattern1, $text, $matches)) {
                $canonical = $this->getCanonicalBookName($matches[1]) ?? $book;
                $chapter = (int) $matches[2];
                $verseStart = (int) $matches[3];
                $verseEnd = !empty($matches[4]) ? (int) $matches[4] : null;

                $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                $refString = $validation['is_valid']
                    ? $validation['canonical_reference']
                    : $this->formatReferenceString($canonical, $chapter, $verseStart, $verseEnd);

                return [
                    'detected'    => true,
                    'reference'   => $refString,
                    'book'        => $canonical,
                    'chapter'     => $chapter,
                    'verse_start' => $verseStart,
                    'verse_end'   => $verseEnd,
                    'is_valid'    => $validation['is_valid'],
                    'confidence'  => 0.98,
                    'snippet'     => $this->extractSnippet($original, $matches[0]),
                ];
            }

            // Pattern 2: Standard colon syntax: "Romans 8:28" or "Romans 8:28-30" or "Romans chapter 8:28"
            $pattern2 = '/\b(' . $bookRegex . ')\s*(?:chapter\s*)?(\d+)\s*:\s*(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';
            if (preg_match($pattern2, $text, $matches)) {
                $canonical = $this->getCanonicalBookName($matches[1]) ?? $book;
                $chapter = (int) $matches[2];
                $verseStart = (int) $matches[3];
                $verseEnd = !empty($matches[4]) ? (int) $matches[4] : null;

                $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                $refString = $validation['is_valid']
                    ? $validation['canonical_reference']
                    : $this->formatReferenceString($canonical, $chapter, $verseStart, $verseEnd);

                return [
                    'detected'    => true,
                    'reference'   => $refString,
                    'book'        => $canonical,
                    'chapter'     => $chapter,
                    'verse_start' => $verseStart,
                    'verse_end'   => $verseEnd,
                    'is_valid'    => $validation['is_valid'],
                    'confidence'  => 0.95,
                    'snippet'     => $this->extractSnippet($original, $matches[0]),
                ];
            }

            // Pattern 3: Explicit "verse" keyword without "chapter", e.g. "Romans 8 verse 28", "John 3 verses 16 to 18"
            $pattern3 = '/\b(' . $bookRegex . ')\s+(\d+)\s+(?:verses?\s*|v\.?\s*)(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';
            if (preg_match($pattern3, $text, $matches)) {
                $canonical = $this->getCanonicalBookName($matches[1]) ?? $book;
                $chapter = (int) $matches[2];
                $verseStart = (int) $matches[3];
                $verseEnd = !empty($matches[4]) ? (int) $matches[4] : null;

                $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                $refString = $validation['is_valid']
                    ? $validation['canonical_reference']
                    : $this->formatReferenceString($canonical, $chapter, $verseStart, $verseEnd);

                return [
                    'detected'    => true,
                    'reference'   => $refString,
                    'book'        => $canonical,
                    'chapter'     => $chapter,
                    'verse_start' => $verseStart,
                    'verse_end'   => $verseEnd,
                    'is_valid'    => $validation['is_valid'],
                    'confidence'  => 0.94,
                    'snippet'     => $this->extractSnippet($original, $matches[0]),
                ];
            }

            // Pattern 4: Space-separated numbers with required whitespace: "Romans 8 28"
            $pattern4 = '/\b(' . $bookRegex . ')\s+(\d+)\s+(\d+)(?:\s*(?:to|through|-)\s*(\d+))?/i';
            if (preg_match($pattern4, $text, $matches)) {
                $canonical = $this->getCanonicalBookName($matches[1]) ?? $book;
                $chapter = (int) $matches[2];
                $verseStart = (int) $matches[3];
                $verseEnd = !empty($matches[4]) ? (int) $matches[4] : null;

                $validation = $this->validate($canonical, $chapter, $verseStart, $verseEnd);
                if ($validation['is_valid']) {
                    return [
                        'detected'    => true,
                        'reference'   => $validation['canonical_reference'],
                        'book'        => $canonical,
                        'chapter'     => $chapter,
                        'verse_start' => $verseStart,
                        'verse_end'   => $verseEnd,
                        'is_valid'    => true,
                        'confidence'  => 0.90,
                        'snippet'     => $this->extractSnippet($original, $matches[0]),
                    ];
                }
            }

            // Pattern 5: Whole chapter mention (e.g. "Psalm chapter 23", "John chapter 14", "Psalm 23")
            $chapterPattern = '/\b(' . $bookRegex . ')\s+(?:chapter\s+)?(\d+)\b/i';
            if (preg_match($chapterPattern, $text, $matches)) {
                $canonical = $this->getCanonicalBookName($matches[1]) ?? $book;
                $chapter = (int) $matches[2];

                $validation = $this->validate($canonical, $chapter, null, null);
                if ($validation['is_valid']) {
                    return [
                        'detected'    => true,
                        'reference'   => "{$canonical} {$chapter}",
                        'book'        => $canonical,
                        'chapter'     => $chapter,
                        'verse_start' => 1,
                        'verse_end'   => null,
                        'is_valid'    => true,
                        'confidence'  => 0.88,
                        'snippet'     => $this->extractSnippet($original, $matches[0]),
                    ];
                }
            }
        }

        return ['detected' => false];
    }

    /**
     * Evaluate text similarity between an input snippet and a passage database record.
     */
    protected function evaluateTextSimilarity(string $normalizedInput, array $inputWords, object $item, string $source): ?array
    {
        if (empty($item->passage_text)) {
            return null;
        }

        $normalizedPassage = $this->sanitizeForMatching($item->passage_text);
        if (empty($normalizedPassage)) {
            return null;
        }

        // Exact substring match
        if (str_contains($normalizedPassage, $normalizedInput) || str_contains($normalizedInput, $normalizedPassage)) {
            return [
                'reference'        => $item->reference,
                'translation_code' => $item->translation_code ?? 'kjv',
                'passage_text'     => $item->passage_text,
                'verses_json'      => $item->verses_json ?? [],
                'source'           => $source,
                'confidence'       => 0.96,
            ];
        }

        // Token overlap match
        $matchesCount = 0;
        foreach ($inputWords as $word) {
            if (str_contains($normalizedPassage, $word)) {
                $matchesCount++;
            }
        }

        $overlapRatio = $matchesCount / count($inputWords);
        if ($overlapRatio >= 0.70 && count($inputWords) >= 4) {
            return [
                'reference'        => $item->reference,
                'translation_code' => $item->translation_code ?? 'kjv',
                'passage_text'     => $item->passage_text,
                'verses_json'      => $item->verses_json ?? [],
                'source'           => $source,
                'confidence'       => round(0.75 + ($overlapRatio * 0.20), 2),
            ];
        }

        return null;
    }

    /**
     * Sanitize text string for fuzzy comparison.
     */
    protected function sanitizeForMatching(string $text): string
    {
        $clean = strtolower($text);
        $clean = preg_replace('/[^\w\s]/', '', $clean);
        $clean = preg_replace('/\s+/', ' ', $clean);
        return trim($clean);
    }

    /**
     * Extract a readable context snippet around the matched citation.
     */
    protected function extractSnippet(string $fullText, string $match): string
    {
        $pos = stripos($fullText, $match);
        if ($pos === false) {
            return trim($fullText);
        }

        $start = max(0, $pos - 40);
        $length = strlen($match) + 80;
        $snippet = substr($fullText, $start, $length);

        if ($start > 0) {
            $snippet = '...' . ltrim($snippet);
        }
        if (($start + $length) < strlen($fullText)) {
            $snippet = rtrim($snippet) . '...';
        }

        return trim($snippet);
    }

    /**
     * Empty detection result structure.
     */
    protected function emptyResult(): array
    {
        return [
            'detected'    => false,
            'reference'   => null,
            'book'        => null,
            'chapter'     => null,
            'verse_start' => null,
            'verse_end'   => null,
            'confidence'  => 0.0,
            'snippet'     => null,
        ];
    }
}
