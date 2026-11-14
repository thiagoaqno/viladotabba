# Notícias da carreira: fotos da internet com reserva local, e mais tipos de notícia

O Thiago pediu fotos da internet nas notícias, com fotos de reserva, e mais variedade de notícias.

## Fotos

- **`ferramentas/fotos-noticias.js` (novo):** pega na Wikipédia (em inglês) a foto principal do artigo de cada piloto do grid de 2026 e do carro de 2025 de cada equipe, só as de licença livre (`pilicense=free`, Wikimedia Commons), com o autor e a licença.
  - Grava `public/corrida/temporada/fotos-noticias.js`: 22 pilotos e 10 equipes. A Cadillac não tem foto livre do carro e usa a reserva.
  - Imprime o artigo e o arquivo de cada um para conferir. Três buscas tinham caído no pai do piloto (Hamilton, Verstappen, Sainz) e estão corrigidas em `FIXOS`.
  - Espera e tenta de novo quando a API limita o ritmo (429) ou a rede cai.
- **As imagens não entram no jogo:** o navegador carrega a miniatura de 900 px da Wikimedia na hora, e o crédito ("Foto: autor · licença · Wikimedia Commons") vai no pé do cartão.
- **Reserva:** se a foto não carregar (sem internet ou link fora do ar), o cartão troca para a foto local do GP (`gp-fotos/`) e tira o crédito; sem ela, fica com as cores da equipe.
- **Quem ganha foto:** o Campeonato (o líder ou o seu carro), o Rival e os stories novos.

## Notícias novas (`stories.js` e `stories-textos.js`)

Todas saem dos dados que o jogo grava (o resultado e a análise de cada GP):

- **Destaque do GP:** quem mais ultrapassou, se fez 3 ou mais; senão, quem mais ganhou posições, se foram 4 ou mais.
- **Volta mais rápida:** com o tempo e a volta, e um texto próprio quando é sua.
- **Box mais rápido:** o menor tempo no box medido no servidor.
- **Corrida caótica:** 3 ou mais abandonos.
- **Duelo na equipe:** quantas vezes você e o companheiro chegaram um na frente do outro na temporada.
- **Sequência:** pódios seguidos (2 ou mais) ou GPs seguidos nos pontos (3 ou mais).
- **Construtores:** a sua equipe na tabela, com um texto próprio para quando lidera.

São 24 situações (eram 11) e 2420 combinações de título e texto (eram 1050), cada nova com os seus layouts. O fechar do story virou SVG.

Entrada no topo de `novidades.json`. Conferido com `node --check` e `JSON.parse`; os textos novos foram sorteados uma vez à mão, sem teste novo. O teste jogando fica com o Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
