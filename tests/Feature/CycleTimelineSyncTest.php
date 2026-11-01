<?php

namespace Tests\Feature;

use App\Models\Relationship;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CycleTimelineSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_period_start_closes_the_previous_cycle_and_starts_cycle_day_one(): void
    {
        $user = User::factory()->create();
        $previousStart = today()->subDays(26)->toDateString();
        $previousEnd = today()->subDays(23)->toDateString();
        $currentStart = today()->toDateString();
        $user->cycleProfile()->create([
            'timezone' => config('app.timezone', 'UTC'),
            'active_journey' => 'cycle',
            'cycle_tracking_started_at' => $previousStart,
        ]);

        $this->actingAs($user)->postJson('/api/periods', [
            'start_date' => $previousStart,
            'end_date' => $previousEnd,
            'flow_intensity' => 'medium',
        ])->assertCreated();

        $this->postJson('/api/periods', [
            'start_date' => $currentStart,
            'flow_intensity' => 'medium',
        ])->assertCreated();

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('cycle_day', 1)
            ->assertJsonPath('estimated_cycle_length', 26)
            ->assertJsonPath('estimated_next_period', today()->addDays(26)->toDateString())
            ->assertJsonPath('period_is_active', true)
            ->assertJsonPath('current_period_day', 1)
            ->assertJsonPath('latest_period.start_date', $currentStart)
            ->assertJsonPath('period_history.0.start_date', $previousStart)
            ->assertJsonPath('period_history.0.end_date', $previousEnd)
            ->assertJsonPath('period_history.1.start_date', $currentStart);
    }

    public function test_private_sex_drive_logs_can_be_read_by_date_only_by_their_owner(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $date = today()->toDateString();

        $owner->sexLogs()->create([
            'log_date' => $date,
            'activities' => ['kissing_touching'],
            'protection_methods' => [],
            'sex_drive' => 4,
            'orgasm' => null,
            'notes' => 'Private note',
        ]);

        $this->actingAs($owner)
            ->getJson('/api/sex-logs?date='.$date)
            ->assertOk()
            ->assertJsonPath('logs.0.sex_drive', 4)
            ->assertJsonPath('logs.0.notes', 'Private note');

        $this->actingAs($otherUser)
            ->getJson('/api/sex-logs?date='.$date)
            ->assertOk()
            ->assertJsonCount(0, 'logs');
    }

    public function test_login_can_issue_a_persistent_remember_cookie_without_requiring_terms_consent_again(): void
    {
        $user = User::factory()->create(['remember_token' => null]);

        $response = $this->postJson('/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'remember' => true,
        ])->assertOk();

        $cookieNames = array_map(fn ($cookie) => $cookie->getName(), $response->headers->getCookies());
        $this->assertContains(Auth::guard()->getRecallerName(), $cookieNames);
        $this->assertNotEmpty($user->fresh()->getRememberToken());
        $this->assertAuthenticatedAs($user);
    }

    public function test_journal_article_previews_require_an_account_and_keep_the_selected_article(): void
    {
        $this->get('/read/painful-period-cramps')
            ->assertRedirect('/register?source=journal&article=painful-period-cramps');

        $this->withoutVite()
            ->actingAs(User::factory()->create())
            ->get('/read/painful-period-cramps')
            ->assertOk();
    }

    public function test_dashboard_returns_the_owners_private_sex_drive_logs(): void
    {
        $owner = User::factory()->create();
        $date = today()->toDateString();

        $owner->sexLogs()->create([
            'log_date' => $date,
            'activities' => [],
            'protection_methods' => [],
            'sex_drive' => 2,
            'orgasm' => null,
            'notes' => null,
        ]);

        $this->actingAs($owner)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('today_sex_logs.0.sex_drive', 2);
    }

    public function test_support_partner_receives_default_shared_cycle_wellbeing_and_intimate_updates(): void
    {
        $primary = User::factory()->create();
        $support = User::factory()->create();
        $primary->cycleProfile()->create([
            'timezone' => 'UTC',
            'relationship_role' => 'tracker',
            'active_journey' => 'cycle',
            'average_cycle_length' => 28,
            'average_period_length' => 5,
            'cycle_regularity' => 'regular',
            'contraception_type' => 'none',
        ]);
        $support->cycleProfile()->create([
            'timezone' => 'UTC',
            'relationship_role' => 'support',
            'onboarding_completed' => true,
        ]);
        $relationship = Relationship::create([
            'user_one_id' => $primary->id,
            'user_two_id' => $support->id,
            'relationship_type' => 'observer',
            'status' => 'accepted',
            'sharing_preferences' => [(string) $primary->id => [
                'cycle_details' => true,
                'pregnancy_details' => true,
                'wellbeing_updates' => true,
                'intimate_updates' => true,
                'astrology' => false,
            ]],
        ]);

        $latestStart = today('UTC')->subDays(10);
        $primary->periodLogs()->create(['start_date' => $latestStart->toDateString(), 'end_date' => $latestStart->copy()->addDays(4)->toDateString(), 'flow_intensity' => 'medium']);
        $previousStart = $latestStart->copy()->subDays(28);
        $primary->periodLogs()->create(['start_date' => $previousStart->toDateString(), 'end_date' => $previousStart->copy()->addDays(4)->toDateString(), 'flow_intensity' => 'medium']);
        $primary->dailyCheckins()->create([
            'log_date' => today('UTC')->toDateString(),
            'energy_level' => 'low',
            'mood' => 'tender',
            'symptoms' => ['cramps'],
            'notes' => 'Would appreciate a quiet evening.',
        ]);
        $primary->sexLogs()->create([
            'log_date' => today('UTC')->toDateString(),
            'activities' => ['kissing_touching'],
            'protection_methods' => ['condom_external'],
            'sex_drive' => 4,
            'orgasm' => true,
            'notes' => 'Personal update.',
        ]);

        $this->actingAs($support)->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('relationships.0.id', $relationship->id)
            ->assertJsonPath('relationships.0.companion_wellbeing.symptoms.0', 'cramps')
            ->assertJsonPath('relationships.0.companion_wellbeing.mood.0', 'tender')
            ->assertJsonPath('relationships.0.companion_intimacy.0.sex_drive', 4)
            ->assertJsonPath('relationships.0.companion_cycle_summary.estimated_cycle_length', 28)
            ->assertJsonPath('relationships.0.companion_cycle_summary.estimated_ovulation_date', $latestStart->copy()->addDays(13)->toDateString());
    }

    public function test_primary_partner_can_turn_off_sharing_and_support_partner_cannot_override_it(): void
    {
        $primary = User::factory()->create();
        $support = User::factory()->create();
        $primary->cycleProfile()->create(['timezone' => 'UTC', 'relationship_role' => 'tracker', 'active_journey' => 'cycle']);
        $support->cycleProfile()->create(['timezone' => 'UTC', 'relationship_role' => 'support', 'onboarding_completed' => true]);
        $relationship = Relationship::create([
            'user_one_id' => $primary->id,
            'user_two_id' => $support->id,
            'relationship_type' => 'observer',
            'status' => 'accepted',
            'sharing_preferences' => [(string) $primary->id => [
                'cycle_details' => true,
                'pregnancy_details' => true,
                'wellbeing_updates' => true,
                'intimate_updates' => true,
                'astrology' => false,
            ]],
        ]);
        $primary->dailyCheckins()->create([
            'log_date' => today('UTC')->toDateString(),
            'energy_level' => 'low',
            'mood' => 'tender',
            'symptoms' => ['cramps'],
        ]);
        $primary->sexLogs()->create([
            'log_date' => today('UTC')->toDateString(),
            'activities' => [],
            'protection_methods' => [],
            'sex_drive' => 3,
            'orgasm' => null,
            'notes' => null,
        ]);

        $this->actingAs($primary)->patchJson('/api/relationships/'.$relationship->id.'/sharing', [
            'cycle_details' => false,
            'wellbeing_updates' => false,
            'intimate_updates' => false,
        ])->assertOk()
            ->assertJsonPath('sharing_preferences.cycle_details', false)
            ->assertJsonPath('sharing_preferences.wellbeing_updates', false)
            ->assertJsonPath('sharing_preferences.intimate_updates', false);

        $this->actingAs($support)->patchJson('/api/relationships/'.$relationship->id.'/sharing', [
            'wellbeing_updates' => true,
        ])->assertForbidden();

        $this->actingAs($support)->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('relationships.0.companion_cycle_summary', null)
            ->assertJsonPath('relationships.0.companion_wellbeing', null)
            ->assertJsonPath('relationships.0.companion_intimacy', null);
    }

    public function test_new_support_invitations_enable_body_sharing_by_default_but_keep_astrology_opt_in(): void
    {
        $primary = User::factory()->create();
        $primary->cycleProfile()->create(['timezone' => 'UTC', 'relationship_role' => 'tracker']);

        $this->actingAs($primary)->postJson('/api/relationships/invite', [
            'relationship_type' => 'observer',
        ])->assertCreated();

        $relationship = Relationship::where('user_one_id', $primary->id)->latest()->first();
        $preferences = $relationship->sharing_preferences[(string) $primary->id];
        $this->assertTrue($preferences['cycle_details']);
        $this->assertFalse($preferences['pregnancy_details']);
        $this->assertTrue($preferences['wellbeing_updates']);
        $this->assertTrue($preferences['intimate_updates']);
        $this->assertFalse($preferences['astrology']);
    }

}
