import { habitRepository } from '../database/repositories/habitRepository';
import { CreateHabitInput, Habit, HabitCompletion, HabitFilter, UpdateHabitInput } from '../types/habit.types';
import { gamificationService } from './gamificationService';

class HabitService {
    async createHabit(input: CreateHabitInput): Promise<Habit> {
        if (!input.title?.trim()) throw new Error('Habit title is required');
        return habitRepository.insert({ ...input, title: input.title.trim() });
    }

    async getHabits(filter?: HabitFilter): Promise<Habit[]> {
        return habitRepository.findAll(filter);
    }

    async getHabitById(id: number): Promise<Habit | null> {
        return habitRepository.findById(id);
    }

    async updateHabit(id: number, input: UpdateHabitInput): Promise<Habit> {
        return habitRepository.update(id, input);
    }

    async deleteHabit(id: number): Promise<void> {
        return habitRepository.delete(id);
    }

    async logCompletion(habitId: number, date: string, notes?: string): Promise<HabitCompletion> {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
        const habit = await habitRepository.findById(habitId);
        if (!habit) throw new Error('Habit not found');
        const completion = await habitRepository.logCompletion(habitId, date, notes);
        await gamificationService.awardXP('complete_habit');
        return completion;
    }

    async undoCompletion(habitId: number, date: string): Promise<void> {
        return habitRepository.undoCompletion(habitId, date);
    }

    async getCompletionsForDate(date: string): Promise<HabitCompletion[]> {
        return habitRepository.getCompletionsForDate(date);
    }

    async getCompletionsForHabit(habitId: number): Promise<HabitCompletion[]> {
        return habitRepository.getCompletionsForHabit(habitId);
    }
}

export const habitService = new HabitService();
