# Monza em escala real (feita pelo Kiro)

O Kiro fez Monza e começou Barcelona no mesmo branch, sem push. Este PR traz **só Monza**. Barcelona fica de fora: o traçado novo dela entraria no site com o cenário ainda no tamanho antigo.

- **Traçado real:** convertido da linha central real (bacinger/f1-circuits `it-1922`, por `ferramentas/circuitos-f1.js`). Antes era desenhado à mão.
- **Comprimento real:** `scale` 4,221 → 8,081. A volta mede 5 793 m, os do circuito.
- **Largura:** 58 u = 12 m. A largura de Monza não está publicada; 12 m é o mínimo da FIA (estimativa).
- **Relevo:** do EU-DEM (`pista-real.js it-1922 monza --dem eudem25m --raio 3 --meia 6`).
- **Cenário só de Monza:**
  - chão sólido no nível do asfalto (`kit/monza/chao.js`);
  - painéis, mastros e placas no chão (`kit/monza/ambiente.js`);
  - placas das curvas na escala (eram 21,7 × 10,8 m, agora 8,7 × 4,3 m);
  - `escala` e `escalaGente` em `gps/monza.js`.
- **Robôs e recordes:** a linha dos robôs foi refeita (4 635 pontos, o mesmo número da pista). A migração `047-monza-escala-real.sql` zera os recordes de Monza.
- **Carreira:** Monza entra em `PISTAS_TRABALHADAS`.
- **Ferramenta:** `ferramentas/medir-quebra.js`, que mede a quebra de inclinação.

Separado do branch do Kiro: os arquivos só de Monza vieram inteiros. Do `pistas.js` e do `corrida-linhas-f1.json` veio só a parte de Monza, e o bloco de Barcelona ficou como está na main. Os prints conferidos estão em `C:\Users\thiag\Downloads\lts\prints\monza\` (largada, Parabolica, vista geral e primeira pessoa). Os números completos estão na seção de Monza em `planos/escala-real.md`.

Só `node --check`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
