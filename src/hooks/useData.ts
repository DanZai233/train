import { useState, useEffect, useCallback } from 'react';
import { WorkoutRecord, UserSettings } from '../types';

const defaultSettings: UserSettings = {
  dailyGoalMins: 30,
  weight: 70,
  targetWeight: 65,
  startDate: Date.now(),
  theme: 'graphite',
  locationPreference: 'gym',
  equipmentPreference: 'bodyweight',
};

export function useData() {
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedRecords = localStorage.getItem('lianleme_records');
    const savedSettings = localStorage.getItem('lianleme_settings');
    
    if (savedRecords) {
      try { 
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map((r: any) => {
            let ts = r.timestamp;
            if (!ts && r.date) {
              ts = new Date(r.date).getTime();
            }
            if (!ts || isNaN(ts)) {
              ts = Date.now();
            }
            return { ...r, timestamp: ts };
          });
          setRecords(migrated);
        }
      } catch(e) {}
    }
    if (savedSettings) {
      try { 
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) }); 
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);

  const addRecord = useCallback((durationMins: number, type: string, mood?: string, intensity?: string, recordType: 'workout' | 'rest' = 'workout') => {
    const newRecord: WorkoutRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      durationMins,
      type,
      mood,
      intensity,
      recordType,
    };
    setRecords((prev) => {
      const updated = [...prev, newRecord];
      localStorage.setItem('lianleme_records', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('lianleme_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const resetData = useCallback(() => {
    setRecords([]);
    updateSettings({ startDate: Date.now() });
    localStorage.removeItem('lianleme_records');
  }, [updateSettings]);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('lianleme_records', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const importData = useCallback((importedRecords: WorkoutRecord[], importedSettings: UserSettings) => {
    setRecords(importedRecords);
    setSettings(importedSettings);
    localStorage.setItem('lianleme_records', JSON.stringify(importedRecords));
    localStorage.setItem('lianleme_settings', JSON.stringify(importedSettings));
  }, []);

  return { records, settings, addRecord, updateSettings, isLoaded, resetData, deleteRecord, importData };
}
