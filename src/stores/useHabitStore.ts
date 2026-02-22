import { create } from 'zustand';
import { habitService } from '../services/habitService';
import { scheduleHabitReminder } from '../services/notificationService';
import { CreateHabitInput, Habit, HabitCompletion, HabitFilter, UpdateHabitInput } from '../types/habit.types';

interface HabitState {
    habits: Habit[];
    todayCompletions: HabitCompletion[];
    isLoading: boolean;
    error: string | null;
    loadHabits: (filter?: HabitFilter) => Promise<void>;
    loadTodayCompletions: () => Promise<void>;
    addHabit: (input: CreateHabitInput) => Promise<Habit>;
    updateHabit: (id: number, input: UpdateHabitInput) => Promise<void>;
    deleteHabit: (id: number) => Promise<void>;
    toggleCompletion: (habitId: number, date: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
    habits: [],
    todayCompletions: [],
    isLoading: false,
    error: null,

    loadHabits: async (filter?) => {
        try {
            set({ isLoading: true, error: null });
            const habits = await habitService.getHabits(filter);
            set({ habits, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    loadTodayCompletions: async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const completions = await habitService.getCompletionsForDate(today);
            set({ todayCompletions: completions });
        } catch (e: any) { set({ error: e.message }); }
    },

    addHabit: async (input) => {
        try {
            const habit = await habitService.createHabit(input);
            // Schedule daily reminder if reminder_time is set
            if (habit.reminder_time) {
                scheduleHabitReminder(habit.id, habit.title, habit.reminder_time).catch(() => {});
            }
            set(s => ({ habits: [habit, ...s.habits] }));
            return habit;
        } catch (e: any) { set({ error: e.message }); throw e; }
    },

    updateHabit: async (id, input) => {
        try {
            const habit = await habitService.updateHabit(id, input);
            set(s => ({ habits: s.habits.map(h => h.id === id ? habit : h) }));
        } catch (e: any) { set({ error: e.message }); }
    },

    deleteHabit: async (id) => {
        try {
            await habitService.deleteHabit(id);
            set(s => ({ habits: s.habits.filter(h => h.id !== id) }));
        } catch (e: any) { set({ error: e.message }); }
    },

    toggleCompletion: async (habitId, date) => {
        try {
            // Re-read state right before decision to avoid race condition with concurrent toggles
            const existing = get().todayCompletions.find(c => c.habit_id === habitId && c.date === date);
            if (existing) {
                await habitService.undoCompletion(habitId, date);
                // Re-read after async to ensure freshest state
                set(s => ({ todayCompletions: s.todayCompletions.filter(c => !(c.habit_id === habitId && c.date === date)) }));
            } else {
                const comp = await habitService.logCompletion(habitId, date);
                // Guard: double-check it wasn't already added by a concurrent toggle
                set(s => {
                    const alreadyExists = s.todayCompletions.some(c => c.habit_id === habitId && c.date === date);
                    return alreadyExists ? {} : { todayCompletions: [...s.todayCompletions, comp] };
                });
            }
            // Always reload habits from DB for accurate streak/completion counts
            const habits = await habitService.getHabits();
            set({ habits });
        } catch (e: any) { set({ error: e.message }); }
    },
}));
