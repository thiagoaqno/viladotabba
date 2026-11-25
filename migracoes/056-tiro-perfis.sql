-- Os perfis do Tiro da Galera (public/tiro/, o Riposte): quem é a pessoa (só o hash do token e do código de recuperação,
-- como nas carreiras) e o progresso dela, que o jogo guarda no navegador e o perfil.js copia para cá (nível, XP das armas,
-- classes personalizadas, desafios, ajustes). dados: { chave do localStorage: texto }.
CREATE TABLE tiro_perfis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  recuperacao_hash TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  dados TEXT NOT NULL DEFAULT '{}',
  criado_em INTEGER NOT NULL,
  atualizado_em INTEGER NOT NULL
);
-- Os outros aparelhos da mesma pessoa (entrou com o código no celular): cada um com o seu token.
CREATE TABLE tiro_perfis_aparelhos (
  perfil INTEGER NOT NULL REFERENCES tiro_perfis(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  criado_em INTEGER NOT NULL
);
