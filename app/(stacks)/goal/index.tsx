import { MaterialIcons } from '@expo/vector-icons';
import { differenceInDays } from 'date-fns';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGoalStore } from '../../../src/stores/useGoalStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { typography } from '../../../src/theme/typography';

type GoalFilter = 'all' | 'in_progress' | 'achieved' | 'failed';

export default function GoalListScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { goals, loadGoals, isLoading } = useGoalStore();
  const [filter, setFilter] = useState<GoalFilter>('all');

  useFocusEffect(useCallback(() => { loadGoals(); }, []));

  const activeGoals = goals.filter(g => g.status === 'in_progress' || g.status === 'not_started');
  const achievedGoals = goals.filter(g => g.status === 'achieved');
  const failedGoals = goals.filter(g => g.status === 'failed' || g.status === 'cancelled');

  const filtered = filter === 'all' ? goals
    : filter === 'in_progress' ? activeGoals
    : filter === 'achieved' ? achievedGoals
    : failedGoals;

  const getPriorityColor = (p: string) =>
    p === 'high' ? tc.danger : p === 'medium' ? tc.warning : p === 'low' ? tc.success : tc.textSecondary;

  const getStatusColor = (s: string) =>
    s === 'achieved' ? tc.success : s === 'failed' || s === 'cancelled' ? tc.danger : tc.primary;

  const stats = [
    { label: 'Total', value: goals.length, icon: 'flag', color: tc.primary },
    { label: 'Active', value: activeGoals.length, icon: 'trending-up', color: tc.warning },
    { label: 'Achieved', value: achievedGoals.length, icon: 'emoji-events', color: tc.success },
    { label: 'Failed', value: failedGoals.length, icon: 'close', color: tc.danger },
  ];

  const FILTERS: { key: GoalFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: goals.length },
    { key: 'in_progress', label: 'Active', count: activeGoals.length },
    { key: 'achieved', label: 'Achieved', count: achievedGoals.length },
    { key: 'failed', label: 'Failed', count: failedGoals.length },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={22} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Goals</Text>
        <Pressable onPress={() => router.push('/goal/create')} style={[styles.iconBtn, { backgroundColor: tc.primary }]}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Stats Grid */}
        <View style={styles.grid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
              <MaterialIcons name={s.icon as any} size={22} color={s.color} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.pill, { backgroundColor: tc.cardBackground, borderColor: tc.border },
                filter === f.key && { backgroundColor: tc.primary, borderColor: tc.primary }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.pillText, { color: tc.textSecondary }, filter === f.key && { color: '#FFF' }]}>
                {f.label}{f.count > 0 ? `  ${f.count}` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="flag" size={48} color={tc.border} />
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>
              {filter === 'all' ? 'No goals yet' : `No ${filter === 'in_progress' ? 'active' : filter} goals`}
            </Text>
            <Pressable onPress={() => router.push('/goal/create')}>
              <Text style={[styles.emptyLink, { color: tc.primary }]}>+ Set a Goal</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map(goal => {
            const daysLeft = goal.end_date ? differenceInDays(new Date(goal.end_date), new Date()) : null;
            const pct = goal.current_value && goal.target_value
              ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
            const doneCount = goal.milestones?.filter((m: any) => m.completed_at).length ?? 0;
            return (
              <Pressable
                key={goal.id}
                style={[styles.card, { backgroundColor: tc.cardBackground }]}
                onPress={() => router.push(`/goal/${goal.id}`)}
              >
                <View style={[styles.strip, { backgroundColor: goal.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardTitle, { color: tc.textPrimary }]} numberOfLines={1}>{goal.title}</Text>
                    <View style={styles.rightBadges}>
                      <View style={[styles.badge, { backgroundColor: getPriorityColor(goal.priority) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getPriorityColor(goal.priority) }]}>{goal.priority}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(goal.status) }]}>{goal.status.replace('_', ' ')}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress bar for measurable goals */}
                  {goal.goal_type === 'measurable' && goal.target_value ? (
                    <View style={styles.progressRow}>
                      <View style={[styles.progressBg, { backgroundColor: tc.border }]}>
                        <View style={[styles.progressFill, { backgroundColor: goal.color, width: `${pct}%` }]} />
                      </View>
                      <Text style={[styles.progressTxt, { color: tc.textSecondary }]}>
                        {goal.current_value ?? 0}/{goal.target_value}{goal.unit ? ` ${goal.unit}` : ''}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.metaRow}>
                    <MaterialIcons name="category" size={12} color={tc.textSecondary} />
                    <Text style={[styles.metaTxt, { color: tc.textSecondary }]}>{goal.category}</Text>
                    {goal.milestones?.length > 0 && (
                      <>
                        <Text style={[styles.dot, { color: tc.border }]}>·</Text>
                        <MaterialIcons name="check-box" size={12} color={tc.textSecondary} />
                        <Text style={[styles.metaTxt, { color: tc.textSecondary }]}>{doneCount}/{goal.milestones.length} milestones</Text>
                      </>
                    )}
                    {daysLeft !== null && (
                      <>
                        <Text style={[styles.dot, { color: tc.border }]}>·</Text>
                        <Text style={[styles.metaTxt, { color: daysLeft < 7 ? tc.danger : tc.textSecondary }]}>
                          {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={tc.border} style={{ marginRight: 10 }} />
              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  scroll: { paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs },
  filterRow: { marginBottom: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  pillText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium as any },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  strip: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, paddingVertical: 11, paddingLeft: 12, paddingRight: 4, gap: 5 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, flex: 1 },
  rightBadges: { flexDirection: 'row', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: typography.weights.medium as any, textTransform: 'capitalize' as const },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressTxt: { fontSize: typography.sizes.xs, minWidth: 60, textAlign: 'right' as const },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: typography.sizes.xs },
  dot: { fontSize: 10, marginHorizontal: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: typography.sizes.md },
  emptyLink: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
});
