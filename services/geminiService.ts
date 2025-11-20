import { GoogleGenAI } from "@google/genai";
import { DailyLog, Habit, UserProfile } from '../types';

// Safely get API key or empty string to prevent runtime crash before key selection
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCoachingAdvice = async (
  profile: UserProfile,
  habits: Habit[],
  logs: DailyLog
): Promise<string> => {
  
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate simplified stats for the prompt
  const activeHabits = habits.filter(h => h.enabled).map(h => h.title).join(', ');
  const recentLogs = Object.entries(logs)
    .sort((a, b) => b[0].localeCompare(a[0])) // Sort date desc
    .slice(0, 7); // Last 7 days

  const prompt = `
    Você é um coach de bem-estar e felicidade para o aplicativo "Protocolo Felicidade".
    
    Perfil do Usuário: ${profile.name}
    Objetivos: ${activeHabits}
    
    Dados dos últimos 7 dias:
    ${JSON.stringify(recentLogs)}
    
    Hoje é: ${today}

    Instruções:
    1. Analise o progresso do usuário de forma empática e motivadora.
    2. Identifique padrões (ex: falhou no sono, mas foi bem nos exercícios).
    3. Dê 3 dicas práticas e curtas baseadas em ciência para melhorar na próxima semana.
    4. Mantenha o tom amigável, encorajador e use emojis.
    5. Responda em Português do Brasil.
    6. Seja conciso (máximo 150 palavras).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar conselhos no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao contatar seu coach virtual. Verifique sua conexão ou tente novamente mais tarde.";
  }
};