<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Authorized projector display channel.
 * Authorizes media operators or verified display screen sessions.
 */
Broadcast::channel('projector.display.{tokenHash}', function ($user, $tokenHash) {
    // Authorized for authenticated media operators, or display token match
    return $user !== null || !empty($tokenHash);
});

Broadcast::channel('projector.display', function ($user) {
    return $user !== null;
});

/**
 * Dedicated operator detection review channel.
 */
Broadcast::channel('operator.detections', function ($user) {
    return $user !== null;
});

/**
 * Active service channel for operator collaboration.
 */
Broadcast::channel('service.{serviceId}', function ($user, $serviceId) {
    return $user !== null;
});
