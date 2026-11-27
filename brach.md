# Tiro: modo Battle royale (primeira versão)

Modo novo no menu, ao lado de Por equipe, Cada um por si e Dominação. Funciona no solo e no salão online, em qualquer mapa (o Simoun, o maior, é o melhor pra ele).

**Regras:**
- até **12 no salão** (gente + robôs completando); nos outros modos o salão continua com 8;
- **ninguém renasce**; o **último vivo vence**; o placar do fim é a ordem de eliminação (depois os abates);
- todo mundo começa **só com a pistola** da classe (os robôs com uma M9); fuzis, submetralhadoras, escopetas e snipers ficam **espalhados pelo chão** (14 a 30 armas, conforme o tamanho do mapa). Com vaga livre, a arma do chão (E) entra como segunda arma, sem largar a pistola;
- a **zona** (parede azul) fecha em 4 etapas até sumir, uns 4 a 6 minutos ao todo; fora dela a vida cai e não volta, cada etapa mais rápido. O placar mostra quantos estão vivos e quando a zona fecha;
- **sem séries de abates** (helicóptero, mecha etc.);
- morto, depois da killcam, a câmera **segue quem ainda está vivo**, com "Você ficou em Nº".

**Robôs:** vão atrás de arma no chão enquanto estão só com a pistola, pegam a arma quando passam por cima e fogem para dentro da zona.

**Como foi feito:** `ferramentas/tiro-br.js` (novo) entra no jogo antes do boot, como as camuflagens, e troca algumas funções da partida por versões que chamam a original e acrescentam o battle royale. Dentro da partida é um "cada um por si" com `BR.on`. Em `ferramentas/tiro-frontline.js` ficam só os pontos do menu e do salão que testam `'ffa'`, o tamanho do salão, os 11 robôs do solo, o fim e a classificação.

**O que ainda não tem:** as armas do chão não são avisadas pela rede (como as que caem dos mortos hoje): dois jogadores podem pegar a mesma. A zona não aparece no minimapa. Ninguém entra caindo de cima e não tem caixa de colete nem de cura (fica para a segunda versão, junto com o mapa maior).

Conferido só com `node --check` (o build e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
