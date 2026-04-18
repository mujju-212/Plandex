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
  'profile_profession',
  'profile_photo_uri',
];

function parseAsyncValue(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function stringifyAsyncValue(value: any): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

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
  'sticky_notes',
  'mood_entries',
  'expenses',
  'expense_categories',
  'planning_files',
  'planning_notes',
  'planning_projects',
  'focus_sessions',
  'alarms',
];

// ─── Column whitelist per table (prevents SQL injection on import) ───
const TABLE_COLUMNS: Record<string, Set<string>> = {
  habit_completions: new Set(['id', 'habit_id', 'date', 'completed_at', 'notes']),
  habits: new Set([
    'id', 'title', 'description', 'category', 'frequency_type', 'specific_days',
    'times_per_week', 'time_of_day', 'reminder_time', 'color', 'icon',
    'current_streak', 'longest_streak', 'total_completions', 'is_active',
    'start_date', 'end_date', 'created_at', 'updated_at',
  ]),
  goal_milestones: new Set(['id', 'goal_id', 'title', 'is_completed', 'completed_at', 'position']),
  goals: new Set([
    'id', 'title', 'description', 'category', 'priority', 'status', 'progress',
    'target_value', 'current_value', 'unit', 'start_date', 'end_date',
    'completion_notes', 'created_at', 'updated_at',
  ]),
  todos: new Set([
    'id', 'list_id', 'title', 'description', 'priority', 'status', 'date_type',
    'start_date', 'end_date', 'due_time', 'is_recurring', 'tags', 'position',
    'created_at', 'updated_at', 'completed_at',
  ]),
  todo_lists: new Set(['id', 'name', 'color', 'icon', 'position', 'is_default', 'created_at']),
  daily_logs: new Set([
    'id', 'date', 'what_i_did', 'achievements', 'learnings', 'challenges',
    'tomorrow_intention', 'gratitude', 'productivity_rating', 'satisfaction_rating',
    'completion_rating', 'energy_rating', 'overall_rating', 'mood', 'tags',
    'created_at', 'updated_at',
  ]),
  user_badges: new Set(['badge_id']),
  user_stats: new Set([
    'id', 'total_xp', 'current_level', 'current_log_streak',
    'longest_log_streak', 'total_todos_completed', 'last_active_date',
  ]),
  events: new Set([
    'id', 'title', 'description', 'start_datetime', 'end_datetime', 'location',
    'color', 'reminder_minutes', 'is_all_day', 'recurrence', 'status',
    'created_at', 'updated_at',
  ]),
  sticky_notes: new Set(['id', 'content', 'color', 'position_x', 'position_y', 'width', 'height', 'created_at', 'updated_at']),
  mood_entries: new Set(['id', 'date', 'mood', 'energy', 'notes', 'factors', 'created_at']),
  expenses: new Set(['id', 'amount', 'category_id', 'description', 'date', 'payment_method', 'notes', 'created_at']),
  expense_categories: new Set(['id', 'name', 'icon', 'color', 'budget', 'is_default']),
  planning_files: new Set(['id', 'project_id', 'name', 'uri', 'type', 'size', 'created_at']),
  planning_notes: new Set(['id', 'project_id', 'title', 'content', 'created_at', 'updated_at']),
  planning_projects: new Set(['id', 'name', 'description', 'color', 'icon', 'status', 'created_at', 'updated_at']),
  focus_sessions: new Set(['id', 'session_type', 'duration_minutes', 'actual_seconds', 'status', 'started_at', 'ended_at', 'linked_todo_id']),
  alarms: new Set(['id', 'time', 'label', 'is_enabled', 'repeat_days', 'sound', 'created_at']),
};

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
        if (raw !== null) data[key] = parseAsyncValue(raw);
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
        if (raw !== null) data[`async_${key}`] = parseAsyncValue(raw);
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

  if (!data._version || typeof data._version !== 'string') {
    throw new Error('Not a valid Plandex backup file.');
  }
  if (typeof data._exportedAt !== 'string') {
    throw new Error('Backup file is missing export timestamp.');
  }

  if (Platform.OS === 'web') {
    // Web → AsyncStorage
    for (const key of ASYNC_KEYS) {
      const value = data[key] ?? data[`async_${key}`];
      if (value !== undefined) {
        await AsyncStorage.setItem(key, stringifyAsyncValue(value));
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
          // Only allow whitelisted column names to prevent SQL injection
          const whitelist = TABLE_COLUMNS[table];
          if (!whitelist) continue;
          const keys = Object.keys(row).filter(k => whitelist.has(k));
          if (keys.length === 0) continue;
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
        await AsyncStorage.setItem(key, stringifyAsyncValue(value));
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
      await db.execAsync(`
        INSERT INTO expense_categories (name, icon, color, is_default) VALUES
          ('Food & Drinks', 'restaurant', '#FF7042', 1),
          ('Transport', 'directions-car', '#42A5F5', 1),
          ('Shopping', 'shopping-bag', '#AB47BC', 1),
          ('Bills', 'receipt', '#26A69A', 1),
          ('Entertainment', 'movie', '#FFA726', 1),
          ('Health', 'local-hospital', '#EF5350', 1),
          ('Education', 'school', '#5C6BC0', 1),
          ('Other', 'more-horiz', '#78909C', 1);
      `);
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
        dialogTitle: 'Save Plandex Backup',
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
