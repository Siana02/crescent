<?php

namespace App\Support;

class AppVersion
{
    /** Changes whenever the front-end bundle is rebuilt, or when APP_VERSION is set. */
    public static function current(): string
    {
        if ($configured = env('APP_VERSION')) {
            return (string) $configured;
        }
        $manifest = public_path('build/manifest.json');
        return is_file($manifest) ? substr(sha1_file($manifest), 0, 12) : 'dev';
    }
}
