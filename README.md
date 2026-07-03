# Count Words and Time

An Obsidian plugin for tracking the current writing session: typed units, writing time, idle time, total time, average speed, and focus rate.

The plugin is designed to work on both Obsidian desktop and mobile. It uses Obsidian APIs, DOM APIs, TypeScript, and browser timers only.

## Features

- Counts newly typed text units during the current session.
- Supports character count, Chinese character count, and English word count.
- Deleting text does not reduce the session count.
- Typing and deleting both count as writing activity for timing.
- Supports Chinese and English interface languages.
- Tracks idle time after a configurable inactivity threshold.
- Shows total time as writing time plus idle time.
- Calculates average speed per hour based on the selected count unit.
- Supports two speed modes: total speed and writing speed.
- Shows focus rate as a progress bar.
- Provides pause/resume and start-new-session controls.
- Supports optional `hh:mm` time display without seconds.

## Sidebar

The writing stats sidebar shows:

- Count for the selected unit
- Average speed
- Writing time
- Idle time
- Total time
- Focus rate progress bar
- Pause/Resume button
- Start new session button

Open it from the ribbon icon or the command palette. The command name follows the selected interface language.

## Settings

- Interface language:
  - Follow Obsidian.
  - Chinese.
  - English.
- Idle threshold: `5`, `10`, `20`, `30`, or `60` seconds.
- Average speed mode:
  - Total speed: word count divided by total time.
  - Writing speed: word count divided by writing time.
- Count unit:
  - Characters, ignoring whitespace.
  - Chinese characters.
  - English words.
- Ignore seconds: display times as `hh:mm` instead of `hh:mm:ss`.
- Auto-open sidebar when the plugin starts.
- Auto-start tracking when the plugin starts.

## Privacy

This plugin does not upload, transmit, or store your note content outside Obsidian.

It does not depend on external services. Session statistics are calculated locally from editor content changes and browser timers.

## Compatibility

- Supports Obsidian desktop and mobile.
- `manifest.json` sets `isDesktopOnly` to `false`.
- Runtime code does not use Node.js, Electron, `fs`, `path`, or other desktop-only APIs.

## Manual Installation

1. Download or build the plugin files.
2. Create this folder inside your vault:

   ```text
   .obsidian/plugins/count-words-and-time/
   ```

3. Copy these files into that folder:

   ```text
   manifest.json
   main.js
   styles.css
   ```

4. Restart Obsidian or reload plugins.
5. Enable `Count Words and Time` from `Settings -> Community plugins`.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Build the plugin:

```bash
npm run build
```

During development, use:

```bash
npm run dev
```

## Release Files

For a GitHub release, attach:

```text
manifest.json
main.js
styles.css
```

The source repository should include the TypeScript source files, configuration files, tests, `package.json`, and `package-lock.json`. Do not commit `node_modules/`.
