# Escala real, fase 1: o carro no tamanho de verdade

Na escala da física (1 u = 0,2083 m), o carro media uns 9,2 m × 5,4 m, quase o dobro de um F1 de verdade. Por isso as pistas tinham o dobro da largura real. Escolhemos encolher o carro e depois levar pistas e cenário para o tamanho real, por fases (`planos/escala-real.md`).

## O que muda

- **O carro:** passa a ter o tamanho de um F1 de 2026, uns 5,5 × 1,9 m (26,4 × 9,1 u). Os cinco acertos da corrida casual mantêm as diferenças entre si.
- **Colisão:** a colisão entre carros usa o tamanho novo.
- **Robôs:** a folga lateral entre carros, a folga ao contornar um carro lento e a distância da beira na linha de corrida ficaram proporcionais ao carro novo.
- **Câmeras:** as de perseguição chegam mais perto, na mesma proporção. As de dentro do carro já seguiam a malha.

## O que esperar até as próximas fases

Nas pistas antigas, o carro fica pequeno na pista, que ainda tem o dobro da largura real, e o cenário fica grande em volta dele. A Cidade do México, que já está em escala real, é onde dá para sentir o resultado: a pista de 14 m comporta uns 7 carros lado a lado, como na F1.

## Verificação

- **Cidade do México:** 21 robôs completaram a primeira volta em 96 s de corrida, sem abandono, sem dano e sem carro preso. As voltas, com a largada, ficaram entre 70 e 92 s.
- **Prints:** nenhum. O painel do navegador estava escondido e não desenhava a cena.
- **Não testado:** as pistas antigas, o pódio, a vitrine da sala e as câmeras com o carro novo.
- Só `node --check`; a suíte fica com o CI. Testes que conferem o tamanho antigo do carro podem quebrar.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
