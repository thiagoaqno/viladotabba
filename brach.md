# Tiro da Galera: som ambiente separado do céu (sem som de água na Favela)

- **O problema:** o mapa do editor pegava o som ambiente do mapa do céu. Com o céu `meltem` (vilarejo de beira-mar), a Favela ficava com o som das ondas o tempo todo.
- **Agora:**
  - campo novo `ambiente` no `.json` (o editor guarda ao salvar);
  - sem esse campo, um mapa sem mar nunca usa os sons de beira-mar (`amb_meltem`, `amb_embruns`): eles viram o de bairro (`amb_floreal`).
- **Favela:** continua com o céu `meltem`, com `"ambiente": "amb_floreal"` (o som que ela tinha com o céu `lotissement`).

Conferido no navegador: a Favela registra o céu do meltem e o som `amb_floreal`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
