# Montreal: passada visual na escala real

O comprimento, a largura, o relevo e as linhas dos robôs de Montreal já estavam na `main`. Esta é a passada visual.

- **Base sólida e chão no nível** (`kit/montreal/chao.js`, novo): uma fita de grama colada na borda do asfalto, sem vão, e um corte de concreto sob a pista. Os muros, as placas, a tribuna e as árvores pousam em `nivelDoChao`.
- **Ambiente próprio** (`kit/montreal/ambiente.js`, novo): as placas de frenagem (com poste), os mastros com a bandeira do Canadá e os postos dos fiscais no chão e atrás do alambrado. O do kit deixava tudo solto no ar.
- **Arquibancada principal no tamanho real** (`kit/montreal/tribuna.js`, novo): 24 degraus de 0,5 × 0,75 m (antes 12 degraus de 1,25 × 1,77 m, do carro grande).
- **Peças no tamanho real:** o prédio dos boxes de 2019 (térreo de 5 m, 13,3 m até a laje), os muros de 1,25 m com o alambrado, o Muro dos Campeões, os blocos, o skyline, os bordos e os choupos.
- **Pórtico da largada:** a faixa acompanha a escala.

Sem prints: o Thiago testa jogando e manda o que quebrou. Conferido com `node --check`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
