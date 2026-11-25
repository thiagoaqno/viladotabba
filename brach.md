# Tiro da Galera (fase 2): o online pelo nosso servidor

Antes, o online do tiro novo ligava os navegadores direto um no outro, pelo servidor público do PeerJS. Agora tudo passa
por um relé no nosso servidor: funciona em qualquer rede (inclusive a 4G e a do trabalho) e ninguém vê o IP de ninguém.

## Como funciona

- **`servidor/jogos/tiro-rele.js`** é um relé WebSocket que fala o protocolo que o jogo deles já tem (`src/09d-netrelay.js`):
  - quem cria o salão roda a partida no navegador e vira o host;
  - os outros entram pelo código, e o relé só repassa as mensagens.
- **Endereços:** `ws /tiro/rele/room/<código>` e `GET /tiro/rele/salons`, a lista de salões públicos que o jogo mostra.
- **O que ele cuida:**
  - expulsão e banimento por IP dentro do salão;
  - salão cheio (até 18 jogadores);
  - host que caiu e voltou (o salão espera 20 s por ele);
  - conexões mortas, que somem em até 60 s.
- **Na página do jogo,** o `ferramentas/tiro-frontline.js` tira o PeerJS e aponta o jogo para o relé (`window.NET_RELAY_URL`).
  Sem o PeerJS, o jogo manda tudo pelo relé sozinho.

## Conferido

Rodei um servidor local com um host e um convidado de mentira. As 13 checagens passaram: salão inexistente, mensagens nos
dois sentidos, lista pública, outro host recusado, queda e volta do host, banimento.

## Atenção na VPS

Se o proxy da frente só deixa passar WebSocket em `/socket.io/`, ele precisa deixar passar também em `/tiro/rele/`.
Pelo Cloudflare direto, já passa.
