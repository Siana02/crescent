<?php

namespace Tests\Feature;

use App\Models\CyclePhasePresentation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodDateCorrectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_correcting_a_period_start_rebuilds_the_current_cycle_from_the_new_date(): void
    {
        $user = User::factory()->create();
        $originalStart = today()->subDays(27)->toDateString();
        $correctedStart = today()->subDays(17)->toDateString();

        $user->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'cycle',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
            'cycle_tracking_started_at' => $originalStart,
        ]);
        $period = $user->periodLogs()->create([
            'start_date' => $originalStart,
            'end_date' => today()->subDays(23)->toDateString(),
            'flow_intensity' => 'medium',
        ]);

        $this->actingAs($user)->putJson('/api/periods/'.$period->id, [
            'start_date' => $correctedStart,
            'end_date' => today()->subDays(13)->toDateString(),
            'flow_intensity' => 'light',
        ])->assertOk()
            ->assertJsonPath('recalculated', true)
            ->assertJsonPath('period.start_date', $correctedStart);

        $this->assertDatabaseCount('period_logs', 1);
        $this->assertDatabaseHas('period_logs', [
            'id' => $period->id,
            'user_id' => $user->id,
            'start_date' => $correctedStart,
            'flow_intensity' => 'light',
        ]);
        $this->assertSame($correctedStart, $user->fresh()->cycleProfile->cycle_tracking_started_at->format('Y-m-d'));

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('latest_period.start_date', $correctedStart)
            ->assertJsonPath('cycle_day', 18)
            ->assertJsonPath('estimated_next_period', today()->subDays(17)->addDays(28)->toDateString());
    }

    public function test_correcting_a_period_supersedes_pending_phase_welcomes_based_on_old_dates(): void
    {
        $user = User::factory()->create();
        $originalStart = today()->subDays(27)->toDateString();
        $correctedStart = today()->subDays(17)->toDateString();

        $user->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'cycle',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
            'cycle_tracking_started_at' => $originalStart,
        ]);
        $period = $user->periodLogs()->create(['start_date' => $originalStart]);
        $presentation = CyclePhasePresentation::create([
            'user_id' => $user->id,
            'cycle_start_date' => today()->toDateString(),
            'phase' => 'menstrual',
            'phase_start_date' => today()->toDateString(),
            'status' => 'pending',
        ]);

        $this->actingAs($user)->putJson('/api/periods/'.$period->id, [
            'start_date' => $correctedStart,
        ])->assertOk();

        $this->assertDatabaseHas('cycle_phase_presentations', [
            'id' => $presentation->id,
            'status' => 'superseded',
        ]);
    }

    public function test_a_user_cannot_correct_another_users_period_record(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $period = $owner->periodLogs()->create(['start_date' => today()->subDays(10)->toDateString()]);

        $this->actingAs($other)->putJson('/api/periods/'.$period->id, [
            'start_date' => today()->subDays(9)->toDateString(),
        ])->assertNotFound();

        $this->assertDatabaseHas('period_logs', [
            'id' => $period->id,
            'start_date' => today()->subDays(10)->toDateString(),
        ]);
    }
}
