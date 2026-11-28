# Tiro: no BR em dupla, quem cai rasteja e não pega nada

O Thiago viu que, caído, dava para sair correndo e pegar armas como se estivesse vivo.

**Agora, caído** (`ferramentas/tiro-br-dupla.js` e `tiro-br.js`):
- **rasteja**: anda a 30% do passo agachado (uns 1 m/s), **sem pular nem correr** (o Espaço e o Shift, o sprint do controle e o do tablet ficam desligados enquanto está caído);
- **não pega nada**: nem trocar arma no chão (E), nem munição ao passar por cima de uma arma, nem caixa de colete, de cura ou granada. O airdrop e as motos já não deixavam;
- os **robôs caídos** também não pegam arma nem saem correndo para a zona.

Continua como antes: caído não atira, não mira, não joga granada, e o parceiro levanta ele ficando perto 4 s sem atirar.

Conferido só com `node --check` (os arquivos e o script do jogo montado); não joguei.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
