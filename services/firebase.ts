
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Firestore
} from 'firebase/firestore';
import { UserProfile, Habit, DailyLog, AuthUser, Group } from '../types';
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
      return () => { };
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
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
      groups: []
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

  loginWithGoogle: async () => {
    if (!auth || !db) throw new Error("Firebase not initialized. Check API Keys.");
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user doc exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email?.toLowerCase(),
        name: user.displayName || 'Usuário',
        createdAt: new Date().toISOString(),
        stats: { score: 0, streak: 0 },
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        groups: []
      });
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
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
    // Ensure score never exceeds 100% before saving
    const cappedScore = Math.min(100, Math.max(0, score));
    await updateDoc(doc(db, 'users', userId), {
      stats: {
        score: cappedScore,
        streak,
        lastActive: new Date().toISOString()
      }
    });
  },

  // 3. SOCIAL FEATURES (Friends)

  sendFriendRequest: async (currentUserId: string, friendEmail: string) => {
    if (!db) throw new Error("Database not connected");

    const emailTrimmed = friendEmail.toLowerCase().trim();
    const q = query(collection(db, 'users'), where('email', '==', emailTrimmed));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Usuário não encontrado com este email.');
    }

    const friendDoc = querySnapshot.docs[0];
    const friendId = friendDoc.id;

    if (friendId === currentUserId) {
      throw new Error('Você não pode adicionar a si mesmo.');
    }

    // Check current user status
    const currentUserSnap = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserSnap.exists()) throw new Error("Erro ao buscar dados do usuário.");

    const currentUserData = currentUserSnap.data();
    const friends = currentUserData.friends || [];
    const sent = currentUserData.friendRequestsSent || [];
    const received = currentUserData.friendRequestsReceived || [];

    // 1. Already friends?
    if (friends.includes(friendId)) {
      throw new Error('Vocês já são amigos!');
    }

    // 2. Request already sent?
    if (sent.includes(friendId)) {
      throw new Error('Convite já enviado. Aguarde a resposta.');
    }

    // 3. Request already received? (Auto-accept)
    if (received.includes(friendId)) {
      // Call accept logic directly
      await firebaseService.acceptFriendRequest(currentUserId, friendId);
      throw new Error('Vocês já são amigos! (Convite aceito automaticamente)');
    }

    // Add to sender's sent requests
    await updateDoc(doc(db, 'users', currentUserId), {
      friendRequestsSent: arrayUnion(friendId)
    });

    // Add to receiver's received requests
    await updateDoc(doc(db, 'users', friendId), {
      friendRequestsReceived: arrayUnion(currentUserId)
    });
  },

  acceptFriendRequest: async (currentUserId: string, friendId: string) => {
    if (!db) throw new Error("Database not connected");

    // Add to both users' friends lists
    await updateDoc(doc(db, 'users', currentUserId), {
      friends: arrayUnion(friendId),
      friendRequestsReceived: arrayRemove(friendId)
    });

    await updateDoc(doc(db, 'users', friendId), {
      friends: arrayUnion(currentUserId),
      friendRequestsSent: arrayRemove(currentUserId)
    });
  },

  rejectFriendRequest: async (currentUserId: string, friendId: string) => {
    if (!db) throw new Error("Database not connected");

    // Remove from requests
    await updateDoc(doc(db, 'users', currentUserId), {
      friendRequestsReceived: arrayRemove(friendId)
    });

    await updateDoc(doc(db, 'users', friendId), {
      friendRequestsSent: arrayRemove(currentUserId)
    });
  },

  getFriendRequests: async (currentUserId: string) => {
    if (!db) return [];
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    const receivedIds = userData.friendRequestsReceived || [];

    if (receivedIds.length === 0) return [];

    const requests = await Promise.all(receivedIds.map(async (fid: string) => {
      const fSnap = await getDoc(doc(db, 'users', fid));
      if (!fSnap.exists()) return null;

      const fData = fSnap.data();
      return {
        id: fid,
        name: fData.name,
        email: fData.email
      };
    }));

    return requests.filter(r => r !== null);
  },

  getSentFriendRequests: async (currentUserId: string) => {
    if (!db) return [];
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    const sentIds = userData.friendRequestsSent || [];

    if (sentIds.length === 0) return [];

    const requests = await Promise.all(sentIds.map(async (fid: string) => {
      const fSnap = await getDoc(doc(db, 'users', fid));
      if (!fSnap.exists()) return null;

      const fData = fSnap.data();
      return {
        id: fid,
        name: fData.name,
        email: fData.email
      };
    }));

    return requests.filter(r => r !== null);
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
  },

  // 4. GROUPS
  createGroup: async (currentUserId: string, name: string, description: string) => {
    if (!db) throw new Error("Database not connected");

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const groupDoc = await addDoc(collection(db, 'groups'), {
        name,
        description,
        createdBy: currentUserId,
        members: [currentUserId],
        createdAt: new Date().toISOString(),
        inviteCode
      });

      await updateDoc(doc(db, 'users', currentUserId), {
        groups: arrayUnion(groupDoc.id)
      });

      return {
        id: groupDoc.id,
        name,
        description,
        inviteCode
      };
    } catch (error: any) {
      console.error("Error creating group:", error);
      throw new Error("Erro ao criar grupo: " + error.message);
    }
  },

  joinGroup: async (currentUserId: string, inviteCode: string) => {
    if (!db) throw new Error("Database not connected");

    const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode.toUpperCase().trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Código de convite inválido.");
    }

    const groupDoc = querySnapshot.docs[0];
    const groupId = groupDoc.id;
    const groupData = groupDoc.data();

    if (groupData.members.includes(currentUserId)) {
      throw new Error("Você já está neste grupo.");
    }

    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayUnion(currentUserId)
    });

    await updateDoc(doc(db, 'users', currentUserId), {
      groups: arrayUnion(groupId)
    });

    return {
      id: groupId,
      name: groupData.name
    };
  },

  getUserGroups: async (currentUserId: string) => {
    if (!db) return [];
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    if (!userSnap.exists()) return [];

    const groupIds = userSnap.data().groups || [];
    if (groupIds.length === 0) return [];

    const groups = await Promise.all(groupIds.map(async (gid: string) => {
      const gSnap = await getDoc(doc(db, 'groups', gid));
      if (!gSnap.exists()) return null;
      const gData = gSnap.data();
      return {
        id: gid,
        name: gData.name,
        description: gData.description,
        memberCount: gData.members.length,
        inviteCode: gData.inviteCode
      };
    }));

    return groups.filter(g => g !== null);
  },

  getGroupLeaderboard: async (groupId: string) => {
    if (!db) return [];
    const gSnap = await getDoc(doc(db, 'groups', groupId));
    if (!gSnap.exists()) return [];

    const memberIds = gSnap.data().members || [];

    const membersData = await Promise.all(memberIds.map(async (mid: string) => {
      const uSnap = await getDoc(doc(db, 'users', mid));
      if (!uSnap.exists()) return null;

      const uData = uSnap.data();
      return {
        id: mid,
        name: uData.name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${uData.name}`,
        score: uData.stats?.score || 0,
        streak: uData.stats?.streak || 0,
        lastActive: uData.stats?.lastActive ? new Date(uData.stats.lastActive).toLocaleDateString('pt-BR') : 'Recentemente',
        isMe: false // Will be set by the UI
      };
    }));

    return membersData.filter(m => m !== null);
  }
};
