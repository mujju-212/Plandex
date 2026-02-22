import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateGoalInput, Goal, GoalFilter, GoalMilestone, UpdateGoalInput } from '../../types/goal.types';
import { getDB } from '../database';

const GOALS_KEY = 'goals_data';

// ─── AsyncStorage helpers (web only) ───────────────────
async function getWebGoals(): Promise<Goal[]> {
    try { const raw = await AsyncStorage.getItem(GOALS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function saveWebGoals(goals: Goal[]): Promise<void> { await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals)); }

// ─── Row mappers (SQLite → Goal) ───────────────────────
function mapRowToGoal(row: any, milestones: GoalMilestone[]): Goal {
    return {
        ...row,
        target_value: row.target_value ?? null,
        current_value: row.current_value ?? 0,
        milestones,
    };
}

function mapRowToMilestone(row: any): GoalMilestone {
    return {
        ...row,
        is_completed: Boolean(row.is_completed),
    };
}

// ─── Repository ────────────────────────────────────────
class GoalRepository {

    private async loadMilestones(goalId: number): Promise<GoalMilestone[]> {
        const db = getDB();
        const rows = await db.getAllAsync(
            'SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY position ASC',
            [goalId]
        );
        return rows.map((r: any) => mapRowToMilestone(r));
    }

    async insert(input: CreateGoalInput): Promise<Goal> {
        const now = new Date().toISOString();

        if (Platform.OS === 'web') {
            const goals = await getWebGoals();
            const goalId = Date.now();
            const milestones: GoalMilestone[] = (input.milestones || []).map((m, i) => ({
                id: goalId + i + 1, goal_id: goalId, title: m.title,
                target_date: m.target_date || null, is_completed: false, completed_at: null, position: i,
            }));
            const goal: Goal = {
                id: goalId, title: input.title, description: input.description || null,
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
            await saveWebGoals(goals);
            return goal;
        }

        // ── Native SQLite ──
        const db = getDB();
        const result = await db.runAsync(
            `INSERT INTO goals (title, description, category, goal_type, target_value, unit,
             duration_type, start_date, end_date, priority, color, icon)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.title,
                input.description || null,
                input.category || 'general',
                input.goal_type || 'achievement',
                input.target_value ?? null,
                input.unit || null,
                input.duration_type || 'custom',
                input.start_date || now.split('T')[0],
                input.end_date || null,
                input.priority || 'medium',
                input.color || '#4CAF50',
                input.icon || 'target',
            ]
        );
        const goalId = result.lastInsertRowId;

        // Insert milestones
        if (input.milestones && input.milestones.length > 0) {
            for (let i = 0; i < input.milestones.length; i++) {
                const m = input.milestones[i];
                await db.runAsync(
                    'INSERT INTO goal_milestones (goal_id, title, target_date, position) VALUES (?, ?, ?, ?)',
                    [goalId, m.title, m.target_date || null, i]
                );
            }
        }

        return (await this.findById(goalId))!;
    }

    async findAll(filter?: GoalFilter): Promise<Goal[]> {
        if (Platform.OS === 'web') {
            let goals = await getWebGoals();
            if (filter?.category) goals = goals.filter(g => g.category === filter.category);
            if (filter?.status) goals = goals.filter(g => g.status === filter.status);
            if (filter?.priority) goals = goals.filter(g => g.priority === filter.priority);
            if (filter?.search) { const q = filter.search.toLowerCase(); goals = goals.filter(g => g.title.toLowerCase().includes(q)); }
            return goals;
        }

        const db = getDB();
        let query = 'SELECT * FROM goals WHERE 1=1';
        const params: any[] = [];

        if (filter?.category) { query += ' AND category = ?'; params.push(filter.category); }
        if (filter?.status) { query += ' AND status = ?'; params.push(filter.status); }
        if (filter?.priority) { query += ' AND priority = ?'; params.push(filter.priority); }
        if (filter?.search) { query += ' AND title LIKE ?'; params.push(`%${filter.search}%`); }
        query += ' ORDER BY created_at DESC LIMIT 200';

        const rows = await db.getAllAsync(query, params);
        if (rows.length === 0) return [];

        // Batch-load all milestones for retrieved goals to avoid N+1 queries
        const goalIds = (rows as any[]).map(r => r.id);
        const placeholders = goalIds.map(() => '?').join(',');
        const allMilestoneRows = await db.getAllAsync(
            `SELECT * FROM goal_milestones WHERE goal_id IN (${placeholders}) ORDER BY position ASC`,
            goalIds
        );
        const milestoneMap = new Map<number, GoalMilestone[]>();
        for (const mr of allMilestoneRows as any[]) {
            const ms = mapRowToMilestone(mr);
            if (!milestoneMap.has(ms.goal_id)) milestoneMap.set(ms.goal_id, []);
            milestoneMap.get(ms.goal_id)!.push(ms);
        }

        const goals: Goal[] = [];
        for (const row of rows as any[]) {
            goals.push(mapRowToGoal(row, milestoneMap.get(row.id) || []));
        }
        return goals;
    }

    async findById(id: number): Promise<Goal | null> {
        if (Platform.OS === 'web') {
            const goals = await getWebGoals();
            return goals.find(g => g.id === id) || null;
        }

        const db = getDB();
        const rows = await db.getAllAsync('SELECT * FROM goals WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const milestones = await this.loadMilestones(id);
        return mapRowToGoal(rows[0], milestones);
    }

    async update(id: number, input: UpdateGoalInput): Promise<Goal> {
        if (Platform.OS === 'web') {
            const goals = await getWebGoals();
            const idx = goals.findIndex(g => g.id === id);
            if (idx === -1) throw new Error('Goal not found');
            const updated = { ...goals[idx], ...input, updated_at: new Date().toISOString() } as Goal;
            if (input.status === 'achieved' && !updated.completed_at) updated.completed_at = new Date().toISOString();
            goals[idx] = updated;
            await saveWebGoals(goals);
            return updated;
        }

        const db = getDB();
        const current = await this.findById(id);
        if (!current) throw new Error('Goal not found');

        const mappedInput: any = { ...input };
        // Auto‐set completed_at when status becomes achieved
        if (input.status === 'achieved' && !current.completed_at) {
            mappedInput.completed_at = new Date().toISOString();
        }

        const ALLOWED_COLUMNS = new Set([
            'title', 'description', 'category', 'goal_type', 'target_value',
            'current_value', 'unit', 'duration_type', 'start_date', 'end_date',
            'status', 'priority', 'color', 'icon', 'completed_at', 'completion_notes',
        ]);
        const keys = Object.keys(mappedInput).filter(k => ALLOWED_COLUMNS.has(k));
        if (keys.length === 0) return current;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => mappedInput[k]);

        await db.runAsync(
            `UPDATE goals SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, id]
        );
        return (await this.findById(id))!;
    }

    async delete(id: number): Promise<void> {
        if (Platform.OS === 'web') {
            let goals = await getWebGoals();
            goals = goals.filter(g => g.id !== id);
            await saveWebGoals(goals);
            return;
        }

        const db = getDB();
        // Milestones are deleted automatically via ON DELETE CASCADE
        await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
    }

    async completeMilestone(goalId: number, milestoneId: number): Promise<Goal> {
        if (Platform.OS === 'web') {
            const goals = await getWebGoals();
            const idx = goals.findIndex(g => g.id === goalId);
            if (idx === -1) throw new Error('Goal not found');
            const mIdx = goals[idx].milestones.findIndex(m => m.id === milestoneId);
            if (mIdx !== -1) {
                goals[idx].milestones[mIdx].is_completed = true;
                goals[idx].milestones[mIdx].completed_at = new Date().toISOString();
            }
            goals[idx].updated_at = new Date().toISOString();
            await saveWebGoals(goals);
            return goals[idx];
        }

        const db = getDB();

        // Verify goal and milestone exist before updating
        const goal = await this.findById(goalId);
        if (!goal) throw new Error('Goal not found');

        const milestoneRows = await db.getAllAsync(
            'SELECT * FROM goal_milestones WHERE id = ? AND goal_id = ?',
            [milestoneId, goalId]
        );
        if (milestoneRows.length === 0) throw new Error('Milestone not found');
        if ((milestoneRows[0] as any).is_completed) return goal;

        // Wrap milestone + goal update in a transaction
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `UPDATE goal_milestones SET is_completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND goal_id = ?`,
                [milestoneId, goalId]
            );
            await db.runAsync(
                'UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [goalId]
            );
        });

        return (await this.findById(goalId))!;
    }

    async updateProgress(goalId: number, value: number): Promise<Goal> {
        if (Platform.OS === 'web') {
            const goals = await getWebGoals();
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
            await saveWebGoals(goals);
            return goals[idx];
        }

        const db = getDB();
        const goal = await this.findById(goalId);
        if (!goal) throw new Error('Goal not found');

        let status = goal.status;
        let completed_at = goal.completed_at;
        if (goal.target_value && value >= goal.target_value) {
            status = 'achieved';
            completed_at = new Date().toISOString();
        } else if (value > 0) {
            status = 'in_progress';
        }

        await db.runAsync(
            `UPDATE goals SET current_value = ?, status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [value, status, completed_at, goalId]
        );
        return (await this.findById(goalId))!;
    }
}

export const goalRepository = new GoalRepository();
