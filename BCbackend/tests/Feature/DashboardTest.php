<?php

namespace Tests\Feature;

use App\Models\Projection;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_retrieve_real_dashboard_stats(): void
    {
        $operator = User::factory()->create(['name' => 'Sister Mary', 'role' => 'operator']);
        $admin = User::factory()->create(['name' => 'Pastor John', 'role' => 'admin']);

        Projection::create([
            'user_id'          => $operator->id,
            'reference'        => 'John 3:16',
            'translation_code' => 'kjv',
            'passage_text'     => 'For God so loved the world...',
            'status'           => 'projected',
            'projected_at'     => now(),
        ]);

        Projection::create([
            'user_id'          => $admin->id,
            'reference'        => 'Romans 8:28',
            'translation_code' => 'kjv',
            'passage_text'     => 'And we know that all things work together...',
            'status'           => 'cleared',
            'projected_at'     => now()->subMinutes(10),
        ]);

        $response = $this->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'total_projections'        => 2,
                    'active_operators_count'   => 2,
                ],
            ]);

        $data = $response->json('data');

        // Verify total projections
        $this->assertEquals(2, $data['total_projections']);

        // Verify 4 services exist
        $this->assertCount(4, $data['services']);
        $serviceKeys = array_column($data['services'], 'service_key');
        $this->assertContains('1st_service', $serviceKeys);
        $this->assertContains('2nd_service', $serviceKeys);
        $this->assertContains('tuesday_service', $serviceKeys);
        $this->assertContains('thursday_service', $serviceKeys);

        // Verify current service
        $this->assertNotNull($data['current_service']);
        $this->assertEquals('in_progress', $data['current_service']['status']);

        // Verify recent projections
        $this->assertCount(2, $data['recent_projections']);
        $this->assertEquals('Romans 8:28', $data['recent_projections'][0]['ref']);
        $this->assertEquals('John 3:16', $data['recent_projections'][1]['ref']);

        // Verify active operators list
        $this->assertCount(2, $data['active_operators']);
    }

    public function test_can_switch_active_service(): void
    {
        $response = $this->postJson('/api/v1/services/switch', [
            'service_key' => 'tuesday_service',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'current_service' => [
                        'service_key' => 'tuesday_service',
                        'name'        => 'Tuesday Service',
                        'status'      => 'in_progress',
                    ],
                ],
            ]);

        // Check database
        $this->assertEquals('in_progress', Service::where('service_key', 'tuesday_service')->value('status'));
        $this->assertEquals('scheduled', Service::where('service_key', '1st_service')->value('status'));
    }

    public function test_can_list_all_services(): void
    {
        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(4, 'data');
    }
}
