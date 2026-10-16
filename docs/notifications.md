# Free-plan background notifications

The code is ready, but background notifications are **off until Netlify environment variables are configured**. This repository cannot check or change your Netlify billing plan. Never enable this feature on a paid or usage-billed team if your requirement is zero charges.

## Cost boundary

- Use the hard-capped **Netlify Free** plan only. No OneSignal, Upstash, Firebase billing account, paid add-on, credit recharge, or third-party scheduling subscription is required.
- Confirm the actual team plan in Netlify's billing dashboard yourself. `WEB_PUSH_FREE_PLAN_CONFIRMED` is your explicit acknowledgement, not an automatic billing check.
- Netlify Free can pause **the whole site**, not just notifications, when its shared usage limit is reached. Notification jobs, builds, traffic, and other projects can all consume the available allowance. The code cannot guarantee continued service within that allowance.
- The app also stops accepting new jobs after **40 reservations per UTC day** or **36,000 reserved timer-seconds per UTC month**, shared across all users. Canceling does not refund a reservation because the background invocation still consumes runtime. These limits are intentionally fixed in code, with no paid fallback.
- A background job waits on Netlify until the timer deadline. This consumes compute even while waiting. Review usage in the Netlify dashboard. Set `WEB_PUSH_ENABLED=false` and redeploy to stop new jobs and disable delivery.

References: [Netlify Free billing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [background functions](https://docs.netlify.com/build/functions/background-functions/), [Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

## Owner setup

1. Confirm that the published site's team uses **Free**, not Personal, Pro, a trial that becomes paid, or a legacy plan with different billing rules. Do not upgrade or enable any recharge option.
2. Run `npm.cmd run push:keys`. This creates `.env.push.local`, which is ignored by Git. It will not overwrite an existing key file and does not print secrets.
3. Open that local file yourself. Replace `VAPID_CONTACT` with your own `mailto:` contact address.
4. In the Netlify site's environment variables, add these values with **Functions/runtime scope**:
   - `VAPID_PUBLIC_KEY`: from the generated file.
   - `VAPID_PRIVATE_KEY`: from the generated file. Keep it secret; never use a `VITE_` prefix.
   - `VAPID_CONTACT`: your contact address, such as `mailto:you@example.com`.
   - `WEB_PUSH_FREE_PLAN_CONFIRMED`: `true` only after step 1.
   - `WEB_PUSH_ENABLED`: `true`.
5. Redeploy from the repository with `netlify.toml`, `netlify/functions`, and the installed dependencies included. Uploading only `dist` with a drag-and-drop deploy does **not** deploy the server functions.
6. Keep the key pair stable between deployments. Changing it requires devices to enable notifications again.

No environment variables, external accounts, billing settings, or production deployments were changed automatically. The private key file is not part of workout backups.

## Device setup

- **iPhone/iPad:** use Safari's Share menu to add LIFT LOG to the Home Screen, then open the installed icon and tap **Enable notifications** inside a workout. A normal Safari tab is not enough for iOS Web Push. Use iOS/iPadOS 16.4 or later.
- **Android:** open the HTTPS site in a browser supporting Web Push, such as Chrome, and tap **Enable notifications**. Installing to the Home Screen is optional on supported Android browsers.
- Allow notifications in both the browser/app and the device settings. Focus, silent mode, battery restrictions, network availability, and push-provider delays may affect delivery or sound.
- Start a short rest, leave the app, and verify delivery on a real device. Tapping the notification opens the workout page.

The service worker supplies notifications and app installation metadata; it does not provide offline app caching.

## Timer behavior and limits

- Background delivery supports **1 second to 14 minutes**. Netlify background functions have a 15-minute execution limit; the margin allows startup and network time. Longer timers still work on screen and show an explanatory message.
- Changing, pausing, resetting, finishing, replacing, or discarding a timer cancels its previous server job and schedules a replacement when appropriate. Canceling requires connectivity. If cancellation fails, an older notification may still arrive; the UI reports the failure.
- Expiring naturally does not cancel the pending push. A worker checks the current job at the deadline, claims it once, and sends a short-lived Web Push message. Stale jobs older than two minutes are discarded. Delivery is best effort; it is not an exact OS alarm.
- Notification registration and device tokens are local to that browser installation and are excluded from backups. Re-enable notifications on a new device.
- The server receives the push subscription, a random device token, timer ID, deadline, and translated rest-finished message. It does **not** receive exercises, weights, reps, notes, or workout history. Netlify Blobs stores the current subscription/job until delivery or cancellation replaces it with a tombstone. Failed dispatches may retain a job until the next cancellation or timer update; the owner can delete the `lift-log-push` Blob store if needed.
- To turn notifications off, select **Disable notifications** in the workout. It cancels the current job and unsubscribes the browser.

## Validation

`npm.cmd run test:push` checks subscription endpoint restrictions, signatures, free-plan gating, concurrent budget limits, cancellation/replacement, stale jobs, and duplicate delivery prevention without contacting push providers.

Browser tests can verify service-worker display and client scheduling with mocks, but real delivery still needs the configured Netlify deployment and physical iPhone/Android testing. A passing local test does not establish production notification delivery.
