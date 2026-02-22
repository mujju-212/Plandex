import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateFileInput, CreateNoteInput, CreateProjectInput, PlanningFile, PlanningNote, PlanningProject, UpdateProjectInput } from '../../types/planning.types';
import { getDB } from '../database';

const PROJ_KEY = 'planning_projects';
const NOTES_KEY = 'planning_notes';
const FILES_KEY = 'planning_files';

const getWeb = async <T>(key: string): Promise<T[]> => { const r = await AsyncStorage.getItem(key); return r ? JSON.parse(r) : []; };
const saveWeb = async <T>(key: string, data: T[]) => AsyncStorage.setItem(key, JSON.stringify(data));

const mapProject = (row: any): PlanningProject => ({ ...row, is_archived: !!row.is_archived });

class PlanningRepository {
  // ── Projects ──
  async insertProject(input: CreateProjectInput): Promise<PlanningProject> {
    if (Platform.OS === 'web') {
      const projects = await getWeb<PlanningProject>(PROJ_KEY);
      const p: PlanningProject = { id: Date.now(), title: input.title, description: input.description || null, color: input.color || '#4A9BE2', icon: input.icon || 'folder', cover_image: null, is_archived: false, position: projects.length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await saveWeb(PROJ_KEY, [p, ...projects]);
      return p;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO planning_projects (title, description, color, icon, position) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position),0)+1 FROM planning_projects))',
      [input.title, input.description || null, input.color || '#4A9BE2', input.icon || 'folder']
    );
    return (await this.findProjectById(r.lastInsertRowId))!;
  }

  async findAllProjects(includeArchived = false): Promise<PlanningProject[]> {
    if (Platform.OS === 'web') {
      let projects = await getWeb<PlanningProject>(PROJ_KEY);
      if (!includeArchived) projects = projects.filter(p => !p.is_archived);
      return projects;
    }
    const db = getDB();
    const where = includeArchived ? '' : 'WHERE is_archived = 0';
    const rows = await db.getAllAsync(`SELECT p.*, (SELECT COUNT(*) FROM planning_notes WHERE project_id = p.id) as notes_count, (SELECT COUNT(*) FROM planning_files WHERE project_id = p.id) as files_count FROM planning_projects p ${where} ORDER BY position ASC, updated_at DESC`);
    return rows.map(mapProject);
  }

  async findProjectById(id: number): Promise<PlanningProject | null> {
    if (Platform.OS === 'web') { const all = await getWeb<PlanningProject>(PROJ_KEY); return all.find(p => p.id === id) || null; }
    const db = getDB();
    const row = await db.getFirstAsync(`SELECT p.*, (SELECT COUNT(*) FROM planning_notes WHERE project_id = p.id) as notes_count, (SELECT COUNT(*) FROM planning_files WHERE project_id = p.id) as files_count FROM planning_projects p WHERE p.id = ?`, [id]);
    return row ? mapProject(row) : null;
  }

  async updateProject(id: number, input: UpdateProjectInput): Promise<PlanningProject> {
    if (Platform.OS === 'web') {
      const all = await getWeb<PlanningProject>(PROJ_KEY);
      const idx = all.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Project not found');
      all[idx] = { ...all[idx], ...input, updated_at: new Date().toISOString() } as PlanningProject;
      await saveWeb(PROJ_KEY, all);
      return all[idx];
    }
    const db = getDB();
    const sets: string[] = [];
    const params: any[] = [];
    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.description !== undefined) { sets.push('description = ?'); params.push(input.description); }
    if (input.color !== undefined) { sets.push('color = ?'); params.push(input.color); }
    if (input.icon !== undefined) { sets.push('icon = ?'); params.push(input.icon); }
    if (input.cover_image !== undefined) { sets.push('cover_image = ?'); params.push(input.cover_image); }
    if (input.is_archived !== undefined) { sets.push('is_archived = ?'); params.push(input.is_archived ? 1 : 0); }
    sets.push('updated_at = CURRENT_TIMESTAMP');
    await db.runAsync(`UPDATE planning_projects SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    return (await this.findProjectById(id))!;
  }

  async deleteProject(id: number): Promise<void> {
    if (Platform.OS === 'web') {
      await saveWeb(PROJ_KEY, (await getWeb<PlanningProject>(PROJ_KEY)).filter(p => p.id !== id));
      await saveWeb(NOTES_KEY, (await getWeb<PlanningNote>(NOTES_KEY)).filter(n => n.project_id !== id));
      await saveWeb(FILES_KEY, (await getWeb<PlanningFile>(FILES_KEY)).filter(f => f.project_id !== id));
      return;
    }
    const db = getDB();
    await db.runAsync('DELETE FROM planning_projects WHERE id = ?', [id]);
  }

  // ── Notes ──
  async insertNote(input: CreateNoteInput): Promise<PlanningNote> {
    if (Platform.OS === 'web') {
      const notes = await getWeb<PlanningNote>(NOTES_KEY);
      const n: PlanningNote = { id: Date.now(), project_id: input.project_id, title: input.title || 'Untitled', content: input.content || '', position: notes.filter(x => x.project_id === input.project_id).length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await saveWeb(NOTES_KEY, [n, ...notes]);
      return n;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO planning_notes (project_id, title, content, position) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position),0)+1 FROM planning_notes WHERE project_id = ?))',
      [input.project_id, input.title || 'Untitled', input.content || '', input.project_id]
    );
    const row = await db.getFirstAsync('SELECT * FROM planning_notes WHERE id = ?', [r.lastInsertRowId]);
    return row as PlanningNote;
  }

  async getNotesForProject(projectId: number): Promise<PlanningNote[]> {
    if (Platform.OS === 'web') { return (await getWeb<PlanningNote>(NOTES_KEY)).filter(n => n.project_id === projectId); }
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM planning_notes WHERE project_id = ? ORDER BY position ASC', [projectId]);
    return rows as PlanningNote[];
  }

  async updateNote(id: number, title: string, content: string): Promise<void> {
    if (Platform.OS === 'web') {
      const notes = await getWeb<PlanningNote>(NOTES_KEY);
      const idx = notes.findIndex(n => n.id === id);
      if (idx === -1) throw new Error('Planning note not found');
      notes[idx] = { ...notes[idx], title, content, updated_at: new Date().toISOString() };
      await saveWeb(NOTES_KEY, notes);
      return;
    }
    const db = getDB();
    const result = await db.runAsync('UPDATE planning_notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, content, id]);
    if (result.changes === 0) throw new Error('Planning note not found');
  }

  async deleteNote(id: number): Promise<void> {
    if (Platform.OS === 'web') { await saveWeb(NOTES_KEY, (await getWeb<PlanningNote>(NOTES_KEY)).filter(n => n.id !== id)); return; }
    const db = getDB();
    await db.runAsync('DELETE FROM planning_notes WHERE id = ?', [id]);
  }

  // ── Files ──
  async insertFile(input: CreateFileInput): Promise<PlanningFile> {
    if (Platform.OS === 'web') {
      const files = await getWeb<PlanningFile>(FILES_KEY);
      const f: PlanningFile = { id: Date.now(), project_id: input.project_id, file_name: input.file_name, file_uri: input.file_uri, file_type: input.file_type || 'other', file_size: input.file_size || 0, thumbnail_uri: input.thumbnail_uri || null, created_at: new Date().toISOString() };
      await saveWeb(FILES_KEY, [f, ...files]);
      return f;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO planning_files (project_id, file_name, file_uri, file_type, file_size, thumbnail_uri) VALUES (?, ?, ?, ?, ?, ?)',
      [input.project_id, input.file_name, input.file_uri, input.file_type || 'other', input.file_size || 0, input.thumbnail_uri || null]
    );
    const row = await db.getFirstAsync('SELECT * FROM planning_files WHERE id = ?', [r.lastInsertRowId]);
    return row as PlanningFile;
  }

  async getFilesForProject(projectId: number): Promise<PlanningFile[]> {
    if (Platform.OS === 'web') { return (await getWeb<PlanningFile>(FILES_KEY)).filter(f => f.project_id === projectId); }
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM planning_files WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
    return rows as PlanningFile[];
  }

  async deleteFile(id: number): Promise<void> {
    if (Platform.OS === 'web') { await saveWeb(FILES_KEY, (await getWeb<PlanningFile>(FILES_KEY)).filter(f => f.id !== id)); return; }
    const db = getDB();
    await db.runAsync('DELETE FROM planning_files WHERE id = ?', [id]);
  }
}

export const planningRepository = new PlanningRepository();
