
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  collection,
  query,
  where,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { UserProfile, Habit, DailyLog, AuthUser } from '../types';
import { APP_CONFIG } from '../config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Initialize with static config
try {
  // Attempt to initialize regardless of content. 
  // If keys are invalid, Firebase SDK will throw a specific error later.
  if (APP_CONFIG.firebase.apiKey) {
      app = initializeApp(APP_CONFIG.firebase);
      auth = getAuth(app);
      db = getFirestore(app);
  } else {
      console.warn("Firebase keys are missing in config.ts.");
  }
} catch (e) {
  console.error("Failed to initialize Firebase:", e);
}

export const firebaseService = {
  
  // Helper to check if we are ready
  isConfigured: () => !!app && !!auth && !!db,

  // 1. AUTHENTICATION
  
  get currentUser() {
    return auth?.currentUser || null;
  },

  subscribeToAuthChanges: (callback: (user: AuthUser | null) => void) => {
    if (!auth) {
        console.error("Firebase Auth not initialized. Check config.ts");
        // Return dummy unsubscribe to prevent crash
        return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        callback(null);
      }
    });
  },

  register: async (email: string, password: string, name: string) => {
    if (!auth || !db) throw new Error("Firebase not initialized. Check API Keys.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, { displayName: name });
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email.toLowerCase(),
        name: name,
        createdAt: new Date().toISOString(),
        stats: { score: 0, streak: 0 },
        friends: []
    });
    
    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name
    };
  },

  login: async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized. Check API Keys.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
    };
  },

  logout: async () => {
    if (!auth) return;
    await signOut(auth);
  },

  // 2. DATA PERSISTENCE

  saveUserData: async (userId: string, profile: UserProfile, habits: Habit[], logs: DailyLog) => {
    if (!db) return;
    await setDoc(doc(db, 'users', userId, 'data', 'protocol'), {
        profile, 
        habits, 
        logs, 
        updatedAt: new Date().toISOString()
    });
  },

  getUserData: async (userId: string) => {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'protocol'));
    if (snap.exists()) {
        return snap.data() as { profile: UserProfile, habits: Habit[], logs: DailyLog };
    }
    return null;
  },

  updatePublicStats: async (userId: string, score: number, streak: number) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', userId), {
        stats: { 
            score, 
            streak, 
            lastActive: new Date().toISOString() 
        }
    });
  },

  // 3. SOCIAL FEATURES

  addFriendByEmail: async (currentUserId: string, friendEmail: string) => {
    if (!db) throw new Error("Database not connected");
    
    const q = query(collection(db, 'users'), where('email', '==', friendEmail.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        throw new Error('Usuário não encontrado com este email.');
    }

    const friendDoc = querySnapshot.docs[0];
    const friendData = friendDoc.data();

    if (friendDoc.id === currentUserId) {
        throw new Error('Você não pode adicionar a si mesmo.');
    }

    await updateDoc(doc(db, 'users', currentUserId), {
        friends: arrayUnion(friendDoc.id)
    });

    return {
        id: friendDoc.id,
        name: friendData.name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${friendData.name}`,
        score: friendData.stats?.score || 0,
        streak: friendData.stats?.streak || 0,
        lastActive: 'Hoje',
        isMe: false
    };
  },

  getFriendsLeaderboard: async (currentUserId: string) => {
    if (!db) return [];
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    if (!userSnap.exists()) return [];
    
    const userData = userSnap.data();
    const friendIds = userData.friends || [];
    
    if (friendIds.length === 0) return [];

    const friendsData = await Promise.all(friendIds.map(async (fid: string) => {
        const fSnap = await getDoc(doc(db, 'users', fid));
        if (!fSnap.exists()) return null;
        
        const fData = fSnap.data();
        return {
            id: fid,
            name: fData.name,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${fData.name}`,
            score: fData.stats?.score || 0,
            streak: fData.stats?.streak || 0,
            lastActive: fData.stats?.lastActive ? new Date(fData.stats.lastActive).toLocaleDateString('pt-BR') : 'Recentemente',
            isMe: false
        };
    }));

    return friendsData.filter(f => f !== null);
  }
};
