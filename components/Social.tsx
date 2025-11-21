import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Share2, UserPlus, Search, AlertCircle, User as UserIcon, UserCheck, X, Eye, Users, Plus, Hash } from 'lucide-react';
import { DailyLog, Habit, UserProfile, FrequencyType } from '../types';
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

    // Mode: 'friends' | 'groups'
    const [viewMode, setViewMode] = useState<'friends' | 'groups'>('friends');
    // If viewing a specific group
    const [activeGroup, setActiveGroup] = useState<any | null>(null);

    // Friend Invite related states
    const [addEmail, setAddEmail] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');

    // Group related states
    const [groupCode, setGroupCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupActionLoading, setGroupActionLoading] = useState(false);
    const [groupMessage, setGroupMessage] = useState({ type: '', text: '' });

    // Calculate User's Real Score locally
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
                    setUserGroups(groupsData);
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
            // If auto-accepted, it throws an error with a specific message but it's actually a success state for the UI
            if (err.message.includes('Convite aceito automaticamente')) {
                setAddSuccess(err.message);
                setAddEmail('');
                // Refresh friends list
                const updatedFriends = await firebaseService.getFriendsLeaderboard(uid);
                setFriends(updatedFriends);
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

    // Group Handlers
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
            setIsCreatingGroup(false);
            setGroupName('');
            setGroupDesc('');
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
            // Refresh groups to get full data
            const groupsData = await firebaseService.getUserGroups(uid);
            setUserGroups(groupsData);
            setGroupMessage({ type: 'success', text: `Você entrou no grupo ${joinedGroup.name}!` });
            setGroupCode('');
        } catch (err: any) {
            setGroupMessage({ type: 'error', text: err.message });
        } finally {
            setGroupActionLoading(false);
        }
    };

    const loadGroupLeaderboard = async (group: any) => {
        setLoading(true);
        try {
            const members = await firebaseService.getGroupLeaderboard(group.id);
            // Mark current user
            const uid = firebaseService.currentUser?.uid;
            const enhancedMembers = members.map(m => ({ ...m, isMe: m.id === uid }));
            // Sort
            enhancedMembers.sort((a, b) => b.score - a.score);

            setActiveGroup({
                ...group,
                leaderboard: enhancedMembers
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Determine current leaderboard to show
    const leaderboard = useMemo(() => {
        if (activeGroup) {
            return activeGroup.leaderboard || [];
        }

        // Default Global Friends + Me
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
    }, [userStats, profile, friends, activeGroup]);

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

    // Fallback image component
    const Avatar = ({ src, alt, className }: any) => {
        const [error, setError] = useState(false);
        if (error) {
            return <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500`}><UserIcon size={16} /></div>;
        }
        return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
    };

    return (
        <div className="pb-24">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Comunidade</h1>
                    <p className="text-gray-500 text-sm">Conecte-se e compita.</p>
                </div>

                {/* Toggle View Mode */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setViewMode('friends'); setActiveGroup(null); }}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${viewMode === 'friends' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        <Users size={14} /> Amigos
                    </button>
                    <button
                        onClick={() => setViewMode('groups')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${viewMode === 'groups' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        <Hash size={14} /> Grupos
                    </button>
                </div>
            </header>

            {/* User Stats Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-lg font-semibold opacity-90 mb-1">
                        {activeGroup ? `Ranking: ${activeGroup.name}` : 'Ranking Geral'}
                    </h2>
                    <p className="text-3xl font-bold">Você está em {userRank}º</p>
                    {activeGroup && (
                        <div className="mt-2 inline-block bg-white/20 px-2 py-1 rounded text-xs font-mono">
                            Código: {activeGroup.inviteCode}
                        </div>
                    )}
                </div>
                <Trophy className="absolute right-4 bottom-[-10px] w-32 h-32 text-white opacity-10 rotate-12" />
            </div>

            {/* FRIENDS MODE ACTIONS */}
            {viewMode === 'friends' && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-8">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><UserPlus size={16} /> Adicionar Amigo</h3>
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
                            onClick={handleSendRequest}
                            disabled={addLoading || !addEmail}
                            className="bg-[#1C1917] text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
                        >
                            {addLoading ? '...' : 'Adicionar'}
                        </button>
                    </div>
                    {addError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {addError}</p>}
                    {addSuccess && <p className="text-green-600 text-xs mt-2">{addSuccess}</p>}

                    {(receivedRequests.length > 0 || sentRequests.length > 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {receivedRequests.length > 0 && (
                                <div className="mb-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Convites Recebidos</h4>
                                    <div className="space-y-2">
                                        {receivedRequests.map(req => (
                                            <div key={req.id} className="bg-indigo-50 p-2.5 rounded-lg flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold text-[10px] shadow-sm">
                                                        {req.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-indigo-900">{req.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAcceptRequest(req.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><UserCheck size={16} /></button>
                                                    <button onClick={() => handleRejectRequest(req.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* GROUPS MODE ACTIONS */}
            {viewMode === 'groups' && !activeGroup && (
                <div className="space-y-6 mb-8">
                    {/* Join Group */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-3 text-sm">Entrar em um Grupo</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={groupCode}
                                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                                placeholder="Código do convite (ex: X8A92B)"
                                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#44403C] uppercase font-mono"
                                maxLength={6}
                            />
                            <button
                                onClick={handleJoinGroup}
                                disabled={groupActionLoading || !groupCode}
                                className="bg-[#1C1917] text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                Entrar
                            </button>
                        </div>
                    </div>

                    {/* Create Group Toggle */}
                    {!isCreatingGroup ? (
                        <button
                            onClick={() => setIsCreatingGroup(true)}
                            className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Criar Novo Grupo
                        </button>
                    ) : (
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-800 text-sm">Novo Grupo</h3>
                                <button onClick={() => setIsCreatingGroup(false)}><X size={16} className="text-gray-400" /></button>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Nome do Grupo"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                                />
                                <input
                                    type="text"
                                    value={groupDesc}
                                    onChange={(e) => setGroupDesc(e.target.value)}
                                    placeholder="Descrição (opcional)"
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                                />
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={groupActionLoading || !groupName}
                                    className="w-full bg-[#1C1917] text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
                                >
                                    {groupActionLoading ? 'Criando...' : 'Criar Grupo'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Feedback Messages */}
                    {groupMessage.text && (
                        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${groupMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <AlertCircle size={16} /> {groupMessage.text}
                        </div>
                    )}

                    {/* My Groups List */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meus Grupos</h3>
                        {userGroups.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 text-sm">Você não participa de nenhum grupo.</p>
                        ) : (
                            <div className="grid gap-3">
                                {userGroups.map(group => (
                                    <div key={group.id} onClick={() => loadGroupLeaderboard(group)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-300 transition group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-800">{group.name}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{group.memberCount} membros</p>
                                            </div>
                                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-mono px-2 py-1 rounded">{group.inviteCode}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BACK BUTTON FOR GROUP VIEW */}
            {viewMode === 'groups' && activeGroup && (
                <button
                    onClick={() => setActiveGroup(null)}
                    className="mb-4 text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                    ← Voltar para Grupos
                </button>
            )}

            {/* Leaderboard List (Shared for Friends & Groups) */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Carregando...</div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium mb-1">Ninguém aqui ainda</p>
                    </div>
                ) : (
                    leaderboard.map((entry: any, index: number) => (
                        <div key={entry.id} className={`p-4 rounded-xl shadow-sm flex items-center space-x-4 border ${entry.isMe ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent'}`}>
                            <div className="relative">
                                <Avatar src={entry.avatar} alt={entry.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div className={`absolute -top-1 -right-1 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white ${index < 3 ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                                    {index + 1}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-semibold ${entry.isMe ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    {entry.name} {entry.isMe && '(Você)'}
                                </h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    🔥 {entry.streak} dias seguidos
                                </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div>
                                    <span className="block font-bold text-indigo-600">{entry.score} pts</span>
                                    <span className="text-xs text-gray-400">{entry.lastActive}</span>
                                </div>
                                {!entry.isMe && (
                                    <button
                                        onClick={() => {
                                            if (onViewFriend) {
                                                onViewFriend(entry.id, entry.name);
                                            }
                                        }}
                                        className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition z-10 relative cursor-pointer"
                                        title="Ver Perfil"
                                    >
                                        <Eye size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {viewMode === 'friends' && (
                <div className="mt-8 text-center">
                    <button
                        onClick={handleShare}
                        className="bg-white border border-indigo-200 text-indigo-600 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition inline-flex items-center gap-2"
                    >
                        <Share2 size={18} /> Compartilhar meu ID
                    </button>
                </div>
            )}
        </div>
    );
};