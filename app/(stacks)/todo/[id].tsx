import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { useTodoStore } from '../../../src/stores/useTodoStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { Todo } from '../../../src/types/todo.types';

export default function TodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { todos, completeTodo, deleteTodo } = useTodoStore();
  const [todo, setTodo] = useState<Todo | null>(null);

  useEffect(() => {
    if (id) {
      const found = todos.find(t => t.id === Number(id));
      setTodo(found || null);
    }
  }, [id, todos]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return tc.danger;
      case 'high': return tc.warning;
      case 'medium': return tc.warning;
      case 'low': return tc.success;
      default: return tc.primary;
    }
  };

  const getRecurringSummary = (item: Todo) => {
    if (!item.is_recurring) return 'No';

    const base = item.recurring_type ? item.recurring_type : 'yes';
    const interval = item.recurring_interval ? `every ${item.recurring_interval}` : null;
    const end = item.recurring_end_date ? `until ${item.recurring_end_date}` : null;

    return [base, interval, end].filter(Boolean).join(' · ');
  };

  if (!todo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={tc.border} />
          <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Todo not found</Text>
          <Pressable style={[styles.backBtn, { backgroundColor: tc.primary }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Task Detail</Text>
        <Pressable onPress={() => router.push(`/todo/edit?id=${todo.id}`)} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="edit" size={22} color={tc.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusBadge, { backgroundColor: todo.status === 'completed' ? tc.success + '20' : tc.primary + '20' }]}>
          <MaterialIcons
            name={todo.status === 'completed' ? 'check-circle' : 'pending-actions'}
            size={16}
            color={todo.status === 'completed' ? tc.success : tc.primary}
          />
          <Text style={[styles.statusText, { color: todo.status === 'completed' ? tc.success : tc.primary }]}>
            {todo.status.charAt(0).toUpperCase() + todo.status.slice(1)}
          </Text>
        </View>

        <Text style={[styles.title, { color: tc.textPrimary }, todo.status === 'completed' && { textDecorationLine: 'line-through' as const, color: tc.textSecondary }]}>{todo.title}</Text>

        {todo.description && (
          <Text style={[styles.description, { color: tc.textSecondary }]}>{todo.description}</Text>
        )}

        <View style={styles.metaGrid}>
          <View style={[styles.metaCard, { backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="flag" size={18} color={getPriorityColor(todo.priority)} />
            <Text style={[styles.metaLabel, { color: tc.textSecondary }]}>Priority</Text>
            <Text style={[styles.metaValue, { color: tc.textPrimary }]}>{todo.priority}</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="schedule" size={18} color={tc.primary} />
            <Text style={[styles.metaLabel, { color: tc.textSecondary }]}>Due Time</Text>
            <Text style={[styles.metaValue, { color: tc.textPrimary }]}>{todo.due_time || 'None'}</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="date-range" size={18} color={tc.primary} />
            <Text style={[styles.metaLabel, { color: tc.textSecondary }]}>Date</Text>
            <Text style={[styles.metaValue, { color: tc.textPrimary }]}>{todo.start_date || 'None'}</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="repeat" size={18} color={tc.primary} />
            <Text style={[styles.metaLabel, { color: tc.textSecondary }]}>Recurring</Text>
            <Text style={[styles.metaValue, { color: tc.textPrimary }]}>{getRecurringSummary(todo)}</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="notifications" size={18} color={tc.primary} />
            <Text style={[styles.metaLabel, { color: tc.textSecondary }]}>Reminder</Text>
            <Text style={[styles.metaValue, { color: tc.textPrimary }]}>{todo.reminder_enabled ? 'On' : 'Off'}</Text>
          </View>
        </View>

        {todo.tags && todo.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {todo.tags.map((tag, i) => (
                <View key={i} style={[styles.tagChip, { backgroundColor: tc.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: tc.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {todo.status !== 'completed' && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: tc.success }]}
              onPress={async () => {
                await completeTodo(todo.id);
                router.back();
              }}
            >
              <MaterialIcons name="check" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Complete</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionBtn, { backgroundColor: tc.danger }]}
            onPress={async () => {
              await deleteTodo(todo.id);
              router.back();
            }}
          >
            <MaterialIcons name="delete" size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  emptyText: { marginTop: 12, fontSize: typography.sizes.md, color: colors.textSecondary },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 20 },
  backBtnText: { color: '#FFF', fontWeight: '600' as const },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.cardBackground },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  scrollContent: { padding: 20 },
  statusBadge: { flexDirection: 'row', alignSelf: 'flex-start' as const, alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  statusText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any, color: colors.textPrimary, marginBottom: 8 },
  description: { fontSize: typography.sizes.md, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  metaCard: { width: '47%' as any, backgroundColor: colors.cardBackground, borderRadius: 14, padding: 14, alignItems: 'center' as const, gap: 4 },
  metaLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  metaValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary, textTransform: 'capitalize' as const },
  tagsContainer: { marginBottom: 20 },
  sectionLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { backgroundColor: colors.primary + '20', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium as any },
  actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
});
