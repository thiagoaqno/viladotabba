# Pneu em ruína: 20% de aderência, 60% de aceleração e 60% de velocidade, na física de sempre

Pedido do Thiago: quando o pneu passa do penhasco (desgaste acima de 0,8, a "ruína"), o carro trocava para a física intermediária (a do volante em ângulo de roda, `arcade: false`), estranha de pilotar. Agora:

- **Física:** continua a arcade, a mesma do pneu bom (`aderencia().arcade` é sempre verdadeiro com pneu).
- **Aderência:** 20% da que o pneu tinha no penhasco (`RUINA_GRIP = 0.2`, sobre o `grip` e o `rel`): ele escorrega de lado nas curvas.
- **Aceleração:** 60% (`RUINA_ACEL = 0.6`): a tração (`tracao`) e a potência (`potencia`, nova, lida por `dinamica.js`) caem a 60%. A tração sai da aderência de antes da ruína, não dos 20%.
- **Velocidade máxima:** 60% (`RUINA_FINAL = 0.6` no `final`): em `dinamica.js` o acelerador é cortado acima de 60% da velocidade final do carro (sem o cubo do `final` na potência, para a aceleração ficar nos 60%). O `final` também é o que a previsão do navegador (`fisica.js`) e os robôs (`corrida-robos.js`) já usam como teto.
- O freio fica como no penhasco (não foi pedido mudar).

**Testes antigos apagados** (só porque o comportamento pedido mudou, anotado em cada um): em `corrida-f1-pneus.test.js` o "depois dele despenca" (freio < 90% e final entre 90% e 97%); em `corrida-fisica.test.js` o "pneu novo vira mais" e o "macio acabado faz menos curva" (medidos pela guinada, que na arcade é a do volante) e o "desgaste 0,9 não é arcade".

Não subi o `PROTOCOLO`: um programa de PC velho joga no site normalmente; só a previsão do carro com o pneu em ruína fica diferente da do servidor até ele atualizar.

Conferido só com `node --check` (`f1-regras.js`, `dinamica.js` e os dois testes) e o `JSON.parse` do `novidades.json`. A suíte roda no CI; o teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
