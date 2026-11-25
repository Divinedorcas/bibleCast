<?php

namespace Tests\Unit;

use App\Services\Speech\ReferenceParser;
use PHPUnit\Framework\TestCase;

class ReferenceParserTest extends TestCase
{
    protected ReferenceParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new ReferenceParser();
    }

    public function test_parses_standard_scripture_reference(): void
    {
        $result = $this->parser->parse('Let us read from Romans 8:28 today');

        $this->assertTrue($result['detected']);
        $this->assertEquals('Romans 8:28', $result['reference']);
        $this->assertEquals('Romans', $result['book']);
        $this->assertEquals(8, $result['chapter']);
        $this->assertEquals(28, $result['verse_start']);
        $this->assertNull($result['verse_end']);
        $this->assertGreaterThanOrEqual(0.90, $result['confidence']);
    }

    public function test_parses_conversational_phrase_with_words(): void
    {
        $result = $this->parser->parse('Open your Bible to John chapter 3 verse 16');

        $this->assertTrue($result['detected']);
        $this->assertEquals('John 3:16', $result['reference']);
        $this->assertEquals('John', $result['book']);
        $this->assertEquals(3, $result['chapter']);
        $this->assertEquals(16, $result['verse_start']);
    }

    public function test_parses_spoken_ordinals_and_ranges(): void
    {
        $result = $this->parser->parse('Turn to first Corinthians chapter 13 verses 4 to 8');

        $this->assertTrue($result['detected']);
        $this->assertEquals('1 Corinthians 13:4-8', $result['reference']);
        $this->assertEquals('1 Corinthians', $result['book']);
        $this->assertEquals(13, $result['chapter']);
        $this->assertEquals(4, $result['verse_start']);
        $this->assertEquals(8, $result['verse_end']);
    }

    public function test_parses_single_chapter_book_like_jude(): void
    {
        $result = $this->parser->parse('As Jude verse 24 declares, now unto him that is able to keep you');

        $this->assertTrue($result['detected']);
        $this->assertEquals('Jude 1:24', $result['reference']);
        $this->assertEquals('Jude', $result['book']);
        $this->assertEquals(1, $result['chapter']);
        $this->assertEquals(24, $result['verse_start']);
    }

    public function test_parses_book_aliases(): void
    {
        // "Psalms" normalized to canonical "Psalm"
        $psalm = $this->parser->parse('Read Psalms chapter 23 verse 1');
        $this->assertTrue($psalm['detected']);
        $this->assertEquals('Psalm 23:1', $psalm['reference']);

        // "Revelations" normalized to "Revelation"
        $rev = $this->parser->parse('In Revelations chapter 21 verse 4');
        $this->assertTrue($rev['detected']);
        $this->assertEquals('Revelation 21:4', $rev['reference']);
    }

    public function test_validates_valid_and_out_of_bounds_chapters(): void
    {
        // Valid
        $valid = $this->parser->validate('Romans', 8, 28);
        $this->assertTrue($valid['is_valid']);
        $this->assertEquals('Romans 8:28', $valid['canonical_reference']);

        // Invalid: Romans only has 16 chapters
        $invalidChapter = $this->parser->validate('Romans', 25, 1);
        $this->assertFalse($invalidChapter['is_valid']);
        $this->assertStringContainsString('out of bounds', $invalidChapter['reason']);

        // Invalid: Obadiah only has 1 chapter
        $invalidObadiah = $this->parser->validate('Obadiah', 2, 1);
        $this->assertFalse($invalidObadiah['is_valid']);

        // Invalid: end verse before start verse
        $invalidRange = $this->parser->validate('Genesis', 1, 10, 5);
        $this->assertFalse($invalidRange['is_valid']);
    }

    public function test_returns_undetected_for_ordinary_speech(): void
    {
        $result = $this->parser->parse('Good morning everyone, welcome to the Sunday service');

        $this->assertFalse($result['detected']);
        $this->assertNull($result['reference']);
    }

    public function test_extracts_all_references_from_passage_text(): void
    {
        $text = 'In the beginning was God (Genesis 1:1) and the Word was with God (John 1:14). Also read Romans 8:28 today.';
        $references = $this->parser->extractAll($text);

        $this->assertCount(3, $references);
        $this->assertEquals('Genesis 1:1', $references[0]['reference']);
        $this->assertEquals('John 1:14', $references[1]['reference']);
        $this->assertEquals('Romans 8:28', $references[2]['reference']);
    }

    public function test_parses_passage_text_into_verses_and_clean_text(): void
    {
        $passageText = "Romans 8:28 (KJV)\n[28] And we know that all things work together for good to them that love God.";
        $parsed = $this->parser->parsePassageText($passageText);

        $this->assertEquals('Romans 8:28', $parsed['reference']);
        $this->assertEquals('kjv', $parsed['translation']);
        $this->assertNotEmpty($parsed['clean_text']);
        $this->assertStringNotContainsString('[28]', $parsed['clean_text']);
        $this->assertCount(1, $parsed['verses']);
        $this->assertEquals(28, $parsed['verses'][0]['verse']);
    }

    public function test_cleans_passage_text_removes_brackets_and_footnotes(): void
    {
        $raw = '[16] For God so loved the world [a], that he gave his only begotten Son {note}.';
        $cleaned = $this->parser->cleanPassageText($raw);

        $this->assertStringNotContainsString('[16]', $cleaned);
        $this->assertStringNotContainsString('[a]', $cleaned);
        $this->assertStringNotContainsString('{note}', $cleaned);
        $this->assertStringContainsString('For God so loved the world', $cleaned);
    }

    public function test_detects_cross_references_in_passage_text(): void
    {
        $text = 'This fulfilled the prophecy of Isaiah 53:5 and also Psalm 22:1.';
        $crossRefs = $this->parser->detectCrossReferences($text);

        $this->assertCount(2, $crossRefs);
        $this->assertEquals('Isaiah 53:5', $crossRefs[0]['reference']);
        $this->assertEquals('Psalm 22:1', $crossRefs[1]['reference']);
    }
}
