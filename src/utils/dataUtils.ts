import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ALL_KEYS = [
    'todos_data',
    'events_data',
    'goals_data',
    'habits_data',
    'habit_completions_data',
    'daily_logs_data',
    'user_stats',
    'user_badges',
    'app_theme',
    'app_settings',
];

export async function exportAllData(): Promise<string> {
    const data: Record<string, any> = {};
    for (const key of ALL_KEYS) {
        try {
            const raw = await AsyncStorage.getItem(key);
            if (raw) data[key] = JSON.parse(raw);
        } catch { }
    }
    data._exportedAt = new Date().toISOString();
    data._version = '1.0.0';
    return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
    try {
        const data = JSON.parse(jsonString);
        for (const key of ALL_KEYS) {
            if (data[key] !== undefined) {
                await AsyncStorage.setItem(key, JSON.stringify(data[key]));
            }
        }
    } catch (e: any) {
        throw new Error('Invalid backup file: ' + e.message);
    }
}

export async function clearAllData(): Promise<void> {
    for (const key of ALL_KEYS) {
        try { await AsyncStorage.removeItem(key); } catch { }
    }
}

export function downloadJSON(jsonString: string, filename: string) {
    if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export function triggerImportDialog(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) { reject(new Error('No file selected')); return; }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    resolve(ev.target?.result as string);
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            };
            input.click();
        } else {
            reject(new Error('Import from file is only supported on web'));
        }
    });
}
