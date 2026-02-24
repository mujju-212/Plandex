import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateNoteInput, StickyNote, UpdateNoteInput } from '../../types/note.types';
import { getDB } from '../database';

const STORAGE_KEY = 'sticky_notes';

const getWebNotes = async (): Promise<StickyNote[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};
const saveWebNotes = async (notes: StickyNote[]) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));

const mapRow = (row: any): StickyNote => ({
  ...row,
  is_pinned: !!row.is_pinned,
});

class NoteRepository {
  async insert(input: CreateNoteInput): Promise<StickyNote> {
    if (Platform.OS === 'web') {
      const notes = await getWebNotes();
      const note: StickyNote = {
        id: Date.now(),
        title: input.title || '',
        content: input.content || '',
        color: input.color || '#FFE082',
        is_pinned: input.is_pinned || false,
        position: notes.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await saveWebNotes([note, ...notes]);
      return note;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO sticky_notes (title, content, color, is_pinned, position) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position),0)+1 FROM sticky_notes))',
      [input.title || '', input.content || '', input.color || '#FFE082', input.is_pinned ? 1 : 0]
    );
    return (await this.findById(r.lastInsertRowId))!;
  }

  async findAll(): Promise<StickyNote[]> {
    if (Platform.OS === 'web') return getWebNotes();
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM sticky_notes ORDER BY is_pinned DESC, updated_at DESC');
    return rows.map(mapRow);
  }

  async findById(id: number): Promise<StickyNote | null> {
    if (Platform.OS === 'web') {
      const notes = await getWebNotes();
      return notes.find(n => n.id === id) || null;
    }
    const db = getDB();
    const row = await db.getFirstAsync('SELECT * FROM sticky_notes WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  async update(id: number, input: UpdateNoteInput): Promise<StickyNote> {
    if (Platform.OS === 'web') {
      const notes = await getWebNotes();
      const idx = notes.findIndex(n => n.id === id);
      if (idx === -1) throw new Error('Note not found');
      notes[idx] = { ...notes[idx], ...input, updated_at: new Date().toISOString() };
      await saveWebNotes(notes);
      return notes[idx];
    }
    const db = getDB();
    const sets: string[] = [];
    const params: any[] = [];
    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.content !== undefined) { sets.push('content = ?'); params.push(input.content); }
    if (input.color !== undefined) { sets.push('color = ?'); params.push(input.color); }
    if (input.is_pinned !== undefined) { sets.push('is_pinned = ?'); params.push(input.is_pinned ? 1 : 0); }
    if (input.position !== undefined) { sets.push('position = ?'); params.push(input.position); }
    sets.push('updated_at = CURRENT_TIMESTAMP');
    await db.runAsync(`UPDATE sticky_notes SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    if (Platform.OS === 'web') {
      const notes = await getWebNotes();
      await saveWebNotes(notes.filter(n => n.id !== id));
      return;
    }
    const db = getDB();
    await db.runAsync('DELETE FROM sticky_notes WHERE id = ?', [id]);
  }
}

export const noteRepository = new NoteRepository();
