# Contratos de verdade: valores e exigências por equipe, propostas no meio do ano, demissões

Pedido do Thiago (2026-11-21): "rever os contratos para ter opções mais vantajosas e receber realmente oportunidades de outras equipes; o salário e os requisitos têm que ser diferentes; tem que rolar demissões (até minha)". Tudo no caixa da equipe, sem caixa do piloto (pedido dele). O dano acumulado entre GPs foi feito e tirado a pedido dele. Não foi jogado: conferido com `node --check` e com carreiras simuladas na memória.

## Contratos (`temporada/regras.js`)
- **Verba por GP de cada equipe** (`verbaBase`): da mais rica à mais pobre, de 9 a 4 milhões. A carreira nova começa com a verba da equipe escolhida (era 6 para todas).
- **Propostas** com a verba da equipe nova mais um extra pela sua posição no campeonato (top 3 +3, top 6 +2, top 10 +1, até 14), o bônus por vitória e as **exigências** (as metas da equipe nova: top X no campeonato e nos GPs).
- **Do meio do ano em diante**, quem anda no top 10 recebe sondagem das equipes mais fortes. Assinar antes do último GP é um **pré-contrato**: vale na virada do ano, e a diretoria atual perde 6 de confiança. Nas 2 últimas etapas vêm todas as propostas, como antes.
- **Renovar** com a confiança em 50 ou mais sobe a verba em 1 milhão; em 70 ou mais, em 2 (era +1 só com 70).

## Demissões
- **No meio do ano** (`demissaoNoMeio`): a partir do 3º GP do ano, com 2 ou mais GPs na equipe, os 3 últimos GPs fora da meta e a confiança abaixo de 35, a diretoria demite. Você vai para uma das 3 equipes mais fracas, escolhida pela semente, e o ano segue de lá, com notícia na Central.
  - Simulado: Ferrari em 18º em todo GP, demitido no GP 4 para a Alpine.
  - Alternando 4º e 18º, fica.
- **No fim do contrato**: com a confiança abaixo de 30 e sem contrato para o ano seguinte, a equipe não renova, e você vai para a mais fraca que fez proposta. Antes, o contrato seguia sozinho.
- A confiança agora conta só os GPs da equipe de agora: trocou de equipe, a conta e a diretoria do Paddock recomeçam.

## Tela (`central-contrato.js`, `sede.js`)
- As propostas mostram as exigências e avisam da sondagem antecipada. O botão vira "Assinar pré-contrato" antes do último GP.
- Os termos do contrato mostram o pré-contrato assinado.

## Vozes
- Os 68 mp3 das falas de #874 (eventos, pista comprida ou curta, as variações), gerados pelo Thiago com o `Falas novas da Corrida.bat`, entram com `git add -f`.
- Faltam 12, as dos planos novos de #875 (`riscolargada`, `riscofinal`, `riscopneu`): é rodar o atalho de novo.
