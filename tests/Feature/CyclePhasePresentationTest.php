<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CyclePhasePresentationTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_exposes_a_menstrual_phase_welcome_and_confirming_it_records_the_period_start(): void
    {
        $user = User::factory()->create();
        $start = today()->subDays(2)->toDateString();

        $user->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'cycle',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
            'cycle_tracking_started_at' => $start,
        ]);
        $user->periodLogs()->create(['start_date' => $start, 'end_date' => null]);

        $dashboard = $this->actingAs($user)->getJson('/api/dashboard')->assertOk();
        $dashboard->assertJsonPath('cycle_phase.phase', 'menstrual')
            ->assertJsonPath('phase_presentation.phase', 'menstrual')
            ->assertJsonPath('phase_presentation.status', 'pending')
            ->assertJsonPath('phase_presentation.should_present', true);

        $presentationId = $dashboard->json('phase_presentation.id');

        $this->patchJson('/api/cycle-phase-presentations/'.$presentationId, [
            'action' => 'confirm',
        ])->assertOk()
            ->assertJsonPath('period_recorded', true);

        $this->assertDatabaseHas('period_logs', [
            'user_id' => $user->id,
            'start_date' => $start,
        ]);
        $this->assertDatabaseHas('cycle_phase_presentations', [
            'id' => $presentationId,
            'status' => 'acknowledged',
        ]);
    }

    public function test_dismissing_a_phase_welcome_does_not_create_or_change_period_data(): void
    {
        $user = User::factory()->create();
        $start = today()->subDays(8)->toDateString();

        $user->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'cycle',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
            'cycle_tracking_started_at' => $start,
        ]);
        $user->periodLogs()->create(['start_date' => $start, 'end_date' => today()->subDays(4)->toDateString()]);

        $dashboard = $this->actingAs($user)->getJson('/api/dashboard')->assertOk();
        $dashboard->assertJsonPath('cycle_phase.phase', 'follicular')
            ->assertJsonPath('phase_presentation.should_present', true);

        $presentationId = $dashboard->json('phase_presentation.id');
        $this->patchJson('/api/cycle-phase-presentations/'.$presentationId, [
            'action' => 'dismiss',
        ])->assertOk()
            ->assertJsonPath('period_recorded', false);

        $this->assertDatabaseCount('period_logs', 1);
        $this->assertDatabaseHas('cycle_phase_presentations', [
            'id' => $presentationId,
            'status' => 'dismissed',
        ]);
    }

    public function test_a_user_cannot_respond_to_another_users_phase_presentation(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $start = today()->subDays(2)->toDateString();

        $owner->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'cycle',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
            'cycle_tracking_started_at' => $start,
        ]);
        $owner->periodLogs()->create(['start_date' => $start]);

        $presentationId = $this->actingAs($owner)->getJson('/api/dashboard')->json('phase_presentation.id');

        $this->actingAs($other)->patchJson('/api/cycle-phase-presentations/'.$presentationId, [
            'action' => 'confirm',
        ])->assertNotFound();

        $this->assertDatabaseHas('cycle_phase_presentations', [
            'id' => $presentationId,
            'status' => 'pending',
        ]);
    }

    public function test_pregnancy_journey_does_not_receive_cycle_phase_presentations(): void
    {
        $user = User::factory()->create();
        $user->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'pregnancy',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
        ]);

        $this->actingAs($user)->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('cycle_phase', null)
            ->assertJsonPath('phase_presentation', null)
            ->assertJsonPath('missed_period_reminder', false);

        $this->assertDatabaseCount('cycle_phase_presentations', 0);
    }
}
