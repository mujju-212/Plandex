import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { Habit, HabitCompletion } from '../../types/habit.types';

type TodayHabitsProps = {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggle: (habitId: number, date: string) => void;
  onViewAll: () => void;
};

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  health: 'favorite',
  fitness: 'fitness-center',
  learning: 'school',
  productivity: 'trending-up',
  mindfulness: 'self-improvement',
  social: 'people',
  creative: 'brush',
  general: 'loop',
};

export default function TodayHabits({ habits, completions, onToggle, onViewAll }: TodayHabitsProps) {
  const tc = useThemeStore().colors;
  const today = new Date().toISOString().split('T')[0];
  const activeHabits = habits.filter(h => h.is_active).slice(0, 5);
  const completedIds = new Set(completions.filter(c => c.date === today).map(c => c.habit_id));

  if (activeHabits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="loop" size={20} color={tc.primary} />
            <Text style={[styles.title, { color: tc.textPrimary }]}>Today's Habits</Text>
          </View>
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={[styles.viewAll, { color: tc.primary }]}>View All</Text>
          </Pressable>
        </View>
        <View style={[styles.emptyCard, { backgroundColor: tc.cardBackground }]}>
          <View style={[styles.emptyIcon, { backgroundColor: tc.primary + '15' }]}>
            <MaterialIcons name="add-task" size={28} color={tc.primary} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>No habits yet</Text>
            <Text style={[styles.emptyHint, { color: tc.textSecondary }]}>Start building daily habits!</Text>
          </View>
        </View>
      </View>
    );
  }

  const completedCount = activeHabits.filter(h => completedIds.has(h.id)).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="loop" size={20} color={tc.primary} />
          <Text style={[styles.title, { color: tc.textPrimary }]}>Today's Habits</Text>
          <View style={[styles.countBadge, { backgroundColor: tc.success + '20' }]}>
            <Text style={[styles.countText, { color: tc.success }]}>{completedCount}/{activeHabits.length}</Text>
          </View>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={[styles.viewAll, { color: tc.primary }]}>View All</Text>
        </Pressable>
      </View>

      {activeHabits.map(habit => {
        const isDone = completedIds.has(habit.id);
        const icon = CATEGORY_ICONS[habit.category] || 'loop';
        return (
          <Pressable
            key={habit.id}
            onPress={() => onToggle(habit.id, today)}
            style={({ pressed }) => [
              styles.habitRow,
              { backgroundColor: isDone ? tc.success + '10' : tc.cardBackground, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
              <MaterialIcons name={icon} size={18} color={habit.color} />
            </View>
            <View style={styles.habitInfo}>
              <Text style={[styles.habitTitle, { color: tc.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' }]}>
                {habit.title}
              </Text>
              <View style={styles.habitMeta}>
                {habit.current_streak > 0 && (
                  <View style={styles.streakRow}>
                    <MaterialIcons name="local-fire-department" size={12} color="#FF9800" />
                    <Text style={[styles.streakText, { color: tc.textSecondary }]}>{habit.current_streak}d streak</Text>
                  </View>
                )}
                <Text style={[styles.habitTime, { color: tc.textSecondary }]}>{habit.time_of_day}</Text>
              </View>
            </View>
            <View style={[styles.checkbox, { borderColor: isDone ? tc.success : tc.border, backgroundColor: isDone ? tc.success : 'transparent' }]}>
              {isDone && <MaterialIcons name="check" size={16} color="#FFF" />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: typography.weights.bold as any,
  },
  viewAll: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    gap: 12,
  },
  habitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontSize: typography.sizes.xs,
  },
  habitTime: {
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 14,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  emptyHint: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
