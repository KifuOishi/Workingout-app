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

On mobile, use the bottom navigation to switch pages. The layout accounts for the bottom safe area and provides touch-friendly inputs and completion controls. Progress and remaining rest time stay visible while scrolling through an active workout.

Browser tests check for horizontal overflow at widths of 320, 390, 768, and 1440 pixels across all four languages.

## Starting an empty workout

Select **Start empty workout** to begin without predefined exercises. In the workout screen, select **+ Add exercise**, choose a muscle group and exercise, then select **Add to workout**.

You can also register a custom exercise. Each newly added exercise starts with one set; adjust its weight and reps or add more sets as needed.

Workout progress and the timer are preserved when switching pages or reloading. An empty workout cannot be saved to history.

## Templates and set tracking

- Select **Create template** to enter a name, exercise weights, reps, set counts, and a rest interval in seconds. Saved templates can be edited or deleted.
- Select **Start workout** to begin a template. Each set appears as a separate card with previous results, weight, reps, completion status, and rest settings.
- Enter the actual weight and reps for each set, then check it off when complete. Uncheck a set to edit it again.
- Checking a set automatically starts its configured rest interval. Select **Start rest** to start a timer manually. Set an interval to 0 to disable automatic rest for that set.
- Add or remove sets as needed. Uncheck completed sets before deleting them.
- Pause, resume, or reset the timer. For example, 120 seconds gives a two-minute rest interval.
- When rest ends, the app displays an alert and plays a sound when supported by the browser. Select **Enable notifications** and grant permission to receive browser notifications. The page must remain open; device sleep and browser restrictions can delay alerts.
- Once every set is checked, select **Finish & save to history** to save the actual results. Starting a workout alone does not create history records. Total volume is the sum of weight multiplied by reps for every completed set.
- In history, select **Perform again** to repeat an exercise or **Repeat this day** to repeat that day's exercises. The app asks before replacing a workout already in progress.
- Templates, workout progress, and timer deadlines are saved in the browser.

## Training calendar

On wide desktop screens, the monthly calendar appears on the right side of Home. On mobile and narrow screens, open the dedicated **Calendar** page from the navigation.

Days with saved records have a check mark. Select a marked day to open history filtered to that date. You can move between months, choose a month directly, or return to the current month. The calendar can also be opened within History.

Date filters are stored in the URL, for example `#/history?date=2026-10-15`, so they survive reloads and browser back navigation. Dates, weekdays, and month names follow the selected language.
