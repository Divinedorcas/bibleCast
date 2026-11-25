<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'name',
        'service_key',
        'service_date',
        'start_time',
        'end_time',
        'status',
        'created_by',
    ];

    protected $casts = [
        'service_date' => 'date',
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

        foreach ($defaults as $index => $def) {
            self::firstOrCreate(
                ['service_key' => $def['service_key']],
                [
                    'name'         => $def['name'],
                    'status'       => $def['status'],
                    'service_date' => $today,
                    'start_time'   => $def['start_time'],
                ]
            );
        }
    }
}
