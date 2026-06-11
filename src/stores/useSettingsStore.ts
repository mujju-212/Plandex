import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { cancelAllNotifications } from '../services/notificationService';
import type { TimeFormatPreference } from '../utils/dateUtils';

const SETTINGS_KEY = 'app_settings';

interface SettingsState {
    notificationsEnabled: boolean;
    timeFormat: TimeFormatPreference;
    toggleNotifications: () => Promise<void>;
    setTimeFormat: (value: TimeFormatPreference) => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    notificationsEnabled: true,
    timeFormat: '24h',

    toggleNotifications: async () => {
        const previous = get().notificationsEnabled;
        const newVal = !previous;
        set({ notificationsEnabled: newVal });

        try {
            // If disabling, cancel all scheduled notifications
            if (!newVal) {
                await cancelAllNotifications();
            }

            const raw = await AsyncStorage.getItem(SETTINGS_KEY);
            const settings = raw ? JSON.parse(raw) : {};
            settings.notificationsEnabled = newVal;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch {
            // Rollback on failure
            set({ notificationsEnabled: previous });
        }
    },

    setTimeFormat: async (value) => {
        const previous = get().timeFormat;
        set({ timeFormat: value });

        try {
            const raw = await AsyncStorage.getItem(SETTINGS_KEY);
            const settings = raw ? JSON.parse(raw) : {};
            settings.timeFormat = value;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch {
            set({ timeFormat: previous });
        }
    },

    loadSettings: async () => {
        try {
            const raw = await AsyncStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const settings = JSON.parse(raw);
                if (settings.notificationsEnabled !== undefined) {
                    set({ notificationsEnabled: settings.notificationsEnabled });
                }
                if (settings.timeFormat === '12h' || settings.timeFormat === '24h') {
                    set({ timeFormat: settings.timeFormat });
                }
            }
        } catch { }
    },
}));
