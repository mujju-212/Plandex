import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';

export type TagAppearance = 'work' | 'personal' | 'health' | 'default';
export type TagVariant = 'category' | 'chip';

type TagProps = {
  label: string;
  appearance?: TagAppearance;
  variant?: TagVariant;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function Tag({
  label,
  appearance = 'default',
  variant = 'category',
  selected = false,
  onPress,
  style,
  textStyle,
}: TagProps) {
  const tc = useThemeStore().colors;

  let backgroundColor = tc.border;
  let borderColor = 'transparent';
  let textColor = tc.textSecondary;

  if (variant === 'chip') {
    backgroundColor = selected ? tc.primary : tc.cardBackground;
    borderColor = selected ? tc.primary : tc.border;
    textColor = selected ? '#FFFFFF' : tc.textSecondary;
  } else {
    switch (appearance) {
      case 'work':
        backgroundColor = tc.primary;
        textColor = '#FFFFFF';
        break;
      case 'personal':
        backgroundColor = tc.success;
        textColor = '#FFFFFF';
        break;
      case 'health':
        backgroundColor = tc.warning;
        textColor = '#FFFFFF';
        break;
      default:
        backgroundColor = tc.border;
        textColor = tc.textSecondary;
        break;
    }
  }

  const Container = onPress ? Pressable : View;

  return (
    <Container
      style={[
        styles.container,
        variant === 'chip' ? styles.chip : styles.category,
        { backgroundColor, borderColor },
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  category: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    fontWeight: typography.weights.medium as any,
    includeFontPadding: false,
  }
});
