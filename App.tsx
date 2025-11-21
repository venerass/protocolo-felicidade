
import React, { useState, useEffect } from 'react';
import { DailyLog, Habit, UserProfile, View, AuthUser } from './types';
import { firebaseService } from './services/firebase';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Social } from './components/Social';
import { AIAssistant } from './components/AIAssistant';
import { Settings } from './components/Settings';
import { Layout } from './components/Layout';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<DailyLog>({});
  const [showTour, setShowTour] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAuthChanges(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDataLoading(true);
        
        try {
          // Load data from Firestore
          const data = await firebaseService.getUserData(currentUser.uid);
          if (data) {
            setProfile(data.profile);
            setHabits(data.habits || []);
            setLogs(data.logs || {});
          } else {
            // New user, data will be created after Onboarding
            setProfile(null);
            setHabits([]);
            setLogs({});
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        } finally {
          setIsDataLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setHabits([]);
        setLogs({});
      }
      
      setIsAuthChecking(false);
    });
    
    // Safety fallback: if firebase isn't init, stop loading after a moment so user sees Auth screen
    const safetyTimer = setTimeout(() => setIsAuthChecking(false), 2000);

    return () => {
        if (unsubscribe) unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, []);

  const handleOnboardingComplete = async (newProfile: UserProfile, customizedHabits: Habit[]) => {
    if (!user) return;
    
    setProfile(newProfile);
    setHabits(customizedHabits);
    
    // Save to Backend
    await firebaseService.saveUserData(user.uid, newProfile, customizedHabits, {});
    
    setView('dashboard');
    setShowTour(true);
  };

  // Wrapper to update state AND persist
  const updateHabits = async (newHabits: Habit[]) => {
      setHabits(newHabits);
      if (user && profile) {
        await firebaseService.saveUserData(user.uid, profile, newHabits, logs);
      }
  };

  const handleToggleHabit = async (habitId: string, date: string, value: any) => {
    const newLogs = { ...logs };
    if (!newLogs[date]) newLogs[date] = {};
    
    if (value === false) {
      delete newLogs[date][habitId];
    } else {
      newLogs[date][habitId] = value;
    }
    
    setLogs(newLogs);
    
    if (user && profile) {
      await firebaseService.saveUserData(user.uid, profile, habits, newLogs);
    }
  };

  // 1. Initial Auth Check
  if (isAuthChecking) {
      return (
        <div className="flex h-screen items-center justify-center text-[#44403C] bg-[#F5F5F0]">
          <div className="animate-pulse flex flex-col items-center">
             <div className="w-12 h-12 bg-[#1C1917] rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">P</div>
             <span className="text-sm font-medium opacity-70">Conectando ao servidor...</span>
          </div>
        </div>
      );
  }

  // 2. Not Logged In
  if (!user) {
    return <Auth />;
  }

  // 3. Logged In but fetching Profile data
  if (isDataLoading) {
      return (
        <div className="flex h-screen items-center justify-center text-[#44403C] bg-[#F5F5F0]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#44403C] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Carregando sua jornada...</span>
          </div>
        </div>
      );
  }

  // 4. No Profile -> Onboarding
  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} initialName={user.displayName} />;
  }

  // 5. Main App
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
        <Social habits={habits} logs={logs} profile={profile} />
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
