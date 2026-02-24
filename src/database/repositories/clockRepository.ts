import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Alarm, CreateAlarmInput, CreateFocusSessionInput, FocusSession, UpdateAlarmInput } from '../../types/clock.types';
import { getDB } from '../database';

const ALARM_KEY = 'alarms';
const SESSION_KEY = 'focus_sessions';

const getWeb = async <T>(key: string): Promise<T[]> => { const r = await AsyncStorage.getItem(key); return r ? JSON.parse(r) : []; };
const saveWeb = async <T>(key: string, data: T[]) => AsyncStorage.setItem(key, JSON.stringify(data));

const mapAlarm = (row: any): Alarm => ({
  ...row,
  is_enabled: !!row.is_enabled,
  vibrate: !!row.vibrate,
  repeat_days: typeof row.repeat_days === 'string' ? JSON.parse(row.repeat_days) : row.repeat_days || [],
});
const mapSession = (row: any): FocusSession => ({ ...row });

class ClockRepository {
  // ── Alarms ──
  async insertAlarm(input: CreateAlarmInput): Promise<Alarm> {
    if (Platform.OS === 'web') {
      const all = await getWeb<Alarm>(ALARM_KEY);
      const a: Alarm = { id: Date.now(), label: input.label || 'Alarm', hour: input.hour, minute: input.minute, is_enabled: true, repeat_days: input.repeat_days || [], sound_uri: input.sound_uri || null, sound_name: input.sound_name || 'Default', vibrate: input.vibrate !== false, created_at: new Date().toISOString() };
      await saveWeb(ALARM_KEY, [a, ...all]);
      return a;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO alarms (label, hour, minute, repeat_days, sound_uri, sound_name, vibrate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [input.label || 'Alarm', input.hour, input.minute, JSON.stringify(input.repeat_days || []), input.sound_uri || null, input.sound_name || 'Default', input.vibrate !== false ? 1 : 0]
    );
    const row = await db.getFirstAsync('SELECT * FROM alarms WHERE id = ?', [r.lastInsertRowId]);
    return mapAlarm(row);
  }

  async getAllAlarms(): Promise<Alarm[]> {
    if (Platform.OS === 'web') return getWeb<Alarm>(ALARM_KEY);
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM alarms ORDER BY hour ASC, minute ASC');
    return rows.map(mapAlarm);
  }

  async updateAlarm(id: number, input: UpdateAlarmInput): Promise<Alarm> {
    if (Platform.OS === 'web') {
      const all = await getWeb<Alarm>(ALARM_KEY);
      const idx = all.findIndex(a => a.id === id);
      if (idx === -1) throw new Error('Alarm not found');
      all[idx] = { ...all[idx], ...input } as Alarm;
      await saveWeb(ALARM_KEY, all);
      return all[idx];
    }
    const db = getDB();
    const sets: string[] = [];
    const params: any[] = [];
    if (input.label !== undefined) { sets.push('label = ?'); params.push(input.label); }
    if (input.hour !== undefined) { sets.push('hour = ?'); params.push(input.hour); }
    if (input.minute !== undefined) { sets.push('minute = ?'); params.push(input.minute); }
    if (input.is_enabled !== undefined) { sets.push('is_enabled = ?'); params.push(input.is_enabled ? 1 : 0); }
    if (input.repeat_days !== undefined) { sets.push('repeat_days = ?'); params.push(JSON.stringify(input.repeat_days)); }
    if (input.sound_uri !== undefined) { sets.push('sound_uri = ?'); params.push(input.sound_uri); }
    if (input.sound_name !== undefined) { sets.push('sound_name = ?'); params.push(input.sound_name); }
    if (input.vibrate !== undefined) { sets.push('vibrate = ?'); params.push(input.vibrate ? 1 : 0); }
    await db.runAsync(`UPDATE alarms SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    const row = await db.getFirstAsync('SELECT * FROM alarms WHERE id = ?', [id]);
    return mapAlarm(row);
  }

  async deleteAlarm(id: number): Promise<void> {
    if (Platform.OS === 'web') { await saveWeb(ALARM_KEY, (await getWeb<Alarm>(ALARM_KEY)).filter(a => a.id !== id)); return; }
    const db = getDB();
    await db.runAsync('DELETE FROM alarms WHERE id = ?', [id]);
  }

  // ── Focus Sessions ──
  async insertSession(input: CreateFocusSessionInput): Promise<FocusSession> {
    if (Platform.OS === 'web') {
      const all = await getWeb<FocusSession>(SESSION_KEY);
      const s: FocusSession = { id: Date.now(), session_type: input.session_type || 'pomodoro', duration_minutes: input.duration_minutes, actual_seconds: 0, status: 'in_progress', linked_todo_id: input.linked_todo_id || null, linked_goal_id: input.linked_goal_id || null, notes: input.notes || null, started_at: new Date().toISOString(), completed_at: null };
      await saveWeb(SESSION_KEY, [s, ...all]);
      return s;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO focus_sessions (session_type, duration_minutes, linked_todo_id, linked_goal_id, notes) VALUES (?, ?, ?, ?, ?)',
      [input.session_type || 'pomodoro', input.duration_minutes, input.linked_todo_id || null, input.linked_goal_id || null, input.notes || null]
    );
    const row = await db.getFirstAsync('SELECT * FROM focus_sessions WHERE id = ?', [r.lastInsertRowId]);
    return mapSession(row);
  }

  async completeSession(id: number, actualSeconds: number, status: 'completed' | 'cancelled' = 'completed'): Promise<void> {
    if (Platform.OS === 'web') {
      const all = await getWeb<FocusSession>(SESSION_KEY);
      const idx = all.findIndex(s => s.id === id);
      if (idx >= 0) { all[idx].actual_seconds = actualSeconds; all[idx].status = status; all[idx].completed_at = new Date().toISOString(); await saveWeb(SESSION_KEY, all); }
      return;
    }
    const db = getDB();
    await db.runAsync('UPDATE focus_sessions SET actual_seconds = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?', [actualSeconds, status, id]);
  }

  async getRecentSessions(limit = 20): Promise<FocusSession[]> {
    if (Platform.OS === 'web') { const all = await getWeb<FocusSession>(SESSION_KEY); return all.slice(0, limit); }
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT ?', [limit]);
    return rows.map(mapSession);
  }

  async getTodayFocusMinutes(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    if (Platform.OS === 'web') {
      const all = await getWeb<FocusSession>(SESSION_KEY);
      return all.filter(s => s.started_at.startsWith(today) && s.status === 'completed').reduce((sum, s) => sum + Math.round(s.actual_seconds / 60), 0);
    }
    const db = getDB();
    const row = await db.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(actual_seconds),0) as total FROM focus_sessions WHERE date(started_at) = ? AND status = 'completed'`, [today]);
    return Math.round((row?.total || 0) / 60);
  }
}

export const clockRepository = new ClockRepository();
