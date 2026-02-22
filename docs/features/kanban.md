# Kanban Board

> Visual drag-and-drop task board for workflow management.

---

## Overview

The Kanban Board provides a column-based view of tasks, allowing visual workflow management with drag-and-drop.

**Screen:** `app/(stacks)/kanban.tsx`  
**Store:** `useTodoStore`  
**Dependencies:** `react-native-gesture-handler`, `react-native-reanimated`

## How It Works

The Kanban board reuses the todo data model, displaying todos in columns based on their status:

| Column | Todo Status | Description |
|---|---|---|
| **To Do** | `pending` | Unstarted tasks |
| **In Progress** | `in_progress` | Active tasks |
| **Done** | `completed` | Finished tasks |

## Features

- **Drag & Drop:** Move task cards between columns using gesture handler
- **Visual Cards:** Each card shows title, priority color indicator, and tags
- **Real-time Sync:** Moving a card updates the todo's status in the database
- **Horizontal Scroll:** Scroll between columns on smaller screens
- **Priority Colors:** Cards are color-coded by priority level
- **Responsive:** Adapts to screen width

## Integration with Todos

The Kanban board is an alternative view of the same todo data:
- Changes on the Kanban board reflect in the Todos tab
- Changes in the Todos tab reflect on the Kanban board
- Both screens use `useTodoStore` as the single source of truth
