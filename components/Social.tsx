import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Share2, UserPlus, Search, AlertCircle, User as UserIcon, UserCheck, X, Eye, Users, Plus, Hash } from 'lucide-react';
import { DailyLog, Habit, UserProfile, FrequencyType, Category } from '../types';
import { firebaseService } from '../services/firebase';

interface Props {
    habits: Habit[];
    logs: DailyLog;
    profile: UserProfile | null;
    onViewFriend?: (friendId: string, friendName: string) => void;
}

export const Social: React.FC<Props> = ({ habits, logs, profile, onViewFriend }) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Friend Invite related states
    const [addEmail, setAddEmail] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');

    // Group related states
    const [groupCode, setGroupCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [groupActionLoading, setGroupActionLoading] = useState(false);
    const [groupMessage, setGroupMessage] = useState({ type: '', text: '' });
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    // Calculate User's Real Score locally (FIXED FOR ALL HABIT TYPES)
    const userStats = useMemo(() => {
        const today = new Date();
        let totalScore = 0;
        let daysCount = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');

            if (logs[dateStr]) {
                const dayLogs = logs[dateStr];
                const dailyHabits = habits.filter(h => h.frequencyType === FrequencyType.DAILY);
                let totalWeight = 0;
                let achievedWeight = 0;

                dailyHabits.forEach(h => {
                    const weight = h.weight || 2;
                    totalWeight += weight;
                    const isDone = !!dayLogs[h.id];

                    // Fix: Handle all three types correctly
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
        for (let i = 0; i < 30; i++) {
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

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            const uid = firebaseService.currentUser?.uid;
            if (uid) {
                try {
                    const [friendsData, received, sent, groupsData] = await Promise.all([
                        firebaseService.getFriendsLeaderboard(uid),
                        firebaseService.getFriendRequests(uid),
                        firebaseService.getSentFriendRequests(uid),
                        firebaseService.getUserGroups(uid)
                    ]);

                    setFriends(friendsData);
                    setReceivedRequests(received);
                    setSentRequests(sent);

                    // Load leaderboards for all groups automatically
                    const groupsWithLeaderboards = await Promise.all(
                        groupsData.map(async (group: any) => {
                            try {
                                const members = await firebaseService.getGroupLeaderboard(group.id);
                                const enhancedMembers = members.map((m: any) => ({ ...m, isMe: m.id === uid }));
                                enhancedMembers.sort((a: any, b: any) => b.score - a.score);
                                return { ...group, leaderboard: enhancedMembers };
                            } catch (err) {
                                console.error(`Error loading leaderboard for group ${group.id}:`, err);
                                return group;
                            }
                        })
                    );

                    setUserGroups(groupsWithLeaderboards);
                } catch (error) {
                    console.error("Error loading social data", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, []);

    const handleSendRequest = async () => {
        if (!addEmail) return;
        setAddLoading(true);
        setAddError('');
        setAddSuccess('');

        try {
            const uid = firebaseService.currentUser?.uid;
            if (!uid) return;

            await firebaseService.sendFriendRequest(uid, addEmail);

            setSentRequests(prev => [...prev, { email: addEmail, name: 'Usuário' }]);
            setAddSuccess(`Convite enviado para ${addEmail}!`);
            setAddEmail('');
        } catch (err: any) {
            if (err.message.includes('Convite aceito automaticamente')) {
                setAddSuccess(err.message);
                setAddEmail('');
                const uid = firebaseService.currentUser?.uid;
                if (uid) {
                    const updatedFriends = await firebaseService.getFriendsLeaderboard(uid);
                    setFriends(updatedFriends);
                }
            } else {
                setAddError(err.message || 'Erro ao enviar convite.');
            }
        } finally {
            setAddLoading(false);
        }
    };

    const handleAcceptRequest = async (friendId: string) => {
        const uid = firebaseService.currentUser?.uid;
        if (!uid) return;

        try {
            await firebaseService.acceptFriendRequest(uid, friendId);
            setReceivedRequests(prev => prev.filter(r => r.id !== friendId));
            const updatedFriends = await firebaseService.getFriendsLeaderboard(uid);
            setFriends(updatedFriends);
        } catch (error) {
            console.error("Error accepting request", error);
        }
    };

    const handleRejectRequest = async (friendId: string) => {
        const uid = firebaseService.currentUser?.uid;
        if (!uid) return;

        try {
            await firebaseService.rejectFriendRequest(uid, friendId);
            setReceivedRequests(prev => prev.filter(r => r.id !== friendId));
        } catch (error) {
            console.error("Error rejecting request", error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName) return;
        setGroupActionLoading(true);
        setGroupMessage({ type: '', text: '' });
        const uid = firebaseService.currentUser?.uid;
        if (!uid) return;

        try {
            const newGroup = await firebaseService.createGroup(uid, groupName, groupDesc);
            setUserGroups(prev => [...prev, { ...newGroup, memberCount: 1 }]);
            setGroupMessage({ type: 'success', text: 'Grupo criado com sucesso!' });
            setGroupName('');
            setGroupDesc('');
            setTimeout(() => setGroupMessage({ type: '', text: '' }), 3000);
        } catch (err: any) {
            setGroupMessage({ type: 'error', text: err.message });
        } finally {
            setGroupActionLoading(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!groupCode) return;
        setGroupActionLoading(true);
        setGroupMessage({ type: '', text: '' });
        const uid = firebaseService.currentUser?.uid;
        if (!uid) return;

        try {
            const joinedGroup = await firebaseService.joinGroup(uid, groupCode);
            const groupsData = await firebaseService.getUserGroups(uid);
            setUserGroups(groupsData);
            setGroupMessage({ type: 'success', text: `Você entrou no grupo ${joinedGroup.name}!` });
            setGroupCode('');
            setTimeout(() => setGroupMessage({ type: '', text: '' }), 3000);
        } catch (err: any) {
            setGroupMessage({ type: 'error', text: err.message });
        } finally {
            setGroupActionLoading(false);
        }
    };

    const loadGroupMembers = async (groupId: string) => {
        if (expandedGroup === groupId) {
            setExpandedGroup(null);
            return;
        }

        try {
            const members = await firebaseService.getGroupLeaderboard(groupId);
            const uid = firebaseService.currentUser?.uid;
            const enhancedMembers = members.map((m: any) => ({ ...m, isMe: m.id === uid }));
            enhancedMembers.sort((a: any, b: any) => b.score - a.score);

            setUserGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, leaderboard: enhancedMembers } : g
            ));
            setExpandedGroup(groupId);
        } catch (err) {
            console.error(err);
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

    const userRank = leaderboard.findIndex((u: any) => u.isMe) + 1;

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

    const Avatar = ({ src, alt, className }: any) => {
        const [error, setError] = useState(false);
        if (error) {
            return <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500`}><UserIcon size={16} /></div>;
        }
        return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
    };

    return (
        <div className="pb-24 space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-[#1C1917]">Comunidade</h1>
                <p className="text-[#78716C] mt-1">Conecte-se e cresça junto com sua tribo.</p>
            </header>

            {/* Main Content Grid - Rankings First, Actions Below */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Friends Ranking */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
                            <Users size={20} className="text-indigo-600" /> Ranking de Amigos
                        </h2>
                        <span className="text-xs font-bold text-[#A8A29E] bg-[#F5F5F0] px-2 py-1 rounded">
                            {userRank}º lugar
                        </span>
                    </div>

                    {/* Friends Leaderboard */}
                    <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="text-center py-8 text-[#A8A29E] text-sm">Carregando...</div>
                        ) : leaderboard.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Users size={24} className="text-[#A8A29E]" />
                                </div>
                                <p className="text-[#78716C] text-sm font-medium">Nenhum amigo ainda</p>
                                <p className="text-xs text-[#A8A29E] mt-1">Adicione amigos abaixo para competir!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#F5F5F0]">
                                {leaderboard.slice(0, 8).map((entry: any, index: number) => (
                                    <div key={entry.id} className={`p-4 flex items-center gap-3 transition-colors ${entry.isMe ? 'bg-indigo-50/50' : 'hover:bg-[#FAFAF9]'}`}>
                                        <div className="relative flex-shrink-0">
                                            <Avatar src={entry.avatar} alt={entry.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                            <div className={`absolute -top-1 -right-1 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                                    index === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-[#F5F5F0] text-[#78716C]'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-semibold text-sm truncate ${entry.isMe ? 'text-indigo-700' : 'text-[#1C1917]'}`}>
                                                {entry.name}{entry.isMe && ' (Você)'}
                                            </h4>
                                            <p className="text-xs text-[#78716C] flex items-center gap-1">
                                                <span>🔥</span> {entry.streak} dias consecutivos
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className={`block font-bold text-lg ${entry.isMe ? 'text-indigo-600' : 'text-[#44403C]'}`}>
                                                    {entry.score}
                                                </span>
                                                <span className="text-[10px] text-[#A8A29E] uppercase font-bold tracking-wide">pts</span>
                                            </div>
                                            {!entry.isMe && (
                                                <button
                                                    onClick={() => onViewFriend && onViewFriend(entry.id, entry.name)}
                                                    className="p-2 bg-[#F5F5F0] rounded-lg text-[#78716C] hover:bg-indigo-50 hover:text-indigo-600 transition"
                                                    title="Ver perfil"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Friend Requests */}
                    {receivedRequests.length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-900 uppercase mb-3 tracking-wide">Convites Pendentes</h4>
                            <div className="space-y-2">
                                {receivedRequests.map(req => (
                                    <div key={req.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                {req.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-[#1C1917]">{req.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAcceptRequest(req.id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition" title="Aceitar">
                                                <UserCheck size={18} />
                                            </button>
                                            <button onClick={() => handleRejectRequest(req.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition" title="Recusar">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Groups Ranking */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
                        <Hash size={20} className="text-purple-600" /> Meus Grupos
                    </h2>

                    {/* Groups List */}
                    {userGroups.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-6 text-center">
                            <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-3">
                                <Hash size={24} className="text-[#A8A29E]" />
                            </div>
                            <p className="text-[#78716C] text-sm font-medium">Nenhum grupo ainda</p>
                            <p className="text-xs text-[#A8A29E] mt-1">Entre ou crie um grupo abaixo!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userGroups.map(group => (
                                <div key={group.id} className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden">
                                    <div className="p-4 bg-[#FAFAF9]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[#1C1917]">{group.name}</h4>
                                                <p className="text-xs text-[#78716C] mt-0.5">{group.memberCount} membros</p>
                                            </div>
                                            <span className="bg-purple-50 text-purple-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
                                                {group.inviteCode}
                                            </span>
                                        </div>
                                        {group.description && (
                                            <p className="text-xs text-[#A8A29E] mt-2">{group.description}</p>
                                        )}
                                    </div>

                                    {/* Group Members - Always Shown */}
                                    {group.leaderboard && group.leaderboard.length > 0 && (
                                        <div className="border-t border-[#F5F5F0] bg-white divide-y divide-[#F5F5F0]">
                                            {group.leaderboard.map((member: any, idx: number) => (
                                                <div key={member.id} className={`p-3 flex items-center gap-3 ${member.isMe ? 'bg-purple-50/50' : ''}`}>
                                                    <div className="relative flex-shrink-0">
                                                        <Avatar src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
                                                        <span className={`absolute -top-1 -right-1 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-[#E7E5E4] text-[#78716C]'
                                                            }`}>
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                    <span className={`flex-1 font-medium text-sm truncate ${member.isMe ? 'text-purple-700 font-bold' : 'text-[#44403C]'}`}>
                                                        {member.name}{member.isMe && ' (Você)'}
                                                    </span>
                                                    <span className="font-bold text-[#44403C]">{member.score}</span>
                                                    {!member.isMe && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewFriend && onViewFriend(member.id, member.name);
                                                            }}
                                                            className="p-1.5 bg-white hover:bg-purple-50 rounded-lg transition border border-[#E7E5E4]"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Cards Below Rankings */}
            <div className="mt-8 space-y-6">
                <h3 className="text-sm font-bold text-[#78716C] uppercase tracking-wider">Ações</h3>

                <div className="grid md:grid-cols-3 gap-4">
                    {/* Add Friend Card */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#E7E5E4] shadow-sm hover:border-indigo-200 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <UserPlus size={18} className="text-indigo-600" />
                            </div>
                            <h3 className="font-bold text-[#1C1917]">Adicionar Amigo</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-[#A8A29E]" size={16} />
                                <input
                                    type="email"
                                    value={addEmail}
                                    onChange={(e) => setAddEmail(e.target.value)}
                                    placeholder="Email do amigo"
                                    className="w-full pl-9 p-2.5 bg-[#F5F5F0] border border-transparent rounded-xl text-sm outline-none focus:border-[#44403C] focus:bg-white transition"
                                />
                            </div>
                            <button
                                onClick={handleSendRequest}
                                disabled={addLoading || !addEmail}
                                className="w-full bg-[#1C1917] text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-black transition shadow-sm"
                            >
                                {addLoading ? 'Enviando...' : 'Enviar Convite'}
                            </button>
                        </div>
                        {addError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {addError}</p>}
                        {addSuccess && <p className="text-green-600 text-xs mt-2 font-medium">{addSuccess}</p>}
                    </div>

                    {/* Join Group Card */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#E7E5E4] shadow-sm hover:border-purple-200 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Hash size={18} className="text-purple-600" />
                            </div>
                            <h3 className="font-bold text-[#1C1917]">Entrar em Grupo</h3>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={groupCode}
                                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                                placeholder="CÓDIGO"
                                className="w-full p-2.5 bg-[#F5F5F0] border border-transparent rounded-xl text-sm outline-none focus:border-[#44403C] focus:bg-white uppercase font-mono transition"
                                maxLength={6}
                            />
                            <button
                                onClick={handleJoinGroup}
                                disabled={groupActionLoading || !groupCode}
                                className="w-full bg-[#1C1917] text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-black transition shadow-sm"
                            >
                                {groupActionLoading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </div>

                    {/* Create Group Card */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#E7E5E4] shadow-sm hover:border-green-200 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Plus size={18} className="text-green-600" />
                            </div>
                            <h3 className="font-bold text-[#1C1917]">Criar Grupo</h3>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Nome do Grupo"
                                className="w-full p-2.5 bg-[#F5F5F0] border border-transparent rounded-xl text-sm outline-none focus:border-[#44403C] focus:bg-white transition"
                            />
                            <input
                                type="text"
                                value={groupDesc}
                                onChange={(e) => setGroupDesc(e.target.value)}
                                placeholder="Descrição (opcional)"
                                className="w-full p-2.5 bg-[#F5F5F0] border border-transparent rounded-xl text-sm outline-none focus:border-[#44403C] focus:bg-white transition text-xs"
                            />
                            <button
                                onClick={handleCreateGroup}
                                disabled={groupActionLoading || !groupName}
                                className="w-full bg-[#1C1917] text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-black transition shadow-sm"
                            >
                                {groupActionLoading ? 'Criando...' : 'Criar Grupo'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feedback Messages */}
                {groupMessage.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${groupMessage.type === 'error'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                        <AlertCircle size={16} /> {groupMessage.text}
                    </div>
                )}
            </div>

            {/* Share Button */}
            <div className="mt-8 text-center">
                <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 bg-white border-2 border-indigo-200 text-indigo-600 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition"
                >
                    <Share2 size={18} /> Compartilhar meu progresso
                </button>
            </div>
        </div>
    );
};