<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BibleController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProjectionController;
use App\Http\Controllers\Api\ProjectionQueueController;
use App\Http\Controllers\Api\SavedPassageController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SpeechController;
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
        Route::post('/detect-from-text', [BibleController::class, 'detectFromText']);
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

    // Speech Recognition & Preacher Detection Endpoints
    Route::prefix('speech')->group(function () {
        Route::post('/process-transcript', [SpeechController::class, 'processTranscription']);
        Route::post('/detect-passage', [SpeechController::class, 'detectPassageText']);
        Route::get('/detections', [SpeechController::class, 'index']);
        Route::post('/detections', [SpeechController::class, 'store']);
        Route::get('/detections/{id}', [SpeechController::class, 'show']);
        Route::post('/detections/{id}/review', [SpeechController::class, 'review']);
    });

    // Projection Queue Endpoints
    Route::get('/projection-queues', [ProjectionQueueController::class, 'index']);
    Route::post('/projection-queues', [ProjectionQueueController::class, 'store']);
    Route::post('/projection-queues/reorder', [ProjectionQueueController::class, 'reorder']);
    Route::post('/projection-queues/clear', [ProjectionQueueController::class, 'clear']);
    Route::delete('/projection-queues/clear', [ProjectionQueueController::class, 'clear']);
    Route::delete('/projection-queues/{id}', [ProjectionQueueController::class, 'destroy']);
    Route::post('/projection-queues/{id}/project', [ProjectionQueueController::class, 'project']);

    // Dashboard & Church Service Management Endpoints
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/previous', [ServiceController::class, 'previous']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::post('/services/switch', [DashboardController::class, 'switchService']);
    Route::get('/services/{id}', [ServiceController::class, 'show']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::patch('/services/{id}', [ServiceController::class, 'update']);
    Route::post('/services/{id}/schedule', [ServiceController::class, 'schedule']);
    Route::post('/services/{id}/start', [ServiceController::class, 'start']);
    Route::post('/services/{id}/end', [ServiceController::class, 'end']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    // Protected Routes (Sanctum Token Guarded)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
};

// Available as both /api/v1/* and /api/*
Route::prefix('v1')->group($registerRoutes);
$registerRoutes();
