# Tiro: Battle royale com largada espalhada e paraquedas mais alto

Dois pedidos do Thiago:

**Largadas mais espalhadas.** Os lugares de largada do cada um por si (`ffaSlots`) começam sempre na base do Alpha e só se afastam até 60 m, então num mapa grande ficava todo mundo de um lado. No Battle royale agora são outros:
- entram todos os pontos de chão do mapa com céu aberto em cima (para cair de cima);
- o primeiro é sorteado e cada um dos seguintes é o mais longe possível dos já escolhidos, sem limite de distância;
- a ordem de quem pega cada lugar também é embaralhada, para ninguém cair sempre no mesmo canto;
- a semente é a mesma do salão, então todo mundo calcula os mesmos lugares.

**Paraquedas mais alto.** Abre a 35 m do chão (era 18), e o começo subiu para 75 m (era 60), para sobrar queda livre. Com o paraquedas aberto dá uns 6 s de planeio (uns 45 m para o lado).

Feito em `ferramentas/tiro-br.js`. Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
