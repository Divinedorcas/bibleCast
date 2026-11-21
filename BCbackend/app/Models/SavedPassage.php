<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedPassage extends Model
{
    protected $fillable = [
        'user_id',
        'reference',
        'translation_code',
        'label',
        'passage_text',
        'verses_json',
    ];

    protected $casts = [
        'verses_json' => 'array',
    ];

    /**
     * User who saved this passage.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
