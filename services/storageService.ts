import { DailyLog, Habit, UserProfile, BackupData } from '../types';

const KEYS = {
  PROFILE: 'happiness_protocol_profile',
  HABITS: 'happiness_protocol_habits',
  LOGS: 'happiness_protocol_logs'
};

export const storageService = {
  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },
  getProfile: (): UserProfile | null => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },
  saveHabits: (habits: Habit[]) => {
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
  },
  getHabits: (): Habit[] | null => {
    const data = localStorage.getItem(KEYS.HABITS);
    return data ? JSON.parse(data) : null;
  },
  saveLogs: (logs: DailyLog) => {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },
  getLogs: (): DailyLog => {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : {};
  },
  exportData: (): string => {
    const data: BackupData = {
      profile: storageService.getProfile(),
      habits: storageService.getHabits() || [],
      logs: storageService.getLogs(),
      timestamp: Date.now()
    };
    return JSON.stringify(data, null, 2);
  },
  importData: (jsonString: string): boolean => {
    try {
      const data: BackupData = JSON.parse(jsonString);
      if (data.profile) localStorage.setItem(KEYS.PROFILE, JSON.stringify(data.profile));
      if (data.habits) localStorage.setItem(KEYS.HABITS, JSON.stringify(data.habits));
      if (data.logs) localStorage.setItem(KEYS.LOGS, JSON.stringify(data.logs));
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  },
  clear: () => {
    localStorage.clear();
  }
};