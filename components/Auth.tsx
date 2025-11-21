
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
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          await firebaseService.loginWithGoogle();
      } catch (err: any) {
          handleError(err);
          setLoading(false);
      }
  };

  const handleError = (err: any) => {
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
      } else if (err.code === 'auth/popup-closed-by-user') {
          setError('Login cancelado.');
      } else if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
          setError('Configuração de API inválida. Verifique o arquivo config.ts.');
      } else if (err.message && err.message.includes("Firebase not initialized")) {
          setError('Erro de configuração do Firebase. Verifique o console.');
      } else {
          setError(`Erro: ${err.message}`);
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

        <div className="mt-4">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">ou</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <button
                onClick={handleGoogleLogin}
                disabled={loading || initError}
                className="w-full py-3 bg-white border border-gray-200 text-[#44403C] rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Continuar com Google
            </button>
        </div>

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
