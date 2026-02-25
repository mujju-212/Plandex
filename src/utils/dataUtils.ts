import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getDB } from '../database/database';

// ─── AsyncStorage keys used by the app ──────────────────────
const ASYNC_KEYS = [
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
  'user_profile',
  'profile_name',
  'profile_photo_uri',
];

// SQLite table names (order matters — children before parents for import)
const SQLITE_TABLES = [
  'habit_completions',
  'habits',
  'goal_milestones',
  'goals',
  'todos',
  'todo_lists',
  'daily_logs',
  'user_badges',
  'user_stats',
  'events',
];

// ═══════════════════════════════════════════════════════════
//  EXPORT — collects all data into one JSON string
// ═══════════════════════════════════════════════════════════

export async function exportAllData(): Promise<string> {
  const data: Record<string, any> = {};

  if (Platform.OS === 'web') {
    // Web: everything is in AsyncStorage
    for (const key of ASYNC_KEYS) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch { }
    }
  } else {
    // Native: main data is in SQLite, settings/profile in AsyncStorage
    const db = await getDB();
    for (const table of SQLITE_TABLES) {
      try {
        const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
        data[`sqlite_${table}`] = rows;
      } catch { }
    }

    // Also grab AsyncStorage keys (settings, theme, profile)
    for (const key of ASYNC_KEYS) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) data[`async_${key}`] = JSON.parse(raw);
      } catch { }
    }
  }

  data._exportedAt = new Date().toISOString();
  data._version = '1.0.0';
  data._platform = Platform.OS;

  return JSON.stringify(data, null, 2);
}

// ═══════════════════════════════════════════════════════════
//  IMPORT — restores all data from a JSON string
// ═══════════════════════════════════════════════════════════

export async function importAllData(jsonString: string): Promise<void> {
  let data: Record<string, any>;
  try {
    data = JSON.parse(jsonString);
  } catch (e: any) {
    throw new Error('Invalid backup file: ' + e.message);
  }

  if (!data._version) {
    throw new Error('Not a valid MyPlanner backup file.');
  }

  if (Platform.OS === 'web') {
    // Web → AsyncStorage
    for (const key of ASYNC_KEYS) {
      const value = data[key] ?? data[`async_${key}`];
      if (value !== undefined) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    }
    // If source was native-exported, also import SQLite arrays into AsyncStorage
    if (data['sqlite_todos']) {
      await AsyncStorage.setItem('todos_data', JSON.stringify(data['sqlite_todos']));
    }
    if (data['sqlite_events']) {
      await AsyncStorage.setItem('events_data', JSON.stringify(data['sqlite_events']));
    }
    if (data['sqlite_habits']) {
      await AsyncStorage.setItem('habits_data', JSON.stringify(data['sqlite_habits']));
    }
    if (data['sqlite_goals']) {
      await AsyncStorage.setItem('goals_data', JSON.stringify(data['sqlite_goals']));
    }
    if (data['sqlite_daily_logs']) {
      await AsyncStorage.setItem('daily_logs_data', JSON.stringify(data['sqlite_daily_logs']));
    }
  } else {
    // Native → SQLite + AsyncStorage
    const db = await getDB();

    // Clear existing data first (children before parents)
    for (const table of SQLITE_TABLES) {
      try { await db.runAsync(`DELETE FROM ${table}`); } catch { }
    }

    // Import SQLite data — check both `sqlite_X` (native export) and plain keys (web export)
    for (const table of [...SQLITE_TABLES].reverse()) {
      const rows: any[] = data[`sqlite_${table}`]
        ?? (table === 'todos' ? data['todos_data'] : null)
        ?? (table === 'events' ? data['events_data'] : null)
        ?? (table === 'habits' ? data['habits_data'] : null)
        ?? (table === 'goals' ? data['goals_data'] : null)
        ?? (table === 'daily_logs' ? data['daily_logs_data'] : null)
        ?? [];

      for (const row of rows) {
        try {
          const keys = Object.keys(row);
          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map(k => {
            const v = row[k];
            if (v === null || v === undefined) return null;
            if (typeof v === 'object') return JSON.stringify(v);
            return v;
          });
          await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
            values,
          );
        } catch { }
      }
    }

    // AsyncStorage settings/profile
    for (const key of ASYNC_KEYS) {
      const value = data[`async_${key}`] ?? data[key];
      if (value !== undefined) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  CLEAR ALL DATA
// ═══════════════════════════════════════════════════════════

export async function clearAllData(): Promise<void> {
  // Clear AsyncStorage
  for (const key of ASYNC_KEYS) {
    try { await AsyncStorage.removeItem(key); } catch { }
  }

  // Clear SQLite on native
  if (Platform.OS !== 'web') {
    try {
      const db = await getDB();
      for (const table of SQLITE_TABLES) {
        await db.runAsync(`DELETE FROM ${table}`);
      }
      // Re-seed defaults
      await db.runAsync('INSERT INTO user_stats (total_xp, current_level) VALUES (0, 1)');
      await db.runAsync(
        "INSERT INTO todo_lists (name, color, icon, position, is_default) VALUES ('General', '#1A73E8', 'playlist-check', 0, 1)",
      );
    } catch { }
  }
}

// ═══════════════════════════════════════════════════════════
//  DOWNLOAD / SHARE FILE — platform-aware
// ═══════════════════════════════════════════════════════════

export async function downloadJSON(jsonString: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Web: use Blob + anchor download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // Native: write to cache dir then share
    const filePath = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Save MyPlanner Backup',
        UTI: 'public.json',
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  IMPORT FILE PICKER — platform-aware
// ═══════════════════════════════════════════════════════════

export async function triggerImportDialog(): Promise<string> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) { reject(new Error('No file selected')); return; }
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      };
      input.click();
    });
  } else {
    // Native: use expo-document-picker
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      throw new Error('No file selected');
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return content;
  }
}
