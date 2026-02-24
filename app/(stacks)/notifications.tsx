import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../src/components/common/Card';
import { cancelAllNotifications, cancelNotification, getScheduledNotifications, hasNotificationPermission } from '../../src/services/notificationService';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';

interface ScheduledNotif {
  identifier: string;
  title: string;
  body: string;
  type: string;
  triggerDate?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { notificationsEnabled } = useSettingsStore();
  const [notifications, setNotifications] = useState<ScheduledNotif[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const granted = await hasNotificationPermission();
      setPermissionGranted(granted);

      if (Platform.OS === 'web' || !granted) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const scheduled = await getScheduledNotifications();
      const mapped: ScheduledNotif[] = scheduled.map((n: any) => {
        const data = n.content?.data || {};
        let triggerDate: string | undefined;
        if (n.trigger?.type === 'date' && n.trigger?.date) {
          triggerDate = new Date(n.trigger.date).toLocaleString();
        } else if (n.trigger?.type === 'daily') {
          const h = String(n.trigger.hour ?? 0).padStart(2, '0');
          const m = String(n.trigger.minute ?? 0).padStart(2, '0');
          triggerDate = `Daily at ${h}:${m}`;
        }
        return {
          identifier: n.identifier,
          title: n.content?.title || 'Notification',
          body: n.content?.body || '',
          type: data.type || 'unknown',
          triggerDate,
        };
      });

      // Sort by trigger date
      mapped.sort((a, b) => {
        if (!a.triggerDate) return 1;
        if (!b.triggerDate) return -1;
        return a.triggerDate.localeCompare(b.triggerDate);
      });

      setNotifications(mapped);
    } catch (e) {
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleCancelOne = async (id: string) => {
    await cancelNotification(id);
    setNotifications(prev => prev.filter(n => n.identifier !== id));
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    setNotifications([]);
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'todo': return 'check-circle';
      case 'habit': return 'loop';
      case 'event': return 'event';
      case 'goal': return 'flag';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'todo': return tc.primary;
      case 'habit': return '#00BFA5';
      case 'event': return '#FF9800';
      case 'goal': return '#9C27B0';
      default: return tc.textSecondary;
    }
  };

  const renderNotification = ({ item }: { item: ScheduledNotif }) => (
    <Card style={styles.notifCard}>
      <View style={styles.notifRow}>
        <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <MaterialIcons name={getTypeIcon(item.type) as any} size={20} color={getTypeColor(item.type)} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: tc.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.notifBody, { color: tc.textSecondary }]} numberOfLines={2}>{item.body}</Text>
          {item.triggerDate && (
            <View style={styles.triggerRow}>
              <MaterialIcons name="schedule" size={12} color={tc.textSecondary} />
              <Text style={[styles.triggerText, { color: tc.textSecondary }]}>{item.triggerDate}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => handleCancelOne(item.identifier)} hitSlop={10}>
          <MaterialIcons name="close" size={18} color={tc.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name={!notificationsEnabled ? 'notifications-off' : (!permissionGranted ? 'notifications-paused' : 'notifications-none')}
        size={64}
        color={tc.textSecondary + '60'}
      />
      <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>
        {!notificationsEnabled
          ? 'Notifications Disabled'
          : !permissionGranted
            ? 'Permission Not Granted'
            : 'No Scheduled Reminders'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
        {!notificationsEnabled
          ? 'Enable notifications in Settings to receive reminders.'
          : !permissionGranted
            ? 'Allow notifications in your device settings to use reminders.'
            : 'Create todos, events, habits, or goals with reminders and they will appear here.'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: tc.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Notifications</Text>
        {notifications.length > 0 && (
          <Pressable onPress={handleCancelAll} style={styles.clearBtn}>
            <Text style={[styles.clearBtnText, { color: tc.danger }]}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Count badge */}
      {notifications.length > 0 && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: tc.textSecondary }]}>
            {notifications.length} scheduled reminder{notifications.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.identifier}
          renderItem={renderNotification}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: typography.weights.semiBold as any },
  clearBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  clearBtnText: { fontSize: 14, fontWeight: typography.weights.medium as any },
  countRow: { paddingHorizontal: 20, paddingBottom: 8 },
  countText: { fontSize: 13, fontWeight: typography.weights.regular as any },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyList: { flexGrow: 1 },
  notifCard: { marginBottom: 10, padding: 14 },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: typography.weights.semiBold as any, marginBottom: 2 },
  notifBody: { fontSize: 13, fontWeight: typography.weights.regular as any, marginBottom: 4 },
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  triggerText: { fontSize: 11, fontWeight: typography.weights.regular as any },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: typography.weights.semiBold as any, marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: typography.weights.regular as any, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
