import React, { useState, useEffect } from 'react';
import { UserProfile, SurveyAnswers, Habit, FrequencyType } from '../types';
import { ChevronRight, Check, Battery, Heart, Zap, Brain, Smile } from 'lucide-react';
import { HABIT_LIBRARY } from '../constants';
import { HabitManager } from './HabitManager';

interface Props {
  onComplete: (profile: UserProfile, customizedHabits: Habit[]) => void;
  initialName?: string | null;
}

export const Onboarding: React.FC<Props> = ({ onComplete, initialName }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  
  // Temporary state for habits during the review phase
  const [generatedHabits, setGeneratedHabits] = useState<Habit[]>([]);

  const [answers, setAnswers] = useState<SurveyAnswers>({
    sleepQuality: 5,
    stressLevel: 5,
    activityLevel: 'moderate',
    dietQuality: 'average',
    relationshipStatus: 'dating',
    socialBattery: 'ambivert',
    smokes: false,
    alcoholFreq: 'socially',
    cannabisUser: false,
    screenTimeIssue: true,
    primaryGoals: ['energy']
  });

  // Auto-fill name if provided from Auth
  useEffect(() => {
    if (initialName) {
        setName(initialName);
        setStep(1); // Skip name input step
    }
  }, [initialName]);

  const updateAnswer = (key: keyof SurveyAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const toggleGoal = (goal: string) => {
    setAnswers(prev => {
        const goals = prev.primaryGoals.includes(goal)
            ? prev.primaryGoals.filter(g => g !== goal)
            : [...prev.primaryGoals, goal];
        return { ...prev, primaryGoals: goals };
    });
  };

  // Function to generate habits initially
  const generateInitialHabits = () => {
    const protocol: Habit[] = [];
    const add = (id: string, overrides: Partial<Habit> = {}, why?: string) => {
      const template = HABIT_LIBRARY.find(h => h.id === id);
      if (template && !protocol.find(p => p.id === id)) {
        protocol.push({ ...template, enabled: true, streak: 0, whyChosen: why, ...overrides } as Habit);
      }
    };

    add('sleep_7h', { weight: 3 }, 'Fundamental para qualquer objetivo.');
    add('hydration', {}, 'Base biológica para energia.');
    add('environment', {}, 'Pequena vitória para disciplina.');
    add('sunlight', {}, 'Regulação hormonal.');

    if (answers.activityLevel === 'sedentary') add('exercise_light', { weight: 2 }, 'Começar devagar para criar constância.');
    else add('exercise_heavy', { weight: 3 }, 'Manter sua performance física.');

    if (answers.primaryGoals.includes('peace') || answers.stressLevel > 6) {
        add('meditation', { weight: 1 }, 'Redução ativa de cortisol.');
        add('gratitude', { weight: 1 }, 'Reorientação mental para o positivo.');
    }
    
    if (answers.primaryGoals.includes('connection') || answers.relationshipStatus !== 'single') {
        add('partner_connection', { weight: 3 }, 'Fortalecer laços íntimos.');
        add('kindness', { weight: 1 }, 'Gerar bem-estar social.');
    }
    
    if (answers.primaryGoals.includes('energy')) {
        add('cold_shower', { weight: 1 }, 'Boost natural de adrenalina.');
        add('diet_clean', { weight: 2 }, 'Combustível estável.');
    }

    if (answers.sleepQuality < 7) add('no_screens_bed', { weight: 2 }, 'Melhorar higiene do sono.');
    if (answers.smokes) add('no_nicotine', { weight: 3 }, 'Remover interferência na saúde.');
    if (answers.alcoholFreq === 'often') add('limit_alcohol', { weight: 2 }, 'Moderação para saúde.');
    if (answers.screenTimeIssue) add('limit_shorts', { weight: 3 }, 'Recuperar dopamina.');
    
    setGeneratedHabits(protocol);
  };

  // Automatic transition when reaching loading step
  useEffect(() => {
    if (step === 5) {
      generateInitialHabits();
      const timer = setTimeout(() => {
        setStep(6);
      }, 2000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 6) {
      // Finalize
      const profile: UserProfile = {
        name,
        onboardingCompleted: true,
        surveyAnswers: answers,
        level: 1,
        experience: 0
      };
      onComplete(profile, generatedHabits);
    }
  };

  const handleBack = () => {
    if (step > 0 && step !== 5) {
        // If we skipped step 0 automatically, don't go back to it
        if (step === 1 && initialName) return;
        setStep(step - 1);
    }
  };

  const SelectionCard = ({ selected, onClick, title, icon: Icon, desc }: any) => (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 group ${
        selected 
          ? 'border-[#44403C] bg-[#E7E5E4] shadow-sm' 
          : 'border-transparent bg-white hover:bg-[#FAFAF9] hover:border-[#D6D3D1]'
      }`}
    >
      <div className={`p-2.5 rounded-full ${selected ? 'bg-[#44403C] text-white' : 'bg-[#F5F5F0] text-[#78716C]'}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className={`font-semibold text-sm ${selected ? 'text-[#1C1917]' : 'text-[#44403C]'}`}>{title}</h3>
        {desc && <p className="text-xs text-[#78716C] mt-0.5">{desc}</p>}
      </div>
      {selected && <div className="ml-auto text-[#44403C]"><Check size={18} /></div>}
    </button>
  );

  const RangeSlider = ({ value, onChange, min, max, labels }: any) => (
    <div className="py-4">
      <div className="flex justify-between mb-2 text-xs font-medium text-[#78716C]">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-[#E7E5E4] rounded-lg appearance-none cursor-pointer accent-[#44403C] range-lg"
      />
      <div className="text-center mt-2 text-xl font-bold text-[#44403C]">{value}/10</div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in text-center py-8">
            <h1 className="text-3xl font-bold text-[#1C1917]">Protocolo Felicidade</h1>
            <p className="text-[#78716C] text-lg">Uma jornada científica e personalizada.</p>
            <div className="pt-6">
                <label className="block text-left text-sm font-medium text-[#57534E] mb-2">Como devemos te chamar?</label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full text-2xl border-b-2 border-[#E7E5E4] focus:border-[#44403C] outline-none py-2 bg-transparent placeholder:text-[#D6D3D1] text-[#1C1917]"
                autoFocus
                />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2 mb-4">
              <Battery className="text-yellow-600" size={24}/> Energia & Corpo
            </h2>
            
            <div className="bg-[#FAFAF9] p-4 rounded-xl border border-[#F5F5F0]">
              <label className="block text-sm font-medium text-[#57534E] mb-1">Qualidade do Sono</label>
              <RangeSlider 
                value={answers.sleepQuality} 
                onChange={(v: number) => updateAnswer('sleepQuality', v)}
                min={1} max={10} 
                labels={['Péssimo', 'Restaurador']} 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#57534E] ml-1">Nível de Atividade Física</label>
              <SelectionCard 
                title="Sedentário" 
                desc="Pouco exercício"
                icon={Battery}
                selected={answers.activityLevel === 'sedentary'}
                onClick={() => updateAnswer('activityLevel', 'sedentary')}
              />
              <SelectionCard 
                title="Moderado" 
                desc="1-3x semana"
                icon={Zap}
                selected={answers.activityLevel === 'moderate'}
                onClick={() => updateAnswer('activityLevel', 'moderate')}
              />
              <SelectionCard 
                title="Ativo" 
                desc="4x+ semana"
                icon={Zap}
                selected={answers.activityLevel === 'active'}
                onClick={() => updateAnswer('activityLevel', 'active')}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2 mb-4">
              <Brain className="text-blue-600" size={24}/> Mente & Controle
            </h2>
            
            <div className="bg-[#FAFAF9] p-4 rounded-xl border border-[#F5F5F0]">
              <label className="block text-sm font-medium text-[#57534E] mb-1">Stress Atual</label>
              <RangeSlider 
                value={answers.stressLevel} 
                onChange={(v: number) => updateAnswer('stressLevel', v)}
                min={1} max={10} 
                labels={['Zen', 'Muito Alto']} 
              />
            </div>

            <div className="bg-white p-4 rounded-xl space-y-4 border border-[#E7E5E4]">
              <label className="flex items-center gap-3 cursor-pointer hover:bg-[#FAFAF9] p-2 -m-2 rounded-lg transition">
                <input type="checkbox" checked={answers.smokes} onChange={(e) => updateAnswer('smokes', e.target.checked)} className="w-5 h-5 text-[#44403C] rounded accent-[#44403C]" />
                <span className="text-[#57534E] text-sm font-medium">Fumo / Uso nicotina</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-[#FAFAF9] p-2 -m-2 rounded-lg transition">
                <input type="checkbox" checked={answers.cannabisUser} onChange={(e) => updateAnswer('cannabisUser', e.target.checked)} className="w-5 h-5 text-[#44403C] rounded accent-[#44403C]" />
                <span className="text-[#57534E] text-sm font-medium">Uso Cannabis</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-[#FAFAF9] p-2 -m-2 rounded-lg transition">
                <input type="checkbox" checked={answers.screenTimeIssue} onChange={(e) => updateAnswer('screenTimeIssue', e.target.checked)} className="w-5 h-5 text-[#44403C] rounded accent-[#44403C]" />
                <span className="text-[#57534E] text-sm font-medium">Uso excessivo de celular</span>
              </label>
               <label className="block mt-2 text-sm font-medium text-[#57534E] mb-1">Frequência Álcool</label>
               <select 
                 value={answers.alcoholFreq}
                 onChange={(e) => updateAnswer('alcoholFreq', e.target.value)}
                 className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
               >
                 <option value="never">Nunca</option>
                 <option value="socially">Socialmente</option>
                 <option value="often">Frequentemente</option>
               </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
             <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2 mb-4">
              <Heart className="text-rose-500" size={24}/> Social & Conexão
            </h2>
             <div className="space-y-2">
              <label className="block text-sm font-medium text-[#57534E]">Status de Relacionamento</label>
              <div className="grid grid-cols-3 gap-2">
                {['single', 'dating', 'married'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateAnswer('relationshipStatus', status)}
                    className={`p-3 rounded-lg border text-sm font-medium capitalize transition ${
                      answers.relationshipStatus === status 
                      ? 'bg-[#44403C] text-white border-[#44403C]' 
                      : 'bg-white border-[#E7E5E4] text-[#57534E] hover:bg-[#FAFAF9]'
                    }`}
                  >
                    {status === 'single' ? 'Solteiro' : status === 'dating' ? 'Namorando' : 'Casado'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mt-4">
               <label className="block text-sm font-medium text-[#57534E]">Bateria Social</label>
               <SelectionCard 
                title="Introvertido" 
                desc="Recarrego sozinho"
                icon={Battery}
                selected={answers.socialBattery === 'introvert'}
                onClick={() => updateAnswer('socialBattery', 'introvert')}
              />
               <SelectionCard 
                title="Extrovertido" 
                desc="Recarrego com pessoas"
                icon={Zap}
                selected={answers.socialBattery === 'extrovert'}
                onClick={() => updateAnswer('socialBattery', 'extrovert')}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <Smile className="text-orange-500" size={24}/> Objetivos
            </h2>
            <p className="text-[#78716C] text-sm -mt-3 mb-4">O que é prioridade para você hoje?</p>

            <div className="grid gap-2">
              <SelectionCard 
                title="Energia & Vitalidade" 
                desc="Quero mais disposição"
                icon={Zap}
                selected={answers.primaryGoals.includes('energy')}
                onClick={() => toggleGoal('energy')}
              />
              <SelectionCard 
                title="Paz Mental" 
                desc="Menos ansiedade e stress"
                icon={Brain}
                selected={answers.primaryGoals.includes('peace')}
                onClick={() => toggleGoal('peace')}
              />
              <SelectionCard 
                title="Conexões" 
                desc="Melhorar relacionamentos"
                icon={Heart}
                selected={answers.primaryGoals.includes('connection')}
                onClick={() => toggleGoal('connection')}
              />
            </div>
          </div>
        );
      case 5: 
        return (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center h-full">
             <div className="w-12 h-12 border-4 border-[#E7E5E4] border-t-[#44403C] rounded-full animate-spin mb-6"></div>
             <h2 className="text-xl font-bold text-[#1C1917]">Desenhando sua rotina...</h2>
             <p className="text-[#78716C] mt-2 text-sm max-w-xs">Nossa IA está selecionando hábitos baseados na ciência para o seu perfil.</p>
          </div>
        );
      case 6:
        // Habit Review Stage - Fixed layout to show button
        return (
           <div className="animate-fade-in h-full flex flex-col relative">
             <div className="pb-2 border-b border-[#E7E5E4] shrink-0">
                <h2 className="text-xl font-bold text-[#1C1917]">Seu Protocolo</h2>
                <p className="text-xs text-[#78716C]">Edite os hábitos sugeridos para se adaptar à sua realidade.</p>
             </div>
             
             <div className="flex-1 min-h-0 overflow-hidden">
                <HabitManager 
                    habits={generatedHabits} 
                    onUpdateHabits={setGeneratedHabits} 
                    mode="onboarding"
                />
             </div>

             <div className="pt-4 mt-auto shrink-0 bg-[#F5F5F0] relative z-10 border-t border-[#E7E5E4]">
                <button
                    onClick={handleNext}
                    className="w-full bg-[#1C1917] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-black transition flex items-center justify-center gap-2"
                >
                   Começar Jornada <Check size={18}/>
                </button>
             </div>
           </div>
        )
    }
  };

  return (
    <div className="min-h-screen bg-[#E7E5E4] flex items-center justify-center p-4">
      <div className={`bg-[#F5F5F0] w-full max-w-lg rounded-3xl shadow-xl p-6 md:p-8 flex flex-col border border-white/50 relative transition-all ${step === 6 ? 'h-[85vh]' : 'min-h-[500px]'}`}>
        
        {step < 5 && (
          <div className="mb-6 flex gap-1.5 shrink-0">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#44403C]' : 'bg-[#E7E5E4]'}`} />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {renderStep()}
        </div>

        {step < 5 && (
          <div className="pt-6 flex justify-between items-center mt-auto shrink-0">
             {step > 0 ? (
                 <button onClick={handleBack} className="text-[#78716C] hover:text-[#1C1917] text-sm font-medium px-2">
                     Voltar
                 </button>
             ) : <div />}
             
            <button
              onClick={handleNext}
              disabled={step === 0 && !name}
              className="flex items-center gap-2 px-6 py-3 bg-[#1C1917] text-white rounded-xl font-medium hover:bg-[#44403C] transition disabled:opacity-50 shadow-md text-sm"
            >
              Próximo <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};