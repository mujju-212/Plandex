import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/common/Card';
import EmptyState from '../../src/components/common/EmptyState';
import SectionHeader from '../../src/components/common/SectionHeader';
import Tag from '../../src/components/common/Tag';
import { useEventStore } from '../../src/stores/useEventStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { typography } from '../../src/theme/typography';
import { formatDateLabel, formatTimeString } from '../../src/utils/dateUtils';
import { isTodoScheduledForDate } from '../../src/utils/todoDateUtils';

type SuggestedBlock = {
  key: string;
  todoId: number;
  title: string;
  startMinutes: number;
  endMinutes: number;
};

function minutesToHHMM(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export default function PlanDayScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const tc = useThemeStore().colors;
  const { timeFormat } = useSettingsStore();

  const dateStr = useMemo(() => {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return format(new Date(), 'yyyy-MM-dd');
  }, [date]);

  const dateObj = useMemo(() => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    } catch {
      return new Date();
    }
  }, [dateStr]);

  const { todos, loadTodos, updateTodo } = useTodoStore();
  const { events, loadEvents, addEvent } = useEventStore();

  const [isApplyingAll, setIsApplyingAll] = useState(false);

  useEffect(() => {
    loadTodos({ exclude_archived: true });
    loadEvents();
  }, [loadEvents, loadTodos]);

  const parseTimeToMinutes = (timeValue: string | null | undefined): number | null => {
    if (!timeValue) return null;
    const m = timeValue.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
    return Math.max(0, Math.min(23 * 60 + 59, h * 60 + min));
  };

  const todosForDay = useMemo(() => {
    const filtered = todos.filter(t => isTodoScheduledForDate(t, dateObj));
    filtered.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
    return filtered;
  }, [dateObj, todos]);

  const pendingTodos = useMemo(
    () => todosForDay.filter(t => t.status !== 'completed' && t.status !== 'archived'),
    [todosForDay],
  );

  const dayEvents = useMemo(() => {
    return events.filter(e => {
      if (e.status === 'cancelled') return false;
      const startDate = (e.start_datetime || '').slice(0, 10);
      const endDate = (e.end_datetime || e.start_datetime || '').slice(0, 10);
      return !(dateStr < startDate || dateStr > endDate);
    });
  }, [dateStr, events]);

  const freeSlots = useMemo(() => {
    const startBound = 8 * 60;
    const endBound = 20 * 60;

    const timedEvents = dayEvents.filter(e => !e.is_all_day);
    const dateBusyAllDay = timedEvents.some(e => {
      const startDate = (e.start_datetime || '').slice(0, 10);
      const endDate = (e.end_datetime || e.start_datetime || '').slice(0, 10);
      return startDate !== endDate;
    });
    if (dateBusyAllDay) return [] as { s: number; e: number }[];

    const intervals = timedEvents.map((e) => {
      const startMinutes = parseTimeToMinutes((e.start_datetime || '').slice(11, 16)) ?? startBound;
      let endMinutes = startMinutes + 60;
      const endDt = e.end_datetime || '';
      if (endDt.slice(0, 10) === dateStr) {
        const parsedEnd = parseTimeToMinutes(endDt.slice(11, 16));
        if (parsedEnd !== null) endMinutes = parsedEnd;
      }
      const s = Math.max(startBound, Math.min(endBound, startMinutes));
      const en = Math.max(startBound, Math.min(endBound, endMinutes));
      return { s: Math.min(s, en), e: Math.max(s, en) };
    }).filter(i => i.e > i.s);

    intervals.sort((a, b) => a.s - b.s);
    const merged: { s: number; e: number }[] = [];
    for (const it of intervals) {
      const last = merged[merged.length - 1];
      if (!last || it.s > last.e) merged.push({ ...it });
      else last.e = Math.max(last.e, it.e);
    }

    const gaps: { s: number; e: number }[] = [];
    let cursor = startBound;
    for (const it of merged) {
      if (it.s > cursor) gaps.push({ s: cursor, e: it.s });
      cursor = Math.max(cursor, it.e);
    }
    if (cursor < endBound) gaps.push({ s: cursor, e: endBound });

    return gaps.filter(g => g.e - g.s >= 30);
  }, [dateStr, dayEvents]);

  const suggestions = useMemo((): SuggestedBlock[] => {
    const unscheduled = pendingTodos.filter(t => !t.due_time);
    if (unscheduled.length === 0) return [];

    const blocks: { s: number; e: number }[] = [];
    freeSlots.forEach((g) => {
      let cursor = g.s;
      while (cursor + 60 <= g.e) {
        blocks.push({ s: cursor, e: cursor + 60 });
        cursor += 60;
      }
    });

    const result: SuggestedBlock[] = [];
    for (let i = 0; i < Math.min(unscheduled.length, blocks.length); i++) {
      const t = unscheduled[i];
      const b = blocks[i];
      result.push({
        key: `blk-${dateStr}-${t.id}-${b.s}`,
        todoId: t.id,
        title: t.title,
        startMinutes: b.s,
        endMinutes: b.e,
      });
    }
    return result;
  }, [dateStr, freeSlots, pendingTodos]);

  const moveTodo = useCallback(async (todoId: number, direction: -1 | 1) => {
    const index = todosForDay.findIndex(t => t.id === todoId);
    if (index === -1) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= todosForDay.length) return;

    const a = todosForDay[index];
    const b = todosForDay[swapIndex];
    const aPos = a.position ?? index;
    const bPos = b.position ?? swapIndex;

    await updateTodo(a.id, { position: bPos });
    await updateTodo(b.id, { position: aPos });
    await loadTodos({ exclude_archived: true });
  }, [loadTodos, todosForDay, updateTodo]);

  const applySuggestion = useCallback(async (s: SuggestedBlock) => {
    const start = `${dateStr}T${minutesToHHMM(s.startMinutes)}:00`;
    const end = `${dateStr}T${minutesToHHMM(s.endMinutes)}:00`;

    await addEvent({
      title: s.title,
      event_type: 'single',
      start_datetime: start,
      end_datetime: end,
      is_all_day: false,
      category: 'general',
      color: tc.primary,
    } as any);

    await updateTodo(s.todoId, {
      date_type: 'single',
      start_date: dateStr,
      end_date: undefined,
      due_time: minutesToHHMM(s.startMinutes),
    });
  }, [addEvent, dateStr, tc.primary, updateTodo]);

  const applyAll = useCallback(async () => {
    if (suggestions.length === 0) return;
    setIsApplyingAll(true);
    try {
      for (const s of suggestions) {
        await applySuggestion(s);
      }
      await loadTodos({ exclude_archived: true });
      await loadEvents();
      Alert.alert('Planned', 'Time blocks were added to your calendar.');
    } finally {
      setIsApplyingAll(false);
    }
  }, [applySuggestion, loadEvents, loadTodos, suggestions]);

  const freeSlotLabels = useMemo(() => {
    return freeSlots
      .filter(g => g.e - g.s >= 60)
      .slice(0, 6)
      .map(g => {
        const a = formatTimeString(minutesToHHMM(g.s), timeFormat);
        const b = formatTimeString(minutesToHHMM(g.e), timeFormat);
        return `Free ${a}–${b}`;
      });
  }, [freeSlots, timeFormat]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={22} color={tc.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Plan the day</Text>
          <Text style={[styles.headerSub, { color: tc.textSecondary }]}>{formatDateLabel(dateStr, 'long')}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/calendar' as any)}
          style={[styles.headerBtn, { backgroundColor: tc.primary }]}
        >
          <MaterialIcons name="calendar-today" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Free time" subtitle="Open blocks (8 AM–8 PM)" />
        {freeSlotLabels.length === 0 ? (
          <Card style={styles.simpleCard} withShadow={false}>
            <Text style={[styles.mutedText, { color: tc.textSecondary }]}>No free blocks detected for this day.</Text>
          </Card>
        ) : (
          <View style={styles.chipsRow}>
            {freeSlotLabels.map(label => (
              <Tag key={label} label={label} variant="chip" />
            ))}
          </View>
        )}

        <SectionHeader title="Reorder" subtitle="Today’s tasks" />
        {todosForDay.length === 0 ? (
          <EmptyState
            icon="checklist"
            title="No tasks scheduled"
            message="Add a task for this day, then come back to reorder and time-block."
            ctaLabel="Create task"
            onCtaPress={() => router.push('/todo/create' as any)}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {todosForDay.map((t, idx) => (
              <Card key={`td-${t.id}`} style={styles.todoCard} withShadow={false} withMargin={false}>
                <View style={styles.todoLeft}>
                  <Text style={[styles.todoTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <View style={styles.todoMetaRow}>
                    <Tag label={t.status === 'completed' ? 'Done' : 'Task'} variant="chip" selected={t.status === 'completed'} />
                    <Tag
                      label={t.due_time ? formatTimeString(t.due_time, timeFormat) : 'Anytime'}
                      variant="chip"
                    />
                  </View>
                </View>
                <View style={styles.todoActions}>
                  <Pressable
                    onPress={() => moveTodo(t.id, -1)}
                    disabled={idx === 0}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: tc.cardBackground, opacity: idx === 0 ? 0.35 : (pressed ? 0.7 : 1) },
                    ]}
                  >
                    <MaterialIcons name="arrow-upward" size={18} color={tc.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveTodo(t.id, 1)}
                    disabled={idx === todosForDay.length - 1}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: tc.cardBackground, opacity: idx === todosForDay.length - 1 ? 0.35 : (pressed ? 0.7 : 1) },
                    ]}
                  >
                    <MaterialIcons name="arrow-downward" size={18} color={tc.textPrimary} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        <SectionHeader
          title="Time blocks"
          subtitle="Suggested from free slots"
          actionLabel={isApplyingAll ? 'Applying…' : 'Apply all'}
          onActionPress={isApplyingAll ? undefined : applyAll}
        />
        {suggestions.length === 0 ? (
          <Card style={styles.simpleCard} withShadow={false}>
            <Text style={[styles.mutedText, { color: tc.textSecondary }]}>
              No suggestions right now. Add free time in your calendar, or create tasks without a time.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {suggestions.map((s) => (
              <Card key={s.key} style={styles.blockCard} withShadow={false} withMargin={false}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.todoTitle, { color: tc.textPrimary }]} numberOfLines={1}>{s.title}</Text>
                  <Text style={[styles.blockMeta, { color: tc.textSecondary }]}>
                    {formatTimeString(minutesToHHMM(s.startMinutes), timeFormat)}–{formatTimeString(minutesToHHMM(s.endMinutes), timeFormat)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => applySuggestion(s)}
                  style={({ pressed }) => [
                    styles.applyBtn,
                    { backgroundColor: tc.primary, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text style={styles.applyBtnText}>Add</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
  },
  headerSub: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  chipsRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  simpleCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  mutedText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  todoCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todoLeft: { flex: 1 },
  todoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  todoMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  todoActions: {
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blockMeta: {
    marginTop: 6,
    fontSize: typography.sizes.sm,
  },
  applyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
});
