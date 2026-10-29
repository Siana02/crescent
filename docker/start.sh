#!/bin/sh
set -eu

: "${PORT:=10000}"
export PORT

if [ -z "${APP_KEY:-}" ]; then
    echo "ERROR: APP_KEY must be set in the hosting environment." >&2
    exit 1
fi

if [ "${APP_DEBUG:-false}" != "false" ]; then
    echo "WARNING: APP_DEBUG should be false for a hosted production build." >&2
fi

envsubst '${PORT}' < /etc/apache2/ports.conf.template > /etc/apache2/ports.conf
envsubst '${PORT}' < /etc/apache2/sites-available/000-default.conf.template > /etc/apache2/sites-available/000-default.conf

# Fail early if the runtime image is missing an expected extension.
php -r 'foreach (["curl", "mbstring", "pdo_pgsql", "xml"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Missing PHP extension: {$ext}\n"); exit(1); } }'

# Cache configuration only after the host has supplied runtime environment values.
php artisan config:cache

# Run Laravel's scheduler (push reminders and cycle notifications) once a minute.
(while true; do php artisan schedule:run >/dev/null 2>&1; sleep 60; done) &

exec apache2-foreground
