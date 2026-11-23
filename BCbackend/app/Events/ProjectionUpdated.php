<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $reference;
    public string $translation;
    public string $passageText;
    public string $status;
    public string $timestamp;
    public array $verses;
    public ?string $tokenHash;
    public ?string $operatorName;

    /**
     * Create a new event instance.
     *
     * @param  string  $reference
     * @param  string  $translation
     * @param  string  $passageText
     * @param  string  $status
     * @param  string|null  $timestamp
     * @param  array  $verses
     * @param  string|null  $tokenHash
     * @param  string|null  $operatorName
     */
    public function __construct(
        string $reference,
        string $translation = 'kjv',
        string $passageText = '',
        string $status = 'projected',
        ?string $timestamp = null,
        array $verses = [],
        ?string $tokenHash = null,
        ?string $operatorName = null
    ) {
        $this->reference    = $reference;
        $this->translation  = $translation;
        $this->passageText  = $passageText;
        $this->status       = $status;
        $this->timestamp    = $timestamp ?? now()->toIso8601String();
        $this->verses       = $verses;
        $this->tokenHash    = $tokenHash;
        $this->operatorName = $operatorName;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * Broadcasts to the authorized projector display channel.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('projector.display'),
        ];

        if ($this->tokenHash) {
            $channels[] = new PrivateChannel('projector.display.' . $this->tokenHash);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ProjectionUpdated';
    }

    /**
     * Data to broadcast with the event.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'reference'         => $this->reference,
            'translation'       => $this->translation,
            'passage_text'      => $this->passageText,
            'status'            => $this->status,
            'projection_status' => $this->status,
            'timestamp'         => $this->timestamp,
            'verses'            => $this->verses,
            'operator_name'     => $this->operatorName,
        ];
    }
}
