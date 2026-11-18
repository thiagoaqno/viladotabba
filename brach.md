# Livery Studio: logos reais, logos da equipe editáveis, vinis, carro do zero e painéis ajustáveis

Pedidos do Thiago (2026-11-18):
- **Logos reais** (`ferramentas/baixar-logos-marcas.js` → `public/corrida/logos/marcas/`, SVG do Wikimedia Commons): o `desenharMarca`
  (`f1-marcas.js`) desenha o logo de verdade quando existe (no carro, halo, capacete, placas) e a imitação em código quando não.
  A gaveta Patrocinadores do estúdio mostra todas as marcas, com o logo real em cores.
- **Os logos da equipe viram camadas** (`✂ Separar os logos da equipe`): a pintura da equipe é refeita sem as marcas (`separarMarcas`,
  gravando as chamadas de `marca`/`marcaU`) e cada uma vira uma camada de logo para mover, trocar ou apagar.
- **Menos desfoque:** a folha do estúdio em 2× (como a do carro do jogador no jogo) e anisotropia 16.
- **Logo em qualquer lugar pintado:** laterais, em cima, frente, traseira e **embaixo da asa traseira** (a vista U).
- **Vinis:** camada "Vinil (padrão)": quadradinhos espalhados, camuflagem, pontos, listras, xadrez e hexágonos, com tamanho, densidade,
  giro, sortear e "sumir ao longo do carro".
- **✚ Do zero:** um carro só com a cor de fundo.
- **Painéis ajustáveis** no Livery Studio (os dois lados e a gaveta) e no TabbaTracks (os dois lados): arraste a borda; duplo clique volta.

**Logos:** 104 reais baixados. Sem logo real ainda (ficam com o desenho em código; dá para importar o PNG no estúdio ou pôr o título
certo do Commons em `FIXOS` no script e rodar com o id): UniCredit, Peroni, Ambipar, Hyatt, bp, Jim Beam, NexGen, Kraken, AlphaTauri,
Syntium, Allwyn, Moët Hennessy, Fever, Fanatec, Rokt, ONEflight, Myprotein, Proforce, bw Scores, e as que a busca trouxe errado e eu tirei:
BingX, Genesys, Hilton, Dell, TWG, Eni, Orlen, Alfa Romeo, Salesforce, Crypto.com, PwC, Puma, FanDuel, Nexo, Visit Qatar, Komatsu,
Stephens, Pirelli.
