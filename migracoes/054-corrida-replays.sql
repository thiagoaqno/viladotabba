-- Corrida: o replay de cada GP da carreira (solo e com os amigos), para a análise 3D da Central (2026-11-14).
-- `dono` é "solo:<id da temporada>" ou "grupo:<código da sala>"; `meta` é o JSON das colunas (os pilotos, o passo, o número de amostras) e
-- `dados` são as amostras de corrida-gravacao.js comprimidas com gzip. Cada dono guarda os 30 GPs mais recentes (bd.js, guardarReplayCorrida).
CREATE TABLE IF NOT EXISTS corrida_replays (
  dono TEXT NOT NULL,
  ano INTEGER NOT NULL,
  gp INTEGER NOT NULL,
  meta TEXT NOT NULL,
  dados BLOB NOT NULL,
  criado_em INTEGER NOT NULL,
  PRIMARY KEY (dono, ano, gp)
);
