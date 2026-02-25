import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SETTINGS_KEY = 'app_settings';

interface SettingsState {
    notificationsEnabled: boolean;
    toggleNotifications: () => void;
    loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    notificationsEnabled: true,

    toggleNotifications: async () => {
        const newVal = !get().notificationsEnabled;
        set({ notificationsEnabled: newVal });
        try {
            const raw = await AsyncStorage.getItem(SETTINGS_KEY);
            const settings = raw ? JSON.parse(raw) : {};
            settings.notificationsEnabled = newVal;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch { }
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
