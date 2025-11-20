import React from 'react';
import { Habit } from '../types';
import { HabitManager } from './HabitManager';
import { Settings as SettingsIcon, ChevronLeft } from 'lucide-react';

interface Props {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  onBack: () => void;
}

export const Settings: React.FC<Props> = ({ habits, onUpdateHabits, onBack }) => {
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

      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <h2 className="font-bold text-gray-900 mb-4">Seus Hábitos Monitorados</h2>
        <div className="flex-1 min-h-0">
             <HabitManager 
                habits={habits} 
                onUpdateHabits={onUpdateHabits} 
                mode="settings"
            />
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
        <h4 className="font-semibold text-indigo-800 mb-1">Modo Avançado</h4>
        <p className="text-sm text-indigo-600">
            Alterar seus hábitos frequentemente pode prejudicar a construção de rotina. Tente manter seu protocolo estável por pelo menos 2 semanas.
        </p>
      </div>
    </div>
  );
};