import React, { useState, useMemo } from 'react';
import { Habit, DailyLog, Category, FrequencyType, TimeOfDay } from '../types';
import { Check, Circle, Sun, Moon, Coffee, ArrowRight, X, Settings, Flame, Shield, ShieldAlert, AlertTriangle, Smile, Meh, Frown, Award, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { calculateWeeklyAverage } from '../utils/scoreCalculations';

// Helper to convert 0-100 score back to mood emoji
const getMoodEmoji = (score: number | null) => {
  if (score === null) return '❓';
  if (score <= 25) return '😢'; // 1
  if (score <= 37.5) return '😕'; // 1-2
  if (score <= 62.5) return '😐'; // 2-3
  if (score <= 87.5) return '🙂'; // 3-4
  return '😊'; // 5
};

// Helper for score colors
const getScoreColor = (score: number) => {
  if (score < 40) return 'text-red-500';
  if (score < 50) return 'text-orange-500';
  if (score < 60) return 'text-yellow-500';
  if (score < 70) return 'text-lime-500';
  return 'text-green-700'; // 70+
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#1C1917',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      color: 'white'
    }}>
      <p style={{ marginBottom: '4px', fontWeight: 'bold' }}>{label}</p>
      {payload.map((entry: any, index: number) => {
        const value = entry.value;
        const isWellBeing = entry.dataKey === 'Bem-Estar';

        return (
          <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
            {isWellBeing && value !== null && (
              <span style={{ fontSize: '14px', marginRight: '4px' }}>
                {getMoodEmoji(value)}
              </span>
            )}
            {entry.name}: {value !== null ? `${Math.round(value)}%` : 'N/A'}
          </p>
        );
      })}
    </div>
  );
};

interface Props {
  habits: Habit[];
  logs: DailyLog;
  onToggle?: (habitId: string, date: string, value: any) => void;
  showTour?: boolean;
  onCloseTour?: () => void;
  onOpenSettings?: () => void;
  readOnly?: boolean;
  userName?: string;
  comparisonData?: { habits: Habit[], logs: DailyLog };
}

export const Dashboard: React.FC<Props> = ({ habits, logs, onToggle, showTour = false, onCloseTour = () => { }, onOpenSettings, readOnly = false, userName, comparisonData }) => {
  // ... (existing code)

  // Helper for Local Time YYYY-MM-DD
  const getLocalDate = (date: Date = new Date()) => {
    // en-CA returns YYYY-MM-DD format
    return date.toLocaleDateString('en-CA');
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [tourStep, setTourStep] = useState(0);

  // Tour Content
  const tourSteps = [
    {
      target: 'date-selector',
      title: 'Navegue no Tempo',
      desc: 'Você pode ver dias anteriores para completar o que esqueceu.',
      position: 'top-24'
    },
    {
      target: 'habit-card',
      title: 'Seus Hábitos',
      desc: 'Toque no círculo para completar. O ícone de escudo indica hábitos de proteção (evitar vícios).',
      position: 'top-64'
    },
    {
      target: 'daily-score',
      title: 'Score Diário',
      desc: 'Sua pontuação baseada na importância (peso) dos hábitos. Hábitos semanais feitos hoje contam como bônus!',
      position: 'bottom-24'
    }
  ];


  // Helper to calculate score (reused for comparison)
  const getScoreForData = (targetHabits: Habit[], targetLogs: DailyLog, dateStr: string) => {
    const dayLogs = targetLogs[dateStr] || {};
    const dailyHabits = targetHabits.filter(h => h.frequencyType === FrequencyType.DAILY);
    let totalWeight = 0;
    let achievedWeight = 0;

    dailyHabits.forEach(h => {
      const weight = h.weight || 2;
      totalWeight += weight;
      const isDone = !!dayLogs[h.id];

      if (h.unit === 'max_x') {
        if (!isDone) achievedWeight += weight;
      } else if (h.category === Category.VICIOS) {
        if (isDone) achievedWeight += weight;
      } else {
        if (isDone) achievedWeight += weight;
      }
    });

    if (totalWeight === 0) return 0;
    return Math.min(100, Math.round((achievedWeight / totalWeight) * 100));
  };

  const calculateScore = (dateStr: string) => getScoreForData(habits, logs, dateStr);

  const myComparisonScore = useMemo(() => {
    if (!comparisonData) return null;
    return getScoreForData(comparisonData.habits, comparisonData.logs, selectedDate);
  }, [comparisonData, selectedDate]);

  // ...




  const getHabitStatus = (habit: Habit) => {
    const isDoneToday = !!logs[selectedDate]?.[habit.id];

    if (habit.frequencyType === FrequencyType.WEEKLY) {
      // Calculate start of week (Sunday) based on selectedDate
      const curr = new Date(selectedDate + 'T00:00:00');
      const first = curr.getDate() - curr.getDay();
      // Create date object for Sunday
      const sunday = new Date(curr.setDate(first));

      let count = 0;
      for (let i = 0; i < 7; i++) {
        // Create new date for each day of week
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const dateStr = getLocalDate(d);

        if (logs[dateStr]?.[habit.id]) count++;
      }

      const isMaxType = habit.unit === 'max_x';
      return { isDoneToday, count, isMaxType };
    }

    return { isDoneToday };
  };

  // Calculate Daily Weighted Score with correct logic
  // Helper to calculate score for a specific date


  const dailyScore = useMemo(() => calculateScore(selectedDate), [habits, logs, selectedDate]);

  // Helper to get weekly data for any user
  const getWeeklyData = (targetHabits: Habit[], targetLogs: DailyLog) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDate(d);
      const score = getScoreForData(targetHabits, targetLogs, dateStr);

      const moodRaw = targetLogs[dateStr]?.mood;
      const mood = moodRaw ? ((moodRaw - 1) / 4) * 100 : null;

      days.push({ date: d, score, mood, dateStr });
    }
    return days;
  };

  const friendWeeklyProgress = useMemo(() => getWeeklyData(habits, logs), [habits, logs]);
  const myWeeklyProgress = useMemo(() => {
    if (!comparisonData) return null;
    return getWeeklyData(comparisonData.habits, comparisonData.logs);
  }, [comparisonData]);

  // Helper to calculate streak
  const calculateStreak = (targetLogs: DailyLog) => {
    let streak = 0;
    const today = new Date();
    // Check today and go backwards
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDate(d);
      // Check if any habit was logged (has keys other than 'mood' or empty)
      const dayData = targetLogs[dateStr];
      if (dayData && Object.keys(dayData).length > 0) {
        // Check if it has at least one true value (completed habit) or mood
        const hasActivity = Object.values(dayData).some(v => v === true || typeof v === 'number');
        if (hasActivity) streak++;
        else if (i > 0) break; // Break if empty day found (skip today check)
      } else if (i === 0) {
        continue; // Allow today to be empty
      } else {
        break;
      }
    }
    return streak;
  };

  const myStreak = useMemo(() => comparisonData ? calculateStreak(comparisonData.logs) : 0, [comparisonData]);
  const friendStreak = useMemo(() => calculateStreak(logs), [logs]);

  // Sunday-based weekly average (for main dashboard display) - using centralized utility
  const currentWeeklyAvg = useMemo(() => calculateWeeklyAverage(habits, logs), [habits, logs]);

  // Weekly average scores for comparison mode - using centralized utility
  const friendWeeklyAvgScore = useMemo(() => calculateWeeklyAverage(habits, logs), [habits, logs]);

  const myWeeklyAvgScore = useMemo(() => {
    if (!comparisonData) return 0;
    return calculateWeeklyAverage(comparisonData.habits, comparisonData.logs);
  }, [comparisonData]);

  // Category performance for comparison
  const getCategoryPerformance = (targetHabits: Habit[], targetLogs: DailyLog) => {
    const categories = Object.values(Category);
    return categories.map(cat => {
      const catHabits = targetHabits.filter(h => h.category === cat && h.enabled);
      if (catHabits.length === 0) return { category: cat, score: 0, count: 0 };

      let totalScore = 0;
      let daysChecked = 0;

      // Check last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDate(d);

        catHabits.forEach(h => {
          const isDone = !!targetLogs[dateStr]?.[h.id];
          if (h.unit === 'max_x') {
            if (!isDone) totalScore++;
          } else if (h.category === Category.VICIOS) {
            if (isDone) totalScore++;
          } else {
            if (isDone) totalScore++;
          }
        });
        daysChecked++;
      }

      const maxPossible = catHabits.length * daysChecked;
      const score = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
      return { category: cat, score, count: catHabits.length };
    }).filter(c => c.count > 0);
  };

  const friendCategoryPerf = useMemo(() => getCategoryPerformance(habits, logs), [habits, logs]);
  const myCategoryPerf = useMemo(() => {
    if (!comparisonData) return null;
    return getCategoryPerformance(comparisonData.habits, comparisonData.logs);
  }, [comparisonData]);

  // Use friend's data as default for single view
  const weeklyProgress = friendWeeklyProgress;



  const renderDateSelector = () => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }

    return (
      <div id="date-selector" className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {dates.map(date => {
          const dateStr = getLocalDate(date);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === getLocalDate();

          // Check if data exists for this date
          const hasFriendData = logs[dateStr] && Object.keys(logs[dateStr]).length > 0;
          const hasMyData = comparisonData?.logs[dateStr] && Object.keys(comparisonData.logs[dateStr]).length > 0;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center min-w-[3.5rem] md:min-w-[4.5rem] p-2 md:p-3 rounded-2xl transition-all border ${isSelected
                ? 'bg-[#44403C] text-white border-[#44403C] shadow-lg scale-105'
                : 'bg-white text-[#A8A29E] border-transparent hover:bg-[#FAFAF9] hover:border-[#E7E5E4]'
                }`}
            >
              <span className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">
                {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
              </span>
              <span className="text-xl font-bold">
                {date.getDate()}
              </span>

              {/* Indicators */}
              <div className="flex gap-1 mt-1 h-1.5">
                {/* Today Indicator (if no data) */}
                {isToday && !hasFriendData && !hasMyData && <span className="w-1 h-1 bg-[#D6D3D1] rounded-full"></span>}

                {/* Friend Data Indicator */}
                {hasFriendData && <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>}

                {/* My Data Indicator (Comparison) */}
                {hasMyData && <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  interface HabitCardProps {
    habit: Habit;
    index: number;
    status: { isDoneToday: boolean; count?: number; isMaxType?: boolean };
    onToggle?: (habitId: string, date: string, value: any) => void;
    selectedDate: string;
    readOnly?: boolean;
  }

  const HabitCard: React.FC<HabitCardProps> = ({ habit, index, status, onToggle, selectedDate, readOnly }) => {
    const isMaxType = habit.unit === 'max_x'; // Limit habit (e.g., alcohol max 2x)
    const isAbstinence = habit.category === Category.VICIOS && !isMaxType; // e.g., No Smoking
    const isCompleted = status.isDoneToday;

    const isHighPriority = (habit.weight || 2) === 3;
    const isCritical = (habit.weight || 2) === 3;

    // Determine styles based on type
    let borderClass = "border-transparent";
    let bgClass = "bg-white";
    let iconColor = "text-[#D6D3D1]";
    let iconBg = "bg-[#F5F5F0]";

    if (isCompleted) {
      if (isMaxType) {
        // Logged a vice limit (Bad event logged)
        borderClass = "border-red-100";
        bgClass = "bg-red-50/50";
        iconColor = "text-red-500";
        iconBg = "bg-red-100";
      } else if (isAbstinence) {
        // Logged an abstinence (Good event)
        borderClass = "border-green-100";
        bgClass = "bg-green-50/50";
        iconColor = "text-green-600";
        iconBg = "bg-green-100";
      } else {
        // Standard positive habit
        borderClass = "border-[#D6D3D1]";
        bgClass = "bg-[#E7E5E4]";
        iconColor = "text-white";
        iconBg = "bg-[#44403C]";
      }
    }

    return (
      <div id={index === 0 ? 'habit-card' : undefined} className={`group relative p-5 rounded-2xl border transition-all duration-300 ${!readOnly && 'hover:shadow-md'} ${bgClass} ${borderClass} ${!readOnly && 'hover:border-[#E7E5E4]'} shadow-sm flex flex-col justify-between h-full`}>

        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className={`font-bold text-[#1C1917] text-lg leading-tight mb-1 ${isCompleted && !isMaxType && !isAbstinence ? 'text-[#78716C] line-through decoration-[#A8A29E]' : ''}`}>
              {habit.title}
            </h3>
            <p className="text-sm text-[#78716C] font-medium leading-relaxed">{habit.description}</p>
          </div>

          <button
            disabled={readOnly}
            onClick={() => onToggle && onToggle(habit.id, selectedDate, !status.isDoneToday)}
            className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center transition-all duration-300 focus:outline-none ${iconBg} ${iconColor} ${isCompleted ? 'shadow-sm' : ''} ${!readOnly ? 'transform group-hover:scale-105 cursor-pointer' : 'cursor-default opacity-80'}`}
          >
            {isCompleted ? (
              isMaxType ? <AlertTriangle size={22} /> :
                isAbstinence ? <Shield size={22} fill="currentColor" /> :
                  <Check size={24} strokeWidth={3} />
            ) : (
              isAbstinence || isMaxType ?
                <Shield size={24} strokeWidth={2} className="opacity-30 group-hover:opacity-50 transition-opacity" /> :
                <Circle size={24} strokeWidth={2} className="opacity-30 group-hover:opacity-50 transition-opacity" />
            )}
          </button>
        </div>

        {/* Bottom Tags */}
        <div className="mt-auto pt-2">
          {/* Weekly Progress Bar */}
          {habit.frequencyType === 'weekly' && status.count !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] font-bold text-[#A8A29E] mb-1 uppercase tracking-wider">
                <span>Progresso Semanal</span>
                <span className={status.count > (habit.targetCount || 0) && isMaxType ? 'text-red-500' : ''}>{status.count}/{(habit.targetCount || 0)}</span>
              </div>
              <div className="bg-[#F5F5F0] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${status.count > (habit.targetCount || 0) && isMaxType ? 'bg-red-500' : 'bg-[#44403C]'
                    }`}
                  style={{ width: `${Math.min(100, (status.count / (habit.targetCount || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-[#F5F5F0] text-[#78716C]`}>
              {habit.frequencyType === 'daily' ? 'Diário' : 'Semanal'}
            </span>

            {isHighPriority && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${isCritical ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <Flame size={10} fill="currentColor" /> {isCritical ? 'Alta' : 'Média'}
              </span>
            )}
            {habit.category === Category.VICIOS && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-blue-50 text-blue-700">
                <ShieldAlert size={10} /> Controle
              </span>
            )}
          </div>
        </div>

      </div>
    );
  };

  const renderSection = (title: string, icon: any, timeOfDay: TimeOfDay, startIndex: number) => {
    const sectionHabits = habits.filter(h => {
      if (timeOfDay === 'any') return h.timeOfDay === 'any';
      return h.timeOfDay === timeOfDay;
    });

    if (sectionHabits.length === 0) return null;

    return (
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4 px-1">
          {icon}
          <h2 className="text-lg font-bold text-[#44403C]">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sectionHabits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={startIndex + i}
              status={getHabitStatus(habit)}
              onToggle={onToggle}
              selectedDate={selectedDate}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917]">{userName || 'Hoje'}</h1>
            <p className="text-[#78716C] text-sm">{userName ? 'Visualizando perfil.' : 'Sua jornada diária.'}</p>
          </div>
          {!readOnly && (
            <button
              onClick={onOpenSettings}
              className="p-3 bg-white border border-[#E7E5E4] text-[#44403C] hover:bg-[#FAFAF9] hover:border-[#D6D3D1] rounded-xl transition shadow-sm"
              title="Gerenciar Hábitos"
            >
              <Settings size={20} />
            </button>
          )}
        </div>

        {/* Score / Comparison Area */}
        {comparisonData ? (
          // Comparison Card - Weekly Averages + Streaks
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#78716C] mb-2">Pontuação Semanal</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <span className="text-xs text-[#78716C] block">Você</span>
                  <span className={`text-2xl font-bold ${getScoreColor(myWeeklyAvgScore)}`}>{myWeeklyAvgScore}%</span>
                </div>
                <div className="h-8 w-[1px] bg-gray-200"></div>
                <div className="text-center">
                  <span className="text-xs text-[#78716C] block">{userName?.split(' ')[0]}</span>
                  <span className={`text-2xl font-bold ${getScoreColor(friendWeeklyAvgScore)}`}>{friendWeeklyAvgScore}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#78716C] mb-2">Constância (Streak)</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <span className="text-xs text-[#78716C] block">Você</span>
                  <div className="flex items-center gap-1">
                    <Flame size={16} className="text-orange-500" fill="currentColor" />
                    <span className="text-2xl font-bold text-[#1C1917]">{myStreak}</span>
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-gray-200"></div>
                <div className="text-center">
                  <span className="text-xs text-[#78716C] block">{userName?.split(' ')[0]}</span>
                  <div className="flex items-center gap-1">
                    <Flame size={16} className="text-orange-500" fill="currentColor" />
                    <span className="text-2xl font-bold text-[#1C1917]">{friendStreak}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Daily Score & Weekly Average - Side by Side
          <div className="grid grid-cols-2 gap-4">
            {/* Daily Score */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${dailyScore >= 70
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm'
              : 'bg-white border-[#E7E5E4] shadow-sm'
              }`}>
              {dailyScore >= 70 && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/20 rounded-full blur-3xl -mr-8 -mt-8"></div>
              )}
              <div className="text-center relative z-10">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#78716C]">
                    {dailyScore >= 70 ? '🌟 Dia de Ouro' : 'Hoje'}
                  </span>
                  {dailyScore >= 70 && <span className="bg-yellow-100 text-yellow-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">META</span>}
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-3xl font-bold ${getScoreColor(dailyScore)}`}>{dailyScore}</span>
                  <span className="text-sm font-bold text-[#A8A29E]">%</span>
                </div>
              </div>
            </div>

            {/* Weekly Average */}
            <div className="p-4 rounded-2xl border bg-white border-[#E7E5E4] shadow-sm flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="6.5" fill="none" stroke="#E7E5E4" strokeWidth="1.5" />
                    <circle
                      cx="8"
                      cy="8"
                      r="6.5"
                      fill="none"
                      stroke={currentWeeklyAvg >= 70 ? '#15803d' : currentWeeklyAvg >= 50 ? '#eab308' : '#ef4444'}
                      strokeWidth="1.5"
                      strokeDasharray={`${(currentWeeklyAvg / 100) * 41} 41`}
                      strokeLinecap="round"
                      transform="rotate(-90 8 8)"
                    />
                  </svg>
                  <span className="text-[9px] text-[#78716C] font-bold uppercase tracking-wide">Semana</span>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-3xl font-bold ${getScoreColor(currentWeeklyAvg)}`}>{currentWeeklyAvg}</span>
                  <span className="text-sm font-bold text-[#A8A29E]">%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>


      {/* Charts & Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {comparisonData ? (
          <>
            {/* Comparison Chart 1: Performance */}
            <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-sm">
              <h3 className="text-sm font-bold text-[#78716C] uppercase tracking-wider mb-3">Performance: Você vs {userName?.split(' ')[0]}</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={friendWeeklyProgress.map((day, i) => ({
                  name: day.date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
                  FriendScore: day.score,
                  MyScore: myWeeklyProgress?.[i]?.score,
                  fullDate: day.dateStr
                }))} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F0" />
                  <XAxis dataKey="name" tick={{ fill: '#A8A29E', fontSize: 11 }} axisLine={{ stroke: '#E7E5E4' }} />
                  <YAxis tick={{ fill: '#A8A29E', fontSize: 11 }} axisLine={{ stroke: '#E7E5E4' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1C1917', color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line name="Você" type="monotone" dataKey="MyScore" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                  <Line name={userName?.split(' ')[0]} type="monotone" dataKey="FriendScore" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Chart 2: Performance by Category - RADAR */}
            <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-sm">
              <h3 className="text-sm font-bold text-[#78716C] uppercase tracking-wider mb-3">Performance por Categoria</h3>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={friendCategoryPerf.map((cat) => ({
                  category: cat.category.split(' ')[0],
                  Você: myCategoryPerf?.find(c => c.category === cat.category)?.score || 0,
                  [userName?.split(' ')[0] || 'Amigo']: cat.score
                }))}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <PolarGrid stroke="#E7E5E4" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#78716C', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name="Você" dataKey="Você" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Radar name={userName?.split(' ')[0] || 'Amigo'} dataKey={userName?.split(' ')[0] || 'Amigo'} stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1C1917', color: '#fff', fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <>
            {/* Standard Weekly Chart */}
            <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-sm">
              <h3 className="text-sm font-bold text-[#78716C] uppercase tracking-wider mb-3">Últimos 7 Dias</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart
                  data={weeklyProgress.map(day => ({
                    name: day.date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
                    Desempenho: day.score,
                    'Bem-Estar': day.mood,
                    fullDate: day.dateStr
                  }))}
                  margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F0" />
                  <XAxis dataKey="name" tick={{ fill: '#A8A29E', fontSize: 11 }} axisLine={{ stroke: '#E7E5E4' }} />
                  <YAxis tick={{ fill: '#A8A29E', fontSize: 11 }} axisLine={{ stroke: '#E7E5E4' }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="line" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="Desempenho" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} activeDot={{ r: 5 }} connectNulls />
                  <Line type="monotone" dataKey="Bem-Estar" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-[#A8A29E] mt-2 text-center">Seu desempenho e bem-estar ao longo da semana</p>
            </div>

            {/* Mood Log */}
            <div className="bg-white p-3 md:p-5 rounded-2xl border border-[#E7E5E4] shadow-sm flex flex-col">
              <h3 className="text-xs md:text-sm font-bold text-[#78716C] uppercase tracking-wider mb-3 md:mb-4">Como está se sentindo hoje?</h3>
              <div className="flex justify-between items-center flex-1">
                {[1, 2, 3, 4, 5].map((mood) => {
                  const currentMood = logs[selectedDate]?.mood;
                  const isSelected = currentMood === mood;

                  return (
                    <button
                      key={mood}
                      disabled={readOnly}
                      onClick={() => onToggle && onToggle('mood', selectedDate, mood)}
                      className={`p-1 md:p-2 rounded-full transition-all duration-300 ${isSelected
                        ? 'bg-[#1C1917] text-white scale-110 shadow-md'
                        : 'text-[#A8A29E] hover:bg-[#F5F5F0] hover:scale-105'
                        }`}
                    >
                      {mood === 1 && <Frown size={24} />}
                      {mood === 2 && <Frown size={24} className="rotate-180" />}
                      {mood === 3 && <Meh size={24} />}
                      {mood === 4 && <Smile size={24} />}
                      {mood === 5 && <Smile size={24} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-[10px] md:text-xs text-[#A8A29E] mt-2">
                {logs[selectedDate]?.mood ? 'Humor registrado' : 'Registre seu humor'}
              </p>
            </div>
          </>
        )}
      </div>


      {renderDateSelector()}

      {/* Habits Section - HIDDEN if comparing */}
      {!comparisonData && (
        habits.length === 0 && readOnly ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">Este usuário ainda não configurou hábitos públicos.</p>
          </div>
        ) : (
          <>
            {renderSection('Manhã', <Sun className="text-orange-400" size={20} />, 'morning', 0)}
            {renderSection('Tarde', <Sun className="text-yellow-600" size={20} />, 'afternoon', 10)}
            {renderSection('Noite', <Moon className="text-indigo-400" size={20} />, 'evening', 20)}
            {renderSection('Hábitos Gerais', <Coffee className="text-[#78716C]" size={20} />, 'any', 30)}
            {/* Mobile bottom spacing for better scrolling */}
            <div className="h-24 md:h-8"></div>
          </>
        )
      )}

      {/* TOUR OVERLAY */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs mx-4 relative animate-fade-in-up border border-gray-100">
            <button onClick={onCloseTour} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="mb-4">
              <span className="text-xs font-bold bg-[#1C1917] text-white px-2 py-1 rounded">Dica {tourStep + 1}/{tourSteps.length}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{tourSteps[tourStep].title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{tourSteps[tourStep].desc}</p>
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {tourSteps.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === tourStep ? 'bg-[#1C1917]' : 'bg-gray-200'}`} />
                ))}
              </div>
              <button
                onClick={() => {
                  if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
                  else onCloseTour();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] text-white rounded-xl hover:bg-black transition font-medium text-sm shadow-lg"
              >
                {tourStep === tourSteps.length - 1 ? 'Começar' : 'Próximo'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};