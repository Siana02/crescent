<?php

namespace App\Support;

class VapidKeys
{
    /**
     * Deterministically derive a VAPID key pair from APP_KEY so push works without
     * extra hosting configuration. Explicit VAPID_* environment values always win.
     *
     * @return array{public:string,private:string}|null
     */
    public static function derive(?string $appKey): ?array
    {
        if (! $appKey || ! function_exists('openssl_pkey_get_private')) {
            return null;
        }

        $scalar = hash_hmac('sha256', $appKey, 'crescent-vapid-v1', true);
        $der = "\x30\x31\x02\x01\x01\x04\x20".$scalar."\xa0\x0a\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07";
        $pem = "-----BEGIN EC PRIVATE KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END EC PRIVATE KEY-----\n";
        $key = @openssl_pkey_get_private($pem);
        $ec = $key ? (openssl_pkey_get_details($key)['ec'] ?? null) : null;
        if (! $ec || ! isset($ec['x'], $ec['y'])) {
            return null;
        }

        $public = "\x04".str_pad($ec['x'], 32, "\0", STR_PAD_LEFT).str_pad($ec['y'], 32, "\0", STR_PAD_LEFT);
        $b64 = fn (string $raw) => rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');

        return ['public' => $b64($public), 'private' => $b64($scalar)];
    }
}
