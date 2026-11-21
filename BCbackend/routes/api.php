<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BibleController;
use App\Http\Controllers\Api\ProjectionController;
use App\Http\Controllers\Api\SavedPassageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| BibleCast REST API endpoints. Registered under both /api/* and /api/v1/*.
|
*/

$registerRoutes = function () {
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

    // Saved Passages / Favourites Endpoints
    Route::get('/saved-passages', [SavedPassageController::class, 'index']);
    Route::post('/saved-passages', [SavedPassageController::class, 'store']);
    Route::delete('/saved-passages/{id}', [SavedPassageController::class, 'destroy']);

    // Live Projection & History Endpoints
    Route::get('/projections/history', [ProjectionController::class, 'history']);
    Route::get('/projections/current', [ProjectionController::class, 'current']);
    Route::post('/projections', [ProjectionController::class, 'store']);
    Route::post('/projections/clear', [ProjectionController::class, 'clear']);

    // Protected Routes (Sanctum Token Guarded)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
};

// Available as both /api/v1/* and /api/*
Route::prefix('v1')->group($registerRoutes);
$registerRoutes();
