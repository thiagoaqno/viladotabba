# Eventos que saem da corrida, estratégia da equipe, planos novos, ERS no pneu e voltas perto de 10

Pedido do Thiago (2026-11-21). Não foi jogado: conferido com `node --check`, com uma carreira na memória e com o robô medido (`klk/medir/desgaste.js`).

## Eventos ligados à corrida (`paddock.js`)
- O servidor anota os toques de quem joga na carreira (`corrida.js anotarToque`: no muro, um a cada 2 s; em cada piloto, um por par a cada 3 s, com a culpa de `Contato.impactoDe`), e o resumo vai para a análise do GP (`corrida-temporada.js`, `analise.corrida`): toques, dano no fim, segundos de punição, stop-and-go, ultrapassagens feitas e sofridas, paradas.
- Oito acontecimentos saem disso, para o GP seguinte:
  - **conta da oficina** (dano 20%+ ou 4+ toques): conserto completo, que custa 1 milhão a cada 12% de dano, ou básico (−1,5% de aderência, −1% de potência);
  - **comissários** (2+ toques causados por você): aceitar 3 posições no grid, ou recorrer por 1 milhão (metade das vezes anula, senão 5 posições);
  - **o piloto em quem você mais bateu reclama**: pedir desculpas, ignorar ou provocar; provocar faz dele um rival neste GP (`regras.js`, rixa 3: ele aperta o ritmo perto de você);
  - **batida com o companheiro**: assumir, culpar ou ordem de equipe (a agressividade dele cai);
  - **corrida limpa**: os dados dão +1,5% de aderência;
  - **show de ultrapassagens** (6+): +2 milhões ou +8 de torcida;
  - **depois do abandono**: revisão completa por 2 milhões, ou rápida com −2% de potência;
  - **punições demais**: treinar no simulador ou reclamar dos comissários.
- Três acontecimentos por GP (eram dois). Os da corrida passam na frente no sorteio, depois os de #874.

## Estratégia de paradas da equipe
- Em todo GP, junto do plano do domingo: "Equilibrada" (o melhor plano da conta, `f1-pneus-ritmo.js`), "Agressiva" (uma parada a mais), "Conservadora" (uma a menos) ou "Sem plano". Nenhum plano sugerido deixa um stint passar do penhasco.
- O plano escolhido define o pneu da largada (`corrida.js abrirGP`). O MFD chama o box na volta dele, com o pneu dele (`estrategia-box.js`), menos na chuva.
- A página da carreira passou a carregar `f1-pneus-tabela.js` e `f1-pneus-ritmo.js`.

## Planos do domingo (`sim.js PLANO`)

| Plano | Potência | Aderência | Pneu | Dano nas batidas |
|---|---|---|---|---|
| Ataque total | +12% | +3% | +15% | +50% |
| Largada forte, no primeiro terço | +15% | +4% | +25% | |
| Largada forte, depois | −2% | −1% | −15% | |
| Guardar para o fim, até 60% | −3% | −1% | −25% | |
| Guardar para o fim, depois | +15% | +4% | +20% | |
| Esticar os pneus | +2% | | −40% | |
| Jogar seguro | −3% | −1,5% | −30% | −40% |

- O dano entra em `corrida-f1-direcao.js`.
- Cada plano tem uma fala nova do engenheiro na largada.

## ERS no pneu (`f1-regras.js gastarPneu`)
- Com o ERS ligado, o pneu gasta 15% mais e o alvo da temperatura sobe 0,04. Com ele desligado, gasta 15% menos.
- Sem a opção (as contas de vida), nada muda.
- Medido no robô de Bahrein. Com 1,3× e +0,12 de temperatura, o médio caiu de 3,69 para 3,07 voltas, forte demais. Com os números finais ficou macio 2,79 (era 2,80) e médio 3,85.

## Voltas
- `voltasDoGP` ajusta pela raiz do comprimento: com 10 voltas, todo o calendário fica entre 9 e 10.
- "Longa (~10 voltas)" é o padrão da carreira.

## Fora do código
- O atalho `Downloads\lts\Falas novas da Corrida.bat` roda o `FALAS-NOVAS-CORRIDA.bat` em `klk\falas`, uma pasta própria que se atualiza com a `main`.
