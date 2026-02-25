import { create } from 'zustand';
import { goalService } from '../services/goalService';
import { scheduleGoalDeadlineReminder } from '../services/notificationService';
import { CreateGoalInput, Goal, GoalFilter, UpdateGoalInput } from '../types/goal.types';

interface GoalState {
    goals: Goal[];
    selectedGoal: Goal | null;
    isLoading: boolean;
    error: string | null;
    loadGoals: (filter?: GoalFilter) => Promise<void>;
    addGoal: (input: CreateGoalInput) => Promise<Goal>;
    updateGoal: (id: number, input: UpdateGoalInput) => Promise<void>;
    deleteGoal: (id: number) => Promise<void>;
    achieveGoal: (id: number, notes?: string) => Promise<void>;
    updateProgress: (id: number, value: number) => Promise<void>;
    completeMilestone: (goalId: number, milestoneId: number) => Promise<void>;
    selectGoal: (goal: Goal | null) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
    goals: [],
    selectedGoal: null,
    isLoading: false,
    error: null,

    loadGoals: async (filter?) => {
        try {
            set({ isLoading: true, error: null });
            const goals = await goalService.getGoals(filter);
            set({ goals, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
    },

    addGoal: async (input) => {
        try {
            const goal = await goalService.createGoal(input);
            // Schedule reminder 1 day before goal deadline
            if (goal.end_date) {
                scheduleGoalDeadlineReminder(goal.id, goal.title, goal.end_date).catch(() => {});
            }
            set(s => ({ goals: [goal, ...s.goals] }));
            return goal;
        } catch (e: any) { set({ error: e.message }); throw e; }
    },

    updateGoal: async (id, input) => {
        try {
            const goal = await goalService.updateGoal(id, input);
            set(s => ({ goals: s.goals.map(g => g.id === id ? goal : g), selectedGoal: s.selectedGoal?.id === id ? goal : s.selectedGoal }));
        } catch (e: any) { set({ error: e.message }); }
    },

    deleteGoal: async (id) => {
        try {
            await goalService.deleteGoal(id);
            set(s => ({ goals: s.goals.filter(g => g.id !== id), selectedGoal: s.selectedGoal?.id === id ? null : s.selectedGoal }));
        } catch (e: any) { set({ error: e.message }); }
    },

    achieveGoal: async (id, notes?) => {
        try {
            const goal = await goalService.achieveGoal(id, notes);
            set(s => ({ goals: s.goals.map(g => g.id === id ? goal : g) }));
        } catch (e: any) { set({ error: e.message }); }
    },

    updateProgress: async (id, value) => {
        try {
            const goal = await goalService.updateProgress(id, value);
            set(s => ({ goals: s.goals.map(g => g.id === id ? goal : g) }));
        } catch (e: any) { set({ error: e.message }); }
    },

    completeMilestone: async (goalId, milestoneId) => {
        try {
            const goal = await goalService.completeMilestone(goalId, milestoneId);
            set(s => ({ goals: s.goals.map(g => g.id === goalId ? goal : g), selectedGoal: s.selectedGoal?.id === goalId ? goal : s.selectedGoal }));
        } catch (e: any) { set({ error: e.message }); }
    },

    selectGoal: (goal) => set({ selectedGoal: goal }),
}));
