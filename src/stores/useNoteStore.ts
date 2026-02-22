import { create } from 'zustand';
import { noteRepository } from '../database/repositories/noteRepository';
import { CreateNoteInput, StickyNote, UpdateNoteInput } from '../types/note.types';

interface NoteState {
  notes: StickyNote[];
  isLoading: boolean;
  error: string | null;
  loadNotes: () => Promise<void>;
  addNote: (input: CreateNoteInput) => Promise<StickyNote>;
  updateNote: (id: number, input: UpdateNoteInput) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  togglePin: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,

  loadNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      const notes = await noteRepository.findAll();
      set({ notes, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  addNote: async (input) => {
    try {
      set({ error: null });
      const note = await noteRepository.insert(input);
      set(s => ({ notes: [note, ...s.notes] }));
      return note;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateNote: async (id, input) => {
    try {
      set({ error: null });
      const updated = await noteRepository.update(id, input);
      set(s => ({ notes: s.notes.map(n => n.id === id ? updated : n) }));
    } catch (e: any) { set({ error: e.message }); }
  },

  deleteNote: async (id) => {
    try {
      set({ error: null });
      await noteRepository.delete(id);
      set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
    } catch (e: any) { set({ error: e.message }); }
  },

  togglePin: async (id) => {
    try {
      set({ error: null });
      const note = get().notes.find(n => n.id === id);
      if (!note) throw new Error('Note not found');
      await get().updateNote(id, { is_pinned: !note.is_pinned });
    } catch (e: any) { set({ error: e.message }); }
  },

  clearError: () => set({ error: null }),
}));
