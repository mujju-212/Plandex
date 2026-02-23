import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import Card from '../common/Card';
import Tag, { TagAppearance } from '../common/Tag';

type TodoItemProps = {
  title: string;
  tagLabel: string;
  tagAppearance: TagAppearance;
  time: string;
  isCompleted?: boolean;
  priorityColor?: string;
  onToggle?: () => void;
  onPress?: () => void;
};

export default function TodoItem({
  title,
  tagLabel,
  tagAppearance,
  time,
  isCompleted = false,
  priorityColor = colors.danger,
  onToggle,
  onPress,
}: TodoItemProps) {
  const tc = useThemeStore().colors;
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.container}>
        <Pressable onPress={onToggle} style={styles.checkboxContainer}>
          <MaterialIcons
            name={isCompleted ? "check-box" : "check-box-outline-blank"}
            size={24}
            color={isCompleted ? tc.primary : tc.textSecondary}
          />
        </Pressable>

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: tc.textPrimary }, isCompleted && { textDecorationLine: 'line-through', color: tc.textSecondary }]} numberOfLines={2}>
              {title}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Tag label={tagLabel} appearance={tagAppearance} />
            <View style={styles.rightContainer}>
              <Text style={[styles.time, { color: tc.textSecondary }]}>{time}</Text>
              <View style={[styles.dot, { backgroundColor: priorityColor }]} />
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    marginBottom: 6,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  }
});
