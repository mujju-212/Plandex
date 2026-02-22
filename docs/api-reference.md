# API Reference

> Complete reference for all Zustand stores, services, repositories, and hooks in Plandex.

---

## Table of Contents

- [Stores (State Management)](#stores)
- [Services (Business Logic)](#services)
- [Repositories (Data Access)](#repositories)
- [Hooks](#hooks)

---

## Stores

All stores use **Zustand** and follow the pattern:

```ts
export const useXxxStore = create<XxxState>()((set, get) => ({
  // state
  items: [],
  isLoading: false,
  error: null,
  // actions
  async loadItems() { ... },
  async addItem(input) { ... },
}));
```

Each store calls a repository directly (or a service that calls a repository) and manages loading/error state internally.

---

### `useTodoStore`

**File:** `src/stores/useTodoStore.ts`

| State | Type | Description |
|---|---|---|
| `todos` | `Todo[]` | Current list |
| `selectedTodo` | `Todo \| null` | Detail view selection |
| `isLoading` | `boolean` | |
| `error` | `string \| null` | |
| `filter` | `TodoFilter` | Active filter |

| Action | Signature | Description |
|---|---|---|
| `loadTodos` | `(filter?: TodoFilter) => void` | Fetch todos; merges with existing filter |
| `loadTodosForDate` | `(date: string) => void` | Fetch todos for a specific date |
| `addTodo` | `(input: CreateTodoInput) => void` | Create todo + schedule notification |
| `updateTodo` | `(id: number, input: UpdateTodoInput) => void` | Update a todo |
| `completeTodo` | `(id: number, notesAfter?: string) => void` | Mark completed; awards XP |
| `uncompleteTodo` | `(id: number) => void` | Revert to pending |
| `deleteTodo` | `(id: number) => void` | Delete |
| `archiveTodo` | `(id: number) => void` | Archive |
| `setFilter` | `(filter: TodoFilter) => void` | Update filter + reload |
| `selectTodo` | `(todo: Todo \| null) => void` | Set selection |
| `clearError` | `() => void` | Clear error |

---

### `useEventStore`

**File:** `src/stores/useEventStore.ts`

| State | Type |
|---|---|
| `events` | `AppEvent[]` |
| `selectedEvent` | `AppEvent \| null` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadEvents` | `(filter?: EventFilter) => void` | Fetch events |
| `loadEventsForDate` | `(date: string) => void` | Events for a date |
| `addEvent` | `(input: CreateEventInput) => void` | Create + schedule reminder |
| `updateEvent` | `(id: number, input: UpdateEventInput) => void` | Update |
| `deleteEvent` | `(id: number) => void` | Delete |
| `completeEvent` | `(id: number) => void` | Mark completed |
| `selectEvent` | `(event: AppEvent \| null) => void` | Set selection |
| `clearError` | `() => void` | Clear error |

---

### `useHabitStore`

**File:** `src/stores/useHabitStore.ts`

| State | Type |
|---|---|
| `habits` | `Habit[]` |
| `todayCompletions` | `HabitCompletion[]` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadHabits` | `(filter?: HabitFilter) => void` | Fetch habits |
| `loadTodayCompletions` | `() => void` | Today's completions |
| `addHabit` | `(input: CreateHabitInput) => void` | Create + schedule daily reminder |
| `updateHabit` | `(id: number, input: UpdateHabitInput) => void` | Update |
| `deleteHabit` | `(id: number) => void` | Delete |
| `toggleCompletion` | `(habitId: number, date: string) => void` | Log or undo completion |

---

### `useGoalStore`

**File:** `src/stores/useGoalStore.ts`

| State | Type |
|---|---|
| `goals` | `Goal[]` |
| `selectedGoal` | `Goal \| null` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadGoals` | `(filter?: GoalFilter) => void` | Fetch goals |
| `addGoal` | `(input: CreateGoalInput) => void` | Create + deadline reminder |
| `updateGoal` | `(id: number, input: UpdateGoalInput) => void` | Update |
| `deleteGoal` | `(id: number) => void` | Delete |
| `achieveGoal` | `(id: number, notes?: string) => void` | Mark achieved |
| `updateProgress` | `(id: number, value: number) => void` | Update progress |
| `completeMilestone` | `(goalId: number, milestoneId: number) => void` | Complete milestone |
| `selectGoal` | `(goal: Goal \| null) => void` | Set selection |

---

### `useLogStore`

**File:** `src/stores/useLogStore.ts`

| State | Type |
|---|---|
| `logs` | `DailyLog[]` |
| `currentLog` | `DailyLog \| null` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadLogs` | `() => void` | All logs |
| `loadRecentLogs` | `(limit?: number) => void` | N most recent |
| `loadLogForDate` | `(date: string) => void` | Single log |
| `saveLog` | `(input: CreateDailyLogInput) => void` | Upsert |
| `updateLog` | `(date: string, input: UpdateDailyLogInput) => void` | Update |
| `deleteLog` | `(date: string) => void` | Delete |
| `clearError` | `() => void` | Clear error |

---

### `useClockStore`

**File:** `src/stores/useClockStore.ts`

| State | Type |
|---|---|
| `alarms` | `Alarm[]` |
| `sessions` | `FocusSession[]` |
| `todayFocusMinutes` | `number` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadAlarms` | `() => void` | Fetch all alarms |
| `addAlarm` | `(input: CreateAlarmInput) => void` | Create alarm |
| `updateAlarm` | `(id: number, input: UpdateAlarmInput) => void` | Update alarm |
| `deleteAlarm` | `(id: number) => void` | Delete alarm |
| `toggleAlarm` | `(id: number) => void` | Toggle enabled |
| `loadSessions` | `() => void` | Recent focus sessions |
| `startSession` | `(input: CreateFocusSessionInput) => void` | Start focus |
| `endSession` | `(id: number, actualSeconds: number, status?: string) => void` | End focus |
| `loadTodayFocus` | `() => void` | Today's focus minutes |

---

### `useExpenseStore`

**File:** `src/stores/useExpenseStore.ts`

| State | Type |
|---|---|
| `expenses` | `Expense[]` |
| `categories` | `ExpenseCategory[]` |
| `summary` | `ExpenseSummary \| null` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadExpenses` | `(filter?: ExpenseFilter) => void` | Fetch expenses |
| `loadCategories` | `() => void` | Load categories |
| `loadSummary` | `(startDate: string, endDate: string) => void` | Date range summary |
| `addExpense` | `(input: CreateExpenseInput) => void` | Create expense |
| `updateExpense` | `(id: number, input: UpdateExpenseInput) => void` | Update |
| `deleteExpense` | `(id: number) => void` | Delete |
| `addCategory` | `(name: string, icon: string, color: string, budget?: number) => void` | New category |

---

### `useMoodStore`

**File:** `src/stores/useMoodStore.ts`

| State | Type |
|---|---|
| `entries` | `MoodEntry[]` |
| `todayMood` | `MoodEntry \| null` |
| `streak` | `number` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadEntries` | `(limit?: number) => void` | Fetch entries + streak |
| `loadTodayMood` | `() => void` | Today's mood |
| `addEntry` | `(input: CreateMoodInput) => void` | Create entry |
| `updateEntry` | `(id: number, input: UpdateMoodInput) => void` | Update |
| `deleteEntry` | `(id: number) => void` | Delete |

---

### `useNoteStore`

**File:** `src/stores/useNoteStore.ts`

| State | Type |
|---|---|
| `notes` | `StickyNote[]` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadNotes` | `() => void` | Fetch all notes |
| `addNote` | `(input: CreateNoteInput) => void` | Create note |
| `updateNote` | `(id: number, input: UpdateNoteInput) => void` | Update |
| `deleteNote` | `(id: number) => void` | Delete |
| `togglePin` | `(id: number) => void` | Toggle pinned |

---

### `usePlanningStore`

**File:** `src/stores/usePlanningStore.ts`

| State | Type |
|---|---|
| `projects` | `PlanningProject[]` |
| `currentProject` | `PlanningProject \| null` |
| `notes` | `PlanningNote[]` |
| `files` | `PlanningFile[]` |
| `isLoading` | `boolean` |
| `error` | `string \| null` |

| Action | Signature | Description |
|---|---|---|
| `loadProjects` | `() => void` | All projects |
| `loadProjectDetail` | `(id: number) => void` | Project + notes + files |
| `addProject` | `(input: CreateProjectInput) => void` | Create project |
| `updateProject` | `(id: number, input: UpdateProjectInput) => void` | Update |
| `deleteProject` | `(id: number) => void` | Delete |
| `addNote` | `(projectId: number, title?: string, content?: string) => void` | Add note |
| `updateNote` | `(id: number, title: string, content: string) => void` | Update note |
| `deleteNote` | `(id: number) => void` | Delete note |
| `addFile` | `(input: CreateFileInput) => void` | Add file |
| `deleteFile` | `(id: number) => void` | Delete file |

---

### `useGamificationStore`

**File:** `src/stores/useGamificationStore.ts`

| State | Type |
|---|---|
| `totalXP` | `number` |
| `currentLevel` | `number` |
| `levelTitle` | `string` |
| `currentStreak` | `number` |
| `todosCompleted` | `number` |
| `badges` | `Badge[]` |
| `isLoading` | `boolean` |

| Action | Signature | Description |
|---|---|---|
| `loadStats` | `() => void` | Load XP, level, streak, badges |
| `awardXP` | `(action: string) => void` | Award XP for an action |

---

### `useThemeStore`

**File:** `src/stores/useThemeStore.ts`

| State | Type |
|---|---|
| `isDark` | `boolean` |
| `colors` | `ThemeColors` |

| Action | Signature | Description |
|---|---|---|
| `toggleTheme` | `() => void` | Switch light/dark; persists to AsyncStorage |
| `loadTheme` | `() => void` | Load saved preference |

**Exports:** `lightColors`, `darkColors`, `ThemeColors` type.

---

### `useSettingsStore`

**File:** `src/stores/useSettingsStore.ts`

| State | Type |
|---|---|
| `notificationsEnabled` | `boolean` |

| Action | Signature | Description |
|---|---|---|
| `toggleNotifications` | `() => void` | Toggle; cancels all if disabled |
| `loadSettings` | `() => void` | Load from AsyncStorage |

---

## Services

Services contain **business logic** — validation, XP awarding, notification scheduling — and delegate persistence to repositories.

---

### `TodoService`

**File:** `src/services/todoService.ts`

| Method | Parameters | Returns | Notes |
|---|---|---|---|
| `getTodos` | `filter?: TodoFilter` | `Todo[]` | |
| `getTodosForDate` | `date: string` | `Todo[]` | |
| `createTodo` | `input: CreateTodoInput` | `void` | Awards `create_todo` XP |
| `updateTodo` | `id, input` | `void` | |
| `completeTodo` | `id, notesAfter?` | `void` | Awards `complete_todo` XP; extra for urgent |
| `deleteTodo` | `id` | `void` | |
| `archiveTodo` | `id` | `void` | |

---

### `EventService`

**File:** `src/services/eventService.ts`

| Method | Parameters | Returns |
|---|---|---|
| `createEvent` | `input: CreateEventInput` | `void` |
| `getEvents` | `filter?: EventFilter` | `AppEvent[]` |
| `getEventById` | `id` | `AppEvent` |
| `getEventsForDate` | `date` | `AppEvent[]` |
| `updateEvent` | `id, input` | `void` |
| `deleteEvent` | `id` | `void` |
| `completeEvent` | `id` | `void` |
| `cancelEvent` | `id` | `void` |

---

### `HabitService`

**File:** `src/services/habitService.ts`

| Method | Parameters | Returns |
|---|---|---|
| `createHabit` | `input: CreateHabitInput` | `void` |
| `getHabits` | `filter?: HabitFilter` | `Habit[]` |
| `getHabitById` | `id` | `Habit` |
| `updateHabit` | `id, input` | `void` |
| `deleteHabit` | `id` | `void` |
| `logCompletion` | `habitId, date, notes?` | `void` |
| `undoCompletion` | `habitId, date` | `void` |
| `getCompletionsForDate` | `date` | `HabitCompletion[]` |
| `getCompletionsForHabit` | `habitId` | `HabitCompletion[]` |

---

### `GoalService`

**File:** `src/services/goalService.ts`

| Method | Parameters | Returns |
|---|---|---|
| `createGoal` | `input: CreateGoalInput` | `void` |
| `getGoals` | `filter?: GoalFilter` | `Goal[]` |
| `getGoalById` | `id` | `Goal` |
| `updateGoal` | `id, input` | `void` |
| `deleteGoal` | `id` | `void` |
| `achieveGoal` | `id, notes?` | `void` |
| `updateProgress` | `id, value` | `void` |
| `completeMilestone` | `goalId, milestoneId` | `void` |

---

### `LogService`

**File:** `src/services/logService.ts`

| Method | Parameters | Returns | Notes |
|---|---|---|---|
| `getDailyLog` | `date` | `DailyLog \| null` | |
| `getAllLogs` | — | `DailyLog[]` | |
| `getRecentLogs` | `limit?` | `DailyLog[]` | |
| `saveDailyLog` | `input` | `void` | Awards XP |
| `updateDailyLog` | `date, input` | `void` | |
| `deleteDailyLog` | `date` | `void` | |

---

### `GamificationService`

**File:** `src/services/gamificationService.ts`

| Method | Parameters | Returns | Notes |
|---|---|---|---|
| `awardXP` | `action, customAmount?` | `void` | Computes level, saves badges |
| `incrementStat` | `statName` | `void` | `total_todos_completed` or `current_log_streak` |
| `unlockBadge` | `badgeId` | `void` | Manual badge unlock |

**Exported constants:**

| Constant | Description |
|---|---|
| `XP_AWARDS` | Map of 13 actions → XP amounts |
| `LEVELS` | 5 levels with XP thresholds and titles |

---

### `NotificationService`

**File:** `src/services/notificationService.ts`  
Exports standalone functions (not a class).

| Function | Description |
|---|---|
| `requestNotificationPermissions()` | Request OS permissions |
| `hasNotificationPermission()` | Check permission status |
| `scheduleTodoReminder(todoId, title, dueDate, dueTime?)` | Schedule todo reminder |
| `scheduleHabitReminder(habitId, title, reminderTime)` | Daily repeating reminder |
| `scheduleEventReminder(eventId, title, startDatetime, minutesBefore?)` | Event reminder (default 15 min before) |
| `scheduleGoalDeadlineReminder(goalId, title, endDate)` | 1-day-before deadline |
| `cancelNotification(notificationId)` | Cancel specific notification |
| `cancelAllNotifications()` | Cancel all |
| `getScheduledNotifications()` | List scheduled |
| `scheduleDailyLogReminder()` | 10:30 PM daily reminder |
| `cancelDailyLogReminder()` | Cancel daily log reminder |
| `scheduleMorningScheduleNotification()` | 7:00 AM notification |
| `scheduleMorningScheduleWithEvents(count, titles)` | Morning with event summary |

---

## Repositories

All repositories use a **dual-platform pattern**: `AsyncStorage` for web, `expo-sqlite` for native.

```ts
class XxxRepository {
  private db: SQLiteDatabase | null;
  constructor(db: SQLiteDatabase | null) { this.db = db; }
  // If this.db is null → use AsyncStorage fallback
}
```

---

### `TodoRepository`

**File:** `src/database/repositories/todoRepository.ts`

| Method | Description |
|---|---|
| `insert(input)` | Insert todo |
| `findById(id)` | Find by ID |
| `findAll(filter?)` | Filter by status, priority, date, limit; excludes archived by default |
| `update(id, input)` | Update fields |
| `complete(id)` | Set status=completed, completed_at=now |
| `delete(id)` | Delete |

---

### `EventRepository`

**File:** `src/database/repositories/eventRepository.ts`

| Method | Description |
|---|---|
| `insert(input)` | Insert event |
| `findAll(filter?)` | Filter by category, status, date, date range, search |
| `findById(id)` | Find by ID |
| `findByDate(date)` | Events spanning a date |
| `update(id, input)` | Update |
| `delete(id)` | Delete |

---

### `HabitRepository`

**File:** `src/database/repositories/habitRepository.ts`

| Method | Description |
|---|---|
| `insert(input)` | Insert habit |
| `findAll(filter?)` | Filter by category, is_active, search |
| `findById(id)` | Find by ID |
| `update(id, input)` | Update |
| `delete(id)` | Delete |
| `logCompletion(habitId, date, notes?)` | Insert completion + update streaks |
| `undoCompletion(habitId, date)` | Remove completion + decrement streak |
| `getCompletionsForDate(date)` | All completions for a date |
| `getCompletionsForHabit(habitId)` | All completions for a habit |

---

### `GoalRepository`

**File:** `src/database/repositories/goalRepository.ts`

| Method | Description |
|---|---|
| `insert(input)` | Insert goal + milestones |
| `findAll(filter?)` | Filter by category, status, priority, search |
| `findById(id)` | Find by ID (includes milestones) |
| `update(id, input)` | Update; auto-sets completed_at on achieve |
| `delete(id)` | Delete (cascades milestones) |
| `completeMilestone(goalId, milestoneId)` | Complete milestone |
| `updateProgress(goalId, value)` | Update progress; auto-achieves if target reached |

---

### `LogRepository`

**File:** `src/database/repositories/logRepository.ts`

| Method | Description |
|---|---|
| `upsert(input)` | Insert or replace log |
| `findByDate(date)` | Find by date |
| `findAll()` | All logs, sorted by date DESC |
| `findRecent(limit?)` | N most recent |
| `update(date, input)` | Update |
| `delete(date)` | Delete |

---

### `ClockRepository`

**File:** `src/database/repositories/clockRepository.ts`

| Method | Description |
|---|---|
| `insertAlarm(input)` | Insert alarm |
| `getAllAlarms()` | All alarms sorted by time |
| `updateAlarm(id, input)` | Update alarm |
| `deleteAlarm(id)` | Delete alarm |
| `insertSession(input)` | Start focus session |
| `completeSession(id, actualSeconds, status?)` | End session |
| `getRecentSessions(limit?)` | Recent sessions (default 20) |
| `getTodayFocusMinutes()` | Today's total focus |

---

### `ExpenseRepository`

**File:** `src/database/repositories/expenseRepository.ts`

| Method | Description |
|---|---|
| `getCategories()` | All categories |
| `addCategory(name, icon, color, budgetLimit?)` | New category |
| `insert(input)` | Insert expense |
| `findAll(filter?)` | Filter expenses |
| `findById(id)` | Find by ID |
| `update(id, input)` | Update |
| `delete(id)` | Delete |
| `getSummary(startDate, endDate)` | Expense/income summary with category breakdown |

---

### `MoodRepository`

**File:** `src/database/repositories/moodRepository.ts`

| Method | Description |
|---|---|
| `insert(input)` | Insert/replace mood entry |
| `findAll(limit?)` | Entries (default 30) |
| `findById(id)` | Find by ID |
| `findByDate(date)` | Find by date |
| `update(id, input)` | Update |
| `delete(id)` | Delete |
| `getStreak()` | Consecutive-day streak |

---

### `NoteRepository`

**File:** `src/database/repositories/noteRepository.ts`

| Method | Description |
|---|---|
| `insert(input)` | Insert note |
| `findAll()` | All notes (pinned first) |
| `findById(id)` | Find by ID |
| `update(id, input)` | Update |
| `delete(id)` | Delete |

---

### `PlanningRepository`

**File:** `src/database/repositories/planningRepository.ts`

| Method | Description |
|---|---|
| `insertProject(input)` | Create project |
| `findAllProjects(includeArchived?)` | All projects (with note/file counts) |
| `findProjectById(id)` | Get by ID |
| `updateProject(id, input)` | Update |
| `deleteProject(id)` | Delete + cascade |
| `insertNote(input)` | Add note to project |
| `getNotesForProject(projectId)` | Notes for project |
| `updateNote(id, title, content)` | Update note |
| `deleteNote(id)` | Delete note |
| `insertFile(input)` | Add file to project |
| `getFilesForProject(projectId)` | Files for project |
| `deleteFile(id)` | Delete file |

---

## Hooks

### `useNotifications`

**File:** `src/hooks/useNotifications.ts`

```ts
useNotifications(dailyLogCompletedToday?: boolean): void
```

**Behavior:**
1. On mount: requests notification permissions
2. Schedules morning notifications (7:00 AM)
3. Schedules daily log reminder (10:30 PM)
4. Watches `dailyLogCompletedToday`: cancels 10:30 PM reminder if `true`, re-schedules if `false`

---

### `useTheme`

**File:** `src/hooks/useTheme.ts`

Returns the current `ThemeColors` object from `useThemeStore`.

---

### `useDatabase`

**File:** `src/hooks/useDatabase.ts`

Initializes the SQLite database connection on mount. Returns `{ db, isReady }`.

---

### `useDebounce`

**File:** `src/hooks/useDebounce.ts`

```ts
useDebounce<T>(value: T, delay?: number): T
```

Returns a debounced version of the input value.

---

### Other Hooks

| Hook | File | Purpose |
|---|---|---|
| `useAnalytics` | `src/hooks/useAnalytics.ts` | Analytics data access |
| `useAppState` | `src/hooks/useAppState.ts` | App foreground/background state |
| `useEvents` | `src/hooks/useEvents.ts` | Event data access |
| `useGamification` | `src/hooks/useGamification.ts` | XP/badge data access |
| `useGoals` | `src/hooks/useGoals.ts` | Goal data access |
| `useHabits` | `src/hooks/useHabits.ts` | Habit data access |
| `useLogs` | `src/hooks/useLogs.ts` | Log data access |
| `useProjects` | `src/hooks/useProjects.ts` | Project data access |
| `useSearch` | `src/hooks/useSearch.ts` | Search state |
| `useTodos` | `src/hooks/useTodos.ts` | Todo data access |
