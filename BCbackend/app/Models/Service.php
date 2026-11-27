<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'preacher_name',
        'description',
        'service_key',
        'service_date',
        'start_time',
        'end_time',
        'status',
        'started_at',
        'ended_at',
        'created_by',
    ];

    protected $casts = [
        'service_date' => 'date:Y-m-d',
        'started_at'   => 'datetime',
        'ended_at'     => 'datetime',
    ];

    /**
     * User who created or initiated the service.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Projections recorded during this service.
     */
    public function projections(): HasMany
    {
        return $this->hasMany(Projection::class);
    }

    /**
     * Pre-queued passages for this service.
     */
    public function queueItems(): HasMany
    {
        return $this->hasMany(ProjectionQueue::class);
    }

    /**
     * Spoken scripture detections captured during this service.
     */
    public function detectedReferences(): HasMany
    {
        return $this->hasMany(DetectedReference::class);
    }

    /**
     * Scope for scheduled upcoming services.
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    /**
     * Scope for currently live in-progress services.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope for completed / previous services ordered most recent first.
     */
    public function scopePrevious($query)
    {
        return $query->where('status', 'completed')
            ->orderByDesc('ended_at')
            ->orderByDesc('service_date')
            ->orderByDesc('id');
    }

    /**
     * Generate a guaranteed-unique service key for custom church services.
     */
    public static function generateUniqueKey(string $name): string
    {
        $base = Str::slug($name, '_') ?: 'church_service';
        $candidate = $base;
        $counter = 1;

        while (self::where('service_key', $candidate)->exists()) {
            $candidate = "{$base}_{$counter}";
            $counter++;
        }

        return $candidate;
    }

    /**
     * Standard predefined services requested for BibleCast:
     * - 1st Service
     * - 2nd Service
     * - Tuesday Service
     * - Thursday Service
     */
    public static function defaultServices(): array
    {
        return [
            [
                'service_key' => '1st_service',
                'name'        => '1st Service',
                'status'      => 'in_progress',
                'start_time'  => '08:00:00',
            ],
            [
                'service_key' => '2nd_service',
                'name'        => '2nd Service',
                'status'      => 'scheduled',
                'start_time'  => '10:30:00',
            ],
            [
                'service_key' => 'tuesday_service',
                'name'        => 'Tuesday Service',
                'status'      => 'scheduled',
                'start_time'  => '18:00:00',
            ],
            [
                'service_key' => 'thursday_service',
                'name'        => 'Thursday Service',
                'status'      => 'scheduled',
                'start_time'  => '18:00:00',
            ],
        ];
    }

    /**
     * Ensure the 4 default services exist in the database.
     */
    public static function seedDefaultsIfNeeded(): void
    {
        $today = now()->toDateString();
        $defaults = self::defaultServices();

        foreach ($defaults as $def) {
            self::firstOrCreate(
                ['service_key' => $def['service_key']],
                [
                    'name'         => $def['name'],
                    'status'       => $def['status'],
                    'service_date' => $today,
                    'start_time'   => $def['start_time'],
                    'started_at'   => $def['status'] === 'in_progress' ? now() : null,
                ]
            );
        }
    }
}
