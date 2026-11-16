# Carreira: as configurações de som dentro da Central (solo e com os amigos) e o carro antigo do grupo destravado

O Thiago: "a aba de configurações deve ficar dentro da carreira/sala em grupo também, não só no lobby da corrida, pra poder mudar o som".

## As configurações na Central (`temporada/config-carreira.js`, `central.js`, `central-abas.css`)

- **Onde fica:** um item novo, "Configurações · Som e volume", no menu da engrenagem da Central. Ele abre uma tela com o som do jogo ligado ou desligado, o volume geral, a voz do engenheiro e o mixer: motor, efeitos, ambiente, rádio do engenheiro, narrador e música. Vale na carreira solo e na carreira com os amigos, que usam a mesma Central.
- **Por que outra tela:** a tela Configurações do lobby (`configuracoes.js`) depende do jogo inteiro (o socket da corrida, as pistas, o relógio), que a página da carreira não carrega. Esta é leve e mexe nos mesmos valores guardados no navegador: `corrida:sound`, `corrida:volume`, `corrida:mixer` e `corrida:radio`.
- **Quando vale:**
  - **na hora:** a música (`MusicaCarreira`) e a voz do engenheiro (`Radio.silenciar`);
  - **na próxima corrida:** o resto, que é lido quando o jogo abre.
- **O que fica no lobby:** gráficos e controles continuam na engrenagem do menu da Corrida, e a tela avisa isso.

## O carro antigo da carreira em grupo

O conserto do #758 (a montagem acima do orçamento pode ficar mais barata) não chegava na carreira com os amigos: `grupo-regras.js` não passava a montagem de agora para a conferência. Agora passa. Esse commit tinha ido para o branch do #759 depois do merge e ficou de fora da `main`.

## Conferido

`node --check`. Print da tela aberta na Central, numa carreira de teste (`C:\Users\thiag\Downloads\lts\prints\config\`). Não testei se o volume mexido aqui chega à corrida jogando.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
