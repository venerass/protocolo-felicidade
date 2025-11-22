# 🔒 Correção de Permissões (Erro ao Ver Amigo)

O erro `FirebaseError: Missing or insufficient permissions` acontece porque as regras de segurança do banco de dados (Firestore) estavam impedindo que você lesse os dados dos seus amigos.

## O que foi feito
Atualizei o arquivo `firestore.rules` para permitir que qualquer usuário autenticado possa ler (mas não alterar) os dados de protocolo (hábitos e logs) de outros usuários.

## ⚠️ Ação Necessária: Publicar as Regras
Para que essa correção funcione no seu aplicativo (mesmo rodando localmente, se ele conecta ao Firebase na nuvem), você precisa enviar as novas regras para o Firebase.

Execute o seguinte comando no terminal:

```bash
firebase deploy --only firestore:rules
```

Se você não estiver logado, faça o login antes:
```bash
firebase login
```

Após o deploy, tente clicar no ícone de olho novamente. O erro deve desaparecer e o perfil do amigo deve carregar com o novo design de comparação!
