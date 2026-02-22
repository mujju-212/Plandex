# Features Overview

> Complete guide to every feature in Plandex.

---

## Core Features

| # | Feature | Screen | Store | Detail Doc |
|---|---|---|---|---|
| 1 | [Todos](#1-todos) | `(tabs)/todos.tsx` | `useTodoStore` | [todos.md](./todos.md) |
| 2 | [Daily Logs](#2-daily-logs) | `(tabs)/logs.tsx` | `useLogStore` | [daily-logs.md](./daily-logs.md) |
| 3 | [Habits](#3-habits) | `(stacks)/habit/` | `useHabitStore` | [habits.md](./habits.md) |
| 4 | [Goals](#4-goals) | `(stacks)/goal/` | `useGoalStore` | [goals.md](./goals.md) |
| 5 | [Events & Calendar](#5-events--calendar) | `(tabs)/calendar.tsx` | `useEventStore` | [events.md](./events.md) |
| 6 | [Dashboard](#6-dashboard) | `(tabs)/index.tsx` | Multiple | [dashboard.md](./dashboard.md) |

## Extended Features

| # | Feature | Screen | Store | Detail Doc |
|---|---|---|---|---|
| 7 | [Flip Clock](#7-flip-clock) | `(stacks)/clock.tsx` | `useClockStore` | [clock.md](./clock.md) |
| 8 | [Pomodoro Focus](#8-pomodoro-focus-mode) | `(stacks)/focus.tsx` | `useClockStore` | [pomodoro.md](./pomodoro.md) |
| 9 | [Mood Tracker](#9-mood-tracker) | `(stacks)/mood.tsx` | `useMoodStore` | [mood-tracker.md](./mood-tracker.md) |
| 10 | [Sticky Notes](#10-quick-sticky-notes) | `(stacks)/notes.tsx` | `useNoteStore` | [sticky-notes.md](./sticky-notes.md) |
| 11 | [Expense Tracker](#11-expense-tracker) | `(stacks)/expenses.tsx` | `useExpenseStore` | [expense-tracker.md](./expense-tracker.md) |
| 12 | [Planning Workspace](#12-planning-workspace) | `(stacks)/planning/` | `usePlanningStore` | [planning.md](./planning.md) |
| 13 | [Kanban Board](#13-kanban-board) | `(stacks)/kanban.tsx` | `useTodoStore` | [kanban.md](./kanban.md) |
| 14 | [Gamification](#14-gamification) | `(stacks)/achievements.tsx` | `useGamificationStore` | [gamification.md](./gamification.md) |

---

## 1. Todos

Full-featured task management with lists, priorities, dates, tags, and archiving.

**Screens:** `todos.tsx` (tab) → `todo/create.tsx` → `todo/[id].tsx` (detail) → `todo/edit.tsx`

**Capabilities:**
- Create todos with title, description, priority (low/medium/high/urgent), and tags
- Flexible date types: none, single date, date range, week, month
- Optional due time
- Organize into color-coded lists (default "General" list created automatically)
- Filter by status (pending/in_progress/completed/archived), priority, list, date range
- Complete/uncomplete with timestamp tracking
- Archive completed todos
- Tap to navigate to detail, edit with full form
- Position ordering for manual sorting

**Types:** `Priority`, `TodoStatus`, `DateType`, `Todo`, `CreateTodoInput`, `UpdateTodoInput`, `TodoFilter`

---

## 2. Daily Logs

Reflective journaling system for daily review and self-assessment.

**Screens:** `logs.tsx` (tab) → `log/daily/[date].tsx` → `log/weekly.tsx` → `log/monthly.tsx`

**Capabilities:**
- One log per day (unique date constraint)
- Free-text sections: What I Did, Achievements, Learnings, Challenges, Tomorrow's Intention, Gratitude
- Rating scales (1-5): Productivity, Satisfaction, Completion, Energy, Overall
- Mood selection
- Tagging system
- Weekly and monthly summary views

**Types:** `DailyLog`, `CreateDailyLogInput`, `UpdateDailyLogInput`

---

## 3. Habits

Streak-based habit tracking with flexible scheduling options.

**Screens:** `habit/index.tsx` → `habit/create.tsx` → `habit/[id].tsx` → `habit/edit.tsx`

**Capabilities:**
- Categories: health, fitness, learning, productivity, mindfulness, social, creative, general
- Frequency types: daily, specific days (pick which days), X times per week
- Time of day preference: morning, afternoon, evening, anytime
- Optional reminder time
- Color and icon customization
- Automatic streak tracking (current + longest)
- Total completions counter
- Active/inactive toggle
- Daily completion with optional notes

**Types:** `HabitCategory`, `HabitFrequency`, `HabitTimeOfDay`, `Habit`, `HabitCompletion`, `CreateHabitInput`, `UpdateHabitInput`, `HabitFilter`

---

## 4. Goals

Multi-type goal system with milestones and progress tracking.

**Screens:** `goal/index.tsx` → `goal/create.tsx` → `goal/[id].tsx` → `goal/edit.tsx`

**Capabilities:**
- Goal types: achievement (yes/no), measurable (numeric target), habit-based
- Categories: health, career, finance, learning, personal, social, creative, fitness, general
- Duration types: daily, weekly, monthly, quarterly, yearly, custom
- Numeric progress tracking (current_value / target_value with unit)
- Priority levels (low/medium/high)
- Milestones with target dates and completion tracking
- Status flow: not_started → in_progress → achieved/failed/deferred/cancelled
- Color and icon customization
- Completion notes

**Types:** `GoalCategory`, `GoalType`, `GoalDuration`, `GoalStatus`, `GoalPriority`, `Goal`, `GoalMilestone`, `CreateGoalInput`, `UpdateGoalInput`, `GoalFilter`

---

## 5. Events & Calendar

Event scheduling with a monthly calendar view and recurring event support.

**Screens:** `calendar.tsx` (tab) → `event/index.tsx` → `event/create.tsx` → `event/[id].tsx` → `event/edit.tsx`

**Capabilities:**
- Event types: single, duration, full-day, multi-day, recurring
- Categories: general, work, personal, health, social, other
- ISO datetime start/end with all-day toggle
- Location field
- Color customization
- Recurring patterns: daily, weekly, monthly with configurable interval and end date
- Status tracking: upcoming, ongoing, completed, cancelled
- Calendar tab shows monthly grid with event dots
- Full event form with 5 DateTimePicker instances (start date, start time, end date, end time, recurrence end)

**Types:** `EventType`, `EventCategory`, `EventStatus`, `AppEvent`, `RecurringPattern`, `CreateEventInput`, `UpdateEventInput`, `EventFilter`

---

## 6. Dashboard

The home tab aggregates data from all features into a single overview.

**Screen:** `(tabs)/index.tsx`

**Dashboard Components:**
| Component | Shows |
|---|---|
| `GreetingHeader` | Time-based greeting + current date |
| `TodaySummary` | Completed todos, active habits, current streak |
| `QuickActions` | Shortcut buttons (new todo, log, habit check, etc.) |
| `TodayHabits` | Today's habits with check-off |
| `ActiveGoals` | Goal progress cards with progress rings |
| `UpcomingEvents` | Next upcoming events |
| `DailyLogPrompt` | CTA to write today's log if not yet done |

---

## 7. Flip Clock

Beautiful animated flip-digit clock with 4 modes.

**Screen:** `(stacks)/clock.tsx`

**Modes:**
| Mode | Description |
|---|---|
| **Clock** | Real-time flip clock showing current time (12h/24h) |
| **Timer** | Countdown timer with configurable duration |
| **Stopwatch** | Count-up timer with lap tracking |
| **Alarm** | Alarm manager with create/edit/delete/toggle |

**Key Implementation Details:**
- **FlipDigit Component:** Uses nested-View clipping approach (top half / bottom half), each half clips a large digit text to show the correct portion
- **Fullscreen Mode:** Dynamic digit sizing via `useWindowDimensions()` — recalculates on rotation
- **Landscape Support:** `supportedOrientations={['portrait', 'landscape']}` with dynamic recalculation
- **Custom Alarm Tones:** Import audio files via `expo-document-picker`, stored as `sound_uri` + `sound_name` in the alarms table
- **Alarm Sound Playback:** Uses `expo-av` for audio playback + `expo-haptics` for vibration

**Store:** `useClockStore` — manages alarms CRUD and focus sessions

---

## 8. Pomodoro Focus Mode

Configurable focus timer linked to productivity goals.

**Screen:** `(stacks)/focus.tsx`

**Capabilities:**
- Default 25-minute Pomodoro sessions
- Configurable session duration
- Link sessions to specific todos or goals
- Session tracking with actual time elapsed
- Status: in_progress → completed / cancelled
- Session notes
- Saved to `focus_sessions` table for analytics

**Types:** `FocusSession`, `CreateFocusSessionInput`

---

## 9. Mood Tracker

Daily mood and energy logging with activity tracking.

**Screen:** `(stacks)/mood.tsx`

**Capabilities:**
- One entry per day (unique date)
- 5 mood levels: amazing 🤩, good 😊, okay 😐, bad 😔, terrible 😢
- Mood score (1-5) with corresponding colors (green → red)
- Energy level tracking (1-5)
- Free-text notes
- Tag system
- Activity selection from 15 predefined activities (Exercise, Work, Study, Social, Family, Hobby, Travel, Rest, Reading, Gaming, Meditation, Music, Cooking, Shopping, Nature)

**Types:** `MoodType`, `MoodEntry`, `CreateMoodInput`, `UpdateMoodInput`, `MOOD_EMOJIS`, `MOOD_COLORS`, `MOOD_ACTIVITIES`

---

## 10. Quick Sticky Notes

Color-coded note cards with pin support.

**Screen:** `(stacks)/notes.tsx`

**Capabilities:**
- Create notes with title and content
- 10 color options (yellow, orange, red, purple, blue, teal, green, brown, grey, pink)
- Pin important notes to top
- Position ordering
- Grid layout with card-style display

**Types:** `StickyNote`, `CreateNoteInput`, `UpdateNoteInput`, `NOTE_COLORS`

---

## 11. Expense Tracker

Income and expense management with categories and summaries.

**Screen:** `(stacks)/expenses.tsx`

**Capabilities:**
- Track expenses and income separately
- 8 default categories: Food & Drinks, Transport, Shopping, Bills, Entertainment, Health, Education, Other
- Custom categories with icon, color, and budget limit
- Payment methods: cash, card, UPI, bank_transfer, other
- Recurring expense flag
- Tag system
- Summary view: total expense, total income, balance, breakdown by category with percentages
- Date range filtering

**Types:** `ExpenseType`, `PaymentMethod`, `ExpenseCategory`, `Expense`, `CreateExpenseInput`, `UpdateExpenseInput`, `ExpenseFilter`, `ExpenseSummary`

---

## 12. Planning Workspace

Project-based organizer for notes and files.

**Screen:** `(stacks)/planning/index.tsx` → `planning/[id].tsx`

**Capabilities:**
- Create projects with title, description, color, and icon
- 10 project colors and 10 project icons available
- Cover image support
- Archive projects
- Position ordering
- Add notes within projects (title + content)
- Attach files (image, video, PDF, document, audio, other) with file size and thumbnails
- Notes and files counts on project cards

**Types:** `PlanningFileType`, `PlanningProject`, `PlanningNote`, `PlanningFile`, `CreateProjectInput`, `UpdateProjectInput`, `CreateNoteInput`, `CreateFileInput`, `PROJECT_COLORS`, `PROJECT_ICONS`

---

## 13. Kanban Board

Visual drag-and-drop task board.

**Screen:** `(stacks)/kanban.tsx`

**Capabilities:**
- Column-based board view (e.g., To Do, In Progress, Done)
- Drag-and-drop cards between columns using `react-native-gesture-handler`
- Powered by the same `useTodoStore` — todos are displayed in Kanban format
- Visual card representation with priority colors and tags

---

## 14. Gamification

XP, levels, streaks, and badges to encourage engagement.

**Screen:** `(stacks)/achievements.tsx`

**Capabilities:**
- XP earned for completing todos, logging daily, maintaining streaks
- Level system based on total XP
- Current and longest log streak tracking
- Badge collection system
- User stats dashboard (total XP, level, todos completed, streak)

**Store:** `useGamificationStore` — manages XP, levels, badge unlocks
**Table:** `user_stats`, `user_badges`
