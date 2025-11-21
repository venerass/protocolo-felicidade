
import React, { useState } from 'react';
import { Habit } from '../types';
import { HabitManager } from './HabitManager';
import { firebaseService } from '../services/firebase';
import { migrationService } from '../services/migration';
import { Settings as SettingsIcon, ChevronLeft, LogOut, RotateCcw } from 'lucide-react';

interface Props {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  onBack: () => void;
  onResetToOnboarding?: () => Promise<void>;
}

export const Settings: React.FC<Props> = ({ habits, onUpdateHabits, onBack, onResetToOnboarding }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      firebaseService.logout();
    }
  };

  const handleResetHabits = async () => {
    if (!confirm(
      "⚠️ ATENÇÃO: Isso vai RESETAR seus hábitos completamente!\n\n" +
      "• Você voltará ao onboarding para escolher novos hábitos do zero\n" +
      "• Todo seu histórico SERÁ MANTIDO (dias anteriores ficam intactos)\n" +
      "• Hoje você começará com os novos hábitos\n\n" +
      "Tem certeza que deseja continuar?"
    )) {
      return;
    }

    if (!onResetToOnboarding) {
      setResetMessage('❌ Função de reset não disponível.');
      setTimeout(() => setResetMessage(null), 4000);
      return;
    }

    setIsResetting(true);
    setResetMessage(null);

    try {
      await onResetToOnboarding();
      // Success message will be shown by the onboarding flow
    } catch (error) {
      console.error('Reset error:', error);
      setResetMessage('❌ Erro ao resetar. Tente novamente.');
      setTimeout(() => setResetMessage(null), 4000);
      setIsResetting(false);
    }
  };

  return (
    <div className="h-full flex flex-col pb-16">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition -ml-2">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] flex items-center gap-2">
            <SettingsIcon className="text-[#44403C]" size={24} />
            Configurações
          </h1>
          <p className="text-[#78716C] text-sm">Gerencie seu protocolo.</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-2 pb-10">
        {/* Habits Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[400px]">
          <h2 className="font-bold text-gray-900 mb-4">Seus Hábitos Monitorados</h2>
          <p className="text-xs text-gray-500 mb-4">Ative ou desative hábitos para rastrear. Textos atualizam automaticamente ao entrar.</p>

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

          {resetMessage && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${resetMessage.includes('✅')
              ? ' bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              {resetMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResetHabits}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition font-bold text-sm"
            >
              <RotateCcw size={18} className={isResetting ? 'animate-spin' : ''} />
              {isResetting ? 'Resetando...' : 'Recomeçar do Zero (voltar ao onboarding)'}
            </button>
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
