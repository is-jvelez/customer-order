<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    /*
     * Prefijo de rutas que Scramble documentará.
     * Documenta todas las rutas bajo /api/*
     */
    'api_path' => 'api',

    /*
     * Dominio específico de la API. null = mismo dominio de la app.
     */
    'api_domain' => null,

    /*
     * Información general del documento OpenAPI.
     */
    'info' => [
        'version'     => env('APP_VERSION', '1.0.0'),
        'description' => 'Microservicio de Clientes y Pedidos — OrderFlow',
    ],

    /*
     * Middleware aplicado a las rutas de la documentación (/docs/api, /docs/api.json).
     * Por defecto vacío: la doc es pública (no requiere JWT).
     * En producción usar RestrictedDocsAccess para limitarla.
     */
    'middleware' => [
        'web',
        // RestrictedDocsAccess::class,  // descomentar en producción
    ],

    /*
     * Extensiones personalizadas de Scramble.
     */
    'extensions' => [],
];
