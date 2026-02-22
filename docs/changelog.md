# Changelog & Development History

> Complete history of Plandex's development — every feature built, bug fixed, and improvement made.

---

## Phase 1 — Core Foundation

### Project Scaffolding
- Initialized Expo SDK 54 project with TypeScript
- Configured Expo Router 6 with typed routes and React Compiler
- Set up file-based routing with `(tabs)` and `(stacks)` groups
- Configured ESLint, Metro bundler, and `tsconfig.json`

### Database Layer
- Implemented SQLite database via `expo-sqlite` with async singleton connection
- Created `initializeDatabase()` with 19 `CREATE TABLE IF NOT EXISTS` statements
- Built 10 repository classes with dual-platform support (SQLite for native, AsyncStorage for web)
- Added seed data: default todo list, 8 expense categories, initial user stats

### State Management
- Set up Zustand 5 with 13 stores following a consistent pattern
- Each store manages `isLoading`, `error`, and entity-specific state
- Stores call repositories directly or via service layer

### Theme System
- Built light and dark theme with full color token system
- Light: primary `#4A9BE2`, background `#F4F9FF`
- Dark: primary `#D4A843`, background `#000000`
- Theme persists via AsyncStorage; toggle available at runtime

---

## Phase 2 — Core Features

### Todos
- Full CRUD with lists, priorities (low/medium/high/urgent), tags, dates
- Multi-date types: none, single, range, week, month
- Status flow: pending → in_progress → completed → archived
- Notification scheduling for due dates
- XP awards on creation and completion

### Daily Logs
- One journal entry per day with 6 text fields and 5 ratings (1-5)
- Date navigation (previous/next day)
- Mood tagging and tag support
- Weekly and monthly aggregate views

### Habits
- Frequency types: daily, specific days, X per week
- Time-of-day preference (morning/afternoon/evening/anytime)
- Automatic streak tracking (current + longest)
- Tap-to-complete with undo support
- Daily reminder scheduling

### Goals
- Three goal types: achievement, measurable, habit-based
- Milestone system with ordered sub-targets
- Progress tracking with auto-achieve when target reached
- Priority levels and deadline reminders
- Status flow: not_started → in_progress → achieved/abandoned

### Events & Calendar
- Calendar view with date-based event display
- All-day and timed events
- Color-coded categories
- Recurring event patterns (JSON config)
- Event reminders (default 15 minutes before)

---

## Phase 3 — Extended Features

### Flip Clock
- Custom `FlipDigit` component with nested-View clipping approach
- Top/bottom halves with CSS-based 3D flip animation
- Dynamic digit sizing using `useWindowDimensions`
- Fullscreen mode with auto-hide status bar
- Landscape rotation support via `expo-screen-orientation`

### Alarm System
- Multiple alarms with label, hour, minute, repeat days
- Toggle enabled/disabled per alarm
- Custom alarm tone import via `expo-document-picker`
- Sound names displayed from imported files
- Vibration toggle

### Pomodoro Focus Mode
- Configurable work/break durations
- Session tracking linked to todos and goals
- Focus session history with today's total
- Status: completed/cancelled

### Mood Tracker
- 5 mood levels with emoji and color mapping:
  - 😄 Amazing (#4CAF50) → 😢 Terrible (#F44336)
- Energy level (1-5)
- Activity tagging and notes
- Consecutive-day streak tracking

### Quick Sticky Notes
- 10 color palette for note backgrounds
- Pin/unpin with pinned notes shown first
- Inline title and content editing
- Position ordering

### Expense Tracker
- Expense and income types
- 8 default categories (Food, Transport, Shopping, etc.)
- Custom categories with icon, color, budget limit
- Payment methods: cash, card, UPI, bank transfer, other
- Date-range summary with category breakdown
- Budget tracking per category

### Planning Workspace
- Project containers with color, icon, cover image
- Notes per project (rich text content)
- File attachments with `expo-image-picker` and `expo-document-picker`
- File type detection and thumbnail support
- Archive/unarchive projects

### Kanban Board
- Column-based task organization
- Drag-and-drop card movement (gesture handler)
- Visual task status tracking

---

## Phase 4 — Dashboard & Gamification

### Dashboard
- `GreetingHeader` — Time-aware greeting with user context
- `TodaySummary` — Daily stats at a glance
- `QuickActions` — Shortcuts to create todos, log day, start focus
- `TodayHabits` — Habits due today with completion status
- `UpcomingEvents` — Next events from calendar
- `ActiveGoals` — In-progress goals with progress indicators
- `DailyLogPrompt` — Reminder card if today's log isn't written

### Gamification
- XP system with 13 awardable actions
- 5 level tiers: Beginner → Planner → Organizer → Master → Legend
- 10 badges: First Todo, Logger, Marathoner, Social Butterfly, etc.
- Achievement unlock notifications
- Persistent stats (total XP, level, streaks, todos completed)

### Notifications
- Local push notifications via `expo-notifications`
- Morning schedule summary (7:00 AM) with event count
- Daily log reminder (10:30 PM) — auto-cancelled if log exists
- Todo due-date reminders
- Habit daily reminders
- Event reminders (configurable minutes before)
- Goal deadline reminders (1 day before)
- Global toggle in settings

---

## Bug Fixes & UI Improvements

### TodoItem Layout Fix
- **Problem:** "No Time" text overlapped with tag badges (e.g., "Study") in the todo list
- **Fix:** Changed from horizontal row to stacked layout — time on its own line above tags

### Edit Screens
- Built full edit forms for habits (`habit/edit.tsx`), goals (`goal/edit.tsx`), events (`event/edit.tsx`)
- Added gold pencil edit button in detail screen headers for habits, goals, events
- Consistent form pattern: load existing data → pre-fill fields → save changes

### Navigation
- Added `onPress` navigation to todo list items (was missing)
- Consistent back navigation across all stack screens

### FlipDigit Redesign
- **Problem:** Original CSS-transform-based flip animation not rendering reliably on React Native
- **Fix:** Replaced with nested-View clipping approach using `overflow: 'hidden'` on top/bottom containers
- Each digit half clips the full digit text differently to create the split appearance

### Fullscreen Clock Fix
- **Problem:** Digits overflowed screen in fullscreen mode
- **Fix:** Dynamic sizing via `useWindowDimensions` — digit font size scales to screen width/height
- Auto-hides tab bar and status bar in fullscreen

### Landscape Support
- Added landscape rotation via `expo-screen-orientation`
- Clock layout adapts: digit sizes recalculate on dimension changes
- Works in both portrait and landscape orientations

### Custom Alarm Tones
- Integrated `expo-document-picker` to import audio files
- Stores file URI and display name
- Plays custom sound via `expo-av` when alarm triggers
- Fallback to default system sound

---

## Technical Decisions

| Decision | Rationale |
|---|---|
| **Expo Router** over React Navigation | File-based routing is simpler; typed routes improve DX |
| **Zustand** over Redux/Context | Minimal boilerplate; perfect for store-per-feature pattern |
| **SQLite** over Realm/WatermelonDB | Built into Expo; no native module linking; fast for this scale |
| **AsyncStorage web fallback** | SQLite unavailable in browser; AsyncStorage works everywhere |
| **Repository pattern** | Decouples storage from business logic; easy to test |
| **Service layer** | Houses validation, XP awards, notification scheduling |
| **Dark theme default** | Better for a planning/productivity app used throughout the day |
| **Singleton DB connection** | Prevents multiple connections; consistent across the app |
| **EAS Build** over local builds | Cloud-based builds; no local Android SDK required; easy CI/CD |
| **expo-updates** for OTA | Push JS changes instantly without rebuilding APK |

---

## Phase 5 — Deployment & Branding

### EAS Build Setup
- Installed `expo-updates` (~29.0.16) for over-the-air updates
- Created `eas.json` with three profiles: `development`, `preview`, `production`
- Configured `app.json` with `runtimeVersion`, `updates` URL, EAS project ID
- Registered EAS project (ID: `9f836fb9-8e6e-4ed9-978f-5bbcb5082249`)
- First APK build submitted to EAS Build cloud

### OTA Update System
- Auto-check for updates on app launch in `_layout.tsx`
- Manual "Check for Updates" button in More → About
- OTA-first update flow with GitHub release fallback
- Channel-based update routing (`preview` and `production`)

### App Branding
- Renamed app from "MyPlanner" to **Plandex** (Plan + Index)
- Updated all references: `app.json`, `package.json`, database filename, UI text, exports, docs
- New app icon: origami crane with checkmark on ice-blue gradient
- Package name: `com.mujju212.plandex`
- Custom splash screen and favicon

### Dark Mode Fixes
- Fixed date/time pickers showing light mode in dark theme
- Added `themeVariant` prop for iOS DateTimePicker
- Used `Appearance.setColorScheme()` in root layout for Android system-wide sync

### Help & About
- Added Help & Support section with GitHub repo link and contact email
- Enhanced About section with version display and OTA update check button

---

## Stats

| Metric | Count |
|---|---|
| Features | 14+ |
| Database tables | 19 |
| Zustand stores | 13 |
| Repositories | 10 |
| Services | 7 |
| Custom hooks | 14 |
| Type definition files | 10 |
| Utility modules | 11 |
| Screen routes | 25+ |
| UI components | 20+ |
