# Os engenheiros novos com até 3 variações de cada fala

O Thiago (2026-11-21): "só tenho 83.200 caracteres". Os três engenheiros novos de #895 custariam ~35,5 mil caracteres cada (106 mil no total).

- `ferramentas/radio-engenheiro.js --variacoes N`: só as N primeiras variações de cada fala. Os pedaços sem variação (nomes, voltas, distâncias) vão todos.
- `VOZES-ENGENHEIROS.bat`: gera com `--variacoes 3`, 468 falas e 17.125 caracteres por engenheiro (medido com `--estimar`). Os três dão ~51 mil.
- `radio.js`: com Marcos, Bia ou Rafa escolhido, o rádio sorteia só entre as 3 primeiras variações (`VARIACOES_ENG`). Com o Jeff, todas, como antes.
