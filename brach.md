# Tiro: Battle royale com até 20 jogadores e sem tiro na queda

Dois pedidos do Thiago: "aumenta a quantidade de players por partida" e "faz não ser possível atirar enquanto você cai de paraquedas".

**Até 20 jogadores** (era 12) no Battle royale e no BR em dupla (10 duplas):
- o jogo cria 11 robôs no começo; agora cria mais 8 no boot (Tavares, Ribeiro, Nogueira, Barbosa, Moreira, Cardoso, Pacheco, Siqueira), que **só jogam o battle royale**. Nos outros modos o roster é montado como se eles não existissem e o menu não muda;
- no solo, 19 robôs com você; no salão, gente até 20 e robôs completando;
- o relé do servidor (`servidor/jogos/tiro-rele.js`) passa a aceitar 20 por salão (19 convidados mais o host). Os outros modos continuam parando em 8 no próprio jogo;
- as largadas espalham 20 lugares (10 pares na dupla).

**Sem tiro na queda:** enquanto está caindo (do começo até pousar), o jogador não atira, não mira, não joga granada e fica com a arma baixa, que sobe ao pousar. Os robôs só caem, sem pensar nem atirar.

**Atenção:** quem é o host simula os 19 robôs. Num tablet fraco isso pesa; vale ver o desempenho.

Arquivos: `ferramentas/tiro-br.js` (`BR_MAX`, `BR_NOMES`, os robôs a mais, `modeRoster`), `ferramentas/tiro-br-dupla.js` (sem tiro na queda, 10 duplas), `ferramentas/tiro-frontline.js` (cria os robôs no boot, os nomes na tela do solo) e o relé.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
