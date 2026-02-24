import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

type DailyLogPromptProps = {
  hasLoggedToday: boolean;
  currentStreak: number;
  onPress: () => void;
};

export default function DailyLogPrompt({ hasLoggedToday, currentStreak, onPress }: DailyLogPromptProps) {
  const { colors: tc, isDark } = useThemeStore();

  if (hasLoggedToday) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { opacity: pressed ? 0.9 : 1 }]}>
        <View style={[styles.doneCard, { backgroundColor: tc.success + '15' }]}>
          <MaterialIcons name="check-circle" size={28} color={tc.success} />
          <View style={styles.doneText}>
            <Text style={[styles.doneTitle, { color: tc.success }]}>Today's log is done!</Text>
            {currentStreak > 1 && (
              <Text style={[styles.doneSubtitle, { color: tc.textSecondary }]}>
                {currentStreak} day streak - keep it going!
              </Text>
            )}
          </View>
          <MaterialIcons name="chevron-right" size={20} color={tc.textSecondary} />
        </View>
      </Pressable>
    );
  }

  const gradientColors = isDark
    ? ['#2A2520', '#1A1510'] as const
    : ['#FFF8E1', '#FFECB3'] as const;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promptCard}
      >
        <View style={styles.promptLeft}>
          <View style={styles.iconRow}>
            <MaterialIcons name="edit-note" size={28} color="#FF9800" />
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <MaterialIcons name="local-fire-department" size={14} color="#FF5722" />
                <Text style={styles.streakNum}>{currentStreak}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.promptTitle, { color: tc.textPrimary }]}>Write Today's Log</Text>
          <Text style={[styles.promptDesc, { color: tc.textSecondary }]}>
            Reflect on your day, track achievements & set tomorrow's goals
          </Text>
        </View>
        <MaterialIcons name="arrow-forward" size={24} color="#FF9800" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  promptLeft: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF572215',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  streakNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5722',
  },
  promptTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    marginBottom: 4,
  },
  promptDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  doneText: {
    flex: 1,
  },
  doneTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
  },
  doneSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
