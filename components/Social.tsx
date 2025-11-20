import React from 'react';
import { MOCK_FRIENDS } from '../constants';
import { Users, Trophy, MessageCircle } from 'lucide-react';

export const Social: React.FC = () => {
  // Sort by score desc
  const sortedFriends = [...MOCK_FRIENDS].sort((a, b) => b.score - a.score);

  return (
    <div className="pb-24">
      <header className="mb-6 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Comunidade</h1>
            <p className="text-gray-500 text-sm">Crescendo juntos.</p>
        </div>
        <button className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
            <Users size={20} />
        </button>
      </header>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-lg font-semibold opacity-90 mb-1">Ranking da Semana</h2>
            <p className="text-3xl font-bold">Você está em 2º</p>
            <p className="text-sm opacity-75 mt-2">Faltam 120 pontos para o 1º lugar!</p>
        </div>
        <Trophy className="absolute right-4 bottom-[-10px] w-32 h-32 text-white opacity-10 rotate-12" />
      </div>

      <h3 className="font-bold text-gray-800 mb-4 px-1">Amigos</h3>
      <div className="space-y-3">
        {sortedFriends.map((friend, index) => (
            <div key={friend.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
                <div className="relative">
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">
                        {index + 1}
                    </div>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{friend.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        🔥 {friend.streak} dias seguidos
                    </p>
                </div>
                <div className="text-right">
                    <span className="block font-bold text-indigo-600">{friend.score} pts</span>
                    <span className="text-xs text-gray-400">{friend.lastActive}</span>
                </div>
            </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
        <h4 className="font-semibold text-indigo-800 mb-2">Convidar Amigos</h4>
        <p className="text-sm text-indigo-600 mb-4">Jornadas compartilhadas são 2x mais propensas ao sucesso.</p>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 transition">
            Compartilhar Link
        </button>
      </div>
    </div>
  );
};