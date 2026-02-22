import { logRepository } from '../database/repositories/logRepository';
import { CreateDailyLogInput, DailyLog, UpdateDailyLogInput } from '../types/log.types';
import { gamificationService } from './gamificationService';

class LogService {
    async getDailyLog(date: string): Promise<DailyLog | null> {
        return logRepository.findByDate(date);
    }

    async getAllLogs(): Promise<DailyLog[]> {
        return logRepository.findAll();
    }

    async getRecentLogs(limit: number = 7): Promise<DailyLog[]> {
        const safeLimit = Math.max(1, Math.min(limit, 365));
        return logRepository.findRecent(safeLimit);
    }

    async saveDailyLog(input: CreateDailyLogInput): Promise<DailyLog> {
        if (!input.date || input.date.trim() === '') {
            throw new Error('Date is required for a daily log');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }

        // Validate rating fields (1-5 range)
        const ratingFields: (keyof CreateDailyLogInput)[] = ['productivity_rating', 'satisfaction_rating', 'completion_rating', 'energy_rating', 'overall_rating'];
        for (const field of ratingFields) {
            const val = input[field] as number | undefined | null;
            if (val !== undefined && val !== null) {
                if (typeof val !== 'number' || val < 1 || val > 5 || !Number.isInteger(val)) {
                    throw new Error(`${String(field)} must be an integer between 1 and 5`);
                }
            }
        }

        // Check if a log already exists for this date (to prevent XP farming on updates)
        const existing = await logRepository.findByDate(input.date);

        const log = await logRepository.upsert(input);

        // Only award XP and update streak on first log creation (not updates)
        if (!existing) {
            await gamificationService.awardXP('complete_daily_log');
            await gamificationService.incrementStat('current_log_streak');
        }

        return log;
    }

    async updateDailyLog(date: string, input: UpdateDailyLogInput): Promise<DailyLog> {
        return logRepository.update(date, input);
    }

    async deleteDailyLog(date: string): Promise<void> {
        await logRepository.delete(date);
    }
}

export const logService = new LogService();
