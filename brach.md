# Tiro: Battle royale em dupla (cair e levantar o parceiro)

Pedido do Thiago: "cria um modo DUO para o BR. Caso um caia, o outro reanima e tal."

**Modo novo no menu: "BR em dupla"** (solo e salão, até 12, robôs completando):
- **6 duplas.** As duplas saem da ordem de largada do jogo: no salão, as pessoas por ordem de identificador e depois os robôs do host (então duas pessoas num salão caem na mesma dupla); no solo, você e um robô. A conta é a mesma em todas as máquinas e fica fixa no "Vai!";
- **o parceiro é aliado**: não leva tiro seu, aparece em claro e no minimapa. A dupla cai do céu junta, a 3 m uma da outra;
- **cair em vez de morrer**: o tiro que mataria, com o parceiro de pé, derruba. Quem cai fica agachado, não atira e não mira, com **30 s** de vida que também caem com tiro. Um anel no chão marca quem está caído (azul o seu parceiro, vermelho os outros);
- **levantar**: o parceiro chega perto (até 1,9 m) e fica **4 s sem atirar**, sem botão (funciona no PC, no controle e no tablet), e o caído volta com **30 de vida**. Um aviso na tela conta o tempo dos dois lados;
- **morre de vez** quem sangra até o fim, leva o tiro final caído, cai do mapa ou fica caído sem parceiro de pé;
- **robôs**: com o parceiro caído e sem inimigo à vista, vão até ele e levantam; robô caído fica parado agachado;
- **a dupla sai quando os dois morrem**; a última dupla de pé vence e **os dois ganham**. O placar do fim é por dupla, o do jogo mostra "N duplas vivas" e, morto, a câmera segue o parceiro.

**Rede:** cada máquina decide sobre os seus soldados, como nas mortes. "Caiu"/"levantou" vão como evento `brc` e "levantei o meu parceiro" como `brv`, e a máquina do caído levanta ele.

**Arquivos:** `ferramentas/tiro-br-dupla.js` (novo, entra logo depois do `tiro-br.js`); no `tiro-br.js`, `brModo()` para os dois battle royale; no `tiro-frontline.js`, a injeção do arquivo novo e os testes de modo do menu.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei, nem sozinho nem em dupla no salão.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
