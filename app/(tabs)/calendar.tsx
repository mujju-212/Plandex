import { MaterialIcons } from '@expo/vector-icons';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../src/components/common/Card';
import EmptyState from '../../src/components/common/EmptyState';
import FAB from '../../src/components/common/FAB';
import Sidebar from '../../src/components/common/Sidebar';
import Tag from '../../src/components/common/Tag';
import { habitService } from '../../src/services/habitService';
import { useEventStore } from '../../src/stores/useEventStore';
import { useHabitStore } from '../../src/stores/useHabitStore';
import { useLogStore } from '../../src/stores/useLogStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { formatDateTimeString, formatTimeString, getEventOccurrenceStartDateTime, isEventOccurringOnDate, isHabitDueOnDate } from '../../src/utils/dateUtils';
import { isTodoScheduledForDate } from '../../src/utils/todoDateUtils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
type DetailFilter = 'all' | 'todos' | 'events' | 'logs' | 'habits';
type ViewMode = 'month' | 'agenda';
type AgendaRange = 'today' | '3day' | 'week';

export default function CalendarTab() {
  const router = useRouter();
  const { colors: tc } = useThemeStore();
  const { timeFormat } = useSettingsStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [agendaRange, setAgendaRange] = useState<AgendaRange>('today');
  const { todos, loadTodos } = useTodoStore();
  const { logs, loadLogs } = useLogStore();
  const { events, loadEvents } = useEventStore();
  const { habits, loadHabits } = useHabitStore();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [detailFilter, setDetailFilter] = useState<DetailFilter>('all');
  const [habitCompletions, setHabitCompletions] = useState<{ habit_id: number; date: string }[]>([]);

  useFocusEffect(useCallback(() => {
    loadTodos();
    loadLogs();
    loadEvents();
    loadHabits();
  }, [loadTodos, loadLogs, loadEvents, loadHabits]));

  const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const shiftSelectedDate = (deltaDays: number) => setSelectedDate(prev => addDays(prev, deltaDays));

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Get dots for a given date
  const getDotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasTodos = todos.some(t => isTodoScheduledForDate(t, date));
    const hasLog = logs.some(l => l.date === dateStr);
    const hasCompleted = todos.some(t => isTodoScheduledForDate(t, date) && t.status === 'completed');
    const hasEvents = events.some(e => e.status !== 'cancelled' && isEventOccurringOnDate(e, dateStr));
    const hasHabits = habits.some(h => isHabitDueOnDate(h, date));
    return { hasTodos, hasLog, hasCompleted, hasEvents, hasHabits };
  };

  // Get items for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedTodos = useMemo(
    () => todos.filter(t => isTodoScheduledForDate(t, selectedDate)),
    [selectedDate, todos],
  );
  const selectedLog = logs.find(l => l.date === selectedDateStr);
  const selectedEvents = useMemo(
    () => events.filter(e => {
      if (e.status === 'cancelled') return false;
      return isEventOccurringOnDate(e, selectedDateStr);
    }),
    [events, selectedDateStr],
  );
  const selectedHabits = useMemo(
    () => habits.filter(h => isHabitDueOnDate(h, selectedDate)),
    [habits, selectedDate],
  );
  const completedHabitIds = useMemo(
    () => new Set(habitCompletions.filter(c => c.date === selectedDateStr).map(c => c.habit_id)),
    [habitCompletions, selectedDateStr],
  );

  useEffect(() => {
    let active = true;
    habitService.getCompletionsForDate(selectedDateStr)
      .then((comps) => { if (active) setHabitCompletions(comps); })
      .catch(() => { if (active) setHabitCompletions([]); });
    return () => { active = false; };
  }, [selectedDateStr]);

  const agendaDates = useMemo(() => {
    if (agendaRange === 'today') return [selectedDate];
    if (agendaRange === '3day') return [selectedDate, addDays(selectedDate, 1), addDays(selectedDate, 2)];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [agendaRange, selectedDate]);

  const agendaStepDays = agendaRange === 'week' ? 7 : agendaRange === '3day' ? 3 : 1;

  const headerTitle = useMemo(() => {
    if (viewMode === 'month') return format(currentMonth, 'MMMM yyyy');
    if (agendaRange === 'today') return format(selectedDate, 'EEE, MMM d');
    const start = agendaDates[0];
    const end = agendaDates[agendaDates.length - 1];
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')}–${format(end, 'd')}`;
    }
    return `${format(start, 'MMM d')}–${format(end, 'MMM d')}`;
  }, [agendaDates, agendaRange, currentMonth, selectedDate, viewMode]);

  type AgendaItem = {
    key: string;
    title: string;
    meta: string;
    timeLabel: string;
    color: string;
    sortValue: number;
    onPress?: () => void;
  };

  type AgendaDayData = {
    dateStr: string;
    title: string;
    isToday: boolean;
    freeSlots: string[];
    items: AgendaItem[];
  };

  const parseTimeToMinutes = (timeValue: string | null | undefined): number | null => {
    if (!timeValue) return null;
    const m = timeValue.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
    return Math.max(0, Math.min(23 * 60 + 59, h * 60 + min));
  };

  const minutesToTimeLabel = (minutes: number) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    return formatTimeString(`${h}:${m}`, timeFormat);
  };

  const agendaDaysData: AgendaDayData[] = useMemo(() => {
    if (viewMode !== 'agenda') return [];

    return agendaDates.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayTitle = format(d, 'EEE, MMM d');

      const todosForDay = todos.filter(t => isTodoScheduledForDate(t, d));
      const eventsForDay = events.filter(e => e.status !== 'cancelled' && isEventOccurringOnDate(e, dateStr));
      const habitsForDay = habits.filter(h => isHabitDueOnDate(h, d));
      const logForDay = logs.find(l => l.date === dateStr);

      const items: AgendaItem[] = [];

      todosForDay.forEach((t) => {
        const minutes = parseTimeToMinutes(t.due_time);
        items.push({
          key: `todo-${t.id}-${dateStr}`,
          title: t.title,
          meta: `Task • ${t.priority}`,
          timeLabel: t.due_time ? formatTimeString(t.due_time, timeFormat) : 'Anytime',
          color: t.status === 'completed' ? tc.success : tc.primary,
          sortValue: minutes ?? 800,
          onPress: () => router.push(`/todo/${t.id}`),
        });
      });

      eventsForDay.forEach((e) => {
        const startDt = e.is_recurring ? getEventOccurrenceStartDateTime(e, dateStr) : e.start_datetime;
        const timePart = startDt.slice(11, 16);
        const minutes = e.is_all_day ? -1 : (parseTimeToMinutes(timePart) ?? 900);
        items.push({
          key: `event-${e.id}-${dateStr}`,
          title: e.title,
          meta: `Event • ${e.category}${e.location ? ` • ${e.location}` : ''}`,
          timeLabel: e.is_all_day ? 'All day' : formatDateTimeString(startDt, timeFormat),
          color: e.color || tc.danger,
          sortValue: minutes,
          onPress: () => router.push(`/event/${e.id}`),
        });
      });

      habitsForDay.forEach((h) => {
        const minutes = h.time_of_day === 'morning' ? 540 : h.time_of_day === 'afternoon' ? 840 : h.time_of_day === 'evening' ? 1080 : 720;
        items.push({
          key: `habit-${h.id}-${dateStr}`,
          title: h.title,
          meta: `Habit • ${h.category}`,
          timeLabel: h.time_of_day,
          color: h.color || tc.textSecondary,
          sortValue: minutes,
          onPress: () => router.push(`/habit/${h.id}`),
        });
      });

      if (logForDay) {
        items.push({
          key: `log-${dateStr}`,
          title: 'Daily Log',
          meta: `Log • Mood: ${logForDay.mood || '—'}`,
          timeLabel: 'Log',
          color: tc.primary,
          sortValue: 1300,
          onPress: () => router.push(`/log/daily/${dateStr}`),
        });
      }

      items.sort((a, b) => a.sortValue - b.sortValue);

      const freeSlots = (() => {
        const dayEvents = eventsForDay.filter(e => !e.is_all_day);
        const startBound = 8 * 60;
        const endBound = 20 * 60;

        const dateBusyAllDay = dayEvents.some(e => {
          const startDate = (e.start_datetime || '').slice(0, 10);
          const endDate = (e.end_datetime || e.start_datetime || '').slice(0, 10);
          return startDate !== endDate;
        });
        if (dateBusyAllDay) return [];

        const intervals = dayEvents.map((e) => {
          const startDt = e.is_recurring ? getEventOccurrenceStartDateTime(e, dateStr) : e.start_datetime;
          const startMinutes = parseTimeToMinutes(startDt.slice(11, 16)) ?? startBound;
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

        return gaps
          .filter(g => g.e - g.s >= 60)
          .slice(0, 4)
          .map(g => `Free ${minutesToTimeLabel(g.s)}–${minutesToTimeLabel(g.e)}`);
      })();

      return {
        dateStr,
        title: dayTitle,
        isToday: format(new Date(), 'yyyy-MM-dd') === dateStr,
        freeSlots,
        items,
      };
    });
  }, [agendaDates, events, habits, logs, router, tc.danger, tc.primary, tc.success, tc.textSecondary, timeFormat, todos, viewMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
      
      {/* Month Header */}
      <View style={styles.monthHeader}>
        <Pressable onPress={() => setShowSidebar(true)} style={[styles.navBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="menu" size={22} color={tc.textPrimary} />
        </Pressable>
        <Pressable onPress={() => (viewMode === 'month' ? goToPrevMonth() : shiftSelectedDate(-agendaStepDays))} style={[styles.navBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="chevron-left" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: tc.textPrimary }]} numberOfLines={1}>{headerTitle}</Text>
        <Pressable onPress={() => (viewMode === 'month' ? goToNextMonth() : shiftSelectedDate(agendaStepDays))} style={[styles.navBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="chevron-right" size={24} color={tc.textPrimary} />
        </Pressable>
        <Pressable onPress={() => setShowCreateMenu(true)} style={[styles.navBtn, { backgroundColor: tc.primary }]}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.topChipsRow}>
        <Tag label="Month" variant="chip" selected={viewMode === 'month'} onPress={() => setViewMode('month')} />
        <Tag label="Agenda" variant="chip" selected={viewMode === 'agenda'} onPress={() => setViewMode('agenda')} />
        {viewMode === 'agenda' && (
          <>
            <Tag label="Today" variant="chip" selected={agendaRange === 'today'} onPress={() => setAgendaRange('today')} />
            <Tag label="3-day" variant="chip" selected={agendaRange === '3day'} onPress={() => setAgendaRange('3day')} />
            <Tag label="Week" variant="chip" selected={agendaRange === 'week'} onPress={() => setAgendaRange('week')} />
            <Tag label="Plan day" variant="chip" selected onPress={() => router.push({ pathname: '/plan-day', params: { date: selectedDateStr } } as any)} />
          </>
        )}
      </View>

      {viewMode === 'month' && (
        <>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(wd => (
              <Text key={wd} style={[styles.weekdayText, { color: tc.textSecondary }]}>{wd}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((d, i) => {
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isSelected = isSameDay(d, selectedDate);
              const isTodayDate = isToday(d);
              const dots = getDotsForDate(d);

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: tc.primary },
                    isTodayDate && !isSelected && { backgroundColor: tc.primaryLight + '30' },
                  ]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[
                    styles.dayText,
                    { color: tc.textPrimary },
                    !isCurrentMonth && { color: tc.textSecondary + '50' },
                    isSelected && styles.dayTextSelected,
                  ]}>
                    {format(d, 'd')}
                  </Text>
                  <View style={styles.dotRow}>
                    {dots.hasTodos && <View style={[styles.dot, { backgroundColor: tc.primary }]} />}
                    {dots.hasLog && <View style={[styles.dot, { backgroundColor: tc.success }]} />}
                    {dots.hasEvents && <View style={[styles.dot, { backgroundColor: tc.danger }]} />}
                    {dots.hasCompleted && <View style={[styles.dot, { backgroundColor: tc.warning }]} />}
                    {dots.hasHabits && <View style={[styles.dot, { backgroundColor: tc.primaryLight }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {viewMode === 'agenda' && (
        <ScrollView style={styles.agendaScroll} contentContainerStyle={styles.agendaContent} showsVerticalScrollIndicator={false}>
          {agendaDaysData.map((day) => (
            <View key={day.dateStr} style={styles.agendaDay}>
              <View style={styles.agendaDayHeader}>
                <View style={styles.agendaDayHeaderLeft}>
                  <Text style={[styles.agendaDayTitle, { color: tc.textPrimary }]}>{day.title}</Text>
                  {day.isToday && <Tag label="Today" variant="chip" selected />}
                </View>
                <Pressable onPress={() => { try { setSelectedDate(new Date(day.dateStr)); } catch {} }} hitSlop={8}>
                  <Text style={[styles.agendaJump, { color: tc.primary }]}>Open</Text>
                </Pressable>
              </View>

              {day.freeSlots.length > 0 && (
                <View style={styles.freeSlotsRow}>
                  {day.freeSlots.map((s) => (
                    <Tag key={`${day.dateStr}-${s}`} label={s} variant="chip" />
                  ))}
                </View>
              )}

              {day.items.length === 0 ? (
                <View style={styles.agendaEmpty}>
                  <EmptyState
                    icon="event-note"
                    variant="compact"
                    title="Nothing scheduled"
                    message="Enjoy the open space or plan a focus block."
                    ctaLabel="Plan the day"
                    onCtaPress={() => router.push({ pathname: '/plan-day', params: { date: day.dateStr } } as any)}
                  />
                </View>
              ) : (
                day.items.map((item) => (
                  <Card
                    key={item.key}
                    style={styles.itemCard}
                    withShadow={false}
                    withMargin={false}
                    onPress={item.onPress}
                  >
                    <View style={[styles.eventIndicator, { backgroundColor: item.color }]} />
                    <View style={styles.eventCardContent}>
                      <Text style={[styles.eventTitle, { color: tc.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.eventMeta, { color: tc.textSecondary }]} numberOfLines={1}>{item.meta}</Text>
                    </View>
                    <Tag label={item.timeLabel} variant="chip" />
                  </Card>
                ))
              )}
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {viewMode === 'month' && (
        <>
          <View style={[styles.detailsHeader, { borderTopColor: tc.border }]}>
            <Text style={[styles.detailsTitle, { color: tc.textPrimary }]}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
          </View>

          <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
            <View style={styles.filterBar}>
              {([
                { key: 'all', label: 'All' },
                { key: 'todos', label: `Todos${selectedTodos.length ? ` ${selectedTodos.length}` : ''}` },
                { key: 'events', label: `Events${selectedEvents.length ? ` ${selectedEvents.length}` : ''}` },
                { key: 'logs', label: `Logs${selectedLog ? ' 1' : ''}` },
                { key: 'habits', label: `Habits${selectedHabits.length ? ` ${selectedHabits.length}` : ''}` },
              ] as const).map((f) => (
                <Tag
                  key={f.key}
                  label={f.label}
                  variant="chip"
                  selected={detailFilter === f.key}
                  onPress={() => setDetailFilter(f.key)}
                  style={{ marginRight: 8, marginBottom: 8 }}
                />
              ))}
            </View>

            {selectedTodos.length === 0 && !selectedLog && selectedEvents.length === 0 && selectedHabits.length === 0 ? (
              <View style={styles.emptyDetails}>
                <EmptyState
                  icon="event-note"
                  variant="compact"
                  title="Nothing scheduled"
                  message="Add a task or event to start shaping this day."
                  ctaLabel="Quick add"
                  onCtaPress={() => setShowCreateMenu(true)}
                />
              </View>
            ) : (
              <>
                {(detailFilter === 'all' || detailFilter === 'todos') && selectedTodos.map(todo => (
                  <Card key={todo.id} style={styles.itemCard} withShadow={false} withMargin={false}>
                    <View style={[styles.eventBar, { backgroundColor: todo.status === 'completed' ? tc.success : tc.primary }]} />
                    <View style={styles.eventContent}>
                      <Text style={[styles.eventTitle, { color: tc.textPrimary }, todo.status === 'completed' && { textDecorationLine: 'line-through', color: tc.textSecondary }]}>
                        {todo.title}
                      </Text>
                      <Text style={[styles.eventMeta, { color: tc.textSecondary }]}>
                        {todo.priority} priority • {formatTimeString(todo.due_time, timeFormat)}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={todo.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'}
                      size={22}
                      color={todo.status === 'completed' ? tc.success : tc.textSecondary}
                    />
                  </Card>
                ))}

                {(detailFilter === 'all' || detailFilter === 'logs') && selectedLog && (
                  <Card style={[styles.itemCard, { backgroundColor: tc.primary + '12' }]} withShadow={false} withMargin={false}>
                    <MaterialIcons name="insert-drive-file" size={20} color={tc.primary} />
                    <View style={styles.logCardContent}>
                      <Text style={[styles.logCardTitle, { color: tc.textPrimary }]}>Daily Log</Text>
                      <Text style={[styles.logCardMeta, { color: tc.textSecondary }]}>
                        Mood: {selectedLog.mood || '—'} • Overall: {selectedLog.overall_rating || '—'}/10
                      </Text>
                    </View>
                  </Card>
                )}

                {(detailFilter === 'all' || detailFilter === 'events') && selectedEvents.map(event => (
                  <Card
                    key={`ev-${event.id}`}
                    style={styles.itemCard}
                    withShadow={false}
                    withMargin={false}
                    onPress={() => router.push(`/event/${event.id}`)}
                  >
                    <View style={[styles.eventIndicator, { backgroundColor: event.color }]} />
                    <View style={styles.eventCardContent}>
                      <Text style={[styles.eventTitle, { color: tc.textPrimary }]}>{event.title}</Text>
                      <Text style={[styles.eventMeta, { color: tc.textSecondary }]}>
                        {event.category} • {event.is_all_day ? 'All day' : formatDateTimeString(getEventOccurrenceStartDateTime(event, selectedDateStr), timeFormat)}
                      </Text>
                    </View>
                    <MaterialIcons name="event" size={22} color={event.color} />
                  </Card>
                ))}

                {(detailFilter === 'all' || detailFilter === 'habits') && selectedHabits.map(habit => {
                  const isDone = completedHabitIds.has(habit.id);
                  return (
                    <Card
                      key={`hb-${habit.id}`}
                      style={styles.itemCard}
                      withShadow={false}
                      withMargin={false}
                      onPress={() => router.push(`/habit/${habit.id}`)}
                    >
                      <View style={[styles.eventIndicator, { backgroundColor: habit.color }]} />
                      <View style={styles.eventCardContent}>
                        <Text style={[styles.eventTitle, { color: tc.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' }]} numberOfLines={1}>
                          {habit.title}
                        </Text>
                        <Text style={[styles.eventMeta, { color: tc.textSecondary }]}>
                          {habit.category} • {habit.time_of_day}
                        </Text>
                      </View>
                      <MaterialIcons name={isDone ? 'check-circle' : 'radio-button-unchecked'} size={22} color={isDone ? tc.success : tc.textSecondary} />
                    </Card>
                  );
                })}
              </>
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        </>
      )}

      <FAB onPress={() => setShowCreateMenu(true)} />

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
                <Text style={[styles.createOptionDesc, { color: tc.textSecondary }]}>Add a task with date, priority, and recurring</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tc.textSecondary} />
            </Pressable>
            <Pressable style={styles.createOption} onPress={() => { setShowCreateMenu(false); router.push('/event/create'); }}>
              <View style={[styles.createOptionIcon, { backgroundColor: '#E91E63' + '20' }]}>
                <MaterialIcons name="event" size={24} color="#E91E63" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.createOptionTitle, { color: tc.textPrimary }]}>New Event</Text>
                <Text style={[styles.createOptionDesc, { color: tc.textSecondary }]}>Schedule with time, location, and category</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={tc.textSecondary} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 30,
    paddingBottom: 12,
    gap: 6,
  },
  navBtn: {
    padding: 6,
    borderRadius: 10,
    minWidth: 36,
    alignItems: 'center',
    // Background color handled via inline style now
  },
  monthTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.textPrimary,
  },
  topChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  dayCellSelected: {
    // dynamic via inline style now
  },
  dayCellToday: {
    // dynamic via inline style now
  },
  dayText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: colors.textPrimary,
  },
  dayTextMuted: {
    color: colors.textSecondary + '60',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold as any,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailsHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  emptyDetails: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  eventBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
  },
  eventTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  eventMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  logCardContent: {
    flex: 1,
  },
  logCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
  },
  logCardMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  eventCardContent: {
    flex: 1,
  },
  agendaScroll: {
    flex: 1,
  },
  agendaContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 110,
  },
  agendaDay: {
    marginBottom: 16,
  },
  agendaDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  agendaDayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agendaDayTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  agendaJump: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
  freeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  agendaEmpty: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  agendaEmptyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  createMenu: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  createMenuTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  createOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOptionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
  },
  createOptionDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
