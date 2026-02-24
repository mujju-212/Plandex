import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { typography } from '../../src/theme/typography';

type KanbanColumn = 'pending' | 'in_progress' | 'completed';

const COLUMNS: { key: KanbanColumn; label: string; icon: string; color: string }[] = [
  { key: 'pending', label: 'To Do', icon: 'radio-button-unchecked', color: '#6366F1' },
  { key: 'in_progress', label: 'In Progress', icon: 'timelapse', color: '#F59E0B' },
  { key: 'completed', label: 'Done', icon: 'check-circle', color: '#10B981' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = Math.max(SCREEN_WIDTH * 0.75, 260);

export default function KanbanScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { todos, loadTodos, completeTodo, uncompleteTodo, updateTodo } = useTodoStore();

  useEffect(() => { loadTodos({ exclude_archived: true }); }, []);

  const columns = useMemo(() => {
    const pending = todos.filter(t => t.status === 'pending' && !t.tags?.includes('in_progress'));
    const inProgress = todos.filter(t => t.tags?.includes('in_progress') && t.status !== 'completed');
    const completed = todos.filter(t => t.status === 'completed');
    return { pending, in_progress: inProgress, completed };
  }, [todos]);

  const moveToColumn = async (todoId: number, targetColumn: KanbanColumn) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    try {
      if (targetColumn === 'completed') {
        await completeTodo(todoId);
      } else if (targetColumn === 'in_progress') {
        if (todo.status === 'completed') await uncompleteTodo(todoId);
        const existingTags = (todo.tags || []).filter(t => t !== 'in_progress');
        await updateTodo(todoId, { tags: [...existingTags, 'in_progress'] });
      } else {
        // Move back to pending
        if (todo.status === 'completed') await uncompleteTodo(todoId);
        const existingTags = (todo.tags || []).filter(t => t !== 'in_progress');
        await updateTodo(todoId, { tags: existingTags });
      }
      await loadTodos({ exclude_archived: true });
    } catch { }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return tc.primary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Kanban Board</Text>
        <TouchableOpacity onPress={() => router.push('/todo/create')} style={[styles.addBtn, { backgroundColor: tc.primary }]}>
          <MaterialIcons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {COLUMNS.map(col => (
          <View key={col.key} style={[styles.statBadge, { backgroundColor: col.color + '20' }]}>
            <MaterialIcons name={col.icon as any} size={14} color={col.color} />
            <Text style={[styles.statText, { color: col.color }]}>
              {columns[col.key].length}
            </Text>
          </View>
        ))}
      </View>

      {/* Kanban Columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.columnsContainer} pagingEnabled={false}>
        {COLUMNS.map(col => (
          <View key={col.key} style={[styles.column, { backgroundColor: tc.cardBackground + '80' }]}>
            {/* Column Header */}
            <View style={[styles.columnHeader, { borderBottomColor: col.color }]}>
              <View style={styles.columnHeaderLeft}>
                <MaterialIcons name={col.icon as any} size={18} color={col.color} />
                <Text style={[styles.columnTitle, { color: tc.textPrimary }]}>{col.label}</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: col.color + '20' }]}>
                <Text style={[styles.countText, { color: col.color }]}>{columns[col.key].length}</Text>
              </View>
            </View>

            {/* Column Items */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
              {columns[col.key].length === 0 ? (
                <View style={styles.emptyColumn}>
                  <MaterialIcons name="inbox" size={32} color={tc.border} />
                  <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No items</Text>
                </View>
              ) : (
                columns[col.key].map(todo => (
                  <View key={todo.id} style={[styles.card, { backgroundColor: tc.cardBackground }]}>
                    {/* Priority stripe */}
                    <View style={[styles.priorityStripe, { backgroundColor: getPriorityColor(todo.priority) }]} />
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, { color: tc.textPrimary }]} numberOfLines={2}>
                        {todo.title}
                      </Text>
                      {todo.description && (
                        <Text style={[styles.cardDesc, { color: tc.textSecondary }]} numberOfLines={2}>
                          {todo.description}
                        </Text>
                      )}
                      {/* Tags */}
                      {todo.tags && todo.tags.filter(t => t !== 'in_progress').length > 0 && (
                        <View style={styles.tagRow}>
                          {todo.tags.filter(t => t !== 'in_progress').slice(0, 2).map(tag => (
                            <View key={tag} style={[styles.tag, { backgroundColor: tc.primary + '15' }]}>
                              <Text style={[styles.tagText, { color: tc.primary }]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {/* Move Arrows */}
                      <View style={styles.moveRow}>
                        {col.key !== 'pending' && (
                          <TouchableOpacity
                            style={[styles.moveBtn, { backgroundColor: tc.background }]}
                            onPress={() => {
                              const prev = col.key === 'completed' ? 'in_progress' : 'pending';
                              moveToColumn(todo.id, prev);
                            }}
                          >
                            <MaterialIcons name="chevron-left" size={18} color={tc.textSecondary} />
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        {col.key !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.moveBtn, { backgroundColor: tc.background }]}
                            onPress={() => {
                              const next = col.key === 'pending' ? 'in_progress' : 'completed';
                              moveToColumn(todo.id, next);
                            }}
                          >
                            <MaterialIcons name="chevron-right" size={18} color={tc.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 30, paddingBottom: 8,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 20 },
  statBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any },
  columnsContainer: { paddingHorizontal: 12, paddingTop: 8, gap: 12 },
  column: { width: COLUMN_WIDTH, borderRadius: 16, padding: 12, flex: 1 },
  columnHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 10, marginBottom: 10, borderBottomWidth: 2,
  },
  columnHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  columnTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  countBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any },
  columnScroll: { flex: 1 },
  card: {
    borderRadius: 12, marginBottom: 10, overflow: 'hidden',
    flexDirection: 'row',
  },
  priorityStripe: { width: 4 },
  cardContent: { flex: 1, padding: 12 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  cardDesc: { fontSize: typography.sizes.xs, marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '600' as any },
  moveRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
  },
  moveBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyColumn: { alignItems: 'center', paddingTop: 40 },
  emptyText: { marginTop: 8, fontSize: typography.sizes.sm },
});
