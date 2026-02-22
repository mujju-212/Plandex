# Pomodoro Focus Mode

> Configurable focus timer linked to todos and goals for productivity tracking.

---

## Overview

The Pomodoro Focus Mode implements the Pomodoro Technique — focused work sessions followed by breaks. Sessions can be linked to specific todos or goals for tracking purposes.

**Screen:** `app/(stacks)/focus.tsx`  
**Store:** `useClockStore`  
**Table:** `focus_sessions`

## How It Works

1. **Set Duration:** Default 25 minutes, configurable
2. **Link (Optional):** Choose a todo or goal to associate
3. **Start Session:** Timer counts down with progress visualization
4. **Complete/Cancel:** Session saved with actual time elapsed

## Focus Sessions Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `session_type` | TEXT | `'pomodoro'` | `pomodoro` / `custom` |
| `duration_minutes` | INTEGER | 25 | Planned duration |
| `actual_seconds` | INTEGER | 0 | Actual elapsed time |
| `status` | TEXT | `'completed'` | `completed` / `cancelled` / `in_progress` |
| `linked_todo_id` | INTEGER | NULL | Optional linked todo |
| `linked_goal_id` | INTEGER | NULL | Optional linked goal |
| `notes` | TEXT | NULL | Session notes |
| `started_at` | DATETIME | NOW | Session start time |
| `completed_at` | DATETIME | NULL | Session end time |

## Session Lifecycle

```
created ──► in_progress ──► completed
                │
                └──► cancelled
```

## Types

```typescript
interface FocusSession {
  id: number;
  session_type: 'pomodoro' | 'custom';
  duration_minutes: number;
  actual_seconds: number;
  status: 'completed' | 'cancelled' | 'in_progress';
  linked_todo_id: number | null;
  linked_goal_id: number | null;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
}
```

## Analytics

Completed focus sessions contribute to:
- Total focus time analytics
- Per-goal and per-todo time tracking
- Productivity scores in the analytics dashboard
