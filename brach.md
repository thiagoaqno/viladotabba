# Controle no celular, replay 3D na carreira e o log que diz o que travou

Pedidos do Thiago de 2026-11-21, depois de jogar Bahrein na carreira.

## Controle no celular (item 4 da lista)
- **Como funciona, sem internet:** o celular e o PC na mesma rede Wi-Fi. Vale o roteador de casa sem internet, ou o PC ligado no hotspot do iPhone.
  - O programa de PC abre um segundo servidor, em HTTPS, na porta 31518 (`corrida-controle.js`), só quando alguém aperta **📱 Controle no celular** no canto do menu.
  - O celular abre `https://<IP do PC>:31518/c` no Safari. A janela do botão mostra o endereço.
- **Por que não Bluetooth nem Wi-Fi Direct:** o Safari do iPhone não dá nenhum dos dois para uma página, e um app de iPhone precisaria da loja da Apple.
- **Por que HTTPS:** o iPhone só entrega o giroscópio a página segura.
  - O certificado é gerado no próprio PC: RSA 2048, SHA-256, os IPs do PC no nome alternativo e o uso "servidor TLS" que o iOS exige, válido por 800 dias. Fica guardado ao lado do banco.
  - Na primeira vez, o Safari avisa "Esta conexão não é privada" (Mostrar Detalhes → visitar este site).
  - Se o IP do PC mudar, o certificado é refeito.
  - Conferido no Node e no OpenSSL: os nomes alternativos, o uso do servidor e a conexão HTTPS abrindo.
- **No celular (`controle.html`, deitado):**
  - o volante pelo giroscópio: o giro no plano da tela, com o **CAL** para zerar o centro, o giro para virar tudo de 20° a 90° e a opção de inverter o lado;
  - sem giroscópio, vira arrastando o dedo no meio;
  - o freio à esquerda e o acelerador à direita, com a força pela altura do dedo;
  - os botões ERS e OLHAR (segurar), BOX, RÁDIO, MFD, CÂMERA, PISTA (voltar à pista) e MARCHA − e +;
  - o painel com a marcha, a velocidade, o giro, a volta, a posição, o ERS e o pneu, na cor da equipe;
  - a tela não apaga (Wake Lock).
- **No jogo (`controle-celular.js`):** o celular entra como um controle (`celular` em `controles.js`). Ele fala com o servidor do PC pelo canal `/controle`, sempre o local, mesmo com o jogo online.
  - O site não abre porta nenhuma: o módulo só liga no programa de PC (ou com `CONTROLE=1`).
- **Testado no Node** (servidor de teste, um jogo e um celular falsos):
  - as 274 entradas mandadas chegaram as 274 no jogo;
  - o botão de ação e o painel de volta chegaram;
  - `/c` leva à página do celular.
- **O que não tem:**
  - **o pedal é liga/desliga** (acima de 30%): a física e o protocolo só têm acelerador e freio inteiros, como no teclado;
  - **o DRS ficou de fora:** ele é automático no jogo.

## Replay 3D
- **Ficava carregando para sempre:** a tela "preparando a corrida" da página do jogo (`#preparoCorrida`) só sai quando o jogo conecta, e no replay o socket não conecta de propósito. Ela ficava por cima do replay já pronto. Achado no navegador; agora ela sai.
- **O replay pausava no primeiro quadro** (a conta de "chegou no começo" valia também tocando para a frente).
- **As câmeras de dentro do carro** (cockpit, T-cam e bico) inclinam a cabeça com o volante e sobem com a inclinação do carro. No replay o carro seguido não passava nada disso, a conta dava NaN e a câmera sumia. Agora passa, e conferi que a câmera fica num lugar de verdade nos três modos.
- **No menu da carreira:** a aba **Replay 3D** da Central, com os GPs da temporada e o botão "Assistir em 3D" (`analise-salva.js abrir3dSalvo`). Cada carreira guarda os 30 replays mais recentes; o GP sem replay diz que não tem.

## Travadas: o log agora diz o que travou
- O `servidor.log` do Thiago mostrou o servidor parado 2,5 s no pós-corrida da carreira e 839 ms abrindo o qualify, mas não o que causou.
  - O registro do resultado e o aprender dos robôs, medidos com o save dele, levam pouco: 113 ms o aprender em Bahrein.
  - Agora, no programa de PC, o perfil da CPU roda em janelas de 10 s. Na janela em que o laço travar mais de 400 ms, as funções que mais gastaram vão para o log numa linha. Testado com uma travada de 700 ms: a função culpada saiu na linha.
- **O quadro do navegador ia para o log cortado em 250 ms:** uma travada de 3 s aparecia como 250. Agora vai o tempo de verdade.
- **No pós-corrida, a corrida atrás do painel do resultado** (escurecida) era desenhada inteira a cada quadro, junto com a análise e a miniatura 3D: o log mostrava quadros de 76 a 250 ms o tempo todo. Agora ela é desenhada a 10 quadros por segundo enquanto a tela do resultado está aberta.

## Robôs presos atrás de carro lento (medido, não mexido neste PR)
- Bahrein, nível 100, 21 robôs, 4 sementes, voltas 2 e 3 (antes do box): média de 51,3 s no pelotão, contra ~46 s de um robô sozinho, e 132 batidas fortes.
- O freio de trânsito segura cada robô de 45 a 166 s numa corrida de ~300 s.
- Testei três ajustes no freio de trânsito, e nenhum resolve:
  - o freio no máximo: 52,0 s e 184 fortes;
  - sem prever a freada do da frente: 52,3 s e 160 fortes;
  - metade da folga atrás: 50,8 s e 124 fortes.
- O que pesa são as batidas, que deixam o carro avariado. Vai num PR próprio.

## Também
- `novidades.json` da main estava quebrado: o merge do #868 com o #869 comeu o fechamento de uma entrada. Consertado (conferido com `JSON.parse`).
- `CLAUDE.md`: a junção do `node_modules` aponta para `klk\luz-estourada` (o `klk\robos-pedal` sumiu).

Não foi testado jogando, nem com um iPhone de verdade (regra do projeto: só `node --check`, mais os testes de Node descritos acima).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
