# Carreira: a montagem antiga acima do orçamento destrava, a carreira do programa de PC sobe para o site (o código vale no navegador) a cor livre do capacete não fecha mais e o que um jogador muda não atrapalha os outros

Dois problemas que o Thiago achou depois do #756 e do #757.

## "Não consigo mais mexer no meu carro na minha carreira existente"

O custo novo dos níveis altos (#756: o 6º e o 7º custam 2 pontos, o 8º custa 3) deixou as montagens antigas acima do orçamento. O servidor conferia o orçamento em toda mudança e recusava até tirar um nível, então o carro ficava preso.

- **A regra** (`f1-equipes.js validar`, com a montagem de agora em `anterior`): uma montagem acima do orçamento pode mudar para uma mais barata. Dá para tirar níveis (ou zerar) até caber; pôr nível continua recusado.
- **Onde vale:** a carreira (`regras.js aplicarMontagem`, por `f1-pecas.js resolver`) e a tela de ajustes entre as sessões da classificação (`corrida.js montagemGrid`).
- **Na lista das peças**, acima do orçamento, aparece "N pontos acima do orçamento: tire níveis até caber" no lugar dos pontos livres negativos.

## "Minha carreira no aplicativo tem um código que não consigo usar no navegador"

O programa de PC trazia a carreira do site na primeira vez (`trazerCarreiraDoSite`), mas nunca a levava de volta. A carreira criada ou jogada no PC só existia no banco do PC, e o código de recuperação que o programa mostra só valia lá.

- **No programa:** cada vez que a carreira solo muda, o save sobe para o site com o hash do código de recuperação do PC (`corrida-pc.js enviarCarreiraAoSite`). O hash vai, nunca o código. As mudanças são: abrir, criar, decidir algo, mexer no carro e fechar um GP. Sem internet, sobe na próxima mudança.
- **No site** (`/api/corrida/pc/carreira-enviar`, `bd.js receberTemporadaDoPC`):
  - acha a carreira pelo código (ela pode ter ganhado outro token numa recuperação) ou pelo token;
  - se não existe, cria com os dois hashes, e o código que o programa mostra passa a abrir a carreira no navegador;
  - o save só é trocado se o que chega não está atrás (o ano e o GP), e o código que o site já tinha fica como está.
- **Para a carreira que já existe no PC:** basta abrir o programa atualizado. Ao abrir a carreira, ela sobe, e o código do programa passa a valer em "Recuperar" no site.
- **O que não sobe:** os replays dos GPs jogados no PC ficam no PC. No site, a aba Telemetria desses GPs avisa que não tem replay.

## A cor livre do capacete fechava no primeiro clique

No editor do capacete, o seletor de "outra cor" fechava logo depois do primeiro clique: cada mudança redesenhava o painel e trocava o campo de cor no meio da escolha. Agora (`capacete-editor-ui.js`), enquanto o seletor está aberto, só o capacete muda. O painel e as miniaturas se refazem quando o seletor fecha (o evento `change`).

## O que um jogador muda não atrapalha mais os outros

O Thiago: "tudo que redesenha para todos é ruim: fica atualizando pra todo mundo e ninguém consegue mexer".

- **A sala** (`menus.js trocar`, por onde passam todas as etapas): quando chega a mudança de outro jogador e você está mexendo num campo daquele trecho, o HTML novo espera. Vale para texto, número, seletor de cor, deslizante e lista de opções. Ele entra quando o foco sai do trecho. Os `<details>` abertos e a rolagem dentro do trecho também continuam como estavam depois da troca.
- **A tela entre as sessões da classificação** (`pos-quali.js`): a confirmação de outro jogador só muda o contador "N/M prontos". Antes a tela se refazia inteira.
- **O editor do capacete** (#755) e a carreira com os amigos (`grupo.js`, que já trocava só os nós que mudaram) já estavam assim.

## Conferido

`node --check` em tudo. No banco em memória, uma carreira criada, com o hash enviado ao "site" e aberta pelo código, voltou com o GP certo. Uma montagem antiga com 8 de motor e 8 de aero aceitou tirar um nível e recusou pôr nível com "acima do orçamento". Nada foi testado jogando nem com o programa de PC de verdade.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
