import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateDailyLogInput, DailyLog, UpdateDailyLogInput } from '../../types/log.types';
import { getDB } from '../database';

const LOGS_STORAGE_KEY = 'myplanner_daily_logs';

class LogRepository {
    // ---- Web (AsyncStorage) helpers ----
    private async getWebLogs(): Promise<DailyLog[]> {
        try {
            const data = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (error) {
            console.error('Failed to parse web logs', error);
        }
        return [];
    }

    private async setWebLogs(logs: DailyLog[]): Promise<void> {
        try {
            await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save web logs', error);
        }
    }

    // ---- CRUD Methods ----
    async upsert(input: CreateDailyLogInput): Promise<DailyLog> {
        const timestamp = new Date().toISOString();

        if (Platform.OS === 'web') {
            const logs = await this.getWebLogs();
            const existingIndex = logs.findIndex(l => l.date === input.date);

            if (existingIndex >= 0) {
                logs[existingIndex] = {
                    ...logs[existingIndex],
                    ...input,
                    tags: input.tags || logs[existingIndex].tags,
                    updated_at: timestamp,
                };
                await this.setWebLogs(logs);
                return logs[existingIndex];
            }

            const newLog: DailyLog = {
                id: Date.now(),
                date: input.date,
                what_i_did: input.what_i_did || null,
                achievements: input.achievements || null,
                learnings: input.learnings || null,
                challenges: input.challenges || null,
                tomorrow_intention: input.tomorrow_intention || null,
                gratitude: input.gratitude || null,
                productivity_rating: input.productivity_rating || null,
                satisfaction_rating: input.satisfaction_rating || null,
                completion_rating: input.completion_rating || null,
                energy_rating: input.energy_rating || null,
                overall_rating: input.overall_rating || null,
                mood: input.mood || null,
                tags: input.tags || [],
                created_at: timestamp,
                updated_at: timestamp,
            };
            logs.push(newLog);
            await this.setWebLogs(logs);
            return newLog;
        }

        // --- Native SQLite ---
        const db = getDB();
        const tagsJson = JSON.stringify(input.tags || []);

        // Use INSERT ... ON CONFLICT to preserve id and created_at on update
        await db.runAsync(
            `INSERT INTO daily_logs (
                date, what_i_did, achievements, learnings, challenges,
                tomorrow_intention, gratitude, productivity_rating, satisfaction_rating,
                completion_rating, energy_rating, overall_rating, mood, tags, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(date) DO UPDATE SET
                what_i_did = excluded.what_i_did,
                achievements = excluded.achievements,
                learnings = excluded.learnings,
                challenges = excluded.challenges,
                tomorrow_intention = excluded.tomorrow_intention,
                gratitude = excluded.gratitude,
                productivity_rating = excluded.productivity_rating,
                satisfaction_rating = excluded.satisfaction_rating,
                completion_rating = excluded.completion_rating,
                energy_rating = excluded.energy_rating,
                overall_rating = excluded.overall_rating,
                mood = excluded.mood,
                tags = excluded.tags,
                updated_at = CURRENT_TIMESTAMP`,
            [
                input.date,
                input.what_i_did || null,
                input.achievements || null,
                input.learnings || null,
                input.challenges || null,
                input.tomorrow_intention || null,
                input.gratitude || null,
                input.productivity_rating || null,
                input.satisfaction_rating || null,
                input.completion_rating || null,
                input.energy_rating || null,
                input.overall_rating || null,
                input.mood || null,
                tagsJson,
            ]
        );
        return (await this.findByDate(input.date))!;
    }

    async findByDate(date: string): Promise<DailyLog | null> {
        if (Platform.OS === 'web') {
            const logs = await this.getWebLogs();
            return logs.find(l => l.date === date) || null;
        }

        const db = getDB();
        const result = await db.getAllAsync('SELECT * FROM daily_logs WHERE date = ?', [date]);
        if (result.length === 0) return null;
        return this.mapRowToLog(result[0] as any);
    }

    async findAll(): Promise<DailyLog[]> {
        if (Platform.OS === 'web') {
            const logs = await this.getWebLogs();
            return logs.sort((a, b) => b.date.localeCompare(a.date));
        }

        const db = getDB();
        const rows = await db.getAllAsync('SELECT * FROM daily_logs ORDER BY date DESC LIMIT 365');
        return rows.map((row: any) => this.mapRowToLog(row));
    }

    async findRecent(limit: number = 7): Promise<DailyLog[]> {
        if (Platform.OS === 'web') {
            const logs = await this.getWebLogs();
            return logs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
        }

        const db = getDB();
        const rows = await db.getAllAsync('SELECT * FROM daily_logs ORDER BY date DESC LIMIT ?', [limit]);
        return rows.map((row: any) => this.mapRowToLog(row));
    }

    async update(date: string, input: UpdateDailyLogInput): Promise<DailyLog> {
        if (Platform.OS === 'web') {
            const logs = await this.getWebLogs();
            const index = logs.findIndex(l => l.date === date);
            if (index === -1) throw new Error('Daily log not found');

            logs[index] = {
                ...logs[index],
                ...input,
                tags: input.tags || logs[index].tags,
                updated_at: new Date().toISOString(),
            };
            await this.setWebLogs(logs);
            return logs[index];
        }

        const db = getDB();
        const current = await this.findByDate(date);
        if (!current) throw new Error('Daily log not found');

        const mappedInput: any = { ...input };
        if (input.tags) {
            mappedInput.tags = JSON.stringify(input.tags);
        }

        const ALLOWED_COLUMNS = new Set([
            'what_i_did', 'achievements', 'learnings', 'challenges',
            'tomorrow_intention', 'gratitude', 'productivity_rating',
            'satisfaction_rating', 'completion_rating', 'energy_rating',
            'overall_rating', 'mood', 'tags',
        ]);
        const keys = Object.keys(mappedInput).filter(k => ALLOWED_COLUMNS.has(k));
        if (keys.length === 0) return current;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => mappedInput[k]);

        await db.runAsync(
            `UPDATE daily_logs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE date = ?`,
            [...values, date]
        );

        return (await this.findByDate(date))!;
    }

    async delete(date: string): Promise<void> {
        if (Platform.OS === 'web') {
            const logs = await this.getWebLogs();
            await this.setWebLogs(logs.filter(l => l.date !== date));
            return;
        }

        const db = getDB();
        await db.runAsync('DELETE FROM daily_logs WHERE date = ?', [date]);
    }

    private mapRowToLog(row: any): DailyLog {
        return {
            ...row,
            tags: JSON.parse(row.tags || '[]'),
        };
    }
}

export const logRepository = new LogRepository();
