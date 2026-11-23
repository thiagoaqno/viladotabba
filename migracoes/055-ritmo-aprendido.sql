-- Corrida: o ritmo de quem joga, aprendido pelos robôs (2026-11-23, o Thiago: "os bots deviam aprender comigo, com as especificidades: piloto de um
-- jeito na chuva e com um pneu específico"). Para cada pista, piloto, condição (seco ou molhado) e pneu: a razão entre a volta dele e a volta ideal
-- do carro dele naquela condição e com aquele pneu (corrida-robos.js razaoDaVolta). Entra aos poucos, no fim de cada corrida (bd.js aprenderRitmoCorrida).
CREATE TABLE IF NOT EXISTS corrida_ritmo_aprendido (
  pista TEXT NOT NULL,
  chave TEXT NOT NULL,
  condicao TEXT NOT NULL,
  composto TEXT NOT NULL,
  razao REAL NOT NULL,
  voltas INTEGER NOT NULL,
  corridas INTEGER NOT NULL,
  atualizado INTEGER NOT NULL,
  PRIMARY KEY (pista, chave, condicao, composto)
);
-- A PROXIMIDADE de quem joga: a razão dele dividida pela dos robôs do Difícil para cima na mesma corrida (sem o carro a mais do nível), por pista,
-- piloto e condição (corrida.js aprenderRitmo). Ela decide o carro a mais dos robôs do 100 ao 150 (corrida-robos.js forcaDoReforco).
CREATE TABLE IF NOT EXISTS corrida_ritmo_proximidade (
  pista TEXT NOT NULL,
  chave TEXT NOT NULL,
  condicao TEXT NOT NULL,
  prox REAL NOT NULL,
  voltas INTEGER NOT NULL,
  corridas INTEGER NOT NULL,
  atualizado INTEGER NOT NULL,
  PRIMARY KEY (pista, chave, condicao)
);
