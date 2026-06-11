import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function SectionHeader({ title, subtitle, actionLabel, onActionPress }: SectionHeaderProps) {
  const tc = useThemeStore().colors;
  const showAction = Boolean(actionLabel && onActionPress);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: tc.textSecondary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tc.textPrimary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showAction ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: tc.cardBackground, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.actionText, { color: tc.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold as any,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
});
