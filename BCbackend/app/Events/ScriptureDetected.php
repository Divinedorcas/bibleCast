<?php

namespace App\Events;

use App\Models\DetectedReference;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScriptureDetected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public DetectedReference $detection;
    public array $passageData;

    /**
     * Create a new event instance.
     *
     * @param  DetectedReference  $detection
     * @param  array  $passageData
     */
    public function __construct(DetectedReference $detection, array $passageData = [])
    {
        $this->detection   = $detection;
        $this->passageData = $passageData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * Broadcasts to operator review channels and the active service channel.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('operator.detections'),
            new PrivateChannel('projector.display'),
        ];

        if ($this->detection->service_id) {
            $channels[] = new PrivateChannel('service.' . $this->detection->service_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ScriptureDetected';
    }

    /**
     * Data to broadcast with the event.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'detection_id'       => $this->detection->id,
            'reference'          => $this->detection->detected_reference,
            'translation'        => $this->detection->translation_code,
            'transcript_snippet' => $this->detection->transcript_snippet,
            'confidence_score'   => (float) $this->detection->confidence_score,
            'status'             => $this->detection->status,
            'service_id'         => $this->detection->service_id,
            'passage_text'       => $this->detection->passage_text,
            'verses'             => $this->detection->verses_json ?? ($this->passageData['verses'] ?? []),
            'timestamp'          => now()->toIso8601String(),
        ];
    }
}
