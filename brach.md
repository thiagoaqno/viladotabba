# Quem é jogado para fora não leva a punição de ganhar posição

O Thiago (2026-11-22): "não existe: o cara bate em mim, eu saio da pista e ganho +5 porque quando voltei ultrapassei alguém".

- `corrida-f1-direcao.js bater`: todo toque com outro carro fica anotado com a culpa (`p.toqueCarro`), antes de qualquer outra regra.
- `registrar`: sair da pista até 3 s depois de um toque em que a culpa não foi sua (`EMPURRADO_MS`), ou levar o toque já fora da pista, é "ser jogado para fora". Essa saída não conta como limite de pista, e ganhar posição ao voltar não dá os +5 s. No log aparece "fora da pista depois de um toque".
- Quem sai sozinho, ou por culpa própria, segue a regra de antes.
- Conferido na memória (Interlagos, dois carros, o carro sai, passa o outro e volta):
  - jogado para fora: 0 s de punição e nenhum aviso;
  - sem o toque: 1 aviso de limite e +5 s.
