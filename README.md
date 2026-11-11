# LIFT LOG

A workout tracker for recording weight and reps for each set, built with React, TypeScript, and Vite.

## Getting started

```powershell
npm.cmd install
npm.cmd run dev
```

Open the URL shown in the terminal. Outside PowerShell, you can use `npm` instead of `npm.cmd`.

## Using the app

- **Workout**: Start an empty workout or use a template. Enter weight and reps for each set and mark it complete. Completed sets are saved when you finish.
- **History**: Review or repeat past workouts. Edit weight and reps for individual sets, or add and remove sets.
- **Progress**: View monthly summaries, sets by muscle group, personal bests, and exercise trends. History edits and deletions are reflected here. Warm-up sets are excluded from personal bests.
- **Calendar**: Select a day with records to open its workout history.
- **Settings**: Choose English, Japanese, Spanish, or Simplified Chinese, and switch between kg and lb.

Use a weight of 0 for bodyweight exercises. Assisted chin-ups and dips display assistance as negative weight; less assistance counts as an improvement for weight personal bests.

## Data and backups

Data is saved in your browser's `localStorage`. There is no automatic synchronization between devices. Clearing site data also deletes your records.

Use **Backup** in the header to export a JSON file and keep it in your device's files or another backup location. Backups include records, templates, custom exercises, settings, and any active workout, and can be transferred to another device or browser. Restoring replaces the current data, so export it first if you want to keep it. Backup files are processed locally.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Start the development server |
| `npm.cmd run build` | Run type checks and build for production into `dist` |
| `npm.cmd run preview` | Preview the production build |
| `npm.cmd run lint` | Run static analysis |
| `npm.cmd test` | Check translations, settings, unit conversions, and related behavior |
| `npm.cmd run test:e2e` | Run browser tests (requires Google Chrome) |
| `npm.cmd run test:push` | Test notification server logic |

## Background notifications

Background notifications require configuration on the deployed Netlify site. See the [notification setup guide and limits](docs/notifications.md). The implementation targets the Free plan, supports rests up to 14 minutes, and limits notification reservations. Do not overwrite existing VAPID keys.

On iPhone and iPad, add the app to the Home Screen and launch it there. Enable notifications and wait for confirmation that the background alert is reserved before leaving the app. Network and device restrictions can delay delivery or prevent cancellation. Verify actual delivery on the deployed site using a real device.
