<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CycleDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_page_route_exists_and_requires_authentication(): void
    {
        $this->withoutVite();

        $this->get('/dashboard')->assertRedirect('/login');

       $user = User::factory()->create();

$this->actingAs($user)
    ->get('/dashboard')
    ->assertRedirect('/onboarding');
    }

    public function test_dashboard_data_is_private_to_authenticated_users(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/dashboard?timezone=Africa%2FNairobi')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('profile.average_cycle_length', null)
            ->assertJsonPath('profile.average_period_length', null)
            ->assertJsonPath('profile.cycle_regularity', 'unknown')
            ->assertJsonPath('profile.primary_goal', 'track_cycle')
            ->assertJsonPath('profile.birth_date', null)
            ->assertJsonPath('profile.sun_sign', null)
            ->assertJsonPath('profile.moon_sign', null)
            ->assertJsonPath('profile.rising_sign', null)
            ->assertJsonPath('profile.onboarding_completed', false)
            ->assertJsonPath('latest_period', null);
    }

    public function test_user_can_save_period_dates_and_get_a_cycle_estimate(): void
    {
        $user = User::factory()->create();
        $startDate = today('Africa/Nairobi')->subDays(4)->toDateString();
        $endDate = today('Africa/Nairobi')->subDays(1)->toDateString();

        $this->actingAs($user)
            ->putJson('/api/cycle-profile', [
                'average_cycle_length' => 30,
                'average_period_length' => 5,
                'cycle_regularity' => 'regular',
                'timezone' => 'Africa/Nairobi',
            ])
            ->assertOk()
            ->assertJsonPath('profile.average_cycle_length', 30)
            ->assertJsonPath('profile.cycle_regularity', 'regular');

        $this->postJson('/api/periods', [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ])->assertCreated()
            ->assertJsonPath('period.start_date', $startDate)
            ->assertJsonPath('period.end_date', $endDate);

        $this->getJson('/api/dashboard?timezone=Africa%2FNairobi')
            ->assertOk()
            ->assertJsonPath('cycle_day', 5)
            ->assertJsonPath('estimated_next_period', today('Africa/Nairobi')->addDays(26)->toDateString())
            ->assertJsonPath('latest_period.start_date', $startDate)
            ->assertJsonPath('latest_period.end_date', $endDate);
    }

    public function test_user_can_save_unknown_cycle_lengths_and_irregularity(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/cycle-profile', [
                'average_cycle_length' => null,
                'average_period_length' => null,
                'cycle_regularity' => 'irregular',
                'timezone' => 'Africa/Nairobi',
            ])
            
            ->assertOk()
            ->assertJsonPath('profile.average_cycle_length', null)
            ->assertJsonPath('profile.average_period_length', null)
            ->assertJsonPath('profile.cycle_regularity', 'irregular');

        $this->getJson('/api/dashboard?timezone=Africa%2FNairobi')
            ->assertOk()
            ->assertJsonPath('estimated_next_period', null);
    }

    public function test_user_can_save_onboarding_and_sun_sign_is_derived_from_birth_date(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/cycle-profile', [
                'average_cycle_length' => null,
                'average_period_length' => null,
                'cycle_regularity' => 'unknown',
                'timezone' => 'Africa/Nairobi',
                'birth_date' => '1998-07-25',
                'birth_time' => null,
                'birth_place' => 'Nairobi, Kenya',
                'contraception_type' => 'prefer_not_to_say',
                'primary_goal' => 'predict_moon',
                'moon_sign' => null,
                'rising_sign' => null,
                'onboarding_completed' => true,
            ])
            ->assertOk()
            ->assertJsonPath('profile.sun_sign', 'Leo')
            ->assertJsonPath('profile.birth_place', 'Nairobi, Kenya')
            ->assertJsonPath('profile.primary_goal', 'predict_moon')
            ->assertJsonPath('profile.onboarding_completed', true);
    }

    public function test_user_can_save_a_private_daily_vibe_checkin(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/daily-checkins', [
                'energy_level' => 'balanced',
                'mood' => 'calm',
                'symptoms' => ['cramps', 'fatigue'],
                'notes' => 'Taking it slowly today.',
            ])
            ->assertCreated()
            ->assertJsonPath('checkin.energy_level', 'balanced')
            ->assertJsonPath('checkin.mood.0', 'calm')
            ->assertJsonPath('checkin.symptoms.0', 'cramps')
            ->assertJsonPath('checkin.symptoms.1', 'fatigue');

        $this->assertDatabaseHas('daily_checkins', [
            'user_id' => $user->id,
            'energy_level' => 'balanced',
            'mood' => 'calm',
            'notes' => 'Taking it slowly today.',
        ]);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('today_checkin.energy_level', 'balanced');
    }

    public function test_historical_checkin_updates_preserve_fields_that_were_not_submitted(): void
    {
        $user = User::factory()->create();
        $date = today('Africa/Nairobi')->subDays(3)->toDateString();

        $this->actingAs($user)
            ->postJson('/api/daily-checkins', [
                'log_date' => $date,
                'energy_level' => 'low',
                'mood' => ['tender', 'anxious'],
                'symptoms' => ['cramps', 'bloating'],
                'notes' => 'Rest helped me today.',
            ])
            ->assertCreated()
            ->assertJsonPath('checkin.log_date', $date);

        $this->postJson('/api/daily-checkins', [
            'log_date' => $date,
            'symptoms' => ['headache', 'fatigue'],
        ])
            ->assertCreated()
            ->assertJsonPath('checkin.log_date', $date)
            ->assertJsonPath('checkin.energy_level', 'low')
            ->assertJsonPath('checkin.mood.0', 'tender')
            ->assertJsonPath('checkin.mood.1', 'anxious')
            ->assertJsonPath('checkin.symptoms.0', 'headache')
            ->assertJsonPath('checkin.symptoms.1', 'fatigue')
            ->assertJsonPath('checkin.notes', 'Rest helped me today.');

        $this->getJson('/api/daily-checkins?date='.$date)
            ->assertOk()
            ->assertJsonPath('checkin.log_date', $date)
            ->assertJsonPath('checkin.energy_level', 'low')
            ->assertJsonPath('checkin.mood.1', 'anxious')
            ->assertJsonPath('checkin.symptoms.0', 'headache')
            ->assertJsonPath('checkin.notes', 'Rest helped me today.');
    }

    public function test_user_can_create_a_checkin_for_a_past_date_when_no_record_exists(): void
    {
        $user = User::factory()->create();
        $date = today('Africa/Nairobi')->subMonths(2)->toDateString();

        $this->actingAs($user)
            ->postJson('/api/daily-checkins', [
                'log_date' => $date,
                'symptoms' => ['cramps'],
                'notes' => 'A note from an earlier day.',
            ])
            ->assertCreated()
            ->assertJsonPath('checkin.log_date', $date)
            ->assertJsonPath('checkin.symptoms.0', 'cramps')
            ->assertJsonPath('checkin.notes', 'A note from an earlier day.');

        $this->getJson('/api/daily-checkins?date='.$date)
            ->assertOk()
            ->assertJsonPath('checkin.symptoms.0', 'cramps');
    }

    public function test_daily_checkin_history_is_private_to_the_signed_in_user(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $date = today('Africa/Nairobi')->subDays(5)->toDateString();

        $this->actingAs($owner)
            ->postJson('/api/daily-checkins', [
                'log_date' => $date,
                'symptoms' => ['cramps'],
                'notes' => 'A private note.',
            ])
            ->assertCreated();

        $this->actingAs($otherUser)
            ->getJson('/api/daily-checkins?date='.$date)
            ->assertOk()
            ->assertJsonPath('checkin', null);
    }

    public function test_period_history_endpoint_returns_older_records_beyond_dashboard_window(): void
    {
        $user = User::factory()->create();
        $olderStart = today('Africa/Nairobi')->subMonths(9)->toDateString();
        $newerStart = today('Africa/Nairobi')->subMonths(8)->toDateString();

        $this->actingAs($user)
            ->postJson('/api/periods', [
                'start_date' => $olderStart,
                'end_date' => today('Africa/Nairobi')->subMonths(9)->addDays(3)->toDateString(),
                'flow_intensity' => 'medium',
            ])->assertCreated();

        $this->postJson('/api/periods', [
            'start_date' => $newerStart,
            'end_date' => today('Africa/Nairobi')->subMonths(8)->addDays(4)->toDateString(),
            'flow_intensity' => 'light',
        ])->assertCreated();

        $this->getJson('/api/periods')
            ->assertOk()
            ->assertJsonCount(2, 'periods')
            ->assertJsonPath('periods.0.start_date', $newerStart)
            ->assertJsonPath('periods.1.start_date', $olderStart);
    }

    public function test_daily_checkin_requires_authentication(): void
    {
        $this->postJson('/api/daily-checkins', ['mood' => 'calm'])->assertUnauthorized();
    }

    public function test_registration_creates_a_signed_in_account(): void
    {
        $this->postJson('/auth/register', [
            'name' => 'Crescent Tester',
            'email' => 'crescent@example.test',
            'password' => 'gentlemoon123',
            'password_confirmation' => 'gentlemoon123',
        ])->assertCreated()
            ->assertJsonPath('user.name', 'Crescent Tester');

        $this->getJson('/api/dashboard')->assertOk();
    }
}
