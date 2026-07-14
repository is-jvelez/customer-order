<?php

return [
    'paths'                    => ['api/*'],
    'allowed_methods'          => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins'          => ['http://localhost:4200'],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['Authorization', 'Content-Type', 'Accept'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
