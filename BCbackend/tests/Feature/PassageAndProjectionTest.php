<?php

namespace Tests\Feature;

use App\Events\ProjectionUpdated;
use App\Models\Projection;
use App\Models\SavedPassage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PassageAndProjectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_save_passage_as_favourite(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/saved-passages', [
            'reference'        => 'John 3:16',
            'translation_code' => 'kjv',
            'label'            => 'Key Gospel Verse',
            'passage_text'     => 'For God so loved the world...',
            'verses_json'      => [
                ['verse' => 16, 'text' => 'For God so loved the world...'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Passage saved to favourites successfully.',
                'data'    => [
                    'reference'        => 'John 3:16',
                    'translation_code' => 'kjv',
                    'label'            => 'Key Gospel Verse',
                ],
            ]);

        $this->assertDatabaseHas('saved_passages', [
            'reference' => 'John 3:16',
            'label'     => 'Key Gospel Verse',
        ]);
    }

    public function test_can_view_saved_passages(): void
    {
        SavedPassage::create([
            'reference'        => 'Psalm 23:1',
            'translation_code' => 'kjv',
            'label'            => 'Comfort',
            'passage_text'     => 'The Lord is my shepherd...',
        ]);

        $response = $this->getJson('/api/v1/saved-passages');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Saved passages retrieved successfully.',
            ])
            ->assertJsonCount(1, 'data');
    }

    public function test_can_remove_favourite_passage(): void
    {
        $saved = SavedPassage::create([
            'reference'        => 'Romans 8:28',
            'translation_code' => 'kjv',
            'passage_text'     => 'And we know that all things work together...',
        ]);

        $response = $this->deleteJson("/api/v1/saved-passages/{$saved->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Passage removed from favourites successfully.',
            ]);

        $this->assertDatabaseMissing('saved_passages', [
            'id' => $saved->id,
        ]);
    }

    public function test_can_project_scripture_and_record_to_history(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/projections', [
            'reference'        => 'Genesis 1:1',
            'translation_code' => 'kjv',
            'passage_text'     => 'In the beginning God created the heaven and the earth.',
            'mode'             => 'manual',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'reference'        => 'Genesis 1:1',
                    'status'           => 'projected',
                    'mode'             => 'manual',
                ],
            ]);

        $this->assertDatabaseHas('projections', [
            'reference' => 'Genesis 1:1',
            'status'    => 'projected',
        ]);
    }

    public function test_can_view_projection_history(): void
    {
        Projection::create([
            'reference'        => 'Isaiah 40:31',
            'translation_code' => 'kjv',
            'passage_text'     => 'But they that wait upon the Lord shall renew their strength...',
            'status'           => 'cleared',
            'projected_at'     => now()->subMinutes(10),
        ]);

        Projection::create([
            'reference'        => 'Philippians 4:13',
            'translation_code' => 'kjv',
            'passage_text'     => 'I can do all things through Christ which strengtheneth me.',
            'status'           => 'projected',
            'projected_at'     => now(),
        ]);

        $response = $this->getJson('/api/v1/projections/history');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Projection history retrieved successfully.',
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_projection_updated_event_broadcasts_on_authorized_channel_when_projected(): void
    {
        Event::fake([ProjectionUpdated::class]);

        $user = User::factory()->create(['name' => 'Operator Dorcas']);

        $response = $this->actingAs($user)->postJson('/api/v1/projections', [
            'reference'        => 'John 3:16',
            'translation_code' => 'kjv',
            'passage_text'     => 'For God so loved the world...',
            'mode'             => 'manual',
            'verses_json'      => [
                ['verse' => 16, 'text' => 'For God so loved the world...'],
            ],
        ]);

        $response->assertStatus(201);

        Event::assertDispatched(ProjectionUpdated::class, function (ProjectionUpdated $event) use ($user) {
            $channels = $event->broadcastOn();
            $channelNames = array_map(fn ($ch) => $ch->name, $channels);

            $payload = $event->broadcastWith();

            return $event->reference === 'John 3:16'
                && $event->translation === 'kjv'
                && $event->passageText === 'For God so loved the world...'
                && $event->status === 'projected'
                && !empty($event->timestamp)
                && in_array('private-projector.display', $channelNames)
                && $payload['reference'] === 'John 3:16'
                && $payload['translation'] === 'kjv'
                && $payload['passage_text'] === 'For God so loved the world...'
                && $payload['status'] === 'projected'
                && !empty($payload['timestamp'])
                && $payload['operator_name'] === $user->name;
        });
    }

    public function test_projection_updated_event_broadcasts_when_screen_cleared(): void
    {
        Event::fake([ProjectionUpdated::class]);

        $user = User::factory()->create(['name' => 'Media Operator']);

        $response = $this->actingAs($user)->postJson('/api/v1/projections/clear');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Projection screen cleared successfully.',
            ]);

        Event::assertDispatched(ProjectionUpdated::class, function (ProjectionUpdated $event) {
            $channels = $event->broadcastOn();
            $channelNames = array_map(fn ($ch) => $ch->name, $channels);
            $payload = $event->broadcastWith();

            return $event->status === 'cleared'
                && in_array('private-projector.display', $channelNames)
                && $payload['status'] === 'cleared'
                && !empty($payload['timestamp']);
        });
    }

    public function test_projection_updated_event_carries_required_fields_and_supports_token_channel(): void
    {
        $timestamp = now()->toIso8601String();
        $event = new ProjectionUpdated(
            reference: 'Romans 8:28',
            translation: 'esv',
            passageText: 'And we know that for those who love God all things work together for good...',
            status: 'projected',
            timestamp: $timestamp,
            verses: [['verse' => 28, 'text' => 'And we know that...']],
            tokenHash: 'secure-screen-hash-xyz',
            operatorName: 'Media Desk'
        );

        // Verify broadcast channels
        $channels = $event->broadcastOn();
        $channelNames = array_map(fn ($ch) => $ch->name, $channels);
        $this->assertContains('private-projector.display', $channelNames);
        $this->assertContains('private-projector.display.secure-screen-hash-xyz', $channelNames);

        // Verify broadcast name
        $this->assertEquals('ProjectionUpdated', $event->broadcastAs());

        // Verify required broadcast payload fields
        $payload = $event->broadcastWith();
        $this->assertEquals('Romans 8:28', $payload['reference']);
        $this->assertEquals('esv', $payload['translation']);
        $this->assertEquals('And we know that for those who love God all things work together for good...', $payload['passage_text']);
        $this->assertEquals('projected', $payload['status']);
        $this->assertEquals($timestamp, $payload['timestamp']);
        $this->assertCount(1, $payload['verses']);
        $this->assertEquals('Media Desk', $payload['operator_name']);
    }
}
