import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../../src/components/common/Card';
import EmptyState from '../../src/components/common/EmptyState';
import FAB from '../../src/components/common/FAB';
import Sidebar from '../../src/components/common/Sidebar';
import Tag from '../../src/components/common/Tag';
import TodoItem from '../../src/components/todo/TodoItem';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type FilterStatus = 'all' | 'pending' | 'completed' | 'archived';

export default function TodosTab() {
  const router = useRouter();
  const { colors: tc, isDark } = useThemeStore();
  const { todos, lists, loadTodos, loadTodoLists, completeTodo, uncompleteTodo, updateTodo, isLoading } = useTodoStore();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleSelectedIds, setRescheduleSelectedIds] = useState<Set<number>>(new Set());
  const [pickDate, setPickDate] = useState(new Date());
  const [showPickDatePicker, setShowPickDatePicker] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const parseLocalDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return null;
    const [y, m, d] = dateValue.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const parsed = new Date(y, m - 1, d);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const overdueTodos = useMemo(() => {
    const todayLocal = parseLocalDate(todayStr) ?? new Date();
    return todos.filter(t => {
      if (t.status === 'completed' || t.status === 'archived') return false;
      if (t.is_recurring) return false;
      const start = parseLocalDate(t.start_date);
      if (!start) return false;
      const end = parseLocalDate(t.end_date) ?? start;
      return end.getTime() < todayLocal.getTime();
    });
  }, [todos, todayStr]);
  const overdueCount = overdueTodos.length;

  const openReschedule = () => {
    setRescheduleSelectedIds(new Set(overdueTodos.map(t => t.id)));
    setPickDate(parseLocalDate(todayStr) ?? new Date());
    setShowReschedule(true);
  };

  const toggleRescheduleSelected = (id: number) => {
    setRescheduleSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const computeWeekendDate = () => {
    const d = new Date();
    const day = d.getDay();
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const saturday = 6;
    const delta = (saturday - day + 7) % 7;
    target.setDate(target.getDate() + delta);
    return target;
  };

  const shiftTodoToDate = async (todoId: number, targetDateStr: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const start = parseLocalDate(todo.start_date);
    const end = parseLocalDate(todo.end_date);
    const target = parseLocalDate(targetDateStr);
    if (!target) return;

    if ((todo.date_type === 'range' || todo.date_type === 'week' || todo.date_type === 'month') && start) {
      const effectiveEnd = end ?? start;
      const durationDays = Math.max(0, Math.round((effectiveEnd.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
      const newStart = targetDateStr;
      const newEndDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      newEndDate.setDate(newEndDate.getDate() + durationDays);
      await updateTodo(todoId, { start_date: newStart, end_date: toDateStr(newEndDate) });
      return;
    }

    await updateTodo(todoId, { date_type: 'single', start_date: targetDateStr, end_date: undefined });
  };

  const applyReschedule = async (mode: 'today' | 'tomorrow' | 'weekend' | 'pick') => {
    if (rescheduleSelectedIds.size === 0) return;
    setIsRescheduling(true);
    try {
      const base = mode === 'today' ? parseLocalDate(todayStr) ?? new Date()
        : mode === 'tomorrow' ? (() => { const d = parseLocalDate(todayStr) ?? new Date(); d.setDate(d.getDate() + 1); return d; })()
        : mode === 'weekend' ? computeWeekendDate()
        : pickDate;
      const target = toDateStr(base);

      const ids = Array.from(rescheduleSelectedIds);
      for (const id of ids) {
        await shiftTodoToDate(id, target);
      }
      setShowReschedule(false);
      loadWithFilter();
    } finally {
      setIsRescheduling(false);
    }
  };

  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    const q = searchQuery.toLowerCase();
    return todos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  }, [todos, searchQuery]);

  const orderedTodos = useMemo(() => {
    if (filteredTodos.length <= 1) return filteredTodos;
    const pending: typeof filteredTodos = [];
    const completed: typeof filteredTodos = [];
    const archived: typeof filteredTodos = [];

    filteredTodos.forEach((todo) => {
      if (todo.status === 'completed') {
        completed.push(todo);
      } else if (todo.status === 'archived') {
        archived.push(todo);
      } else {
        pending.push(todo);
      }
    });

    return [...pending, ...completed, ...archived];
  }, [filteredTodos]);

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

  useEffect(() => {
    loadTodoLists();
  }, [loadTodoLists]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return tc.danger;
      case 'high': return tc.warning;
      case 'medium': return tc.warning;
      case 'low': return tc.success;
      default: return tc.primary;
    }
  };

  const listNameById = useMemo(() => {
    const map = new Map<number, string>();
    lists.forEach((list) => map.set(list.id, list.name));
    return map;
  }, [lists]);

  const getTagAppearance = (label?: string) => {
    if (!label) return 'default';
    const tag = label.toLowerCase();
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

      <View style={styles.filterBar}>
        {filters.map((f) => (
          <Tag
            key={f.value}
            label={f.label}
            variant="chip"
            selected={activeFilter === f.value}
            onPress={() => setActiveFilter(f.value)}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadWithFilter} />
        }
      >
        {overdueCount > 0 && (
          <Card style={styles.overdueBanner} withShadow={false} withMargin={false} onPress={openReschedule}>
            <View style={styles.overdueLeft}>
              <View style={[styles.overdueIcon, { backgroundColor: tc.danger + '15' }]}>
                <MaterialIcons name="error-outline" size={20} color={tc.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.overdueTitle, { color: tc.textPrimary }]}>{overdueCount} overdue task{overdueCount === 1 ? '' : 's'}</Text>
                <Text style={[styles.overdueSub, { color: tc.textSecondary }]}>Move them to Today, Tomorrow, Weekend, or pick a date</Text>
              </View>
            </View>
            <Tag label="Reschedule" variant="chip" selected onPress={openReschedule} />
          </Card>
        )}
        {orderedTodos.length === 0 ? (
          <EmptyState
            icon={searchQuery ? 'search-off' : 'inbox'}
            title={
              searchQuery
                ? 'No results'
                : activeFilter === 'all'
                  ? 'No tasks yet'
                  : `No ${activeFilter} tasks`
            }
            message={
              searchQuery
                ? `Nothing matches "${searchQuery}". Try a different keyword.`
                : activeFilter === 'all'
                  ? 'Create a task to start planning your day.'
                  : 'Switch filters to see other tasks.'
            }
            ctaLabel={
              searchQuery
                ? 'Clear search'
                : activeFilter === 'all'
                  ? 'Create task'
                  : 'Show all'
            }
            onCtaPress={() => {
              if (searchQuery) setSearchQuery('');
              else if (activeFilter === 'all') router.push('/todo/create');
              else setActiveFilter('all');
            }}
          />
        ) : (
          orderedTodos.map((todo) => {
            const categoryLabel = (todo.list_id ? listNameById.get(todo.list_id) : undefined) || todo.tags?.[0] || 'Task';
            return (
              <TodoItem
                key={todo.id}
                title={todo.title}
                tagLabel={categoryLabel}
                tagAppearance={getTagAppearance(categoryLabel)}
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
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/todo/create')} />
      <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />

      <Modal visible={showReschedule} transparent animationType="fade" onRequestClose={() => setShowReschedule(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowReschedule(false)}>
          <Card style={[styles.rescheduleModal, { backgroundColor: tc.cardBackground }]} withShadow={false} withMargin={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>Reschedule Overdue</Text>
              <Pressable onPress={() => setShowReschedule(false)} hitSlop={10}>
                <MaterialIcons name="close" size={22} color={tc.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: tc.textSecondary }]}>
              Selected {rescheduleSelectedIds.size} of {overdueTodos.length}
            </Text>

            <View style={styles.modalActionsRow}>
              <Tag label={isRescheduling ? 'Moving…' : 'Today'} variant="chip" onPress={() => applyReschedule('today')} />
              <Tag label="Tomorrow" variant="chip" onPress={() => applyReschedule('tomorrow')} />
              <Tag label="Weekend" variant="chip" onPress={() => applyReschedule('weekend')} />
              <Tag
                label={`Pick (${toDateStr(pickDate)})`}
                variant="chip"
                onPress={() => {
                  if (Platform.OS === 'web') return;
                  setShowPickDatePicker(true);
                }}
              />
            </View>

            {Platform.OS === 'web' && (
              <View style={styles.webPickRow}>
                <Text style={[styles.webPickLabel, { color: tc.textSecondary }]}>Pick date</Text>
                <input
                  type="date"
                  value={toDateStr(pickDate)}
                  onChange={(e: any) => setPickDate(parseLocalDate(e.target.value) ?? new Date())}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: tc.textPrimary,
                    backgroundColor: tc.background,
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  } as any}
                />
                <Tag label="Move" variant="chip" selected onPress={() => applyReschedule('pick')} />
              </View>
            )}

            <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 6 }}>
              {overdueTodos.map((t) => {
                const selected = rescheduleSelectedIds.has(t.id);
                return (
                  <Pressable
                    key={`ov-${t.id}`}
                    onPress={() => toggleRescheduleSelected(t.id)}
                    style={({ pressed }) => [
                      styles.modalRow,
                      { backgroundColor: pressed ? tc.border + '30' : 'transparent' },
                    ]}
                  >
                    <View style={[styles.selectBox, { borderColor: selected ? tc.primary : tc.border, backgroundColor: selected ? tc.primary : 'transparent' }]}>
                      {selected && <MaterialIcons name="check" size={16} color="#FFF" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalRowTitle, { color: tc.textPrimary }]} numberOfLines={1}>{t.title}</Text>
                      <Text style={[styles.modalRowMeta, { color: tc.textSecondary }]} numberOfLines={1}>
                        {t.start_date || 'No date'}{t.end_date ? ` → ${t.end_date}` : ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>
        </Pressable>
      </Modal>

      {Platform.OS !== 'web' && showPickDatePicker && (
        <DateTimePicker
          value={pickDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant={isDark ? 'dark' : 'light'}
          onChange={(event: any, selectedDate?: Date) => {
            if (Platform.OS === 'android') setShowPickDatePicker(false);
            if (selectedDate) setPickDate(selectedDate);
          }}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    alignItems: 'center',
  },
  overdueBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  overdueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  overdueIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  overdueSub: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  rescheduleModal: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    marginBottom: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  webPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  webPickLabel: {
    fontSize: typography.sizes.xs,
    width: 64,
  },
  modalList: {
    maxHeight: 320,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  selectBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
  modalRowMeta: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
