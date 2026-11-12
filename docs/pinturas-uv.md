# Guia: pinturas na textura (UV) dos carros 2023–2025

Uma equipe e um ano por PR. A Alpine 2023 (`alpine@2023`) é o exemplo pronto.

## Onde fica cada coisa
- `public/corrida/f1-uv.js`: o pintor (não precisa mexer). Ele monta um **mapa de posição** do molde (cada pixel sabe o ponto do carro), pinta as cores de base pela função da equipe e põe as marcas no ponto do carro, seguindo a peça.
- `public/corrida/f1-uv-equipes.js`: **as pinturas**. Cada uma é `DESENHOS_UV["equipe@ano"] = { cor, marcas, numero }`. Copie a da Alpine.
- `public/corrida/logos-carro/`: os PNG dos logos (fundo transparente; a versão `-branco` para fundo escuro). Os que o Thiago manda ficam em `klk/logos-thiago/`; para recortar, veja o script em Python mais abaixo.
- Os ids das equipes (são os da "linhagem"): `red-bull mercedes ferrari mclaren aston-martin alpine williams racing-bulls (AlphaTauri/RB) audi (Alfa Romeo/Sauber) haas`.
- Sem pintura UV, a equipe usa a pintura projetada antiga (`f1-pintura.js`, `equipe@ano`). Ela continua valendo como reserva.

## Medidas do carro 2022 (metros; `s` desde o bico, `y` altura, `x` lado)
- **Bico:** s 0,2..1,6, subindo de y 0,2 a 0,55.
- **Cockpit:** s 1,7..2,35. O halo fica em y > 0,72.
- **Caixa lateral:** s 2,0..3,4. A face de lado fica em y 0,12..0,45 e é **cavada para baixo**: a normal aponta para fora e para baixo (n.y até −0,8).
- **Tampa do motor:** s 2,4..3,7, com o topo no meio em |x| < 0,3.
- **Asa dianteira:** s < 0,8 (material `asas`); as placas das pontas ficam em |x| > 0,74.
- **Asa traseira:** s > 3,8 (`asas`); as placas ficam em |x| > 0,42 com |n.x| > 0,5.

## A pintura (`cor(p, n, qual)`)
- `qual` é `"livery"` (o corpo) ou `"asas"`. Devolve uma cor `#rrggbb`; para degradê, use `mistura(c1, c2, f)`.
- Ordem das regras na Alpine: primeiro a faixa de lado, depois o "por baixo" (preto), depois o azul de cima, e por fim a cor de fundo.

## As marcas (`marcas`)
- Cada item: `{ plano, a, b, larg, giro, qual, o }`.
- **`plano`:**
  - `"lado"`: a = s, b = y. Sem `lado` definido, `dosDoisLados()` duplica para os dois lados.
  - `"topo"`: a = s, b = x. Com `giro: 90` o texto corre ao longo do carro; com `giro: 180`, quem vem de frente lê.
  - `"tras"`: a = x, b = y.
- **`o`** (o que desenhar):
  - `{ img: L("bwt") }`: um PNG de `logos-carro/`;
  - `{ marca: "pirelli", tinta, proporcao }`: uma das marcas de `f1-marcas.js`;
  - `{ texto, cor, peso, esp }`: texto;
  - `{ fn(ctx, larg) }`: um desenho próprio, em metros e centrado na origem.
- **`numero`:** onde vai o número do piloto (o texto em itálico, na cor pedida).

## Como conferir (com prints, a GPU de verdade)
1. Rode o servidor: `PORT=3394 DB_PATH=:memory: node server.js`.
2. Tire os prints da vitrine com o script `prints-pinturas.js` (está no scratchpad desta sessão; dá para recriar). Ele cria a sala, põe o ano e a equipe, abre a etapa Carro e fotografa a vitrine `#vitrineCarro` em várias vistas, porque o carro gira.
3. Compare com as fotos da equipe: lateral dos dois lados, cima, frente, traseira e o cockpit de perto.

## Armadilhas que já custaram tempo
- **Corpo sumindo:** o material da pintura não pode entrar duas vezes em `k.mats`. Se entrar, o `limitarBrilhoCarro` é aplicado duas vezes e o shader quebra (já corrigido com `new Set`).
- **Material original:** o do modelo, com uma textura trocada, não aparece. Por isso a pintura usa um `MeshPhysicalMaterial` novo (rugosidade 0,22, com verniz).
- **Costuras do molde:** triângulos com UV que passa de 1 têm de ir inteiros para o quadrado 0..1. Com o módulo feito vértice por vértice, eles pintavam retângulos por cima de tudo (já corrigido).
- **Arquivo espelhado:** o arquivo 2022 vem espelhado e o `f1-2022.js` desfaz isso. Não mexa nos eixos.
- **Arquivos `.bat`:** nunca editar com `sed`, porque eles precisam ficar em CRLF.
- **Testes:** não crie nem rode testes; só `node --check` (os arquivos de `public/corrida/` são módulos: `node --input-type=module --check < arquivo.js`).
- **Novidades:** uma entrada nova no topo de `public/corrida/novidades.json` a cada PR.

## Recortar um logo que o Thiago mandou (fundo branco vira transparente)
```python
from PIL import Image
im = Image.open("klk/logos-thiago/x.png").convert("RGBA"); px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if r > 235 and g > 235 and b > 235: px[x, y] = (255, 255, 255, 0)
im.crop(im.getbbox()).save("public/corrida/logos-carro/x.png")
```
