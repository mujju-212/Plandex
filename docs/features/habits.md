# Habits

> Streak-based habit tracking with flexible scheduling and completion tracking.

---

## Overview

The Habits feature lets users define recurring behaviors they want to build, track completions, and maintain streaks.

## Screens

| Screen | File | Purpose |
|---|---|---|
| Habits List | `app/(stacks)/habit/index.tsx` | Browse all habits |
| Create Habit | `app/(stacks)/habit/create.tsx` | Full creation form |
| Habit Detail | `app/(stacks)/habit/[id].tsx` | View details, streak stats, completions |
| Edit Habit | `app/(stacks)/habit/edit.tsx` | Edit all fields |

## Data Model

### `habits` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `title` | TEXT | required | Habit name |
| `description` | TEXT | NULL | Optional description |
| `category` | TEXT | `'general'` | Category enum |
| `frequency_type` | TEXT | `'daily'` | `daily` / `specific_days` / `x_per_week` |
| `specific_days` | TEXT | `'[]'` | JSON array of day numbers (0=Sun..6=Sat) |
| `times_per_week` | INTEGER | NULL | Target times per week |
| `time_of_day` | TEXT | `'anytime'` | `morning` / `afternoon` / `evening` / `anytime` |
| `reminder_time` | TEXT | NULL | Time string for reminder |
| `color` | TEXT | `'#00BFA5'` | Hex color |
| `icon` | TEXT | `'check-circle'` | Icon name |
| `current_streak` | INTEGER | 0 | Active streak count |
| `longest_streak` | INTEGER | 0 | All-time best streak |
| `total_completions` | INTEGER | 0 | Lifetime completions |
| `is_active` | BOOLEAN | 1 | Active/paused toggle |
| `start_date` | TEXT | NULL | When tracking started |
| `end_date` | TEXT | NULL | Optional end date |

### `habit_completions` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `habit_id` | INTEGER FK | required | References `habits.id` (CASCADE delete) |
| `date` | TEXT | required | Completion date |
| `completed_at` | DATETIME | NOW | Timestamp |
| `notes` | TEXT | NULL | Optional completion notes |

**Unique constraint:** `(habit_id, date)` — one completion per habit per day.

## Categories

`health` | `fitness` | `learning` | `productivity` | `mindfulness` | `social` | `creative` | `general`

## Frequency Configuration

| Type | How It Works |
|---|---|
| `daily` | Expected every day |
| `specific_days` | Only on selected weekdays (stored as `[0,1,3,5]` etc.) |
| `x_per_week` | Target N completions per week, any days |

## Streak Tracking

- **Current Streak:** Consecutive days/periods with completions
- **Longest Streak:** All-time record
- Streaks reset when a required day is missed
- Displayed prominently on habit detail screen

## Edit Screen

The `habit/edit.tsx` screen provides a full form to modify:
- Title, description
- Category (picker)
- Color (color selector)
- Frequency type + specific days / times per week
- Time of day
- Reminder time

All changes saved back via `useHabitStore.updateHabit()`.
