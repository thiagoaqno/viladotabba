# Williams (2026) pelo modelo 3D do FW47

A Williams refeita pelo modelo "F1 2025 Williams Racing FW47" do Sketchfab (o Thiago não achou o de 2026), olhado de lado, de cima (bico e asa dianteira), de trás e por baixo da asa traseira. A FW48 de antes era inventada.

- **Cores:** azul-royal vivo (`#1d3fc4`), escurecendo para trás; a barriga azul-marinho subindo para trás, com dois frisos azul-claro; as placas da asa dianteira e a asa dianteira azul-marinho.
- **De lado:** Stephens no bico, MYPROTEIN com o triângulo vermelho, Kraken, ATLASSIAN no alto da caixa, KOMATSU grande, o redondo da Gulf, KEEPER embaixo, DURACELL na entrada de ar, o "bw SCORES" na placa da asa dianteira, KOMATSU e twilio na placa traseira.
- **De cima:** ATLASSIAN e MYPROTEIN na asa dianteira, ATLASSIAN ao longo do alto das caixas, e no bico a fileira com o W da Williams, Pirelli, VAST, twilio, bw, KOMATSU, a Gulf, o A do Atlassian e o Santander.
- **Embaixo da asa traseira** (`ASA_BAIXO`) e na vista de trás: a faixa roxa do Kraken com o logo branco, no azul-marinho.
- Marcas novas em `f1-marcas.js`: `stephens`, `myprotein`, `kraken`, `twilio`, `vast`, `bwscores`, `williamsw`, `atlassiana`.

**Saiu do #735 (Aston), que saiu do #734 (Cadillac) e do #733 (Audi, que conserta o `novidades.json`):** merge na ordem #733, #734, #735, este.

**Peso:** zero a mais (a folha projetada de 2026, um canvas por equipe, só desenho).

Conferido só com `node --check` (`f1-pintura.js`, `f1-marcas.js`) e o `JSON.parse` do `novidades.json`. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
