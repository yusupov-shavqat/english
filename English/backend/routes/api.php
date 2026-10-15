<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\SpeechController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/units', [UnitController::class, 'index']);
    Route::get('/units/{slug}', [UnitController::class, 'show']);
    Route::post('/speech/url', [SpeechController::class, 'url'])->middleware('throttle:120,1');

    Route::middleware('throttle:60,1')->group(function () {
        Route::post('/chat/start', [ChatController::class, 'start']);
        Route::post('/chat/{conversation}/turn', [ChatController::class, 'turn']);
        Route::post('/chat/{conversation}/finish', [ChatController::class, 'finish']);
    });
});

// Played by an <audio> element, which cannot send the auth header, so the link itself is signed.
Route::get('/speech/speak', [SpeechController::class, 'speak'])
    ->middleware(['signed:relative', 'throttle:60,1'])
    ->name('speech.speak');
