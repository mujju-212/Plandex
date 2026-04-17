export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
export type DateType = 'none' | 'single' | 'range' | 'week' | 'month';
export type RecurringType = 'daily' | 'weekly' | 'monthly';

export interface Todo {
    id: number;
    list_id: number | null;
    title: string;
    description: string | null;
    priority: Priority;
    status: TodoStatus;
    date_type: DateType;
    start_date: string | null;
    end_date: string | null;
    due_time: string | null;
    reminder_enabled: boolean;
    is_recurring: boolean;
    recurring_type: RecurringType | null;
    recurring_interval: number | null;
    recurring_end_date: string | null;
    tags: string[]; // Stored as JSON string
    position: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface TodoList {
    id: number;
    name: string;
    color: string;
    icon: string;
    position: number;
    is_default: boolean;
    created_at: string;
}

export interface CreateTodoListInput {
    name: string;
    color?: string;
    icon?: string;
}

export interface CreateTodoInput {
    title: string;
    description?: string;
    list_id?: number;
    priority?: Priority;
    date_type?: DateType;
    start_date?: string;
    end_date?: string;
    due_time?: string;
    reminder_enabled?: boolean;
    is_recurring?: boolean;
    recurring_type?: RecurringType;
    recurring_interval?: number;
    recurring_end_date?: string;
    tags?: string[];
    position?: number;
}

export interface UpdateTodoInput {
    title?: string;
    description?: string;
    list_id?: number;
    priority?: Priority;
    status?: TodoStatus;
    date_type?: DateType;
    start_date?: string;
    end_date?: string;
    due_time?: string;
    reminder_enabled?: boolean;
    is_recurring?: boolean;
    recurring_type?: RecurringType;
    recurring_interval?: number;
    recurring_end_date?: string;
    tags?: string[];
    position?: number;
}

export interface TodoFilter {
    status?: TodoStatus;
    priority?: Priority;
    list_id?: number;
    date?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    exclude_archived?: boolean;
    limit?: number;
}
