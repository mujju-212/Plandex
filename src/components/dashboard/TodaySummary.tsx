import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

type TodaySummaryProps = {
  todosCompleted: number;
  todosTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  streakDays: number;
  eventsToday: number;
  activeGoals: number;
  productivityScore: number;
};

type StatItemData = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
};

export default function TodaySummary({
  todosCompleted,
  todosTotal,
  habitsCompleted,
  habitsTotal,
  streakDays,
  eventsToday,
  activeGoals,
  productivityScore,
}: TodaySummaryProps) {
  const tc = useThemeStore().colors;

  const stats: StatItemData[] = [
    { icon: 'check-circle', iconColor: tc.primary, iconBg: tc.primary + '20', label: 'Todos', value: `${todosCompleted}/${todosTotal}` },
    { icon: 'loop', iconColor: tc.primary, iconBg: tc.primary + '20', label: 'Habits', value: `${habitsCompleted}/${habitsTotal}` },
    { icon: 'local-fire-department', iconColor: tc.primary, iconBg: tc.primary + '20', label: 'Streak', value: `${streakDays}d` },
    { icon: 'event-note', iconColor: tc.primary, iconBg: tc.primary + '20', label: 'Events', value: `${eventsToday}` },
    { icon: 'flag', iconColor: tc.primary, iconBg: tc.primary + '20', label: 'Goals', value: `${activeGoals}` },
    { icon: 'insights', iconColor: tc.primary, iconBg: tc.primary + '20', label: 'Score', value: `${productivityScore}%` },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
            <View style={[styles.iconCircle, { backgroundColor: stat.iconBg }]}>
              <MaterialIcons name={stat.icon} size={18} color={stat.iconColor} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
    marginTop: 2,
  },
});
