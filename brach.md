# Carreira: a análise 3D dentro da aba Análise, no tema da Central, e as linhas estimadas nas posições

Pedido do Thiago depois do #745:
- o "Replay e análise 3D" deve ficar nas abas da própria aba Análise da Central, com Momentos como a análise principal;
- tudo no tema da carreira, botões incluídos;
- no gráfico das posições, as linhas de quem tomou volta devem ir até o fim, estimadas.

## O que mudou

- **Sub-abas da Análise** (`temporada/central-analise.js`): Momentos (a padrão), Posições, Ultrapassagens e Replay entram antes de Visão geral, Voltas, Estratégia e Telemetria. O botão "Replay e análise 3D" e a tela por cima da Central saíram.
- **Bloco vivo** (`temporada/central.js`, `pintar`): a Central redesenha mexendo só no que mudou, e isso apagaria o canvas 3D. Agora um elemento com `data-cx-vivo` fica intacto enquanto a marca for a mesma. A marca junta o GP, a sub-aba e o tema; com marca nova, o bloco é trocado inteiro, e `montar3d` (chamado por `ligarGraficos` depois de cada redesenho) monta de novo.
- **`analise-salva.js`**: `montarNaCentral` monta a análise no bloco, com o resumo do save, os nomes da carreira e o replay pedido pelo socket da carreira.
- **`resultado-analise.js`** ganhou o modo da Central:
  - sem o cabeçalho e as abas próprias (as da Central mandam);
  - clicar num piloto nas Posições só escolhe com quem comparar, sem pular para o Ritmo;
  - "Ver no replay" pede à Central para trocar a sub-aba. A janela da ultrapassagem fica guardada no módulo e o Replay abre nela.
- **Tema da carreira** (`pos-corrida.css`, `.ra-cx`): fundos, textos, filetes, sombras, dicas, rótulos da pista, painel de telemetria, listas e torre saem dos tokens da Central (`--cx-*`, claros ou escuros pela engrenagem) e da cor da equipe (`--eq`, `--eq-txt`, `--eq-at`).
  - Os botões (filtros, velocidades, Seguir, Mapa de calor, ▶) ficam no jeito da Central: filete, caixa alta e a cor da equipe quando ligados.
  - A fonte é a Manrope da Central.
  - A miniatura (`gp-miniatura.js`, `op.tema`) ganhou a base clara ou escura da carreira; a tela do resultado continua com a escura.
- **Posições estimadas:** quem terminou com voltas a menos (tomou volta) tem a linha pontilhada até a última volta, na posição final da classificação, e a dica diz "estimado: tomou volta". Quem abandonou ganha um ✕ onde parou. Vale também na tela do resultado.

Entrada no topo de `novidades.json`. Conferido só com `node --check` e `JSON.parse`. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
