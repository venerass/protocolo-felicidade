# 🚀 Guia Rápido: Como Atualizar Hábitos Padrão Para Todos Usuários

## Cenário
Você mudou o texto de um hábito em `constants.ts` (ex: "Evitar Álcool" → "Zero Álcool") e quer que TODOS os usuários existentes vejam essa mudança.

## ⚡ Solução Rápida (Usuário por Usuário via Interface)

Cada usuário pode atualizar seus próprios hábitos:

1. Abrir app
2. Ir em **Settings** (⚙️)
3. Clicar em **"Atualizar Textos"**
4. Pronto! ✅

## 🔧 Solução Técnica (Todos de Uma Vez)

### Opção 1: Console do Firebase (Manual)

1. Abra Firebase Console → Firestore Database
2. Navegue até: `users/{userId}/data/protocol`
3. Edite o campo `habits` → encontre o hábito pelo `id`
4. Atualize `title` e `description`
5. Salve

**Problema:** Tedioso se tiver muitos usuários.

### Opção 2: Script Node.js com Admin SDK (Recomendado)

Crie arquivo `scripts/migrate-habits.js`:

```javascript
const admin = require('firebase-admin');

// Inicializar
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

async function updateAbstinenceHabits() {
  console.log('🔄 Iniciando migração...');
  
  const usersSnapshot = await db.collection('users').get();
  let updated = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    
    try {
      const protocolRef = db
        .collection('users')
        .doc(userId)
        .collection('data')
        .doc('protocol');
      
      const protocolDoc = await protocolRef.get();
      
      if (!protocolDoc.exists) continue;
      
      const data = protocolDoc.data();
      const habits = data.habits || [];
      
      // Mapear e atualizar hábitos
      const updatedHabits = habits.map(habit => {
        // Atualizar hábitos de abstinência para novo padrão "Zero X"
        const updates = {
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
        
        if (updates[habit.id]) {
          return {
            ...habit,
            ...updates[habit.id]
          };
        }
        
        return habit;
      });
      
      // Salvar
      await protocolRef.update({ habits: updatedHabits });
      updated++;
      
      console.log(`✅ Usuário ${userId} atualizado`);
      
    } catch (error) {
      console.error(`❌ Erro no usuário ${userId}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Migração completa! ${updated} usuários atualizados.`);
}

updateAbstinenceHabits()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
```

**Executar:**

```bash
# Instalar dependências
npm install firebase-admin

# Baixar service account key do Firebase:
# Firebase Console > Project Settings > Service Accounts > Generate new private key
# Salvar como scripts/serviceAccountKey.json

# Executar migração
node scripts/migrate-habits.js
```

### Opção 3: Cloud Function (Melhor para Produção)

Crie função que pode ser chamada por admin:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.migrateHabits = functions.https.onCall(async (data, context) => {
  // Apenas admins podem chamar
  if (!context.auth || context.auth.token.email !== 'admin@exemplo.com') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas administradores podem executar migrações'
    );
  }

  const db = admin.firestore();
  const habitUpdates = data.updates; // { habitId: { title, description } }
  
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  let count = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const protocolRef = db
      .collection('users')
      .doc(userDoc.id)
      .collection('data')
      .doc('protocol');
    
    const protocolDoc = await protocolRef.get();
    if (!protocolDoc.exists) continue;
    
    const habits = protocolDoc.data().habits || [];
    const updated = habits.map(h => {
      if (habitUpdates[h.id]) {
        return { ...h, ...habitUpdates[h.id] };
      }
      return h;
    });
    
    batch.update(protocolRef, { habits: updated });
    count++;
    
    // Firestore batch limit = 500
    if (count % 400 === 0) {
      await batch.commit();
    }
  }
  
  await batch.commit();
  return { success: true, usersUpdated: count };
});
```

**Chamar função:**

```javascript
// No frontend (como admin)
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const migrateHabits = httpsCallable(functions, 'migrateHabits');

const result = await migrateHabits({
  updates: {
    'avoid_alcohol': {
      title: 'Zero Álcool',
      description: 'Marque se NÃO bebeu hoje'
    }
  }
});

console.log('Migração completa:', result.data);
```

---

## 🎯 Fluxo Recomendado

### Para pequenas mudanças (1-2 hábitos):
1. Atualizar `constants.ts`
2. Criar post/email pedindo usuários atualizarem via Settings
3. Monitorar quantos sincronizaram

### Para mudanças grandes (refactor completo):
1. Atualizar `constants.ts`
2. Executar script Node.js (Opção 2)
3. Validar em staging primeiro
4. Executar em produção
5. Notificar usuários da melhoria

### Para sistema automatizado:
1. Implementar Cloud Function (Opção 3)
2. Criar painel admin no app
3. Admin clica "Migrar Hábitos"
4. Função executa batch update
5. Sistema envia notificação aos usuários

---

## ⚠️ Pontos de Atenção

1. **Backup Primeiro!**
   ```bash
   # Exportar Firestore antes de qualquer migração
   firebase firestore:export gs://seu-bucket/backups/$(date +%Y%m%d)
   ```

2. **Testar em Staging**
   - Criar projeto Firebase separado para testes
   - Rodar migração lá primeiro
   - Validar resultados

3. **Preservar Customizações**
   - O sistema de migração já faz isso
   - Sempre mescla com spread operator: `{ ...habit, ...updates }`
   - Nunca sobrescreve `enabled`, `streak`, `whyChosen`

4. **Rate Limits**
   - Firestore tem limites de escrita
   - Use batches de 400-500 operações
   - Adicione delays se necessário

---

## 📊 Exemplo Completo (Caso Real)

**Situação:** Você quer atualizar todos os hábitos "Zero X" para deixar claro que é pra marcar quando NÃO fizer.

### Passo 1: Atualizar constants.ts

```typescript
// constants.ts
{
  id: 'avoid_alcohol',
  title: 'Zero Álcool',  // ✅ Mudou de "Evitar Álcool"
  description: 'Marque se NÃO bebeu hoje', // ✅ Novo
  // ... resto igual
}
```

### Passo 2: Rodar migração (escolher método)

**Método Simples - Pedir aos usuários:**
- Post no app: "Nova atualização! Vá em Settings → Atualizar Textos"

**Método Automático - Script:**
```bash
node scripts/migrate-habits.js
```

### Passo 3: Verificar
- Login como usuário teste
- Verificar se hábito aparece com novo texto
- Verificar se streak e enabled state permanecem

---

**Dúvidas?** Consulte `services/migration.ts` para ver o código completo.
