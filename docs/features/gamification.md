# Gamification

> XP, levels, streaks, and badges for user engagement.

---

## Overview

The gamification system rewards consistent usage with experience points, levels, and badge achievements.

**Screen:** `app/(stacks)/achievements.tsx`  
**Store:** `useGamificationStore`  
**Tables:** `user_stats`, `user_badges`

## Data Model

### `user_stats` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Single row |
| `total_xp` | INTEGER | 0 | Lifetime XP earned |
| `current_level` | INTEGER | 1 | Current level |
| `current_log_streak` | INTEGER | 0 | Active daily log streak |
| `longest_log_streak` | INTEGER | 0 | All-time best streak |
| `total_todos_completed` | INTEGER | 0 | Lifetime todos completed |
| `last_active_date` | TEXT | NULL | Last activity date |

### `user_badges` Table

| Column | Type | Description |
|---|---|---|
| `badge_id` | TEXT PK | Badge identifier string |

## XP Sources

| Action | XP Earned |
|---|---|
| Complete a todo | Variable |
| Write daily log | Variable |
| Maintain streak | Bonus multiplier |
| Complete a goal | Variable |
| Complete habit | Variable |

## Level System

- Level calculated from total XP
- Each level requires progressively more XP
- Level displayed on profile and dashboard

## Badges

Badges are unlocked by reaching milestones:
- Streak-based badges (7-day, 30-day, 100-day streaks)
- Completion badges (10, 50, 100 todos completed)
- Feature usage badges (first log, first habit, etc.)

## Service: `gamificationService.ts`

Handles:
- XP calculation and award
- Level-up detection
- Badge eligibility checks
- Streak maintenance (increment on activity, reset on miss)
