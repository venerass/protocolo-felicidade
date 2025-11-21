
import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebase';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    // Check if service is ready
    if (!firebaseService.isConfigured()) {
       setInitError(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await firebaseService.login(email, password);
      } else {
        await firebaseService.register(email, password, name);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Map standard Firebase error codes to friendly messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
          setError('Este email já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
          setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
          setError('Formato de email inválido.');
      } else if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
          setError('Configuração de API inválida. Verifique o arquivo config.ts.');
      } else if (err.message.includes("Firebase not initialized")) {
          setError('Erro de configuração do Firebase. Verifique o console.');
      } else {
          setError(`Erro: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#E7E5E4]">
      <div className="bg-[#F5F5F0] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1C1917] rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-[#1C1917]">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-[#78716C] mt-2">
            {isLogin ? 'Continue sua jornada de felicidade.' : 'Comece a rastrear sua evolução hoje.'}
          </p>
        </div>

        {(error || initError) && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium animate-fade-in">
                <AlertCircle size={16} /> 
                {initError ? 'Erro de Conexão: Firebase não iniciado. Verifique API Keys em config.ts' : error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#78716C] uppercase ml-1">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#44403C] outline-none transition"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#78716C] uppercase ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#44403C] outline-none transition"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#78716C] uppercase ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#44403C] outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || initError}
            className="w-full py-3.5 bg-[#1C1917] text-white rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <p className="text-[#78716C] text-sm">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="ml-2 font-bold text-[#1C1917] hover:underline"
            >
                {isLogin ? 'Cadastre-se' : 'Faça Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
