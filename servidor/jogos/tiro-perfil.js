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
//   GET  /tiro/perfil/elo                     → { pontos, pico, partidas, vitorias, derrotas, ranque, historico }
//   POST /tiro/perfil/elo/resultado { sala, modo, mapa, placar, humanos, eu } → { estado: contou | esperando | nao_conta }
//   GET  /tiro/perfil/elo/placar              → { placar: [{ nome, pontos, ranque }] }
const express = require("express");

const CHAVES = /^(cod_arsenal|dc_settings|cod_nick|dc_grenade|dc_couteau)$/; // o que o perfil.js copia
const MAX_DADOS = 200 * 1024;
const ORIGEM_PC = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/; // o programa de PC (servidor/corrida/corrida-pc.js)
const pxDe = (s) => { try { return Number(JSON.parse(s).px) || 0; } catch { return 0; } };
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
  r.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    // o programa de PC (127.0.0.1) fala direto com o perfil do site
    const o = req.headers.origin;
    if (o && ORIGEM_PC.test(o)) {
      res.set({ "Access-Control-Allow-Origin": o, Vary: "Origin", "Access-Control-Allow-Headers": "Content-Type, X-Tiro-Token", "Access-Control-Allow-Methods": "GET, POST" });
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });
  // no programa de PC: o endereço do site, para o perfil-galera.js guardar o perfil lá (no site, vazio)
  r.get("/site", (req, res) => res.json({ site: (process.env.CORRIDA_SITE || "").replace(/\/+$/, "") }));
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
    const novo = limparDados(req.body && req.body.dados);
    // o progresso nunca volta para trás: um aparelho que ficou sem internet e manda depois não apaga o que foi jogado em
    // outro (o XP total do jogador, px, só cresce). Nesse caso a resposta leva os dados do servidor, e o aparelho os pega.
    let maisNovo = false;
    if (novo.cod_arsenal && p.dados.cod_arsenal && pxDe(novo.cod_arsenal) < pxDe(p.dados.cod_arsenal)) { delete novo.cod_arsenal; maisNovo = true; }
    const dados = { ...p.dados, ...novo };
    try { bd().salvarPerfilTiro(p.id, dados, nome.length >= 2 ? nome : null); res.json({ ok: true, em: Date.now(), ...(maisNovo ? { dados } : {}) }); }
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
  // o elo (servidor/jogos/tiro-elo.js): o meu, o relato do fim de partida e o ranking da galera
  const ELO = require("./tiro-elo.js");
  r.get("/elo", (req, res) => {
    const p = dono(req); if (!p) return erro(res, 401, "Perfil não encontrado neste aparelho.");
    try { const e = bd().eloTiro(p.id); res.json({ ...e, ranque: ELO.ranque(e.pontos), historico: bd().historicoEloTiro(p.id, 10), minHumanos: ELO.MIN_HUMANOS }); }
    catch (e) { console.warn("tiro-elo:", e.message); erro(res, 500, "O elo não carregou."); }
  });
  r.post("/elo/resultado", (req, res) => {
    const p = dono(req); if (!p) return erro(res, 401, "Perfil não encontrado neste aparelho.");
    try { res.json(ELO.relatar(bd(), p, req.body)); }
    catch (e) { console.warn("tiro-elo resultado:", e.message); erro(res, 500, "O resultado não foi guardado."); }
  });
  r.get("/elo/placar", (req, res) => {
    try { res.json({ placar: bd().placarEloTiro(50).map((l) => ({ ...l, ranque: ELO.ranque(l.pontos).rotulo })) }); } catch { res.json({ placar: [] }); }
  });
  app.use("/tiro/perfil", r);
};
