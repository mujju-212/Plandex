# Events & Calendar

> Event scheduling with recurring patterns, all-day support, and monthly calendar view.

---

## Overview

Events provide time-based scheduling visible on the Calendar tab. Supports single events, multi-day events, recurring patterns, and location tracking.

## Screens

| Screen | File | Purpose |
|---|---|---|
| Calendar View | `app/(tabs)/calendar.tsx` | Monthly calendar with event dots |
| Events List | `app/(stacks)/event/index.tsx` | Browse events by filter |
| Create Event | `app/(stacks)/event/create.tsx` | Full creation form |
| Event Detail | `app/(stacks)/event/[id].tsx` | View details with edit button |
| Edit Event | `app/(stacks)/event/edit.tsx` | Full edit form |

## Data Model

### `events` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `title` | TEXT | required | Event title |
| `description` | TEXT | NULL | Description |
| `event_type` | TEXT | `'single'` | `single`/`duration`/`full_day`/`multi_day`/`recurring` |
| `start_datetime` | TEXT | required | ISO datetime |
| `end_datetime` | TEXT | NULL | ISO datetime |
| `is_all_day` | BOOLEAN | 0 | All-day flag |
| `location` | TEXT | NULL | Location text |
| `color` | TEXT | `'#1A73E8'` | Hex color |
| `category` | TEXT | `'general'` | Category enum |
| `is_recurring` | BOOLEAN | 0 | Recurring flag |
| `recurring_pattern` | TEXT | NULL | JSON `RecurringPattern` |
| `status` | TEXT | `'upcoming'` | `upcoming`/`ongoing`/`completed`/`cancelled` |

## Categories

`general` | `work` | `personal` | `health` | `social` | `other`

## Recurring Patterns

```typescript
interface RecurringPattern {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;    // e.g., every 2 weeks
    end_date?: string;   // optional end date
}
```

## Edit Form (`event/edit.tsx`)

The edit screen is a comprehensive form with:
- Title, description, category, color inputs
- Location field
- **5 DateTimePicker instances:**
  1. Start Date picker
  2. Start Time picker
  3. End Date picker
  4. End Time picker
  5. Recurrence End Date picker
- All-day toggle (hides time pickers)
- Recurring toggle with pattern configuration (type + interval + end date)
- Uses `@react-native-community/datetimepicker`

## Calendar Tab

The Calendar tab shows a monthly grid where:
- Days with events show colored dots
- Tapping a day shows that day's events
- Navigation arrows to move between months
- Events from `useEventStore` loaded for the visible month range
