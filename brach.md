# Audi R26 (2026) pelo modelo 3D + conserta o novidades.json da main

A Audi de 2026 refeita pelo modelo "F1 2026 Audi R26 (Launch version)" do Sketchfab que o Thiago mandou, olhado de lado, de cima, de frente, de trás e por baixo da asa traseira (câmera posta pela API do visualizador, vistas retas).

- **Cores:** titânio (`#c4c8cc`) do bico até logo atrás da entrada de ar (s 2,33), grafite (`#2c3036`) dali para trás; a cunha laranja (`#e8401c`) na caixa lateral, alta no corte e afinando até a ponta em s 3,28, de lado e no alto das caixas; o painel preto embaixo da frente da caixa.
- **De lado:** Revolut grande em preto no titânio, Castrol, NEXO, ninjaOne (branco no painel preto), World of Hyatt na borda do cockpit, os anéis em vermelho e o bp na tampa grafite, visit QATAR na entrada de ar e grande nas placas da asa dianteira.
- **De cima:** asas de titânio com o Revolut nos dois lados, o R do Revolut na ponta do bico, as três faixas, os anéis vermelhos na frente do cockpit e ao longo da espinha, a cunha laranja no alto das caixas.
- **Atrás:** a asa de carbono com o Revolut prateado; a vista de trás com o laranja das caixas. **Embaixo da asa** (`ASA_BAIXO`): carbono com o Revolut prateado grande.
- O número do piloto em vermelho-laranja, como o 5 no bico do modelo.
- Marcas novas em `f1-marcas.js`: `castrol`, `hyatt`, `bp`, `revolutr`, `adidas`.

**Conserta o `novidades.json` da `main`:** o merge do #731 com o #732 juntou as duas entradas de cima sem fechar a primeira, e o JSON não abria. Conferido com `JSON.parse`.

**Peso:** zero a mais (a folha projetada de 2026, um canvas por equipe, só desenho).

Conferido só com `node --check` (`f1-pintura.js`, `f1-marcas.js`) e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
