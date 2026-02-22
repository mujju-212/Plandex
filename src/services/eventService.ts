import { eventRepository } from '../database/repositories/eventRepository';
import { AppEvent, CreateEventInput, EventFilter, UpdateEventInput } from '../types/event.types';
import { gamificationService } from './gamificationService';

class EventService {
    async createEvent(input: CreateEventInput): Promise<AppEvent> {
        if (!input.title?.trim()) throw new Error('Event title is required');
        if (!input.start_datetime) throw new Error('Start date/time is required');
        // Validate end > start if both are provided
        if (input.end_datetime && input.start_datetime) {
            if (new Date(input.end_datetime).getTime() <= new Date(input.start_datetime).getTime()) {
                throw new Error('End date/time must be after start date/time');
            }
        }
        const event = await eventRepository.insert({ ...input, title: input.title.trim() });
        await gamificationService.awardXP('create_event');
        return event;
    }

    async getEvents(filter?: EventFilter): Promise<AppEvent[]> {
        return eventRepository.findAll(filter);
    }

    async getEventById(id: number): Promise<AppEvent | null> {
        return eventRepository.findById(id);
    }

    async getEventsForDate(date: string): Promise<AppEvent[]> {
        return eventRepository.findByDate(date);
    }

    async updateEvent(id: number, input: UpdateEventInput): Promise<AppEvent> {
        if (input.title !== undefined && !input.title.trim()) {
            throw new Error('Event title cannot be empty');
        }
        if (input.end_datetime && input.start_datetime) {
            if (new Date(input.end_datetime).getTime() <= new Date(input.start_datetime).getTime()) {
                throw new Error('End date/time must be after start date/time');
            }
        }
        if (input.title) {
            input = { ...input, title: input.title.trim() };
        }
        return eventRepository.update(id, input);
    }

    async deleteEvent(id: number): Promise<void> {
        return eventRepository.delete(id);
    }

    async completeEvent(id: number): Promise<AppEvent> {
        const event = await eventRepository.findById(id);
        if (!event) throw new Error('Event not found');
        if (event.status === 'completed') throw new Error('Event is already completed');
        if (event.status === 'cancelled') throw new Error('Cannot complete a cancelled event');
        const updated = await eventRepository.update(id, { status: 'completed' });
        await gamificationService.awardXP('create_event'); // XP for completing events
        return updated;
    }

    async cancelEvent(id: number): Promise<AppEvent> {
        const event = await eventRepository.findById(id);
        if (!event) throw new Error('Event not found');
        if (event.status === 'cancelled') throw new Error('Event is already cancelled');
        if (event.status === 'completed') throw new Error('Cannot cancel a completed event');
        return eventRepository.update(id, { status: 'cancelled' });
    }
}

export const eventService = new EventService();
