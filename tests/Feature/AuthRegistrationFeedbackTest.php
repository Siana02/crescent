<?php

namespace Tests\Feature;

use App\Models\Relationship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRegistrationFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_rejects_an_existing_email_without_creating_a_duplicate_account(): void
    {
        $existingUser = User::factory()->create(['email' => 'support@example.test']);

        $response = $this->postJson('/auth/register', [
            'name' => 'Support Partner',
            'email' => $existingUser->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'relationship_role' => 'support',
            'registration_intent' => 'support',
            'invite_code' => 'MOONSTAR',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertSame(1, User::where('email', $existingUser->email)->count());
    }

    public function test_an_accepted_invitation_cannot_be_previewed_or_reused(): void
    {
        $primary = User::factory()->create();
        $support = User::factory()->create();

        Relationship::create([
            'user_one_id' => $primary->id,
            'user_two_id' => $support->id,
            'relationship_type' => 'observer',
            'status' => 'accepted',
            'invite_code' => 'MOONSTAR',
            'accepted_at' => now(),
            'expires_at' => now()->addDays(6),
        ]);

        $this->getJson('/auth/invitation-preview?code=MOONSTAR')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertDatabaseHas('relationships', [
            'invite_code' => 'MOONSTAR',
            'status' => 'accepted',
            'user_two_id' => $support->id,
        ]);
    }
}
