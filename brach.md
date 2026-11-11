# Vila: a Paulista vira o Autódromo da Galera

## O que muda
A Vila deixa a Avenida Paulista e vira um autódromo de F1 visto de cima, no estilo das imagens de referência. O mapa ficou bem maior: de 96x60 para 178x134 casas. A câmera também ficou mais perto: o zoom sai de `w / 400`, `h / 270` (antes era 440 e 320).

- **A pista:** é um circuito fechado com reta principal, curvas com zebra vermelha e branca, brita, guard-rail, linha de chegada quadriculada, grid numerado e placas de patrocínio. Na pista só passam carros de F1: 11 carros nas cores das equipes, que freiam nas curvas e trocam de faixa para ultrapassar. Há quatro passarelas sobre a pista e um pórtico com as cinco luzes da largada.
- **Os prédios grandes:** a Corrida é o Autódromo, ao sul da reta, com a arquibancada coberta, o telão com o nome e a fachada de vidro. A Sede da Carreira e a Casa de Leilão são os dois pavilhões de hospitality do paddock, com o nome pintado no telhado.
- **Os 10 ginásios** (4 líderes e 6 treinadores) ficam nos 10 boxes, de frente para o pit lane. Cada box tem a cor do tipo, o número, o carro na garagem, os pneus empilhados e a vaga pintada no chão. Os líderes ficam na porta.
- **A Fan Zone**, ao norte, tem as tendas dos jogos de mesa, as quadras abertas (Pelada, Tênis, Futevôlei e Haxball), a roda-gigante, o painel de LED e os food trucks.
- **O paddock** tem o Ginásio com a grama alta na frente, o heliponto, o centro de mídia, a torre da direção de prova, o telão da estante, o centro médico, os caminhões das equipes e a praça com o logo no chão e um carro em exposição.
- **A leste**, depois da passarela, ficam os hangares do Drag, do Rocket, da Batalha e do Tiro. **Ao sul** ficam as arquibancadas, a torre dos recordes, o pódio e o estacionamento.
- O minimapa mostra o mapa inteiro com a pista desenhada.

## Arquivos
- `public/index.html`: o mapa (`LUGARES`, `TRACADO`/`PISTA`, enfeites), o desenho (estilos de prédio, pista, enfeites) e a vida (carros, gente, roda-gigante, rotor, luzes da largada).
- `vila.js`: `MW`/`MH` novos e o `SPAWN` no paddock.
- `public/vila/mato.js`: a grama alta saiu do Parque Trianon e foi para a frente do Ginásio (18x6 casas).
- `docs/mapa-completo.md`: a seção "Vila (o mapa)" descreve o autódromo.
- `tests/e2e/vila-layout.spec.js` foi apagado: ele testava a Paulista (calçada, ciclovia, MASP, tamanho 96x60, o início em 37,30).

## Conferido
- `node --check` no script da página e no `vila.js`.
- Um script montou o mapa com o mesmo código da página e conferiu: os 35 jogos têm caminho desde o início, nenhum prédio se sobrepõe a outro nem fica em cima da pista, e as frentes do telão, da torre e do pódio e as saídas das passarelas são alcançáveis.
- A página abriu no navegador sem erro no console. Os carros andam, e o paddock, os boxes, a Fan Zone, o Autódromo e a curva leste aparecem desenhados.
