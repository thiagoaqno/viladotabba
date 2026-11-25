// Perfil do Tiro da Galera (public/tiro/): o jogo guarda o progresso no navegador (nível, XP das armas, classes
// personalizadas, desafios, ajustes); o public/tiro/perfil.js copia essas chaves para cá e as devolve em outro aparelho.
// Como na Carreira: o token fica no navegador (vai no cabeçalho X-Tiro-Token, nunca na URL) e o código de recuperação de
// 12 letras serve para entrar no celular ou em outro PC. O banco guarda só os hashes (servidor/comum/bd.js, tiro_perfis).
//   POST /tiro/perfil/criar   { nome, dados }  → { token, codigo, nome }
//   GET  /tiro/perfil                         → { nome, dados, em }
//   POST /tiro/perfil/salvar  { dados, nome? } → { ok, em }   (também pelo sendBeacon ao fechar a aba: token no corpo)
//   POST /tiro/perfil/entrar  { codigo }       → { token, nome, dados }
//   POST /tiro/perfil/codigo                  → { codigo }   (o antigo deixa de valer)
//   GET  /tiro/perfil/placar                  → { placar: [{ nome, xp }] }
const express = require("express");

const CHAVES = /^(cod_arsenal|dc_settings|cod_nick|dc_grenade|dc_couteau)$/; // o que o perfil.js copia
const MAX_DADOS = 200 * 1024;
const limparNome = (n) => String(n || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
function limparDados(d) {
  const out = {}; let tam = 0;
  if (!d || typeof d !== "object") return out;
  for (const [k, v] of Object.entries(d)) {
    if (!CHAVES.test(k) || typeof v !== "string") continue;
    tam += v.length; if (tam > MAX_DADOS) break;
    out[k] = v;
  }
  return out;
}

module.exports = function ligarPerfilTiro(app) {
  const bd = () => require("../comum/bd.js");
  const r = express.Router();
  // o sendBeacon manda text/plain: aceita JSON nos dois
  r.use(express.json({ limit: "256kb", type: ["application/json", "text/plain"] }));
  r.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  const dono = (req) => {
    const t = String(req.get("X-Tiro-Token") || (req.body && req.body.token) || "");
    try { return bd().perfilTiroPorToken(t); } catch { return null; }
  };
  const erro = (res, st, msg) => res.status(st).json({ erro: msg });

  r.post("/criar", (req, res) => {
    const nome = limparNome(req.body && req.body.nome);
    if (nome.length < 2) return erro(res, 400, "Escolha um nome com pelo menos 2 letras.");
    try {
      const c = bd().criarPerfilTiro(nome, limparDados(req.body.dados));
      res.json({ token: c.token, codigo: c.recuperacao, nome });
    } catch (e) { console.warn("tiro-perfil criar:", e.message); erro(res, 500, "O perfil não foi criado. Tente de novo."); }
  });
  r.get("/", (req, res) => {
    const p = dono(req); if (!p) return erro(res, 401, "Perfil não encontrado neste aparelho.");
    res.json({ nome: p.nome, dados: p.dados, em: p.atualizadoEm });
  });
  r.post("/salvar", (req, res) => {
    const p = dono(req); if (!p) return erro(res, 401, "Perfil não encontrado neste aparelho.");
    const nome = req.body && req.body.nome ? limparNome(req.body.nome) : "";
    const dados = { ...p.dados, ...limparDados(req.body && req.body.dados) };
    try { bd().salvarPerfilTiro(p.id, dados, nome.length >= 2 ? nome : null); res.json({ ok: true, em: Date.now() }); }
    catch (e) { console.warn("tiro-perfil salvar:", e.message); erro(res, 500, "Não salvou. Tente de novo."); }
  });
  r.post("/entrar", (req, res) => {
    let p = null; try { p = bd().recuperarPerfilTiro(req.body && req.body.codigo); } catch {}
    if (!p) return erro(res, 404, "Código não encontrado. Confira as 12 letras.");
    res.json({ token: p.token, nome: p.nome, dados: p.dados });
  });
  r.post("/codigo", (req, res) => {
    const p = dono(req); if (!p) return erro(res, 401, "Perfil não encontrado neste aparelho.");
    const codigo = bd().novoCodigoTiro(p.id);
    codigo ? res.json({ codigo }) : erro(res, 500, "Não deu para gerar o código.");
  });
  r.get("/placar", (req, res) => {
    try { res.json({ placar: bd().placarTiro() }); } catch { res.json({ placar: [] }); }
  });
  app.use("/tiro/perfil", r);
};
