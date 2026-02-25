import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
    AppEvent,
    CreateEventInput,
    EventFilter,
    UpdateEventInput,
} from '../../types/event.types';

const isWeb = Platform.OS === 'web';

const EVENTS_KEY = 'events_data';
let nextId = 100;

// ─── AsyncStorage helpers ──────────────────────────────
async function getAllEventsFromStorage(): Promise<AppEvent[]> {
    try {
        const raw = await AsyncStorage.getItem(EVENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

async function saveAllEventsToStorage(events: AppEvent[]): Promise<void> {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// ─── Repository ────────────────────────────────────────
class EventRepository {

    async insert(input: CreateEventInput): Promise<AppEvent> {
        if (isWeb) {
            const events = await getAllEventsFromStorage();
            const now = new Date().toISOString();
            const newEvent: AppEvent = {
                id: nextId++,
                title: input.title,
                description: input.description || null,
                event_type: input.event_type || 'single',
                start_datetime: input.start_datetime,
                end_datetime: input.end_datetime || null,
                is_all_day: input.is_all_day ?? false,
                location: input.location || null,
                color: input.color || '#1A73E8',
                category: input.category || 'general',
                is_recurring: input.is_recurring ?? false,
                recurring_pattern: input.recurring_pattern || null,
                status: 'upcoming',
                created_at: now,
                updated_at: now,
            };
            events.unshift(newEvent);
            await saveAllEventsToStorage(events);
            return newEvent;
        }
        // Native SQLite path — fallback
        throw new Error('Native event repository not yet wired');
    }

    async findAll(filter?: EventFilter): Promise<AppEvent[]> {
        if (isWeb) {
            let events = await getAllEventsFromStorage();
            if (filter?.category) events = events.filter(e => e.category === filter.category);
            if (filter?.status) events = events.filter(e => e.status === filter.status);
            if (filter?.date) {
                events = events.filter(e => e.start_datetime.startsWith(filter.date!));
            }
            if (filter?.date_from && filter?.date_to) {
                events = events.filter(e =>
                    e.start_datetime >= filter.date_from! && e.start_datetime <= filter.date_to! + 'T23:59:59'
                );
            }
            if (filter?.search) {
                const q = filter.search.toLowerCase();
                events = events.filter(e => e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
            }
            return events;
        }
        return [];
    }

    async findById(id: number): Promise<AppEvent | null> {
        if (isWeb) {
            const events = await getAllEventsFromStorage();
            return events.find(e => e.id === id) || null;
        }
        return null;
    }

    async findByDate(date: string): Promise<AppEvent[]> {
        if (isWeb) {
            const events = await getAllEventsFromStorage();
            return events.filter(e => {
                const startDate = e.start_datetime.split('T')[0];
                const endDate = e.end_datetime ? e.end_datetime.split('T')[0] : startDate;
                return date >= startDate && date <= endDate;
            });
        }
        return [];
    }

    async update(id: number, input: UpdateEventInput): Promise<AppEvent> {
        if (isWeb) {
            const events = await getAllEventsFromStorage();
            const idx = events.findIndex(e => e.id === id);
            if (idx === -1) throw new Error('Event not found');
            const updated = {
                ...events[idx],
                ...input,
                recurring_pattern: input.recurring_pattern !== undefined ? input.recurring_pattern : events[idx].recurring_pattern,
                updated_at: new Date().toISOString(),
            } as AppEvent;
            events[idx] = updated;
            await saveAllEventsToStorage(events);
            return updated;
        }
        throw new Error('Event not found');
    }

    async delete(id: number): Promise<void> {
        if (isWeb) {
            let events = await getAllEventsFromStorage();
            events = events.filter(e => e.id !== id);
            await saveAllEventsToStorage(events);
        }
    }
}

export const eventRepository = new EventRepository();
