import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { Alert, Appearance, Platform, Text, View } from 'react-native';
import { initializeDatabase } from '../src/database/schema';
import { useNotifications } from '../src/hooks/useNotifications';
import {
    ALARM_ACTION_SNOOZE,
    ALARM_ACTION_STOP,
} from '../src/services/notificationService';
import { useThemeStore } from '../src/stores/useThemeStore';

export default function RootLayout() {
  const router = useRouter();
  const [dbInitialized, setDbInitialized] = useState(false);
  const { isDark, colors: themeColors, loadTheme } = useThemeStore();

  // Sync Appearance color scheme with app theme so native Android dialogs (date/time pickers) follow dark mode
  useEffect(() => {
    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(isDark ? 'dark' : 'light');
    }
  }, [isDark]);

  // Check for OTA updates on app launch
  useEffect(() => {
    async function checkForOTAUpdate() {
      const isExpoGo = Constants.appOwnership === 'expo';
      if (__DEV__ || isExpoGo) return; // Skip in dev and Expo Go
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available',
            'A new version has been downloaded. Restart the app to apply the update.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart Now', onPress: () => Updates.reloadAsync() },
            ]
          );
        }
      } catch (e) {
        // Silently fail — update check is non-critical
        console.log('OTA update check failed:', e);
      }
    }
    checkForOTAUpdate();
  }, []);

  // Schedule daily notifications (7 AM morning schedule + 10:30 PM log reminder)
  useNotifications();

  useEffect(() => {
    if (!dbInitialized) return;

    const isExpoGo = Constants.appOwnership === 'expo';
    if (Platform.OS === 'web' || isExpoGo) return;

    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    const handleAlarmNotificationResponse = (
      response: import('expo-notifications').NotificationResponse,
      Notifications: typeof import('expo-notifications'),
    ) => {
      const data = response.notification.request.content.data as {
        type?: string;
        alarmId?: number | string;
      };

      if (data?.type !== 'alarm' || data.alarmId === undefined || data.alarmId === null) {
        return;
      }

      const alarmId = String(data.alarmId);
      const actionIdentifier = response.actionIdentifier;

      let alarmAction = 'open';
      if (actionIdentifier === ALARM_ACTION_SNOOZE) alarmAction = ALARM_ACTION_SNOOZE;
      if (actionIdentifier === ALARM_ACTION_STOP) alarmAction = ALARM_ACTION_STOP;
      if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) alarmAction = 'open';

      router.push({
        pathname: '/clock',
        params: {
          alarmId,
          alarmAction,
          alarmTrigger: String(Date.now()),
        },
      } as any);
    };

    try {
      const Notifications = require('expo-notifications') as typeof import('expo-notifications');

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        if (!isMounted) return;
        handleAlarmNotificationResponse(response, Notifications);
      });

      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (!isMounted || !response) return;
          handleAlarmNotificationResponse(response, Notifications);
        })
        .catch(() => {
          // ignore startup response lookup failures
        });
    } catch {
      // ignore missing notifications module in incompatible runtime
    }

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [dbInitialized, router]);

  useEffect(() => {
    async function setup() {
      try {
        await loadTheme();
        await initializeDatabase();
        setDbInitialized(true);
      } catch (e) {
        console.error("DB Init Error:", e);
      }
    }
    setup();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: themeColors.textSecondary }}>Initializing Base...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.background },
          animation: 'ios_from_right',
          navigationBarColor: themeColors.background,
          freezeOnBlur: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade', animationDuration: 0 }} />
        <Stack.Screen
          name="(stacks)/todo/create"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  );
}
