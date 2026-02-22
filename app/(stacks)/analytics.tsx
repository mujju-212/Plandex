import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGoalStore } from '../../src/stores/useGoalStore';
import { useHabitStore } from '../../src/stores/useHabitStore';
import { useLogStore } from '../../src/stores/useLogStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { typography } from '../../src/theme/typography';

export default function AnalyticsScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { todos, loadTodos } = useTodoStore();
  const { logs, loadLogs } = useLogStore();
  const { habits, loadHabits } = useHabitStore();
  const { goals, loadGoals } = useGoalStore();

  useEffect(() => {
    loadTodos();
    loadLogs();
    loadHabits();
    loadGoals();
  }, []);

  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.status === 'completed').length;
  const pendingTodos = todos.filter(t => t.status === 'pending').length;
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  const totalLogs = logs.length;
  const avgOverall = logs.length > 0
    ? (logs.reduce((sum, l) => sum + (l.overall_rating || 0), 0) / logs.length).toFixed(1)
    : '—';

  const activeHabits = habits.filter(h => h.is_active).length;
  const bestHabitStreak = habits.reduce((max, h) => Math.max(max, h.current_streak ?? 0), 0);
  const activeGoals = goals.filter(g => g.status === 'in_progress' || g.status === 'not_started').length;
  const achievedGoals = goals.filter(g => g.status === 'achieved').length;

  const stats = [
    { label: 'Total Tasks', value: totalTodos.toString(), icon: 'assignment', color: tc.primary },
    { label: 'Completed', value: completedTodos.toString(), icon: 'check-circle', color: tc.success },
    { label: 'Pending', value: pendingTodos.toString(), icon: 'pending', color: tc.warning },
    { label: 'Completion %', value: `${completionRate}%`, icon: 'trending-up', color: tc.primary },
    { label: 'Daily Logs', value: totalLogs.toString(), icon: 'insert-drive-file', color: tc.primary },
    { label: 'Avg Rating', value: avgOverall, icon: 'star', color: tc.warning },
    { label: 'Active Habits', value: activeHabits.toString(), icon: 'repeat', color: tc.success },
    { label: 'Best Streak', value: `${bestHabitStreak}d`, icon: 'local-fire-department', color: '#FF5722' },
    { label: 'Active Goals', value: activeGoals.toString(), icon: 'flag', color: tc.primary },
    { label: 'Goals Done', value: achievedGoals.toString(), icon: 'emoji-events', color: '#FFD700' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
              <MaterialIcons name={s.icon as any} size={24} color={s.color} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Todo Priority Breakdown */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Task Priority Breakdown</Text>
        <View style={[styles.breakdownCard, { backgroundColor: tc.cardBackground }]}>
          {['urgent', 'high', 'medium', 'low'].map(p => {
            const count = todos.filter(t => t.priority === p).length;
            const pct = totalTodos > 0 ? Math.round((count / totalTodos) * 100) : 0;
            const barColor = p === 'urgent' ? tc.danger : p === 'high' ? tc.warning : p === 'medium' ? tc.primary : tc.success;
            return (
              <View key={p} style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: tc.textSecondary }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                <View style={[styles.breakdownBar, { backgroundColor: tc.border }]}><View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: barColor }]} /></View>
                <Text style={[styles.breakdownValue, { color: tc.textPrimary }]}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* Log Ratings Breakdown */}
        {logs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Log Ratings Breakdown</Text>
            <View style={[styles.breakdownCard, { backgroundColor: tc.cardBackground }]}>
              {[
                { label: 'Productivity', key: 'productivity_rating' },
                { label: 'Satisfaction', key: 'satisfaction_rating' },
                { label: 'Energy', key: 'energy_rating' },
                { label: 'Overall', key: 'overall_rating' },
              ].map(({ label, key }) => {
                const avg = logs.reduce((s, l) => s + ((l as any)[key] || 0), 0) / logs.length;
                const pct = Math.round((avg / 10) * 100);
                return (
                  <View key={key} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: tc.textSecondary }]}>{label}</Text>
                    <View style={[styles.breakdownBar, { backgroundColor: tc.border }]}><View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: tc.primary }]} /></View>
                    <Text style={[styles.breakdownValue, { color: tc.textPrimary }]}>{avg.toFixed(1)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Goals Breakdown */}
        {goals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Goals Overview</Text>
            <View style={[styles.breakdownCard, { backgroundColor: tc.cardBackground }]}>
              {(['in_progress', 'achieved', 'not_started', 'failed'] as const).map(s => {
                const count = goals.filter(g => g.status === s).length;
                const pct = goals.length > 0 ? Math.round((count / goals.length) * 100) : 0;
                const barColor = s === 'achieved' ? tc.success : s === 'in_progress' ? tc.primary : s === 'failed' ? tc.danger : tc.textSecondary;
                const label = s === 'in_progress' ? 'Active' : s === 'not_started' ? 'Not Started' : s.charAt(0).toUpperCase() + s.slice(1);
                return (
                  <View key={s} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: tc.textSecondary }]}>{label}</Text>
                    <View style={[styles.breakdownBar, { backgroundColor: tc.border }]}><View style={[styles.breakdownFill, { width: `${pct}%`, backgroundColor: barColor }]} /></View>
                    <Text style={[styles.breakdownValue, { color: tc.textPrimary }]}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any },
  content: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 16, padding: 18, alignItems: 'center', gap: 6 },
  statValue: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any, marginTop: 24, marginBottom: 12 },
  breakdownCard: { borderRadius: 16, padding: 16 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  breakdownLabel: { width: 70, fontSize: typography.sizes.sm },
  breakdownBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' as const },
  breakdownFill: { height: '100%' as any, borderRadius: 4 },
  breakdownValue: { width: 24, textAlign: 'right' as const, fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
});
