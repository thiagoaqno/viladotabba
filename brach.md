# Tiro: elo (Prata, Ouro, Diamante, Ascendente, Imortal, Radiante)

Pedido da galera.

**Ranques:** Prata, Ouro, Diamante, Ascendente e Imortal têm 3 divisões de 100 pontos cada (Prata 1 = 0 pontos, Ascendente 1 = 900, Imortal 1 = 1200). O Radiante começa em 1500 e não tem divisão. Todo mundo começa no Prata 1 e não desce abaixo de 0.

**Pontos por partida** (as faixas do Thiago):

| Onde está | Vitória | Derrota |
|---|---|---|
| até chegar no Ascendente 1 | +20 a +26 | -10 a -15 |
| Ascendente | +19 a +22 | -19 a -20 |
| Imortal | +14 a +18 | -20 a -22 |
| Radiante | +13 a +16 | -22 a -24 |

Dentro da faixa, quem fica mais alto no placar do próprio time ganha mais e perde menos. Empate não mexe nos pontos.

**O que vale elo:**
- partida **online** de **mata-mata em time** ou **dominação**;
- com pelo menos **4 pessoas** (os bots não contam);
- quem não tem perfil não entra no elo.

**Contra trapaça:** a partida roda no navegador de quem cria a sala, então cada jogador manda o próprio resultado no fim. A partida só conta quando **2 perfis diferentes** mandam o mesmo placar com as mesmas pessoas. Ninguém sobe sozinho inventando vitória, e a mesma partida não conta duas vezes.

**Onde aparece:**
- **Fim da partida:** o ranque e quanto subiu ou desceu (+26, "Subiu de Prata 3 para Ouro 1"). Enquanto o segundo perfil não confirma, aparece "esperando outro jogador confirmar".
- **Janela do perfil:** o ranque, a barra da divisão, as vitórias e derrotas, as últimas 10 partidas e o ranking do elo da galera.
- **Cartão do menu:** "Nível 12 · Ouro 2".

**Arquivos:**
- `servidor/jogos/tiro-elo.js`: a regra.
- `migracoes/057-tiro-elo.sql`: as tabelas.
- `servidor/comum/bd.js`: as funções do banco.
- `servidor/jogos/tiro-perfil.js`: as rotas `/tiro/perfil/elo`.
- `ferramentas/tiro-perfil-cliente.js`: as telas.
- `ferramentas/tiro-frontline.js`: o jogo manda o placar no fim.

**Conferido:**
- **No banco em memória:** fica esperando o segundo perfil, a partida repetida não conta de novo, placar diferente não confirma, 3 pessoas e todos contra todos não contam, e as faixas batem com a tabela.
- **No navegador:** a janela do perfil, o ranking, o "esperando" e o +26 no fim aparecem.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
