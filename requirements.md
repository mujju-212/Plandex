# MyPlanner — Project Requirements & Dependencies

## Prerequisites

| Tool          | Version   | Install                                      |
| ------------- | --------- | -------------------------------------------- |
| Node.js       | ≥ 18.x    | https://nodejs.org                           |
| npm           | ≥ 9.x     | Comes with Node.js                           |
| Expo CLI      | latest    | `npm install -g expo-cli`                    |
| Expo Go (app) | SDK 54    | Install from App Store / Google Play         |
| Git           | ≥ 2.x     | https://git-scm.com                          |

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> && cd myplanner

# 2. Install all dependencies
npm install

# 3. Start development server
npx expo start --clear

# 4. Scan QR code with Expo Go (Android) or Camera app (iOS)
```

---

## Expo SDK & Runtime

| Package            | Version     | Purpose                                |
| ------------------ | ----------- | -------------------------------------- |
| expo               | ~54.0.33    | Core Expo SDK                          |
| expo-router        | ~6.0.23     | File-based routing (app/ directory)    |
| expo-constants     | ~18.0.13    | App constants (version, manifest)      |
| expo-splash-screen | ~31.0.13    | Splash screen control                  |
| expo-status-bar    | ~3.0.9      | Status bar configuration               |
| expo-system-ui     | ~6.0.9      | System UI (root background color)      |
| expo-linking       | ~8.0.11     | Deep linking support                   |
| expo-web-browser   | ~15.0.10    | In-app browser                         |

---

## UI & Styling

| Package                      | Version   | Purpose                              |
| ---------------------------- | --------- | ------------------------------------ |
| expo-linear-gradient         | ~15.0.8   | Gradient backgrounds                 |
| expo-symbols                 | ~1.0.8    | SF Symbols (iOS)                     |
| @expo/vector-icons           | ^15.0.3   | Icon sets (Ionicons, MaterialIcons)  |
| react-native-svg             | 15.12.1   | SVG rendering                        |
| react-native-reanimated      | ~4.1.1    | Fluid animations                     |
| react-native-gesture-handler | ~2.28.0   | Touch gestures                       |
| react-native-screens         | ~4.16.0   | Native screen containers             |
| react-native-safe-area-context | ~5.6.0  | Safe area insets                     |
| react-native-worklets        | 0.5.1     | Worklet threading (reanimated dep)   |

---

## Navigation

| Package                      | Version  | Purpose                      |
| ---------------------------- | -------- | ---------------------------- |
| @react-navigation/native     | ^7.1.8   | Navigation core              |
| @react-navigation/bottom-tabs| ^7.4.0   | Tab bar navigation           |
| @react-navigation/elements   | ^2.6.3   | Shared navigation components |

---

## Data & Storage

| Package                                      | Version | Purpose                                   |
| -------------------------------------------- | ------- | ----------------------------------------- |
| expo-sqlite                                  | ~16.0.10| SQLite database (native data persistence) |
| @react-native-async-storage/async-storage    | 2.2.0   | Key-value storage (settings, profile, web fallback) |

> **Important:** AsyncStorage v2.2.0 is the Expo SDK 54-compatible version. Do NOT upgrade to v3.x — it removes the legacy native module required by Expo Go.

---

## Media & Input

| Package                                 | Version  | Purpose                        |
| --------------------------------------- | -------- | ------------------------------ |
| expo-image                              | ~3.0.11  | Optimized image component      |
| expo-image-picker                       | ~17.0.10 | Camera / gallery photo picker  |
| expo-haptics                            | ~15.0.8  | Haptic feedback                |
| expo-font                               | ~14.0.11 | Custom font loading            |
| @react-native-community/datetimepicker  | ^8.6.0   | Date & time picker             |
| @react-native-community/slider          | 5.0.1    | Slider input                   |

---

## State Management

| Package  | Version  | Purpose                         |
| -------- | -------- | ------------------------------- |
| zustand  | ^5.0.11  | Lightweight state management    |

---

## Notifications & Sharing

| Package              | Version  | Purpose                                    |
| -------------------- | -------- | ------------------------------------------ |
| expo-notifications   | ~0.32.16 | Local push notifications (reminders)       |
| expo-file-system     | ~19.0.21 | File read/write for export/import          |
| expo-sharing         | ~14.0.8  | Native share sheet (export files)          |
| expo-document-picker | ~14.0.8  | Pick files from device (import data)       |
| expo-store-review    | ~9.0.9   | In-app "Rate this app" prompt              |

> **Important:** `expo-notifications` does NOT work in Expo Go (removed since SDK 53).
> Notifications are silently disabled in Expo Go and fully functional in **development builds** and **production**.
> Use `npx expo run:android` or `npx expo run:ios` (or EAS Build) to test notifications.

---

## Utilities

| Package   | Version | Purpose                |
| --------- | ------- | ---------------------- |
| date-fns  | ^4.1.0  | Date formatting/math   |

---

## Web Support

| Package           | Version  | Purpose                     |
| ----------------- | -------- | --------------------------- |
| react-dom         | 19.1.0   | React DOM for web           |
| react-native-web  | ~0.21.0  | RN components on web        |

---

## Dev Dependencies

| Package           | Version   | Purpose                   |
| ----------------- | --------- | ------------------------- |
| typescript        | ~5.9.2    | TypeScript compiler       |
| @types/react      | ~19.1.0   | React type definitions    |
| eslint            | ^9.25.0   | Linting                   |
| eslint-config-expo| ~10.0.0   | Expo ESLint rules         |

---

## Expo Plugins (app.json)

These are configured in `app.json` under `expo.plugins`:

- **expo-router** — File-based routing
- **expo-splash-screen** — Splash screen image & colors
- **expo-sqlite** — SQLite native module
- **expo-document-picker** — Document picker native module
- **expo-notifications** — Push notification icons & colors

---

## Project Architecture

```
app/                  # Expo Router pages (file-based routing)
  (tabs)/             # Bottom tab screens (Home, Calendar, Todos, Logs, More)
  (stacks)/           # Stack screens (Create/Edit forms, Profile, Settings, etc.)
src/
  components/         # Reusable UI components
  config/             # App configuration (AI, notifications, gamification)
  database/           # SQLite schema, migrations, repositories
  hooks/              # Custom React hooks
  services/           # Business logic services
  stores/             # Zustand state stores
  theme/              # Colors & styling constants
  types/              # TypeScript type definitions
  utils/              # Utility functions
  assets/             # Fonts, animations, images, sounds
```

---

## Storage Architecture

| Platform | Primary Storage | Settings/Profile |
| -------- | --------------- | ---------------- |
| Native (iOS/Android) | SQLite (`expo-sqlite`) | AsyncStorage |
| Web      | AsyncStorage    | AsyncStorage     |

---

## Version Compatibility Notes

- **Expo SDK 54** requires specific compatible versions for all native modules. Always use `npx expo install <package>` instead of `npm install <package>` to get the correct version.
- **React** 19.1.0 / **React Native** 0.81.5 — New Architecture enabled (`newArchEnabled: true`).
- **AsyncStorage** must stay at **v2.x** for Expo SDK 54 compatibility.
- If adding new native packages, run `npx expo install <package>` to auto-resolve the compatible version.

---

## Install All Dependencies

```bash
npm install
```

Or to reinstall from scratch:

```bash
rm -rf node_modules package-lock.json
npm install
```
