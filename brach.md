# Direção antiga de volta como padrão (e nos robôs)

Os amigos do Thiago sentiram falta da direção de antes. Ela volta a ser o padrão:

- **Quem joga:** o padrão do painel de acerto (`ACERTO_PADRAO` em `volante.js`) passa a ser a direção antiga. A tecla dá o volante inteiro quase na hora (virada 1, subida e volta em 0,05 s), e quem segura a rampa é a física (5 por segundo, o batente em 0,2 s), como antes; o analógico usa a curva 1,4.
- **Quem já mexeu no painel P continua com os próprios valores**, porque eles ficam guardados no navegador (`corrida:acerto-direcao`). Para voltar ao padrão, é só apertar "Padrão" no P. O acerto do Thiago era virada 0,75, batente em 0,15 s, volta em 0,125 s e curva 1,4.
- **Robôs:** o teto do volante do piloto automático volta ao volante inteiro (`VIRADA_MAX = 1` em `sim.js`), para seguirem a mesma direção de quem joga. Medido em Mônaco, no médio, com 21 robôs e 2 voltas: todos completaram as 2 voltas, sem abandono, e as melhores voltas ficaram de 64,9 a 72,4 s. Com o teto de 0,75 tinham sido de 62,4 a 67,2 s: com o volante cheio eles corrigem mais e perdem um pouco.

Só `node --check` e a corrida no servidor.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
