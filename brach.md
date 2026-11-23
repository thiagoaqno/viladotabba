# Menus e carreira animados (3 de 3 das animações)

Pedido do Thiago (2026-11-23): "quero basicamente animações entre todas as telas da interface da corrida, especialmente do modo carreira/carreira com amigos. Hoje praticamente não tem animação." Vai em cima de #910 (a torre), que vai em cima de #909 (os cards).

## O que entra (`public/corrida/animacoes.css` e `animacoes.js`, carregados no menu e na Central)
- **Entre páginas** (menu ⇄ Central da carreira, solo e com amigos): a transição nativa do navegador entre documentos (`@view-transition`): a página que sai desbota e encolhe um pouco, a que entra sobe 12 px e aparece. Sem suporte no navegador, troca seca como antes.
- **Tela inicial ⇄ sala:** a tela nova sobe e aparece (`Animacoes.entrar`, 300 ms). A troca continua na hora (quem chama `show` já encontra a tela nova visível); a ida para a corrida mantém a varredura de TV dela.
- **Abas da Central:** um sublinhado só, que desliza até a aba nova. A barra de abas é redesenhada a cada troca, então a barra nova nasce onde a antiga estava e corre até a ativa. O conteúdo já entrava deslizando (`animarAba`); agora as linhas das tabelas e listas entram em cascata (28 ms entre uma e outra, até 24 linhas).
- **Números da Central** (`.cx-numeros`, `.cx-nums`, `.cx-num`, `.cx-ob-num`, a sua posição na campanha): contam de 0 até o valor em 0,7 s, na abertura e a cada troca de aba. Só quando o número abre o texto ("20 pontos livres" conta; "Terminar no top 5" não).
- **Cartões da Central:** sobem 3 px com o mouse. **Botões:** afundam no clique (a propriedade `scale`, que soma com o transform de cada botão: os inclinados continuam inclinados, e o `transition` de cada um fica como estava).
- Com "reduzir movimento" no sistema, nada disso anima.

Conferido no navegador: carreira de teste criada no servidor local (banco em memória), o sublinhado indo de 60 a 430 px na troca Central → Classificação, 24 linhas em cascata, "20 pontos livres" passando por "9" na contagem, e a sala abrindo e fechando com a animação e já visível na hora.

O que não entrou: uma opção própria de "reduzir animações" nas Configurações (hoje vale a do sistema).
