import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type GreetingHeaderProps = {
  name?: string;
  unreadCount?: number;
  level?: number;
  levelTitle?: string;
  totalXP?: number;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
};

function getGreetingText(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function GreetingHeader({
  name = 'User',
  unreadCount = 0,
  level = 1,
  levelTitle = 'Beginner',
  totalXP = 0,
  onSearchPress,
  onNotificationPress,
  onMenuPress,
}: GreetingHeaderProps) {
  const tc = useThemeStore().colors;
  const today = format(new Date(), 'EEEE, MMMM d');
  const greeting = getGreetingText();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={[styles.appName, { color: tc.primary }]}>Plandex</Text>
          <View style={[styles.levelBadge, { backgroundColor: tc.primary + '18' }]}>
            <MaterialIcons name="star" size={14} color={tc.primary} />
            <Text style={[styles.levelText, { color: tc.primary }]}>Lv.{level}</Text>
          </View>
        </View>
        <Text style={[styles.greeting, { color: tc.textPrimary }]}>{greeting}, {name}</Text>
        <Text style={[styles.date, { color: tc.textSecondary }]}>{today}</Text>
        <View style={styles.xpRow}>
          <MaterialIcons name="bolt" size={14} color={tc.warning} />
          <Text style={[styles.xpText, { color: tc.textSecondary }]}>{totalXP} XP · {levelTitle}</Text>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <Pressable onPress={onMenuPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: tc.cardBackground, opacity: pressed ? 0.6 : 1, cursor: 'pointer' as any }]}>
          <MaterialIcons name="menu" size={24} color={tc.textPrimary} />
        </Pressable>
        <Pressable onPress={onNotificationPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: tc.cardBackground, opacity: pressed ? 0.6 : 1, cursor: 'pointer' as any }]}>
          <MaterialIcons name="notifications-none" size={24} color={tc.textPrimary} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { borderColor: tc.background }]} pointerEvents="none">
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onSearchPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: tc.cardBackground, opacity: pressed ? 0.6 : 1, cursor: 'pointer' as any }]}>
          <MaterialIcons name="search" size={24} color={tc.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  appName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: typography.weights.bold as any,
  },
  greeting: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold as any,
    marginBottom: 4,
  },
  date: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  xpText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  iconButton: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: typography.weights.bold as any,
  },
});
