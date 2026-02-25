import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import FAB from '../../src/components/common/FAB';
import Sidebar from '../../src/components/common/Sidebar';
import GreetingHeader from '../../src/components/dashboard/GreetingHeader';
import TodaySummary from '../../src/components/dashboard/TodaySummary';
import TodoItem from '../../src/components/todo/TodoItem';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function HomeTab() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userName, setUserName] = useState('User');

  const { todos, loadTodos, completeTodo, uncompleteTodo } = useTodoStore();

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Reload user name every time screen gains focus (e.g. after profile edit)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('profile_name').then(name => {
        if (name) setUserName(name);
      });
    }, [])
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

  const pendingTodos = todos.filter(t => t.status !== 'completed');
  const pendingCount = pendingTodos.length;
  const completedCount = todos.length - pendingCount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GreetingHeader
          name={userName}
          unreadCount={pendingCount}
          onMenuPress={() => setShowSidebar(true)}
          onSearchPress={() => router.push('/search')}
          onNotificationPress={() => setShowNotifications(true)}
        />

        <TodaySummary
          todosCompleted={completedCount}
          todosTotal={todos.length}
          streakDays={1}
          productivityScore={todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Today's Todos</Text>
          <View style={[styles.sectionDivider, { backgroundColor: tc.border }]} />
        </View>

        {todos.length === 0 ? (
          <Text style={{ marginHorizontal: 20, marginTop: 16, color: tc.textSecondary }}>No tasks yet. Create one!</Text>
        ) : (
          todos.map((todo) => (
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
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any, color: colors.textPrimary, marginRight: 16 },
  sectionDivider: { flex: 1, height: 1, backgroundColor: colors.border },
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
