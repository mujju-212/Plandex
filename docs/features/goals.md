# Goals

> Multi-type goal tracking with milestones, progress measurement, and status management.

---

## Overview

Goals allow users to set and track objectives of various types — from simple achievement goals to measurable numeric targets.

## Screens

| Screen | File | Purpose |
|---|---|---|
| Goals List | `app/(stacks)/goal/index.tsx` | Browse all goals by status |
| Create Goal | `app/(stacks)/goal/create.tsx` | Full creation form with milestones |
| Goal Detail | `app/(stacks)/goal/[id].tsx` | Progress view, milestones, update value |
| Edit Goal | `app/(stacks)/goal/edit.tsx` | Edit all fields |

## Data Model

### `goals` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `title` | TEXT | required | Goal title |
| `description` | TEXT | NULL | Description |
| `category` | TEXT | `'general'` | Category enum |
| `goal_type` | TEXT | `'achievement'` | `achievement` / `measurable` / `habit_based` |
| `target_value` | REAL | NULL | Numeric target (for measurable) |
| `current_value` | REAL | 0 | Current progress |
| `unit` | TEXT | NULL | Measurement unit (km, pages, etc.) |
| `duration_type` | TEXT | `'custom'` | `daily`/`weekly`/`monthly`/`quarterly`/`yearly`/`custom` |
| `start_date` | TEXT | NULL | Start date |
| `end_date` | TEXT | NULL | Deadline |
| `status` | TEXT | `'not_started'` | Status enum |
| `priority` | TEXT | `'medium'` | `low` / `medium` / `high` |
| `color` | TEXT | `'#4CAF50'` | Hex color |
| `icon` | TEXT | `'target'` | Icon name |
| `completed_at` | DATETIME | NULL | Completion timestamp |
| `completion_notes` | TEXT | NULL | Notes on completion |

### `goal_milestones` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `goal_id` | INTEGER FK | required | References `goals.id` (CASCADE) |
| `title` | TEXT | required | Milestone name |
| `target_date` | TEXT | NULL | Optional target date |
| `is_completed` | BOOLEAN | 0 | Completion flag |
| `completed_at` | DATETIME | NULL | When completed |
| `position` | INTEGER | 0 | Sort order |

## Goal Types

| Type | How It Works |
|---|---|
| `achievement` | Boolean — either achieved or not |
| `measurable` | Track `current_value` toward `target_value` (e.g., "Read 12 books") |
| `habit_based` | Linked to habit completion frequency |

## Status Flow

```
not_started ──► in_progress ──► achieved
                    │
                    ├──► failed
                    ├──► deferred
                    └──► cancelled
```

## Progress Visualization

For measurable goals, progress is displayed as:
- **ProgressRing** component (SVG circular progress)
- Percentage text: `current_value / target_value × 100`
- Color coding based on progress percentage

## Edit Screen

`goal/edit.tsx` provides full editing of:
- Title, description
- Category, goal type
- Target value and unit (for measurable goals)
- Duration type, start/end dates
- Priority
- Color (color selector)

## Milestones

- Added during goal creation or detail view
- Each has a title, optional target date
- Can be individually completed
- Position-ordered for display
