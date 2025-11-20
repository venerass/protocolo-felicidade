import { DailyLog, Habit, UserProfile } from '../types';

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
  clear: () => {
    localStorage.clear();
  }
};