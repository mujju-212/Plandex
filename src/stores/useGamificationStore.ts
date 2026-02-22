import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { gamificationService, LEVELS, XP_AWARDS } from '../services/gamificationService';

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    unlocked: boolean;
    requirement: string;
}

const DEFAULT_BADGES: Badge[] = [
    { id: 'first_todo', title: 'First Step', description: 'Create your first todo', icon: 'check-circle', color: '#4CAF50', unlocked: false, requirement: '1 todo created' },
    { id: 'five_todos', title: 'On a Roll', description: 'Complete 5 todos', icon: 'done-all', color: '#2196F3', unlocked: false, requirement: '5 todos completed' },
    { id: 'first_log', title: 'Journaler', description: 'Write your first daily log', icon: 'create', color: '#FF9800', unlocked: false, requirement: '1 daily log' },
    { id: 'first_goal', title: 'Dreamer', description: 'Set your first goal', icon: 'flag', color: '#9C27B0', unlocked: false, requirement: '1 goal set' },
    { id: 'first_habit', title: 'Habit Builder', description: 'Create your first habit', icon: 'loop', color: '#00BFA5', unlocked: false, requirement: '1 habit created' },
    { id: 'streak_3', title: 'Consistent', description: '3-day log streak', icon: 'local-fire-department', color: '#FF5722', unlocked: false, requirement: '3-day streak' },
    { id: 'streak_7', title: 'On Fire', description: '7-day log streak', icon: 'whatshot', color: '#E91E63', unlocked: false, requirement: '7-day streak' },
    { id: 'level_2', title: 'Starter', description: 'Reach level 2', icon: 'trending-up', color: '#607D8B', unlocked: false, requirement: 'Level 2' },
    { id: 'level_3', title: 'Organizer', description: 'Reach level 3', icon: 'star', color: '#FFC107', unlocked: false, requirement: 'Level 3' },
    { id: 'goal_achieved', title: 'Goal Getter', description: 'Achieve a goal', icon: 'emoji-events', color: '#FFD700', unlocked: false, requirement: '1 goal achieved' },
];

interface GamificationState {
    totalXP: number;
    currentLevel: number;
    levelTitle: string;
    currentStreak: number;
    todosCompleted: number;
    badges: Badge[];
    isLoading: boolean;
    error: string | null;
    loadStats: () => Promise<void>;
    awardXP: (action: keyof typeof XP_AWARDS) => Promise<void>;
    clearError: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
    totalXP: 0,
    currentLevel: 1,
    levelTitle: 'Beginner',
    currentStreak: 0,
    todosCompleted: 0,
    badges: DEFAULT_BADGES,
    isLoading: false,
    error: null,

    loadStats: async () => {
        try {
            set({ isLoading: true });
            if (Platform.OS === 'web' && AsyncStorage) {
                const raw = await AsyncStorage.getItem('user_stats');
                const stats = raw ? JSON.parse(raw) : { total_xp: 0, current_level: 1, current_log_streak: 0, total_todos_completed: 0 };
                const lvl = LEVELS.find(l => l.level === stats.current_level) || LEVELS[0];

                // Load badges
                const badgeRaw = await AsyncStorage.getItem('user_badges');
                const unlockedIds: string[] = badgeRaw ? JSON.parse(badgeRaw) : [];
                const badges = DEFAULT_BADGES.map(b => ({ ...b, unlocked: unlockedIds.includes(b.id) }));

                set({
                    totalXP: stats.total_xp,
                    currentLevel: stats.current_level,
                    levelTitle: lvl.title,
                    currentStreak: stats.current_log_streak || 0,
                    todosCompleted: stats.total_todos_completed || 0,
                    badges,
                    isLoading: false,
                });
            } else {
                // Native: read from SQLite
                try {
                    const db = (await import('../database/database')).getDB();
                    const rows = await db.getAllAsync<{
                        total_xp: number; current_level: number;
                        current_log_streak: number; total_todos_completed: number;
                    }>('SELECT total_xp, current_level, current_log_streak, total_todos_completed FROM user_stats LIMIT 1');
                    if (rows.length) {
                        const s = rows[0];
                        const lvl = LEVELS.find(l => l.level === s.current_level) || LEVELS[0];
                        const badgeRows = await db.getAllAsync<{ badge_id: string }>('SELECT badge_id FROM user_badges');
                        const unlockedIds = badgeRows.map(r => r.badge_id);
                        const badges = DEFAULT_BADGES.map(b => ({ ...b, unlocked: unlockedIds.includes(b.id) }));
                        set({
                            totalXP: s.total_xp,
                            currentLevel: s.current_level,
                            levelTitle: lvl.title,
                            currentStreak: s.current_log_streak || 0,
                            todosCompleted: s.total_todos_completed || 0,
                            badges,
                        });
                    }
                } catch (err: any) {
                    console.error('Failed to load native stats', err);
                    set({ error: err.message || 'Failed to load stats' });
                }
                set({ isLoading: false });
            }
        } catch (e: any) { set({ isLoading: false, error: e.message }); }
    },

    awardXP: async (action) => {
        try {
            set({ error: null });
            await gamificationService.awardXP(action);
            await get().loadStats();
        } catch (e: any) {
            set({ error: e.message });
        }
    },

    clearError: () => set({ error: null }),
}));
