# Plandex — Complete Project Documentation

> **AI-powered personal productivity & life management app** built with Expo SDK 54 and React Native.

---

## Table of Contents

| Document | Description |
|---|---|
| [Architecture](./architecture.md) | Project structure, routing, state management, database layer |
| [Setup Guide](./setup-guide.md) | Development environment, installation, running the app |
| [EAS Build & Deployment](./setup-guide.md#eas-build--deployment) | EAS Build profiles, OTA updates, deployment workflow |
| [Features Overview](./features/README.md) | Summary of every feature with links to detail pages |
| [Database Schema](./database-schema.md) | All SQLite tables, columns, relationships |
| [API Reference](./api-reference.md) | Stores, services, repositories, hooks |
| [Theme & Design System](./theme-design-system.md) | Colors, typography, shadows, light/dark mode |
| [Changelog](./changelog.md) | Complete history of what was built & fixed |

---

## Quick Overview

**Plandex** is a comprehensive mobile productivity app featuring:

- **Todos** — Full task management with priorities, dates, tags, lists, and archiving
- **Daily Logs** — Reflective journaling with mood, ratings, and gratitude
- **Habits** — Streak-based habit tracking with flexible scheduling
- **Goals** — Multi-type goal tracking with milestones and progress visualization
- **Events / Calendar** — Event scheduling with recurring patterns and all-day support
- **Flip Clock** — Beautiful flip-digit clock with Timer, Stopwatch, and Alarms (custom tones, landscape mode)
- **Pomodoro Focus Mode** — Configurable focus sessions linked to todos and goals
- **Mood Tracker** — Daily mood logging with energy levels and activity tagging
- **Quick Sticky Notes** — Color-coded notes with pin support
- **Expense Tracker** — Income/expense tracking with categories, budgets, and summaries
- **Planning Workspace** — Project-based note and file organizer
- **Kanban Board** — Drag-and-drop task board for visual workflow management
- **Gamification** — XP, levels, streaks, and badges for engagement
- **Notifications** — Morning schedule reminders and evening log prompts

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo SDK | ~54.0.33 |
| UI | React Native | 0.81.5 |
| Language | TypeScript | ~5.9.2 |
| Navigation | Expo Router (file-based) | ~6.0.23 |
| State | Zustand | ^5.0.11 |
| Database | expo-sqlite | ~16.0.10 |
| Date Handling | date-fns | ^4.1.0 |
| Animations | react-native-reanimated | ~4.1.1 |
| Gestures | react-native-gesture-handler | ~2.28.0 |
| Audio/Video | expo-av | ~16.0.8 |
| Notifications | expo-notifications | ~0.32.16 |
| Icons | @expo/vector-icons (MaterialIcons, Feather) | ^15.0.3 |
| Charts | react-native-svg | 15.12.1 |
| Export | jszip | ^3.10.1 |
| OTA Updates | expo-updates | ~29.0.16 |
| Build System | EAS Build (Expo Application Services) | — |

---

## Project Structure (High Level)

```
plandex/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout — DB init, theme, StatusBar
│   ├── index.tsx           # Entry redirect
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── index.tsx       # Home / Dashboard
│   │   ├── todos.tsx       # Todos tab
│   │   ├── logs.tsx        # Daily Logs tab
│   │   ├── calendar.tsx    # Calendar tab
│   │   └── more.tsx        # More features hub
│   └── (stacks)/           # Stack screens (detail / create / edit)
│       ├── todo/           # create, [id], edit
│       ├── habit/          # index, create, [id], edit
│       ├── goal/           # index, create, [id], edit
│       ├── event/          # index, create, [id], edit
│       ├── log/            # daily/[date], weekly, monthly
│       ├── planning/       # index, [id]
│       ├── clock.tsx       # Flip Clock / Timer / Stopwatch / Alarm
│       ├── focus.tsx       # Pomodoro Focus Mode
│       ├── mood.tsx        # Mood Tracker
│       ├── notes.tsx       # Quick Sticky Notes
│       ├── expenses.tsx    # Expense Tracker
│       ├── kanban.tsx      # Kanban Board
│       ├── achievements.tsx
│       ├── analytics.tsx
│       ├── notifications.tsx
│       ├── onboarding.tsx
│       ├── profile.tsx
│       ├── search.tsx
│       └── settings.tsx
├── src/                    # Core application logic
│   ├── components/         # Reusable UI components
│   ├── database/           # SQLite database layer
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic services
│   ├── stores/             # Zustand state stores
│   ├── theme/              # Colors, typography, shadows
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Static assets (images, fonts)
├── resources/              # README images (banner, icons, diagrams)
├── __tests__/              # Test suites (unit, integration, e2e)
├── eas.json                # EAS Build profiles (dev, preview, production)
└── docs/                   # This documentation folder
```

---

## Getting Started

```bash
# Clone & install
git clone <repo-url>
cd plandex
npm install

# Start development server
npx expo start

# Run on specific platform
npx expo start --android
npx expo start --ios
```

See [Setup Guide](./setup-guide.md) for detailed instructions.
