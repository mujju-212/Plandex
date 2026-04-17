import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import FAB from '../../src/components/common/FAB';
import Sidebar from '../../src/components/common/Sidebar';
import ActiveGoals from '../../src/components/dashboard/ActiveGoals';
import DailyLogPrompt from '../../src/components/dashboard/DailyLogPrompt';
import GreetingHeader from '../../src/components/dashboard/GreetingHeader';
import QuickActions from '../../src/components/dashboard/QuickActions';
import TodayHabits from '../../src/components/dashboard/TodayHabits';
import TodaySummary from '../../src/components/dashboard/TodaySummary';
import UpcomingEvents from '../../src/components/dashboard/UpcomingEvents';
import TodoItem from '../../src/components/todo/TodoItem';
import { cancelDailyLogReminder, scheduleDailyLogReminder } from '../../src/services/notificationService';
import { useEventStore } from '../../src/stores/useEventStore';
import { useGamificationStore } from '../../src/stores/useGamificationStore';
import { useGoalStore } from '../../src/stores/useGoalStore';
import { useHabitStore } from '../../src/stores/useHabitStore';
import { useLogStore } from '../../src/stores/useLogStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { typography } from '../../src/theme/typography';

export default function HomeTab() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userName, setUserName] = useState('User');

  // Stores
  const { todos, loadTodos, completeTodo, uncompleteTodo } = useTodoStore();
  const { habits, todayCompletions, loadHabits, loadTodayCompletions, toggleCompletion } = useHabitStore();
  const { events, loadEvents } = useEventStore();
  const { goals, loadGoals } = useGoalStore();
  const { logs, loadRecentLogs } = useLogStore();
  const { totalXP, currentLevel, levelTitle, currentStreak, loadStats } = useGamificationStore();

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadDashboard = async () => {
        const [name] = await Promise.all([
          AsyncStorage.getItem('profile_name'),
          loadTodos(),
          loadHabits(),
          loadTodayCompletions(),
          loadEvents(),
          loadGoals(),
          loadRecentLogs(7),
          loadStats(),
        ]);

        if (active && name) {
          setUserName(name);
        }
      };

      loadDashboard();

      return () => {
        active = false;
      };
    }, [loadEvents, loadGoals, loadHabits, loadRecentLogs, loadStats, loadTodayCompletions, loadTodos])
  );

  // Computed values
  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const pendingTodos = useMemo(() => todos.filter(t => t.status !== 'completed'), [todos]);
  const pendingCount = pendingTodos.length;
  const completedCount = todos.length - pendingCount;
  const todaysTodos = useMemo(() => todos.slice(0, 5), [todos]); // Show up to 5 on dashboard

  const activeHabits = useMemo(() => habits.filter(h => h.is_active), [habits]);
  const todayCompletedHabitIds = useMemo(
    () => new Set(todayCompletions.filter(c => c.date === today).map(c => c.habit_id)),
    [today, todayCompletions]
  );
  const habitsCompletedCount = useMemo(
    () => activeHabits.filter(h => todayCompletedHabitIds.has(h.id)).length,
    [activeHabits, todayCompletedHabitIds]
  );

  const todayEvents = useMemo(() => events.filter(e => {
    try { return e.start_datetime.startsWith(today) && e.status !== 'cancelled'; }
    catch { return false; }
  }), [events, today]);

  const activeGoals = useMemo(
    () => goals.filter(g => g.status === 'in_progress' || g.status === 'not_started'),
    [goals]
  );

  const hasLoggedToday = useMemo(() => logs.some(l => {
    if (l.date !== today) return false;
    // Only count as "done" if user actually wrote something
    return !!(l.what_i_did || l.achievements || l.learnings || l.challenges || l.tomorrow_intention || l.gratitude || l.overall_rating);
  }), [logs, today]);

  // Cancel or reschedule the 10:30 PM daily-log reminder based on whether user logged today
  useEffect(() => {
    if (hasLoggedToday) {
      cancelDailyLogReminder();
    } else {
      scheduleDailyLogReminder();
    }
  }, [hasLoggedToday]);

  const productivityScore = useMemo(
    () => (todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0),
    [completedCount, todos.length]
  );

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting with level & XP */}
        <GreetingHeader
          name={userName}
          unreadCount={pendingCount}
          level={currentLevel}
          levelTitle={levelTitle}
          totalXP={totalXP}
          onMenuPress={() => setShowSidebar(true)}
          onSearchPress={() => router.push('/search')}
          onNotificationPress={() => setShowNotifications(true)}
        />

        {/* Stats Summary Cards (horizontal scroll) */}
        <TodaySummary
          todosCompleted={completedCount}
          todosTotal={todos.length}
          habitsCompleted={habitsCompletedCount}
          habitsTotal={activeHabits.length}
          streakDays={currentStreak}
          eventsToday={todayEvents.length}
          activeGoals={activeGoals.length}
          productivityScore={productivityScore}
        />

        {/* Quick Create Buttons */}
        <QuickActions
          onCreateEvent={() => router.push('/event/create')}
          onCreateLog={() => router.push(`/log/daily/${today}`)}
          onCreateHabit={() => router.push('/habit/create')}
          onCreateGoal={() => router.push('/goal/create')}
        />

        {/* Daily Log Prompt */}
        <DailyLogPrompt
          hasLoggedToday={hasLoggedToday}
          currentStreak={currentStreak}
          onPress={() => router.push(`/log/daily/${today}`)}
        />

        {/* Upcoming Events */}
        <UpcomingEvents
          events={events}
          onEventPress={(id) => router.push(`/event/${id}`)}
          onViewAll={() => router.push('/(tabs)/calendar')}
        />

        {/* Today's Todos */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <MaterialIcons name="check-box" size={20} color={tc.primary} />
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Today's Todos</Text>
            {pendingCount > 0 && (
              <View style={[styles.todoBadge, { backgroundColor: tc.danger + '20' }]}>
                <Text style={[styles.todoBadgeText, { color: tc.danger }]}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => router.push('/(tabs)/todos')} hitSlop={8}>
            <Text style={[styles.viewAllLink, { color: tc.primary }]}>View All</Text>
          </Pressable>
        </View>

        {todos.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: tc.cardBackground }]}>
            <MaterialIcons name="task-alt" size={40} color={tc.border} />
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>No tasks yet</Text>
            <Pressable onPress={() => router.push('/todo/create')} style={[styles.emptyBtn, { backgroundColor: tc.primary }]}>
              <Text style={styles.emptyBtnText}>Create your first todo</Text>
            </Pressable>
          </View>
        ) : (
          todaysTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              title={todo.title}
              tagLabel={todo.tags?.[0] || 'Task'}
              tagAppearance={getTagAppearance(todo.tags)}
              time={todo.due_time || 'No Time'}
              priorityColor={getPriorityColor(todo.priority)}
              isCompleted={todo.status === 'completed'}
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

        {todos.length > 5 && (
          <Pressable onPress={() => router.push('/(tabs)/todos')} style={[styles.showMoreBtn, { backgroundColor: tc.primary + '10' }]}>
            <Text style={[styles.showMoreText, { color: tc.primary }]}>Show all {todos.length} todos</Text>
            <MaterialIcons name="arrow-forward" size={16} color={tc.primary} />
          </Pressable>
        )}

        {/* Today's Habits */}
        <TodayHabits
          habits={habits}
          completions={todayCompletions}
          onToggle={(habitId, date) => toggleCompletion(habitId, date)}
          onViewAll={() => router.push('/habit')}
        />

        {/* Active Goals */}
        <ActiveGoals
          goals={goals}
          onGoalPress={(id) => router.push(`/goal/${id}`)}
          onViewAll={() => router.push('/goal')}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => setShowCreateMenu(true)} />

      {/* Notifications Panel */}
      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
          <View style={[styles.notifPanel, { backgroundColor: tc.cardBackground }]} onStartShouldSetResponder={() => true}>
            <View style={styles.notifHeader}>
              <View style={styles.notifTitleRow}>
                <MaterialIcons name="notifications" size={22} color={tc.primary} />
                <Text style={[styles.notifTitle, { color: tc.textPrimary }]}>Notifications</Text>
              </View>
              <Pressable onPress={() => setShowNotifications(false)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, cursor: 'pointer' as any })}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              {pendingTodos.length === 0 ? (
                <View style={styles.notifEmpty}>
                  <MaterialIcons name="check-circle" size={48} color={tc.success} />
                  <Text style={[styles.notifEmptyText, { color: tc.textSecondary }]}>All caught up! No pending tasks.</Text>
                </View>
              ) : (
                pendingTodos.map(todo => (
                  <Pressable
                    key={todo.id}
                    style={({ pressed }) => [styles.notifItem, { backgroundColor: pressed ? tc.border + '30' : 'transparent' }]}
                    onPress={() => { setShowNotifications(false); router.push(`/todo/${todo.id}`); }}
                  >
                    <View style={[styles.notifDot, { backgroundColor: getPriorityColor(todo.priority) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifItemTitle, { color: tc.textPrimary }]}>{todo.title}</Text>
                      <Text style={[styles.notifItemMeta, { color: tc.textSecondary }]}>
                        {todo.due_time || 'No time set'} · {todo.priority} priority
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={tc.textSecondary} />
                  </Pressable>
                ))
              )}
            </ScrollView>

            <View style={[styles.notifFooter, { borderTopColor: tc.border }]}>
              <Text style={[styles.notifFooterText, { color: tc.textSecondary }]}>
                {pendingCount} pending · {completedCount} completed
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Create Chooser Modal */}
      <Modal visible={showCreateMenu} transparent animationType="fade" onRequestClose={() => setShowCreateMenu(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateMenu(false)}>
          <View style={[styles.createMenu, { backgroundColor: tc.cardBackground }]}>
            <Text style={[styles.createMenuTitle, { color: tc.textPrimary }]}>Create</Text>
            <Pressable style={styles.createOption} onPress={() => { setShowCreateMenu(false); router.push('/todo/create'); }}>
              <View style={[styles.createOptionIcon, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="check-box" size={24} color={tc.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.createOptionTitle, { color: tc.textPrimary }]}>New Todo</Text>
                <Text style={[styles.createOptionDesc, { color: tc.textSecondary }]}>Add a task with priority, date, and tags</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tc.textSecondary} />
            </Pressable>
            <Pressable style={styles.createOption} onPress={() => { setShowCreateMenu(false); router.push('/event/create'); }}>
              <View style={[styles.createOptionIcon, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="event" size={24} color={tc.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.createOptionTitle, { color: tc.textPrimary }]}>New Event</Text>
                <Text style={[styles.createOptionDesc, { color: tc.textSecondary }]}>Schedule with time, location, and category</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tc.textSecondary} />
            </Pressable>
            <Pressable style={styles.createOption} onPress={() => { setShowCreateMenu(false); router.push('/goal/create'); }}>
              <View style={[styles.createOptionIcon, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="flag" size={24} color={tc.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.createOptionTitle, { color: tc.textPrimary }]}>New Goal</Text>
                <Text style={[styles.createOptionDesc, { color: tc.textSecondary }]}>Set a goal with milestones and deadlines</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tc.textSecondary} />
            </Pressable>
            <Pressable style={styles.createOption} onPress={() => { setShowCreateMenu(false); router.push('/habit/create'); }}>
              <View style={[styles.createOptionIcon, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="loop" size={24} color={tc.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.createOptionTitle, { color: tc.textPrimary }]}>New Habit</Text>
                <Text style={[styles.createOptionDesc, { color: tc.textSecondary }]}>Build a daily habit with streak tracking</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tc.textSecondary} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Sidebar Drawer */}
      <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 20, marginBottom: 8 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  todoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  todoBadgeText: { fontSize: 11, fontWeight: typography.weights.bold as any },
  viewAllLink: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  emptyState: { marginHorizontal: 20, padding: 28, borderRadius: 16, alignItems: 'center' as const, gap: 10, marginTop: 4 },
  emptyTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#FFF', fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 8, padding: 12, borderRadius: 12, gap: 6 },
  showMoreText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: 32 },

  // Notification panel styles
  notifPanel: { borderRadius: 20, width: '100%' as any, maxWidth: 420, maxHeight: '70%' as any, overflow: 'hidden' as const },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  notifList: { paddingHorizontal: 12, maxHeight: 350 },
  notifEmpty: { alignItems: 'center' as const, paddingVertical: 40, gap: 12 },
  notifEmptyText: { fontSize: typography.sizes.md },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, gap: 12 },
  notifDot: { width: 10, height: 10, borderRadius: 5 },
  notifItemTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any },
  notifItemMeta: { fontSize: typography.sizes.xs, marginTop: 2 },
  notifFooter: { paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, alignItems: 'center' as const },
  notifFooterText: { fontSize: typography.sizes.xs },

  // Create menu styles
  createMenu: { borderRadius: 20, padding: 24, width: '100%' as any, maxWidth: 400 },
  createMenuTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any, marginBottom: 16 },
  createOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  createOptionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  createOptionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  createOptionDesc: { fontSize: typography.sizes.xs, marginTop: 2 },
});
