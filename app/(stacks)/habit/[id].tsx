import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHabitStore } from '../../../src/stores/useHabitStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { habits, todayCompletions, deleteHabit, toggleCompletion } = useHabitStore();
  const habit = habits.find(h => h.id === Number(id));

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}><Pressable onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable><Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Habit</Text><View style={{ width: 40 }} /></View>
        <View style={styles.center}><Text style={[styles.emptyText, { color: tc.textSecondary }]}>Habit not found</Text></View>
      </SafeAreaView>
    );
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const isDoneToday = todayCompletions.some(c => c.habit_id === habit.id && c.date === today);

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteHabit(habit.id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Habit Detail</Text>
        <Pressable onPress={() => router.push(`/habit/edit?id=${habit.id}`)} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="edit" size={22} color={tc.primary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.colorBar, { backgroundColor: habit.color }]} />
        <Text style={[styles.title, { color: tc.textPrimary }]}>{habit.title}</Text>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: habit.color + '20' }]}><Text style={[styles.badgeText, { color: habit.color }]}>{habit.category}</Text></View>
          <View style={[styles.badge, { backgroundColor: tc.primary + '20' }]}><Text style={[styles.badgeText, { color: tc.primary }]}>{habit.frequency_type.replace('_', ' ')}</Text></View>
          <View style={[styles.badge, { backgroundColor: tc.warning + '20' }]}><Text style={[styles.badgeText, { color: tc.warning }]}>{habit.time_of_day}</Text></View>
        </View>

        {habit.description && <Text style={[styles.desc, { color: tc.textSecondary }]}>{habit.description}</Text>}

        {/* Today's Action */}
        <Pressable style={[styles.todayAction, { backgroundColor: tc.cardBackground, borderColor: tc.border }, isDoneToday && { backgroundColor: habit.color + '15', borderColor: habit.color }]} onPress={() => toggleCompletion(habit.id, today)}>
          <MaterialIcons name={isDoneToday ? 'check-circle' : 'radio-button-unchecked'} size={32} color={isDoneToday ? habit.color : tc.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.todayLabel, { color: tc.textPrimary }, isDoneToday && { color: habit.color }]}>{isDoneToday ? 'Done Today!' : 'Mark as Done'}</Text>
            <Text style={[styles.todayDate, { color: tc.textSecondary }]}>{format(new Date(), 'EEEE, MMM d')}</Text>
          </View>
          {isDoneToday && <MaterialIcons name="celebration" size={28} color={habit.color} />}
        </Pressable>

        {/* Streak Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
            <Text style={[styles.statValue, { color: habit.color }]}>{habit.current_streak}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Current Streak</Text>
            <MaterialIcons name="local-fire-department" size={20} color={habit.color} />
          </View>
          <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
            <Text style={[styles.statValue, { color: tc.warning }]}>{habit.longest_streak}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Best Streak</Text>
            <MaterialIcons name="emoji-events" size={20} color={tc.warning} />
          </View>
          <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
            <Text style={[styles.statValue, { color: tc.primary }]}>{habit.total_completions}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Total Done</Text>
            <MaterialIcons name="done-all" size={20} color={tc.primary} />
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: tc.cardBackground }]}>
          {habit.frequency_type === 'specific_days' && habit.specific_days.length > 0 && (
            <><View style={styles.infoRow}><MaterialIcons name="date-range" size={20} color={tc.primary} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Days</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{habit.specific_days.map(d => DAYS_SHORT[d - 1]).join(', ')}</Text></View><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /></>
          )}
          {habit.frequency_type === 'x_per_week' && habit.times_per_week && (
            <><View style={styles.infoRow}><MaterialIcons name="repeat" size={20} color={tc.primary} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Frequency</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{habit.times_per_week}x per week</Text></View><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /></>
          )}
          <View style={styles.infoRow}><MaterialIcons name="calendar-today" size={20} color={tc.primary} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Started</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{habit.start_date}</Text></View>
          {habit.reminder_time && (<><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /><View style={styles.infoRow}><MaterialIcons name="notifications" size={20} color={tc.warning} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Reminder</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{habit.reminder_time}</Text></View></>)}
        </View>

        {/* Actions */}
        <Pressable style={[styles.deleteBtn, { backgroundColor: tc.danger + '15' }]} onPress={handleDelete}>
          <MaterialIcons name="delete" size={20} color={tc.danger} />
          <Text style={[styles.deleteBtnText, { color: tc.danger }]}>Delete Habit</Text>
        </Pressable>
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
  todayAction: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, marginBottom: 20 },
  todayLabel: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  todayDate: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center' as const, backgroundColor: colors.cardBackground, borderRadius: 16, paddingVertical: 16, gap: 4 },
  statValue: { fontSize: 28, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium as any },
  infoCard: { backgroundColor: colors.cardBackground, borderRadius: 16, overflow: 'hidden' as const, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary, minWidth: 70 },
  infoValue: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right' as const, fontWeight: typography.weights.medium as any },
  infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 46 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.danger + '15' },
  deleteBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, color: colors.danger },
});
