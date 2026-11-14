# Mapa real em volta da pista na miniatura 3D, e a Análise da carreira mais enxuta

## Mapa real (o fundo do replay, do mapa da corrida, dos eventos e do guia do GP)

O Thiago escolheu o "mapa desenhado real" para o fundo da miniatura 3D: os prédios em blocos, as ruas, a água e as áreas verdes de verdade em volta de cada circuito, no lugar do disco liso.

- **`ferramentas/mapa-real.js` (novo):** para cada pista, pega a linha central real (bacinger/f1-circuits, MIT) e a encaixa na do jogo com a rotação, a escala e o espelho de `ferramentas/pista-real.js`, que agora exporta essas funções. Depois baixa uma vez, pela Overpass API, os prédios, as ruas, a água e o verde num raio em volta (© colaboradores do OpenStreetMap, licença ODbL).
  - Simplifica os contornos (Douglas-Peucker, 1,5 m), arredonda para unidades inteiras do jogo e grava `public/corrida/mapas/<pista>.json`.
  - A altura do prédio vem de `height` ou de `building:levels` × 3,2 m; sem as duas, fica com 9 m. O arquivo anota quantos prédios ficaram assim (`semAltura`).
  - Tenta até 4 vezes, alternando com um servidor de reserva, com limite de tempo por tentativa (`--tempo` para as cidades densas) e um modo `--faltam`.
- **Os mapas (23 pistas, medidos):** somam 2,1 MB (`du`), de 13 KB (Bahrein, Hungaroring) a 320 KB (Melbourne). O download do OpenStreetMap foi de uns 28 MB no total, uma vez, e fica no cache fora do repositório.
  - O encaixe ficou com erro médio de 4,3 m (Interlagos) a 13,5 m (Miami); Baku é a exceção, com 20,4 m.
  - O jogo só busca o mapa quando a miniatura da pista abre.
- **`gp-mapa-real.js` (novo):** transforma o mapa em malhas, todas juntas: uma para os prédios (paredes e telhado, altura × 2 para aparecer na escala da miniatura), uma para as ruas (as grandes mais claras) e uma para cada cor do chão.
  - Só desenha dentro do disco e fora da faixa da pista, para nada furar a pista nem a parede do relevo.
  - Tem as cores do tema padrão (escuro) e do claro e do escuro da Central.
- **`gp-miniatura.js`:** carrega o mapa sem travar (o resto aparece antes), mostra "© colaboradores do OpenStreetMap" e solta tudo junto com a cena.

## A Análise da carreira

- **Abas:** Visão geral (a principal, que abre primeiro), Desempenho, Pneus, Eventos e Replay, por último. Estratégia e Voltas saíram, porque a tabela de Pneus e o Desempenho cobrem o que elas mostravam.
- **Paradas para conserto:** a ida ao box só para consertar o carro (o "não trocar" do menu do box, ou o robô avariado com o pneu bom) saía da função antes de anotar qualquer coisa.
  - Agora fica em `p.consertos`, à parte de `p.paradas` (a regra dos pneus não muda), entra no log ("parou nos boxes só para consertar o carro") e vai para a análise (`k`).
  - Ela conta nas paradas da tabela de Pneus (marcada com *), nas estratégias, nas informações da corrida e no resultado do GP.
- **Eventos mais limpos:** saem o rádio do engenheiro, os avisos de devolver a posição, as bandeiras amarelas comuns (o safety car fica), a batida leve, o stop-and-go cumprido, a contagem das batidas propositais, o ritmo dos robôs, o "entrou no quadro de recordes", o "venceu o GP" e o "fim de corrida".
- **Sem giro automático:** a miniatura só se mexe com o mouse, os botões e os voos da câmera.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`, inclusive os 23 mapas. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
