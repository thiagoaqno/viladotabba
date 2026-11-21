# Todo piloto com o uniforme completo da equipe

Pedido do Thiago de 2026-11-21: "trabalhe nos uniformes das equipes: para todo piloto usar o uniforme completo".

## O que era
- O uniforme de verdade de cada equipe (`f1-uniformes.js`, `UNIFORMES`: a cor base, a faixa dos ombros, a do lado do tronco, as costas, a luva e as marcas) só aparecia no pódio e nos mecânicos do box.
- O piloto dentro do carro (`f1-piloto.js`) usava um macacão genérico: as duas cores da pintura do carro numa faixa simples, e a luva pela cor do carro.

## O que mudou
- **O piloto de todo carro** (o seu, os dos robôs e os dos amigos) veste o uniforme da equipe, o mesmo do pódio:
  - **tronco:** a base, as costas (quando diferem: a McLaren tem as costas em antracito), a faixa do lado, a faixa dos ombros, a marca do peito e a do cinto;
  - **braços:** a faixa do ombro e a marca do braço;
  - **antebraços:** o punho na cor da faixa;
  - **luvas:** a cor da luva da equipe, com o painel na cor da faixa.
- As folhas são feitas uma vez por equipe e divididas por todos os carros dela.
- `carros.js` passa a equipe da pintura para o piloto.
- **Sem equipe ("Sua cor"):** o macacão vai na cor do carro com a faixa branca ou preta, como no pódio. As luvas ficam como antes.
- O macacão genérico de antes (`traje`) saiu.

## Conferido no navegador (servidor de teste)
- **Ferrari:** a base `#c8101c` com o branco nos lados e nos ombros, e a luva vermelha.
- **McLaren:** papaia com o antracito.
- **"Sua cor":** a base na cor do carro com a faixa clara.
- A marca do peito sai desenhada na folha.

Não foi testado jogando, nem visto em imagem (regra do projeto: sem prints).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
