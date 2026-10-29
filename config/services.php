<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'webpush' => [
        'public_key' => env('VAPID_PUBLIC_KEY') ?: (\App\Support\VapidKeys::derive(env('APP_KEY'))['public'] ?? null),
        'private_key' => env('VAPID_PRIVATE_KEY') ?: (\App\Support\VapidKeys::derive(env('APP_KEY'))['private'] ?? null),
        'subject' => env('VAPID_SUBJECT') ?: (str_starts_with((string) env('APP_URL'), 'https://') ? env('APP_URL') : 'mailto:admin@example.com'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
