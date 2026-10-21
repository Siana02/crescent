<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CycleProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PeriodLogController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');
Route::view('/login', 'welcome')->name('login');
Route::view('/register', 'welcome')->name('register');

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth')->group(function () {
    Route::view('/dashboard', 'welcome')->name('dashboard');
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/api/dashboard', [DashboardController::class, 'show']);
    Route::put('/api/cycle-profile', [CycleProfileController::class, 'update']);
    Route::post('/api/periods', [PeriodLogController::class, 'store']);
});
