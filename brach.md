# Pneus, voltas por GP, plano do domingo, eventos da carreira e falas novas

Pedido do Thiago (2026-11-21): "precisamos aumentar a escala de tudo... um mega PR". Não foi jogado: conferido com `node --check` e com as medições abaixo.

## Pneus
- **Vidas inteiras** (`f1-regras.js`): macio 3, médio 4, duro 5, intermediário 6, chuva 8 voltas (eram 2,95 / 3,95 / 4,95 / 5,95 / 7,95).
- **O robô planejava com o desgaste errado.** Medido com `klk/medir/desgaste.js` (o robô na corrida, sem box): em Bahrein ele gasta o médio em 3,69 voltas e o macio em 2,80, mas a tabela de planos (`f1-pneus-tabela.js`, o piloto ideal) dizia 2,93 e 2,19, e ele parava cedo. Agora o `gasto` dos secos na tabela é o nominal × 1,08 (o medido) × o comprimento da pista. Conferido depois da troca: Singapura, médio de verdade 2,80 voltas e plano 2,77; México, 4,06 e 4,02.
- **Pneu por distância**: a `vida` é em voltas de Bahrein (na Formula GP, da gp-bahrein); `REL_PISTA` guarda o comprimento de cada volta sobre o da referência (medido com `sim.js criarPista`). O desgaste (`gastarPneu`, opção `rel`) e as contas de vida (`vidaEmVoltas(c, fator, agua, pista)`) usam isso: no servidor, na previsão do navegador, nos robôs (paradas e chuva), no MFD e no menu do box. Exemplo: macio 3,25 voltas no México, 3 em Bahrein, 2,24 em Singapura.

## Voltas de cada GP
- `F1.voltasDoGP(base, pista)`: o tamanho escolhido na carreira (2, 3, 5 ou 10, agora "Sprint / Curta / Média / Longa") vira as voltas da mesma distância em cada pista (mínimo 2). Com 10: Singapura 7, Spa 8, Bahrein 10, México 11. Vale na carreira solo e na com os amigos (`corrida.js`, que aceita de 1 a 40 voltas só para essas salas); a Central, os stories, o Paddock e o mapa do GP mostram as voltas do GP.

## Plano do domingo
- `sim.js PLANO`: arriscar agora dá +15% de potência e +3% de aderência, com o pneu gastando 50% mais; seguro, −4% de potência, −2% de aderência e 35% menos pneu (eram ±2% de aderência e ±20% de pneu). Com o piloto ideal em Bahrein (`klk/medir/plano.js`) a volta foi 0,175 s mais rápida no arriscar e 0,108 s mais lenta no seguro, com o pneu ×1,50 e ×0,65; o piloto ideal não aproveita toda a potência na reta, então o ganho jogando deve ser maior (não medido).

## Eventos da carreira (`paddock.js`)
Sete novos, que passam na frente dos antigos no sorteio dos dois do GP e mudam o fim de semana:
- **Pacote novo**: estrear (70% funciona: +2,5% de aderência; senão −1,5%), pagar testes (−2 milhões, +2,5% certo) ou esperar.
- **Motor no limite**: trocar (+5% de potência e 5 posições a menos no grid) ou seguir (−3% de potência).
- **Onda de calor**: acerto para o calor (−1,5% de aderência, pneu −25%) ou manter (pneu +30%).
- **Batida no treino**: chassi reserva (−2% de aderência, −1% de potência) ou consertar (−2 milhões).
- **Provocação do rival**: responder (a rixa sobe e ele aperta mais na pista), desafiar (no GP seguinte: na frente dele, +8 de torcida e patrocinador; atrás, −8 e −6) ou ignorar.
- **Aposta do patrocinador**: top (meta − 1) vale +5 milhões; falhar, −12 de patrocinador.
- **Sondagem de outra equipe**: renegociar (bônus por vitória +1, diretoria −4) ou ficar (diretoria +5, torcida +4).

O efeito no carro sai de `Paddock.modificadores(s)`, vai para `room.players[id].gpMods` (`corrida.js`, junto do plano) e o `sim.js` aplica no servidor e na previsão do navegador, também na classificação. A punição de grid entra em `startRace`, depois da classificação.

## Falas novas e o .bat
- `radio/falas.js`: 11 situações novas (os eventos na largada, pista comprida ou curta) e mais variações no fim das de sempre (os números dos mp3 que já existem não mudam). O `hud.js` fala os eventos e a pista na largada; o `sede.js` guarda os eventos do GP para a corrida.
- **`FALAS-NOVAS-CORRIDA.bat`** (CRLF): mostra quantas faltam (hoje 68, 3.537 caracteres), pede a chave sem mostrar e gera só as que faltam com a voz do engenheiro. Os mp3 entram no git com `git add -f`.

## Testes
- `tests/corrida-f1-pneus.test.js`: as vidas esperadas viraram 3/4/5.
