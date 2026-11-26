# Tiro: corrimão nenhum colide

A pedido do Thiago, para os bots não enroscarem. Em `ferramentas/tiro-editor/pecas.js`, ficaram só com o desenho (sem colisão):
- **Guarda-corpos de cano** (`kcGuarda`): lajes e casas da favela e patamares das escadas externa e rolante do Aeroporto.
- **Corrimão do navio** (`kcNCorrimao`): perdeu a parede invisível e a colisão dos postes.
- **Corrimão de convés** (`kcNCorrimaoConves`): postes, cano e vidro.
- **Guarda-corpos dos salões e pontes do navio** (`kcNGuardArq`).

Os corrimãos das passarelas e das escadas já não colidiam.

Por causa disso, agora dá para cair da laje pela beira, onde antes o corrimão segurava.

Conferido no navegador: as peças montam sem erro e a Favela carrega.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
