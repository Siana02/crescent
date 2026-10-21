<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CycleProfileController;
use App\Http\Controllers\DailyCheckinController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PeriodLogController;
use App\Http\Controllers\PregnancyController;
use App\Http\Controllers\RelationshipController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');
Route::view('/login', 'welcome')->name('login');
Route::view('/register', 'welcome')->name('register');

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function (Request $request) {
        if (! $request->user()->cycleProfile?->onboarding_completed) {
            return redirect('/onboarding');
        }

        return view('welcome');
    })->name('dashboard');
    Route::get('/onboarding', function (Request $request) {
        if ($request->user()->cycleProfile?->onboarding_completed) {
            return redirect('/dashboard');
        }

        return view('welcome');
    })->name('onboarding');
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/api/dashboard', [DashboardController::class, 'show']);
    Route::put('/api/cycle-profile', [CycleProfileController::class, 'update']);
    Route::post('/api/periods', [PeriodLogController::class, 'store']);
    Route::post('/api/daily-checkins', [DailyCheckinController::class, 'store'])->middleware('throttle:30,1');\n    Route::put('/api/pregnancy', [PregnancyController::class, 'update']);\n    Route::post('/api/pregnancy/checkins', [PregnancyController::class, 'checkin'])->middleware('throttle:30,1');
    Route::post('/api/pregnancy/postpartum', [PregnancyController::class, 'transitionPostpartum']);
    Route::post('/api/pregnancy/postpartum-checkins', [PregnancyController::class, 'postpartumCheckin'])->middleware('throttle:30,1');
    Route::post('/api/relationships/invite', [RelationshipController::class, 'invite'])->middleware('throttle:10,1');
    Route::post('/api/relationships/accept', [RelationshipController::class, 'accept'])->middleware('throttle:10,1');
});
