# O pneu do plano e dos eventos com limite, e a estratégia da equipe contando com ele

A corrida do Thiago em Jeddah (2026-11-21, carreira, 10 voltas): "Jogar seguro" (pneu ×0,7) com "Acerto para o calor" (×0,75) deu ×0,525. O médio gastou 10% por volta (lido no banco do programa: 0,103 / 0,204 / … / 0,595 na 6ª volta), ele fez 7 voltas com um jogo e venceu. A estratégia "Conservadora" chamou o box na 7, porque não sabia do plano.

- **Os planos do domingo saem do `sim.js` para o `f1-regras.js`** (`PLANOS_DOMINGO`, com `desgasteDoPlano`), para a Central também ler.
- **Os planos poupam menos pneu**: seguro 0,7 → 0,85, esticar os pneus 0,6 → 0,75, a segunda fase da largada forte 0,85 → 0,9, a primeira de guardar para o fim 0,75 → 0,85. O calor do Paddock fica em 0,85 / 1,2 (era 0,75 / 1,3).
- **O pneu do plano vezes o dos eventos fica entre 0,8 e 1,4** (`DESGASTE_SOMADO`, aplicado no `sim.js`, onde o plano e os eventos agora entram juntos).
- **A estratégia de paradas da equipe** (`paddock.js estrategiasDoGP`) passa o fator do plano já escolhido e dos eventos para a conta dos planos (`fator` de `f1-pneus-ritmo.js`). Em Jeddah: sem plano, macio com paradas na 2, 4 e 7; com seguro e calor, macio com paradas na 3 e 6, ou só uma, de duro.
