import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateHabitInput, Habit, HabitCompletion, HabitFilter, UpdateHabitInput } from '../../types/habit.types';
import { getDB } from '../database';

const HABITS_KEY = 'habits_data';
const COMPLETIONS_KEY = 'habit_completions_data';

// ─── AsyncStorage helpers (web only) ───────────────────
async function getWebHabits(): Promise<Habit[]> {
    try { const raw = await AsyncStorage.getItem(HABITS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveWebHabits(h: Habit[]): Promise<void> { await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(h)); }
async function getWebCompletions(): Promise<HabitCompletion[]> {
    try { const raw = await AsyncStorage.getItem(COMPLETIONS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveWebCompletions(c: HabitCompletion[]): Promise<void> { await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(c)); }

// ─── Row mapper (SQLite → Habit) ───────────────────────
function mapRowToHabit(row: any): Habit {
    return {
        ...row,
        specific_days: JSON.parse(row.specific_days || '[]'),
        is_active: Boolean(row.is_active),
    };
}

function mapRowToCompletion(row: any): HabitCompletion {
    return { ...row };
}

// ─── Repository ────────────────────────────────────────
class HabitRepository {

    async insert(input: CreateHabitInput): Promise<Habit> {
        const now = new Date().toISOString();

        if (Platform.OS === 'web') {
            const habits = await getWebHabits();
            const habit: Habit = {
                id: Date.now(), title: input.title, description: input.description || null,
                category: input.category || 'general', frequency_type: input.frequency_type || 'daily',
                specific_days: input.specific_days || [], times_per_week: input.times_per_week || null,
                time_of_day: input.time_of_day || 'anytime', reminder_time: input.reminder_time || null,
                color: input.color || '#00BFA5', icon: input.icon || 'check-circle',
                current_streak: 0, longest_streak: 0, total_completions: 0,
                is_active: true, start_date: now.split('T')[0], end_date: null,
                created_at: now, updated_at: now,
            };
            habits.unshift(habit);
            await saveWebHabits(habits);
            return habit;
        }

        // ── Native SQLite ──
        const db = getDB();
        const daysJson = JSON.stringify(input.specific_days || []);
        const result = await db.runAsync(
            `INSERT INTO habits (title, description, category, frequency_type, specific_days,
             times_per_week, time_of_day, reminder_time, color, icon, start_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.title,
                input.description || null,
                input.category || 'general',
                input.frequency_type || 'daily',
                daysJson,
                input.times_per_week ?? null,
                input.time_of_day || 'anytime',
                input.reminder_time || null,
                input.color || '#00BFA5',
                input.icon || 'check-circle',
                now.split('T')[0],
            ]
        );
        return (await this.findById(result.lastInsertRowId))!;
    }

    async findAll(filter?: HabitFilter): Promise<Habit[]> {
        if (Platform.OS === 'web') {
            let habits = await getWebHabits();
            if (filter?.category) habits = habits.filter(h => h.category === filter.category);
            if (filter?.is_active !== undefined) habits = habits.filter(h => h.is_active === filter.is_active);
            if (filter?.search) { const q = filter.search.toLowerCase(); habits = habits.filter(h => h.title.toLowerCase().includes(q)); }
            return habits;
        }

        const db = getDB();
        let query = 'SELECT * FROM habits WHERE 1=1';
        const params: any[] = [];

        if (filter?.category) { query += ' AND category = ?'; params.push(filter.category); }
        if (filter?.is_active !== undefined) { query += ' AND is_active = ?'; params.push(filter.is_active ? 1 : 0); }
        if (filter?.search) { query += ' AND title LIKE ?'; params.push(`%${filter.search}%`); }
        query += ' ORDER BY created_at DESC LIMIT 200';

        const rows = await db.getAllAsync(query, params);
        return rows.map((r: any) => mapRowToHabit(r));
    }

    async findById(id: number): Promise<Habit | null> {
        if (Platform.OS === 'web') {
            const habits = await getWebHabits();
            return habits.find(h => h.id === id) || null;
        }

        const db = getDB();
        const rows = await db.getAllAsync('SELECT * FROM habits WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return mapRowToHabit(rows[0]);
    }

    async update(id: number, input: UpdateHabitInput): Promise<Habit> {
        if (Platform.OS === 'web') {
            const habits = await getWebHabits();
            const idx = habits.findIndex(h => h.id === id);
            if (idx === -1) throw new Error('Habit not found');
            habits[idx] = { ...habits[idx], ...input, updated_at: new Date().toISOString() } as Habit;
            await saveWebHabits(habits);
            return habits[idx];
        }

        const db = getDB();
        const current = await this.findById(id);
        if (!current) throw new Error('Habit not found');

        const mappedInput: any = { ...input };
        if (input.specific_days) mappedInput.specific_days = JSON.stringify(input.specific_days);
        if (input.is_active !== undefined) mappedInput.is_active = input.is_active ? 1 : 0;

        const ALLOWED_COLUMNS = new Set([
            'title', 'description', 'category', 'frequency_type', 'specific_days',
            'times_per_week', 'time_of_day', 'reminder_time', 'color', 'icon',
            'is_active', 'start_date', 'end_date',
        ]);
        const keys = Object.keys(mappedInput).filter(k => ALLOWED_COLUMNS.has(k));
        if (keys.length === 0) return current;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => mappedInput[k]);

        await db.runAsync(
            `UPDATE habits SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, id]
        );
        return (await this.findById(id))!;
    }

    async delete(id: number): Promise<void> {
        if (Platform.OS === 'web') {
            let habits = await getWebHabits();
            habits = habits.filter(h => h.id !== id);
            await saveWebHabits(habits);
            return;
        }

        const db = getDB();
        await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
    }

    async logCompletion(habitId: number, date: string, notes?: string): Promise<HabitCompletion> {
        if (Platform.OS === 'web') {
            const completions = await getWebCompletions();
            const existing = completions.find(c => c.habit_id === habitId && c.date === date);
            if (existing) return existing;

            const comp: HabitCompletion = {
                id: Date.now(), habit_id: habitId, date,
                completed_at: new Date().toISOString(), notes: notes || null,
            };
            completions.push(comp);
            await saveWebCompletions(completions);

            // Update streak on web — check if yesterday was completed
            const habits = await getWebHabits();
            const idx = habits.findIndex(h => h.id === habitId);
            if (idx !== -1) {
                const yesterday = new Date(date);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                const yesterdayDone = completions.some(c => c.habit_id === habitId && c.date === yesterdayStr);

                habits[idx].total_completions += 1;
                if (yesterdayDone) {
                    habits[idx].current_streak += 1;
                } else {
                    habits[idx].current_streak = 1;
                }
                if (habits[idx].current_streak > habits[idx].longest_streak) {
                    habits[idx].longest_streak = habits[idx].current_streak;
                }
                habits[idx].updated_at = new Date().toISOString();
                await saveWebHabits(habits);
            }
            return comp;
        }

        // ── Native SQLite ──
        const db = getDB();
        // Check if already completed today
        const existing = await db.getAllAsync(
            'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
            [habitId, date]
        );
        if (existing.length > 0) return mapRowToCompletion(existing[0]);

        // Use transaction to ensure INSERT + streak UPDATE are atomic
        let insertId = 0;
        await db.withTransactionAsync(async () => {
            const result = await db.runAsync(
                'INSERT INTO habit_completions (habit_id, date, notes) VALUES (?, ?, ?)',
                [habitId, date, notes || null]
            );
            insertId = result.lastInsertRowId;

            // Check if yesterday was completed to decide streak logic
            const yesterday = new Date(date);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const yesterdayCompletion = await db.getAllAsync(
                'SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?',
                [habitId, yesterdayStr]
            );
            const continueStreak = yesterdayCompletion.length > 0;

            // Update streak counters — reset to 1 if yesterday wasn't completed
            if (continueStreak) {
                await db.runAsync(
                    `UPDATE habits SET
                     total_completions = total_completions + 1,
                     current_streak = current_streak + 1,
                     longest_streak = MAX(longest_streak, current_streak + 1),
                     updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [habitId]
                );
            } else {
                await db.runAsync(
                    `UPDATE habits SET
                     total_completions = total_completions + 1,
                     current_streak = 1,
                     longest_streak = MAX(longest_streak, 1),
                     updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [habitId]
                );
            }
        });

        const rows = await db.getAllAsync('SELECT * FROM habit_completions WHERE id = ?', [insertId]);
        return mapRowToCompletion(rows[0]);
    }

    async undoCompletion(habitId: number, date: string): Promise<void> {
        if (Platform.OS === 'web') {
            let completions = await getWebCompletions();
            completions = completions.filter(c => !(c.habit_id === habitId && c.date === date));
            await saveWebCompletions(completions);

            const habits = await getWebHabits();
            const idx = habits.findIndex(h => h.id === habitId);
            if (idx !== -1 && habits[idx].current_streak > 0) {
                habits[idx].total_completions = Math.max(0, habits[idx].total_completions - 1);
                habits[idx].current_streak = Math.max(0, habits[idx].current_streak - 1);
                await saveWebHabits(habits);
            }
            return;
        }

        const db = getDB();
        await db.runAsync(
            'DELETE FROM habit_completions WHERE habit_id = ? AND date = ?',
            [habitId, date]
        );
        await db.runAsync(
            `UPDATE habits SET
             total_completions = MAX(0, total_completions - 1),
             current_streak = MAX(0, current_streak - 1),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [habitId]
        );
    }

    async getCompletionsForDate(date: string): Promise<HabitCompletion[]> {
        if (Platform.OS === 'web') {
            const completions = await getWebCompletions();
            return completions.filter(c => c.date === date);
        }

        const db = getDB();
        const rows = await db.getAllAsync('SELECT * FROM habit_completions WHERE date = ?', [date]);
        return rows.map((r: any) => mapRowToCompletion(r));
    }

    async getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]> {
        if (Platform.OS === 'web') {
            const completions = await getWebCompletions();
            return completions.filter(c => c.habit_id === habitId);
        }

        const db = getDB();
        const rows = await db.getAllAsync(
            'SELECT * FROM habit_completions WHERE habit_id = ? ORDER BY date DESC',
            [habitId]
        );
        return rows.map((r: any) => mapRowToCompletion(r));
    }
}

export const habitRepository = new HabitRepository();
