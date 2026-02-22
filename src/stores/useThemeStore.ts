import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const THEME_KEY = 'app_theme';

export const lightColors = {
    primary: '#4A9BE2',
    primaryLight: '#85C1E9',
    primaryDark: '#2980B9',
    background: '#F4F9FF',
    cardBackground: '#FFFFFF',
    textPrimary: '#1E3253',
    textSecondary: '#6B82A8',
    textWhite: '#FFFFFF',
    success: '#66C38A',
    warning: '#F5B041',
    danger: '#E74C3C',
    tagWork: '#4A9BE2',
    tagPersonal: '#66C38A',
    tagHealth: '#E74C3C',
    border: '#E0EBF5',
    gradientStart: '#7FB3FA',
    gradientEnd: '#4CA1F0',
};

export const darkColors = {
    primary: '#D4A843',
    primaryLight: '#E8C76B',
    primaryDark: '#B8922E',
    background: '#000000',
    cardBackground: '#141414',
    textPrimary: '#F0E6D2',
    textSecondary: '#8A8070',
    textWhite: '#FFFFFF',
    success: '#4ADE80',
    warning: '#D4A843',
    danger: '#F87171',
    tagWork: '#D4A843',
    tagPersonal: '#4ADE80',
    tagHealth: '#F87171',
    border: '#2A2520',
    gradientStart: '#D4A843',
    gradientEnd: '#B8922E',
};

export type ThemeColors = typeof lightColors;

interface ThemeState {
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
    loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    isDark: false,
    colors: lightColors,

    toggleTheme: async () => {
        const newIsDark = !get().isDark;
        set({ isDark: newIsDark, colors: newIsDark ? darkColors : lightColors });
        try {
            await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newIsDark));
        } catch (e) {
            console.warn('Failed to persist theme preference:', e);
        }
    },

    loadTheme: async () => {
        try {
            const raw = await AsyncStorage.getItem(THEME_KEY);
            if (raw !== null) {
                const isDark = JSON.parse(raw);
                set({ isDark, colors: isDark ? darkColors : lightColors });
            }
        } catch (e) {
            console.warn('Failed to load theme preference:', e);
        }
    },
}));
