import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateGoalInput, Goal, GoalFilter, GoalMilestone, UpdateGoalInput } from '../../types/goal.types';

const GOALS_KEY = 'goals_data';
let nextId = 200;
let nextMilestoneId = 1000;

async function getAll(): Promise<Goal[]> {
    try { const raw = await AsyncStorage.getItem(GOALS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveAll(goals: Goal[]): Promise<void> { await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals)); }

class GoalRepository {
    async insert(input: CreateGoalInput): Promise<Goal> {
        const goals = await getAll();
        const now = new Date().toISOString();
        const milestones: GoalMilestone[] = (input.milestones || []).map((m, i) => ({
            id: nextMilestoneId++, goal_id: nextId, title: m.title,
            target_date: m.target_date || null, is_completed: false, completed_at: null, position: i,
        }));
        const goal: Goal = {
            id: nextId++, title: input.title, description: input.description || null,
            category: input.category || 'general', goal_type: input.goal_type || 'achievement',
            target_value: input.target_value ?? null, current_value: 0, unit: input.unit || null,
            duration_type: input.duration_type || 'custom',
            start_date: input.start_date || now.split('T')[0], end_date: input.end_date || null,
            status: 'not_started', priority: input.priority || 'medium',
            color: input.color || '#4CAF50', icon: input.icon || 'target',
            completed_at: null, completion_notes: null, milestones,
            created_at: now, updated_at: now,
        };
        goals.unshift(goal);
        await saveAll(goals);
        return goal;
    }

    async findAll(filter?: GoalFilter): Promise<Goal[]> {
        let goals = await getAll();
        if (filter?.category) goals = goals.filter(g => g.category === filter.category);
        if (filter?.status) goals = goals.filter(g => g.status === filter.status);
        if (filter?.priority) goals = goals.filter(g => g.priority === filter.priority);
        if (filter?.search) { const q = filter.search.toLowerCase(); goals = goals.filter(g => g.title.toLowerCase().includes(q)); }
        return goals;
    }

    async findById(id: number): Promise<Goal | null> {
        const goals = await getAll();
        return goals.find(g => g.id === id) || null;
    }

    async update(id: number, input: UpdateGoalInput): Promise<Goal> {
        const goals = await getAll();
        const idx = goals.findIndex(g => g.id === id);
        if (idx === -1) throw new Error('Goal not found');
        const updated = { ...goals[idx], ...input, updated_at: new Date().toISOString() } as Goal;
        if (input.status === 'achieved' && !updated.completed_at) updated.completed_at = new Date().toISOString();
        goals[idx] = updated;
        await saveAll(goals);
        return updated;
    }

    async delete(id: number): Promise<void> {
        let goals = await getAll();
        goals = goals.filter(g => g.id !== id);
        await saveAll(goals);
    }

    async completeMilestone(goalId: number, milestoneId: number): Promise<Goal> {
        const goals = await getAll();
        const idx = goals.findIndex(g => g.id === goalId);
        if (idx === -1) throw new Error('Goal not found');
        const mIdx = goals[idx].milestones.findIndex(m => m.id === milestoneId);
        if (mIdx !== -1) {
            goals[idx].milestones[mIdx].is_completed = true;
            goals[idx].milestones[mIdx].completed_at = new Date().toISOString();
        }
        goals[idx].updated_at = new Date().toISOString();
        await saveAll(goals);
        return goals[idx];
    }

    async updateProgress(goalId: number, value: number): Promise<Goal> {
        const goals = await getAll();
        const idx = goals.findIndex(g => g.id === goalId);
        if (idx === -1) throw new Error('Goal not found');
        goals[idx].current_value = value;
        if (goals[idx].target_value && value >= goals[idx].target_value!) {
            goals[idx].status = 'achieved';
            goals[idx].completed_at = new Date().toISOString();
        } else if (value > 0) {
            goals[idx].status = 'in_progress';
        }
        goals[idx].updated_at = new Date().toISOString();
        await saveAll(goals);
        return goals[idx];
    }
}

export const goalRepository = new GoalRepository();
