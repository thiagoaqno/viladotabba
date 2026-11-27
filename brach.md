# Tiro: entrada caindo de cima no Battle royale

No começo do Battle royale, cada um nasce **60 m acima** do seu lugar de largada:
- durante a **contagem** fica parado no ar, olhando o mapa de cima (dá pra ver onde estão as armas e as caixas);
- no **"Vai!"** cai rápido (16 m/s) e, a **18 m do chão**, abre um **paraquedas** laranja e desce devagar (5,5 m/s), sem tranco no pouso;
- no ar, as **teclas de andar fazem planar** (10 m/s na queda livre, 7 m/s de paraquedas) para escolher onde cair. Aparece o aviso "Ande para planar e escolher onde cair";
- os **robôs** caem em linha reta no lugar deles;
- só cai de cima quem tem **céu aberto** em cima do lugar. Quem nasce embaixo de um teto, sacada ou árvore nasce no chão, como antes, para ninguém ficar preso num telhado;
- o paraquedas aparece em todo mundo que está descendo, inclusive os outros jogadores do salão (pela altura que chega pela rede).

Feito em `ferramentas/tiro-br.js`, no mesmo ponto em que a zona confere cada soldado depois do passo (`ringCheck`).

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
