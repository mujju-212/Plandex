import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { shadows } from '../../theme/shadows';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  gradient?: boolean;
  withShadow?: boolean;
  withMargin?: boolean;
};

export default function Card({ children, style, onPress, gradient = false, withShadow = true, withMargin = true }: CardProps) {
  const { colors: tc, isDark } = useThemeStore();

  const content = (
    <View style={[styles.card, { backgroundColor: gradient ? 'transparent' : tc.cardBackground }, style]}>
      {children}
    </View>
  );

  const gradientColors = isDark
    ? [tc.cardBackground, '#1E1E1E'] as const
    : ['#FFFFFF', '#E8F2FA'] as const;

  const wrappedContent = gradient ? (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientWrapper, style]}
    >
      {content}
    </LinearGradient>
  ) : (
    content
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          withMargin && styles.spaced,
          withShadow && shadows.sm,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
      >
        {wrappedContent}
      </Pressable>
    );
  }

  return <View style={[styles.container, withMargin && styles.spaced, withShadow && shadows.sm, gradient && style]}>{wrappedContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
  },
  spaced: {
    marginVertical: 8,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientWrapper: {
    borderRadius: 16,
  }
});
