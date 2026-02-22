# Setup Guide

> Step-by-step guide to get Plandex running locally for development.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | 18+ (LTS) | https://nodejs.org |
| **npm** | 9+ (comes with Node) | — |
| **Expo CLI** | Latest | `npm install -g expo-cli` |
| **Git** | Any | https://git-scm.com |

**Mobile testing (pick one or more):**

| Option | Notes |
|---|---|
| **Expo Go** (Android/iOS) | Install from Play Store / App Store |
| **Android Emulator** | Via Android Studio |
| **iOS Simulator** | macOS only, via Xcode |

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url> plandex
cd plandex

# 2. Install dependencies
npm install
```

---

## Running the App

### Development Server

```bash
npx expo start
```

This starts the Metro bundler. You'll see a QR code in the terminal.

### Platform-Specific

```bash
# Android (emulator or device)
npx expo start --android

# iOS (simulator — macOS only)
npx expo start --ios

# Web
npx expo start --web
```

### On Physical Device

1. Install **Expo Go** on your device
2. Run `npx expo start`
3. Scan the QR code with your camera (iOS) or with Expo Go (Android)

---

## Project Structure

```
plandex/
├── app/                  # Expo Router file-based routing
│   ├── _layout.tsx       # Root layout (DB init, theme, notifications)
│   ├── index.tsx         # Entry redirect
│   ├── (tabs)/           # Bottom tab navigator
│   │   ├── _layout.tsx   # Tab configuration
│   │   ├── index.tsx     # Dashboard
│   │   ├── todos.tsx     # Todo lists
│   │   ├── logs.tsx      # Daily logs
│   │   ├── calendar.tsx  # Calendar/events
│   │   └── more.tsx      # More features grid
│   └── (stacks)/         # Stack screens
│       ├── todo/         # Todo CRUD routes
│       ├── habit/        # Habit CRUD routes
│       ├── goal/         # Goal CRUD routes
│       ├── event/        # Event CRUD routes
│       ├── log/          # Log detail routes
│       └── ...           # Clock, focus, mood, etc.
├── src/                  # Core source code
│   ├── components/       # Reusable UI components
│   ├── database/         # SQLite schema, connection, repositories
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic layer
│   ├── stores/           # Zustand state stores
│   ├── theme/            # Colors, typography, shadows
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── assets/               # Static assets (images)
├── resources/            # README images (banner, icons, diagrams)
├── docs/                 # Documentation (you are here)
├── __tests__/            # Test files
├── app.json              # Expo configuration
├── eas.json              # EAS Build profiles
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

---

## Configuration

### `app.json`

Key settings:

```json
{
  "expo": {
    "name": "Plandex",
    "slug": "plandex",
    "scheme": "plandex",
    "version": "1.0.0",
    "runtimeVersion": "1.0.0",
    "newArchEnabled": true,
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "updates": {
      "url": "https://u.expo.dev/9f836fb9-8e6e-4ed9-978f-5bbcb5082249"
    },
    "plugins": [
      "expo-router",
      "expo-splash-screen",
      "expo-sqlite",
      "expo-document-picker",
      "expo-notifications",
      ["expo-updates", { "username": "mujju-212" }]
    ],
    "extra": {
      "eas": {
        "projectId": "9f836fb9-8e6e-4ed9-978f-5bbcb5082249"
      }
    },
    "owner": "mujju-212"
  }
}
```

### TypeScript

TypeScript is configured via `tsconfig.json` with strict mode. The project uses `~5.9.2`.

### ESLint

ESLint is configured via `eslint.config.js` with Expo's default config.

---

## Database

The app uses **SQLite** (`expo-sqlite`) with automatic initialization:

- Tables are created on first launch via `initializeDatabase()` in `src/database/schema.ts`
- Default seed data (todo list, expense categories, user stats) is inserted automatically
- No manual migration needed — the schema is applied declaratively with `CREATE TABLE IF NOT EXISTS`

For web, data falls back to **AsyncStorage** (no SQLite on web).

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `expo` ~54.0.33 | Core framework |
| `react-native` 0.81.5 | UI engine |
| `expo-router` ~6.0.23 | File-based routing |
| `expo-sqlite` ~16.0.10 | SQLite database |
| `zustand` ~5.0.11 | State management |
| `date-fns` ^4.1.0 | Date utilities |
| `expo-av` ~16.0.8 | Audio (alarm tones) |
| `expo-notifications` ~0.32.16 | Local notifications |
| `expo-haptics` ~15.0.8 | Haptic feedback |
| `expo-image-picker` ~17.0.10 | Image selection |
| `expo-document-picker` ~14.0.8 | File/audio import |
| `expo-screen-orientation` ~9.0.8 | Landscape rotation |
| `react-native-reanimated` ~4.1.1 | Animations |
| `react-native-gesture-handler` ~2.28.0 | Gestures |
| `react-native-svg` 15.12.1 | SVG rendering |
| `@react-native-community/datetimepicker` ^8.6.0 | Date/time pickers |
| `jszip` ^3.10.1 | ZIP file creation |
| `@react-native-async-storage/async-storage` 2.1.2 | Key-value storage |
| `expo-updates` ~29.0.16 | Over-the-air updates |

---

## Common Development Tasks

### Reset the Database

Delete the app data:
- **Android:** Clear app data from Settings → Apps → Plandex
- **iOS Simulator:** Reset simulator (Device → Erase All Content)
- **Expo Go:** Shake device → "Clear Data"

### Add a New Feature

1. Define types in `src/types/`
2. Add tables in `src/database/schema.ts`
3. Create repository in `src/database/repositories/`
4. Create service in `src/services/` (optional, for business logic)
5. Create Zustand store in `src/stores/`
6. Add screen routes in `app/(stacks)/` or `app/(tabs)/`
7. Build UI components in `src/components/`

### Run Tests

```bash
npm test
```

Test files are located in `__tests__/` with subdirectories for unit, integration, and e2e tests.

### Build for Production

See the dedicated [EAS Build & Deployment](#eas-build--deployment) section below.

---

## EAS Build & Deployment

Plandex uses **Expo Application Services (EAS)** for cloud builds and **expo-updates** for over-the-air (OTA) updates.

### EAS Project Info

| Property | Value |
|---|---|
| **EAS Project ID** | `9f836fb9-8e6e-4ed9-978f-5bbcb5082249` |
| **Expo Account** | `mujju-212` |
| **Android Package** | `com.mujju212.plandex` |
| **iOS Bundle ID** | `com.mujju212.plandex` |
| **Runtime Version** | `1.0.0` (tied to native code changes) |

### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login
```

### EAS Configuration (`eas.json`)

The project includes three build profiles:

```json
{
  "cli": { "version": ">= 16.4.2", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "channel": "preview"
    },
    "production": {
      "android": { "buildType": "apk" },
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

| Profile | Use Case | Output |
|---|---|---|
| `development` | Local dev with dev client | APK (debug) |
| `preview` | Internal testing | APK (release, preview channel) |
| `production` | Final release | APK (release, production channel) |

### Building the App

```bash
# Development build (APK with dev client)
eas build --profile development --platform android

# Preview build (for testers)
eas build --profile preview --platform android

# Production build (for release)
eas build --profile production --platform android

# iOS builds (requires Apple Developer account)
eas build --profile production --platform ios
```

After a build completes, download the APK from the [Expo dashboard](https://expo.dev) or use:

```bash
eas build:list
```

### OTA Updates with expo-updates

Plandex supports **over-the-air updates** — push JS/asset changes to users without rebuilding the APK.

#### How It Works

1. `app.json` is configured with:
   ```json
   {
     "runtimeVersion": "1.0.0",
     "updates": {
       "url": "https://u.expo.dev/9f836fb9-8e6e-4ed9-978f-5bbcb5082249"
     }
   }
   ```
2. On app launch, `_layout.tsx` automatically checks for updates
3. Users can also manually check via **More → About → Check for Updates**

#### Publishing an OTA Update

```bash
# Push update to preview channel
eas update --channel preview --message "Bug fixes and improvements"

# Push update to production channel
eas update --channel production --message "v1.0.1 - Performance improvements"
```

#### Update Behavior

- **Auto-check on launch:** The root layout checks for updates using `Updates.checkForUpdateAsync()`. If available, it downloads and applies on next restart.
- **Manual check:** The "Check for Updates" button in More → About runs the same check and shows a user-friendly alert.
- **Fallback:** If OTA check fails (e.g., no network), the app falls back gracefully to the installed version.

#### When to Use OTA vs New Build

| Change Type | Method |
|---|---|
| JS/TypeScript code changes | OTA update (`eas update`) |
| Asset changes (images, fonts) | OTA update (`eas update`) |
| New native module added | New build (`eas build`) |
| `app.json` config changes | New build (`eas build`) |
| SDK version upgrade | New build + bump `runtimeVersion` |

### Deployment Workflow

```
1. Develop locally          →  npx expo start
2. Test with preview build  →  eas build --profile preview --platform android
3. Push JS updates          →  eas update --channel preview
4. Release production build →  eas build --profile production --platform android
5. Push production updates  →  eas update --channel production
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Metro bundler won't start | `npx expo start --clear` to clear cache |
| Module not found | `rm -rf node_modules && npm install` |
| SQLite errors | Clear app data to reset the database |
| Notifications not working | Check permissions in device settings |
| Build errors after update | `npx expo install --fix` to resolve version mismatches |
| EAS build fails | Check `eas build:list` for logs; ensure `eas login` is done |
| OTA update not applying | Verify `runtimeVersion` matches between build and update |
| APK download link expired | Run `eas build:list` and get a fresh download URL |
