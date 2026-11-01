<?php

namespace Tests\Feature;

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
        $previousStart = today()->subDays(28)->toDateString();
        $previousEnd = today()->subDays(25)->toDateString();
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
}
