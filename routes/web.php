<?php

use App\Http\Controllers\AstrologyController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CycleProfileController;
use App\Http\Controllers\DailyCheckinController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PeriodLogController;
use App\Http\Controllers\PregnancyController;
use App\Http\Controllers\RelationshipController;
use App\Http\Controllers\RelationshipNotesController;
use App\Http\Controllers\RelationshipInsightsController;
use App\Http\Controllers\SexLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');
Route::view('/login', 'welcome')->name('login');
Route::view('/register', 'welcome')->name('register');

Route::get('/auth/invitation-preview', [AuthController::class, 'invitationPreview'])->middleware('throttle:20,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware(['auth', 'active.account'])->group(function () {
    Route::get('/connections', fn () => view('welcome'));
    Route::get('/astrology', fn () => view('welcome'));
    Route::get('/profile', fn () => view('welcome'));
    Route::get('/settings', fn () => view('welcome'));
    Route::get('/dashboard', function (Request $request) {
        $profile = $request->user()->cycleProfile;
        if (($profile?->relationship_role ?? 'tracker') !== 'support' && ! $profile?->onboarding_completed) {
            return redirect('/onboarding');
        }

        return view('welcome');
    })->name('dashboard');
    Route::get('/onboarding', function (Request $request) {
        $isPregnancySetup = $request->query('journey') === 'pregnancy';
        if ($request->user()->cycleProfile?->onboarding_completed && ! $isPregnancySetup) {
            return redirect('/dashboard');
        }

        return view('welcome');
    })->name('onboarding');
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/api/dashboard', [DashboardController::class, 'show']);
    Route::get('/api/astrology/chart', [AstrologyController::class, 'chart'])->middleware('throttle:10,1');
    Route::get('/api/astrology/sky', [AstrologyController::class, 'sky'])->middleware('throttle:30,1');
    Route::get('/api/astrology/horoscope', [AstrologyController::class, 'daily'])->middleware('throttle:30,1');
    Route::get('/api/astrology/events', [AstrologyController::class, 'events'])->middleware('throttle:30,1');
    Route::get('/api/astrology/transit', [AstrologyController::class, 'transit'])->middleware('throttle:30,1');
    Route::get('/api/astrology/moon', [AstrologyController::class, 'moon'])->middleware('throttle:30,1');
    Route::get('/api/astrology/week-ahead', [AstrologyController::class, 'weekAhead'])->middleware('throttle:30,1');
    Route::put('/api/cycle-profile', [CycleProfileController::class, 'update']);
    Route::patch('/api/cycle-profile/astrology-consent', [CycleProfileController::class, 'astrologyConsent']);
    Route::post('/api/periods', [PeriodLogController::class, 'store']);
    Route::post('/api/daily-checkins', [DailyCheckinController::class, 'store'])->middleware('throttle:30,1');
    Route::post('/api/sex-logs', [SexLogController::class, 'store'])->middleware('throttle:30,1');
    Route::put('/api/pregnancy', [PregnancyController::class, 'update']);
    Route::post('/api/pregnancy/checkins', [PregnancyController::class, 'checkin'])->middleware('throttle:30,1');
    Route::post('/api/pregnancy/postpartum', [PregnancyController::class, 'transitionPostpartum']);
    Route::patch('/api/pregnancy/baby-details', [PregnancyController::class, 'updateBabyDetails']);
    Route::get('/api/pregnancy/reminders', [PregnancyController::class, 'reminders']);
    Route::post('/api/pregnancy/reminders', [PregnancyController::class, 'storeReminder'])->middleware('throttle:20,1');
    Route::post('/api/pregnancy/postpartum-checkins', [PregnancyController::class, 'postpartumCheckin'])->middleware('throttle:30,1');
    Route::post('/api/pregnancy/return-to-cycle', [PregnancyController::class, 'returnToCycle']);
    Route::post('/api/relationships/invite', [RelationshipController::class, 'invite'])->middleware('throttle:10,1');
    Route::post('/api/relationships/accept', [RelationshipController::class, 'accept'])->middleware('throttle:10,1');
    Route::patch('/api/relationships/{relationship}/sharing', [RelationshipController::class, 'sharing']);
    Route::post('/api/relationships/{relationship}/disconnect', [RelationshipController::class, 'disconnect']);
    Route::patch('/api/relationships/{relationship}/companion-birth-details', [RelationshipController::class, 'companionBirthDetails']);
    Route::get('/api/relationships/{relationship}/notes', [RelationshipNotesController::class, 'index']);
    Route::post('/api/relationships/{relationship}/notes', [RelationshipNotesController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/api/relationships/{relationship}/insights', [RelationshipInsightsController::class, 'show'])->middleware('throttle:20,1');
});
