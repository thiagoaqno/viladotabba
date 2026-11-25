# Editor do capacete: os capacetes em pixel art como "Padrões"

O Thiago pediu que os capacetes das folhas de pixel art entrassem no editor de capacete como padrões.

- **`f1-capacetes-padroes.js` (novo):** são 30 padrões, os 22 pilotos do grid e 8 extras que sobraram das folhas. Cada um tem:
  - o desenho do editor. Os 22 pilotos usam o desenho deles em `f1-capacetes.js`; os extras usam um rodízio de desenhos do editor. Todos estão na lista do servidor (`DESENHOS_CAPACETE`);
  - as três cores principais, tiradas da imagem em pixel por ferramenta: k-médias no casco, sem o visor e o que é quase preto, em ordem de quanto aparecem;
  - a viseira escura.
- **A aba "Padrões" (`capacete-editor-ui.js`):** é a primeira do menu. Mostra a grade com as miniaturas em pixel art e o nome de cada um, e a grade rola. O clique aplica o desenho, as cores e a viseira e volta ao primeiro "Padrão" (variante 0). Depois dá para ajustar à vontade nas outras abas.
- **Onde aparece:** o editor é o mesmo da sala e da aba Capacete da carreira, então os padrões aparecem nos dois lugares.
- **Conferido:** num servidor de teste, montei o editor, abri a aba e cliquei no padrão do Norris. Ficaram 30 padrões, e o capacete guardado ficou com o desenho "faixa" e o verde-neon. A página não teve erros.
# Carreira de F1: a aba "Meu piloto"

O Thiago pediu que a carreira de F1 tivesse uma guia "Meu piloto" para montar o piloto em pixel art.

- **A aba (`temporada/central.js`):** "Meu piloto" entra na Central, entre "Capacete" e "Contratos". Ela funciona como a aba Capacete: a Central marca o lugar (`data-cx-piloto`), e o módulo de `temporada/index.html` (`window.PilotoCarreira`) põe ali o montador. Ele é o mesmo da sala (`piloto-pixel-editor.js`), com a prévia no macacão da sua equipe da carreira.
- **Onde fica guardado:** neste navegador, o mesmo do montador da sala. Vai para a pista na próxima corrida, porque a carreira passa pela classificação, onde o piloto é enviado (`sincronizarPixel`).
- **Conserto:** o montador importava o `estado.js` direto, e ele depende do `Comum` que só existe na página do jogo. Na Central, isso derrubava o módulo inteiro. Agora o `estado.js` só é carregado quando o montador fala com a sala. Na sala, a cor do macacão e o nome para o sorteio entram pelas opções de `montarMontador` (`cor` e `nome`).
- **Conferido:** a página da carreira e a do jogo carregam num servidor de teste, e o montador aparece e responde nas duas. Na carreira, o único aviso é o ícone da aba (`favicon`), que já faltava antes.
# Apresentação da pista: o grid de largada fila a fila, no estilo da transmissão

O Thiago pediu que, na apresentação da pista, a ordem dos pilotos passasse de 2 em 2 com os cards deles, grandes e em destaque. Depois mandou o print do "Starting grid" da transmissão do jogo da F1 como referência.

## O painel (`transmissao.js`: `cartaGrid`, `ladoDoGrid`, `meioDoGrid`; `transmissao.css`: `.tvGridP`, `.tgp*`)

- **O painel:** ocupa a tela quase inteira. Em cima vêm "Fórmula 1 · <pista> <ano>" e o título "Grid de largada".
- **Cada lado, um piloto da fila da vez:**
  - a posição enorme ("17º") no alto;
  - o retrato em pixel art grande, de até 384 px;
  - embaixo, o logo da equipe, o nome e o sobrenome em letras grandes;
  - o tempo da classificação e a diferença para a pole em vermelho, quando houve classificação (`E.S.quali.tabela`).
- **O meio:** o grid em zigue-zague, com os ímpares à esquerda e os pares à direita, um pouco abaixo. Ele é preenchido da pole para trás com a sigla na cor da equipe, e a fila da vez fica sublinhada.
- **A ordem:** os pares vão da pole até a última fila, como na referência. A câmera do bloco agora anda no mesmo sentido, da pole para trás.
- **No celular:** o meio some e os dois lados dividem a tela.

## O tempo

O Thiago pediu: "pode aumentar o tempo total para uns 20 s, aí dá tempo de exibir tudo com calma".

- A transmissão da corrida avulsa passou de 8 para 20 s (`TV_AVULSA_MS`, `corrida-base.js`). A da temporada continua em 25 s.
- Os blocos (`BASE`) ficaram assim: pista 6 s, clima 2,5 s, campeonato 4,5 s e grid 12 s. Antes eram 9,5 / 4 / 6,5 / 5.
- Dá cerca de 1 s por fila, e ainda dá para pular.

## Conferido

Montei uma página estática com o CSS e uma fila de exemplo para ver o visual, e a página do jogo carrega sem erros num servidor de teste. A transmissão rodando com a câmera não foi vista.
