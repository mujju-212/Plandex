// src/services/notificationService.ts
// NOTE: We do NOT use top-level `import * as Notifications from 'expo-notifications'`
// because the module auto-registers a push-token listener on import, which throws
// an unrecoverable error inside Expo Go (removed since SDK 53).
// Instead we lazily require() the module only in dev-builds / production.

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Detect Expo Go — notifications module is unsupported there since SDK 53
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Returns true when notification APIs are unavailable (Expo Go or web).
 */
function isNotificationUnavailable(): boolean {
  return Platform.OS === 'web' || isExpoGo;
}

/**
 * Lazily load expo-notifications only when safe (dev-build / production).
 * Returns null in Expo Go and on web.
 */
function getNotificationsModule(): typeof import('expo-notifications') | null {
  if (isNotificationUnavailable()) return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

// Configure foreground notification behaviour (only in dev-builds / production)
if (!isNotificationUnavailable()) {
  try {
    const Notifications = getNotificationsModule();
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch {
    // Silently ignore
  }
}

/**
 * Request notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check if notification permissions are currently granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── Todo Reminders ─────────────────────────────────────────

/**
 * Schedule a notification for a todo with a due date/time.
 * Returns the notification identifier (for cancellation).
 */
export async function scheduleTodoReminder(
  todoId: number,
  title: string,
  dueDate: string,
  dueTime?: string,
): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    const trigger = buildDateTrigger(dueDate, dueTime, 0);
    if (!trigger || trigger.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Todo Reminder',
        body: title,
        data: { type: 'todo', todoId },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
    return id;
  } catch {
    return null;
  }
}

// ─── Habit Reminders ────────────────────────────────────────

/**
 * Schedule a daily repeating notification for a habit.
 * Returns the notification identifier.
 */
export async function scheduleHabitReminder(
  habitId: number,
  title: string,
  reminderTime: string,
): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    const [hours, minutes] = reminderTime.split(':').map(Number);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔄 Habit Reminder',
        body: `Time to: ${title}`,
        data: { type: 'habit', habitId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
    return id;
  } catch {
    return null;
  }
}

// ─── Event Reminders ────────────────────────────────────────

/**
 * Schedule a notification for an event.
 * Fires `minutesBefore` minutes before the event starts.
 */
export async function scheduleEventReminder(
  eventId: number,
  title: string,
  startDatetime: string,
  minutesBefore: number = 15,
): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    const eventTime = new Date(startDatetime);
    const notifyTime = new Date(eventTime.getTime() - minutesBefore * 60 * 1000);
    if (notifyTime.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Event Coming Up',
        body: `${title} starts ${minutesBefore > 0 ? `in ${minutesBefore} min` : 'now'}`,
        data: { type: 'event', eventId },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyTime },
    });
    return id;
  } catch {
    return null;
  }
}

// ─── Goal Deadline Reminder ─────────────────────────────────

/**
 * Schedule a notification 1 day before a goal's end date.
 */
export async function scheduleGoalDeadlineReminder(
  goalId: number,
  title: string,
  endDate: string,
): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    const trigger = buildDateTrigger(endDate, '09:00', 1);
    if (!trigger || trigger.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Goal Deadline Tomorrow',
        body: `"${title}" is due tomorrow. Keep going!`,
        data: { type: 'goal', goalId },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
    return id;
  } catch {
    return null;
  }
}

// ─── Cancel ─────────────────────────────────────────────────

export async function cancelNotification(notificationId: string): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

export async function getScheduledNotifications() {
  const Notifications = getNotificationsModule();
  if (!Notifications) return [];
  try { return await Notifications.getAllScheduledNotificationsAsync(); } catch { return []; }
}

// ─── Helpers ────────────────────────────────────────────────

function buildDateTrigger(
  dateStr: string,
  timeStr?: string,
  daysBefore: number = 0,
): Date | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      date.setHours(h, m, 0, 0);
    } else {
      date.setHours(9, 0, 0, 0);
    }

    if (daysBefore > 0) {
      date.setDate(date.getDate() - daysBefore);
    }

    return date;
  } catch {
    return null;
  }
}
