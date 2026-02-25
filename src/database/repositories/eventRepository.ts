import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
    AppEvent,
    CreateEventInput,
    EventFilter,
    UpdateEventInput,
} from '../../types/event.types';
import { getDB } from '../database';

const isWeb = Platform.OS === 'web';

const EVENTS_KEY = 'events_data';

// ─── AsyncStorage helpers (web only) ───────────────────
async function getAllEventsFromStorage(): Promise<AppEvent[]> {
    try {
        const raw = await AsyncStorage.getItem(EVENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

async function saveAllEventsToStorage(events: AppEvent[]): Promise<void> {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// ─── Row mapper (SQLite → AppEvent) ────────────────────
function mapRowToEvent(row: any): AppEvent {
    return {
        ...row,
        is_all_day: Boolean(row.is_all_day),
        is_recurring: Boolean(row.is_recurring),
        recurring_pattern: row.recurring_pattern ? JSON.parse(row.recurring_pattern) : null,
    };
}

// ─── Repository ────────────────────────────────────────
class EventRepository {

    async insert(input: CreateEventInput): Promise<AppEvent> {
        if (isWeb) {
            const events = await getAllEventsFromStorage();
            const now = new Date().toISOString();
            const newEvent: AppEvent = {
                id: Date.now(),
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

        // ── Native SQLite ──
        const db = getDB();
        const patternJson = input.recurring_pattern ? JSON.stringify(input.recurring_pattern) : null;
        const result = await db.runAsync(
            `INSERT INTO events (title, description, event_type, start_datetime, end_datetime,
             is_all_day, location, color, category, is_recurring, recurring_pattern)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.title,
                input.description || null,
                input.event_type || 'single',
                input.start_datetime,
                input.end_datetime || null,
                input.is_all_day ? 1 : 0,
                input.location || null,
                input.color || '#1A73E8',
                input.category || 'general',
                input.is_recurring ? 1 : 0,
                patternJson,
            ]
        );
        return (await this.findById(result.lastInsertRowId))!;
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

        // ── Native SQLite ──
        const db = getDB();
        let query = 'SELECT * FROM events WHERE 1=1';
        const params: any[] = [];

        if (filter?.category) { query += ' AND category = ?'; params.push(filter.category); }
        if (filter?.status) { query += ' AND status = ?'; params.push(filter.status); }
        if (filter?.date) { query += ' AND start_datetime LIKE ?'; params.push(filter.date + '%'); }
        if (filter?.date_from && filter?.date_to) {
            query += ' AND start_datetime >= ? AND start_datetime <= ?';
            params.push(filter.date_from, filter.date_to + 'T23:59:59');
        }
        if (filter?.search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${filter.search}%`, `%${filter.search}%`);
        }
        query += ' ORDER BY start_datetime ASC';

        const rows = await db.getAllAsync(query, params);
        return rows.map((r: any) => mapRowToEvent(r));
    }

    async findById(id: number): Promise<AppEvent | null> {
        if (isWeb) {
            const events = await getAllEventsFromStorage();
            return events.find(e => e.id === id) || null;
        }

        const db = getDB();
        const rows = await db.getAllAsync('SELECT * FROM events WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return mapRowToEvent(rows[0]);
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

        // ── Native SQLite ──
        const db = getDB();
        // Match events whose date range covers the target date
        const rows = await db.getAllAsync(
            `SELECT * FROM events
             WHERE date(start_datetime) <= ? AND date(COALESCE(end_datetime, start_datetime)) >= ?
             ORDER BY start_datetime ASC`,
            [date, date]
        );
        return rows.map((r: any) => mapRowToEvent(r));
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

        // ── Native SQLite ──
        const db = getDB();
        const current = await this.findById(id);
        if (!current) throw new Error('Event not found');

        const mappedInput: any = { ...input };
        if (input.recurring_pattern !== undefined) {
            mappedInput.recurring_pattern = input.recurring_pattern ? JSON.stringify(input.recurring_pattern) : null;
        }
        if (input.is_all_day !== undefined) mappedInput.is_all_day = input.is_all_day ? 1 : 0;
        if (input.is_recurring !== undefined) mappedInput.is_recurring = input.is_recurring ? 1 : 0;

        const keys = Object.keys(mappedInput);
        if (keys.length === 0) return current;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => mappedInput[k]);

        await db.runAsync(
            `UPDATE events SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, id]
        );
        return (await this.findById(id))!;
    }

    async delete(id: number): Promise<void> {
        if (isWeb) {
            let events = await getAllEventsFromStorage();
            events = events.filter(e => e.id !== id);
            await saveAllEventsToStorage(events);
            return;
        }

        const db = getDB();
        await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
    }
}

export const eventRepository = new EventRepository();
