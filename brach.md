# O site volta para a versão de antes da escala real

O deploy publica a main automaticamente. Para o site ficar numa versão estável enquanto as pistas vão para a escala real fora do ar, a main volta ao código do #600 (`dfbab3e6`), o último antes da escala real.

## O que sai do ar (e fica guardado)

Tudo isto continua no branch `feat/escala-real-pistas` (com backup no GitHub) e volta junto no mega PR, quando todas as pistas estiverem prontas:

- #601 Interlagos de verdade (traçado, escala e relevo reais);
- #602 Cidade do México em escala real;
- #603 o carro no tamanho de verdade;
- #604 as pistas fora do calendário da F1 apagadas;
- #605 o cenário de Interlagos no tamanho real;
- #606 Spa em escala real.

Ficam na main só `planos/escala-real.md` e `planos/escala-real-guia.md`, que são documentação.

## Cuidados

- Depois deste PR, o trabalho novo de escala real deve partir de `feat/escala-real-pistas`, não da main.
- As migrações 029 e 030 (que zeram os recordes da Cidade do México e de Spa) saem do código. Se o site já rodou essas migrações, os recordes dessas pistas já foram zerados; quando o mega PR voltar, elas não rodam de novo.
- Os recordes feitos online com a escala real (carro novo, pistas novas) continuam no banco.

## Verificação

O código fica igual ao do `dfbab3e6`, que já passou pelo CI, com exceção dos dois arquivos de `planos/`. Não testei no navegador.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
