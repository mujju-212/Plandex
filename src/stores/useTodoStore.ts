import { create } from 'zustand';
import { scheduleTodoReminder } from '../services/notificationService';
import { todoService } from '../services/todoService';
import { CreateTodoInput, Todo, TodoFilter, TodoList, UpdateTodoInput } from '../types/todo.types';

interface TodoState {
    todos: Todo[];
    lists: TodoList[];
    selectedTodo: Todo | null;
    isLoading: boolean;
    error: string | null;
    filter: TodoFilter;

    // Actions
    loadTodoLists: () => Promise<void>;
    addTodoList: (name: string, color?: string, icon?: string) => Promise<TodoList>;
    loadTodos: (filter?: TodoFilter) => Promise<void>;
    loadTodosForDate: (date: string) => Promise<void>;
    addTodo: (input: CreateTodoInput) => Promise<Todo>;
    updateTodo: (id: number, input: UpdateTodoInput) => Promise<void>;
    completeTodo: (id: number, notesAfter?: string) => Promise<void>;
    uncompleteTodo: (id: number) => Promise<void>;
    deleteTodo: (id: number) => Promise<void>;
    archiveTodo: (id: number) => Promise<void>;
    setFilter: (filter: Partial<TodoFilter>) => Promise<void>;
    selectTodo: (todo: Todo | null) => void;
    clearError: () => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
    todos: [],
    lists: [],
    selectedTodo: null,
    isLoading: false,
    error: null,
    filter: {},

    loadTodoLists: async () => {
        try {
            set({ error: null });
            const lists = await todoService.getTodoLists();
            set({ lists });
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    addTodoList: async (name: string, color?: string, icon?: string) => {
        try {
            set({ error: null });
            const list = await todoService.createTodoList({ name, color, icon });
            const lists = await todoService.getTodoLists();
            set({ lists });
            return list;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    loadTodos: async (filter?: TodoFilter) => {
        try {
            set({ isLoading: true, error: null });
            const mergedFilter = { ...get().filter, ...filter };
            const todos = await todoService.getTodos(mergedFilter);
            set({ todos, isLoading: false, filter: mergedFilter });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    loadTodosForDate: async (date: string) => {
        try {
            set({ isLoading: true, error: null });
            const todos = await todoService.getTodosForDate(date);
            set({ todos, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addTodo: async (input: CreateTodoInput) => {
        try {
            set({ error: null });
            const todo = await todoService.createTodo(input);
            // Schedule notification only when reminder is enabled and todo has a date.
            if (todo.reminder_enabled && todo.start_date) {
                scheduleTodoReminder(todo.id, todo.title, todo.start_date, todo.due_time || undefined).catch(() => {});
            }
            set(state => ({ todos: [todo, ...state.todos] }));
            return todo;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    completeTodo: async (id: number, notesAfter?: string) => {
        try {
            set({ error: null });
            const todo = await todoService.completeTodo(id, notesAfter);
            set(state => ({
                todos: state.todos.map(t => t.id === id ? todo : t),
                selectedTodo: state.selectedTodo?.id === id ? todo : state.selectedTodo,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    uncompleteTodo: async (id: number) => {
        try {
            set({ error: null });
            const todo = await todoService.updateTodo(id, { status: 'pending' });
            set(state => ({
                todos: state.todos.map(t => t.id === id ? todo : t),
                selectedTodo: state.selectedTodo?.id === id ? todo : state.selectedTodo,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateTodo: async (id: number, input: UpdateTodoInput) => {
        try {
            set({ error: null });
            const todo = await todoService.updateTodo(id, input);
            set(state => ({
                todos: state.todos.map(t => t.id === id ? todo : t),
                selectedTodo: state.selectedTodo?.id === id ? todo : state.selectedTodo,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteTodo: async (id: number) => {
        try {
            set({ error: null });
            await todoService.deleteTodo(id);
            set(state => ({
                todos: state.todos.filter(t => t.id !== id),
                selectedTodo: state.selectedTodo?.id === id ? null : state.selectedTodo,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    archiveTodo: async (id: number) => {
        try {
            set({ error: null });
            await todoService.archiveTodo(id);
            set(state => ({
                todos: state.todos.filter(t => t.id !== id),
                selectedTodo: state.selectedTodo?.id === id ? null : state.selectedTodo,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    setFilter: async (filter: Partial<TodoFilter>) => {
        const newFilter = { ...get().filter, ...filter };
        set({ filter: newFilter });
        await get().loadTodos(newFilter);
    },

    selectTodo: (todo: Todo | null) => set({ selectedTodo: todo }),
    clearError: () => set({ error: null }),
}));
