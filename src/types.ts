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
  username?: string;
}

export type TabType = 'home' | 'trends' | 'health' | 'community' | 'settings';

export interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: number;
}

export interface CommunityPost {
  _id?: string;
  username: string;
  content: string;
  recordType: 'workout' | 'rest';
  type: string;
  durationMins: number;
  intensity?: string;
  mood?: string;
  timestamp: number;
  createdAt: number;
  comments?: Comment[];
}

