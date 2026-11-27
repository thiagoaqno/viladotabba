# Tiro: modo tablet também no render (barcos longe somem)

No Mi Pad, o "render" (o Chrome entregando os desenhos para a placa) leva uns 4 ms por quadro, mais da metade do tempo. Os 120 fps pedem no máximo 8,3 ms por quadro.

**Medido no navegador, no Embruns** (o mapa que ele joga), por passada de desenho: uns 44 desenhos do mapa, 29 dos soldados (já no modelo simples), 22 dos barcos que boiam em volta (cada um em 4 a 5 partes), 19 dos objetos repetidos e 16 da arma na mão.

**O que mudou:** no modo tablet, os barcos e o que boia (`floatAdd`) a mais de 60 m da câmera somem; a névoa já quase os apagava. A conta é feita junto com a dos detalhes do mapa, a cada 4 quadros. Fora do modo tablet, nada muda.

**Conferido no navegador:** no Embruns, os desenhos por quadro caíram de 231 para 174 (-25%), com 2 dos 14 barcos visíveis de perto.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
