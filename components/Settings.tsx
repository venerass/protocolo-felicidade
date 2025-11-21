
import React from 'react';
import { Habit } from '../types';
import { HabitManager } from './HabitManager';
import { firebaseService } from '../services/firebase';
import { Settings as SettingsIcon, ChevronLeft, LogOut } from 'lucide-react';

interface Props {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  onBack: () => void;
}

export const Settings: React.FC<Props> = ({ habits, onUpdateHabits, onBack }) => {

  const handleLogout = () => {
      if (confirm("Deseja realmente sair?")) {
          firebaseService.logout();
      }
  };
  
  return (
    <div className="h-full flex flex-col pb-16">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition -ml-2">
            <ChevronLeft size={24} className="text-gray-600"/>
        </button>
        <div>
            <h1 className="text-2xl font-bold text-[#1C1917] flex items-center gap-2">
                <SettingsIcon className="text-[#44403C]" size={24}/>
                Configurações
            </h1>
            <p className="text-[#78716C] text-sm">Gerencie seu protocolo.</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-2 pb-10">
        {/* Habits Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[400px]">
            <h2 className="font-bold text-gray-900 mb-4">Seus Hábitos Monitorados</h2>
            <div className="flex-1 min-h-0">
                <HabitManager 
                    habits={habits} 
                    onUpdateHabits={onUpdateHabits} 
                    mode="settings"
                />
            </div>
        </section>

        {/* Account Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Conta</h2>
            <p className="text-sm text-gray-500 mb-4">Seus dados estão sincronizados na nuvem.</p>
            
            <div className="space-y-3">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition font-bold text-sm"
                >
                    <LogOut size={18} /> Sair da Conta
                </button>
            </div>
        </section>
      </div>
    </div>
  );
};
