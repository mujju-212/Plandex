import { MaterialIcons } from '@expo/vector-icons';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FAB from '../../src/components/common/FAB';
import Sidebar from '../../src/components/common/Sidebar';
import { useEventStore } from '../../src/stores/useEventStore';
import { useLogStore } from '../../src/stores/useLogStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarTab() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { todos, loadTodos } = useTodoStore();
  const { logs, loadLogs } = useLogStore();
  const { events, loadEvents } = useEventStore();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    loadTodos();
    loadLogs();
    loadEvents();
  }, []);

  const goToPrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

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
    const hasTodos = todos.some(t => t.start_date === dateStr || t.end_date === dateStr);
    const hasLog = logs.some(l => l.date === dateStr);
    const hasCompleted = todos.some(t => (t.start_date === dateStr) && t.status === 'completed');
    return { hasTodos, hasLog, hasCompleted };
  };

  // Get items for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedTodos = todos.filter(t => t.start_date === selectedDateStr || (t.date_type === 'none'));
  const selectedLog = logs.find(l => l.date === selectedDateStr);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
      
      {/* Month Header */}
      <View style={styles.monthHeader}>
        <Pressable onPress={() => setShowSidebar(true)} style={[styles.navBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="menu" size={22} color={tc.textPrimary} />
        </Pressable>
        <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
          <MaterialIcons name="chevron-left" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: tc.textPrimary }]} numberOfLines={1}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <Pressable onPress={goToNextMonth} style={styles.navBtn}>
          <MaterialIcons name="chevron-right" size={24} color={tc.textPrimary} />
        </Pressable>
        <Pressable onPress={() => setShowCreateMenu(true)} style={[styles.navBtn, { backgroundColor: tc.primary }]}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map(wd => (
          <Text key={wd} style={[styles.weekdayText, { color: tc.textSecondary }]}>{wd}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
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
                isSelected && styles.dayCellSelected,
                isTodayDate && !isSelected && styles.dayCellToday,
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
                {dots.hasCompleted && <View style={[styles.dot, { backgroundColor: tc.warning }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Date Details */}
      <View style={[styles.detailsHeader, { borderTopColor: tc.border }]}>
        <Text style={[styles.detailsTitle, { color: tc.textPrimary }]}>{format(selectedDate, 'EEEE, MMMM d')}</Text>
      </View>

      <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
        {selectedTodos.length === 0 && !selectedLog ? (
          <View style={styles.emptyDetails}>
            <MaterialIcons name="event-note" size={48} color={tc.border} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Nothing scheduled for this day</Text>
          </View>
        ) : (
          <>
            {selectedTodos.map(todo => (
              <View key={todo.id} style={[styles.eventCard, { backgroundColor: tc.cardBackground }]}>
                <View style={[styles.eventBar, { backgroundColor: todo.status === 'completed' ? tc.success : tc.primary }]} />
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: tc.textPrimary }, todo.status === 'completed' && { textDecorationLine: 'line-through', color: tc.textSecondary }]}>
                    {todo.title}
                  </Text>
                  <Text style={[styles.eventMeta, { color: tc.textSecondary }]}>
                    {todo.priority} priority • {todo.due_time || 'All day'}
                  </Text>
                </View>
                <MaterialIcons
                  name={todo.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'}
                  size={22}
                  color={todo.status === 'completed' ? tc.success : tc.textSecondary}
                />
              </View>
            ))}

            {selectedLog && (
              <View style={[styles.logCard, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="insert-drive-file" size={20} color={tc.primary} />
                <View style={styles.logCardContent}>
                  <Text style={[styles.logCardTitle, { color: tc.textPrimary }]}>Daily Log</Text>
                  <Text style={[styles.logCardMeta, { color: tc.textSecondary }]}>
                    Mood: {selectedLog.mood || '—'} • Overall: {selectedLog.overall_rating || '—'}/10
                  </Text>
                </View>
              </View>
            )}

            {/* Events for selected date */}
            {events.filter(e => {
              const sd = format(selectedDate, 'yyyy-MM-dd');
              const eStart = e.start_datetime.split('T')[0];
              const eEnd = e.end_datetime ? e.end_datetime.split('T')[0] : eStart;
              return sd >= eStart && sd <= eEnd;
            }).map(event => (
              <Pressable key={`ev-${event.id}`} style={[styles.eventCard, { backgroundColor: tc.cardBackground }]} onPress={() => router.push(`/event/${event.id}`)}>
                <View style={[styles.eventIndicator, { backgroundColor: event.color }]} />
                <View style={styles.eventCardContent}>
                  <Text style={[styles.eventTitle, { color: tc.textPrimary }]}>{event.title}</Text>
                  <Text style={[styles.eventMeta, { color: tc.textSecondary }]}>
                    {event.category} • {event.is_all_day ? 'All day' : event.start_datetime.split('T')[1]?.slice(0, 5) || ''}
                  </Text>
                </View>
                <MaterialIcons name="event" size={22} color={event.color} />
              </Pressable>
            ))}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

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
    backgroundColor: colors.cardBackground,
  },
  monthTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.textPrimary,
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
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    backgroundColor: colors.primaryLight + '30',
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
  emptyDetails: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
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
