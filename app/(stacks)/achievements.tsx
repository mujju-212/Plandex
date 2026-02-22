import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEVELS } from '../../src/services/gamificationService';
import { useGamificationStore } from '../../src/stores/useGamificationStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';

export default function AchievementsScreen() {
    const router = useRouter();
    const tc = useThemeStore().colors;
    const { totalXP, currentLevel, levelTitle, currentStreak, todosCompleted, badges, loadStats } = useGamificationStore();

    useEffect(() => { loadStats(); }, []);

    const currentLevelDef = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
    const nextLevelDef = LEVELS.find(l => l.level === currentLevel + 1);
    const xpForLevel = totalXP - currentLevelDef.min_xp;
    const xpNeeded = (nextLevelDef?.min_xp || currentLevelDef.max_xp) - currentLevelDef.min_xp;
    const xpProgress = xpNeeded > 0 ? Math.min((xpForLevel / xpNeeded) * 100, 100) : 100;

    const unlockedCount = badges.filter(b => b.unlocked).length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable>
                <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Achievements</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Level Card */}
                <LinearGradient colors={[tc.gradientStart, tc.gradientEnd]} style={styles.levelCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.levelTop}>
                        <View style={styles.levelBadge}><Text style={styles.levelNumber}>{currentLevel}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.levelTitle}>{levelTitle}</Text>
                            <Text style={styles.xpText}>{totalXP} XP total</Text>
                        </View>
                        <MaterialIcons name="emoji-events" size={36} color="rgba(255,255,255,0.3)" />
                    </View>
                    <View style={styles.xpBarOuter}>
                        <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
                    </View>
                    <Text style={styles.xpProgress}>{xpForLevel} / {xpNeeded} XP to {nextLevelDef ? `Level ${nextLevelDef.level}` : 'Max'}</Text>
                </LinearGradient>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
                        <MaterialIcons name="local-fire-department" size={24} color="#FF5722" />
                        <Text style={[styles.statValue, { color: tc.textPrimary }]}>{currentStreak}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Day Streak</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
                        <MaterialIcons name="done-all" size={24} color="#4CAF50" />
                        <Text style={[styles.statValue, { color: tc.textPrimary }]}>{todosCompleted}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Completed</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
                        <MaterialIcons name="star" size={24} color="#FFC107" />
                        <Text style={[styles.statValue, { color: tc.textPrimary }]}>{unlockedCount}</Text>
                        <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Badges</Text>
                    </View>
                </View>

                {/* Badge Grid */}
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Badges ({unlockedCount}/{badges.length})</Text>
                <View style={styles.badgeGrid}>
                    {badges.map(badge => (
                        <View key={badge.id} style={[styles.badgeCard, { backgroundColor: tc.cardBackground }, !badge.unlocked && styles.badgeLocked]}>
                            <View style={[styles.badgeIcon, { backgroundColor: badge.unlocked ? badge.color + '20' : tc.border + '30' }]}>
                                <MaterialIcons name={badge.icon as any} size={28} color={badge.unlocked ? badge.color : tc.textSecondary + '60'} />
                            </View>
                            <Text style={[styles.badgeTitle, { color: tc.textPrimary }, !badge.unlocked && { color: tc.textSecondary }]}>{badge.title}</Text>
                            <Text style={[styles.badgeDesc, { color: tc.textSecondary }]}>{badge.description}</Text>
                            <Text style={[styles.badgeReq, { color: tc.textSecondary }, badge.unlocked && { color: badge.color }]}>{badge.unlocked ? '✓ Unlocked' : badge.requirement}</Text>
                        </View>
                    ))}
                </View>

                {/* XP Breakdown */}
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>How to Earn XP</Text>
                <View style={[styles.xpList, { backgroundColor: tc.cardBackground }]}>
                    {[
                        ['Complete a todo', '10 XP', 'check-circle', '#4CAF50'],
                        ['Complete urgent todo', '20 XP', 'priority-high', '#E91E63'],
                        ['Daily log', '20 XP', 'create', '#FF9800'],
                        ['Weekly review', '30 XP', 'date-range', '#2196F3'],
                        ['Monthly review', '50 XP', 'calendar-today', '#9C27B0'],
                        ['Complete habit', '10 XP', 'loop', '#00BFA5'],
                        ['Achieve a goal', '100 XP', 'emoji-events', '#FFD700'],
                        ['Complete milestone', '25 XP', 'flag', '#607D8B'],
                    ].map(([label, xp, icon, color], i) => (
                        <View key={i} style={[styles.xpRow, { borderBottomColor: tc.border }]}>
                            <View style={[styles.xpRowIcon, { backgroundColor: color + '20' }]}>
                                <MaterialIcons name={icon as any} size={18} color={color as string} />
                            </View>
                            <Text style={[styles.xpRowLabel, { color: tc.textPrimary }]}>{label}</Text>
                            <Text style={[styles.xpRowValue, { color: color as string }]}>{xp}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
    headerBtn: { padding: 8, borderRadius: 20 },
    headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    levelCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
    levelTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    levelBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    levelNumber: { fontSize: 22, fontWeight: typography.weights.bold as any, color: '#FFF' },
    levelTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any, color: '#FFF' },
    xpText: { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    xpBarOuter: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    xpBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
    xpProgress: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statCard: { flex: 1, alignItems: 'center', borderRadius: 16, paddingVertical: 16, gap: 4 },
    statValue: { fontSize: 22, fontWeight: typography.weights.bold as any },
    statLabel: { fontSize: typography.sizes.xs },
    sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, marginBottom: 12, marginTop: 4 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    badgeCard: { width: '48%' as any, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6 },
    badgeLocked: { opacity: 0.5 },
    badgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    badgeTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, textAlign: 'center' },
    badgeDesc: { fontSize: typography.sizes.xs, textAlign: 'center' },
    badgeReq: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium as any, marginTop: 4 },
    xpList: { borderRadius: 16, overflow: 'hidden' },
    xpRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1 },
    xpRowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    xpRowLabel: { flex: 1, fontSize: typography.sizes.sm },
    xpRowValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any },
});
