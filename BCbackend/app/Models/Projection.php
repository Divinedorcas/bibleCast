<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Projection extends Model
{
    protected $fillable = [
        'service_id',
        'user_id',
        'reference',
        'translation_code',
        'passage_text',
        'verses_json',
        'status',
        'mode',
        'projected_at',
        'cleared_at',
    ];

    protected $casts = [
        'verses_json'  => 'array',
        'projected_at' => 'datetime',
        'cleared_at'   => 'datetime',
    ];

    /**
     * Operator who projected this passage.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: current active projection.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'projected')->latest('projected_at');
    }

    /**
     * Scope: history ordered chronologically reverse.
     */
    public function scopeHistory($query)
    {
        return $query->orderBy('projected_at', 'desc')->orderBy('id', 'desc');
    }
}
