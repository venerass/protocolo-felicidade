import React, { useState, useEffect } from 'react';
import { DailyLog, Habit, UserProfile, View } from './types';
import { storageService } from './services/storageService';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Social } from './components/Social';
import { AIAssistant } from './components/AIAssistant';
import { Settings } from './components/Settings';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<DailyLog>({});
  const [showTour, setShowTour] = useState(false);

  // Initialize App
  useEffect(() => {
    const savedProfile = storageService.getProfile();
    const savedHabits = storageService.getHabits();
    const savedLogs = storageService.getLogs();

    if (savedProfile) {
      setProfile(savedProfile);
      setHabits(savedHabits || []);
      setLogs(savedLogs || {});
    } else {
      // New user
      setView('onboarding');
    }
    setLoading(false);
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile, customizedHabits: Habit[]) => {
    setProfile(newProfile);
    setHabits(customizedHabits);
    storageService.saveProfile(newProfile);
    storageService.saveHabits(customizedHabits);
    setView('dashboard');
    setShowTour(true); // Trigger tour after onboarding
  };

  const updateHabits = (newHabits: Habit[]) => {
      setHabits(newHabits);
      storageService.saveHabits(newHabits);
  };

  const handleToggleHabit = (habitId: string, date: string, value: any) => {
    setLogs(prevLogs => {
      const newLogs = { ...prevLogs };
      if (!newLogs[date]) newLogs[date] = {};
      
      if (value === false) {
        delete newLogs[date][habitId];
      } else {
        newLogs[date][habitId] = value;
      }
      
      storageService.saveLogs(newLogs);
      return newLogs;
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-[#44403C] bg-[#F5F5F0]">Carregando...</div>;

  if (view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === 'dashboard' && (
        <Dashboard 
            habits={habits} 
            logs={logs} 
            onToggle={handleToggleHabit} 
            showTour={showTour}
            onCloseTour={() => setShowTour(false)}
            onOpenSettings={() => setView('settings')}
        />
      )}
      {view === 'analytics' && (
        <Analytics habits={habits} logs={logs} />
      )}
      {view === 'social' && (
        <Social />
      )}
      {view === 'coach' && profile && (
        <AIAssistant profile={profile} habits={habits} logs={logs} />
      )}
      {view === 'settings' && (
          <Settings 
            habits={habits} 
            onUpdateHabits={updateHabits} 
            onBack={() => setView('dashboard')} 
          />
      )}
    </Layout>
  );
};

export default App;