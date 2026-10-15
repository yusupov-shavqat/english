<?php

namespace App\Providers;

use App\Contracts\EnglishTutor;
use App\Services\OpenAi;
use App\Services\Tutor\MockTutor;
use App\Services\Tutor\OpenAiTutor;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(OpenAi::class, fn () => new OpenAi(config('services.ai.key')));

        $this->app->bind(EnglishTutor::class, fn ($app) => match (config('services.ai.provider')) {
            'openai' => new OpenAiTutor($app->make(OpenAi::class), config('services.ai.model')),
            'mock' => new MockTutor,
            default => throw new InvalidArgumentException('Unknown AI_PROVIDER: '.config('services.ai.provider')),
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
