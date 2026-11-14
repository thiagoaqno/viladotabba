# Pintura dos carros: sem logo repetido, menos emenda e o desenho embaixo da asa

Pelo print do Thiago (a Ferrari com o CEVA duas vezes, o "hp" pela metade e manchas vermelhas e brancas na tampa) e pelo aviso de que embaixo da asa não tinha desenho. Vale para todas as equipes, nos carros de 2026 e 2022–2025 com a pintura projetada.

**Logo repetido.** A folha de lado é projetada de lado, então tudo o que está na mesma altura e à mesma distância do bico pega o mesmo desenho, mesmo uma superfície escondida atrás de outra. Medido no modelo 2026: onde fica o CEVA (s 2,98 m, y 0,3 m) há superfícies em x = 0,49, 0,38 e 0,30 m, por isso o logo saía três vezes. Agora `camadas()` (`f1-2026.js`, calculado uma vez na carga do modelo) marca cada ponto com `fcar`: 1 na superfície mais de fora (procurada a até 6 cm no comprimento e 3 cm na altura) e 0 nas de dentro e nas faces que olham para dentro do carro. Nas de dentro, o shader usa a folha borrada (mip mais baixo): fica a cor, sem o logo. Medido depois: no CEVA só x = 0,48–0,49 fica com 1.

**Emenda entre o lado e o de cima.** A mistura das vistas pela normal passou de `pow(6)` para `pow(10)`: a faixa em que o desenho de lado e o de cima se misturam (e o logo saía pela metade) fica bem mais estreita.

**Embaixo da asa traseira.** Era sempre preto: o `mcar` tratava a parte de baixo como barriga de carbono (medido: s 3,71..4,35 m, y 0,5..0,81 m, normal para baixo, `mcar` 0), e o shader devolvia preto para tudo o que olha para baixo. Agora ela é pintura, e a folha tem uma vista nova, `U`, no canto da vista de lado onde não há carro (s 0,05..1,25 com y acima de 0,62; medido: nenhum ponto do carro ali), desenhada como quem vem atrás a vê. `ASA_BAIXO` em `f1-pintura.js`: Mercedes CROWDSTRIKE no preto, Ferrari IBM azul no azul-marinho, Red Bull ORACLE no carbono, McLaren ETIHAD no preto; as outras ficam pretas até ganharem a sua.

**Peso:** nenhuma textura nova; um atributo a mais no corpo e uma leitura a mais da folha no shader.

Conferido só com `node --check` (`f1-pintura.js`, `f1-2026.js`, `f1-2022.js`) e o `JSON.parse` do `novidades.json`. Os números acima foram medidos carregando o `carro.glb` de 2026 no Node com o `construir2026` do jogo. O teste jogando é do Thiago.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
