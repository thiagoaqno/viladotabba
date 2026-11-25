# Tiro da Galera novo (fase 1): o Riposte: Frontline no lugar do tiro antigo

O Thiago pediu para trocar o tiro da Vila pelo Riposte: Frontline (github.com/BenDBSS/Riposte-Frontline-Source), um FPS completo
no navegador com código MIT.

## O que mudou

- **`/tiro/`** agora é o jogo novo, montado por `ferramentas/tiro-frontline.js` a partir da pasta `dist/` deles.
- **`/tiro-antigo/`** guarda o tiro de antes (ele continua usando o canal `/tiro` do servidor).
- Na Vila, o card do tiro ganhou a descrição nova.

## O que o script troca (o que não é MIT, pelo NOTICE.md deles)

- O nome vira **Tiro da Galera**, com um logo e um fundo de menu nossos. Ícones, capa, `deck/`, manifest e service worker ficam de fora.
- **Sem músicas:** as do menu, de subida de nível, de vitória e de derrota eram do Suno, só para uso não comercial.
- **Som de acerto:** um clique gerado pelo script, no lugar do sample do flashkit.
- **Contas desligadas:** a API de contas deles não existe aqui, e `/api/` é da Vila.
- **A CSP com hashes saiu,** porque os scripts mudaram.
- Os créditos e a licença MIT ficam em `public/tiro/CREDITOS.txt`.

## O que fica para depois

- **Fase 2:** o online pelo nosso servidor. Hoje o online liga navegador com navegador pelo PeerJS. O jogo já tem um modo de
  relé por WebSocket (`meta cod-relay`, rotas `/room/` e `/serveur/`) que dá para implementar no nosso servidor.
- **Fase 3:** as animações dos soldados ainda são as deles, feitas no Mixamo. Elas precisam ser refeitas pela nossa conta
  (`ferramentas/animacoes-mixamo.mjs`). O jogo abre em inglês ou francês; falta o português.
- Os testes do tiro antigo (`salas.spec.js`) foram apagados.
