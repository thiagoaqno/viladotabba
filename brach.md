# Viseiras novas, e os retrovisores, a torcida e as bandeiras pelo relógio

Pedidos do Thiago de 2026-11-21: "crie novas cores de viseiras" e "suspeito das bandeiras que se mexem tirando FPS; os retrovisores também parecem ser vilões do desempenho".

## Viseiras (`f1-capacetes.js`, `f1-piloto.js`, editor do capacete)
- **Oito cores lisas novas:** Fumê, Rosa, Turquesa, Amarela, Verde-limão, Bronze, Azul-marinho e Gelo. Antes eram oito no total.
- **Três furta-cor:** azul, fogo e petróleo. O brilho muda de cor conforme o ângulo, como as viseiras irídio de verdade. É a iridescência do material do Three.js (`VISEIRAS_FURTACOR` guarda a espessura da película de cada uma).
- No editor, as furta-cor têm a amostra em degradê.
- O servidor já aceitava qualquer cor de viseira (`corrida.js`), então não muda nada lá.

## Desempenho
- **Retrovisores do carro (`espelhos.js`):** "um espelho por quadro" era por quadro de verdade. Num monitor de 144 Hz eram 144 desenhos da cena a mais por segundo, e cada desenho passa pelas ~1.300 malhas da pista. Agora é pelo relógio: no máximo 40 por segundo, os dois espelhos juntos (20 cada um). De fora do carro, a metade disso.
- **Retrovisor virtual (`retrovisor.js`):** era a cada dois quadros (72 por segundo a 144 Hz); agora são 30 por segundo.
- **Torcida e bandeiras (`vida.js`):** a cada atualização elas mandam as matrizes de todos para a placa de vídeo. Agora atualizam 30 vezes por segundo, pelo relógio.
  - Medido no navegador, o custo delas no processador já era pequeno: 0,07 a 0,44 ms por quadro em Bahrein, Suzuka, Mônaco, Interlagos e Silverstone, com até 4 mil torcedores.
  - O ganho, se houver, é no envio das matrizes para a placa de vídeo, que não deu para medir aqui.
- Não medi o ganho de quadros por segundo no PC do Thiago. O log novo do #870 (o tempo real de cada quadro travado) vai mostrar.

As novidades estão na entrada do #870, para não dar conflito no `novidades.json`.

Não foi testado jogando (regra do projeto: só `node --check`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
