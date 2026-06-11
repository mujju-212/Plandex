import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

type EmptyStateProps = {
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: 'full' | 'compact';
  iconSize?: number;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export default function EmptyState({ icon = 'inbox', variant = 'full', iconSize = 56, title, message, ctaLabel, onCtaPress }: EmptyStateProps) {
  const tc = useThemeStore().colors;
  const showCta = Boolean(ctaLabel && onCtaPress);

  return (
    <View style={[styles.container, variant === 'compact' && styles.containerCompact]}>
      <MaterialIcons name={icon} size={iconSize} color={tc.border} />
      <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: tc.textSecondary }]}>{message}</Text>
      ) : null}
      {showCta ? (
        <Pressable
          onPress={onCtaPress}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: tc.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 24,
  },
  containerCompact: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    marginTop: 14,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaText: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
});
