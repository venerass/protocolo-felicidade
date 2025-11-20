import React, { useEffect, useState } from 'react';
import { DailyLog, Habit, UserProfile } from '../types';
import { generateCoachingAdvice } from '../services/geminiService';
import { Sparkles, Bot, RefreshCw } from 'lucide-react';

interface Props {
  profile: UserProfile;
  habits: Habit[];
  logs: DailyLog;
}

export const AIAssistant: React.FC<Props> = ({ profile, habits, logs }) => {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await generateCoachingAdvice(profile, habits, logs);
    setAdvice(result);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch if empty
    if (!advice) {
      fetchAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-24 h-full flex flex-col">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C1917] flex items-center gap-2">
            <Sparkles className="text-yellow-600 fill-yellow-600" size={24}/>
            Mentoria
        </h1>
        <p className="text-[#78716C] text-sm">Inteligência artificial guiando sua jornada.</p>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#E7E5E4] flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#44403C] to-[#78716C]"></div>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                    <Bot className="text-[#44403C]" size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-[#1C1917]">Seu Guia Pessoal</h3>
                    <p className="text-xs text-[#A8A29E]">
                        {loading ? 'Analisando seus dados...' : lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString().slice(0,5)}` : ''}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-[#F5F5F0] rounded w-3/4"></div>
                        <div className="h-4 bg-[#F5F5F0] rounded w-full"></div>
                        <div className="h-4 bg-[#F5F5F0] rounded w-5/6"></div>
                        <div className="h-32 bg-[#F5F5F0] rounded-xl mt-4"></div>
                    </div>
                ) : (
                    <div className="prose prose-stone max-w-none text-[#57534E] text-sm leading-relaxed whitespace-pre-wrap">
                        {advice}
                    </div>
                )}
            </div>

            {!loading && (
                <div className="mt-6 pt-4 border-t border-[#F5F5F0]">
                    <button 
                        onClick={fetchAdvice}
                        className="w-full flex items-center justify-center gap-2 bg-[#F5F5F0] text-[#44403C] py-3 rounded-xl hover:bg-[#E7E5E4] transition font-medium"
                    >
                        <RefreshCw size={18} />
                        Nova Análise
                    </button>
                </div>
            )}
        </div>

        <div className="mt-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-indigo-800 font-semibold text-sm mb-1">💡 Ciência do Hábito</h4>
            <p className="text-indigo-600 text-xs">
                Estudos mostram que a percepção de "estou progredindo" é mais importante neurologicamente do que a meta final.
            </p>
        </div>
      </div>
    </div>
  );
};