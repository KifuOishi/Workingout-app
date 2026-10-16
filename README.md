# LIFT LOG

A workout tracking app built with React, TypeScript, and Vite.

## Getting started

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL shown in the terminal in your browser.
Use `npm.cmd` if PowerShell execution policies block `npm`. On other shells, you can use `npm` instead.

## Commands

- `npm.cmd run dev`: Start the development server.
- `npm.cmd run build`: Run TypeScript checks and build the app into `dist`.
- `npm.cmd run lint`: Run static code analysis.
- `npm.cmd run preview`: Preview the production build locally.
- `npm.cmd test`: Check translations, settings, unit conversions, and rendering across four languages and two weight units, including existing records.
- `npm.cmd run test:e2e`: Run browser tests with Playwright. Google Chrome must be installed.

## Main files

- `src/App.tsx`: App layout, navigation, settings, and workout history.
- `src/App.css`: Base component styles.
- `src/polish.css`: Visual design and responsive layouts.
- `src/index.css`: Global styles.
- `src/main.tsx`: App entry point.
- `src/WorkoutPlanner.tsx`: Templates, active workouts, and rest timers.
- `src/WorkoutCalendar.tsx`: Calendar and links to daily history.
- `src/workouts.ts`: Workout data, storage, and session helpers.
- `src/exercises.ts`: Exercise catalog and custom exercise storage.
- `src/exerciseLabels.ts`: Translated exercise and muscle group names.
- `src/i18n.ts`: Translations, language settings, and unit conversions.
- `src/navigation.ts`: Page routes and history date filters.
- `vite.config.ts`: Vite configuration.

## Features

- Record dates, exercises, weights, reps, sets, and notes.
- Choose from 48 preset exercises organized by muscle group, or save custom exercises.
- Use a weight of 0 for bodyweight exercises.
- Edit records, confirm deletions, and filter history by date.
- View training days, today's completed sets, and total training volume.
- Track individual sets and compare them with previous results.
- Create workout templates or start an empty workout.
- Use a responsive layout with touch-friendly controls.

Records are stored in `localStorage` for the current browser and site address. There is no synchronization between devices. Clearing the browser's site data also removes saved records.

## Background rest notifications (Netlify Free only)

Web Push support is implemented but requires the owner to configure the published Netlify site first. Follow [the free-plan notification setup guide](docs/notifications.md). Run `npm.cmd run push:keys` once to generate a local, Git-ignored VAPID key file; do not overwrite the existing keys.

No paid service, paid fallback, or automatic billing upgrade is configured. Only enable this feature after checking that your Netlify team is on the hard-capped Free plan. The code cannot inspect your account's billing plan. Shared Free usage limits can pause the whole site.

After setup, use **Enable notifications** inside a workout. iPhone/iPad users must add the app to the Home Screen and open it there. Android users need a compatible browser and notification permission. Wait for **Background alert reserved** before leaving the app.

The free implementation supports rests up to 14 minutes and has fixed daily and monthly reservation limits. Pause, reset, finish, and replacement cancel the old reservation when online. Network loss can prevent cancellation, and delivery can be delayed by the network or device settings. Exercise records remain on the device; only notification routing and timer metadata are sent to Netlify.

Use `npm.cmd run test:push` for local server-logic tests. Actual iPhone/Android delivery must be tested against the configured deployment; local mocks do not verify real push delivery.

## Backup and restore

Select **Backup** in the header to manage backups without an account or server.

- **Export backup** downloads a JSON file containing records (including individual set results), templates, custom exercises, language and unit preferences, and any active workout.
- Keep the downloaded file outside the browser's site storage, such as in your device's files or your own backup folder.
- **Choose backup file** opens a preview showing the export date and the number of records, templates, custom exercises, and active workouts. Choose **Cancel** to leave your data unchanged.
- **Replace data & restore** replaces the data currently saved for this site in this browser. Export the current data first if you want to keep it. Restored rest timers are paused; use **Resume** when ready.
- Invalid or unsupported files are rejected before saving. Files must be no larger than 10 MB. If saving fails, the app attempts to restore the previous saved values and reports the outcome.
- You can move a backup file to another device or browser, or import a local development backup into the published site. Files are processed locally and are not uploaded to a server.

Backups are created manually. Export one before clearing site data or changing devices; data already deleted without a backup cannot be recovered through this feature.

## Languages and weight units

Use the header controls to select English (default), Japanese, Spanish, or Simplified Chinese. Interface text, muscle groups, the 48 preset exercises, dates, and number formatting follow the selected language. Custom exercise names and notes remain as entered.

Choose kg (default) or lb for weight inputs, history, and training volume. Weights are stored internally in kg and converted using `1 lb = 0.45359237 kg`. Existing records are read as kg and remain compatible.

Language and unit preferences are saved in the current browser.

## Pages

- **Home** (`#/home`): Training summaries and actions to start or resume a workout. Wide screens also show the calendar on the right.
- **Workout** (`#/workout`): Active workout, individual sets, and rest timer.
- **Templates** (`#/templates`): Create, edit, delete, and start workout templates.
- **Calendar** (`#/calendar`): A dedicated training calendar, also used on mobile and narrow screens.
- **History** (`#/history`): Review records and repeat previous workouts. Select **Add a past record** to open the manual entry form.

History keeps date headings and shows one expandable card per workout. Open a card to review its exercises, individual sets, notes, and total volume. Cards show the workout name, exercise/set counts, and duration when available. **Perform again** repeats the entire workout; **Repeat exercise** inside the expanded details repeats just one exercise. Multiple workouts on the same day remain separate. Older records with a recognizable session ID are grouped too; manual records without session information remain independent rather than being combined by guesswork.

On mobile, use the bottom navigation to switch pages. The layout accounts for the bottom safe area and provides touch-friendly inputs and completion controls. Progress and remaining rest time stay visible while scrolling through an active workout.

Browser tests check for horizontal overflow at widths of 320, 390, 768, and 1440 pixels across all four languages.

## Starting an empty workout

Select **Start empty workout** to begin without predefined exercises. In the workout screen, select **+ Add exercise**, choose a muscle group and exercise, then select **Add to workout**.

You can also register a custom exercise. Each newly added exercise starts with one set; adjust its weight and reps or add more sets as needed.

Workout progress and the timer are preserved when switching pages or reloading. An empty workout cannot be saved to history.

## Templates and set tracking

- Select **Create template** to enter a name, exercises, set counts, and a rest interval in seconds. Weight and reps are entered during the workout. Saved templates can be edited or deleted.
- Select **Start workout** to begin a template. Each set appears as a separate card with previous results, weight, reps, completion status, and rest settings.
- Enter the actual weight and reps for each set, then check it off when complete. Uncheck a set to edit it again.
- Checking a set automatically starts its configured rest interval. Select **Start rest** to start a timer manually. Set an interval to 0 to disable automatic rest for that set.
- Add or remove sets as needed. Uncheck completed sets before deleting them.
- Pause, resume, or reset the timer. For example, 120 seconds gives a two-minute rest interval.
- When rest ends, the app displays an alert and plays a sound when supported by the browser. Select **Enable notifications** and grant permission to receive browser notifications. The page must remain open; device sleep and browser restrictions can delay alerts.
- Select **Finish & save to history** when you are done. If unchecked sets remain, choose **Remove unfinished sets & save** to keep only checked sets, or **Mark remaining sets complete & save** to include all sets with their entered values. The original template is unchanged. Empty results cannot be saved, and missing weight/reps must be filled before marking all sets complete.
- After saving, a completion summary shows the exercises, individual set results, total sets, volume, and elapsed time in hours, minutes, and seconds. Elapsed time includes rest and time spent in other apps. **View summary** in History reopens it after reloading. Duration and workout grouping are included in backups; older records without duration remain compatible.
- Starting a workout alone does not create history records. Total volume is the sum of weight multiplied by reps for all saved sets.
- In history, select **Perform again** to repeat an exercise or **Repeat this day** to repeat that day's exercises. The app asks before replacing a workout already in progress.
- Templates, workout progress, and timer deadlines are saved in the browser.

## Progress and workout tools

After finishing a workout, the summary offers an optional effort rating (Had more in me, Just right, Tough) and a workout-wide note. Both may be left blank. Changes save automatically across the workout's records, appear in expanded History, and can be edited later through **View summary**. Reflections are included in backups and are not copied to a new workout by **Perform again**.

- Open the dedicated **Progress** page from navigation to choose an exercise and view its best weight or reps per workout, a result table, and personal bests. Values follow the selected kg/lb unit.
- **New PR!** appears on completed sets and history when weight or reps exceeds the previous best. The first eligible result establishes a personal best. Warm-up sets are excluded; normal and drop sets count.
- Select **Normal**, **Warm-up**, or **Drop set** for each set before checking it off. Set types are preserved in history, backups, and **Perform again**.
- Use the up/down buttons to reorder exercises in a template or active workout. Changing today's order does not change the saved template.
- During a workout, hold the six-dot handle next to an exercise and drag it to the highlighted destination. While dragging, exercises collapse to a compact list of names; releasing or cancelling restores the sets. This works with a mouse or touch; moving near the screen edge scrolls long workouts. Escape or a cancelled touch cancels the move. The up/down buttons remain available.
- Use **+30 seconds** or **-30 seconds** to adjust the rest timer. A paused timer stays paused, and running background notifications are rescheduled for the new deadline within the existing free limits.

All preset exercises are classified by equipment or type. Exercise selection groups them under barbell, dumbbell, machine/other, and bodyweight headings. When creating a custom exercise, choose its name, muscle group, and equipment/type. Types are classification labels; sets still use weight and reps. Older custom exercises without a type appear under machine/other.

**Assisted chin-up** and **Assisted dip** display assistance as negative weight in workouts, previous results, history, summaries, and progress charts. For example, 30 kg of assistance appears as -30 kg. Less assistance counts as an improvement for weight PRs. Internally the assistance amount remains a positive kg magnitude for compatibility, so exported weights for these exercises remain positive. Other exercises retain their normal weight display.

## Training calendar

On wide desktop screens, the monthly calendar appears on the right side of Home. On mobile and narrow screens, open the dedicated **Calendar** page from the navigation.

Days with saved records have a check mark. Select a marked day to open history filtered to that date. You can move between months, choose a month directly, or return to the current month. The calendar can also be opened within History.

Date filters are stored in the URL, for example `#/history?date=2026-10-15`, so they survive reloads and browser back navigation. Dates, weekdays, and month names follow the selected language.
