# Daily Logs

> Reflective journaling with mood tracking, ratings, and multi-view summaries.

---

## Overview

The Daily Logs feature provides a structured journaling system for daily reflection. Each day gets one log entry with multiple free-text sections and rating scales.

## Screens

| Screen | File | Purpose |
|---|---|---|
| Logs List | `app/(tabs)/logs.tsx` | Browse all log entries |
| Daily Entry | `app/(stacks)/log/daily/[date].tsx` | Create/edit log for a specific date |
| Weekly View | `app/(stacks)/log/weekly.tsx` | Weekly summary |
| Monthly View | `app/(stacks)/log/monthly.tsx` | Monthly overview |

## Data Model

### `daily_logs` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `date` | TEXT UNIQUE | required | `YYYY-MM-DD` format (one per day) |
| `what_i_did` | TEXT | NULL | Free-text: daily activities |
| `achievements` | TEXT | NULL | Free-text: accomplishments |
| `learnings` | TEXT | NULL | Free-text: lessons learned |
| `challenges` | TEXT | NULL | Free-text: difficulties faced |
| `tomorrow_intention` | TEXT | NULL | Free-text: plans for tomorrow |
| `gratitude` | TEXT | NULL | Free-text: things grateful for |
| `productivity_rating` | INTEGER | NULL | 1-5 scale |
| `satisfaction_rating` | INTEGER | NULL | 1-5 scale |
| `completion_rating` | INTEGER | NULL | 1-5 scale |
| `energy_rating` | INTEGER | NULL | 1-5 scale |
| `overall_rating` | INTEGER | NULL | 1-5 scale |
| `mood` | TEXT | NULL | Mood identifier |
| `tags` | TEXT | `'[]'` | JSON array of tag strings |

## Journaling Sections

1. **What I Did** — Record daily activities
2. **Achievements** — Celebrate wins
3. **Learnings** — Document new knowledge
4. **Challenges** — Acknowledge difficulties
5. **Tomorrow's Intention** — Set direction for the next day
6. **Gratitude** — Practice gratitude

## Rating System

Five 1-5 star/scale ratings:
- **Productivity** — How productive was the day
- **Satisfaction** — Overall satisfaction level
- **Completion** — How much of planned work was done
- **Energy** — Physical/mental energy level
- **Overall** — General day rating

## Gamification Integration

- Logging daily builds the **log streak**
- Streaks earn XP via the gamification system
- Evening notification (10:30 PM) reminds users to log
