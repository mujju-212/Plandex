import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEventStore } from '../../src/stores/useEventStore';
import { useGoalStore } from '../../src/stores/useGoalStore';
import { useHabitStore } from '../../src/stores/useHabitStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { typography } from '../../src/theme/typography';

type SearchResult = {
  id: number;
  title: string;
  subtitle?: string;
  type: 'todo' | 'event' | 'goal' | 'habit';
  icon: string;
  color: string;
  status?: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { todos, loadTodos } = useTodoStore();
  const { events, loadEvents } = useEventStore();
  const { goals, loadGoals } = useGoalStore();
  const { habits, loadHabits } = useHabitStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadTodos();
    loadEvents();
    loadGoals();
    loadHabits();
  }, []);

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const todoResults: SearchResult[] = todos
      .filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q)))
      .map(t => ({ id: t.id, title: t.title, subtitle: t.due_time ? `Due: ${t.due_time}` : (t.tags?.[0] || undefined), type: 'todo' as const, icon: t.status === 'completed' ? 'check-circle' : 'radio-button-unchecked', color: t.status === 'completed' ? tc.success : tc.primary, status: t.status }));

    const eventResults: SearchResult[] = events
      .filter(e => e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q))
      .map(e => ({ id: e.id, title: e.title, subtitle: e.category, type: 'event' as const, icon: 'event', color: e.color || tc.primary, status: e.status }));

    const goalResults: SearchResult[] = goals
      .filter(g => g.title.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q))
      .map(g => ({ id: g.id, title: g.title, subtitle: g.category, type: 'goal' as const, icon: 'flag', color: g.color || tc.primary, status: g.status }));

    const habitResults: SearchResult[] = habits
      .filter(h => h.title.toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q) || (h.category || '').toLowerCase().includes(q))
      .map(h => ({ id: h.id, title: h.title, subtitle: h.category, type: 'habit' as const, icon: 'repeat', color: h.color || tc.primary }));

    return [...todoResults, ...eventResults, ...goalResults, ...habitResults];
  }, [query, todos, events, goals, habits, tc]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'todo': return 'Task';
      case 'event': return 'Event';
      case 'goal': return 'Goal';
      case 'habit': return 'Habit';
      default: return type;
    }
  };

  const handlePress = (item: SearchResult) => {
    switch (item.type) {
      case 'todo': router.push(`/todo/${item.id}`); break;
      case 'event': router.push(`/event/${item.id}`); break;
      case 'goal': router.push(`/goal/${item.id}`); break;
      case 'habit': router.push(`/habit/${item.id}`); break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </Pressable>
        <View style={[styles.searchBox, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="search" size={20} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks, events, goals, habits..."
            placeholderTextColor={tc.textSecondary}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={18} color={tc.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!query.trim() && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search" size={64} color={tc.border} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Type to search across all your items</Text>
          </View>
        )}

        {query.trim() && results.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={tc.border} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No results for "{query}"</Text>
          </View>
        )}

        {results.map((item, idx) => (
          <Pressable key={`${item.type}-${item.id}-${idx}`} style={[styles.resultCard, { backgroundColor: tc.cardBackground }]} onPress={() => handlePress(item)}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <MaterialIcons name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: tc.textPrimary }, item.status === 'completed' && { textDecorationLine: 'line-through' as const, color: tc.textSecondary }]}>
                {item.title}
              </Text>
              {item.subtitle && <Text style={[styles.resultSubtitle, { color: tc.textSecondary }]}>{item.subtitle}</Text>}
            </View>
            <View style={[styles.typeBadge, { backgroundColor: item.color + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: item.color }]}>{getTypeLabel(item.type)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8, gap: 12 },
  headerBtn: { padding: 8, borderRadius: 20 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: typography.sizes.md },
  content: { padding: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center' as const, paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: typography.sizes.md, textAlign: 'center' as const },
  resultCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const },
  resultTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any },
  resultSubtitle: { fontSize: typography.sizes.xs, marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
});
