# 🛠️ Guia de Solução de Problemas

## 1. Erro de Permissão ("Missing or insufficient permissions")
**Sintoma:** Ao clicar no olho para ver um amigo, aparece um erro vermelho no console e nada acontece.
**Causa:** As regras de segurança do Firestore impediam a leitura de dados de outros usuários.
**Solução:**
Já atualizei o arquivo `firestore.rules`. Você precisa aplicar essas regras no Firebase:

```bash
firebase deploy --only firestore:rules
```

## 2. Erro de Sincronização ("Unsupported field value: undefined")
**Sintoma:** Erro vermelho no console dizendo `Function setDoc() called with invalid data`.
**Causa:** O sistema tentava salvar dados de hábitos com campos indefinidos (`undefined`), o que o Firestore não aceita.
**Solução:**
Corrigi o arquivo `services/migration.ts` para garantir que campos vazios sejam salvos como `null` ou valores padrão (0, true), evitando o erro.
**Ação:** Nenhuma ação manual necessária, apenas recarregue a página.

## 3. Aviso do Tailwind ("cdn.tailwindcss.com should not be used in production")
**Sintoma:** Aviso amarelo no console.
**Causa:** Estamos usando a versão CDN do Tailwind para desenvolvimento rápido.
**Solução:** Para produção final, seria ideal configurar o PostCSS, mas para desenvolvimento e testes atuais, isso não afeta o funcionamento. Pode ignorar por enquanto.
