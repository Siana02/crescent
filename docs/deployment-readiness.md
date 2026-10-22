# Crescent deployment readiness and phone-test runbook

Crescent is currently a single Laravel application: Blade serves the React/TSX entry point through Laravel Vite, and the browser uses same-origin `/auth/*` and `/api/*` endpoints. Deploy the complete repository to a PHP/Laravel host for the first phone test; do not deploy only the TSX bundle to Vercel.

## Before connecting a host

1. Use a separate test database and test accounts. Do not import personal cycle or relationship data.
2. Use a host supporting PHP 8.3+, Composer, Node.js/npm for the Vite build, HTTPS, Laravel writable `storage/` and `bootstrap/cache/`, and scheduled/worker processes if required.
3. Set private environment variables in the host dashboard. Never commit a real `.env`, `APP_KEY`, database password, or VAPID private key.
4. Configure `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://YOUR-TEST-DOMAIN`, a generated stable `APP_KEY`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`, `SESSION_ENCRYPT=true`, and `LOG_LEVEL=warning`.
5. Configure `DB_CONNECTION` and the provider's database connection variables. SQLite on an ephemeral filesystem is not suitable for persistent hosted user data.
6. Run `php artisan migrate --force` against the test database only after confirming the connection and backup/restore plan. Do not run `migrate:fresh` on a database with data you need.
7. Run `php artisan optimize` after environment configuration. Clear cached config before changing secrets/settings; use `php artisan optimize:clear` when diagnosing stale configuration.
8. Confirm `sessions`, `cache`, and `jobs` tables exist if using database session/cache/queue drivers. The repository's default `QUEUE_CONNECTION=database` means queued work needs a worker (or explicitly switch to `sync` only if suitable for the test). Add a scheduler process if scheduled reminders are introduced.
9. Set mail delivery to a verified provider before testing password reset or email-based flows.

## Dependency and build gate

The current `composer.json` requires `minishlink/web-push ^9.0`, while the current `composer.lock` does not contain that package. Resolve dependencies in a PHP/Composer environment and commit the generated lockfile before treating deployment as reproducible:

```sh
composer update minishlink/web-push --with-all-dependencies
composer validate --strict
composer install --no-interaction --prefer-dist
npm ci
npm run typecheck
npm run build
php artisan test
```

Do not fabricate or hand-edit `composer.lock`. If Composer cannot resolve the package for the project's PHP version, fix the constraint or runtime first. The commands above have not been executed by this change.

## PWA and end-to-end phone test

- Visit the HTTPS origin and verify `/manifest.webmanifest`, `/sw.js`, `/crescent-icon.svg`, and `/favicon.svg` return successfully with the expected content types.
- Confirm the service worker is active in browser developer tools and that the manifest's `start_url` (`/dashboard`) is reachable after login.
- Register a throwaway account, log in, complete onboarding, save a test period/check-in, refresh, log out, and log in again to confirm persistence.
- Verify the same-origin API calls return expected status codes and never expose another user's data. Test the partner connection with two test accounts.
- Install from the browser on the phone. iOS requires Safari's Share > Add to Home Screen; Android browsers generally offer Install app/Add to Home screen.
- Test offline behavior separately: the current service worker only caches a minimal shell and uses the cached root page as a navigation fallback. It is not a full offline application.

## Push delivery is a separate acceptance gate

Push requires valid VAPID public/private keys and subject configured as `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in the host's secret settings; the Composer lockfile must include `minishlink/web-push`; the migrations must be applied; and the browser must grant notification permission. The private key must never be exposed as a Vite variable or committed.

After deployment, verify:
1. `GET /api/push/public-key` returns the public key for an authenticated session.
2. `GET /api/notifications/preferences` reports `configured: true`.
3. Enabling notifications creates a subscription row and preference for the signed-in test user.
4. Saving a shared note from test account A sends a neutral notification to opted-in account B on a real device.
5. Expired subscriptions are removed and failures are logged without recording note contents or reproductive data.
6. Disable/unsubscribe works and each user can only alter their own subscription.

Only the shared-note event is currently connected to a notification trigger. Partner-update events and scheduled cycle/daily reminders are not yet wired to event producers/scheduler jobs. Do not claim those notification categories work until they have been implemented and tested.

## Release checklist

- [ ] Composer lockfile resolves and is committed.
- [ ] Frontend typecheck/build and PHP test suite pass in CI.
- [ ] Production secrets configured only in hosting settings.
- [ ] Migrations complete on the isolated test database.
- [ ] Login, sessions, data persistence, and two-account authorization verified on HTTPS.
- [ ] PWA install tested on the target phone.
- [ ] Push subscription and shared-note delivery verified on-device.
