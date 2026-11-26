# Tiro da Galera: grafite nas paredes (peça Grafite no editor)

Peça nova no editor de mapas: **Grafite (texto na parede)**, na aba Básico. Ela pinta um texto com spray em qualquer parede.

- **Painel:** texto (até 40 letras), estilo, cor e cor do contorno, e o tamanho (largura x altura).
- **Estilos:** Grafite gordo (letra gorda com contorno, sombra e brilho), Pixo reto, Escorrendo (com a tinta pingando) e Tag (assinatura rabiscada).
- **Como desenha:** o grafite é desenhado num canvas na hora. O `.json` guarda só o texto, o estilo e as cores, então o mapa continua leve.
- **No jogo:** o `mapa-json.js` põe o plano pintado no mapa. Ele não colide nem segura bala.
- **Guia:** `docs/tiro-editor-de-mapas.md` explica o campo `grafite`.

Conferido no navegador: os quatro estilos aparecem no editor e numa partida com bots.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
