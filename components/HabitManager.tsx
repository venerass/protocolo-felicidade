import React, { useState } from 'react';
import { Habit, Category, FrequencyType, TimeOfDay } from '../types';
import { HABIT_LIBRARY } from '../constants';
import { Plus, Trash2, X, Search, ChevronDown, Flame, Shield, Clock, Calendar, CheckCircle2, ListPlus } from 'lucide-react';

interface Props {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  mode: 'onboarding' | 'settings';
}

export const HabitManager: React.FC<Props> = ({ habits, onUpdateHabits, mode }) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom habit creation state
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [newCustomHabit, setNewCustomHabit] = useState<Partial<Habit>>({
    title: '',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    weight: 2,
    timeOfDay: 'morning'
  });

  // --- INLINE EDITING ACTIONS ---

  const updateHabitField = (id: string, field: keyof Habit, value: any) => {
    onUpdateHabits(habits.map(h => {
        if (h.id !== id) return h;
        return { ...h, [field]: value };
    }));
  };

  const cyclePriority = (id: string, currentWeight: number) => {
    // Cycle: 1 -> 2 -> 3 -> 1
    const next = currentWeight === 3 ? 1 : currentWeight + 1;
    updateHabitField(id, 'weight', next);
  };

  const cycleTimeOfDay = (id: string, currentTime: TimeOfDay) => {
    const times: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'any'];
    const idx = times.indexOf(currentTime);
    const next = times[(idx + 1) % times.length];
    updateHabitField(id, 'timeOfDay', next);
  };

  const toggleFrequency = (id: string, currentFreq: FrequencyType) => {
    if (currentFreq === FrequencyType.DAILY) {
        // Switch to Weekly
        onUpdateHabits(habits.map(h => h.id === id ? { ...h, frequencyType: FrequencyType.WEEKLY, targetCount: 3, unit: 'x' } : h));
    } else {
        // Switch to Daily
        onUpdateHabits(habits.map(h => h.id === id ? { ...h, frequencyType: FrequencyType.DAILY, targetCount: 1, unit: 'bool' } : h));
    }
  };

  const incrementTarget = (id: string, current: number) => {
    if (current < 7) updateHabitField(id, 'targetCount', current + 1);
  };

  const decrementTarget = (id: string, current: number) => {
    if (current > 1) updateHabitField(id, 'targetCount', current - 1);
  };

  const handleDelete = (id: string) => {
    onUpdateHabits(habits.filter(h => h.id !== id));
  };

  // --- LIBRARY ACTIONS ---

  const handleAddFromLibrary = (libraryHabit: Omit<Habit, 'enabled' | 'streak'>) => {
    if (habits.find(h => h.id === libraryHabit.id)) return;
    
    const newHabit: Habit = {
      ...libraryHabit,
      enabled: true,
      streak: 0
    };
    onUpdateHabits([...habits, newHabit]);
  };

  const handleCreateCustom = () => {
    if (!newCustomHabit.title) return;
    
    const habit: Habit = {
      id: `custom_${Date.now()}`,
      title: newCustomHabit.title!,
      category: newCustomHabit.category!,
      frequencyType: newCustomHabit.frequencyType!,
      targetCount: newCustomHabit.targetCount || 1,
      unit: newCustomHabit.frequencyType === FrequencyType.DAILY ? 'bool' : 'x',
      description: newCustomHabit.description || 'Hábito personalizado',
      enabled: true,
      timeOfDay: newCustomHabit.timeOfDay as TimeOfDay,
      weight: newCustomHabit.weight || 2,
      streak: 0
    };
    
    onUpdateHabits([...habits, habit]);
    setIsCustomOpen(false);
    setNewCustomHabit({ title: '', category: Category.SAUDE, frequencyType: FrequencyType.DAILY, targetCount: 1, weight: 2, timeOfDay: 'morning' });
  };

  const availableHabits = HABIT_LIBRARY.filter(h => 
    !habits.some(existing => existing.id === h.id) &&
    (h.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     h.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = Object.values(Category);

  // Map values to UI labels
  const getPriorityLabel = (w: number) => w === 3 ? 'Alta' : w === 2 ? 'Média' : 'Baixa';
  const getPriorityColor = (w: number) => w === 3 ? 'bg-red-100 text-red-700 border-red-200' : w === 2 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';
  
  const getTimeLabel = (t: TimeOfDay) => t === 'morning' ? 'Manhã' : t === 'afternoon' ? 'Tarde' : t === 'evening' ? 'Noite' : 'Livre';

  return (
    <div className="h-full flex flex-col relative">
      {/* HABIT LIST - INLINE EDITABLE */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 -mx-2 px-2 pb-20">
        {habits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="p-4 bg-white rounded-full mb-3 shadow-sm">
                 <ListPlus className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">Seu protocolo está vazio.</p>
            <p className="text-gray-400 text-xs mt-1">Adicione hábitos para começar.</p>
          </div>
        )}
        
        {habits.map(habit => (
          <div key={habit.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group hover:border-gray-300 transition">
            
            {/* Row 1: Title & Delete */}
            <div className="flex justify-between items-start mb-3 gap-3">
               <input 
                 value={habit.title}
                 onChange={(e) => updateHabitField(habit.id, 'title', e.target.value)}
                 className="flex-1 font-bold text-[#1C1917] text-sm bg-transparent border-b border-transparent focus:border-[#44403C] outline-none px-0 py-1 transition-colors placeholder-gray-400"
                 placeholder="Nome do hábito"
               />
               <button 
                onClick={() => handleDelete(habit.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition -mr-2 -mt-2"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Row 2: Controls Grid */}
            <div className="flex flex-wrap gap-2">
                
                {/* Priority Toggle */}
                <button 
                    onClick={() => cyclePriority(habit.id, habit.weight)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition select-none ${getPriorityColor(habit.weight)}`}
                >
                    <Flame size={12} className={habit.weight === 3 ? 'fill-red-700' : ''} />
                    {getPriorityLabel(habit.weight)}
                </button>

                {/* Frequency Toggle */}
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                    <button 
                        onClick={() => toggleFrequency(habit.id, habit.frequencyType)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition"
                    >
                        <Calendar size={12} />
                        {habit.frequencyType === FrequencyType.DAILY ? 'Diário' : 'Semanal'}
                    </button>
                    
                    {/* Target Count Control (Only for Weekly) */}
                    {habit.frequencyType === FrequencyType.WEEKLY && (
                        <div className="flex items-center border-l border-gray-200 pl-1 ml-1 gap-1">
                           <button onClick={() => decrementTarget(habit.id, habit.targetCount)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded text-xs">-</button>
                           <span className="text-xs font-bold text-[#1C1917] w-3 text-center">{habit.targetCount}</span>
                           <button onClick={() => incrementTarget(habit.id, habit.targetCount)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded text-xs">+</button>
                        </div>
                    )}
                </div>

                {/* Time Toggle */}
                <button 
                    onClick={() => cycleTimeOfDay(habit.id, habit.timeOfDay)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wide hover:bg-gray-100 transition select-none"
                >
                    <Clock size={12} />
                    {getTimeLabel(habit.timeOfDay)}
                </button>

            </div>
            
            {habit.description && (
                <p className="mt-3 text-xs text-gray-400 truncate">{habit.description}</p>
            )}
          </div>
        ))}
        
        <button 
          onClick={() => setIsLibraryOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-bold hover:bg-gray-50 hover:text-[#44403C] hover:border-[#44403C] transition flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={20} /> Adicionar Novo Hábito
        </button>
      </div>

      {/* --- LIBRARY MODAL --- */}
      {isLibraryOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-[#F5F5F0] rounded-3xl w-full max-w-3xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-white">
                  
                  {/* Header */}
                  <div className="p-6 bg-white border-b border-[#E7E5E4] flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="text-2xl font-bold text-[#1C1917]">Biblioteca de Hábitos</h3>
                        <p className="text-sm text-gray-500">Toque para adicionar ao seu protocolo.</p>
                      </div>
                      <button onClick={() => setIsLibraryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                        <X size={24}/>
                      </button>
                  </div>

                  {/* Search & Toolbar */}
                  <div className="p-4 bg-white/50 backdrop-blur border-b border-[#E7E5E4] flex gap-3">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Buscar hábitos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-[#1C1917] focus:ring-2 focus:ring-[#44403C] outline-none"
                        />
                     </div>
                     <button 
                        onClick={() => { setIsLibraryOpen(false); setIsCustomOpen(true); }}
                        className="px-4 py-2 bg-[#E7E5E4] hover:bg-[#D6D3D1] text-[#44403C] font-bold rounded-xl text-sm transition flex items-center gap-2 whitespace-nowrap"
                     >
                        <Plus size={16}/> Personalizado
                     </button>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                      {availableHabits.length === 0 && (
                         <div className="text-center py-20">
                             <p className="text-gray-400 font-medium">
                                 {searchTerm ? 'Nenhum hábito encontrado.' : 'Você já tem todos os hábitos sugeridos!'}
                             </p>
                         </div>
                      )}

                      {categories.map(cat => {
                          const catHabits = availableHabits.filter(h => h.category === cat);
                          if (catHabits.length === 0) return null;

                          return (
                              <div key={cat} className="animate-fade-in">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                                      {cat}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {catHabits.map(item => (
                                          <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300 transition group flex flex-col justify-between h-full">
                                              <div>
                                                  <div className="flex justify-between items-start mb-2">
                                                      <h5 className="font-bold text-[#1C1917] text-lg leading-tight">{item.title}</h5>
                                                      {item.category === Category.VICIOS ? (
                                                         <Shield size={16} className="text-blue-500 fill-blue-100" />
                                                      ) : (
                                                         item.weight === 3 && <Flame size={16} className="text-orange-500 fill-orange-500" />
                                                      )}
                                                  </div>
                                                  <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{item.description}</p>
                                              </div>
                                              
                                              <div className="mt-auto pt-3 border-t border-gray-50">
                                                 <div className="flex justify-between items-end">
                                                     <div className="flex flex-col text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        <span>{item.frequencyType === FrequencyType.DAILY ? 'Diário' : `${item.targetCount}x Semana`}</span>
                                                        <span>{item.timeOfDay === 'any' ? 'Livre' : item.timeOfDay}</span>
                                                     </div>
                                                     <button 
                                                        onClick={() => handleAddFromLibrary(item)}
                                                        className="px-4 py-2 bg-[#1C1917] text-white rounded-xl font-bold text-xs hover:bg-black flex items-center gap-1 shadow-md"
                                                    >
                                                        Adicionar <Plus size={14} /> 
                                                    </button>
                                                 </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* --- CUSTOM CREATOR MODAL --- */}
      {isCustomOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                 <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Criar Hábito Personalizado</h3>
                 <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Hábito</label>
                        <input 
                            value={newCustomHabit.title}
                            onChange={(e) => setNewCustomHabit({...newCustomHabit, title: e.target.value})}
                            placeholder="Ex: Tocar violão"
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1C1917] focus:ring-2 focus:ring-[#44403C] outline-none font-medium"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Categoria</label>
                        <div className="relative">
                            <select 
                                value={newCustomHabit.category}
                                onChange={(e) => setNewCustomHabit({...newCustomHabit, category: e.target.value as Category})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1C1917] appearance-none focus:ring-2 focus:ring-[#44403C] outline-none"
                            >
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16}/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                        <input 
                            value={newCustomHabit.description}
                            onChange={(e) => setNewCustomHabit({...newCustomHabit, description: e.target.value})}
                            placeholder="Detalhe a ação"
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1C1917] focus:ring-2 focus:ring-[#44403C] outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                            <div className="relative">
                                <select 
                                    value={newCustomHabit.frequencyType}
                                    onChange={(e) => setNewCustomHabit({...newCustomHabit, frequencyType: e.target.value as FrequencyType})}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1C1917] appearance-none focus:ring-2 focus:ring-[#44403C] outline-none"
                                >
                                    <option value={FrequencyType.DAILY}>Diário</option>
                                    <option value={FrequencyType.WEEKLY}>Semanal</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16}/>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Turno</label>
                             <div className="relative">
                                <select 
                                    value={newCustomHabit.timeOfDay}
                                    onChange={(e) => setNewCustomHabit({...newCustomHabit, timeOfDay: e.target.value as TimeOfDay})}
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1C1917] appearance-none focus:ring-2 focus:ring-[#44403C] outline-none"
                                >
                                    <option value="morning">Manhã</option>
                                    <option value="afternoon">Tarde</option>
                                    <option value="evening">Noite</option>
                                    <option value="any">Livre</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16}/>
                             </div>
                        </div>
                    </div>
                    
                    {newCustomHabit.frequencyType === FrequencyType.WEEKLY && (
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="flex justify-between text-xs font-bold text-gray-600 mb-3">
                                <span>VEZES NA SEMANA</span>
                                <span className="text-lg text-[#44403C]">{newCustomHabit.targetCount}x</span>
                            </label>
                            <input 
                                type="range" min="1" max="7" value={newCustomHabit.targetCount}
                                onChange={(e) => setNewCustomHabit({...newCustomHabit, targetCount: parseInt(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#44403C]"
                            />
                         </div>
                    )}
                 </div>
                 <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
                    <button 
                        onClick={() => setIsCustomOpen(false)} 
                        className="px-5 py-2.5 text-gray-500 text-sm font-medium hover:bg-gray-100 rounded-xl transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreateCustom} 
                        disabled={!newCustomHabit.title} 
                        className="px-6 py-2.5 bg-[#1C1917] text-white text-sm font-bold rounded-xl hover:bg-black shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Criar
                    </button>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};