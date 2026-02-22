# Mood Tracker

> Daily mood and energy logging with activity tagging and trend visualization.

---

## Overview

Track your emotional state daily with a 5-level mood scale, energy tracking, and activity logging.

**Screen:** `app/(stacks)/mood.tsx`  
**Store:** `useMoodStore`  
**Table:** `mood_entries`

## Data Model

### `mood_entries` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `date` | TEXT UNIQUE | required | `YYYY-MM-DD` (one per day) |
| `mood` | TEXT | required | Mood type identifier |
| `mood_score` | INTEGER | required | 1-5 numeric score |
| `energy_level` | INTEGER | 3 | 1-5 energy scale |
| `notes` | TEXT | NULL | Free-text notes |
| `tags` | TEXT | `'[]'` | JSON array of tag strings |
| `activities` | TEXT | `'[]'` | JSON array of activity strings |

## Mood Scale

| Mood | Emoji | Score | Color |
|---|---|---|---|
| Amazing | 🤩 | 5 | `#4CAF50` (green) |
| Good | 😊 | 4 | `#8BC34A` (light green) |
| Okay | 😐 | 3 | `#FFC107` (yellow) |
| Bad | 😔 | 2 | `#FF9800` (orange) |
| Terrible | 😢 | 1 | `#F44336` (red) |

## Predefined Activities

Users can tag their day with activities (multi-select):

| Activities |
|---|
| Exercise, Work, Study, Social, Family |
| Hobby, Travel, Rest, Reading, Gaming |
| Meditation, Music, Cooking, Shopping, Nature |

## Features

- **One Entry Per Day:** Unique date constraint ensures single daily entry
- **Energy Level:** Separate 1-5 scale for physical/mental energy
- **Free Notes:** Optional text notes for additional context
- **Tags:** Custom tag system for categorization
- **Activity Selection:** Quick tap to log activities from a predefined set
