import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGoalStore } from '../../../src/stores/useGoalStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { goals, deleteGoal, achieveGoal, completeMilestone, updateProgress } = useGoalStore();
  const goal = goals.find(g => g.id === Number(id));

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}><Pressable onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable><Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Goal</Text><View style={{ width: 40 }} /></View>
        <View style={styles.center}><Text style={[styles.emptyText, { color: tc.textSecondary }]}>Goal not found</Text></View>
      </SafeAreaView>
    );
  }

  const progress = goal.target_value ? Math.min((goal.current_value / goal.target_value) * 100, 100) : (goal.status === 'achieved' ? 100 : 0);
  const milestoneDone = goal.milestones.filter(m => m.is_completed).length;

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGoal(goal.id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Goal Detail</Text>
        <Pressable onPress={() => router.push(`/goal/edit?id=${goal.id}`)} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="edit" size={22} color={tc.primary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.colorBar, { backgroundColor: goal.color }]} />
        <Text style={[styles.title, { color: tc.textPrimary }]}>{goal.title}</Text>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: goal.color + '20' }]}><Text style={[styles.badgeText, { color: goal.color }]}>{goal.category}</Text></View>
          <View style={[styles.badge, { backgroundColor: goal.status === 'achieved' ? tc.success + '20' : tc.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: goal.status === 'achieved' ? tc.success : tc.primary }]}>{goal.status.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: goal.priority === 'high' ? tc.danger + '20' : tc.warning + '20' }]}>
            <Text style={[styles.badgeText, { color: goal.priority === 'high' ? tc.danger : tc.warning }]}>{goal.priority}</Text>
          </View>
        </View>

        {goal.description && <Text style={[styles.desc, { color: tc.textSecondary }]}>{goal.description}</Text>}

        {/* Progress */}
        <View style={[styles.progressSection, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: tc.textPrimary }]}>Progress</Text>
            <Text style={[styles.progressValue, { color: tc.primary }]}>{Math.round(progress)}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: tc.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: goal.color }]} />
          </View>
          {goal.goal_type === 'measurable' && (
            <Text style={[styles.progressMeta, { color: tc.textSecondary }]}>{goal.current_value} / {goal.target_value} {goal.unit}</Text>
          )}
        </View>

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Milestones ({milestoneDone}/{goal.milestones.length})</Text>
            {goal.milestones.map(m => (
              <Pressable key={m.id} style={styles.milestone} onPress={() => { if (!m.is_completed) completeMilestone(goal.id, m.id); }}>
                <MaterialIcons name={m.is_completed ? 'check-circle' : 'radio-button-unchecked'} size={22} color={m.is_completed ? tc.success : tc.textSecondary} />
                <Text style={[styles.milestoneText, { color: tc.textPrimary }, m.is_completed && { textDecorationLine: 'line-through' as const, color: tc.textSecondary }]}>{m.title}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.infoRow}><MaterialIcons name="label" size={20} color={goal.color} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Type</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{goal.goal_type}</Text></View>
          <View style={[styles.infoDivider, { backgroundColor: tc.border }]} />
          <View style={styles.infoRow}><MaterialIcons name="date-range" size={20} color={tc.primary} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Duration</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{goal.duration_type}</Text></View>
          {goal.start_date && (<><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /><View style={styles.infoRow}><MaterialIcons name="calendar-today" size={20} color={tc.primary} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Start</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{goal.start_date}</Text></View></>)}
          {goal.end_date && (<><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /><View style={styles.infoRow}><MaterialIcons name="event" size={20} color={tc.warning} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>End</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{goal.end_date}</Text></View></>)}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {goal.status !== 'achieved' && (
            <Pressable style={[styles.actionBtn, { backgroundColor: tc.success + '15' }]} onPress={() => achieveGoal(goal.id)}>
              <MaterialIcons name="emoji-events" size={20} color={tc.success} />
              <Text style={[styles.actionText, { color: tc.success }]}>Achieve</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, { backgroundColor: tc.danger + '15' }]} onPress={handleDelete}>
            <MaterialIcons name="delete" size={20} color={tc.danger} />
            <Text style={[styles.actionText, { color: tc.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.cardBackground },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  emptyText: { color: colors.textSecondary },
  scroll: { padding: 20, paddingBottom: 40 },
  colorBar: { height: 6, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: typography.weights.bold as any, color: colors.textPrimary, marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any, textTransform: 'capitalize' as const },
  desc: { fontSize: typography.sizes.md, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  progressSection: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16, marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  progressValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any, color: colors.primary },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' as const },
  progressFill: { height: '100%' as any, borderRadius: 4 },
  progressMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 6, textAlign: 'center' as const },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary, marginBottom: 12 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
  milestoneText: { fontSize: typography.sizes.md, color: colors.textPrimary, flex: 1 },
  infoCard: { backgroundColor: colors.cardBackground, borderRadius: 16, overflow: 'hidden' as const, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary, minWidth: 70 },
  infoValue: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right' as const, fontWeight: typography.weights.medium as any, textTransform: 'capitalize' as const },
  infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 46 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
});
