
export enum Category {
  SAUDE = 'Corpo & Vitalidade',
  MENTE = 'Mente & Espírito',
  VICIOS = 'Disciplina & Controle',
  SOCIAL = 'Conexões & Tribo',
  PRODUTIVIDADE = 'Ambiente & Foco'
}

export enum FrequencyType {
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';

export interface Habit {
  id: string;
  title: string;
  category: Category;
  frequencyType: FrequencyType;
  targetCount: number; 
  unit: string; 
  description?: string;
  scienceTip?: string;
  enabled: boolean;
  timeOfDay: TimeOfDay;
  streak?: number;
  whyChosen?: string; // Reason why this habit was recommended
  weight: number; // 1 (Low), 2 (Medium), 3 (High)
}

export interface SurveyAnswers {
  // Lifestyle
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
  activityLevel: 'sedentary' | 'moderate' | 'active';
  dietQuality: 'poor' | 'average' | 'good';
  
  // Social
  relationshipStatus: 'single' | 'dating' | 'married';
  socialBattery: 'introvert' | 'extrovert' | 'ambivert';
  
  // Vices
  smokes: boolean;
  alcoholFreq: 'never' | 'socially' | 'often';
  cannabisUser: boolean;
  screenTimeIssue: boolean;
  
  // Goals
  primaryGoals: string[]; // Array of selected goals: 'energy' | 'peace' | 'connection' | 'discipline'
}

export interface UserProfile {
  name: string;
  onboardingCompleted: boolean;
  surveyAnswers: SurveyAnswers;
  level: number;
  experience: number;
  friends?: string[]; // IDs of friends
}

export interface DailyLog {
  [date: string]: {
    [habitId: string]: number | boolean; // boolean for check, number for count
  };
}

export interface BackupData {
  profile: UserProfile | null;
  habits: Habit[];
  logs: DailyLog;
  timestamp: number;
}

// Abstract Auth User to decouple from Firebase types
export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export type View = 'dashboard' | 'analytics' | 'social' | 'coach' | 'onboarding' | 'settings';

export interface AppConfiguration {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  geminiApiKey: string;
}
