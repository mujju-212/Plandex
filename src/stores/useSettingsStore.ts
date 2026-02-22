import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { cancelAllNotifications } from '../services/notificationService';

const SETTINGS_KEY = 'app_settings';

interface SettingsState {
    notificationsEnabled: boolean;
    toggleNotifications: () => Promise<void>;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    notificationsEnabled: true,

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

    loadSettings: async () => {
        try {
            const raw = await AsyncStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const settings = JSON.parse(raw);
                if (settings.notificationsEnabled !== undefined) {
                    set({ notificationsEnabled: settings.notificationsEnabled });
                }
            }
        } catch { }
    },
}));
