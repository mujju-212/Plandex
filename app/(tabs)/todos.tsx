import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FAB from '../../src/components/common/FAB';
import Sidebar from '../../src/components/common/Sidebar';
import TodoItem from '../../src/components/todo/TodoItem';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type FilterStatus = 'all' | 'pending' | 'completed' | 'archived';

export default function TodosTab() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { todos, loadTodos, completeTodo, uncompleteTodo, isLoading } = useTodoStore();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const q = searchQuery.toLowerCase();
    return todos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }, [todos, searchQuery]);

  const loadWithFilter = useCallback(async () => {
    if (activeFilter === 'all') {
      await loadTodos({ exclude_archived: true });
    } else {
      await loadTodos({ status: activeFilter });
    }
  }, [activeFilter, loadTodos]);

  useEffect(() => {
    loadWithFilter();
  }, [loadWithFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return tc.danger;
      case 'high': return tc.warning;
      case 'medium': return tc.warning;
      case 'low': return tc.success;
      default: return tc.primary;
    }
  };

  const getTagAppearance = (tags: string[]) => {
    if (!tags || tags.length === 0) return 'default';
    const tag = tags[0].toLowerCase();
    if (['work', 'job', 'office'].includes(tag)) return 'work';
    if (['health', 'gym', 'workout'].includes(tag)) return 'health';
    if (['personal', 'home'].includes(tag)) return 'personal';
    return 'default';
  };

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
  ];

  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const completedCount = todos.filter(t => t.status === 'completed').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>My Todos</Text>
        <View style={styles.headerStats}>
          <Pressable onPress={() => setShowSidebar(true)} style={({ pressed }) => [styles.statBadge, { backgroundColor: tc.cardBackground, opacity: pressed ? 0.6 : 1, cursor: 'pointer' as any }]}>
            <MaterialIcons name="menu" size={20} color={tc.textPrimary} />
          </Pressable>
          <View style={[styles.statBadge, { marginLeft: 8, backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="pending-actions" size={14} color={tc.warning} />
            <Text style={[styles.statText, { color: tc.textPrimary }]}>{pendingCount}</Text>
          </View>
          <View style={[styles.statBadge, { marginLeft: 8, backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="check-circle" size={14} color={tc.success} />
            <Text style={[styles.statText, { color: tc.textPrimary }]}>{completedCount}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: tc.cardBackground }]}>
        <MaterialIcons name="search" size={20} color={tc.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search tasks..."
          placeholderTextColor={tc.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={18} color={tc.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, activeFilter === f.value && { backgroundColor: tc.primary, borderColor: tc.primary }]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[styles.filterChipText, { color: tc.textSecondary }, activeFilter === f.value && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadWithFilter} />
        }
      >
        {filteredTodos.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name={searchQuery ? 'search-off' : 'inbox'} size={64} color={tc.border} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
              {searchQuery
                ? `No tasks matching "${searchQuery}"`
                : activeFilter === 'all' ? 'No tasks yet. Tap + to create one!' : `No ${activeFilter} tasks.`}
            </Text>
          </View>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              title={todo.title}
              tagLabel={todo.tags?.[0] || 'Task'}
              tagAppearance={getTagAppearance(todo.tags)}
              time={todo.due_time || 'No Time'}
              priorityColor={getPriorityColor(todo.priority)}
              isCompleted={todo.status === 'completed'}
              onPress={() => router.push(`/todo/${todo.id}`)}
              onToggle={() => {
                if (todo.status === 'completed') {
                  uncompleteTodo(todo.id);
                } else {
                  completeTodo(todo.id);
                }
              }}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/todo/create')} />
      <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.textPrimary,
  },
  headerStats: {
    flexDirection: 'row',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    padding: 0,
  },
  filterBar: {
    maxHeight: 48,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium as any,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
