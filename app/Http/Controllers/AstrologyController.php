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
                    throw new \RuntimeException('Birthplace lookup is busy. Please try again in a moment.');
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

            $cacheKey = 'cosmyday:natal:v2:'.hash('sha256', implode('|', [$birthDate, $profile->birth_time ?? 'unknown-time', $location['lat'], $location['lon']]));
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

    public function sky(): JsonResponse
    {
        $moment = now('UTC');
        $key = 'cosmyday:sky:'.$moment->format('YmdH');

        try {
            $chart = Cache::remember($key, now()->addHour(), function () use ($moment) {
                $response = $this->client()->post(self::BASE_URL.'/natal', [
                    'year' => (int) $moment->format('Y'),
                    'month' => (int) $moment->format('n'),
                    'day' => (int) $moment->format('j'),
                    'hour' => (int) $moment->format('G'),
                    'minute' => (int) $moment->format('i'),
                    'lat' => 0.0,
                    'lon' => 0.0,
                ]);
                if (! $response->successful()) {
                    throw new \RuntimeException('The current sky could not be calculated right now.');
                }
                return $response->json();
            });

            $placements = array_values(array_map(
                fn (array $placement) => array_merge($placement, ['house' => null]),
                array_filter(
                    $this->normalisePlacements($chart),
                    fn (array $placement) => ! in_array(Str::lower($placement['name']), ['ascendant', 'rising', 'asc'], true)
                )
            ));

            return response()->json([
                'placements' => $placements,
                'calculated_at' => $moment->toIso8601String(),
                'source' => 'CosmyDay',
                'source_url' => 'https://cosmyday.com',
                'note' => 'Planetary sign positions are calculated for the current UTC hour. House cusps and Ascendant are intentionally omitted from this global sky view.',
            ]);
        } catch (\Throwable $exception) {
            report($exception);
            return response()->json(['message' => 'The current sky is temporarily unavailable. Please try again soon.'], 503);
        }
    }

    public function daily(Request $request): JsonResponse
    {
        $sign = Str::lower((string) $request->user()->cycleProfile?->sun_sign);
        $allowed = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        if (! in_array($sign, $allowed, true)) {
            return response()->json(['message' => 'Add your birthday in Profile & settings to see your Sun-sign reading.'], 422);
        }

        return $this->cachedGet('cosmyday:content:daily:'.$sign.':'.now()->format('Ymd'), now()->addDay()->startOfDay(), '/content/daily/'.$sign);
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
        return $this->cachedGet('cosmyday:content:transit:'.now()->format('Ymd'), now()->addDay()->startOfDay(), '/content/transit');
    }

    public function moon(): JsonResponse
    {
        return $this->cachedGet('cosmyday:content:moon:'.now()->format('Ymd'), now()->addDay()->startOfDay(), '/content/moon');
    }

    public function weekAhead(Request $request): JsonResponse
    {
        $primary = $this->cachedGet(
            'cosmyday:content:week-ahead:'.now()->format('Ymd'),
            now()->addDay()->startOfDay(),
            '/content/week-ahead'
        );
        $payload = $primary->getData(true);
        $data = is_array($payload) ? ($payload['data'] ?? null) : null;
        if ($primary->getStatusCode() < 400 && is_array($data) && $data !== []) {
            return $primary;
        }

        // The seven-day overview can occasionally be unavailable while per-sign
        // weekly content is still live. Prefer the user's saved Sun sign as a
        // useful fallback instead of returning an empty card.
        $sign = Str::lower((string) $request->user()->cycleProfile?->sun_sign);
        $allowed = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        if (in_array($sign, $allowed, true)) {
            $weeklySign = $this->cachedGet(
                'cosmyday:content:weekly-sign:'.$sign.':'.now()->format('o-W'),
                now()->addDays(7)->startOfDay(),
                '/content/weekly/'.$sign
            );
            $weeklyPayload = $weeklySign->getData(true);
            if ($weeklySign->getStatusCode() < 400 && is_array($weeklyPayload) && ! empty($weeklyPayload['data'])) {
                return $weeklySign;
            }

            // Last fallback: the API also exposes all twelve weekly readings.
            $allSigns = $this->cachedGet(
                'cosmyday:content:weekly-all:'.now()->format('o-W'),
                now()->addDays(7)->startOfDay(),
                '/content/weekly'
            );
            $allPayload = $allSigns->getData(true);
            $allData = is_array($allPayload) ? ($allPayload['data'] ?? null) : null;
            if ($allSigns->getStatusCode() < 400 && is_array($allData)) {
                $reading = data_get($allData, $sign)
                    ?? data_get($allData, 'horoscopes.'.$sign)
                    ?? data_get($allData, 'signs.'.$sign)
                    ?? data_get($allData, 'data.'.$sign);
                if (is_array($reading) || is_string($reading)) {
                    return response()->json([
                        'data' => $reading,
                        'source' => 'CosmyDay',
                        'source_url' => 'https://cosmyday.com',
                    ]);
                }
            }
        }

        return $primary;
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
        $roots = [];
        $queue = [$payload];
        $seen = [];
        while ($queue !== [] && count($roots) < 12) {
            $root = array_shift($queue);
            if (! is_array($root)) {
                continue;
            }
            $fingerprint = md5(serialize(array_keys($root)));
            if (isset($seen[$fingerprint])) {
                continue;
            }
            $seen[$fingerprint] = true;
            $roots[] = $root;
            foreach (['data', 'result', 'output', 'chart', 'natal', 'natal_chart', 'natalChart', 'birth_chart', 'birthChart', 'chart_data', 'chartData'] as $key) {
                if (isset($root[$key]) && is_array($root[$key])) {
                    $queue[] = $root[$key];
                }
            }
        }

        $placements = [];
        foreach ($roots as $root) {
            foreach ([
                ['Sun', ['sun_sign', 'sunSign', 'sun.sign', 'sun.zodiac_sign', 'sun.zodiacSign']],
                ['Moon', ['moon_sign', 'moonSign', 'moon.sign', 'moon.zodiac_sign', 'moon.zodiacSign']],
                ['Ascendant', ['rising_sign', 'risingSign', 'ascendant_sign', 'ascendantSign', 'ascendant.sign', 'ascendant.zodiac_sign', 'angles.ascendant.sign']],
            ] as [$name, $paths]) {
                foreach ($paths as $path) {
                    $value = data_get($root, $path);
                    if ($value !== null) {
                        $detailKeys = $name === 'Ascendant'
                            ? ['ascendant', 'rising', 'asc']
                            : [Str::lower($name)];
                        $details = [];
                        foreach ($detailKeys as $detailKey) {
                            $candidateDetails = data_get($root, $detailKey);
                            if (is_array($candidateDetails)) {
                                $details = $candidateDetails;
                                break;
                            }
                            $degreeValue = data_get($root, $detailKey.'_degree')
                                ?? data_get($root, $detailKey.'Degree')
                                ?? data_get($root, $detailKey.'_degree_in_sign')
                                ?? data_get($root, $detailKey.'DegreeInSign');
                            if ($degreeValue !== null) {
                                $details['degree'] = $degreeValue;
                            }
                        }
                        $this->addPlacement($placements, $name, $value, $details);
                        break;
                    }
                }
            }

            foreach (['planets', 'placements', 'planetary_positions', 'planetaryPositions', 'planet_positions', 'planetPositions', 'positions', 'bodies', 'celestial_bodies', 'celestialBodies'] as $key) {
                $candidates = data_get($root, $key);
                if (! is_array($candidates)) {
                    continue;
                }
                foreach ($candidates as $index => $item) {
                    if (is_string($item) && is_string($index)) {
                        $this->addPlacement($placements, $index, $item);
                        continue;
                    }
                    if (! is_array($item)) {
                        continue;
                    }
                    $name = data_get($item, 'name')
                        ?? data_get($item, 'planet')
                        ?? data_get($item, 'body')
                        ?? data_get($item, 'planet_name')
                        ?? data_get($item, 'planetName')
                        ?? data_get($item, 'body_name')
                        ?? data_get($item, 'bodyName')
                        ?? (is_string($index) ? $index : null);
                    $sign = data_get($item, 'sign')
                        ?? data_get($item, 'zodiac_sign')
                        ?? data_get($item, 'zodiacSign')
                        ?? data_get($item, 'sign_name')
                        ?? data_get($item, 'signName')
                        ?? data_get($item, 'zodiac.name')
                        ?? data_get($item, 'zodiac.sign')
                        ?? data_get($item, 'position.sign')
                        ?? data_get($item, 'position.zodiac_sign')
                        ?? data_get($item, 'position.zodiacSign');
                    $longitude = data_get($item, 'longitude')
                        ?? data_get($item, 'ecliptic_longitude')
                        ?? data_get($item, 'eclipticLongitude')
                        ?? data_get($item, 'ecliptic_longitude_degrees')
                        ?? data_get($item, 'eclipticLongitudeDegrees')
                        ?? data_get($item, 'absolute_longitude')
                        ?? data_get($item, 'absoluteLongitude')
                        ?? data_get($item, 'lon')
                        ?? data_get($item, 'lng')
                        ?? data_get($item, 'ecliptical.lon')
                        ?? data_get($item, 'ecliptical.longitude')
                        ?? data_get($item, 'position.longitude')
                        ?? data_get($item, 'position.longitude_degrees')
                        ?? data_get($item, 'position.longitudeDegrees')
                        ?? data_get($item, 'position.ecliptical.lon')
                        ?? data_get($item, 'position.ecliptic_longitude')
                        ?? data_get($item, 'position.eclipticLongitude')
                        ?? data_get($item, 'position.lon')
                        ?? data_get($item, 'position.lng');
                    if ($sign === null && is_numeric($longitude)) {
                        $sign = $this->signFromLongitude((float) $longitude);
                    }
                    if ($name !== null && $sign !== null) {
                        $this->addPlacement($placements, $name, $sign, $item);
                    }
                }
            }

            foreach (['angles', 'points', 'chart_points'] as $key) {
                $angles = data_get($root, $key);
                if (! is_array($angles)) {
                    continue;
                }
                foreach ($angles as $angle) {
                    if (! is_array($angle)) {
                        continue;
                    }
                    $name = data_get($angle, 'name', data_get($angle, 'point', data_get($angle, 'body')));
                    if (is_string($name) && (str_contains(Str::lower($name), 'asc') || str_contains(Str::lower($name), 'rising'))) {
                        $sign = data_get($angle, 'sign', data_get($angle, 'sign_name', data_get($angle, 'signName', data_get($angle, 'zodiac.name'))));
                        if ($sign === null && is_numeric(data_get($angle, 'longitude'))) {
                            $sign = $this->signFromLongitude((float) data_get($angle, 'longitude'));
                        }
                        $this->addPlacement($placements, 'Ascendant', $sign, $angle);
                    }
                }
            }

            $ascendant = data_get($root, 'ascendant')
                ?? data_get($root, 'houses.ascendant')
                ?? data_get($root, 'house_cusps.ascendant')
                ?? data_get($root, 'angles.ascendant');
            if ($ascendant !== null) {
                if (is_array($ascendant)) {
                    $sign = data_get($ascendant, 'sign')
                        ?? data_get($ascendant, 'zodiac_sign')
                        ?? data_get($ascendant, 'sign_name')
                        ?? data_get($ascendant, 'signName')
                        ?? data_get($ascendant, 'zodiac.name');
                    if ($sign === null && is_numeric(data_get($ascendant, 'longitude'))) {
                        $sign = $this->signFromLongitude((float) data_get($ascendant, 'longitude'));
                    }
                    $this->addPlacement($placements, 'Ascendant', $sign, $ascendant);
                } elseif (is_string($ascendant)) {
                    $this->addPlacement($placements, 'Ascendant', $ascendant);
                } elseif (is_numeric($ascendant)) {
                    $this->addPlacement($placements, 'Ascendant', $this->signFromLongitude((float) $ascendant));
                }
            }

            $houses = data_get($root, 'houses.cusps', data_get($root, 'houses', data_get($root, 'house_cusps', [])));
            if (is_array($houses)) {
                foreach ($houses as $index => $house) {
                    if (! is_array($house)) {
                        continue;
                    }
                    $number = (int) data_get($house, 'house', data_get($house, 'number', is_numeric($index) ? ((int) $index + (array_is_list($houses) ? 1 : 0)) : 0));
                    if ($number !== 1) {
                        continue;
                    }
                    $sign = data_get($house, 'sign')
                        ?? data_get($house, 'zodiac_sign')
                        ?? data_get($house, 'sign_name')
                        ?? data_get($house, 'signName')
                        ?? data_get($house, 'zodiac.name')
                        ?? data_get($house, 'start_cusp.zodiac.name');
                    if ($sign === null) {
                        $longitude = data_get($house, 'longitude', data_get($house, 'degree', data_get($house, 'cusp', data_get($house, 'start_cusp.degree'))));
                        if (is_numeric($longitude)) {
                            $sign = $this->signFromLongitude((float) $longitude);
                        }
                    }
                    if ($sign !== null) {
                        $this->addPlacement($placements, 'Ascendant', $sign, ['house' => 1]);
                    }
                    break;
                }
            }
        }

        return array_values($placements);
    }

    private function addPlacement(array &$placements, mixed $name, mixed $sign, array $details = []): void
    {
        if (! is_string($name) || trim($name) === '') {
            return;
        }

        $nameLower = Str::lower(trim($name));
        if (str_contains($nameLower, 'sun')) {
            $label = 'Sun';
        } elseif (str_contains($nameLower, 'moon')) {
            $label = 'Moon';
        } elseif (str_contains($nameLower, 'asc') || str_contains($nameLower, 'rising')) {
            $label = 'Ascendant';
        } else {
            $label = Str::title(str_replace(['_', '-'], ' ', trim($name)));
        }

        $signName = $this->normaliseSign($sign);
        if ($signName === null) {
            return;
        }

        // Providers use several different names/shapes for a planet's position.
        // Prefer a sign-local degree; if only absolute ecliptic longitude is
        // present, convert it to the degree within the zodiac sign.
        $degree = data_get($details, 'degree')
            ?? data_get($details, 'degrees')
            ?? data_get($details, 'degree_value')
            ?? data_get($details, 'degreeValue')
            ?? data_get($details, 'degree_in_sign')
            ?? data_get($details, 'degreeInSign')
            ?? data_get($details, 'degrees_in_sign')
            ?? data_get($details, 'degreesInSign')
            ?? data_get($details, 'sign_degree')
            ?? data_get($details, 'signDegree')
            ?? data_get($details, 'zodiac.degree')
            ?? data_get($details, 'position.degree')
            ?? data_get($details, 'position.degrees')
            ?? data_get($details, 'position.degree_in_sign')
            ?? data_get($details, 'position.degreeInSign')
            ?? data_get($details, 'position.sign_degree')
            ?? data_get($details, 'position.signDegree')
            ?? data_get($details, 'position.zodiac.degree');
        if (is_array($degree)) {
            $degree = data_get($degree, 'value') ?? data_get($degree, 'degrees') ?? data_get($degree, 'degree');
        }

        $longitude = data_get($details, 'longitude')
            ?? data_get($details, 'ecliptic_longitude')
            ?? data_get($details, 'eclipticLongitude')
            ?? data_get($details, 'ecliptic_longitude_degrees')
            ?? data_get($details, 'eclipticLongitudeDegrees')
            ?? data_get($details, 'absolute_longitude')
            ?? data_get($details, 'absoluteLongitude')
            ?? data_get($details, 'lon')
            ?? data_get($details, 'lng')
            ?? data_get($details, 'longitude_degrees')
            ?? data_get($details, 'longitudeDegrees')
            ?? data_get($details, 'absolute_degree')
            ?? data_get($details, 'absoluteDegree')
            ?? data_get($details, 'full_degree')
            ?? data_get($details, 'fullDegree')
            ?? data_get($details, 'ecliptical.lon')
            ?? data_get($details, 'ecliptical.longitude')
            ?? data_get($details, 'position.ecliptical.lon')
            ?? data_get($details, 'position.longitude')
            ?? data_get($details, 'position.longitude_degrees')
            ?? data_get($details, 'position.longitudeDegrees')
            ?? data_get($details, 'position.ecliptic_longitude')
            ?? data_get($details, 'position.eclipticLongitude')
            ?? data_get($details, 'position.ecliptic_longitude_degrees')
            ?? data_get($details, 'position.eclipticLongitudeDegrees')
            ?? data_get($details, 'position.absolute_longitude')
            ?? data_get($details, 'position.absoluteLongitude')
            ?? data_get($details, 'position.lon')
            ?? data_get($details, 'position.lng')
            ?? data_get($details, 'position.longitude.value')
            ?? data_get($details, 'ecliptical.longitude.value');
        if (is_array($longitude)) {
            $longitude = data_get($longitude, 'value') ?? data_get($longitude, 'degrees') ?? data_get($longitude, 'degree');
        }

        if (! is_numeric($degree) && is_numeric($longitude)) {
            $degree = fmod((float) $longitude + 360.0, 30.0);
        } elseif (is_numeric($degree) && abs((float) $degree) >= 30) {
            $degree = fmod((float) $degree + 360.0, 30.0);
        }
        if (is_string($degree) && preg_match('/-?\\d+(?:\\.\\d+)?/', $degree, $matches)) {
            $degree = (float) $matches[0];
        }
        $degree = is_numeric($degree) && (float) $degree >= 0 && (float) $degree < 30
            ? round((float) $degree, 2)
            : null;

        $placements[Str::lower($label)] = [
            'name' => $label,
            'sign' => $signName,
            'degree' => $degree,
            'house' => data_get($details, 'house', data_get($details, 'house_number', data_get($details, 'houseNumber'))),
            'retrograde' => (bool) data_get($details, 'retrograde', data_get($details, 'is_retrograde', data_get($details, 'isRetrograde', data_get($details, 'is_retro', false)))),
        ];
    }

    private function normaliseSign(mixed $value): ?string
    {
        if (is_array($value)) {
            $value = data_get($value, 'name')
                ?? data_get($value, 'label')
                ?? data_get($value, 'sign')
                ?? data_get($value, 'sign_name')
                ?? data_get($value, 'signName')
                ?? data_get($value, 'zodiac.name');
        }
        if (! is_string($value)) {
            return null;
        }
        $value = Str::lower(trim($value));
        $signs = [
            'aries' => 'Aries', 'taurus' => 'Taurus', 'gemini' => 'Gemini',
            'cancer' => 'Cancer', 'leo' => 'Leo', 'virgo' => 'Virgo',
            'libra' => 'Libra', 'scorpio' => 'Scorpio', 'sagittarius' => 'Sagittarius',
            'capricorn' => 'Capricorn', 'aquarius' => 'Aquarius', 'pisces' => 'Pisces',
        ];
        return $signs[$value] ?? null;
    }

    private function signFromLongitude(float $longitude): ?string
    {
        if ($longitude < 0 || $longitude > 360) {
            return null;
        }
        $signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        return $signs[((int) floor(fmod($longitude, 360.0) / 30)) % 12];
    }
}
