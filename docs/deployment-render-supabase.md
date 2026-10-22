# Crescent test deployment: Render + Supabase

This guide prepares Crescent for **test accounts and dummy data only**. Do not enter real cycle, pregnancy, relationship, or other sensitive personal data until security, privacy, backup, and recovery procedures have been reviewed.

## What the container provides

- PHP 8.5 on the official Apache image.
- PHP extensions for cURL, mbstring, PostgreSQL PDO, and XML; Composer checks locked dependencies against the runtime platform.
- Node.js 22 build stage, `npm ci`, TypeScript type-checking, and Vite production assets.
- Apache serves Laravel from `public/`; requests are handled by Laravel's public front controller and rewrite rules.
- Apache listens on Render's `PORT` environment variable (defaults to 10000).
- Render terminates public HTTPS. Configure Laravel with production settings and secure cookies.
- PostgreSQL stores application data, database-backed cache, database-backed queues, and database-backed sessions. The existing initial users migration already creates the `sessions` table; no duplicate session migration is added.

## 1. Create a Supabase test project

1. Create a Supabase project with a strong, unique database password and a region reasonably close to your testers.
2. In Supabase **Connect**, choose the connection information appropriate for Render. If direct connectivity is unavailable from the Render environment, use Supabase's session pooler. Do not use transaction pooler mode for this app unless its prepared-statement/session-state compatibility has been tested.
3. Copy the host, port, database name, username, and password privately into a password manager. Never commit these values to GitHub or paste them into chat.
4. Use a new, empty test database/project. Do not point this first deployment at any database containing real user data.

## 2. Open a Render Web Service

1. In Render, choose **New → Web Service** and connect `Siana02/crescent`.
2. Select the `feat/render-docker-deployment` branch while reviewing this pull request, or `main` after it has been merged.
3. Choose **Docker** as the runtime and the Free instance for initial testing.
4. Keep the service private to test accounts where possible. Render's free web service can sleep after inactivity; first requests after sleep may be slow.
5. Render supplies `PORT`; the image configures Apache to listen on that value. Do not hard-code a different port in Render.

## 3. Set Render environment variables

Set these in the Render service's **Environment** page. Enter actual database values only in Render's secret environment form.

| Variable | Value |
| --- | --- |
| `APP_NAME` | `Crescent` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | A generated Laravel application key; keep it stable between deploys |
| `APP_URL` | The HTTPS URL Render assigns to this service |
| `LOG_LEVEL` | `warning` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | Supabase host |
| `DB_PORT` | Port shown in Supabase Connect |
| `DB_DATABASE` | Database name shown in Supabase Connect |
| `DB_USERNAME` | Database username shown in Supabase Connect |
| `DB_PASSWORD` | Supabase database password |
| `DB_SSLMODE` | `require` |
| `SESSION_DRIVER` | `database` |
| `SESSION_SECURE_COOKIE` | `true` |
| `SESSION_HTTP_ONLY` | `true` |
| `SESSION_SAME_SITE` | `lax` |
| `SESSION_ENCRYPT` | `true` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |

Generate an application key locally with PHP/Composer available by running `php artisan key:generate --show` from the repository root, or generate it in a trusted local Laravel environment. Copy the result into Render as `APP_KEY`; do not commit it. Do not regenerate it on every deploy because that invalidates encrypted application data and sessions.

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` only when you are ready to configure push notifications. Keep the private key secret. Push notifications must be tested separately on HTTPS and a real device.

## 4. Deploy and migrate the empty test database

1. Deploy the service and review the build/deploy logs. The container deliberately does **not** run migrations automatically on each startup.
2. Once Render shows the service as running, open its Shell if your service/plan offers it and run:

   ```sh
   php artisan migrate --force
   ```

   This applies the repository's migrations, including the existing session table, cache table, and queue tables. If your current Render plan does not offer a shell, use a trusted local terminal with the same Render environment variables and a secure network connection to the test database, or a one-off migration job. Never place credentials in a committed script.
3. Check `https://YOUR-SERVICE.onrender.com/up`. Laravel should return a successful health response.
4. If the service is configured before migrations have run, requests that need database sessions/cache may fail until migrations are applied.

## 5. Test before inviting anyone

- Register a throwaway account, log out, and log in again.
- Complete onboarding and save a cycle entry; reload and verify it persists.
- Check session continuity after refresh and after a new deployment.
- Verify that each account can access only its own private data and that partner-sharing permissions are enforced in both directions.
- Check browser console and server logs for errors; do not publish logs that contain personal data or secrets.
- Test HTTPS, secure cookies, mobile layout, PWA installation, and push notifications independently on a real phone.
- Test partner invites and shared notes using two throwaway accounts.
- Confirm database backups and a restore procedure before treating any data as important.

## Important limits

The Render free web service may sleep, and free-tier availability, limits, and features can change. The container's filesystem is ephemeral: do not use local files as the only storage for user uploads or other data that must survive deploys. This configuration does not create a background worker or scheduler; database-backed jobs will remain queued until a worker is configured. The app's notification event producers and end-to-end push delivery still require separate verification.
