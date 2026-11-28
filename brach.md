# Tiro: peças de arma pelo mapa do Battle royale, com equipar automático

Pedido do Thiago: encontrar peças de armas andando pelo mapa e poder ajustar no meio da partida. Escolhemos o equipar automático, em vez de um inventário.

**Como funciona** (`ferramentas/tiro-br.js`: `brPecasPoe`, `brPecaArma`, `brPecaPor`):
- no Battle royale, as **peças** (os 19 acessórios do jogo: miras, silenciador, compensador, freio de boca, choke, canos, empunhaduras, laser, carregadores, coronhas, munições) ficam no chão **ao lado da outra metade dos lugares das armas** (a primeira metade tem as granadas): dentro das construções, nas lajes ou nos marcadores do editor, com a semente do salão. É uma caixinha pequena com a cor do encaixe (azul: mira; cinza: cano; marrom: sob o cano; vermelha: lateral; verde: carregador e munição; preta: coronha);
- **passando por cima**, a peça **entra sozinha na arma da mão**, se servir nela (as mesmas regras do menu de classes: a família da arma, um acessório por encaixe e no máximo 4 por arma). Se não couber na da mão, tenta a outra arma. Aparece "Silenciador na M4A1", e a arma na mão já mostra a peça;
- se o encaixe já estiver ocupado, a peça **fica no chão**, para ninguém trocar de peça sem querer só de andar;
- quando você pega outra arma no chão, ela vem com as peças dela (as da arma antiga ficam na arma antiga);
- os robôs não pegam peças. Como as caixas e as granadas, as peças não vão pela rede: a que outro jogador pisou some na sua tela também.

**Ainda não tem:** tirar ou trocar uma peça que já está na arma (seria o inventário), e os robôs usando peças.

Conferido só com `node --check` (o arquivo e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
