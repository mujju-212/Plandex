import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHabitStore } from '../../../src/stores/useHabitStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { typography } from '../../../src/theme/typography';

type HabitFilter = 'all' | 'active' | 'paused';

export default function HabitListScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { habits, loadHabits, isLoading } = useHabitStore();
  const [filter, setFilter] = useState<HabitFilter>('all');

  useEffect(() => { loadHabits(); }, []);

  const activeHabits = habits.filter(h => h.is_active);
  const pausedHabits = habits.filter(h => !h.is_active);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.longest_streak ?? 0), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + (h.total_completions ?? 0), 0);

  const filtered = filter === 'all' ? habits
    : filter === 'active' ? activeHabits
    : pausedHabits;

  const getFrequencyText = (habit: any) => {
    if (habit.frequency_type === 'daily') return 'Daily';
    if (habit.frequency_type === 'x_per_week') return `${habit.times_per_week}x/wk`;
    if (habit.frequency_type === 'specific_days') {
      const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      return habit.specific_days?.map((d: number) => names[d]).join(' ') || 'Specific days';
    }
    return 'Custom';
  };

  const getCompletionRate = (habit: any) => {
    const start = new Date(habit.start_date);
    const daysSince = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
    let expected = habit.frequency_type === 'daily' ? daysSince
      : habit.frequency_type === 'x_per_week' ? Math.ceil(daysSince / 7) * (habit.times_per_week || 1)
      : Math.ceil(daysSince / 7) * (habit.specific_days?.length || 1);
    return Math.min(100, Math.round(((habit.total_completions ?? 0) / Math.max(1, expected)) * 100));
  };

  const stats = [
    { label: 'Total', value: habits.length, icon: 'repeat', color: tc.primary },
    { label: 'Active', value: activeHabits.length, icon: 'check-circle', color: tc.success },
    { label: 'Best Streak', value: bestStreak, icon: 'local-fire-department', color: tc.warning },
    { label: 'Done', value: totalCompletions, icon: 'done-all', color: tc.textSecondary },
  ];

  const FILTERS: { key: HabitFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: habits.length },
    { key: 'active', label: 'Active', count: activeHabits.length },
    { key: 'paused', label: 'Paused', count: pausedHabits.length },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={22} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Habits</Text>
        <Pressable onPress={() => router.push('/habit/create')} style={[styles.iconBtn, { backgroundColor: tc.primary }]}>
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
            <MaterialIcons name="repeat" size={48} color={tc.border} />
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>
              {filter === 'all' ? 'No habits yet' : `No ${filter} habits`}
            </Text>
            <Pressable onPress={() => router.push('/habit/create')}>
              <Text style={[styles.emptyLink, { color: tc.primary }]}>+ Build a Habit</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map(habit => {
            const rate = getCompletionRate(habit);
            const rateColor = rate >= 80 ? tc.success : rate >= 50 ? tc.warning : tc.danger;
            return (
              <Pressable
                key={habit.id}
                style={[styles.card, { backgroundColor: tc.cardBackground }]}
                onPress={() => router.push(`/habit/${habit.id}`)}
              >
                <View style={[styles.strip, { backgroundColor: habit.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardTitle, { color: tc.textPrimary }]} numberOfLines={1}>{habit.title}</Text>
                    <View style={styles.rightBadges}>
                      {!habit.is_active && (
                        <View style={[styles.badge, { backgroundColor: tc.warning + '20' }]}>
                          <Text style={[styles.badgeText, { color: tc.warning }]}>Paused</Text>
                        </View>
                      )}
                      <View style={styles.streakInline}>
                        <MaterialIcons name="local-fire-department" size={13} color={habit.current_streak > 0 ? tc.warning : tc.border} />
                        <Text style={[styles.streakNum, { color: habit.current_streak > 0 ? tc.warning : tc.textSecondary }]}>{habit.current_streak ?? 0}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Completion bar */}
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBg, { backgroundColor: tc.border }]}>
                      <View style={[styles.progressFill, { backgroundColor: rateColor, width: `${rate}%` }]} />
                    </View>
                    <Text style={[styles.progressTxt, { color: tc.textSecondary }]}>{rate}%</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <MaterialIcons name="category" size={12} color={tc.textSecondary} />
                    <Text style={[styles.metaTxt, { color: tc.textSecondary }]}>{habit.category}</Text>
                    <Text style={[styles.dot, { color: tc.border }]}>·</Text>
                    <MaterialIcons name="repeat" size={12} color={tc.textSecondary} />
                    <Text style={[styles.metaTxt, { color: tc.textSecondary }]}>{getFrequencyText(habit)}</Text>
                    <Text style={[styles.dot, { color: tc.border }]}>·</Text>
                    <MaterialIcons name="emoji-events" size={12} color={tc.textSecondary} />
                    <Text style={[styles.metaTxt, { color: tc.textSecondary }]}>Best {habit.longest_streak ?? 0}d</Text>
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
  rightBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: typography.weights.medium as any },
  streakInline: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakNum: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  progressTxt: { fontSize: typography.sizes.xs, minWidth: 32, textAlign: 'right' as const },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: typography.sizes.xs },
  dot: { fontSize: 10, marginHorizontal: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: typography.sizes.md },
  emptyLink: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
});
