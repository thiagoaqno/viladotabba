# Tira a estratégia de paradas da equipe

Pedido do Thiago (2026-11-21): "as estratégias de box atuais não fazem muito sentido, acho que devemos tirar".

- `temporada/paddock.js`: saem o evento "A estratégia de paradas" (Equilibrada, Agressiva, Conservadora) e as contas dele (`estrategiasDoGP`, `estrategiaEscolhida`). As decisões antigas desse GP ficam no save, sem efeito.
- `corrida.js`: a carreira não escolhe mais o pneu da largada nem manda `paradasEquipe` para o carro.
- `estrategia-box.js` e `mfd.js`: o MFD não chama mais o box pelo plano. Fica a sugestão de sempre, pelo pneu, pela chuva e pelo stop-and-go.
- O Jeff ("qual a estratégia?") segue respondendo com o pneu de agora e o plano do domingo, e diz que as paradas são decisão sua.
- `temporada/index.html`: a Central não carrega mais `f1-pneus-tabela.js` e `f1-pneus-ritmo.js`, que estavam lá só para isso.
- Conferido numa carreira simulada: oito GPs com até três acontecimentos e o plano do domingo, sem a estratégia.
