<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AstrologyChartTest extends TestCase
{
    use RefreshDatabase;

    public function test_cosmyday_natal_response_maps_moon_and_ascendant_signs(): void
    {
        Cache::flush();

        Http::fake([
            'api.cosmyday.com/search-location*' => Http::response([
                ['name' => 'Nairobi, Kenya', 'lat' => -1.2864, 'lon' => 36.8172],
            ], 200),
            'api.cosmyday.com/natal' => Http::response([
                'sunSign' => 'Leo',
                'moonSign' => 'Cancer',
                'risingSign' => 'Virgo',
                'planets' => [
                    ['planetName' => 'Sun', 'signName' => 'Leo', 'degree' => 2.5],
                    ['planetName' => 'Moon', 'signName' => 'Cancer', 'degree' => 14.2],
                    ['planetName' => 'Mars', 'signName' => 'Gemini', 'degree' => 9.1],
                ],
                'houses' => ['ascendant' => 161.0],
            ], 200),
        ]);

        $user = User::factory()->create();
        $this->actingAs($user)->putJson('/api/cycle-profile', [
            'cycle_regularity' => 'unknown',
            'timezone' => 'Africa/Nairobi',
            'birth_date' => '1998-07-25',
            'birth_time' => '08:35',
            'birth_place' => 'Nairobi, Kenya',
            'wants_astrology' => true,
        ])->assertOk();

        $this->actingAs($user)->getJson('/api/astrology/chart')
            ->assertOk()
            ->assertJsonPath('birth_time_known', true)
            ->assertJsonPath('placements.0.name', 'Sun')
            ->assertJsonPath('placements.0.sign', 'Leo')
            ->assertJsonFragment(['name' => 'Moon', 'sign' => 'Cancer', 'degree' => 14.2, 'house' => null, 'retrograde' => false])
            ->assertJsonFragment(['name' => 'Ascendant', 'sign' => 'Virgo']);

        $this->assertDatabaseHas('cycle_profiles', [
            'user_id' => $user->id,
            'moon_sign' => 'Cancer',
            'rising_sign' => 'Virgo',
        ]);
    }
}
