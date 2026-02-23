import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEventStore } from '../../../src/stores/useEventStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { events, deleteEvent, completeEvent } = useEventStore();

  const event = events.find(e => e.id === Number(id));

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Event</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}><Text style={[styles.emptyText, { color: tc.textSecondary }]}>Event not found</Text></View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteEvent(event.id); router.back(); } },
    ]);
  };

  const formatDt = (dt: string) => {
    try { return format(new Date(dt), 'MMM d, yyyy  h:mm a'); } catch { return dt; }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} /></Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Event Detail</Text>
        <Pressable onPress={() => router.push(`/event/edit?id=${event.id}`)} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="edit" size={22} color={tc.primary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.colorBar, { backgroundColor: event.color }]} />
        <Text style={[styles.title, { color: tc.textPrimary }]}>{event.title}</Text>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: event.color + '20' }]}>
            <Text style={[styles.badgeText, { color: event.color }]}>{event.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: event.status === 'completed' ? tc.success + '20' : tc.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: event.status === 'completed' ? tc.success : tc.primary }]}>{event.status}</Text>
          </View>
          {event.is_all_day && <View style={[styles.badge, { backgroundColor: tc.warning + '20' }]}><Text style={[styles.badgeText, { color: tc.warning }]}>All Day</Text></View>}
          {event.is_recurring && <View style={[styles.badge, { backgroundColor: '#9C27B0' + '20' }]}><Text style={[styles.badgeText, { color: '#9C27B0' }]}>Recurring</Text></View>}
        </View>

        {event.description && <Text style={[styles.description, { color: tc.textSecondary }]}>{event.description}</Text>}

        <View style={[styles.infoCard, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.infoRow}><MaterialIcons name="event" size={20} color={tc.primary} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Start</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{formatDt(event.start_datetime)}</Text></View>
          {event.end_datetime && (
            <><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /><View style={styles.infoRow}><MaterialIcons name="event-busy" size={20} color={tc.warning} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>End</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{formatDt(event.end_datetime)}</Text></View></>
          )}
          {event.location && (
            <><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /><View style={styles.infoRow}><MaterialIcons name="location-on" size={20} color={tc.danger} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Location</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>{event.location}</Text></View></>
          )}
          {event.is_recurring && event.recurring_pattern && (
            <><View style={[styles.infoDivider, { backgroundColor: tc.border }]} /><View style={styles.infoRow}><MaterialIcons name="repeat" size={20} color={'#9C27B0'} /><Text style={[styles.infoLabel, { color: tc.textSecondary }]}>Repeats</Text><Text style={[styles.infoValue, { color: tc.textPrimary }]}>Every {event.recurring_pattern.interval} {event.recurring_pattern.type}{event.recurring_pattern.end_date ? ` until ${event.recurring_pattern.end_date}` : ''}</Text></View></>
          )}
        </View>

        <View style={styles.actions}>
          {event.status !== 'completed' && (
            <Pressable style={[styles.actionBtn, { backgroundColor: tc.success + '15' }]} onPress={() => completeEvent(event.id)}>
              <MaterialIcons name="check-circle" size={20} color={tc.success} />
              <Text style={[styles.actionText, { color: tc.success }]}>Complete</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, { backgroundColor: tc.danger + '15' }]} onPress={handleDelete}>
            <MaterialIcons name="delete" size={20} color={tc.danger} />
            <Text style={[styles.actionText, { color: tc.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.cardBackground },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  emptyContainer: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  emptyText: { fontSize: typography.sizes.md, color: colors.textSecondary },
  scrollContent: { padding: 20 },
  colorBar: { height: 6, borderRadius: 3, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: typography.weights.bold as any, color: colors.textPrimary, marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any, textTransform: 'capitalize' as const },
  description: { fontSize: typography.sizes.md, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  infoCard: { backgroundColor: colors.cardBackground, borderRadius: 16, overflow: 'hidden' as const, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary, minWidth: 70 },
  infoValue: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right' as const, fontWeight: typography.weights.medium as any },
  infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 46 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 14, borderRadius: 14 },
  actionText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
});
