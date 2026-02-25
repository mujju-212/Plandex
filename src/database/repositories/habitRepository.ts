import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateHabitInput, Habit, HabitCompletion, HabitFilter, UpdateHabitInput } from '../../types/habit.types';

const HABITS_KEY = 'habits_data';
const COMPLETIONS_KEY = 'habit_completions_data';
let nextId = 300;
let nextCompId = 2000;

async function getHabits(): Promise<Habit[]> {
    try { const raw = await AsyncStorage.getItem(HABITS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveHabits(h: Habit[]): Promise<void> { await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(h)); }
async function getCompletions(): Promise<HabitCompletion[]> {
    try { const raw = await AsyncStorage.getItem(COMPLETIONS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveCompletions(c: HabitCompletion[]): Promise<void> { await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(c)); }

class HabitRepository {
    async insert(input: CreateHabitInput): Promise<Habit> {
        const habits = await getHabits();
        const now = new Date().toISOString();
        const habit: Habit = {
            id: nextId++, title: input.title, description: input.description || null,
            category: input.category || 'general', frequency_type: input.frequency_type || 'daily',
            specific_days: input.specific_days || [], times_per_week: input.times_per_week || null,
            time_of_day: input.time_of_day || 'anytime', reminder_time: input.reminder_time || null,
            color: input.color || '#00BFA5', icon: input.icon || 'check-circle',
            current_streak: 0, longest_streak: 0, total_completions: 0,
            is_active: true, start_date: now.split('T')[0], end_date: null,
            created_at: now, updated_at: now,
        };
        habits.unshift(habit);
        await saveHabits(habits);
        return habit;
    }

    async findAll(filter?: HabitFilter): Promise<Habit[]> {
        let habits = await getHabits();
        if (filter?.category) habits = habits.filter(h => h.category === filter.category);
        if (filter?.is_active !== undefined) habits = habits.filter(h => h.is_active === filter.is_active);
        if (filter?.search) { const q = filter.search.toLowerCase(); habits = habits.filter(h => h.title.toLowerCase().includes(q)); }
        return habits;
    }

    async findById(id: number): Promise<Habit | null> {
        const habits = await getHabits();
        return habits.find(h => h.id === id) || null;
    }

    async update(id: number, input: UpdateHabitInput): Promise<Habit> {
        const habits = await getHabits();
        const idx = habits.findIndex(h => h.id === id);
        if (idx === -1) throw new Error('Habit not found');
        habits[idx] = { ...habits[idx], ...input, updated_at: new Date().toISOString() } as Habit;
        await saveHabits(habits);
        return habits[idx];
    }

    async delete(id: number): Promise<void> {
        let habits = await getHabits();
        habits = habits.filter(h => h.id !== id);
        await saveHabits(habits);
    }

    async logCompletion(habitId: number, date: string, notes?: string): Promise<HabitCompletion> {
        const completions = await getCompletions();
        const existing = completions.find(c => c.habit_id === habitId && c.date === date);
        if (existing) return existing;

        const comp: HabitCompletion = {
            id: nextCompId++, habit_id: habitId, date,
            completed_at: new Date().toISOString(), notes: notes || null,
        };
        completions.push(comp);
        await saveCompletions(completions);

        // Update streak
        const habits = await getHabits();
        const idx = habits.findIndex(h => h.id === habitId);
        if (idx !== -1) {
            habits[idx].total_completions += 1;
            habits[idx].current_streak += 1;
            if (habits[idx].current_streak > habits[idx].longest_streak) {
                habits[idx].longest_streak = habits[idx].current_streak;
            }
            habits[idx].updated_at = new Date().toISOString();
            await saveHabits(habits);
        }
        return comp;
    }

    async undoCompletion(habitId: number, date: string): Promise<void> {
        let completions = await getCompletions();
        completions = completions.filter(c => !(c.habit_id === habitId && c.date === date));
        await saveCompletions(completions);

        const habits = await getHabits();
        const idx = habits.findIndex(h => h.id === habitId);
        if (idx !== -1 && habits[idx].current_streak > 0) {
            habits[idx].total_completions = Math.max(0, habits[idx].total_completions - 1);
            habits[idx].current_streak = Math.max(0, habits[idx].current_streak - 1);
            await saveHabits(habits);
        }
    }

    async getCompletionsForDate(date: string): Promise<HabitCompletion[]> {
        const completions = await getCompletions();
        return completions.filter(c => c.date === date);
    }

    async getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]> {
        const completions = await getCompletions();
        return completions.filter(c => c.habit_id === habitId);
    }
}

export const habitRepository = new HabitRepository();
