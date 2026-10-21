<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CycleDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_data_is_private_to_authenticated_users(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();

        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/dashboard?timezone=Africa%2FNairobi')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('profile.average_cycle_length', 28)
            ->assertJsonPath('latest_period', null);
    }

    public function test_user_can_save_period_start_and_get_a_cycle_estimate(): void
    {
        $user = User::factory()->create();
        $startDate = today('Africa/Nairobi')->subDays(4)->toDateString();

        $this->actingAs($user)
            ->putJson('/api/cycle-profile', [
                'average_cycle_length' => 30,
                'average_period_length' => 5,
                'timezone' => 'Africa/Nairobi',
            ])
            ->assertOk()
            ->assertJsonPath('profile.average_cycle_length', 30);

        $this->postJson('/api/periods', ['start_date' => $startDate])
            ->assertCreated()
            ->assertJsonPath('period.start_date', $startDate);

        $this->getJson('/api/dashboard?timezone=Africa%2FNairobi')
            ->assertOk()
            ->assertJsonPath('cycle_day', 5)
            ->assertJsonPath('estimated_next_period', today('Africa/Nairobi')->addDays(26)->toDateString())
            ->assertJsonPath('latest_period.start_date', $startDate);
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
