# Jeff: de volta ao tempo de ouvir de antes

Pedido do Thiago: com 1 s de silêncio (#729) o Jeff não entendia mais. Volta ao de antes de #729 (o que ele sentia como uns 4 s):

- `SILENCIO_MS` 1000 → **3000**: ele para de ouvir depois de 3 s sem fala (com 1 s, uma pausa no meio da frase já fechava);
- `ESPERA_MS` 500 → **2500**: depois de parar, espera até 2,5 s pelo texto final do navegador (com 0,5 s ele desistia antes e ficava só com o pedaço parcial).

Conferido só com `node --check` e o `JSON.parse` do `novidades.json`. O teste falando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
