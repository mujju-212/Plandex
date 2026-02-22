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
  clearError: () => void;
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
      set({ error: null });
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayMood = await moodRepository.findByDate(today);
      set({ todayMood });
    } catch (e: any) { set({ error: e.message }); }
  },

  addEntry: async (input) => {
    try {
      set({ error: null });
      const entry = await moodRepository.insert(input);
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const streak = await moodRepository.getStreak();
      set(s => ({ entries: [entry, ...s.entries], todayMood: input.date === today ? entry : s.todayMood, streak }));
      return entry;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateEntry: async (id, input) => {
    try {
      set({ error: null });
      const updated = await moodRepository.update(id, input);
      set(s => ({ entries: s.entries.map(e => e.id === id ? updated : e), todayMood: s.todayMood?.id === id ? updated : s.todayMood }));
    } catch (e: any) { set({ error: e.message }); }
  },

  deleteEntry: async (id) => {
    try {
      set({ error: null });
      await moodRepository.delete(id);
      const streak = await moodRepository.getStreak();
      set(s => ({ entries: s.entries.filter(e => e.id !== id), todayMood: s.todayMood?.id === id ? null : s.todayMood, streak }));
    } catch (e: any) { set({ error: e.message }); }
  },

  clearError: () => set({ error: null }),
}));
