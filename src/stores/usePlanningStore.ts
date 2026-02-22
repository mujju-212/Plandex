import { create } from 'zustand';
import { planningRepository } from '../database/repositories/planningRepository';
import { CreateFileInput, CreateProjectInput, PlanningFile, PlanningNote, PlanningProject, UpdateProjectInput } from '../types/planning.types';

interface PlanningState {
  projects: PlanningProject[];
  currentProject: PlanningProject | null;
  notes: PlanningNote[];
  files: PlanningFile[];
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  loadProjectDetail: (id: number) => Promise<void>;
  addProject: (input: CreateProjectInput) => Promise<PlanningProject>;
  updateProject: (id: number, input: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  addNote: (projectId: number, title?: string, content?: string) => Promise<PlanningNote>;
  updateNote: (id: number, title: string, content: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  addFile: (input: CreateFileInput) => Promise<PlanningFile>;
  deleteFile: (id: number) => Promise<void>;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  projects: [],
  currentProject: null,
  notes: [],
  files: [],
  isLoading: false,
  error: null,

  loadProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await planningRepository.findAllProjects();
      set({ projects, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  loadProjectDetail: async (id) => {
    try {
      set({ isLoading: true });
      const [currentProject, notes, files] = await Promise.all([
        planningRepository.findProjectById(id),
        planningRepository.getNotesForProject(id),
        planningRepository.getFilesForProject(id),
      ]);
      set({ currentProject, notes, files, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  addProject: async (input) => {
    try {
      const project = await planningRepository.insertProject(input);
      set(s => ({ projects: [project, ...s.projects] }));
      return project;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateProject: async (id, input) => {
    try {
      const updated = await planningRepository.updateProject(id, input);
      set(s => ({ projects: s.projects.map(p => p.id === id ? updated : p), currentProject: s.currentProject?.id === id ? updated : s.currentProject }));
    } catch (e: any) { set({ error: e.message }); }
  },

  deleteProject: async (id) => {
    try {
      await planningRepository.deleteProject(id);
      set(s => ({
        projects: s.projects.filter(p => p.id !== id),
        currentProject: s.currentProject?.id === id ? null : s.currentProject,
        notes: s.currentProject?.id === id ? [] : s.notes,
        files: s.currentProject?.id === id ? [] : s.files,
      }));
    } catch (e: any) { set({ error: e.message }); }
  },

  addNote: async (projectId, title, content) => {
    try {
      const note = await planningRepository.insertNote({ project_id: projectId, title, content });
      set(s => ({ notes: [...s.notes, note] }));
      return note;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateNote: async (id, title, content) => {
    try {
      await planningRepository.updateNote(id, title, content);
      set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n) }));
    } catch (e: any) { set({ error: e.message }); }
  },

  deleteNote: async (id) => {
    try {
      await planningRepository.deleteNote(id);
      set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
    } catch (e: any) { set({ error: e.message }); }
  },

  addFile: async (input) => {
    try {
      const file = await planningRepository.insertFile(input);
      set(s => ({ files: [...s.files, file] }));
      return file;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  deleteFile: async (id) => {
    try {
      await planningRepository.deleteFile(id);
      set(s => ({ files: s.files.filter(f => f.id !== id) }));
    } catch (e: any) { set({ error: e.message }); }
  },
}));
