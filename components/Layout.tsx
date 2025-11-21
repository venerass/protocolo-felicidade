import React from 'react';
import { View } from '../types';
import { Home, BarChart2, Users, Sparkles, Settings } from 'lucide-react';

interface Props {
  currentView: View;
  onNavigate: (view: View) => void;
  children: React.ReactNode;
  hideNav?: boolean;
}

export const Layout: React.FC<Props> = ({ currentView, onNavigate, children, hideNav = false }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Hoje' },
    { id: 'analytics', icon: BarChart2, label: 'Progresso' },
    { id: 'social', icon: Users, label: 'Comunidade' },
    { id: 'coach', icon: Sparkles, label: 'Mentoria' },
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F0] text-[#44403C] font-sans overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      {!hideNav && (
      <aside className="hidden md:flex flex-col w-64 bg-[#FAFAF9] border-r border-[#E7E5E4] h-full shadow-sm z-10">
        <div className="p-6 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2 text-[#57534E]">
            <div className="w-8 h-8 bg-[#44403C] rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-xl tracking-tight">Protocolo</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-[#E7E5E4] text-[#1C1917] shadow-sm' 
                    : 'text-[#78716C] hover:bg-[#F5F5F0] hover:text-[#44403C]'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#44403C]" />}
              </button>
            );
          })}
           
           <button
              onClick={() => onNavigate('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium mt-8 ${
                currentView === 'settings' 
                  ? 'bg-[#E7E5E4] text-[#1C1917] shadow-sm' 
                  : 'text-[#78716C] hover:bg-[#F5F5F0] hover:text-[#44403C]'
              }`}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </button>
        </nav>

        <div className="p-4 border-t border-[#E7E5E4]">
          <div className="p-4 bg-[#44403C] rounded-xl text-[#FAFAF9] shadow-lg">
            <p className="text-xs font-medium opacity-80 mb-1">Seu nível</p>
            <p className="text-lg font-bold">Iniciado</p>
            <div className="w-full bg-[#78716C] h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-[#FAFAF9] h-full w-1/4 rounded-full"></div>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-12 h-full">
           {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {!hideNav && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAFAF9]/90 backdrop-blur-lg border-t border-[#E7E5E4] px-6 py-3 flex justify-between items-center z-50 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as View)}
              className={`flex flex-col items-center space-y-1 transition-colors duration-200 p-1 ${
                isActive ? 'text-[#1C1917]' : 'text-[#A8A29E] hover:text-[#78716C]'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#E7E5E4]' : 'bg-transparent'}`}>
                 <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      )}
    </div>
  );
};