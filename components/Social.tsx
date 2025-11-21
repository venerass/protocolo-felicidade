import React, { useState, useEffect, useMemo } from 'react';
import { Users, Trophy, Share2, UserPlus, Search, AlertCircle, User as UserIcon } from 'lucide-react';
import { DailyLog, Habit, UserProfile, FrequencyType } from '../types';
import { firebaseService } from '../services/firebase';

interface Props {
  habits: Habit[];
  logs: DailyLog;
  profile: UserProfile | null;
}

export const Social: React.FC<Props> = ({ habits, logs, profile }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Calculate User's Real Score locally
  const userStats = useMemo(() => {
     const today = new Date();
     let totalScore = 0;
     let daysCount = 0;

     for(let i=0; i<7; i++) {
         const d = new Date();
         d.setDate(today.getDate() - i);
         const dateStr = d.toLocaleDateString('en-CA');
         
         if (logs[dateStr]) {
             const dayLogs = logs[dateStr];
             const dailyHabits = habits.filter(h => h.frequencyType === FrequencyType.DAILY);
             let totalWeight = 0;
             let achievedWeight = 0;
             
             dailyHabits.forEach(h => {
                 totalWeight += (h.weight || 2);
                 if (dayLogs[h.id]) achievedWeight += (h.weight || 2);
             });

             habits.filter(h => h.frequencyType === FrequencyType.WEEKLY).forEach(h => {
                 if (dayLogs[h.id]) achievedWeight += (h.weight || 2);
             });
             
             if (totalWeight > 0) {
                totalScore += Math.round((achievedWeight / totalWeight) * 100);
             }
             daysCount++;
         }
     }
     
     const avgScore = daysCount > 0 ? Math.round(totalScore / daysCount) : 0;
     
     let streak = 0;
     for(let i=0; i<30; i++) {
         const d = new Date();
         d.setDate(today.getDate() - i);
         const dateStr = d.toLocaleDateString('en-CA');
         if (Object.keys(logs[dateStr] || {}).length > 0) streak++;
         else break;
     }

     return { score: avgScore, streak };
  }, [habits, logs]);

  // Update public stats in backend
  useEffect(() => {
    const uid = firebaseService.currentUser?.uid;
    if (uid) {
        firebaseService.updatePublicStats(uid, userStats.score, userStats.streak);
    }
  }, [userStats]);

  // Load Friends
  useEffect(() => {
    const loadFriends = async () => {
        const uid = firebaseService.currentUser?.uid;
        if (uid) {
            try {
                const friendsData = await firebaseService.getFriendsLeaderboard(uid);
                setFriends(friendsData);
            } catch (error) {
                console.error("Error loading friends", error);
            } finally {
                setLoading(false);
            }
        }
    };
    loadFriends();
  }, []);

  const handleAddFriend = async () => {
    if (!addEmail) return;
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    
    try {
        const uid = firebaseService.currentUser?.uid;
        if (!uid) return;
        const newFriend = await firebaseService.addFriendByEmail(uid, addEmail);
        setFriends(prev => [...prev, newFriend]);
        setAddSuccess(`Você agora está seguindo ${newFriend.name}!`);
        setAddEmail('');
    } catch (err: any) {
        setAddError(err.message || 'Erro ao adicionar amigo.');
    } finally {
        setAddLoading(false);
    }
  };

  const leaderboard = useMemo(() => {
      const userEntry = {
          id: 'user_me',
          name: profile?.name || 'Eu',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || 'User'}`,
          score: userStats.score,
          streak: userStats.streak,
          lastActive: 'Agora',
          isMe: true
      };
      return [...friends, userEntry].sort((a, b) => b.score - a.score);
  }, [userStats, profile, friends]);

  const userRank = leaderboard.findIndex(u => u.isMe) + 1;

  const handleShare = async () => {
      const email = firebaseService.currentUser?.email;
      const text = `*Protocolo Felicidade* 🚀\n\nHoje eu completei meu dia com score de ${userStats.score}%!\nSequência: ${userStats.streak} dias 🔥\n\nMe adicione usando meu email: ${email}`;
      if (navigator.share) {
          await navigator.share({ title: 'Meu Progresso', text: text });
      } else {
          navigator.clipboard.writeText(text);
          alert('Texto copiado! Envie para seu amigo.');
      }
  };

  // Fallback image component
  const Avatar = ({ src, alt, className }: any) => {
    const [error, setError] = useState(false);
    if (error) {
        return <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500`}><UserIcon size={16}/></div>;
    }
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
  };

  return (
    <div className="pb-24">
      <header className="mb-6 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Comunidade</h1>
            <p className="text-gray-500 text-sm">Ranking em tempo real.</p>
        </div>
        <button className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
            <Users size={20} />
        </button>
      </header>

      {/* User Stats Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-lg font-semibold opacity-90 mb-1">Ranking da Semana</h2>
            <p className="text-3xl font-bold">Você está em {userRank}º</p>
            <p className="text-sm opacity-75 mt-2">
                {friends.length === 0 ? 'Adicione amigos para competir!' : userRank === 1 ? 'Líder absoluto! 👑' : 'Continue focado!'}
            </p>
        </div>
        <Trophy className="absolute right-4 bottom-[-10px] w-32 h-32 text-white opacity-10 rotate-12" />
      </div>

      {/* Add Friend Section */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-8 shadow-sm">
         <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><UserPlus size={18}/> Adicionar Amigo</h3>
         <div className="flex gap-2">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                 <input 
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="Email do amigo"
                    className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#44403C]"
                 />
             </div>
             <button 
                onClick={handleAddFriend}
                disabled={addLoading || !addEmail}
                className="bg-[#1C1917] text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
             >
                {addLoading ? '...' : 'Adicionar'}
             </button>
         </div>
         {addError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {addError}</p>}
         {addSuccess && <p className="text-green-600 text-xs mt-2">{addSuccess}</p>}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando ranking...</div>
        ) : leaderboard.length === 1 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium mb-1">Nenhum amigo ainda</p>
                <p className="text-xs text-gray-400">Adicione amigos pelo email para ver o progresso deles.</p>
            </div>
        ) : (
            leaderboard.map((friend, index) => (
                <div key={friend.id} className={`p-4 rounded-xl shadow-sm flex items-center space-x-4 border ${friend.isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent'}`}>
                    <div className="relative">
                        <Avatar src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className={`absolute -top-1 -right-1 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white ${index < 3 ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                            {index + 1}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h4 className={`font-semibold ${friend.isMe ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {friend.name} {friend.isMe && '(Você)'}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            🔥 {friend.streak} dias seguidos
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-indigo-600">{friend.score} pts</span>
                        <span className="text-xs text-gray-400">{friend.lastActive}</span>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="mt-8 text-center">
        <button 
            onClick={handleShare}
            className="bg-white border border-indigo-200 text-indigo-600 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition inline-flex items-center gap-2"
        >
            <Share2 size={18} /> Convidar Amigos
        </button>
      </div>
    </div>
  );
};