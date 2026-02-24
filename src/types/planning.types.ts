export type PlanningFileType = 'image' | 'video' | 'pdf' | 'document' | 'audio' | 'other';

export interface PlanningProject {
  id: number;
  title: string;
  description: string | null;
  color: string;
  icon: string;
  cover_image: string | null;
  is_archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  // Computed
  notes_count?: number;
  files_count?: number;
}

export interface PlanningNote {
  id: number;
  project_id: number;
  title: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface PlanningFile {
  id: number;
  project_id: number;
  file_name: string;
  file_uri: string;
  file_type: PlanningFileType;
  file_size: number;
  thumbnail_uri: string | null;
  created_at: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
  cover_image?: string;
  is_archived?: boolean;
}

export interface CreateNoteInput {
  project_id: number;
  title?: string;
  content?: string;
}

export interface CreateFileInput {
  project_id: number;
  file_name: string;
  file_uri: string;
  file_type?: PlanningFileType;
  file_size?: number;
  thumbnail_uri?: string;
}

export const PROJECT_COLORS = [
  '#4A9BE2', '#66C38A', '#F5B041', '#E74C3C', '#AB47BC',
  '#26A69A', '#FF7043', '#5C6BC0', '#78909C', '#EC407A',
];

export const PROJECT_ICONS = [
  'folder', 'lightbulb', 'code', 'brush', 'business',
  'school', 'favorite', 'star', 'rocket', 'psychology',
];
