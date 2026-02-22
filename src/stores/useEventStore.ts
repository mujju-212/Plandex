import { create } from 'zustand';
import { eventService } from '../services/eventService';
import { scheduleEventReminder } from '../services/notificationService';
import { AppEvent, CreateEventInput, EventFilter, UpdateEventInput } from '../types/event.types';

interface EventState {
    events: AppEvent[];
    selectedEvent: AppEvent | null;
    isLoading: boolean;
    error: string | null;

    loadEvents: (filter?: EventFilter) => Promise<void>;
    loadEventsForDate: (date: string) => Promise<void>;
    addEvent: (input: CreateEventInput) => Promise<AppEvent>;
    updateEvent: (id: number, input: UpdateEventInput) => Promise<void>;
    deleteEvent: (id: number) => Promise<void>;
    completeEvent: (id: number) => Promise<void>;
    selectEvent: (event: AppEvent | null) => void;
    clearError: () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
    events: [],
    selectedEvent: null,
    isLoading: false,
    error: null,

    loadEvents: async (filter?: EventFilter) => {
        try {
            set({ isLoading: true, error: null });
            const events = await eventService.getEvents(filter);
            set({ events, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    loadEventsForDate: async (date: string) => {
        try {
            set({ isLoading: true, error: null });
            const events = await eventService.getEventsForDate(date);
            set({ events, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addEvent: async (input: CreateEventInput) => {
        try {
            set({ error: null });
            const event = await eventService.createEvent(input);
            // Schedule reminder 15 minutes before event
            scheduleEventReminder(event.id, event.title, event.start_datetime).catch(() => {});
            set(state => ({ events: [event, ...state.events] }));
            return event;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    updateEvent: async (id: number, input: UpdateEventInput) => {
        try {
            set({ error: null });
            const event = await eventService.updateEvent(id, input);
            set(state => ({
                events: state.events.map(e => e.id === id ? event : e),
                selectedEvent: state.selectedEvent?.id === id ? event : state.selectedEvent,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteEvent: async (id: number) => {
        try {
            set({ error: null });
            await eventService.deleteEvent(id);
            set(state => ({
                events: state.events.filter(e => e.id !== id),
                selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    completeEvent: async (id: number) => {
        try {
            set({ error: null });
            const event = await eventService.completeEvent(id);
            set(state => ({
                events: state.events.map(e => e.id === id ? event : e),
                selectedEvent: state.selectedEvent?.id === id ? event : state.selectedEvent,
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    selectEvent: (event) => set({ selectedEvent: event }),
    clearError: () => set({ error: null }),
}));
