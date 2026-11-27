-- O elo do Tiro da Galera (servidor/jogos/tiro-elo.js): os pontos de cada perfil e as partidas que contaram.
-- Ranques de 100 pontos por divisão: Prata 1 (0) até Imortal 3 (1400 a 1499); Radiante a partir de 1500.
CREATE TABLE tiro_elo (
  perfil INTEGER PRIMARY KEY REFERENCES tiro_perfis(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL DEFAULT 0,
  pico INTEGER NOT NULL DEFAULT 0,
  partidas INTEGER NOT NULL DEFAULT 0,
  vitorias INTEGER NOT NULL DEFAULT 0,
  derrotas INTEGER NOT NULL DEFAULT 0,
  atualizado_em INTEGER NOT NULL
);
CREATE INDEX tiro_elo_pontos ON tiro_elo (pontos DESC);
-- cada partida conta uma vez só para cada perfil (chave: a partida confirmada, com a hora em que o primeiro relato chegou)
CREATE TABLE tiro_elo_partidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil INTEGER NOT NULL REFERENCES tiro_perfis(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  modo TEXT NOT NULL,
  mapa TEXT NOT NULL,
  resultado TEXT NOT NULL,
  delta INTEGER NOT NULL,
  pontos INTEGER NOT NULL,
  criado_em INTEGER NOT NULL
);
CREATE UNIQUE INDEX tiro_elo_partidas_uma ON tiro_elo_partidas (perfil, chave);
CREATE INDEX tiro_elo_partidas_perfil ON tiro_elo_partidas (perfil, id DESC);
