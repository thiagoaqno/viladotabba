# Marcas de pneu reais e gotas em cima do carro

- **Marcas dos pneus (`marcas-pista.js`, novo):** uma textura RG na largura × volta inteira, nas mesmas coordenadas da máscara de água (`aguaUv`), que os carros riscam por onde passam (as duas rodas de trás, a ±8 u):
  - **R, borracha (seco):** o carro que vai de lado (mais de ~4° entre o rumo e a direção em que anda) ou freia além do que o pneu segura deixa a marca, e ela fica. A água tira a marca nova.
  - **G, traçado secando (molhado):** cada passagem tira um pouco de água por onde as rodas andam. A linha aparece aos poucos com o tráfego, a chuva forte molha tudo de novo (~1 min) e a pista seca zera a linha.
  - Tudo calculado no navegador, pelas posições desenhadas de cada carro (o meu e os outros). A textura sobe para a placa no máximo 4 vezes por segundo.
- **Asfalto (`agua-pista.js`):** lê `uMarcas`: a borracha escurece o asfalto sempre, e o traçado secando tira água no molhado. O rastro seco que andava colado atrás dos carros perto da câmera saiu (`rastro = 0` em `clima-visual.js`). A chave do programa vai para `agua-pista-3`.
- **Gotas em cima do carro (`gotas-carro.js`, novo):** gotinhas paradas nas superfícies viradas para cima do carro que a câmera segue (saem dos vértices do modelo, uma vez por modelo, sem rodas e sem piloto). Aparecem aos poucos enquanto chove (o nível sobe em ~30 s) e somem devagar quando para (~90 s). O material entra no aquecimento da chuva.
- **Gotas na tela (`clima-visual.js`):** só na câmera de cockpit (na de trás eram 40%: agora as gotas ficam no carro) e vão juntando aos poucos (~25 s), em vez de aparecerem de uma vez.
- Os números (o ângulo da derrapagem, a freada, os tempos) são palpites, não medidos: conferir jogando.
