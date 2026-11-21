<?php

namespace Tests\Feature;

use App\Models\Translation;
use App\Services\Bible\BibleProviderInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BibleTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_active_translations(): void
    {
        Translation::create([
            'code' => 'kjv',
            'name' => 'King James Version',
            'provider' => 'bible-api.com',
            'is_active' => true,
            'is_default' => true,
        ]);

        Translation::create([
            'code' => 'web',
            'name' => 'World English Bible',
            'provider' => 'bible-api.com',
            'is_active' => true,
            'is_default' => false,
        ]);

        Translation::create([
            'code' => 'inactive',
            'name' => 'Inactive Version',
            'provider' => 'bible-api.com',
            'is_active' => false,
            'is_default' => false,
        ]);

        $response = $this->getJson('/api/v1/bible/translations');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Translations retrieved successfully.',
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_parse_reference_from_speech_transcript(): void
    {
        $response = $this->postJson('/api/v1/bible/parse-reference', [
            'transcript' => 'Please turn your bibles to John chapter 3 verse 16',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'detected' => true,
                    'reference' => 'John 3:16',
                    'book' => 'John',
                    'chapter' => 3,
                    'verse_start' => 16,
                ],
            ]);
    }

    public function test_parse_reference_returns_undetected_when_no_scripture(): void
    {
        $response = $this->postJson('/api/v1/bible/parse-reference', [
            'transcript' => 'Good morning church welcome to our service today',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'detected' => false,
                    'reference' => null,
                ],
            ]);
    }

    public function test_passage_requires_reference_query_parameter(): void
    {
        $response = $this->getJson('/api/v1/bible/passage');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reference']);
    }

    public function test_can_fetch_passage_via_api(): void
    {
        Translation::create([
            'code' => 'kjv',
            'name' => 'King James Version',
            'provider' => 'bible-api.com',
            'is_active' => true,
            'is_default' => true,
        ]);

        Http::fake([
            'https://bible-api.com/*' => Http::response([
                'reference' => 'John 3:16',
                'translation_id' => 'kjv',
                'translation_name' => 'King James Version',
                'verses' => [
                    [
                        'book_id' => 'JHN',
                        'book_name' => 'John',
                        'chapter' => 3,
                        'verse' => 16,
                        'text' => 'For God so loved the world...',
                    ],
                ],
                'text' => 'For God so loved the world...',
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/bible/passage?reference=John+3:16&translation=kjv');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'reference' => 'John 3:16',
                    'translation' => 'kjv',
                    'text' => 'For God so loved the world...',
                    'verses' => [
                        [
                            'verse' => 16,
                            'text' => 'For God so loved the world...',
                        ],
                    ],
                ],
            ]);
    }

    public function test_passage_returns_404_when_reference_not_found(): void
    {
        Translation::create([
            'code' => 'kjv',
            'name' => 'King James Version',
            'provider' => 'bible-api.com',
            'is_active' => true,
            'is_default' => true,
        ]);

        Http::fake([
            'https://bible-api.com/*' => Http::response(['error' => 'not found'], 404),
        ]);

        $response = $this->getJson('/api/v1/bible/passage?reference=FakeBook+99:99');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_can_search_bible_by_reference(): void
    {
        Http::fake([
            'https://bible-api.com/*' => Http::response([
                'reference' => 'Romans 8:28',
                'translation_id' => 'kjv',
                'translation_name' => 'King James Version',
                'verses' => [
                    [
                        'book_id' => 'ROM',
                        'book_name' => 'Romans',
                        'chapter' => 8,
                        'verse' => 28,
                        'text' => 'And we know that all things work together for good...',
                    ],
                ],
                'text' => 'And we know that all things work together for good...',
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/bible/search?query=Romans+8:28&translation=kjv');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total' => 1,
                    'results' => [
                        [
                            'reference' => 'Romans 8:28',
                            'translation' => 'kjv',
                        ],
                    ],
                ],
            ]);
    }

    public function test_provider_service_returns_available_translations(): void
    {
        $provider = app(BibleProviderInterface::class);
        $translations = $provider->getTranslations();

        $this->assertIsArray($translations);
        $this->assertNotEmpty($translations);
        $this->assertArrayHasKey('code', $translations[0]);
        $this->assertArrayHasKey('name', $translations[0]);
    }
}
