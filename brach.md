# Classificação esperando a tela de carregamento e o capacete acetinado

O Thiago:
- "na tela de loading já está começando o qualify";
- "mesmo sozinho em sessão local os bots estão travando";
- "o capacete está muito reflexivo, coloca ele acetinado independente do material".

## O Q1 esperando quem ainda está carregando (`corrida-f1-classificacao.js`)

Antes, o Q1 esperava os humanos carregarem a pista por no máximo 40 s, contados desde o começo. Um PC que demora mais para preparar a pista (os modelos, a compilação dos gráficos) via o Q1 abrir com a tela de carregamento ainda na frente.

Agora:
- os 40 s só contam depois que o primeiro humano fica pronto, então ninguém segura os outros;
- antes disso, a espera vai até 3 minutos, para uma sala esquecida não ficar presa;
- sozinho, o Q1 abre quando o seu navegador termina de carregar.

**Os robôs travando:** não achei uma causa direta no código. A suspeita é a mesma do Q1: os robôs andando no servidor enquanto o navegador ainda compila a pista, o que dá trancos até a compilação acabar. Se continuar depois deste conserto, falta saber quando acontece (classificação ou corrida, no programa de PC ou no site).

## O capacete acetinado (`f1-capacetes.js acabamentoDoCasco`, `f1-piloto.js`)

- Todo casco sai acetinado: meio brilho, sem metal e sem furta-cor. Vale para o seu, o dos amigos e o dos robôs, na pista, no pódio, nos mecânicos e na prévia do editor.
- O acabamento escolhido no editor só muda a textura: a trama da fibra de carbono e os flocos continuam.

## Conferido

`node --check`. Nada foi testado jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
