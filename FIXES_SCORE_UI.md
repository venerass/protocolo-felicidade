# 🛠️ Correções de Cálculo de Score e Melhorias de UI

## Resumo das Alterações

### 1. Correção do Cálculo de Score (>100%)
**Problema:** O cálculo de score no Dashboard e na página Social adicionava "bônus" por hábitos semanais completados ao numerador, mas não ao denominador. Isso permitia que o score ultrapassasse 100% (ex: 110%).
**Solução:**
- **Dashboard.tsx:** Removida a lógica de bônus de hábitos semanais para alinhar com a página de Analytics (que o usuário confirmou estar correta). Adicionado um `Math.min(100, ...)` para garantir que nunca passe de 100%.
- **Social.tsx:** Aplicada a mesma correção. Agora o score enviado para o ranking de amigos é estritamente limitado a 100%.

### 2. Discrepância entre Gráficos
**Problema:** O gráfico da página inicial (Dashboard) mostrava valores diferentes do gráfico de Progresso (Analytics).
**Solução:** A lógica de cálculo foi unificada. Agora ambos consideram apenas os hábitos diários para o cálculo da porcentagem, garantindo consistência visual em todo o aplicativo.

### 3. Percentual do Dia Visível
**Problema:** O usuário queria ver o percentual do dia de forma bem visível na página principal.
**Solução:**
- Adicionado um novo card **"Score de Hoje"** no topo do Dashboard (visível em dispositivos móveis).
- Exibe a porcentagem grande e colorida (Verde > 90%, Preto > 50%, Vermelho < 50%).
- Ícone de troféu (`Award`) para celebrar o progresso.

## Arquivos Modificados
- `components/Dashboard.tsx`
- `components/Social.tsx`

## Como Testar
1.  **Dashboard:** Verifique se o "Score de Hoje" aparece no topo (em mobile). Verifique se o gráfico de linha não ultrapassa 100% e bate com os dados da página de Analytics.
2.  **Social:** Verifique se o seu score no ranking não ultrapassa 100%. (Nota: Pode levar um momento para atualizar no Firebase após carregar a página).
