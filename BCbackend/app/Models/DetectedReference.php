<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetectedReference extends Model
{
    use HasFactory;

    protected $table = 'detected_references';

    protected $fillable = [
        'service_id',
        'transcript_snippet',
        'detected_reference',
        'translation_code',
        'passage_text',
        'verses_json',
        'confidence_score',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'verses_json'      => 'array',
        'confidence_score' => 'float',
        'reviewed_at'      => 'datetime',
    ];

    /**
     * Associated church service.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Operator user who reviewed this detection.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Scope for pending detections awaiting operator review.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved detections.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected detections.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Approve the detection.
     */
    public function approve(?int $userId = null): bool
    {
        $this->status = 'approved';
        $this->reviewed_by = $userId;
        $this->reviewed_at = now();

        return $this->save();
    }

    /**
     * Reject the detection.
     */
    public function reject(?int $userId = null): bool
    {
        $this->status = 'rejected';
        $this->reviewed_by = $userId;
        $this->reviewed_at = now();

        return $this->save();
    }
}
