# Crescent Web Push setup

Crescent's push subscription, notification preferences, privacy-preserving push service, and service worker are implemented in the application. Actual delivery is intentionally disabled until the deployment provides VAPID credentials. Never commit the private VAPID key.

## 1. Generate a VAPID key pair

From the Laravel project root, run:

```powershell
php -r "require 'vendor/autoload.php'; echo json_encode(\Minishlink\WebPush\VAPID::createVapidKeys(), JSON_PRETTY_PRINT), PHP_EOL;"
```

Keep the generated public and private keys together. Do not regenerate them for each deployment; existing browser subscriptions are associated with the configured application-server public key.

## 2. Set deployment secrets

Add these variables in the hosting provider's secret/environment settings (not in source control):

- `VAPID_PUBLIC_KEY`: generated public key
- `VAPID_PRIVATE_KEY`: generated private key
- `VAPID_SUBJECT`: a valid contact URI, for example `mailto:notifications@your-domain.example` (replace with an address/domain you control)

Then redeploy/restart the application and clear Laravel's cached configuration if the hosting platform does not do so automatically:

```sh
php artisan config:clear
php artisan config:cache
```

The public key endpoint returns a service-unavailable response while keys are missing. The profile settings page should not claim push is enabled until the browser subscription and preference save both succeed.

## 3. Test end to end

1. Open Crescent over HTTPS (or localhost during local development) in a browser that supports Push API and notifications.
2. Sign in and open **Profile & settings → Crescent notifications**.
3. Enable **Daily check-in nudges**, then select **Enable push notifications** and grant browser permission.
4. Confirm the subscription is saved and the UI reports that notifications are enabled.
5. Trigger a permitted notification, such as a support-partner symptom nudge. Confirm the lock-screen message contains only neutral reminder text and the sender's display name, never symptoms, cycle dates, fertility details or private notes.
6. Turn push off in Crescent and confirm the device subscription is removed and the preference is disabled.
7. Repeat on a second supported browser/device if that is part of the deployment target.

## Troubleshooting

- **Push delivery is not configured:** one or more VAPID variables are missing in the running deployment. Add them as secrets and redeploy.
- **Could not load push configuration:** check the `/api/push/public-key` response and Laravel configuration cache.
- **Permission denied:** the user must allow notifications in browser/OS settings.
- **Subscription saves but delivery fails:** inspect application logs for `Crescent push delivery failed`; expired subscriptions are removed when the push service reports them as expired.
- **No service worker:** confirm `/sw.js` is reachable and registered for the site's origin. Push requires HTTPS outside localhost.

Push is opt-in per user/device. Each user manages their own preferences, and notification bodies must remain privacy-safe.
