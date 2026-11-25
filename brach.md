# MFD: a linha vermelha da aba ativa alinhada

O Thiago: "quando mudo de aba aquela linha vermelha fica torta".

A linha ficava 15 px abaixo do botão da aba (`bottom:-15px`), e a altura do botão dependia do ícone e da margem do grupo de abas: em cada aba ela caía numa altura e numa largura diferentes.

- As abas ocupam a altura toda do topo; a linha da ativa fica presa no pé dele (`bottom:0`), com 32 px de largura e centrada no ícone, igual em todas.
- O divisor entre a marca e as abas virou um traço fixo (`::before`), sem margem que empurre os botões.
- Abas com a mesma largura (até 40 px, encolhem em tela estreita) e o hover só acende o ícone (o fundo do hover ocupava a altura toda).
- A marca F centrada na altura do topo.

Conferido sem prints; o Thiago testa jogando.
# Qualify menos previsível

O Thiago: "hoje a segunda volta deles sempre é a melhor. não devia ser bem assim..."

## Por que a segunda volta sempre ganhava
- O robô saía do grid quase parado e a primeira passagem pela linha já abria a volta cronometrada: a primeira volta nunca podia ser a melhor.
- No qualify o `p.laps` não sobe. O teto de recarga do ERS é por volta (`F1.carregarErs`), então ele valia para a sessão inteira: depois da segunda volta a bateria secava. O sorteio do ritmo da volta (`ritmo:semente:id:volta`) também era o mesmo em todas as voltas.

## O que mudou
- `corrida-robos.js` `planoDaQuali`: cada robô sorteia um plano por sessão (Q1, Q2 e Q3 separados, pela semente):
  - `sempre` (25%): ataca toda volta com o ERS automático (como era);
  - `ja` (30%): ataca a primeira volta com a bateria cheia, faz uma volta lenta recarregando e ataca de novo;
  - `tarde` (25%): primeira volta de preparação, ataca na segunda;
  - `box` (20%): volta de preparação, entra no box no fim dela (mesmo composto, novo), volta de saída e ataca. Sem tempo para isso, vira `tarde`.
  - Volta de ataque: ERS todo nas retas (comando manual). Volta lenta: 90% do ritmo, sem ERS, lift and coast em toda freada.
  - Se a volta lenta não deixa tempo para outra antes da bandeira, ele ataca nela.
- `corrida-f1-classificacao.js` `aoSetor`: o robô faz a volta de saída inteira (a passagem logo depois do grid não abre a volta). Quem joga não muda.
- `corrida-robos-ritmo.js` `duracaoDaClassificacao`: uma volta a mais por sessão (`t * 3,2` em vez de `t * 2,2`; teto de 260 para 340 s).
- ERS e ritmo por volta no qualify contam pela volta da classificação (`qVoltas`), para os robôs e para quem joga (`corrida-humanos.js`).
- Robôs no qualify passam `amb.quali` para a física, como os humanos (o DRS fica fechado e o box funciona igual).

Conferido só com `node --check`; o Thiago testa jogando.
