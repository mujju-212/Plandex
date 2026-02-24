import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { Goal } from '../../types/goal.types';

type ActiveGoalsProps = {
  goals: Goal[];
  onGoalPress: (id: number) => void;
  onViewAll: () => void;
};

// Priority indicated by dot, themed with tc.primary

export default function ActiveGoals({ goals, onGoalPress, onViewAll }: ActiveGoalsProps) {
  const tc = useThemeStore().colors;

  const activeGoals = goals
    .filter(g => g.status === 'in_progress' || g.status === 'not_started')
    .slice(0, 3);

  if (activeGoals.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="flag" size={20} color={tc.primary} />
            <Text style={[styles.title, { color: tc.textPrimary }]}>Active Goals</Text>
          </View>
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={[styles.viewAll, { color: tc.primary }]}>View All</Text>
          </Pressable>
        </View>
        <View style={[styles.emptyCard, { backgroundColor: tc.cardBackground }]}>
          <View style={[styles.emptyIcon, { backgroundColor: tc.primary + '15' }]}>
            <MaterialIcons name="outlined-flag" size={28} color={tc.primary} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>No active goals</Text>
            <Text style={[styles.emptyHint, { color: tc.textSecondary }]}>Set a goal and track progress!</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="flag" size={20} color={tc.primary} />
          <Text style={[styles.title, { color: tc.textPrimary }]}>Active Goals</Text>
          <View style={[styles.countBadge, { backgroundColor: tc.primary + '20' }]}>
            <Text style={[styles.countText, { color: tc.primary }]}>{activeGoals.length}</Text>
          </View>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={[styles.viewAll, { color: tc.primary }]}>View All</Text>
        </Pressable>
      </View>

      {activeGoals.map(goal => {
        const progress = goal.target_value
          ? Math.min((goal.current_value / goal.target_value) * 100, 100)
          : goal.milestones.length > 0
            ? (goal.milestones.filter(m => m.is_completed).length / goal.milestones.length) * 100
            : 0;

        const pColor = tc.primary;

        return (
          <Pressable
            key={goal.id}
            onPress={() => onGoalPress(goal.id)}
            style={({ pressed }) => [
              styles.goalCard,
              { backgroundColor: tc.cardBackground, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={styles.goalTop}>
              <View style={[styles.goalIcon, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="flag" size={18} color={tc.primary} />
              </View>
              <View style={styles.goalInfo}>
                <Text style={[styles.goalTitle, { color: tc.textPrimary }]} numberOfLines={1}>{goal.title}</Text>
                <Text style={[styles.goalCategory, { color: tc.textSecondary }]}>
                  {goal.category} · {goal.priority} priority
                </Text>
              </View>
              <View style={[styles.priorityDot, { backgroundColor: pColor }]} />
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: tc.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: tc.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: tc.textSecondary }]}>{Math.round(progress)}%</Text>
            </View>

            {goal.target_value != null && (
              <Text style={[styles.goalDetail, { color: tc.textSecondary }]}>
                {goal.current_value} / {goal.target_value} {goal.unit || ''}
              </Text>
            )}

            {goal.milestones.length > 0 && (
              <Text style={[styles.goalDetail, { color: tc.textSecondary }]}>
                {goal.milestones.filter(m => m.is_completed).length} of {goal.milestones.length} milestones
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
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
  goalCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
  },
  goalCategory: {
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: typography.weights.bold as any,
    minWidth: 32,
    textAlign: 'right',
  },
  goalDetail: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
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
