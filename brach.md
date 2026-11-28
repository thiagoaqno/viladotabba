# Tiro: no salão do BR em dupla, cada um escolhe a dupla

Pedido do Thiago: "deve ser possível escolher qual dupla você quer jogar... o lobby do BR duplas tem que ser separado em duplas, com opção de jogar sem bots".

**No salão** (modo "BR em dupla"):
- no menu do salão, logo abaixo de "Modificar a classe", aparece **"Sua dupla"**: **Automática** ou de **1 a 10**. As duplas que já têm 2 pessoas aparecem como "(cheia)", e o host não deixa entrar uma terceira;
- a lista de jogadores do salão fica **separada por dupla**: "Dupla 3: Fulano, Ciclano", "Dupla 5: Beltrano, + robô"; quem deixou automático aparece em "Dupla automática". Embaixo diz se os robôs completam até 20 ou se é só gente;
- **sem robôs**: já dava, e continua igual. Em "Bots", escolha **Nenhum**. Aí quem está sozinho numa dupla joga sozinho, e só gente entra na partida.

**Na partida** (`brDuplasMontar`, em `ferramentas/tiro-br-dupla.js`), as duplas seguem o salão:
1. primeiro quem escolheu uma dupla (até 2 por dupla);
2. depois quem deixou automático, de dois em dois, em duplas vazias;
3. por último os robôs: primeiro completam quem ficou sozinho numa dupla, e depois formam duplas só de robôs.

A conta é a mesma em todas as máquinas, porque a escolha de cada um vai no estado do salão. No solo continua: você e um robô.

**Rede:** o jogador ganha o campo `d` (a dupla, de 0 a 9, ou -1), que vai no estado do salão; o convidado pede a dupla ao host com a mensagem `dupla`, que entra no mesmo limite de pedidos da troca de equipe.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei nem abri um salão.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
