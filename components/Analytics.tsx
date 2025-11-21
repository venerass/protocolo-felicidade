import React from 'react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, YAxis, Legend, CartesianGrid
} from 'recharts';
import { DailyLog, Habit, Category, FrequencyType } from '../types';
import { Award, Calendar, TrendingUp } from 'lucide-react';

// Helper to convert mood value to emoji
const getMoodEmoji = (moodValue: number | null) => {
  if (moodValue === null) return '❓';
  // moodValue is 0-100 scale from mood 1-5
  const mood = Math.round((moodValue / 100) * 4) + 1; // Convert back to 1-5
  if (mood <= 1) return '😢';
  if (mood === 2) return '😕';
  if (mood === 3) return '😐';
  if (mood === 4) return '🙂';
  return '😊';
};

// Custom Tooltip for Analytics
const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#1f2937',
      border: 'none',
      borderRadius: '12px',
      padding: '10px 14px',
      color: 'white',
      fontSize: '12px',
      fontWeight: 600
    }}>
      <p style={{ color: '#9ca3af', marginBottom: '4px' }}>{label}</p>
      {payload.map((entry: any, index: number) => {
        const value = entry.value;
        const isMood = entry.dataKey === 'mood';

        if (isMood && value !== null) {
          return (
            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
              <span style={{ fontSize: '16px', marginRight: '4px' }}>
                {getMoodEmoji(value)}
              </span>
              Humor: {Math.round(value / 20)}/5
            </p>
          );
        }

        return (
          <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
            {entry.dataKey === 'score' ? 'Score Diário' : entry.name}: {value}%
          </p>
        );
      })}
    </div>
  );
};

interface Props {
  habits: Habit[];
  logs: DailyLog;
}

export const Analytics: React.FC<Props> = ({ habits, logs }) => {
  // 1. Calculate Consistency Data (Bar Chart) - WEIGHTED
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const days = getLast7Days();
  const dailyData = days.map(date => {
    const dayLogs = logs[date] || {};
    const dailyHabits = habits.filter(h => h.frequencyType === FrequencyType.DAILY);

    let totalWeight = 0;
    let achievedWeight = 0;

    dailyHabits.forEach(habit => {
      const weight = habit.weight || 2; // Default to Medium
      totalWeight += weight;

      const isDone = !!dayLogs[habit.id];
      if (habit.unit === 'max_x') {
        if (!isDone) achievedWeight += weight;
      } else {
        if (isDone) achievedWeight += weight;
      }
    });

    const score = totalWeight === 0 ? 0 : Math.round((achievedWeight / totalWeight) * 100);

    return {
      name: date.split('-')[2] + '/' + date.split('-')[1],
      score: score,
      fullDate: date
    };
  });

  // 2. Calculate Category Balance (Radar Chart) - WEIGHTED
  const categories = Object.values(Category);
  const radarData = categories.map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    if (catHabits.length === 0) return { subject: cat, A: 0, fullMark: 100 };

    let totalPotentialPoints = 0;
    let totalEarnedPoints = 0;

    // Analysing last 7 days for radar
    days.forEach(day => {
      const dayLogs = logs[day] || {};

      catHabits.forEach(h => {
        const weight = h.weight || 2;

        if (h.frequencyType === FrequencyType.DAILY) {
          totalPotentialPoints += weight;
          if (dayLogs[h.id]) totalEarnedPoints += weight;
        }
      });
    });

    // Add Weekly Habits calculation
    catHabits.filter(h => h.frequencyType === FrequencyType.WEEKLY).forEach(h => {
      const weight = h.weight || 2;
      totalPotentialPoints += (weight * 1); // Consider weekly habit as 1 big event worth its weight

      // Check completion in the last 7 days window
      const count = days.reduce((acc, d) => acc + (logs[d]?.[h.id] ? 1 : 0), 0);

      if (h.unit === 'max_x') {
        // For vices: success is being UNDER the limit
        if (count <= h.targetCount) totalEarnedPoints += weight;
      } else {
        // For positive habits
        if (count >= h.targetCount) totalEarnedPoints += weight;
        else totalEarnedPoints += (count / h.targetCount) * weight;
      }
    });

    const score = totalPotentialPoints === 0 ? 0 : Math.round((totalEarnedPoints / totalPotentialPoints) * 100);

    // Shorten names for chart
    const shortName = cat.split(' ')[0];
    return { subject: shortName, A: score, fullMark: 100 };
  });

  // Score vs Mood Correlation Data
  const scoreMoodData = days.map(date => {
    const dayData = dailyData.find(d => d.fullDate === date);
    const mood = logs[date]?.mood;

    return {
      name: date.split('-')[2] + '/' + date.split('-')[1],
      score: dayData?.score || 0,
      mood: mood ? mood * 20 : null, // Convert 1-5 scale to 0-100 scale for visualization
      fullDate: date
    };
  });

  // 3. Stats
  const overallConsistency = Math.round(dailyData.reduce((acc, cur) => acc + cur.score, 0) / 7);
  const perfectDays = dailyData.filter(d => d.score >= 90).length; // 90+ is perfect

  // 4. Contribution Grid (Last 28 days)
  const getContributionGrid = () => {
    const grid = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Calculate score for that day
      const dayLogs = logs[dateStr] || {};
      const dailyHabits = habits.filter(h => h.frequencyType === FrequencyType.DAILY);
      let dayScore = 0;
      let dayWeight = 0;

      dailyHabits.forEach(h => {
        dayWeight += (h.weight || 2);
        if (dayLogs[h.id]) dayScore += (h.weight || 2);
      });

      const percentage = dayWeight > 0 ? dayScore / dayWeight : 0;

      let color = 'bg-gray-100';
      if (percentage > 0.1) color = 'bg-indigo-200';
      if (percentage > 0.5) color = 'bg-indigo-400';
      if (percentage > 0.85) color = 'bg-indigo-600';

      grid.push({ date: dateStr, color });
    }
    return grid;
  };

  const contributionGrid = getContributionGrid();

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Análise de Vida</h1>
        <p className="text-gray-500">Métricas baseadas na prioridade dos seus hábitos.</p>
      </header>

      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-2">
            <TrendingUp size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{overallConsistency}%</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Consistência</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-yellow-50 text-yellow-600 rounded-full mb-2">
            <Award size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{perfectDays}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Dias de Ouro</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="p-2 bg-green-50 text-green-600 rounded-full mb-2">
            <Calendar size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{habits.length}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Monitorando</span>
        </div>
      </div>

      {/* Score vs Mood Correlation Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Performance vs Bem-Estar</h2>
        <p className="text-sm text-gray-500 mb-6">Como seu score se relaciona com seu humor diário.</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreMoodData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomAnalyticsTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '13px', fontWeight: 600 }}
                formatter={(value) => value === 'score' ? 'Score Diário' : 'Humor'}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ fill: '#4f46e5', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ fill: '#a855f7', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          💡 Dica: Registre seu humor diariamente para ver padrões entre performance e bem-estar
        </p>
      </div>

      {/* Radar Chart - Balance */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Equilíbrio</h2>
        <p className="text-sm text-gray-500 mb-6">Performance ponderada por categoria.</p>
        <div className="h-64 w-full relative -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#4f46e5"
                strokeWidth={3}
                fill="#6366f1"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-800">Calendário de Constância</h2>
          <div className="flex gap-1 text-[10px] font-bold text-gray-400 items-center">
            <span>MENOS</span>
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-indigo-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-indigo-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>
            <span>MAIS</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {contributionGrid.map((day, i) => (
            <div key={i} className={`aspect-square rounded-md ${day.color}`} title={day.date}></div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
          <span>28 dias atrás</span>
          <span>Hoje</span>
        </div>
      </div>
    </div>
  );
};