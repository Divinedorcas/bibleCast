<?php

namespace Tests\Feature;

use App\Events\ProjectionUpdated;
use App\Events\ScriptureDetected;
use App\Models\DetectedReference;
use App\Models\Projection;
use App\Models\SavedPassage;
use App\Models\Service;
use App\Models\User;
use App\Services\Bible\PassageResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SpeechWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Service::create([
            'name'         => '1st Service',
            'service_key'  => '1st-service',
            'service_date' => now()->toDateString(),
            'start_time'   => '08:00',
            'end_time'     => '10:00',
            'status'       => 'in_progress',
        ]);
    }

    public function test_full_workflow_processes_transcription_and_notifies_operator(): void
    {
        Event::fake([ScriptureDetected::class]);
        Http::fake([
            'https://bible-api.com/*' => Http::response([
                'reference'        => 'Romans 8:28',
                'translation_id'   => 'kjv',
                'translation_name' => 'King James Version',
                'verses'           => [
                    [
                        'verse' => 28,
                        'text'  => 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
                    ],
                ],
                'text'             => 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/speech/process-transcript', [
            'transcript'  => 'Turn your bibles to Romans chapter 8 verse 28 where Paul writes',
            'translation' => 'kjv',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => true,
                'valid'    => true,
                'step'     => 6,
                'data'     => [
                    'reference'   => 'Romans 8:28',
                    'book'        => 'Romans',
                    'chapter'     => 8,
                    'verse_start' => 28,
                    'status'      => 'pending',
                ],
            ]);

        // Step 5: Verify pending detection record was created in database
        $this->assertDatabaseHas('detected_references', [
            'detected_reference' => 'Romans 8:28',
            'status'             => 'pending',
            'translation_code'   => 'kjv',
        ]);

        // Step 6: Verify ScriptureDetected event was dispatched to operator
        Event::assertDispatched(ScriptureDetected::class, function ($event) {
            return $event->detection->detected_reference === 'Romans 8:28'
                && $event->detection->status === 'pending';
        });
    }

    public function test_workflow_detects_and_rejects_invalid_scripture_bounds(): void
    {
        Event::fake([ScriptureDetected::class]);

        $response = $this->postJson('/api/v1/speech/process-transcript', [
            'transcript' => 'In the book of Romans chapter 99 verse 1',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success'  => false,
                'detected' => true,
                'valid'    => false,
                'step'     => 3,
            ]);

        // Should NOT create pending detection for out-of-bounds citation
        $this->assertDatabaseMissing('detected_references', [
            'detected_reference' => 'Romans 99:1',
        ]);

        Event::assertNotDispatched(ScriptureDetected::class);
    }

    public function test_workflow_returns_cleanly_when_no_scripture_in_speech(): void
    {
        Http::fake([
            'https://bolls.life/*' => Http::response([
                [
                    'pk'          => 999,
                    'translation' => 'KJV',
                    'book'        => 1,
                    'chapter'     => 43,
                    'verse'       => 16,
                    'text'        => 'And the brothers ate together in the morning.',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/speech/process-transcript', [
            'transcript' => 'Welcome brothers and sisters to our worship service this morning',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => false,
                'step'     => 2,
            ]);

        $this->assertEquals(0, DetectedReference::count());
    }

    public function test_operator_can_approve_detection_and_project_live(): void
    {
        Event::fake([ProjectionUpdated::class]);

        $operator = User::factory()->create([
            'role' => 'operator',
        ]);

        $detection = DetectedReference::create([
            'transcript_snippet' => 'Let us turn to John 3:16',
            'detected_reference' => 'John 3:16',
            'translation_code'   => 'kjv',
            'passage_text'       => 'For God so loved the world...',
            'verses_json'        => [['verse' => 16, 'text' => 'For God so loved the world...']],
            'confidence_score'   => 0.98,
            'status'             => 'pending',
        ]);

        $response = $this->actingAs($operator)
            ->postJson("/api/v1/speech/detections/{$detection->id}/review", [
                'action' => 'approve',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'detection' => [
                        'status'      => 'approved',
                        'reviewed_by' => $operator->id,
                    ],
                ],
            ]);

        // Verify detection status updated
        $this->assertDatabaseHas('detected_references', [
            'id'          => $detection->id,
            'status'      => 'approved',
            'reviewed_by' => $operator->id,
        ]);

        // Verify projection was created and live
        $this->assertDatabaseHas('projections', [
            'reference' => 'John 3:16',
            'status'    => 'projected',
            'mode'      => 'voice_detected',
        ]);

        // Verify ProjectionUpdated broadcast event was fired
        Event::assertDispatched(ProjectionUpdated::class, function ($event) {
            return $event->reference === 'John 3:16'
                && $event->status === 'projected';
        });
    }

    public function test_operator_can_reject_detection(): void
    {
        $operator = User::factory()->create();

        $detection = DetectedReference::create([
            'transcript_snippet' => 'Turn your bibles to Matthew 1:1',
            'detected_reference' => 'Matthew 1:1',
            'confidence_score'   => 0.90,
            'status'             => 'pending',
        ]);

        $response = $this->actingAs($operator)
            ->postJson("/api/v1/speech/detections/{$detection->id}/review", [
                'action' => 'reject',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'detection' => [
                        'status' => 'rejected',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('detected_references', [
            'id'     => $detection->id,
            'status' => 'rejected',
        ]);

        $this->assertEquals(0, Projection::count());
    }

    public function test_can_list_detections_with_status_filter(): void
    {
        DetectedReference::create([
            'transcript_snippet' => 'Romans 8:28 snippet',
            'detected_reference' => 'Romans 8:28',
            'status'             => 'pending',
        ]);

        DetectedReference::create([
            'transcript_snippet' => 'John 3:16 snippet',
            'detected_reference' => 'John 3:16',
            'status'             => 'approved',
        ]);

        $response = $this->getJson('/api/v1/speech/detections?status=pending');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.detected_reference', 'Romans 8:28');
    }

    public function test_workflow_detects_passage_from_spoken_scripture_text(): void
    {
        Event::fake([ScriptureDetected::class]);

        $user = User::factory()->create();
        SavedPassage::create([
            'user_id'          => $user->id,
            'reference'        => 'Romans 8:28',
            'translation_code' => 'kjv',
            'passage_text'     => 'And we know that all things work together for good to them that love God',
            'verses_json'      => [['verse' => 28, 'text' => 'And we know that all things work together for good to them that love God']],
        ]);

        $response = $this->postJson('/api/v1/speech/process-transcript', [
            'transcript' => 'Remember church, and we know that all things work together for good to them that love God',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => true,
                'data'     => [
                    'reference' => 'Romans 8:28',
                    'status'    => 'pending',
                ],
            ]);

        $this->assertDatabaseHas('detected_references', [
            'detected_reference' => 'Romans 8:28',
            'status'             => 'pending',
        ]);

        Event::assertDispatched(ScriptureDetected::class);
    }

    public function test_can_detect_passage_structure_via_speech_endpoint(): void
    {
        Http::fake([
            'https://bible-api.com/*' => Http::response([
                'reference'        => 'John 3:16',
                'translation_id'   => 'kjv',
                'translation_name' => 'King James Version',
                'verses'           => [['verse' => 16, 'text' => 'For God so loved the world, that he gave his only begotten Son...']],
                'text'             => 'For God so loved the world, that he gave his only begotten Son...',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/speech/detect-passage', [
            'text' => "John 3:16 (KJV)\n[16] For God so loved the world, that he gave his only begotten Son.",
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => true,
                'data'     => [
                    'primary_reference' => 'John 3:16',
                ],
            ]);
    }

    public function test_can_detect_passage_structure_via_bible_endpoint(): void
    {
        Http::fake([
            'https://bible-api.com/*' => Http::response([
                'reference'        => 'Genesis 1:1',
                'translation_id'   => 'kjv',
                'translation_name' => 'King James Version',
                'verses'           => [['verse' => 1, 'text' => 'In the beginning God created the heaven and the earth.']],
                'text'             => 'In the beginning God created the heaven and the earth.',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/bible/detect-from-text', [
            'text' => 'Genesis 1:1 In the beginning God created the heavens and the earth.',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => true,
                'data'     => [
                    'primary_reference' => 'Genesis 1:1',
                ],
            ]);
    }

    public function test_end_to_end_sermon_transcription_detects_and_fetches_romans_8_28(): void
    {
        Event::fake([ScriptureDetected::class]);

        $fullVerse = 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.';

        Http::fake([
            'https://bible-api.com/*' => Http::response([
                'reference'        => 'Romans 8:28',
                'translation_id'   => 'kjv',
                'translation_name' => 'King James Version',
                'verses'           => [
                    ['verse' => 28, 'text' => $fullVerse],
                ],
                'text'             => $fullVerse,
            ], 200),
        ]);

        $spokenChunk = 'And we know that all things work together for good to them that love God';

        $response = $this->postJson('/api/v1/speech/process-transcript', [
            'transcript'  => $spokenChunk,
            'translation' => 'kjv',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => true,
                'valid'    => true,
                'step'     => 6,
                'data'     => [
                    'reference'          => 'Romans 8:28',
                    'match_type'         => 'sermon_concordance',
                    'transcript_snippet' => $spokenChunk,
                    'status'             => 'pending',
                    'passage'            => [
                        'reference' => 'Romans 8:28',
                        'text'      => $fullVerse,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('detected_references', [
            'detected_reference' => 'Romans 8:28',
            'transcript_snippet' => $spokenChunk,
            'status'             => 'pending',
        ]);

        Event::assertDispatched(ScriptureDetected::class, function ($event) use ($fullVerse) {
            return $event->detection->detected_reference === 'Romans 8:28'
                && $event->detection->passage_text === $fullVerse;
        });
    }

    public function test_provider_full_text_search_detects_unlisted_scripture_quote(): void
    {
        $caesarVerse = "Render therefore unto Caesar the things which are Caesar's; and unto God the things that are God's.";

        Http::fake([
            'https://bolls.life/*' => Http::response([
                [
                    'pk'          => 24100,
                    'translation' => 'KJV',
                    'book'        => 40, // Matthew
                    'chapter'     => 22,
                    'verse'       => 21,
                    'text'        => 'Render<S>591</S> therefore unto Caesar <mark>the things which are Caesar\'s</mark>; and unto God the things that are God\'s.',
                ],
            ], 200),
            'https://bible-api.com/*' => Http::response([
                'reference'        => 'Matthew 22:21',
                'translation_id'   => 'kjv',
                'translation_name' => 'King James Version',
                'verses'           => [['verse' => 21, 'text' => $caesarVerse]],
                'text'             => $caesarVerse,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/bible/detect-from-text', [
            'text' => "Render therefore unto Caesar the things which are Caesar's",
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'detected' => true,
                'data'     => [
                    'primary_reference' => 'Matthew 22:21',
                    'match_type'        => 'provider_search',
                ],
            ]);
    }
}
