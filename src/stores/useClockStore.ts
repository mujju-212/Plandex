import { create } from 'zustand';
import { clockRepository } from '../database/repositories/clockRepository';
import { Alarm, CreateAlarmInput, CreateFocusSessionInput, FocusSession, UpdateAlarmInput } from '../types/clock.types';

interface ClockState {
  alarms: Alarm[];
  sessions: FocusSession[];
  todayFocusMinutes: number;
  isLoading: boolean;
  error: string | null;
  loadAlarms: () => Promise<void>;
  addAlarm: (input: CreateAlarmInput) => Promise<Alarm>;
  updateAlarm: (id: number, input: UpdateAlarmInput) => Promise<void>;
  deleteAlarm: (id: number) => Promise<void>;
  toggleAlarm: (id: number) => Promise<void>;
  loadSessions: () => Promise<void>;
  startSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
  endSession: (id: number, actualSeconds: number, status?: 'completed' | 'cancelled') => Promise<void>;
  loadTodayFocus: () => Promise<void>;
  clearError: () => void;
}

export const useClockStore = create<ClockState>((set, get) => ({
  alarms: [],
  sessions: [],
  todayFocusMinutes: 0,
  isLoading: false,
  error: null,

  loadAlarms: async () => {
    try {
      set({ isLoading: true, error: null });
      const alarms = await clockRepository.getAllAlarms();
      set({ alarms, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  addAlarm: async (input) => {
    try {
      set({ error: null });
      const alarm = await clockRepository.insertAlarm(input);
      set(s => ({ alarms: [alarm, ...s.alarms] }));
      return alarm;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateAlarm: async (id, input) => {
    try {
      set({ error: null });
      const updated = await clockRepository.updateAlarm(id, input);
      set(s => ({ alarms: s.alarms.map(a => a.id === id ? updated : a) }));
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  deleteAlarm: async (id) => {
    try {
      set({ error: null });
      await clockRepository.deleteAlarm(id);
      set(s => ({ alarms: s.alarms.filter(a => a.id !== id) }));
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  toggleAlarm: async (id) => {
    try {
      set({ error: null });
      const alarm = get().alarms.find(a => a.id === id);
      if (!alarm) throw new Error('Alarm not found');
      await get().updateAlarm(id, { is_enabled: !alarm.is_enabled });
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  loadSessions: async () => {
    try {
      set({ isLoading: true, error: null });
      const sessions = await clockRepository.getRecentSessions();
      set({ sessions, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  startSession: async (input) => {
    try {
      set({ error: null });
      const session = await clockRepository.insertSession(input);
      set(s => ({ sessions: [session, ...s.sessions] }));
      return session;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  endSession: async (id, actualSeconds, status = 'completed') => {
    try {
      set({ error: null });
      await clockRepository.completeSession(id, actualSeconds, status);
      set(s => ({ sessions: s.sessions.map(sess => sess.id === id ? { ...sess, actual_seconds: actualSeconds, status, completed_at: new Date().toISOString() } : sess) }));
      await get().loadTodayFocus();
    } catch (e: any) { set({ error: e.message }); }
  },

  loadTodayFocus: async () => {
    try {
      set({ error: null });
      const todayFocusMinutes = await clockRepository.getTodayFocusMinutes();
      set({ todayFocusMinutes });
    } catch (e: any) { set({ error: e.message }); }
  },

  clearError: () => set({ error: null }),
}));
