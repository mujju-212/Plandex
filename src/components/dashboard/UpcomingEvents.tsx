import { MaterialIcons } from '@expo/vector-icons';
import { format, isToday, parseISO } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { AppEvent } from '../../types/event.types';

type UpcomingEventsProps = {
  events: AppEvent[];
  onEventPress: (id: number) => void;
  onViewAll: () => void;
};

// Category colors are now derived from theme

export default function UpcomingEvents({ events, onEventPress, onViewAll }: UpcomingEventsProps) {
  const tc = useThemeStore().colors;

  // Filter to today's upcoming events, sorted by time
  const todayEvents = events
    .filter(e => {
      try {
        return isToday(parseISO(e.start_datetime)) && e.status !== 'cancelled';
      } catch { return false; }
    })
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
    .slice(0, 4);

  if (todayEvents.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="event" size={20} color={tc.primary} />
            <Text style={[styles.title, { color: tc.textPrimary }]}>Upcoming Events</Text>
          </View>
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={[styles.viewAll, { color: tc.primary }]}>Calendar</Text>
          </Pressable>
        </View>
        <View style={[styles.emptyCard, { backgroundColor: tc.cardBackground }]}>
          <View style={[styles.emptyIcon, { backgroundColor: tc.primary + '15' }]}>
            <MaterialIcons name="event-available" size={28} color={tc.primary} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>No events today</Text>
            <Text style={[styles.emptyHint, { color: tc.textSecondary }]}>Your schedule is clear!</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="event" size={20} color={tc.primary} />
          <Text style={[styles.title, { color: tc.textPrimary }]}>Upcoming Events</Text>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={[styles.viewAll, { color: tc.primary }]}>Calendar</Text>
        </Pressable>
      </View>

      {todayEvents.map(event => {
        const catColor = tc.primary;
        let timeText = 'All day';
        try {
          if (!event.is_all_day) {
            timeText = format(parseISO(event.start_datetime), 'h:mm a');
            if (event.end_datetime) {
              timeText += ' - ' + format(parseISO(event.end_datetime), 'h:mm a');
            }
          }
        } catch { /* keep 'All day' */ }

        return (
          <Pressable
            key={event.id}
            onPress={() => onEventPress(event.id)}
            style={({ pressed }) => [
              styles.eventRow,
              { backgroundColor: tc.cardBackground, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.colorBar, { backgroundColor: catColor }]} />
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: tc.textPrimary }]} numberOfLines={1}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <MaterialIcons name="access-time" size={12} color={tc.textSecondary} />
                <Text style={[styles.metaText, { color: tc.textSecondary }]}>{timeText}</Text>
                {event.location && (
                  <>
                    <MaterialIcons name="place" size={12} color={tc.textSecondary} style={{ marginLeft: 6 }} />
                    <Text style={[styles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>{event.location}</Text>
                  </>
                )}
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={tc.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  viewAll: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 0,
    borderRadius: 14,
    marginBottom: 6,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: 12,
    marginLeft: 2,
    minHeight: 36,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: typography.sizes.xs,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 14,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  emptyHint: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
