<?php

namespace Tests\Feature;

use App\Models\Projection;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_schedule_a_new_church_service(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/v1/services', [
            'name'          => 'Midweek Miracle Service',
            'preacher_name' => 'Pastor Emmanuel',
            'description'   => 'Faith and Healing Series',
            'service_date'  => '2026-12-02',
            'start_time'    => '18:30',
            'status'        => 'scheduled',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'name'          => 'Midweek Miracle Service',
                    'preacher_name' => 'Pastor Emmanuel',
                    'status'        => 'scheduled',
                    'service_date'  => '2026-12-02',
                    'start_time'    => '18:30:00',
                    'created_by'    => $admin->id,
                ],
            ]);

        $this->assertDatabaseHas('services', [
            'name'          => 'Midweek Miracle Service',
            'preacher_name' => 'Pastor Emmanuel',
            'status'        => 'scheduled',
        ]);
    }

    public function test_can_edit_and_reschedule_an_existing_service(): void
    {
        $service = Service::create([
            'name'         => 'Youth Fellowship',
            'service_key'  => 'youth_fellowship',
            'service_date' => '2026-11-28',
            'start_time'   => '16:00:00',
            'status'       => 'scheduled',
        ]);

        // Edit metadata
        $editResponse = $this->putJson("/api/v1/services/{$service->id}", [
            'name'          => 'Youth Fire Conference',
            'preacher_name' => 'Minister Grace',
            'description'   => 'Quarterly youth summit',
        ]);

        $editResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'name'          => 'Youth Fire Conference',
                    'preacher_name' => 'Minister Grace',
                    'description'   => 'Quarterly youth summit',
                ],
            ]);

        // Reschedule service date/time
        $scheduleResponse = $this->postJson("/api/v1/services/{$service->id}/schedule", [
            'service_date' => '2026-12-05',
            'start_time'   => '17:00',
            'end_time'     => '19:30',
        ]);

        $scheduleResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'service_date' => '2026-12-05',
                    'start_time'   => '17:00:00',
                    'end_time'     => '19:30:00',
                    'status'       => 'scheduled',
                ],
            ]);
    }

    public function test_can_start_and_end_service_lifecycle(): void
    {
        Service::seedDefaultsIfNeeded();

        $scheduled = Service::create([
            'name'         => 'Special Communion Service',
            'service_key'  => 'special_communion',
            'service_date' => '2026-11-27',
            'status'       => 'scheduled',
        ]);

        // Start service
        $startRes = $this->postJson("/api/v1/services/{$scheduled->id}/start");

        $startRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'id'     => $scheduled->id,
                    'status' => 'in_progress',
                ],
            ]);

        $this->assertEquals('scheduled', Service::where('service_key', '1st_service')->value('status'));
        $this->assertNotNull($scheduled->fresh()->started_at);

        // End service
        $endRes = $this->postJson("/api/v1/services/{$scheduled->id}/end");

        $endRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'id'     => $scheduled->id,
                    'status' => 'completed',
                ],
            ]);

        $ended = $scheduled->fresh();
        $this->assertEquals('completed', $ended->status);
        $this->assertNotNull($ended->ended_at);
        $this->assertNotNull($ended->end_time);

        // Starting an already completed service directly is rejected
        $restartRes = $this->postJson("/api/v1/services/{$scheduled->id}/start");
        $restartRes->assertStatus(422);
    }

    public function test_can_view_previous_services_with_projection_counts(): void
    {
        $user = User::factory()->create(['name' => 'Operator Joy']);

        $pastService = Service::create([
            'name'          => 'Thanksgiving Sunday Service',
            'preacher_name' => 'Senior Pastor',
            'service_key'   => 'thanksgiving_sunday',
            'service_date'  => '2026-11-20',
            'start_time'    => '08:00:00',
            'end_time'      => '10:15:00',
            'status'        => 'completed',
            'ended_at'      => now()->subDays(7),
        ]);

        Projection::create([
            'service_id'       => $pastService->id,
            'user_id'          => $user->id,
            'reference'        => 'Psalm 100:4',
            'translation_code' => 'kjv',
            'passage_text'     => 'Enter into his gates with thanksgiving...',
            'status'           => 'cleared',
            'projected_at'     => now()->subDays(7),
        ]);

        // Fetch previous services list
        $prevRes = $this->getJson('/api/v1/services/previous');
        $prevRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Thanksgiving Sunday Service')
            ->assertJsonPath('data.0.projections_count', 1);

        // View full detail of previous service
        $detailRes = $this->getJson("/api/v1/services/{$pastService->id}");
        $detailRes->assertStatus(200)
            ->assertJsonPath('data.projections.0.reference', 'Psalm 100:4');
    }

    public function test_cannot_delete_active_service_but_can_delete_scheduled_or_previous(): void
    {
        $active = Service::create([
            'name'        => 'Active Live Service',
            'service_key' => 'active_live_test',
            'status'      => 'in_progress',
        ]);

        $scheduled = Service::create([
            'name'        => 'Cancelled Outreach',
            'service_key' => 'cancelled_outreach',
            'status'      => 'scheduled',
        ]);

        $this->deleteJson("/api/v1/services/{$active->id}")
            ->assertStatus(422);

        $this->deleteJson("/api/v1/services/{$scheduled->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('services', ['id' => $scheduled->id]);
    }
}
