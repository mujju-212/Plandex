import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { Alert, Appearance, Text, View } from 'react-native';
import { initializeDatabase } from '../src/database/schema';
import { useNotifications } from '../src/hooks/useNotifications';
import { useThemeStore } from '../src/stores/useThemeStore';

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { isDark, colors: themeColors, loadTheme } = useThemeStore();

  // Sync Appearance color scheme with app theme so native Android dialogs (date/time pickers) follow dark mode
  useEffect(() => {
    Appearance.setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  // Check for OTA updates on app launch
  useEffect(() => {
    async function checkForOTAUpdate() {
      if (__DEV__) return; // Skip in development mode
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
