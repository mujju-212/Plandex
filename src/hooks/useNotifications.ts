import { useEffect, useRef } from 'react';
import {
    cancelDailyLogReminder,
    requestNotificationPermissions,
    scheduleDailyLogReminder,
    scheduleMorningScheduleNotification,
} from '../services/notificationService';

/**
 * Hook that initialises daily notification schedules on app start:
 * - 10:30 PM daily-log reminder (repeating daily)
 * - 7:00 AM morning schedule notification (repeating daily)
 *
 * Call once in the root layout after the database has been initialised.
 *
 * @param dailyLogCompletedToday - pass `true` when the user has already
 *   written today's daily log so the 10:30 PM nag is suppressed.
 */
export function useNotifications(dailyLogCompletedToday = false) {
  const scheduled = useRef(false);

  useEffect(() => {
    if (scheduled.current) return;
    scheduled.current = true;

    (async () => {
      const granted = await requestNotificationPermissions();
      if (!granted) return;

      // 7 AM morning schedule – always active
      await scheduleMorningScheduleNotification();

      // 10:30 PM daily-log reminder – always reschedule
      // (it repeats daily; we cancel when the log is completed)
      await scheduleDailyLogReminder();
    })();
  }, []);

  // If the daily log was completed today, cancel the nag for tonight
  useEffect(() => {
    if (dailyLogCompletedToday) {
      cancelDailyLogReminder();
    } else {
      // Re-schedule in case it was cancelled earlier today
      scheduleDailyLogReminder();
    }
  }, [dailyLogCompletedToday]);
}
