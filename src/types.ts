export interface WorkoutRecord {
  id: string;
  timestamp: number;
  durationMins: number;
  type: string;
  mood?: string;
  intensity?: string;
  recordType?: 'workout' | 'rest';
}

export interface UserSettings {
  dailyGoalMins: number;
  weight: number;
  targetWeight: number;
  startDate: number;
  theme: 'graphite' | 'matcha' | 'ocean' | 'peach' | 'lavender';
  locationPreference: 'gym' | 'home' | 'outdoor';
  equipmentPreference: 'equipment' | 'bodyweight';
}

export type TabType = 'home' | 'trends' | 'health' | 'settings';

