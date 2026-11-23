<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectionQueue extends Model
{
    protected $fillable = [
        'service_id',
        'user_id',
        'reference',
        'translation_code',
        'passage_preview',
        'passage_text',
        'verses_json',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'verses_json' => 'array',
        'sort_order'  => 'integer',
    ];

    /**
     * Operator who queued this passage.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: ordered sequence.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
    }

    /**
     * Scope: pending items.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
