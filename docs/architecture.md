# Architecture

> How Plandex is structured, how data flows, and the patterns used throughout the codebase.

---

## 1. Layered Architecture

Plandex follows a **clean layered architecture** with clear separation of concerns:

```
┌────────────────────────────────────┐
│           SCREENS (app/)           │  ← Expo Router file-based screens
├────────────────────────────────────┤
│         COMPONENTS (src/components)│  ← Reusable UI pieces
├────────────────────────────────────┤
│          HOOKS (src/hooks)         │  ← Custom React hooks (compose stores)
├────────────────────────────────────┤
│         STORES (src/stores)        │  ← Zustand state management
├────────────────────────────────────┤
│        SERVICES (src/services)     │  ← Business logic & orchestration
├────────────────────────────────────┤
│     REPOSITORIES (src/database/    │  ← Data access (SQL queries)
│                  repositories/)    │
├────────────────────────────────────┤
│        DATABASE (expo-sqlite)      │  ← SQLite via expo-sqlite
└────────────────────────────────────┘
```

**Data flow:** Screen → Store action → Service → Repository → SQLite

---

## 2. Routing (Expo Router)

The app uses **Expo Router ~6.0.23** with file-based routing. The `app/` directory defines all routes:

### Root Layout (`app/_layout.tsx`)

- Initializes SQLite database via `initializeDatabase()`
- Loads saved theme (light/dark) from AsyncStorage
- Sets up push notifications (morning + evening reminders)
- Shows loading screen until DB is ready
- Wraps everything in a `<Stack>` navigator with fade transitions

### Tab Navigator (`app/(tabs)/`)

| Tab | Screen | Icon | Description |
|---|---|---|---|
| Home | `index.tsx` | `home` | Dashboard with greeting, summary, quick actions |
| Todos | `todos.tsx` | `check-circle-outline` | Todo lists with filtering |
| Logs | `logs.tsx` | `insert-drive-file` | Daily log entries |
| Calendar | `calendar.tsx` | `calendar-today` | Monthly calendar view |
| More | `more.tsx` | `more-horizontal` | Hub for all other features |

### Stack Screens (`app/(stacks)/`)

Each entity has a full CRUD flow:

| Entity | Routes | Pattern |
|---|---|---|
| Todo | `todo/create`, `todo/[id]`, `todo/edit` | Create → Detail → Edit |
| Habit | `habit/index`, `habit/create`, `habit/[id]`, `habit/edit` | List → Create → Detail → Edit |
| Goal | `goal/index`, `goal/create`, `goal/[id]`, `goal/edit` | List → Create → Detail → Edit |
| Event | `event/index`, `event/create`, `event/[id]`, `event/edit` | List → Create → Detail → Edit |
| Log | `log/daily/[date]`, `log/weekly`, `log/monthly` | Daily entry → Weekly → Monthly |
| Planning | `planning/index`, `planning/[id]` | Project list → Project detail |

Standalone feature screens: `clock.tsx`, `focus.tsx`, `mood.tsx`, `notes.tsx`, `expenses.tsx`, `kanban.tsx`, `achievements.tsx`, `analytics.tsx`, `settings.tsx`, `profile.tsx`, `search.tsx`, `notifications.tsx`, `onboarding.tsx`

---

## 3. State Management (Zustand)

All app state lives in **Zustand stores** (`src/stores/`). Each store:

- Is created with `create<StateInterface>(...)` from Zustand
- Holds both **state** (data, loading flags, errors) and **actions** (async functions)
- Calls service/repository methods for persistence
- Returns instantly reactive state to components

### Store Inventory

| Store | File | Purpose |
|---|---|---|
| `useTodoStore` | `useTodoStore.ts` | Todos CRUD, filtering, completion |
| `useEventStore` | `useEventStore.ts` | Events CRUD, calendar queries |
| `useHabitStore` | `useHabitStore.ts` | Habits CRUD, streak tracking |
| `useGoalStore` | `useGoalStore.ts` | Goals CRUD, milestones, progress |
| `useLogStore` | `useLogStore.ts` | Daily logs CRUD |
| `useClockStore` | `useClockStore.ts` | Alarms CRUD, focus sessions |
| `useMoodStore` | `useMoodStore.ts` | Mood entries CRUD |
| `useNoteStore` | `useNoteStore.ts` | Sticky notes CRUD |
| `useExpenseStore` | `useExpenseStore.ts` | Expenses/income, categories, summaries |
| `usePlanningStore` | `usePlanningStore.ts` | Planning projects, notes, files |
| `useThemeStore` | `useThemeStore.ts` | Light/dark mode toggle, persisted in AsyncStorage |
| `useSettingsStore` | `useSettingsStore.ts` | App settings & preferences |
| `useGamificationStore` | `useGamificationStore.ts` | XP, levels, badges, streaks |

### Store Pattern Example

```typescript
// src/stores/useTodoStore.ts
export const useTodoStore = create<TodoState>((set, get) => ({
    todos: [],
    isLoading: false,
    error: null,
    filter: {},

    loadTodos: async (filter?: TodoFilter) => {
        set({ isLoading: true, error: null });
        const todos = await todoService.getTodos(mergedFilter);
        set({ todos, isLoading: false });
    },

    addTodo: async (input: CreateTodoInput) => {
        const newTodo = await todoService.createTodo(input);
        set({ todos: [newTodo, ...get().todos] });
        return newTodo;
    },
    // ... completeTodo, updateTodo, deleteTodo, etc.
}));
```

---

## 4. Database Layer

### Technology

- **expo-sqlite ~16.0.10** — Asynchronous SQLite driver
- Single database file: `plandex.db`
- Singleton pattern for the database connection

### Database Initialization

1. `database.ts` — Opens/creates the SQLite database (`openDatabaseAsync`)
2. `schema.ts` — Creates all tables with `CREATE TABLE IF NOT EXISTS`
3. Seeds default data (default todo list, default expense categories, initial user stats)
4. Enables foreign keys via `PRAGMA foreign_keys = ON`

### Repository Pattern

Each entity has a dedicated repository in `src/database/repositories/`:

| Repository | Table(s) |
|---|---|
| `todoRepository.ts` | `todos`, `todo_lists` |
| `eventRepository.ts` | `events` |
| `habitRepository.ts` | `habits`, `habit_completions` |
| `goalRepository.ts` | `goals`, `goal_milestones` |
| `logRepository.ts` | `daily_logs` |
| `clockRepository.ts` | `alarms`, `focus_sessions` |
| `moodRepository.ts` | `mood_entries` |
| `noteRepository.ts` | `sticky_notes` |
| `expenseRepository.ts` | `expenses`, `expense_categories` |
| `planningRepository.ts` | `planning_projects`, `planning_notes`, `planning_files` |

Repositories handle raw SQL queries and return typed objects.

---

## 5. Services Layer

Services in `src/services/` add business logic on top of repositories:

| Service | Responsibilities |
|---|---|
| `todoService.ts` | Todo CRUD, filtering, date queries, status transitions |
| `eventService.ts` | Event CRUD, calendar-range queries, recurring expansion |
| `habitService.ts` | Habit CRUD, completion tracking, streak calculations |
| `goalService.ts` | Goal CRUD, milestone management, progress calculations |
| `logService.ts` | Daily log CRUD, streak tracking |
| `notificationService.ts` | Schedule/cancel local notifications (morning + evening) |
| `gamificationService.ts` | XP awards, level-up logic, badge checks |

---

## 6. Component Architecture

### Common Components (`src/components/common/`)

| Component | Description |
|---|---|
| `Card.tsx` | Themed card wrapper with consistent padding/shadow |
| `FAB.tsx` | Floating action button with gradient |
| `PrioritySelector.tsx` | Priority picker (low/medium/high/urgent) |
| `ProgressRing.tsx` | SVG circular progress indicator |
| `Sidebar.tsx` | Side navigation panel |
| `Tag.tsx` | Color-coded tag chip |

### Dashboard Components (`src/components/dashboard/`)

| Component | Description |
|---|---|
| `GreetingHeader.tsx` | "Good Morning, User" with date/time |
| `TodaySummary.tsx` | Stats cards (todos done, habits, streak) |
| `QuickActions.tsx` | Shortcut buttons to common actions |
| `TodayHabits.tsx` | Today's habit checklist |
| `ActiveGoals.tsx` | Goal progress cards |
| `UpcomingEvents.tsx` | Next events preview |
| `DailyLogPrompt.tsx` | Prompt to write today's log |

### Entity Components

| Folder | Components |
|---|---|
| `src/components/todo/` | `TodoItem.tsx` — Individual todo card with stacked layout |

---

## 7. Theming System

The app supports **Light** and **Dark** modes via `useThemeStore`:

| Property | Light | Dark |
|---|---|---|
| `primary` | `#4A9BE2` (blue) | `#D4A843` (gold) |
| `background` | `#F4F9FF` | `#000000` |
| `cardBackground` | `#FFFFFF` | `#141414` |
| `textPrimary` | `#1E3253` | `#F0E6D2` |
| `textSecondary` | `#6B82A8` | `#8A8070` |
| `border` | `#E0EBF5` | `#2A2520` |

Theme preference is persisted in AsyncStorage and loaded on app startup.

Theme files:
- `src/theme/colors.ts` — Color constants
- `src/theme/typography.ts` — Font sizes and weights
- `src/theme/shadows.ts` — Platform-specific shadow styles

---

## 8. Utilities (`src/utils/`)

| Utility | Purpose |
|---|---|
| `dateUtils.ts` | Date formatting, parsing, range helpers (date-fns) |
| `colorUtils.ts` | Color manipulation (lighten, darken, contrast) |
| `stringUtils.ts` | Text truncation, capitalization |
| `validationUtils.ts` | Input validation helpers |
| `searchUtils.ts` | Full-text search matching |
| `dataUtils.ts` | Data transformation and aggregation |
| `exportUtils.ts` | Export data to various formats |
| `fileUtils.ts` | File system helpers |
| `notificationUtils.ts` | Notification scheduling helpers |
| `analyticsCalc.ts` | Analytics calculation functions |
| `constants.ts` | App-wide constant values |
