export type MoodType = 'amazing' | 'good' | 'okay' | 'bad' | 'terrible';

export interface MoodEntry {
  id: number;
  date: string;
  mood: MoodType;
  mood_score: number; // 1-5
  energy_level: number; // 1-5
  notes: string | null;
  tags: string[];
  activities: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateMoodInput {
  date: string;
  mood: MoodType;
  mood_score: number;
  energy_level?: number;
  notes?: string;
  tags?: string[];
  activities?: string[];
}

export interface UpdateMoodInput {
  mood?: MoodType;
  mood_score?: number;
  energy_level?: number;
  notes?: string;
  tags?: string[];
  activities?: string[];
}

export const MOOD_EMOJIS: Record<MoodType, string> = {
  amazing: '🤩',
  good: '😊',
  okay: '😐',
  bad: '😔',
  terrible: '😢',
};

export const MOOD_COLORS: Record<MoodType, string> = {
  amazing: '#4CAF50',
  good: '#8BC34A',
  okay: '#FFC107',
  bad: '#FF9800',
  terrible: '#F44336',
};

export const MOOD_ACTIVITIES = [
  'Exercise', 'Work', 'Study', 'Social', 'Family',
  'Hobby', 'Travel', 'Rest', 'Reading', 'Gaming',
  'Meditation', 'Music', 'Cooking', 'Shopping', 'Nature',
];
