
import { Habit, DailyLog, Category, FrequencyType } from './types';

// Mock Data
const mockHabits: Habit[] = [
    {
        id: 'daily1',
        title: 'Daily 1',
        category: Category.SAUDE,
        frequencyType: FrequencyType.DAILY,
        targetCount: 1,
        unit: 'bool',
        enabled: true,
        timeOfDay: 'morning',
        weight: 2
    },
    {
        id: 'daily2',
        title: 'Daily 2',
        category: Category.SAUDE,
        frequencyType: FrequencyType.DAILY,
        targetCount: 1,
        unit: 'bool',
        enabled: true,
        timeOfDay: 'morning',
        weight: 2
    },
    {
        id: 'weekly1',
        title: 'Weekly Bonus',
        category: Category.SOCIAL,
        frequencyType: FrequencyType.WEEKLY,
        targetCount: 1,
        unit: 'x',
        enabled: true,
        timeOfDay: 'any',
        weight: 2
    }
];

const calculateScore = (habits: Habit[], logs: DailyLog, dateStr: string) => {
    const dayLogs = logs[dateStr] || {};

    // 1. Denominator: Sum of ALL daily habit weights.
    const dailyHabits = habits.filter(h => h.frequencyType === FrequencyType.DAILY);
    let totalWeight = 0;
    let achievedWeight = 0;

    dailyHabits.forEach(h => {
        const weight = h.weight || 2;
        totalWeight += weight;

        if (dayLogs[h.id]) {
            achievedWeight += weight;
        }
    });

    // 2. Numerator Bonus: Add weights of ANY Weekly habit done TODAY.
    const weeklyHabits = habits.filter(h => h.frequencyType === FrequencyType.WEEKLY);
    weeklyHabits.forEach(h => {
        const weight = h.weight || 2;
        if (dayLogs[h.id]) {
            achievedWeight += weight;
        }
    });

    if (totalWeight === 0) return 0;
    // Cap at 100%
    return Math.min(100, Math.round((achievedWeight / totalWeight) * 100));
};

// Test Cases
console.log("--- Testing Score Logic ---");

// Case 1: 50% Completion
const logs1: DailyLog = {
    '2023-10-27': {
        'daily1': true
    }
};
const score1 = calculateScore(mockHabits, logs1, '2023-10-27');
console.log(`Case 1 (1/2 Daily): Expected 50, Got ${score1}`);
if (score1 !== 50) console.error("FAIL");

// Case 2: 100% Completion
const logs2: DailyLog = {
    '2023-10-27': {
        'daily1': true,
        'daily2': true
    }
};
const score2 = calculateScore(mockHabits, logs2, '2023-10-27');
console.log(`Case 2 (2/2 Daily): Expected 100, Got ${score2}`);
if (score2 !== 100) console.error("FAIL");

// Case 3: Bonus (Weekly habit done) - Should be capped at 100
const logs3: DailyLog = {
    '2023-10-27': {
        'daily1': true,
        'daily2': true,
        'weekly1': 1
    }
};
const score3 = calculateScore(mockHabits, logs3, '2023-10-27');
console.log(`Case 3 (2/2 Daily + Weekly Bonus): Expected 100 (Capped), Got ${score3}`);
if (score3 !== 100) console.error("FAIL");

// Case 4: Bonus helping recover score
const logs4: DailyLog = {
    '2023-10-27': {
        'daily1': true,
        // daily2 missing
        'weekly1': 1 // Bonus covers it
    }
};
const score4 = calculateScore(mockHabits, logs4, '2023-10-27');
// Total Weight = 4. Achieved = 2 (daily1) + 2 (weekly1) = 4. Score = 100.
console.log(`Case 4 (1/2 Daily + Weekly Bonus): Expected 100, Got ${score4}`);
if (score4 !== 100) console.error("FAIL");

console.log("--- Test Complete ---");
