# Jeff: o tempo para falar cai para 2,5 s

Pedido do Thiago: o comando de voz demorava uns 4 s para fechar depois da fala; agora são 2,5 s.

Em `public/corrida/voz.js`, o Jeff fechava depois de 3 s sem fala (`SILENCIO_MS`) e ainda esperava até 2,5 s pelo resultado final do navegador antes de desistir. Agora:
- `SILENCIO_MS` 3000 → **2000**: 2 s de silêncio e ele para de ouvir;
- a espera pelo resultado final (`ESPERA_MS`, antes 2500 fixo no código) → **500**: depois disso, ele entrega o que já entendeu.

No máximo 2,5 s entre a última palavra e a resposta. O limite de 12 s de escuta continua.

Conferido só com `node --check` e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
