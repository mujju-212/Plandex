export type TimerMode = 'clock' | 'timer' | 'stopwatch' | 'alarm';

export interface Alarm {
  id: number;
  label: string;
  hour: number;
  minute: number;
  is_enabled: boolean;
  repeat_days: number[]; // 0=Sun ... 6=Sat
  sound_uri: string | null;
  sound_name: string;
  vibrate: boolean;
  created_at: string;
}

export interface CreateAlarmInput {
  label?: string;
  hour: number;
  minute: number;
  repeat_days?: number[];
  sound_uri?: string;
  sound_name?: string;
  vibrate?: boolean;
}

export interface UpdateAlarmInput {
  label?: string;
  hour?: number;
  minute?: number;
  is_enabled?: boolean;
  repeat_days?: number[];
  sound_uri?: string;
  sound_name?: string;
  vibrate?: boolean;
}

export interface FocusSession {
  id: number;
  session_type: 'pomodoro' | 'custom';
  duration_minutes: number;
  actual_seconds: number;
  status: 'completed' | 'cancelled' | 'in_progress';
  linked_todo_id: number | null;
  linked_goal_id: number | null;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface CreateFocusSessionInput {
  session_type?: 'pomodoro' | 'custom';
  duration_minutes: number;
  linked_todo_id?: number;
  linked_goal_id?: number;
  notes?: string;
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
