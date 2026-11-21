<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BibleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| BibleCast REST API endpoints. Registered under both /api/* and /api/v1/*.
|
*/


    // Public Authentication Endpoints
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Bible & Scripture Lookup Endpoints
    Route::prefix('bible')->group(function () {
        Route::get('/translations', [BibleController::class, 'translations']);
        Route::get('/passage', [BibleController::class, 'passage']);
        Route::get('/search', [BibleController::class, 'search']);
        Route::post('/parse-reference', [BibleController::class, 'parseReference']);
    });

    // Protected Routes (Sanctum Token Guarded)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });




