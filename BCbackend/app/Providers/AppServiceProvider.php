<?php

namespace App\Providers;

use App\Services\Bible\BibleApiService;
use App\Services\Bible\BibleProviderInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(BibleProviderInterface::class, BibleApiService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
