# 🎨 Atualizações de Design - Versão 3 (Modo Comparação)

## 1. Perfil de Amigo (Modo Comparação)
Agora, ao visitar o perfil de um amigo, a experiência é focada totalmente na **comparação de progresso**, mantendo a privacidade dos hábitos individuais.

### O que mudou:
- **🙈 Hábitos Ocultos:** A lista de hábitos específicos (Manhã, Tarde, Noite) não é mais exibida. Você vê apenas o resultado geral, não o que o amigo fez especificamente.
- **📈 Gráficos Comparativos:**
  - **Performance:** Um gráfico de linha mostrando sua pontuação vs. a pontuação do amigo nos últimos 7 dias.
  - **Equilíbrio (Humor):** Um segundo gráfico comparando o nível de bem-estar/humor de vocês dois.
- **🔥 Comparação de Streak:**
  - Novos cards mostram lado a lado o seu "Streak" (dias seguidos) e o do seu amigo.
- **📅 Calendário de Constância:**
  - O seletor de datas agora tem indicadores coloridos:
    - **Roxo:** Amigo registrou dados.
    - **Verde:** Você registrou dados.

## 2. Design Geral
- Mantido o "Dia de Ouro" e o novo header limpo implementados na V2.

## Arquivos Modificados
- `components/Dashboard.tsx` (Lógica de comparação, novos gráficos, ocultação de hábitos)
