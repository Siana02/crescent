<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AstrologyController extends Controller
{
    private const BASE_URL = 'https://api.cosmyday.com';

    private function client()
    {
        return Http::acceptJson()->withUserAgent('CrescentApp/1.0 (astrology integration)')->timeout(12);
    }

    public function chart(Request $request): JsonResponse
    {
        $profile = $request->user()->cycleProfile;
        if (! $profile?->birth_date || ! $profile?->birth_place) {
            return response()->json([
                'message' => 'Add your birth date and birthplace in Profile & settings to calculate your chart.',
                'needs_birth_details' => true,
            ], 422);
        }

        $birthDate = $profile->birth_date->format('Y-m-d');
        $birthTimeKnown = filled($profile->birth_time);
        $hour = $birthTimeKnown ? (int) substr($profile->birth_time, 0, 2) : 12;
        $minute = $birthTimeKnown ? (int) substr($profile->birth_time, 3, 2) : 0;
        $locationKey = 'cosmyday:location:'.hash('sha256', Str::lower(trim($profile->birth_place)));

        try {
            $location = Cache::remember($locationKey, now()->addDays(30), function () use ($profile) {
                $response = RateLimiter::attempt('cosmyday:location-search', 1, fn () => $this->client()->get(self::BASE_URL.'/search-location', ['q' => $profile->birth_place]), 1);
                if ($response === false) {
                    throw new \\RuntimeException('Birthplace lookup is busy. Please try again in a moment.');
                }
                if (! $response->successful()) {
                    throw new \RuntimeException('CosmyDay could not find that birthplace.');
                }
                $body = $response->json();
                $candidates = is_array($body) && array_is_list($body)
                    ? $body
                    : (data_get($body, 'results') ?? data_get($body, 'locations') ?? data_get($body, 'data') ?? [$body]);
                foreach ($candidates as $candidate) {
                    $lat = data_get($candidate, 'lat', data_get($candidate, 'latitude'));
                    $lon = data_get($candidate, 'lon', data_get($candidate, 'lng', data_get($candidate, 'longitude')));
                    if (is_numeric($lat) && is_numeric($lon)) {
                        return ['lat' => (float) $lat, 'lon' => (float) $lon, 'label' => data_get($candidate, 'display_name', data_get($candidate, 'name', $profile->birth_place))];
                    }
                }
                throw new \RuntimeException('We could not match that birthplace. Try a city and country, such as Nairobi, Kenya.');
            });

            $cacheKey = 'cosmyday:natal:'.hash('sha256', implode('|', [$birthDate, $profile->birth_time ?? 'unknown-time', $location['lat'], $location['lon']]));
            $chart = Cache::remember($cacheKey, now()->addDays(30), function () use ($birthDate, $hour, $minute, $location) {
                [$year, $month, $day] = array_map('intval', explode('-', $birthDate));
                $response = $this->client()->post(self::BASE_URL.'/natal', [
                    'year' => $year, 'month' => $month, 'day' => $day,
                    'hour' => $hour, 'minute' => $minute, 'lat' => $location['lat'], 'lon' => $location['lon'],
                ]);
                if (! $response->successful()) {
                    throw new \RuntimeException('The astrology service could not calculate this chart right now.');
                }
                return $response->json();
            });

            $placements = $this->normalisePlacements($chart);
            $signs = [];
            foreach ($placements as $placement) {
                $name = Str::lower($placement['name']);
                if (str_contains($name, 'sun')) {
                    $signs['sun_sign'] = $placement['sign'];
                } elseif (str_contains($name, 'moon')) {
                    $signs['moon_sign'] = $placement['sign'];
                } elseif (str_contains($name, 'ascendant') || $name === 'rising' || $name === 'asc') {
                    $signs['rising_sign'] = $placement['sign'];
                }
            }
            if (! $birthTimeKnown) {
                unset($signs['rising_sign']);
            }
            if ($signs !== []) {
                $profile->forceFill($signs)->save();
            }

            return response()->json([
                'chart' => $chart, 'placements' => $placements, 'birth_time_known' => $birthTimeKnown,
                'birthplace' => $location['label'] ?? $profile->birth_place,
                'calculated_at' => now()->toIso8601String(), 'source' => 'CosmyDay', 'source_url' => 'https://cosmyday.com',
            ]);
        } catch (ConnectionException $exception) {
            report($exception);
            return response()->json(['message' => 'The astrology service is taking a little rest. Please try again soon.'], 503);
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json([
                'message' => $exception instanceof \RuntimeException ? $exception->getMessage() : 'We could not calculate your chart right now. Please try again soon.',
            ], 503);
        }
    }

    public function daily(Request $request): JsonResponse
    {
        $sign = Str::lower((string) $request->user()->cycleProfile?->sun_sign);
        $allowed = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        if (! in_array($sign, $allowed, true)) {
            return response()->json(['message' => 'Add your birthday in Profile & settings to see your Sun-sign reading.'], 422);
        }

        return $this->cachedGet('cosmyday:content:daily:'.$sign, now()->addHours(24), '/content/daily/'.$sign);
    }

    public function events(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', 'integer', 'between:1,180'],
            'min_importance' => ['sometimes', 'integer', 'between:0,100'],
            'limit' => ['sometimes', 'integer', 'between:1,100'],
        ]);
        $days = (int) ($validated['days'] ?? 30);
        $importance = (int) ($validated['min_importance'] ?? 40);
        $limit = (int) ($validated['limit'] ?? 30);
        $key = 'cosmyday:events:'.$days.':'.$importance.':'.$limit;
        return $this->cachedGet($key, now()->addHours(12), '/events/upcoming', [
            'days' => $days, 'min_importance' => $importance, 'limit' => $limit,
        ]);
    }

    public function transit(): JsonResponse
    {
        return $this->cachedGet('cosmyday:content:transit', now()->addHours(24), '/content/transit');
    }

    private function cachedGet(string $key, \DateTimeInterface $expiresAt, string $path, array $query = []): JsonResponse
    {
        try {
            $payload = Cache::remember($key, $expiresAt, function () use ($path, $query) {
                $response = $this->client()->get(self::BASE_URL.$path, $query);
                if (! $response->successful()) {
                    throw new \RuntimeException('The astrology service could not load this information right now.');
                }
                return $response->json();
            });
            return response()->json(['data' => $payload, 'source' => 'CosmyDay', 'source_url' => 'https://cosmyday.com']);
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json(['message' => 'Cosmic updates are temporarily unavailable. Please try again soon.'], 503);
        }
    }

    private function normalisePlacements(array $payload): array
    {
        $candidates = data_get($payload, 'planets')
            ?? data_get($payload, 'placements')
            ?? data_get($payload, 'planetary_positions')
            ?? data_get($payload, 'data.planets')
            ?? data_get($payload, 'data.placements')
            ?? data_get($payload, 'data.planetary_positions')
            ?? data_get($payload, 'natal_chart.planets')
            ?? data_get($payload, 'chart.planets')
            ?? [];
        if (! is_array($candidates)) {
            return [];
        }
        $placements = [];
        foreach ($candidates as $key => $item) {
            if (! is_array($item)) {
                continue;
            }
            $name = data_get($item, 'name', data_get($item, 'planet', data_get($item, 'body', is_string($key) ? $key : '')));
            $sign = data_get($item, 'sign', data_get($item, 'zodiac_sign', data_get($item, 'sign_name')));
            if (is_array($sign)) {
                $sign = data_get($sign, 'name', data_get($sign, 'label', data_get($sign, 'sign')));
            }
            if (! is_string($name) || ! is_string($sign) || $name === '' || $sign === '') {
                continue;
            }
            $placements[] = [
                'name' => $name, 'sign' => Str::title($sign),
                'degree' => data_get($item, 'degree', data_get($item, 'position.degree')),
                'house' => data_get($item, 'house'),
                'retrograde' => (bool) data_get($item, 'retrograde', data_get($item, 'is_retrograde', false)),
            ];
        }
        $ascendant = data_get($payload, 'ascendant')
            ?? data_get($payload, 'angles.ascendant')
            ?? data_get($payload, 'chart.ascendant')
            ?? data_get($payload, 'natal_chart.ascendant');
        if (is_array($ascendant)) {
            $ascendantSign = data_get($ascendant, 'sign', data_get($ascendant, 'zodiac_sign', data_get($ascendant, 'sign_name')));
            if (is_string($ascendantSign) && $ascendantSign !== '') {
                $placements[] = [
                    'name' => 'Ascendant',
                    'sign' => Str::title($ascendantSign),
                    'degree' => data_get($ascendant, 'degree', data_get($ascendant, 'position.degree')),
                    'house' => 1,
                    'retrograde' => false,
                ];
            }
        } elseif (is_string($ascendant) && $ascendant !== '') {
            $placements[] = ['name' => 'Ascendant', 'sign' => Str::title($ascendant), 'degree' => null, 'house' => 1, 'retrograde' => false];
        }

        if (! collect($placements)->contains(fn ($placement) => Str::lower($placement['name']) === 'ascendant')) {
            $houses = data_get($payload, 'houses', data_get($payload, 'house_cusps', data_get($payload, 'chart.houses', [])));
            if (is_array($houses)) {
                foreach ($houses as $index => $house) {
                    if (! is_array($house)) {
                        continue;
                    }
                    $number = (int) data_get($house, 'house', data_get($house, 'number', is_numeric($index) ? ((int) $index + (array_is_list($houses) ? 1 : 0)) : 0));
                    $houseSign = data_get($house, 'sign', data_get($house, 'zodiac_sign', data_get($house, 'sign_name')));
                    if ($number === 1 && is_string($houseSign) && $houseSign !== '') {
                        $placements[] = ['name' => 'Ascendant', 'sign' => Str::title($houseSign), 'degree' => data_get($house, 'degree'), 'house' => 1, 'retrograde' => false];
                        break;
                    }
                }
            }
        }

        return $placements;
    }
}
