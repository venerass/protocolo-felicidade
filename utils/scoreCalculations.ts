import { Habit, DailyLog, FrequencyType, Category } from '../types';

/**
 * Calculate weekly average score based on Sunday-Saturday week
 * This is the single source of truth for weekly score calculation
 */
export const calculateWeeklyAverage = (habits: Habit[], logs: DailyLog): number => {
    const today = new Date();

    // Calculate Sunday of current week
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);
    sunday.setHours(0, 0, 0, 0);

    let totalScore = 0;
    let daysCount = 0;
    const debugInfo: any[] = [];

    // Calculate for each day in the week (Sunday to today)
    for (let i = 0; i <= currentDay; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const dateStr = d.toLocaleDateString('en-CA');

        const dayLogs = logs[dateStr];
        if (!dayLogs || Object.keys(dayLogs).length === 0) {
            debugInfo.push({ date: dateStr, skipped: 'no logs' });
            continue; // Skip days with no data
        }

        const dailyHabits = habits.filter(h => h.frequencyType === FrequencyType.DAILY);
        if (dailyHabits.length === 0) {
            debugInfo.push({ date: dateStr, skipped: 'no daily habits' });
            continue; // Skip if no daily habits
        }

        let totalWeight = 0;
        let achievedWeight = 0;

        dailyHabits.forEach(h => {
            const weight = h.weight || 2;
            totalWeight += weight;
            const isDone = !!dayLogs[h.id];

            // Handle different habit types
            if (h.unit === 'max_x') {
                // Limit habit: NOT done = good
                if (!isDone) achievedWeight += weight;
            } else if (h.category === Category.VICIOS) {
                // Abstinence: done (checked) = good
                if (isDone) achievedWeight += weight;
            } else {
                // Regular: done = good
                if (isDone) achievedWeight += weight;
            }
        });

        if (totalWeight > 0) {
            // Calculate daily score and cap at 100
            const dailyScore = Math.min(100, Math.round((achievedWeight / totalWeight) * 100));
            totalScore += dailyScore;
            daysCount++;
            debugInfo.push({
                date: dateStr,
                dailyHabits: dailyHabits.length,
                totalWeight,
                achievedWeight,
                dailyScore
            });
        }
    }

    // Calculate average and ensure it's capped at 100
    const avgScore = daysCount > 0 ? Math.min(100, Math.round(totalScore / daysCount)) : 0;

    // Log debug info if score would exceed 100 without cap
    const uncappedAvg = daysCount > 0 ? Math.round(totalScore / daysCount) : 0;
    if (uncappedAvg > 100) {
        console.warn('⚠️ Weekly average would exceed 100% without cap!', {
            uncappedAvg,
            cappedAvg: avgScore,
            totalScore,
            daysCount,
            days: debugInfo
        });
    }

    return avgScore;
};

/**
 * Calculate streak (consecutive days with logged data)
 */
export const calculateStreak = (logs: DailyLog): number => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');

        const dayData = logs[dateStr];
        if (dayData && Object.keys(dayData).length > 0) {
            // Check if it has at least one true value (completed habit) or mood
            const hasActivity = Object.values(dayData).some(v => v === true || typeof v === 'number');
            if (hasActivity) {
                streak++;
            } else if (i > 0) {
                break; // Break if empty day found (skip today check)
            }
        } else if (i === 0) {
            continue; // Allow today to be empty
        } else {
            break;
        }
    }

    return streak;
};
