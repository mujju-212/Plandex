import { create } from 'zustand';
import { moodRepository } from '../database/repositories/moodRepository';
import { CreateMoodInput, MoodEntry, UpdateMoodInput } from '../types/mood.types';

interface MoodState {
  entries: MoodEntry[];
  todayMood: MoodEntry | null;
  streak: number;
  isLoading: boolean;
  error: string | null;
  loadEntries: (limit?: number) => Promise<void>;
  loadTodayMood: () => Promise<void>;
  addEntry: (input: CreateMoodInput) => Promise<MoodEntry>;
  updateEntry: (id: number, input: UpdateMoodInput) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set) => ({
  entries: [],
  todayMood: null,
  streak: 0,
  isLoading: false,
  error: null,

  loadEntries: async (limit = 30) => {
    try {
      set({ isLoading: true, error: null });
      const entries = await moodRepository.findAll(limit);
      const streak = await moodRepository.getStreak();
      set({ entries, streak, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  loadTodayMood: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayMood = await moodRepository.findByDate(today);
      set({ todayMood });
    } catch (e: any) { set({ error: e.message }); }
  },

  addEntry: async (input) => {
    try {
      const entry = await moodRepository.insert(input);
      set(s => ({ entries: [entry, ...s.entries], todayMood: input.date === new Date().toISOString().split('T')[0] ? entry : s.todayMood }));
      return entry;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateEntry: async (id, input) => {
    try {
      const updated = await moodRepository.update(id, input);
      set(s => ({ entries: s.entries.map(e => e.id === id ? updated : e), todayMood: s.todayMood?.id === id ? updated : s.todayMood }));
    } catch (e: any) { set({ error: e.message }); }
  },

  deleteEntry: async (id) => {
    try {
      await moodRepository.delete(id);
      set(s => ({ entries: s.entries.filter(e => e.id !== id), todayMood: s.todayMood?.id === id ? null : s.todayMood }));
    } catch (e: any) { set({ error: e.message }); }
  },
}));
