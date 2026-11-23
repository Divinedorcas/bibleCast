<?php

namespace Tests\Feature;

use App\Events\ProjectionUpdated;
use App\Models\Projection;
use App\Models\ProjectionQueue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ProjectionQueueTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_add_passage_to_queue(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/projection-queues', [
            'reference'        => 'John 3:16',
            'translation_code' => 'kjv',
            'passage_text'     => 'For God so loved the world...',
            'verses_json'      => [
                ['verse' => 16, 'text' => 'For God so loved the world...'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Passage added to queue successfully.',
                'data'    => [
                    'reference'        => 'John 3:16',
                    'translation_code' => 'kjv',
                    'status'           => 'pending',
                    'sort_order'       => 1,
                ],
            ]);

        $this->assertDatabaseHas('projection_queues', [
            'reference'  => 'John 3:16',
            'status'     => 'pending',
            'sort_order' => 1,
        ]);
    }

    public function test_can_list_queue_passages_in_order(): void
    {
        ProjectionQueue::create([
            'reference'        => 'Genesis 1:1',
            'translation_code' => 'kjv',
            'passage_text'     => 'In the beginning God created the heaven and the earth.',
            'sort_order'       => 2,
        ]);

        ProjectionQueue::create([
            'reference'        => 'Psalm 23:1',
            'translation_code' => 'kjv',
            'passage_text'     => 'The Lord is my shepherd; I shall not want.',
            'sort_order'       => 1,
        ]);

        $response = $this->getJson('/api/v1/projection-queues');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Projection queue retrieved successfully.',
            ])
            ->assertJsonCount(2, 'data');

        // First item in ordered list should be sort_order 1 (Psalm 23:1)
        $data = $response->json('data');
        $this->assertEquals('Psalm 23:1', $data[0]['reference']);
        $this->assertEquals('Genesis 1:1', $data[1]['reference']);
    }

    public function test_can_remove_passage_from_queue(): void
    {
        $item = ProjectionQueue::create([
            'reference'        => 'Romans 8:28',
            'translation_code' => 'kjv',
            'passage_text'     => 'And we know that all things work together...',
            'sort_order'       => 1,
        ]);

        $response = $this->deleteJson("/api/v1/projection-queues/{$item->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Passage removed from queue successfully.',
            ]);

        $this->assertDatabaseMissing('projection_queues', [
            'id' => $item->id,
        ]);
    }

    public function test_can_reorder_passages_in_queue(): void
    {
        $item1 = ProjectionQueue::create([
            'reference'        => 'Passage 1',
            'passage_text'     => 'First text',
            'sort_order'       => 1,
        ]);

        $item2 = ProjectionQueue::create([
            'reference'        => 'Passage 2',
            'passage_text'     => 'Second text',
            'sort_order'       => 2,
        ]);

        $item3 = ProjectionQueue::create([
            'reference'        => 'Passage 3',
            'passage_text'     => 'Third text',
            'sort_order'       => 3,
        ]);

        // Reorder by sending array of IDs in desired order: 3, 1, 2
        $response = $this->postJson('/api/v1/projection-queues/reorder', [
            'items' => [$item3->id, $item1->id, $item2->id],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Projection queue reordered successfully.',
            ]);

        $this->assertEquals(0, $item3->fresh()->sort_order);
        $this->assertEquals(1, $item1->fresh()->sort_order);
        $this->assertEquals(2, $item2->fresh()->sort_order);
    }

    public function test_can_project_selected_passage_from_queue(): void
    {
        Event::fake([ProjectionUpdated::class]);

        $user = User::factory()->create(['name' => 'Media Operator']);

        $item = ProjectionQueue::create([
            'user_id'          => $user->id,
            'reference'        => 'Philippians 4:13',
            'translation_code' => 'kjv',
            'passage_text'     => 'I can do all things through Christ which strengtheneth me.',
            'status'           => 'pending',
            'sort_order'       => 1,
            'verses_json'      => [
                ['verse' => 13, 'text' => 'I can do all things...'],
            ],
        ]);

        $response = $this->actingAs($user)->postJson("/api/v1/projection-queues/{$item->id}/project");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'projection' => [
                        'reference' => 'Philippians 4:13',
                        'status'    => 'projected',
                        'mode'      => 'queue',
                    ],
                    'queue_item' => [
                        'id'     => $item->id,
                        'status' => 'projected',
                    ],
                ],
            ]);

        // Check database
        $this->assertDatabaseHas('projections', [
            'reference' => 'Philippians 4:13',
            'status'    => 'projected',
            'mode'      => 'queue',
        ]);

        $this->assertEquals('projected', $item->fresh()->status);

        // Check broadcast event
        Event::assertDispatched(ProjectionUpdated::class, function (ProjectionUpdated $event) {
            return $event->reference === 'Philippians 4:13'
                && $event->status === 'projected';
        });
    }

    public function test_can_clear_entire_queue(): void
    {
        ProjectionQueue::create([
            'reference'    => 'Ref 1',
            'passage_text' => 'Text 1',
        ]);
        ProjectionQueue::create([
            'reference'    => 'Ref 2',
            'passage_text' => 'Text 2',
        ]);

        $this->assertEquals(2, ProjectionQueue::count());

        $response = $this->postJson('/api/v1/projection-queues/clear');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Projection queue cleared successfully.',
            ]);

        $this->assertEquals(0, ProjectionQueue::count());
    }
}
