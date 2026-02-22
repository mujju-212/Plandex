import { create } from 'zustand';
import { logService } from '../services/logService';
import { CreateDailyLogInput, DailyLog, UpdateDailyLogInput } from '../types/log.types';

interface LogState {
    logs: DailyLog[];
    currentLog: DailyLog | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadLogs: () => Promise<void>;
    loadRecentLogs: (limit?: number) => Promise<void>;
    loadLogForDate: (date: string) => Promise<void>;
    saveLog: (input: CreateDailyLogInput) => Promise<DailyLog>;
    updateLog: (date: string, input: UpdateDailyLogInput) => Promise<void>;
    deleteLog: (date: string) => Promise<void>;
    clearError: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
    logs: [],
    currentLog: null,
    isLoading: false,
    error: null,

    loadLogs: async () => {
        try {
            set({ isLoading: true, error: null });
            const logs = await logService.getAllLogs();
            set({ logs, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    loadRecentLogs: async (limit = 7) => {
        try {
            set({ isLoading: true, error: null });
            const logs = await logService.getRecentLogs(limit);
            set({ logs, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    loadLogForDate: async (date: string) => {
        try {
            set({ isLoading: true, error: null });
            const log = await logService.getDailyLog(date);
            set({ currentLog: log, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    saveLog: async (input: CreateDailyLogInput) => {
        try {
            set({ error: null });
            const log = await logService.saveDailyLog(input);
            set(state => ({
                logs: [log, ...state.logs.filter(l => l.date !== log.date)],
                currentLog: log,
            }));
            return log;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateLog: async (date: string, input: UpdateDailyLogInput) => {
        try {
            set({ error: null });
            const log = await logService.updateDailyLog(date, input);
            set(state => ({
                logs: state.logs.map(l => l.date === date ? log : l),
                currentLog: state.currentLog?.date === date ? log : state.currentLog,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteLog: async (date: string) => {
        try {
            set({ error: null });
            await logService.deleteDailyLog(date);
            set(state => ({
                logs: state.logs.filter(l => l.date !== date),
                currentLog: state.currentLog?.date === date ? null : state.currentLog,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    clearError: () => set({ error: null }),
}));
