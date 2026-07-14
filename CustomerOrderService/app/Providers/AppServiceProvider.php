<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        if (class_exists(\Dedoc\Scramble\Scramble::class)) {
            \Dedoc\Scramble\Scramble::extendOpenApi(function (\Dedoc\Scramble\Support\Generator\OpenApi $openApi) {
                $openApi->secure(
                    \Dedoc\Scramble\Support\Generator\SecurityScheme::http('bearer')
                );
            });
        }
    }
}
