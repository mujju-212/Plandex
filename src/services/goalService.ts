import { goalRepository } from '../database/repositories/goalRepository';
import { CreateGoalInput, Goal, GoalFilter, UpdateGoalInput } from '../types/goal.types';
import { gamificationService } from './gamificationService';

class GoalService {
    async createGoal(input: CreateGoalInput): Promise<Goal> {
        if (!input.title?.trim()) throw new Error('Goal title is required');
        if (input.start_date && input.end_date) {
            const start = new Date(input.start_date);
            const end = new Date(input.end_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }
            if (start.getTime() > end.getTime()) {
                throw new Error('Start date cannot be after end date');
            }
        }
        return goalRepository.insert({ ...input, title: input.title.trim() });
    }

    async getGoals(filter?: GoalFilter): Promise<Goal[]> {
        return goalRepository.findAll(filter);
    }

    async getGoalById(id: number): Promise<Goal | null> {
        return goalRepository.findById(id);
    }

    async updateGoal(id: number, input: UpdateGoalInput): Promise<Goal> {
        return goalRepository.update(id, input);
    }

    async deleteGoal(id: number): Promise<void> {
        return goalRepository.delete(id);
    }

    async achieveGoal(id: number, notes?: string): Promise<Goal> {
        const existing = await goalRepository.findById(id);
        if (!existing) throw new Error('Goal not found');
        if (existing.status === 'achieved') throw new Error('Goal is already achieved');
        const goal = await goalRepository.update(id, { status: 'achieved', completion_notes: notes });
        await gamificationService.awardXP('achieve_goal');
        return goal;
    }

    async updateProgress(id: number, value: number): Promise<Goal> {
        if (value < 0) throw new Error('Progress value cannot be negative');
        return goalRepository.updateProgress(id, value);
    }

    async completeMilestone(goalId: number, milestoneId: number): Promise<Goal> {
        const existing = await goalRepository.findById(goalId);
        if (!existing) throw new Error('Goal not found');
        const milestone = existing.milestones?.find(m => m.id === milestoneId);
        if (!milestone) throw new Error('Milestone not found');
        if (milestone.is_completed) throw new Error('Milestone is already completed');
        const goal = await goalRepository.completeMilestone(goalId, milestoneId);
        await gamificationService.awardXP('complete_milestone');
        return goal;
    }
}

export const goalService = new GoalService();
