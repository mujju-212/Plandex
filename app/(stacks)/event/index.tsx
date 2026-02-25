import { MaterialIcons } from '@expo/vector-icons';
import { format, isThisWeek, isToday, isTomorrow } from 'date-fns';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEventStore } from '../../../src/stores/useEventStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { typography } from '../../../src/theme/typography';

type Filter = 'today' | 'upcoming' | 'all' | 'completed';

export default function EventListScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { events, loadEvents, isLoading } = useEventStore();
  const [filter, setFilter] = useState<Filter>('today');

  useFocusEffect(useCallback(() => { loadEvents(); }, []));

  const todayEvents = events.filter(e => isToday(new Date(e.start_datetime)));
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const completedEvents = events.filter(e => e.status === 'completed');

  const filtered = filter === 'today' ? todayEvents
    : filter === 'upcoming' ? upcomingEvents
    : filter === 'completed' ? completedEvents
    : events;

  const getStatusColor = (status: string) => {
    if (status === 'upcoming') return tc.primary;
    if (status === 'ongoing') return tc.warning;
    if (status === 'completed') return tc.success;
    return tc.danger;
  };

  const formatTime = (e: any) => {
    if (e.is_all_day) return 'All Day';
    const d = new Date(e.start_datetime);
    const when = isToday(d) ? 'Today'
      : isTomorrow(d) ? 'Tomorrow'
      : isThisWeek(d) ? format(d, 'EEE')
      : format(d, 'MMM d');
    return `${when} · ${format(d, 'h:mm a')}`;
  };

  const stats = [
    { label: 'Today', value: todayEvents.length, icon: 'wb-sunny', color: tc.warning },
    { label: 'Upcoming', value: upcomingEvents.length, icon: 'schedule', color: tc.primary },
    { label: 'Completed', value: completedEvents.length, icon: 'check-circle', color: tc.success },
    { label: 'Total', value: events.length, icon: 'event', color: tc.textSecondary },
  ];

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'today', label: 'Today', count: todayEvents.length },
    { key: 'upcoming', label: 'Upcoming', count: upcomingEvents.length },
    { key: 'all', label: 'All', count: events.length },
    { key: 'completed', label: 'Done', count: completedEvents.length },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={22} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Events</Text>
        <Pressable onPress={() => router.push('/event/create')} style={[styles.iconBtn, { backgroundColor: tc.primary }]}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Stats Grid */}
        <View style={styles.grid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
              <MaterialIcons name={s.icon as any} size={22} color={s.color} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              style={[styles.pill, { backgroundColor: tc.cardBackground, borderColor: tc.border },
                filter === f.key && { backgroundColor: tc.primary, borderColor: tc.primary }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.pillText, { color: tc.textSecondary }, filter === f.key && { color: '#FFF' }]}>
                {f.label}{f.count > 0 ? `  ${f.count}` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="event" size={48} color={tc.border} />
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>
              {filter === 'today' ? 'No events today' : `No ${filter} events`}
            </Text>
            <Pressable onPress={() => router.push('/event/create')}>
              <Text style={[styles.emptyLink, { color: tc.primary }]}>+ Create Event</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map(event => (
            <Pressable
              key={event.id}
              style={[styles.card, { backgroundColor: tc.cardBackground }]}
              onPress={() => router.push(`/event/${event.id}`)}
            >
              <View style={[styles.strip, { backgroundColor: event.color }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: tc.textPrimary }]} numberOfLines={1}>{event.title}</Text>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(event.status) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(event.status) }]}>{event.status}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <MaterialIcons name="access-time" size={12} color={tc.textSecondary} />
                  <Text style={[styles.metaTxt, { color: tc.textSecondary }]}>{formatTime(event)}</Text>
                  {event.location ? (
                    <>
                      <Text style={[styles.dot, { color: tc.border }]}>·</Text>
                      <MaterialIcons name="place" size={12} color={tc.textSecondary} />
                      <Text style={[styles.metaTxt, { color: tc.textSecondary }]} numberOfLines={1}>{event.location}</Text>
                    </>
                  ) : null}
                  {event.is_recurring ? (
                    <>
                      <Text style={[styles.dot, { color: tc.border }]}>·</Text>
                      <MaterialIcons name="repeat" size={12} color={tc.primary} />
                    </>
                  ) : null}
                </View>
                {event.description ? (
                  <Text style={[styles.cardDesc, { color: tc.textSecondary }]} numberOfLines={1}>{event.description}</Text>
                ) : null}
              </View>
              <MaterialIcons name="chevron-right" size={18} color={tc.border} style={{ marginRight: 10 }} />
            </Pressable>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  scroll: { paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs },
  filterRow: { marginBottom: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  pillText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium as any },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  strip: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, paddingVertical: 11, paddingLeft: 12, paddingRight: 4, gap: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, flex: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: typography.weights.medium as any, textTransform: 'capitalize' as const },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: typography.sizes.xs },
  dot: { fontSize: 10, marginHorizontal: 1 },
  cardDesc: { fontSize: typography.sizes.xs },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: typography.sizes.md },
  emptyLink: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
});
