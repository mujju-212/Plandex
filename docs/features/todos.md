# Todos

> Full task management with lists, priorities, flexible dates, tags, and archiving.

---

## Overview

The Todos feature is the backbone of Plandex — a complete task management system accessible from the main tab bar. Users can create, organize, filter, complete, and archive tasks.

## Screens

| Screen | File | Purpose |
|---|---|---|
| Todo List | `app/(tabs)/todos.tsx` | Main list view with filtering and list selection |
| Create Todo | `app/(stacks)/todo/create.tsx` | Full creation form |
| Todo Detail | `app/(stacks)/todo/[id].tsx` | View todo details, complete/delete |
| Edit Todo | `app/(stacks)/todo/edit.tsx` | Edit all fields |

## Data Model

### `todos` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `list_id` | INTEGER FK | NULL | References `todo_lists.id` |
| `title` | TEXT | required | Task title |
| `description` | TEXT | NULL | Optional description |
| `priority` | TEXT | `'medium'` | `low` / `medium` / `high` / `urgent` |
| `status` | TEXT | `'pending'` | `pending` / `in_progress` / `completed` / `archived` |
| `date_type` | TEXT | `'none'` | `none` / `single` / `range` / `week` / `month` |
| `start_date` | TEXT | NULL | ISO date string |
| `end_date` | TEXT | NULL | ISO date string |
| `due_time` | TEXT | NULL | Time string |
| `is_recurring` | BOOLEAN | 0 | Recurring flag |
| `tags` | TEXT | `'[]'` | JSON array of tag strings |
| `position` | INTEGER | 0 | Sort order |
| `created_at` | DATETIME | NOW | Creation timestamp |
| `updated_at` | DATETIME | NOW | Last update timestamp |
| `completed_at` | DATETIME | NULL | When completed |

### `todo_lists` Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `name` | TEXT | required | List name |
| `color` | TEXT | required | Hex color |
| `icon` | TEXT | required | MaterialIcons name |
| `position` | INTEGER | required | Sort order |
| `is_default` | BOOLEAN | 0 | Default list flag |

## Store: `useTodoStore`

```typescript
interface TodoState {
    todos: Todo[];
    selectedTodo: Todo | null;
    isLoading: boolean;
    error: string | null;
    filter: TodoFilter;

    loadTodos: (filter?: TodoFilter) => Promise<void>;
    loadTodosForDate: (date: string) => Promise<void>;
    addTodo: (input: CreateTodoInput) => Promise<Todo>;
    updateTodo: (id: number, input: UpdateTodoInput) => Promise<void>;
    completeTodo: (id: number) => Promise<void>;
    uncompleteTodo: (id: number) => Promise<void>;
    deleteTodo: (id: number) => Promise<void>;
    archiveTodo: (id: number) => Promise<void>;
    setFilter: (filter: Partial<TodoFilter>) => Promise<void>;
    selectTodo: (todo: Todo | null) => void;
}
```

## UI Component: `TodoItem`

The `TodoItem` component (`src/components/todo/TodoItem.tsx`) uses a **stacked layout**:

- **Title Row:** Priority indicator + title text + completion checkbox
- **Meta Row:** Date/time display + tags (displayed with `spaceBetween` to prevent overlap)

This layout was redesigned from a single-row approach to fix text overlapping issues.

## Filtering

Users can filter todos by:
- **Status:** pending, in_progress, completed, archived
- **Priority:** low, medium, high, urgent
- **List:** Any todo list
- **Date:** Specific date or date range
- **Search:** Text search in title/description

## Notifications

When a todo has a `due_time`, a local notification reminder is scheduled via `scheduleTodoReminder()` from the notification service.
