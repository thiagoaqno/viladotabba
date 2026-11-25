# Controle no celular também no site

O Thiago pediu para levar o controle pelo celular para o site.

Até aqui, ele só existia no programa de PC: o celular falava com o PC pela rede de casa, com o HTTPS da porta 31518 (`corrida-controle.js`). No site não existe essa rede, então o celular e o jogo passam a se juntar pelo servidor do site, com um código.

## O servidor (`corrida-controle-site.js`, novo; ligado em `server.js`)

- **O canal:** é o `/controle-par`, com os mesmos eventos do controle de casa. O celular manda `e` (a entrada, até 60 por segundo) e `acao`; o jogo manda `painel` e recebe `estado`.
- **O código:** o jogo pede ("abrir") e recebe um código de 5 letras e números, sem os que se confundem, e o endereço `https://<site>/c/<código>`. O código vale enquanto o jogo estiver ligado e mais 10 minutos depois que ele sai, para voltar à sala sem trocar. O jogo guarda o código e, ao reconectar, volta para ele.
- **Limite:** no máximo 3 celulares por jogo. Um código errado ou cheio é recusado com o motivo.
- **Endereços:** `/c/<código>` leva para a página do controle já com o código; `/c` abre a página para digitar o código.

## O jogo (`controle-celular.js`)

- No site, o botão "📱 Controle no celular" aparece na tela inicial, como no programa de PC.
- A janela mostra o endereço, o código grande em amarelo e o "ou abra <site>/c e digite o código". Sem o aviso de certificado do PC, que não existe no site.
- No programa de PC, tudo continua como era, pela rede de casa.

## O celular (`controle.html`)

- Fora da porta 31518, a página usa o canal do site.
- **Com o código no endereço:** conecta sozinha.
- **Sem o código:** a tela de começar pede o código.
- Os avisos dizem "conectado ao jogo", "código não encontrado: confira no jogo" ou "o jogo saiu".
- O site é HTTPS, então o iPhone entrega o giroscópio.

## Conferido

Num servidor de teste, uma página pediu o código como o jogo e outra abriu `/c/<código>` como o celular:
- o celular conectou ao jogo;
- o jogo viu 1 celular e recebeu 154 entradas em uns 2,5 s;
- um código inexistente mostra "código não encontrado".

Não testei num celular de verdade pela internet: a demora do caminho celular → site → jogo é a da conexão de cada um.

A novidade fica para depois do #974, que também escreve no topo do `novidades.json`.
