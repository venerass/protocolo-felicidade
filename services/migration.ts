import { Habit } from '../types';
import { HABIT_LIBRARY } from '../constants';
import { firebaseService } from './firebase';

/**
 * Migration Service
 * Allows updating default habit texts for existing users
 */

export const migrationService = {
    /**
     * Update specific habit fields for all users or a single user
     * This is useful when you want to update default habit titles/descriptions
     */
    updateHabitFields: async (
        habitId: string,
        updates: Partial<Pick<Habit, 'title' | 'description' | 'scienceTip'>>,
        userId?: string
    ) => {
        if (!firebaseService.isConfigured()) {
            console.warn('Firebase not configured, skipping migration');
            return;
        }

        try {
            if (userId) {
                // Update single user
                const userData = await firebaseService.getUserData(userId);
                if (userData) {
                    const updatedHabits = userData.habits.map(h =>
                        h.id === habitId ? { ...h, ...updates } : h
                    );
                    await firebaseService.saveUserData(userId, userData.profile, updatedHabits, userData.logs);
                    console.log(`✅ Updated habit ${habitId} for user ${userId}`);
                }
            } else {
                console.warn('⚠️ Batch update for all users requires admin SDK. Update manually via Firebase Console or implement with Cloud Functions.');
                // For batch updates to all users, you would need:
                // 1. Firebase Admin SDK (server-side)
                // 2. Cloud Function to iterate through all users
                // 3. Or manual update via Firebase Console
            }
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    },

    /**
     * Sync user's habits with latest library defaults
     * This will update titles/descriptions but preserve user's enabled state and streak
     */
    syncWithLibrary: async (userId: string) => {
        if (!firebaseService.isConfigured()) {
            console.warn('Firebase not configured, skipping sync');
            return;
        }

        try {
            const userData = await firebaseService.getUserData(userId);
            if (!userData) return;

            const updatedHabits = userData.habits.map(userHabit => {
                // Find matching habit in library
                const libraryHabit = HABIT_LIBRARY.find(h => h.id === userHabit.id);

                if (libraryHabit) {
                    // Merge library data with user's personalization
                    return {
                        ...libraryHabit,
                        enabled: userHabit.enabled, // Keep user's choice
                        streak: userHabit.streak, // Keep user's progress
                        whyChosen: userHabit.whyChosen // Keep user's reason
                    };
                }

                return userHabit; // Keep as is if not found in library
            });

            await firebaseService.saveUserData(userId, userData.profile, updatedHabits, userData.logs);
            console.log(`✅ Synced habits with library for user ${userId}`);

            return updatedHabits;
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    },

    /**
     * Get current habit version from library
     */
    getLibraryHabit: (habitId: string) => {
        return HABIT_LIBRARY.find(h => h.id === habitId);
    },

    /**
     * Check which habits are outdated for a user
     */
    checkOutdatedHabits: async (userId: string) => {
        const userData = await firebaseService.getUserData(userId);
        if (!userData) return [];

        const outdated: Array<{
            habitId: string;
            userVersion: Partial<Habit>;
            libraryVersion: any;
            differences: string[];
        }> = [];

        userData.habits.forEach(userHabit => {
            const libraryHabit = HABIT_LIBRARY.find(h => h.id === userHabit.id);

            if (libraryHabit) {
                const diffs: string[] = [];

                if (libraryHabit.title !== userHabit.title) diffs.push('title');
                if (libraryHabit.description !== userHabit.description) diffs.push('description');
                if (libraryHabit.scienceTip !== userHabit.scienceTip) diffs.push('scienceTip');

                if (diffs.length > 0) {
                    outdated.push({
                        habitId: userHabit.id,
                        userVersion: {
                            title: userHabit.title,
                            description: userHabit.description,
                            scienceTip: userHabit.scienceTip
                        },
                        libraryVersion: {
                            title: libraryHabit.title,
                            description: libraryHabit.description,
                            scienceTip: libraryHabit.scienceTip
                        },
                        differences: diffs
                    });
                }
            }
        });

        return outdated;
    },

    /**
     * Manual migration helpers for common updates
     */
    migrations: {
        // Example: Update all "Zero" habits to clarify they're for tracking abstinence
        updateAbstinenceHabits: async (userId: string) => {
            const userData = await firebaseService.getUserData(userId);
            if (!userData) return;

            const abstinenceHabitIds = [
                'no_nicotine',
                'avoid_alcohol',
                'avoid_cannabis',
                'avoid_games',
                'avoid_shorts',
                'avoid_yt'
            ];

            const updatedHabits = userData.habits.map(h => {
                if (abstinenceHabitIds.includes(h.id)) {
                    // Find current library version
                    const libraryHabit = HABIT_LIBRARY.find(lib => lib.id === h.id);
                    if (libraryHabit) {
                        return {
                            ...h,
                            title: libraryHabit.title,
                            description: libraryHabit.description
                        };
                    }
                }
                return h;
            });

            await firebaseService.saveUserData(userId, userData.profile, updatedHabits, userData.logs);
            console.log('✅ Updated abstinence habits for user');
        }
    }
};

/**
 * USAGE EXAMPLES:
 * 
 * 1. Sync specific user with library (safest method):
 *    await migrationService.syncWithLibrary(userId);
 * 
 * 2. Update specific habit for one user:
 *    await migrationService.updateHabitFields('avoid_alcohol', { 
 *      title: 'Zero Álcool',
 *      description: 'Marque se NÃO bebeu hoje'
 *    }, userId);
 * 
 * 3. Check what's outdated:
 *    const outdated = await migrationService.checkOutdatedHabits(userId);
 *    console.log(outdated);
 * 
 * 4. Run specific migration:
 *    await migrationService.migrations.updateAbstinenceHabits(userId);
 * 
 * FOR BATCH UPDATES TO ALL USERS:
 * You need Firebase Cloud Functions or Admin SDK. Here's the pattern:
 * 
 * ```javascript
 * // Cloud Function example
 * const functions = require('firebase-functions');
 * const admin = require('firebase-admin');
 * 
 * exports.migrateAllUsers = functions.https.onCall(async (data, context) => {
 *   const usersSnapshot = await admin.firestore().collection('users').get();
 *   
 *   for (const userDoc of usersSnapshot.docs) {
 *     const userId = userDoc.id;
 *     // Run migration for each user
 *   }
 * });
 * ```
 */
