import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateMoodInput, MoodEntry, UpdateMoodInput } from '../../types/mood.types';
import { getDB } from '../database';

const STORAGE_KEY = 'mood_entries';

const getWebMoods = async (): Promise<MoodEntry[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};
const saveWebMoods = async (moods: MoodEntry[]) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(moods));

const mapRow = (row: any): MoodEntry => ({
  ...row,
  tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
  activities: typeof row.activities === 'string' ? JSON.parse(row.activities) : row.activities || [],
});

class MoodRepository {
  async insert(input: CreateMoodInput): Promise<MoodEntry> {
    if (Platform.OS === 'web') {
      const moods = await getWebMoods();
      const entry: MoodEntry = {
        id: Date.now(),
        date: input.date,
        mood: input.mood,
        mood_score: input.mood_score,
        energy_level: input.energy_level || 3,
        notes: input.notes || null,
        tags: input.tags || [],
        activities: input.activities || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await saveWebMoods([entry, ...moods]);
      return entry;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT OR REPLACE INTO mood_entries (date, mood, mood_score, energy_level, notes, tags, activities) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [input.date, input.mood, input.mood_score, input.energy_level || 3, input.notes || null, JSON.stringify(input.tags || []), JSON.stringify(input.activities || [])]
    );
    return (await this.findById(r.lastInsertRowId))!;
  }

  async findAll(limit = 30): Promise<MoodEntry[]> {
    if (Platform.OS === 'web') {
      const moods = await getWebMoods();
      return moods.slice(0, limit);
    }
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM mood_entries ORDER BY date DESC LIMIT ?', [limit]);
    return rows.map(mapRow);
  }

  async findById(id: number): Promise<MoodEntry | null> {
    if (Platform.OS === 'web') {
      const moods = await getWebMoods();
      return moods.find(m => m.id === id) || null;
    }
    const db = getDB();
    const row = await db.getFirstAsync('SELECT * FROM mood_entries WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  async findByDate(date: string): Promise<MoodEntry | null> {
    if (Platform.OS === 'web') {
      const moods = await getWebMoods();
      return moods.find(m => m.date === date) || null;
    }
    const db = getDB();
    const row = await db.getFirstAsync('SELECT * FROM mood_entries WHERE date = ?', [date]);
    return row ? mapRow(row) : null;
  }

  async update(id: number, input: UpdateMoodInput): Promise<MoodEntry> {
    if (Platform.OS === 'web') {
      const moods = await getWebMoods();
      const idx = moods.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Mood entry not found');
      moods[idx] = { ...moods[idx], ...input, updated_at: new Date().toISOString() } as MoodEntry;
      await saveWebMoods(moods);
      return moods[idx];
    }
    const db = getDB();
    const sets: string[] = [];
    const params: any[] = [];
    if (input.mood !== undefined) { sets.push('mood = ?'); params.push(input.mood); }
    if (input.mood_score !== undefined) { sets.push('mood_score = ?'); params.push(input.mood_score); }
    if (input.energy_level !== undefined) { sets.push('energy_level = ?'); params.push(input.energy_level); }
    if (input.notes !== undefined) { sets.push('notes = ?'); params.push(input.notes); }
    if (input.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(input.tags)); }
    if (input.activities !== undefined) { sets.push('activities = ?'); params.push(JSON.stringify(input.activities)); }
    sets.push('updated_at = CURRENT_TIMESTAMP');
    await db.runAsync(`UPDATE mood_entries SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    if (Platform.OS === 'web') {
      const moods = await getWebMoods();
      await saveWebMoods(moods.filter(m => m.id !== id));
      return;
    }
    const db = getDB();
    await db.runAsync('DELETE FROM mood_entries WHERE id = ?', [id]);
  }

  async getStreak(): Promise<number> {
    const moods = await this.findAll(60);
    if (moods.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (moods.find(m => m.date === dateStr)) streak++;
      else break;
    }
    return streak;
  }
}

export const moodRepository = new MoodRepository();
