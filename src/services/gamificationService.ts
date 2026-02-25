import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getDB } from '../database/database';

export const XP_AWARDS = {
    create_todo: 5,
    complete_todo: 10,
    complete_urgent_todo: 20,
    create_event: 5,
    complete_daily_log: 20,
    complete_weekly_log: 30,
    complete_monthly_log: 50,
    complete_habit: 10,
    achieve_goal: 100,
    complete_milestone: 25,
    maintain_streak_bonus: 5,
    complete_project: 150,
    ai_chat: 2,
} as const;

export const LEVELS = [
    { level: 1, title: 'Beginner', min_xp: 0, max_xp: 100 },
    { level: 2, title: 'Starter', min_xp: 100, max_xp: 300 },
    { level: 3, title: 'Organizer', min_xp: 300, max_xp: 600 },
    { level: 4, title: 'Planner', min_xp: 600, max_xp: 1000 },
    { level: 5, title: 'Achiever', min_xp: 1000, max_xp: 1500 },
];

class GamificationService {
    private async getWebStats() {
        try {
            const data = await AsyncStorage.getItem('user_stats');
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse web stats', e);
        }
        return { total_xp: 0, current_level: 1, current_log_streak: 0, total_todos_completed: 0 };
    }

    private async setWebStats(stats: any) {
        try {
            await AsyncStorage.setItem('user_stats', JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save web stats', e);
        }
    }

    // Compute XP-based level (handles multi-level jumps)
    private computeLevel(xp: number): number {
        let level = 1;
        for (const l of LEVELS) {
            if (xp >= l.min_xp) level = l.level;
        }
        return level;
    }

    // Derive which badges should be unlocked from stats
    private computeUnlockedBadgeIds(stats: { total_xp: number; current_level: number; current_log_streak: number; total_todos_completed: number }): string[] {
        const ids: string[] = [];
        if (stats.total_todos_completed >= 1) ids.push('first_todo');
        if (stats.total_todos_completed >= 5) ids.push('five_todos');
        if (stats.current_log_streak >= 1) ids.push('first_log');
        if (stats.current_log_streak >= 3) ids.push('streak_3');
        if (stats.current_log_streak >= 7) ids.push('streak_7');
        if (stats.current_level >= 2) ids.push('level_2');
        if (stats.current_level >= 3) ids.push('level_3');
        return ids;
    }

    private async saveBadges(stats: any) {
        const ids = this.computeUnlockedBadgeIds(stats);
        try {
            if (Platform.OS === 'web') {
                const existing = await AsyncStorage.getItem('user_badges');
                const prev: string[] = existing ? JSON.parse(existing) : [];
                const merged = Array.from(new Set([...prev, ...ids]));
                await AsyncStorage.setItem('user_badges', JSON.stringify(merged));
            } else {
                const db = getDB();
                for (const id of ids) {
                    await db.runAsync('INSERT OR IGNORE INTO user_badges (badge_id) VALUES (?)', [id]);
                }
            }
        } catch (e) {
            console.error('Failed to save badges', e);
        }
    }

    async awardXP(action: keyof typeof XP_AWARDS, customAmount?: number) {
        const amount = customAmount || XP_AWARDS[action];

        try {
            if (Platform.OS === 'web') {
                const stats = await this.getWebStats();
                const newXp = stats.total_xp + amount;
                const newLevel = this.computeLevel(newXp);
                if (newLevel > stats.current_level) {
                    const lvlDef = LEVELS.find(l => l.level === newLevel);
                    console.log(`Level Up! Now level ${newLevel}: ${lvlDef?.title}`);
                }
                const updated = { ...stats, total_xp: newXp, current_level: newLevel };
                await this.setWebStats(updated);
                await this.saveBadges(updated);
            } else {
                const db = getDB();
                await db.withTransactionAsync(async () => {
                    const statsRow = await db.getAllAsync<{ total_xp: number; current_level: number; current_log_streak: number; total_todos_completed: number }>(
                        'SELECT total_xp, current_level, current_log_streak, total_todos_completed FROM user_stats LIMIT 1'
                    );
                    if (!statsRow.length) return;
                    const stats = statsRow[0];
                    const newXp = stats.total_xp + amount;
                    const newLevel = this.computeLevel(newXp);
                    if (newLevel > stats.current_level) {
                        const lvlDef = LEVELS.find(l => l.level === newLevel);
                        console.log(`Level Up! Now level ${newLevel}: ${lvlDef?.title}`);
                    }
                    await db.runAsync('UPDATE user_stats SET total_xp = ?, current_level = ?', [newXp, newLevel]);
                    await this.saveBadges({ ...stats, total_xp: newXp, current_level: newLevel });
                });
            }
        } catch (e) {
            console.error('Failed to award XP', e);
        }
    }

    async incrementStat(statName: 'total_todos_completed' | 'current_log_streak') {
        try {
            if (Platform.OS === 'web') {
                const stats = await this.getWebStats();
                stats[statName] = (stats[statName] || 0) + 1;
                await this.setWebStats(stats);
                await this.saveBadges(stats);
            } else {
                const db = getDB();
                await db.runAsync(`UPDATE user_stats SET ${statName} = ${statName} + 1`);
                // Re-read and check badges after increment
                const rows = await db.getAllAsync<any>('SELECT total_xp, current_level, current_log_streak, total_todos_completed FROM user_stats LIMIT 1');
                if (rows.length) await this.saveBadges(rows[0]);
            }
        } catch (e) {
            console.error(`Failed to increment stat: ${statName}`, e);
        }
    }

    async unlockBadge(badgeId: string) {
        try {
            if (Platform.OS === 'web') {
                const existing = await AsyncStorage.getItem('user_badges');
                const prev: string[] = existing ? JSON.parse(existing) : [];
                if (!prev.includes(badgeId)) {
                    await AsyncStorage.setItem('user_badges', JSON.stringify([...prev, badgeId]));
                }
            } else {
                const db = getDB();
                await db.runAsync('INSERT OR IGNORE INTO user_badges (badge_id) VALUES (?)', [badgeId]);
            }
        } catch (e) {
            console.error('Failed to unlock badge', e);
        }
    }
}

export const gamificationService = new GamificationService();
