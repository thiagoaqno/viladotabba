# Gotas no carro com cara de água, não de bolha

O Thiago viu as gotas do #716 parecendo bolhas. Eram pontinhos redondos sempre virados para a câmera, com borda escura e brilho fixo. Agora (`gotas-carro.js`):

- **Deitadas na pintura:** cada gota é uma cúpula bem achatada (meia esfera com 30% da altura), orientada pela normal da superfície onde está. Visto de lado, fica rente ao carro, e não um disco olhando para a câmera.
- **Material de água:** o miolo é quase transparente e deixa ver a pintura. A borda reflete o céu (Fresnel, na cor da neblina, que a chuva já deixa cinza), e o sol faz um brilho pequeno e forte, na direção e na cor do sol da cena. A beirada escurece um pouco, como a refração de uma lente d'água.
- **Irregulares:** os raios vão de 2,5 a 11 mm (muitas pequenas, poucas grandes), algumas alongadas (até 1,7×) e cada uma girada de um jeito. São 900 gotas por carro, e as superfícies um pouco inclinadas também recebem (a normal só precisa apontar mais para cima que para o lado).
- **Acúmulo:** cada gota nasce pequena quando o nível da chuva passa do limiar dela e cresce até o tamanho dela, como água juntando. O nível continua subindo em ~30 s e descendo em ~90 s.
- Um `InstancedMesh` só no carro que a câmera segue. O material entra no aquecimento da chuva com o mesmo jeito (a amostra também é `InstancedMesh`), para não compilar na hora.
- Sem entrada no `novidades.json` neste PR: o arquivo está quebrado na `main` e o conserto está no #717. As gotas novas cabem na entrada do #716.
