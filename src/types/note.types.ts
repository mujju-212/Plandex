export interface StickyNote {
  id: number;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  title?: string;
  content?: string;
  color?: string;
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  color?: string;
  is_pinned?: boolean;
  position?: number;
}

export const NOTE_COLORS = [
  '#FFE082', // Yellow
  '#FFAB91', // Orange
  '#EF9A9A', // Red
  '#CE93D8', // Purple
  '#90CAF9', // Blue
  '#80CBC4', // Teal
  '#A5D6A7', // Green
  '#BCAAA4', // Brown
  '#B0BEC5', // Grey
  '#F48FB1', // Pink
];
