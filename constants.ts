import { Category, FrequencyType, Habit } from './types';

// This is the pool of ALL possible habits.
// Weights: 1 (Low), 2 (Medium), 3 (High)
export const HABIT_LIBRARY: Omit<Habit, 'enabled' | 'streak'>[] = [
  // --- SAÚDE / CORPO ---
  {
    id: 'sleep_7h',
    title: 'Sono Restaurador',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Dormir 7-9h com qualidade',
    scienceTip: 'Sono profundo remove toxinas cerebrais e consolida memória.',
    timeOfDay: 'morning',
    weight: 3 // High
  },
  {
    id: 'hydration',
    title: 'Hidratação Matinal',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: '500ml de água ao acordar',
    scienceTip: 'Reidrata tecidos e ativa metabolismo após jejum noturno.',
    timeOfDay: 'morning',
    weight: 1 // Low
  },
  {
    id: 'sunlight',
    title: 'Luz Natural',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: '10 min de sol pela manhã',
    scienceTip: 'Regula cortisol e define o relógio biológico para a noite.',
    timeOfDay: 'morning',
    weight: 1 // Low
  },
  {
    id: 'cold_shower',
    title: 'Banho Frio',
    category: Category.SAUDE,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 5,
    unit: 'x',
    description: '2 min de água fria ao final',
    scienceTip: 'Aumenta dopamina em 250% e melhora resiliência.',
    timeOfDay: 'morning',
    weight: 1 // Low
  },
  {
    id: 'exercise_light',
    title: 'Movimento Leve',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Caminhada ou alongamento (20min)',
    scienceTip: 'Caminhar reduz atividade na amígdala (ansiedade).',
    timeOfDay: 'afternoon',
    weight: 2 // Medium
  },
  {
    id: 'exercise_heavy',
    title: 'Treino Intenso',
    category: Category.SAUDE,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 5,
    unit: 'x',
    description: 'Musculação ou Cardio (45min)',
    scienceTip: 'Crucial para saúde mitocondrial e longevidade.',
    timeOfDay: 'afternoon',
    weight: 3 // High
  },
  {
    id: 'diet_clean',
    title: 'Nutrição Limpa',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Sem ultraprocessados ou açúcar',
    timeOfDay: 'afternoon',
    weight: 2 // Medium
  },
  {
    id: 'supplements',
    title: 'Suplementação',
    category: Category.SAUDE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Creatina e Omega 3',
    timeOfDay: 'morning',
    weight: 1 // Low
  },

  // --- MENTE ---
  {
    id: 'meditation',
    title: 'Meditação',
    category: Category.MENTE,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 5,
    unit: 'x',
    description: '10 min de silêncio/mindfulness',
    scienceTip: 'Aumenta massa cinzenta no córtex pré-frontal.',
    timeOfDay: 'afternoon',
    weight: 1 // Low
  },
  {
    id: 'gratitude',
    title: 'Apreciar a Vida',
    category: Category.MENTE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Contemplar o positivo do dia',
    scienceTip: 'Treina o cérebro para identificar oportunidades.',
    timeOfDay: 'evening',
    weight: 1 // Low
  },
  {
    id: 'no_screens_bed',
    title: 'Higiene do Sono',
    category: Category.MENTE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Sem telas 1h antes de dormir',
    scienceTip: 'Luz azul inibe melatonina e prejudica sono profundo.',
    timeOfDay: 'evening',
    weight: 2 // Medium
  },
  {
    id: 'reading',
    title: 'Leitura',
    category: Category.MENTE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Ler 10 páginas',
    timeOfDay: 'evening',
    weight: 1 // Low
  },

  // --- SOCIAL ---
  {
    id: 'partner_connection',
    title: 'Conexão Intencional',
    category: Category.SOCIAL,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Tempo de qualidade com parceiro(a)',
    timeOfDay: 'evening',
    weight: 3 // High
  },
  {
    id: 'friend_meet',
    title: 'Encontro Presencial',
    category: Category.SOCIAL,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 2,
    unit: 'x',
    description: 'Ver amigos pessoalmente',
    timeOfDay: 'any',
    weight: 3 // High
  },
  {
    id: 'friend_call',
    title: 'Contato Remoto',
    category: Category.SOCIAL,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 1,
    unit: 'x',
    description: 'Ligar ou mandar mensagem',
    timeOfDay: 'any',
    weight: 1 // Low
  },
  {
    id: 'family_time',
    title: 'Tempo em Família',
    category: Category.SOCIAL,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 3,
    unit: 'x',
    description: 'Ligar ou visitar parentes',
    timeOfDay: 'any',
    weight: 2 // Medium
  },
  {
    id: 'social_event',
    title: 'Vida Social',
    category: Category.SOCIAL,
    frequencyType: FrequencyType.WEEKLY,
    targetCount: 1,
    unit: 'x',
    description: 'Sair de casa / Evento social',
    timeOfDay: 'any',
    weight: 3 // High
  },
  {
    id: 'kindness',
    title: 'Gentileza',
    category: Category.SOCIAL,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Ser gentil nas interações',
    scienceTip: 'Altruísmo libera oxitocina e reduz estresse.',
    timeOfDay: 'any',
    weight: 1 // Low
  },

  // --- VÍCIOS / DISCIPLINA ---
  {
    id: 'no_nicotine',
    title: 'Zero Nicotina',
    category: Category.VICIOS,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Manter-se livre do vício',
    timeOfDay: 'any',
    weight: 3 // High
  },
  {
    id: 'avoid_alcohol',
    title: 'Zero Álcool',
    category: Category.VICIOS,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Marque se NÃO bebeu hoje',
    timeOfDay: 'any',
    weight: 2 // Medium
  },
  {
    id: 'avoid_cannabis',
    title: 'Zero Cannabis',
    category: Category.VICIOS,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Marque se NÃO usou hoje',
    timeOfDay: 'any',
    weight: 2 // Medium
  },
  {
    id: 'avoid_games',
    title: 'Zero Jogos',
    category: Category.VICIOS,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Marque se NÃO jogou hoje',
    timeOfDay: 'any',
    weight: 2 // Medium
  },
  {
    id: 'avoid_shorts',
    title: 'Zero Reels/TikTok',
    category: Category.VICIOS,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Marque se NÃO assistiu hoje',
    timeOfDay: 'any',
    weight: 2 // Medium
  },
  {
    id: 'avoid_yt',
    title: 'Zero YouTube',
    category: Category.VICIOS,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Marque se NÃO assistiu hoje',
    timeOfDay: 'any',
    weight: 2 // Medium
  },
  {
    id: 'environment',
    title: 'Ambiente',
    category: Category.PRODUTIVIDADE,
    frequencyType: FrequencyType.DAILY,
    targetCount: 1,
    unit: 'bool',
    description: 'Organizar espaço físico',
    timeOfDay: 'morning',
    weight: 1 // Low
  }
];

export const MOCK_FRIENDS = [
  { id: '1', name: 'Ana Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', score: 85, streak: 12, lastActive: '2h atrás' },
  { id: '2', name: 'Carlos Souza', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', score: 72, streak: 3, lastActive: '5m atrás' },
  { id: '3', name: 'Mariana Lima', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana', score: 94, streak: 45, lastActive: '1d atrás' },
];