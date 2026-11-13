# Guia: capacetes mais reais (para uma conversa nova)

Leia antes `docs/pinturas-uv.md`: a técnica de pintar no molde (UV) é a mesma.

## Como é hoje
- **`public/corrida/f1-piloto.js`:** o capacete é uma esfera deformada (`geometrias()`, `casco`), com a pintura numa folha de 512×256 (`materialDoCapacete`). A viseira é uma faixa da esfera, com material escuro (`VISEIRA(cor)`).
- **`public/corrida/f1-capacetes.js`:** os desenhos dos 22 pilotos de 2026 (`CAPACETES`) e o que vai na folha (`pintarFolha`: desenho, bandeira e nome).
- **`public/corrida/capacete-editor.js`:** o capacete de quem joga (`mods.capacete`), conferido pelo servidor em `corrida.js` (`limparCapacete`).
- **`podio-pilotos.js` e `mecanicos.js`:** também usam o `pintarFolha`.

## O que fazer (um PR por item)
1. **Modelo:** trocar a esfera pelo glTF de capacete que o Thiago mandar (licença CC BY; crédito em `LICENCA.txt`, como em `f1/2022/`). Comprimir com `npx --no-install @gltf-transform/cli optimize` (está no cache do npm). Manter o pivô do pescoço e a escala do capacete atual (centro ~0,683 m do chão).
2. **Viseira:** uma peça separada no formato do modelo, com `MeshPhysicalMaterial` de metal ~0,9 e rugosidade ~0,05, na cor da viseira (`VISEIRAS` em `f1-capacetes.js`). Por dentro, preta.
3. **Pintura no molde:** reaproveitar o pintor de `f1-uv.js` (mapa de posição e marcas postas no ponto) com as coordenadas do capacete. Primeiro levar o desenho de `pintarFolha` para o molde, depois a bandeira e o nome.
4. **Logos:** os PNG em `public/corrida/logos-carro/` (fundo branco vira transparente: o script está no outro guia).

## Cuidados
- O mesmo material não pode entrar duas vezes em `k.mats`, senão o `limitarBrilhoCarro` duplica o shader e a peça some.
- Conferir com prints de verdade (Chrome com a GPU). No pódio e no cockpit, o capacete aparece de perto.
- Só `node --check`. Uma novidade no topo de `public/corrida/novidades.json`. PR para a `main`; o merge é do Thiago.
