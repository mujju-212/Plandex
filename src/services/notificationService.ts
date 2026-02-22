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
    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

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

    const safeMinutesBefore = Math.max(0, minutesBefore);

    const eventTime = new Date(startDatetime);
    const notifyTime = new Date(eventTime.getTime() - safeMinutesBefore * 60 * 1000);
    if (notifyTime.getTime() <= Date.now()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Event Coming Up',
        body: `${title} starts ${safeMinutesBefore > 0 ? `in ${safeMinutesBefore} min` : 'now'}`,
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
  if (!notificationId || notificationId.trim() === '') return;
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
    // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Date months are 0-indexed
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;

    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        date.setHours(h, m, 0, 0);
      } else {
        date.setHours(9, 0, 0, 0);
      }
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

// ─── Daily Log Reminder (10:30 PM) ─────────────────────────

/** Unique identifiers so we can cancel & reschedule */
const DAILY_LOG_NOTIF_ID = 'daily-log-reminder';
const MORNING_SCHEDULE_NOTIF_ID = 'morning-schedule';

/**
 * Schedule a daily 10:30 PM notification reminding the user to
 * write their daily log if they haven't done so.
 * This is a repeating daily trigger – the app-level logic should
 * cancel & re-schedule each day after the log is completed.
 */
export async function scheduleDailyLogReminder(): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    // Cancel any existing daily-log reminder first
    try { await Notifications.cancelScheduledNotificationAsync(DAILY_LOG_NOTIF_ID); } catch {}

    const id = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_LOG_NOTIF_ID,
      content: {
        title: '📝 Daily Log Reminder',
        body: "You haven't written your daily log yet. Take a moment to reflect on your day!",
        data: { type: 'daily_log_reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 22,
        minute: 30,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Cancel the daily log reminder (e.g. after user completes today's log).
 */
export async function cancelDailyLogReminder(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  try { await Notifications.cancelScheduledNotificationAsync(DAILY_LOG_NOTIF_ID); } catch {}
}

// ─── Morning Schedule Notification (7:00 AM) ────────────────

/**
 * Schedule a daily 7:00 AM notification summarizing today's events.
 * Call this once on app start – it repeats daily.
 * The body text is generic; a richer version can be scheduled each
 * evening with the next-day's specific event list via
 * `scheduleMorningScheduleWithEvents()`.
 */
export async function scheduleMorningScheduleNotification(): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    // Cancel any existing morning notification first
    try { await Notifications.cancelScheduledNotificationAsync(MORNING_SCHEDULE_NOTIF_ID); } catch {}

    const id = await Notifications.scheduleNotificationAsync({
      identifier: MORNING_SCHEDULE_NOTIF_ID,
      content: {
        title: '🌅 Good Morning!',
        body: 'Check your schedule and plan your day ahead.',
        data: { type: 'morning_schedule' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 0,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/**
 * Schedule tomorrow morning's notification with a specific event summary.
 * Call this in the evening (e.g. after loading tomorrow's events) for
 * a richer notification body.
 */
export async function scheduleMorningScheduleWithEvents(
  eventCount: number,
  eventTitles: string[],
): Promise<string | null> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  try {
    const granted = await hasNotificationPermission();
    if (!granted) return null;

    // Cancel any existing morning notification first
    try { await Notifications.cancelScheduledNotificationAsync(MORNING_SCHEDULE_NOTIF_ID); } catch {}

    let body: string;
    if (eventCount === 0) {
      body = 'No events scheduled for today. Enjoy a relaxed day!';
    } else if (eventCount === 1) {
      body = `You have 1 event today: ${eventTitles[0] ?? 'Untitled'}`;
    } else {
      const listed = eventTitles.slice(0, 3).join(', ');
      const more = eventCount > 3 ? ` and ${eventCount - 3} more` : '';
      body = `You have ${eventCount} events today: ${listed}${more}`;
    }

    const id = await Notifications.scheduleNotificationAsync({
      identifier: MORNING_SCHEDULE_NOTIF_ID,
      content: {
        title: '🌅 Good Morning!',
        body,
        data: { type: 'morning_schedule', eventCount },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 0,
      },
    });
    return id;
  } catch {
    return null;
  }
}
