# Dashboard

> Home screen aggregating summaries from all features.

---

## Overview

The Dashboard is the first screen users see. It provides a quick overview of their day and shortcuts to common actions.

**Screen:** `app/(tabs)/index.tsx`  
**Components:** `src/components/dashboard/`

## Dashboard Components

### GreetingHeader
- Time-based greeting: "Good Morning" / "Good Afternoon" / "Good Evening"
- Current date display
- User avatar/profile link

### TodaySummary
- **Todos Completed:** Count of today's completed todos
- **Active Habits:** Number of habits due today
- **Current Streak:** Log streak count
- Displayed as stat cards with icons

### QuickActions
- **New Todo:** Navigate to todo creation
- **Write Log:** Navigate to today's daily log
- **Check Habit:** Quick habit completion
- **Add Event:** Create new event
- **Focus Mode:** Start Pomodoro session
- Grid of shortcut buttons

### TodayHabits
- List of habits due today
- Checkbox to mark complete directly from dashboard
- Shows habit icon and color
- Progress indicator for streak

### ActiveGoals
- Cards for in-progress goals
- `ProgressRing` showing completion percentage
- Goal title and target info

### UpcomingEvents
- Next 3-5 upcoming events
- Shows time, title, and location
- Color-coded by category

### DailyLogPrompt
- Appears if today's log hasn't been written
- CTA button to navigate to daily log entry
- Disappears once log is saved

## Data Sources

The dashboard pulls data from multiple stores:
- `useTodoStore` — Today's todos
- `useHabitStore` — Today's habits
- `useGoalStore` — Active goals
- `useEventStore` — Upcoming events
- `useLogStore` — Today's log status
- `useGamificationStore` — XP, level, streak
