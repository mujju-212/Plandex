# Database Schema

> Complete SQLite database schema for Plandex — all tables, columns, types, relationships, and constraints.

---

## Database Info

| Property | Value |
|---|---|
| **Engine** | SQLite via `expo-sqlite ~16.0.10` |
| **File** | `plandex.db` |
| **Connection** | Async singleton (`openDatabaseAsync`) |
| **Foreign Keys** | Enabled via `PRAGMA foreign_keys = ON` |
| **Initialization** | `src/database/schema.ts` → `initializeDatabase()` |

---

## Entity-Relationship Overview

```
todo_lists ──1:N──► todos

habits ──1:N──► habit_completions

goals ──1:N──► goal_milestones

expense_categories ──1:N──► expenses

planning_projects ──1:N──► planning_notes
planning_projects ──1:N──► planning_files

events                (standalone)
daily_logs            (standalone)
sticky_notes          (standalone)
mood_entries          (standalone)
alarms                (standalone)
focus_sessions        (standalone)
user_stats            (singleton row)
user_badges           (standalone)
```

---

## Tables

### 1. `todo_lists`

Organizes todos into named lists.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `name` | TEXT | NOT NULL | — | List name |
| `color` | TEXT | NOT NULL | — | Hex color |
| `icon` | TEXT | NOT NULL | — | MaterialIcons name |
| `position` | INTEGER | NOT NULL | — | Display order |
| `is_default` | BOOLEAN | | 0 | Default list flag |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |

**Seed data:** One default list `('General', '#1A73E8', 'playlist-check', 0, 1)` if none exist.

---

### 2. `todos`

Individual tasks.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `list_id` | INTEGER | FK → `todo_lists.id` (SET NULL) | NULL | |
| `title` | TEXT | NOT NULL | — | |
| `description` | TEXT | | NULL | |
| `priority` | TEXT | | `'medium'` | `low`/`medium`/`high`/`urgent` |
| `status` | TEXT | | `'pending'` | `pending`/`in_progress`/`completed`/`archived` |
| `date_type` | TEXT | | `'none'` | `none`/`single`/`range`/`week`/`month` |
| `start_date` | TEXT | | NULL | ISO date |
| `end_date` | TEXT | | NULL | ISO date |
| `due_time` | TEXT | | NULL | Time string |
| `is_recurring` | BOOLEAN | | 0 | |
| `tags` | TEXT | | `'[]'` | JSON array |
| `position` | INTEGER | | 0 | |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `completed_at` | DATETIME | | NULL | |

---

### 3. `daily_logs`

One journal entry per day.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `date` | TEXT | UNIQUE NOT NULL | — | `YYYY-MM-DD` |
| `what_i_did` | TEXT | | NULL | |
| `achievements` | TEXT | | NULL | |
| `learnings` | TEXT | | NULL | |
| `challenges` | TEXT | | NULL | |
| `tomorrow_intention` | TEXT | | NULL | |
| `gratitude` | TEXT | | NULL | |
| `productivity_rating` | INTEGER | | NULL | 1-5 |
| `satisfaction_rating` | INTEGER | | NULL | 1-5 |
| `completion_rating` | INTEGER | | NULL | 1-5 |
| `energy_rating` | INTEGER | | NULL | 1-5 |
| `overall_rating` | INTEGER | | NULL | 1-5 |
| `mood` | TEXT | | NULL | |
| `tags` | TEXT | | `'[]'` | JSON array |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP | |

---

### 4. `user_stats`

Singleton row for gamification statistics.

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | — | |
| `total_xp` | INTEGER | 0 | Lifetime XP |
| `current_level` | INTEGER | 1 | |
| `current_log_streak` | INTEGER | 0 | |
| `longest_log_streak` | INTEGER | 0 | |
| `total_todos_completed` | INTEGER | 0 | |
| `last_active_date` | TEXT | NULL | |

**Seed:** One row `(0, 1)` inserted if table is empty.

---

### 5. `user_badges`

Unlocked badge identifiers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `badge_id` | TEXT | PK | Badge identifier string |

---

### 6. `habits`

Habit definitions with frequency configuration.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `title` | TEXT | NOT NULL | — | |
| `description` | TEXT | | NULL | |
| `category` | TEXT | | `'general'` | |
| `frequency_type` | TEXT | | `'daily'` | `daily`/`specific_days`/`x_per_week` |
| `specific_days` | TEXT | | `'[]'` | JSON int array [0-6] |
| `times_per_week` | INTEGER | | NULL | |
| `time_of_day` | TEXT | | `'anytime'` | `morning`/`afternoon`/`evening`/`anytime` |
| `reminder_time` | TEXT | | NULL | |
| `color` | TEXT | | `'#00BFA5'` | |
| `icon` | TEXT | | `'check-circle'` | |
| `current_streak` | INTEGER | | 0 | |
| `longest_streak` | INTEGER | | 0 | |
| `total_completions` | INTEGER | | 0 | |
| `is_active` | BOOLEAN | | 1 | |
| `start_date` | TEXT | | NULL | |
| `end_date` | TEXT | | NULL | |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP | |

---

### 7. `habit_completions`

Daily completion records for habits.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `habit_id` | INTEGER | FK → `habits.id` (CASCADE) NOT NULL | — | |
| `date` | TEXT | NOT NULL | — | |
| `completed_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `notes` | TEXT | | NULL | |

**Unique constraint:** `(habit_id, date)` — one completion per habit per day.

---

### 8. `goals`

Goal definitions with progress tracking.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `title` | TEXT | NOT NULL | — | |
| `description` | TEXT | | NULL | |
| `category` | TEXT | | `'general'` | |
| `goal_type` | TEXT | | `'achievement'` | `achievement`/`measurable`/`habit_based` |
| `target_value` | REAL | | NULL | |
| `current_value` | REAL | | 0 | |
| `unit` | TEXT | | NULL | |
| `duration_type` | TEXT | | `'custom'` | |
| `start_date` | TEXT | | NULL | |
| `end_date` | TEXT | | NULL | |
| `status` | TEXT | | `'not_started'` | |
| `priority` | TEXT | | `'medium'` | `low`/`medium`/`high` |
| `color` | TEXT | | `'#4CAF50'` | |
| `icon` | TEXT | | `'target'` | |
| `completed_at` | DATETIME | | NULL | |
| `completion_notes` | TEXT | | NULL | |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP | |

---

### 9. `goal_milestones`

Sub-targets within a goal.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `goal_id` | INTEGER | FK → `goals.id` (CASCADE) NOT NULL | — | |
| `title` | TEXT | NOT NULL | — | |
| `target_date` | TEXT | | NULL | |
| `is_completed` | BOOLEAN | | 0 | |
| `completed_at` | DATETIME | | NULL | |
| `position` | INTEGER | | 0 | |

---

### 10. `events`

Calendar events.

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — | |
| `title` | TEXT | NOT NULL | — | |
| `description` | TEXT | | NULL | |
| `event_type` | TEXT | | `'single'` | |
| `start_datetime` | TEXT | NOT NULL | — | ISO datetime |
| `end_datetime` | TEXT | | NULL | |
| `is_all_day` | BOOLEAN | | 0 | |
| `location` | TEXT | | NULL | |
| `color` | TEXT | | `'#1A73E8'` | |
| `category` | TEXT | | `'general'` | |
| `is_recurring` | BOOLEAN | | 0 | |
| `recurring_pattern` | TEXT | | NULL | JSON |
| `status` | TEXT | | `'upcoming'` | |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP | |

---

### 11. `sticky_notes`

Quick notes with colors.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `title` | TEXT | NOT NULL | `''` |
| `content` | TEXT | NOT NULL | `''` |
| `color` | TEXT | NOT NULL | `'#FFE082'` |
| `is_pinned` | BOOLEAN | | 0 |
| `position` | INTEGER | | 0 |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP |

---

### 12. `mood_entries`

Daily mood records.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `date` | TEXT | UNIQUE NOT NULL | — |
| `mood` | TEXT | NOT NULL | — |
| `mood_score` | INTEGER | NOT NULL | — |
| `energy_level` | INTEGER | | 3 |
| `notes` | TEXT | | NULL |
| `tags` | TEXT | | `'[]'` |
| `activities` | TEXT | | `'[]'` |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP |

---

### 13. `expense_categories`

Spending categories with budgets.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `name` | TEXT | NOT NULL | — |
| `icon` | TEXT | NOT NULL | `'attach-money'` |
| `color` | TEXT | NOT NULL | `'#4CAF50'` |
| `budget_limit` | REAL | | NULL |
| `is_default` | BOOLEAN | | 0 |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |

**Seed:** 8 default categories on first run.

---

### 14. `expenses`

Individual expense/income records.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `category_id` | INTEGER | FK → `expense_categories.id` (SET NULL) | NULL |
| `title` | TEXT | NOT NULL | — |
| `amount` | REAL | NOT NULL | — |
| `expense_type` | TEXT | | `'expense'` |
| `date` | TEXT | NOT NULL | — |
| `notes` | TEXT | | NULL |
| `payment_method` | TEXT | | `'cash'` |
| `is_recurring` | BOOLEAN | | 0 |
| `tags` | TEXT | | `'[]'` |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP |

---

### 15. `planning_projects`

Project containers.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `title` | TEXT | NOT NULL | — |
| `description` | TEXT | | NULL |
| `color` | TEXT | NOT NULL | `'#4A9BE2'` |
| `icon` | TEXT | NOT NULL | `'folder'` |
| `cover_image` | TEXT | | NULL |
| `is_archived` | BOOLEAN | | 0 |
| `position` | INTEGER | | 0 |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP |

---

### 16. `planning_notes`

Notes within projects.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `project_id` | INTEGER | FK → `planning_projects.id` (CASCADE) NOT NULL | — |
| `title` | TEXT | NOT NULL | `'Untitled'` |
| `content` | TEXT | NOT NULL | `''` |
| `position` | INTEGER | | 0 |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | | CURRENT_TIMESTAMP |

---

### 17. `planning_files`

File attachments within projects.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `project_id` | INTEGER | FK → `planning_projects.id` (CASCADE) NOT NULL | — |
| `file_name` | TEXT | NOT NULL | — |
| `file_uri` | TEXT | NOT NULL | — |
| `file_type` | TEXT | NOT NULL | `'other'` |
| `file_size` | INTEGER | | 0 |
| `thumbnail_uri` | TEXT | | NULL |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |

---

### 18. `focus_sessions`

Pomodoro / focus timer records.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `session_type` | TEXT | NOT NULL | `'pomodoro'` |
| `duration_minutes` | INTEGER | NOT NULL | 25 |
| `actual_seconds` | INTEGER | | 0 |
| `status` | TEXT | | `'completed'` |
| `linked_todo_id` | INTEGER | | NULL |
| `linked_goal_id` | INTEGER | | NULL |
| `notes` | TEXT | | NULL |
| `started_at` | DATETIME | | CURRENT_TIMESTAMP |
| `completed_at` | DATETIME | | NULL |

---

### 19. `alarms`

Clock alarm entries.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | — |
| `label` | TEXT | NOT NULL | `'Alarm'` |
| `hour` | INTEGER | NOT NULL | — |
| `minute` | INTEGER | NOT NULL | — |
| `is_enabled` | BOOLEAN | | 1 |
| `repeat_days` | TEXT | | `'[]'` |
| `sound_uri` | TEXT | | NULL |
| `sound_name` | TEXT | | `'Default'` |
| `vibrate` | BOOLEAN | | 1 |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP |

---

## Foreign Key Summary

| Parent Table | Child Table | On Delete |
|---|---|---|
| `todo_lists` | `todos` | SET NULL |
| `habits` | `habit_completions` | CASCADE |
| `goals` | `goal_milestones` | CASCADE |
| `expense_categories` | `expenses` | SET NULL |
| `planning_projects` | `planning_notes` | CASCADE |
| `planning_projects` | `planning_files` | CASCADE |

---

## Table Count: 19 tables total
