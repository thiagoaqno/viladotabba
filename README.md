<p align="center">
  <img src="public/corrida/icone-256.png" width="110" alt="Corrida da Galera">
</p>

<h1 align="center">Vila da Galera</h1>

<p align="center"><b>Um site de jogos multiplayer para jogar com os amigos, feito do zero em JavaScript.</b><br>
O destaque é a <b>Corrida da Galera</b>, um jogo de Fórmula 1 em 3D no navegador.</p>

<p align="center">
  <a href="https://viladotabba.com/corrida/"><b>▶ Jogar a Corrida</b></a> ·
  <a href="https://viladotabba.com/"><b>A Vila da Galera</b></a> ·
  <a href="https://github.com/thiagoaqno/viladotabba/releases/download/programa-pc/CorridaDaGalera-Setup.exe"><b>⬇ Programa para Windows</b></a>
</p>

<p align="center"><img src="public/corrida/capa-carregamento.png" width="860" alt="A largada em Interlagos"></p>

## A ideia

Um único servidor Node.js serve o site e abre um canal de tempo real (Socket.io) para cada jogo. A sala vive no servidor, e ele é quem manda: guarda o estado da partida, valida as jogadas e reparte o resultado para todos os navegadores. Não tem etapa de build: o navegador recebe HTML, CSS e JavaScript puros.

Na **Corrida**, a física do carro de quem joga roda no servidor em passos fixos de 1/120 s, com a mesma física prevista no navegador, que se corrige aos poucos. Os 21 robôs do grid também pilotam no servidor. O mesmo servidor roda dentro do **programa para Windows**: jogando sozinho ou na carreira solo fica tudo no PC, sem ping, e as salas com os amigos e os recordes vão para o site.

## Os jogos

- **Corrida da Galera (F1 3D):** grid de 22 carros, as equipes e pilotos de 2023 a 2026, 25 GPs, carreira solo e com os amigos, classificação, pneus, box, chuva, ERS, DRS e safety car.
- **Futebol e esportes:** Carreira de Treinador (solo e online), Leilão de Times, Pelada 3D (futsal), Futevôlei, Tênis, Haxball e Futebol de Botão.
- **Jogos de mesa e de cartas:** Uno, Truco, Dominó, Sinuca, Ludo, Banco, Rumi e Bloqueio.
- **Outros:** Ginásio (batalhas de Galeramon), Tiro (arena), Batalha (balões de kart), Drag (racha), Cozinha, Palavra Proibida e Corrida de Digitação.
- **A Vila:** o lobby em mapinha que leva a cada jogo, e a Noite da Galera, que leva todo mundo de um jogo para outro e conta o placar da noite.

## Tecnologias

### Frontend
- **HTML, CSS e JavaScript puros** (módulos ES), sem framework e sem build.
- **Three.js** para o 3D (Corrida, Pelada, Futevôlei, Tiro e outros), com modelos **glTF/GLB**.
- **Web Audio** para motor, rádio e efeitos; **Gamepad API** para controle e volante (com força no volante nos Logitech).
- **PWA** (manifesto e instalação no celular); **marked** e **DOMPurify** para os textos em Markdown.

### Backend
- **Node.js 24** com **Express 5** (site e API) e **Socket.io 4** (tempo real, um canal por jogo).
- **SQLite** pelo `node:sqlite` nativo do Node, com migrações em SQL numeradas (`migracoes/`).
- **worker_threads** para os cálculos pesados (a linha de corrida de cada pista) sem travar as salas.
- **Docker** numa VPS, publicando a `main`.
- **GitHub Actions**: os testes da Corrida (`node --test`), uma checagem rápida a cada PR e a montagem do programa para Windows. Há também testes de ponta a ponta com **Playwright** (`npm run test:e2e`).
- **Programa para Windows:** um lançador em C# e o instalador do Inno Setup, que se atualiza baixando só os arquivos que mudaram.

### Linguagens

| Linguagem | Linhas | Onde |
|---|---:|---|
| JavaScript | ~181 mil | servidor, jogos no navegador, física, ferramentas e testes |
| HTML | ~9,9 mil | as páginas de cada jogo |
| CSS | ~8,8 mil | as interfaces |
| Python | ~700 | ferramentas de importar sprites e carros |
| SQL | ~400 | as migrações do banco |
| Batch e PowerShell | ~320 | os atalhos do Windows e a montagem do programa |
| C# | ~100 | o lançador do programa para Windows |

<sub>Medido com `git ls-files` em 24/11/2026: 6.187 arquivos e 1.987 commits desde 01/10/2026.</sub>

## Rodar no seu PC

Precisa do **[Node.js](https://nodejs.org/) 24** (ou 22.13 em diante).

```bash
git clone https://github.com/thiagoaqno/viladotabba.git
cd viladotabba
npm ci
npm start
```

Abra **http://localhost:3000/** (a Corrida fica em `/corrida/`). Variáveis úteis: `PORT` (3000) e `DB_PATH` (o banco SQLite; `:memory:` para um descartável). Testes: `npm test` (todos) ou `npm run test:corrida`.

## Como o código está organizado

| Onde | O quê |
|---|---|
| `server.js` | o Express e o Socket.io: serve o site e liga o canal de cada jogo |
| `<jogo>.js` (na raiz) | o servidor de cada jogo; a Corrida é `corrida*.js` |
| `public/<jogo>/` | o jogo no navegador |
| `bd.js` + `migracoes/` | o banco SQLite |
| `desktop/` | o programa para Windows |
| `tests/` | os testes (`node --test` e Playwright) |

O mapa detalhado está em [`CLAUDE.md`](CLAUDE.md), [`docs/mapa-f1.md`](docs/mapa-f1.md) e [`docs/mapa-completo.md`](docs/mapa-completo.md).

## Quem sou eu

Sou o **Thiago** ([@thiagoaqno](https://github.com/thiagoaqno)). Comecei a Vila da Galera para ter um lugar com os jogos que eu e meus amigos jogamos juntos, e ela foi crescendo até virar um jogo de F1 completo. Eu decido o que entra, testo jogando com a galera, e o código é escrito em parceria com IA (Claude Code).

---

<p align="center"><sub>Fórmula 1, F1 e os nomes das equipes e dos pilotos pertencem aos seus donos.</sub></p>
