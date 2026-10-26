<?php

namespace Tests\Feature;

use App\Models\CycleProfile;
use App\Models\DailyCheckin;
use App\Models\NotificationPreference;
use App\Models\PushSubscription;
use App\Models\Relationship;
use App\Models\User;
use App\Services\CrescentPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class SupportPartnerNudgeTest extends TestCase
{
    use RefreshDatabase;

    private function makeConnection(): array
    {
        $primary = User::factory()->create(['name' => 'Lyrra Example']);
        $support = User::factory()->create(['name' => 'Sean Example']);
        CycleProfile::create(['user_id' => $primary->id, 'relationship_role' => 'tracker', 'display_name' => 'Lyrra', 'timezone' => 'Africa/Nairobi']);
        CycleProfile::create(['user_id' => $support->id, 'relationship_role' => 'support', 'display_name' => 'Sean', 'timezone' => 'Africa/Nairobi']);
        $relationship = Relationship::create([
            'user_one_id' => $primary->id,
            'user_two_id' => $support->id,
            'relationship_type' => 'observer',
            'status' => 'accepted',
            'invite_code' => 'NUDGE123',
            'sharing_preferences' => [(string) $primary->id => ['cycle_details' => true, 'pregnancy_details' => false, 'wellbeing_updates' => true, 'astrology' => false]],
            'accepted_at' => now(),
        ]);
        return [$primary, $support, $relationship];
    }

    public function test_support_partner_can_nudge_primary_when_no_checkin_has_been_logged_today(): void
    {
        [$primary, $support, $relationship] = $this->makeConnection();
        NotificationPreference::create(['user_id' => $primary->id, 'push_enabled' => true, 'daily_checkin_reminders' => true]);
        PushSubscription::create(['user_id' => $primary->id, 'endpoint_hash' => hash('sha256', 'https://push.example.test/lyrra'), 'endpoint' => 'https://push.example.test/lyrra', 'public_key' => 'public-key', 'auth_token' => 'auth-token', 'content_encoding' => 'aes128gcm']);
        config(['services.webpush.public_key' => 'public', 'services.webpush.private_key' => 'private', 'services.webpush.subject' => 'mailto:hello@example.test']);
        $push = Mockery::mock(CrescentPushService::class);
        $push->shouldReceive('notify')->once()->with($primary->id, 'symptom_nudge', 'Sean')->andReturn(true);
        $this->app->instance(CrescentPushService::class, $push);

        $this->actingAs($support)->postJson('/api/relationships/'.$relationship->id.'/nudge')
            ->assertAccepted()
            ->assertJsonPath('message', 'A gentle nudge has been sent to Lyrra.');
    }

    public function test_support_partner_cannot_nudge_if_primary_has_already_checked_in_today(): void
    {
        [$primary, $support, $relationship] = $this->makeConnection();
        $today = now('Africa/Nairobi')->toDateString();
        DailyCheckin::create(['user_id' => $primary->id, 'log_date' => $today, 'symptoms' => ['fatigue']]);

        $this->actingAs($support)->postJson('/api/relationships/'.$relationship->id.'/nudge')
            ->assertStatus(409)
            ->assertJsonPath('message', 'Lyrra has already shared a check-in today.');
    }

    public function test_unrelated_user_cannot_send_a_support_partner_nudge(): void
    {
        [, , $relationship] = $this->makeConnection();
        $otherUser = User::factory()->create();

        $this->actingAs($otherUser)->postJson('/api/relationships/'.$relationship->id.'/nudge')->assertNotFound();
    }

    public function test_nudge_requires_primary_partner_to_enable_wellbeing_sharing(): void
    {
        [$primary, $support, $relationship] = $this->makeConnection();
        $sharing = $relationship->sharing_preferences;
        $sharing[(string) $primary->id]['wellbeing_updates'] = false;
        $relationship->update(['sharing_preferences' => $sharing]);

        $this->actingAs($support)->postJson('/api/relationships/'.$relationship->id.'/nudge')->assertForbidden();
    }
}
