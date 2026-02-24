import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

type QuickActionsProps = {
  onCreateEvent: () => void;
  onCreateLog: () => void;
  onCreateHabit: () => void;
  onCreateGoal: () => void;
};

export default function QuickActions({ onCreateEvent, onCreateLog, onCreateHabit, onCreateGoal }: QuickActionsProps) {
  const tc = useThemeStore().colors;

  const ACTIONS = [
    { key: 'event', icon: 'event' as const, label: 'Event' },
    { key: 'log', icon: 'edit-note' as const, label: 'Log' },
    { key: 'habit', icon: 'loop' as const, label: 'Habit' },
    { key: 'goal', icon: 'flag' as const, label: 'Goal' },
  ];

  const handlers: Record<string, () => void> = {
    event: onCreateEvent,
    log: onCreateLog,
    habit: onCreateHabit,
    goal: onCreateGoal,
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Quick Create</Text>
      <View style={styles.row}>
        {ACTIONS.map(action => (
          <Pressable
            key={action.key}
            onPress={handlers[action.key]}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: tc.cardBackground, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: tc.primary + '20' }]}>
              <MaterialIcons name={action.icon} size={22} color={tc.primary} />
            </View>
            <Text style={[styles.label, { color: tc.textPrimary }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold as any,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold as any,
  },
});
