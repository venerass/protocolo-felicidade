/**
 * EXEMPLO PRÁTICO: Script para migração de hábitos
 * 
 * Este script atualiza todos os hábitos "Zero X" para o novo padrão
 * de descrição mais claro sobre quando marcar.
 */

const admin = require('firebase-admin');

// ============================================
// CONFIGURAÇÃO
// ============================================

// 1. Baixe o Service Account Key do Firebase Console:
//    Project Settings > Service Accounts > Generate new private key
//    Salve como: serviceAccountKey.json

admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

// ============================================
// DEFINIÇÃO DAS ATUALIZAÇÕES
// ============================================

const HABIT_UPDATES = {
    // Atualizar todos os hábitos de abstinência para padrão "Zero X"
    'avoid_alcohol': {
        title: 'Zero Álcool',
        description: 'Marque se NÃO bebeu hoje'
    },
    'avoid_cannabis': {
        title: 'Zero Cannabis',
        description: 'Marque se NÃO usou hoje'
    },
    'avoid_games': {
        title: 'Zero Jogos',
        description: 'Marque se NÃO jogou hoje'
    },
    'avoid_shorts': {
        title: 'Zero Reels/TikTok',
        description: 'Marque se NÃO assistiu hoje'
    },
    'avoid_yt': {
        title: 'Zero YouTube',
        description: 'Marque se NÃO assistiu hoje'
    },
    'no_nicotine': {
        title: 'Zero Nicotina',
        description: 'Manter-se livre do vício'
    }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function logProgress(current, total, userId) {
    const percentage = ((current / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(current / total * 20)) +
        '░'.repeat(20 - Math.floor(current / total * 20));
    process.stdout.write(
        `\r[${bar}] ${percentage}% (${current}/${total}) - Último: ${userId.slice(0, 8)}...`
    );
}

async function backupUser(userId, data) {
    // Criar backup antes de modificar
    const backupRef = db
        .collection('backups')
        .doc(userId)
        .collection('migrations')
        .doc(new Date().toISOString());

    await backupRef.set({
        timestamp: new Date().toISOString(),
        migration: 'update-abstinence-habits',
        originalData: data
    });
}

function updateHabit(habit) {
    // Se o hábito está na lista de updates, aplica as mudanças
    if (HABIT_UPDATES[habit.id]) {
        return {
            ...habit,
            ...HABIT_UPDATES[habit.id],
            // Preservar customizações do usuário
            enabled: habit.enabled,
            streak: habit.streak,
            whyChosen: habit.whyChosen
        };
    }
    return habit;
}

// ============================================
// FUNÇÃO PRINCIPAL DE MIGRAÇÃO
// ============================================

async function migrateAllUsers(options = {}) {
    const {
        dryRun = false,      // Se true, apenas simula sem salvar
        createBackup = true, // Se true, cria backup antes de modificar
        batchSize = 500      // Tamanho do batch para escrita
    } = options;

    console.log('🚀 Iniciando migração de hábitos...\n');
    console.log('Configurações:');
    console.log(`  - Dry Run: ${dryRun ? 'SIM (não vai salvar)' : 'NÃO (vai salvar)'}`);
    console.log(`  - Backup: ${createBackup ? 'SIM' : 'NÃO'}`);
    console.log(`  - Batch Size: ${batchSize}`);
    console.log('');

    // Estatísticas
    const stats = {
        total: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        habitsChanged: {}
    };

    try {
        // 1. Buscar todos os usuários
        console.log('📥 Carregando usuários...');
        const usersSnapshot = await db.collection('users').get();
        stats.total = usersSnapshot.size;
        console.log(`✅ Encontrados ${stats.total} usuários\n`);

        // 2. Processar cada usuário
        let currentBatch = db.batch();
        let batchCount = 0;

        for (let i = 0; i < usersSnapshot.docs.length; i++) {
            const userDoc = usersSnapshot.docs[i];
            const userId = userDoc.id;

            try {
                // Carregar protocolo do usuário
                const protocolRef = db
                    .collection('users')
                    .doc(userId)
                    .collection('data')
                    .doc('protocol');

                const protocolDoc = await protocolRef.get();

                if (!protocolDoc.exists) {
                    stats.skipped++;
                    continue;
                }

                const data = protocolDoc.data();
                const currentHabits = data.habits || [];

                // Aplicar updates
                const updatedHabits = currentHabits.map(updateHabit);

                // Verificar se houve mudanças
                const hasChanges = updatedHabits.some((habit, idx) => {
                    const current = currentHabits[idx];
                    return habit.title !== current.title ||
                        habit.description !== current.description;
                });

                if (!hasChanges) {
                    stats.skipped++;
                    continue;
                }

                // Contar quais hábitos foram alterados
                updatedHabits.forEach((habit, idx) => {
                    const current = currentHabits[idx];
                    if (habit.title !== current.title) {
                        stats.habitsChanged[habit.id] = (stats.habitsChanged[habit.id] || 0) + 1;
                    }
                });

                // Criar backup se habilitado
                if (createBackup && !dryRun) {
                    await backupUser(userId, data);
                }

                // Adicionar ao batch
                if (!dryRun) {
                    currentBatch.update(protocolRef, {
                        habits: updatedHabits,
                        updatedAt: new Date().toISOString()
                    });
                    batchCount++;

                    // Commit batch se atingir o limite
                    if (batchCount >= batchSize) {
                        await currentBatch.commit();
                        currentBatch = db.batch();
                        batchCount = 0;
                    }
                }

                stats.updated++;
                logProgress(i + 1, stats.total, userId);

            } catch (error) {
                stats.errors++;
                console.error(`\n❌ Erro no usuário ${userId}:`, error.message);
            }
        }

        // Commit último batch
        if (batchCount > 0 && !dryRun) {
            await currentBatch.commit();
        }

        // Limpar linha de progresso
        console.log('\n');

    } catch (error) {
        console.error('\n💥 Erro fatal:', error);
        throw error;
    }

    // Mostrar estatísticas finais
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO DA MIGRAÇÃO');
    console.log('='.repeat(50));
    console.log(`Total de usuários:        ${stats.total}`);
    console.log(`Usuários atualizados:     ${stats.updated}`);
    console.log(`Usuários pulados:         ${stats.skipped}`);
    console.log(`Erros:                    ${stats.errors}`);
    console.log('');
    console.log('Hábitos alterados por ID:');
    Object.entries(stats.habitsChanged).forEach(([id, count]) => {
        console.log(`  - ${id}: ${count} usuários`);
    });
    console.log('='.repeat(50));

    if (dryRun) {
        console.log('\n⚠️  DRY RUN - Nenhuma alteração foi salva');
        console.log('Execute novamente sem --dry-run para aplicar mudanças');
    } else {
        console.log('\n✅ Migração concluída com sucesso!');
    }

    return stats;
}

// ============================================
// EXECUÇÃO
// ============================================

// Detectar argumentos da linha de comando
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noBackup = args.includes('--no-backup');

// Validação de segurança
if (!dryRun) {
    console.log('⚠️  ATENÇÃO: Você está prestes a modificar dados em produção!');
    console.log('Pressione Ctrl+C nos próximos 5 segundos para cancelar...\n');

    // Delay de segurança
    setTimeout(() => {
        migrateAllUsers({
            dryRun: false,
            createBackup: !noBackup
        })
            .then(() => {
                console.log('\n✨ Processo finalizado!');
                process.exit(0);
            })
            .catch(error => {
                console.error('\n💥 Erro:', error);
                process.exit(1);
            });
    }, 5000);
} else {
    // Executar imediatamente se for dry run
    migrateAllUsers({
        dryRun: true,
        createBackup: false
    })
        .then(() => {
            console.log('\n✨ Simulação finalizada!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erro:', error);
            process.exit(1);
        });
}

/**
 * COMO USAR:
 * 
 * 1. Instalar dependências:
 *    npm install firebase-admin
 * 
 * 2. Baixar Service Account Key do Firebase Console
 * 
 * 3. Testar primeiro (dry run):
 *    node migrate-habits-example.js --dry-run
 * 
 * 4. Executar de verdade:
 *    node migrate-habits-example.js
 * 
 * 5. Sem backup (não recomendado):
 *    node migrate-habits-example.js --no-backup
 * 
 * RESULTADO ESPERADO:
 * 
 * ╔════════════════════════════════════════╗
 * ║  📊 RESULTADO DA MIGRAÇÃO              ║
 * ╠════════════════════════════════════════╣
 * ║  Total de usuários:        156         ║
 * ║  Usuários atualizados:     142         ║
 * ║  Usuários pulados:         14          ║
 * ║  Erros:                    0           ║
 * ║                                        ║
 * ║  Hábitos alterados por ID:             ║
 * ║    - avoid_alcohol: 98 usuários        ║
 * ║    - avoid_cannabis: 45 usuários       ║
 * ║    - avoid_games: 76 usuários          ║
 * ║    - avoid_shorts: 112 usuários        ║
 * ║    - avoid_yt: 89 usuários             ║
 * ║    - no_nicotine: 34 usuários          ║
 * ╚════════════════════════════════════════╝
 */
