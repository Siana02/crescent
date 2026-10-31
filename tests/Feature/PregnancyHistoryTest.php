<?php

namespace Tests\Feature;

use App\Models\Pregnancy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PregnancyHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function pregnantUser(): User
    {
        $user = User::factory()->create();
        $user->cycleProfile()->create(['timezone' => 'UTC', 'active_journey' => 'pregnancy', 'onboarding_completed' => true]);
        $user->pregnancies()->create(['due_date' => now()->addDays(120)->toDateString(), 'due_date_source' => 'due_date', 'status' => 'active']);

        return $user;
    }

    public function test_history_requires_authentication(): void
    {
        $this->getJson('/api/pregnancy/checkins?date=2026-01-01')->assertUnauthorized();
    }

    public function test_user_can_log_retrieve_edit_and_delete_a_past_entry(): void
    {
        $user = $this->pregnantUser();
        $date = now()->subDays(3)->toDateString();

        $this->actingAs($user)->postJson('/api/pregnancy/checkins', [
            'log_date' => $date, 'symptoms' => ['nausea', 'vomiting'], 'mood' => 'calm',
            'details' => ['severity' => ['nausea' => 2, 'backache' => 3], 'sleep_quality' => 'poor'],
        ])->assertCreated()->assertJsonPath('checkin.details.severity.nausea', 2)->assertJsonMissingPath('checkin.details.severity.backache');

        $this->actingAs($user)->getJson('/api/pregnancy/checkins?date='.$date)
            ->assertOk()->assertJsonCount(1, 'checkins')->assertJsonPath('checkins.0.mood', 'calm');

        $this->actingAs($user)->putJson('/api/pregnancy/checkins/'.$date, ['symptoms' => ['heartburn'], 'notes' => 'Edited'])
            ->assertOk()->assertJsonPath('checkin.symptoms.0', 'heartburn')->assertJsonPath('checkin.notes', 'Edited');

        $this->actingAs($user)->getJson('/api/pregnancy/checkins?from='.now()->subDays(10)->toDateString().'&to='.now()->toDateString())
            ->assertOk()->assertJsonCount(1, 'checkins');

        $this->actingAs($user)->deleteJson('/api/pregnancy/checkins/'.$date)->assertOk();
        $this->actingAs($user)->getJson('/api/pregnancy/checkins?date='.$date)->assertOk()->assertJsonCount(0, 'checkins');
    }

    public function test_history_is_scoped_to_the_authenticated_users_pregnancy(): void
    {
        $owner = $this->pregnantUser();
        $date = now()->subDay()->toDateString();
        $this->actingAs($owner)->postJson('/api/pregnancy/checkins', ['log_date' => $date, 'notes' => 'private'])->assertCreated();

        $other = $this->pregnantUser();
        $this->actingAs($other)->getJson('/api/pregnancy/checkins?date='.$date)->assertOk()->assertJsonCount(0, 'checkins');
        $this->actingAs($other)->putJson('/api/pregnancy/checkins/'.$date, ['notes' => 'x'])->assertNotFound();
        $this->actingAs($other)->deleteJson('/api/pregnancy/checkins/'.$date)->assertNotFound();
    }

    public function test_range_is_validated_and_limited(): void
    {
        $user = $this->pregnantUser();
        $this->actingAs($user)->getJson('/api/pregnancy/checkins?from=2020-01-01&to=2026-01-01')->assertStatus(422);
        $this->actingAs($user)->getJson('/api/pregnancy/checkins?from=2026-02-01&to=2026-01-01')->assertStatus(422);
        $this->actingAs($user)->postJson('/api/pregnancy/checkins', ['symptoms' => ['not_a_symptom']])->assertStatus(422);
    }

    public function test_reminders_can_be_edited_completed_and_deleted_only_by_their_owner(): void
    {
        $user = $this->pregnantUser();
        $id = $this->actingAs($user)->postJson('/api/pregnancy/reminders', [
            'title' => 'Scan', 'category' => 'scan', 'remind_at' => now()->addDays(5)->toIso8601String(),
        ])->assertCreated()->json('reminder.id');

        $this->actingAs($user)->patchJson('/api/pregnancy/reminders/'.$id, ['completed' => true, 'title' => 'Dating scan'])->assertOk();
        $this->assertNotNull(\App\Models\PregnancyReminder::find($id)->completed_at);

        $stranger = $this->pregnantUser();
        $this->actingAs($stranger)->patchJson('/api/pregnancy/reminders/'.$id, ['title' => 'x'])->assertForbidden();
        $this->actingAs($stranger)->deleteJson('/api/pregnancy/reminders/'.$id)->assertForbidden();

        $this->actingAs($user)->deleteJson('/api/pregnancy/reminders/'.$id)->assertOk();
    }

    public function test_dashboard_reports_gestational_age_without_cycle_predictions(): void
    {
        $user = $this->pregnantUser();
        $this->actingAs($user)->getJson('/api/dashboard?timezone=UTC')->assertOk()
            ->assertJsonPath('pregnancy.gestational_days', 160)->assertJsonPath('pregnancy.gestational_week', 22)
            ->assertJsonPath('pregnancy.gestational_day_in_week', 6)->assertJsonPath('pregnancy.trimester', 2)
            ->assertJsonPath('fertility_window', null)->assertJsonPath('estimated_next_period', null);
    }
}
