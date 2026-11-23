<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5175')],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
