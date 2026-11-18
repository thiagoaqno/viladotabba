# TabbaTracks: acabamentos (texturas e materiais)

Pedido do Thiago (imagem de referência "Wall finishes"): mais texturas e poder trocar a textura e o material das construções que já existem.

- `public/corrida/acabamentos.js`: 31 texturas feitas em código (concretos, rebocos, pedras, tijolos, granito, mármore, ardósia, azulejo, pastilha, madeiras, metal, chapas, vidro, telha, asfalto, listrado, treliça, hera...), com rugosidade e metal próprios. A textura é projetada pela face, em metros (não depende do UV do modelo).
- Propriedades do TabbaTracks: seção **Acabamento** para peças da pista e itens. Grade de miniaturas, a escolhida com descrição, variações de cor + cor livre, rugosidade, metal, repetição e "Aplicar em" (todos os materiais ou um só, por exemplo a parede e não a janela).
- Guardado em `acab` no item ou no ajuste da peça (`cenario/<pista>.json`); o jogo aplica ao montar o cenário. "Voltar ao original" tira.
