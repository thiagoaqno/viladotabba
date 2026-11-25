/* Perfil do Tiro da Galera (copiado para public/tiro/perfil-galera.js por ferramentas/tiro-frontline.js e carregado ANTES do jogo).
   O jogo guarda o progresso no navegador (cod_arsenal: nível, XP das armas, classes personalizadas, desafios; dc_settings: ajustes;
   cod_nick: o apelido do online). Este arquivo:
   1. ao abrir a página, puxa o perfil do servidor (servidor/jogos/tiro-perfil.js) e escreve essas chaves antes de o jogo lê-las;
   2. a cada vez que o jogo grava uma delas, manda uma cópia para o servidor (agrupada, e na hora de fechar a aba);
   3. mostra, nos menus, o botão do perfil: criar, entrar com o código de outro aparelho, ver o código, o placar da galera.
   O token fica no navegador (tiro_perfil) e vai no cabeçalho X-Tiro-Token. */
(function () {
  "use strict";
  var CH = ["cod_arsenal", "dc_settings", "cod_nick", "dc_grenade", "dc_couteau"], K = "tiro_perfil", API = "/tiro/perfil";
  var ls; try { ls = window.localStorage; } catch (e) { return; }
  var set0 = Storage.prototype.setItem, P = null;
  try { P = JSON.parse(ls.getItem(K) || "null"); } catch (e) { P = null; }
  if (P && !P.token) P = null;
  function guardaP() { if (P) set0.call(ls, K, JSON.stringify(P)); else ls.removeItem(K); }
  function coletar() { var d = {}; CH.forEach(function (k) { var v = ls.getItem(k); if (v != null) d[k] = v; }); return d; }
  function aplicar(d) { CH.forEach(function (k) { if (d && typeof d[k] === "string") set0.call(ls, k, d[k]); }); }

  // 1. o perfil do servidor entra antes do jogo (uma requisição curta, síncrona de propósito: o jogo lê o localStorage logo em seguida)
  if (P) {
    try {
      var x = new XMLHttpRequest(); x.open("GET", API, false); x.setRequestHeader("X-Tiro-Token", P.token); x.send();
      if (x.status === 200) { var r = JSON.parse(x.responseText); aplicar(r.dados); P.nome = r.nome; guardaP(); }
      else if (x.status === 401) { P = null; guardaP(); }
    } catch (e) { /* sem rede: joga com o que está no aparelho e manda depois */ }
  }

  // 2. as gravações do jogo vão para o servidor (no máximo uma a cada 4 s, e a que faltar ao fechar a aba)
  var pend = 0;
  function pedir(metodo, rota, corpo) {
    return fetch(API + rota, { method: metodo, headers: Object.assign({ "Content-Type": "application/json" }, P ? { "X-Tiro-Token": P.token } : {}), body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.erro || "Erro " + r.status); return j; }); });
  }
  function enviar() { pend = 0; if (P) pedir("POST", "/salvar", { dados: coletar() }).catch(function () { pend = pend || setTimeout(enviar, 15000); }); }
  function agendar() { if (P && !pend) pend = setTimeout(enviar, 4000); }
  Storage.prototype.setItem = function (k, v) { set0.call(this, k, v); if (this === ls && CH.indexOf(k) >= 0) agendar(); };
  function aoSair() {
    if (!P || !pend) return; clearTimeout(pend); pend = 0;
    try { navigator.sendBeacon(API + "/salvar", new Blob([JSON.stringify({ token: P.token, dados: coletar() })], { type: "text/plain" })); } catch (e) { /* ignorado */ }
  }
  addEventListener("pagehide", aoSair);
  document.addEventListener("visibilitychange", function () { if (document.hidden) aoSair(); });

  // 3. o botão e a janela do perfil
  function nivel() {
    try { if (typeof playerLevel === "function") return playerLevel(); } catch (e) { /* o jogo ainda não subiu */ }
    var px = 0; try { px = JSON.parse(ls.getItem("cod_arsenal") || "{}").px || 0; } catch (e) { /* ignorado */ }
    var l = 1; while (l < 100 && px >= Math.round(250 * Math.pow(l, 1.6))) l++; return l;
  }
  var nivelDoXp = function (px) { var l = 1; while (l < 100 && px >= Math.round(250 * Math.pow(l, 1.6))) l++; return l; };
  var codigoBonito = function (c) { return String(c).replace(/(.{4})(?=.)/g, "$1-"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var css = "#tgPerfil{position:fixed;left:14px;bottom:14px;z-index:2147483000;font:600 14px/1.2 Figtree,system-ui,sans-serif;padding:9px 14px;border-radius:999px;border:1px solid #ffb02088;background:#0f1114e6;color:#f1f2f4;cursor:pointer;box-shadow:0 4px 18px #0008;display:none}"
    + "#tgPerfil:hover{background:#1b1f24;border-color:#ffb020}#tgPerfil b{color:#ffb020}"
    + "#tgJan{position:fixed;inset:0;z-index:2147483001;background:#000a;display:none;align-items:center;justify-content:center;font:15px/1.45 Figtree,system-ui,sans-serif;color:#f1f2f4}"
    + "#tgJan .c{width:min(440px,92vw);max-height:90vh;overflow:auto;background:#181b20;border:1px solid #2d323b;border-top:3px solid #ffb020;border-radius:10px;padding:22px 24px;box-shadow:0 10px 40px #000a}"
    + "#tgJan h2{margin:0 0 6px;font-size:20px}#tgJan p{margin:6px 0 14px;color:#b9bfc9}#tgJan input{width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;margin:0 0 10px;border-radius:8px;border:1px solid #3a404b;background:#0b0d10;color:#fff}"
    + "#tgJan button{font:inherit;font-weight:700;cursor:pointer;border-radius:8px;padding:10px 14px;margin:0 8px 8px 0;border:1px solid #3a404b;background:#262b33;color:#f1f2f4}#tgJan button.p{background:#ffb020;border-color:#a86a00;color:#2a1800}"
    + "#tgJan button:hover{filter:brightness(1.15)}#tgJan .cod{font:800 26px/1.2 ui-monospace,Consolas,monospace;letter-spacing:2px;color:#ffd23f;background:#0b0d10;border-radius:8px;padding:12px;text-align:center;margin:8px 0 12px;user-select:all}"
    + "#tgJan .er{color:#ff6b6b;min-height:1.2em;margin:0 0 8px}#tgJan hr{border:0;border-top:1px solid #2d323b;margin:14px 0}#tgJan ol{margin:6px 0 12px;padding-left:22px}#tgJan li{margin:2px 0}#tgJan li span{color:#99a0ab}";
  var bt, jan;
  function montar() {
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    bt = document.createElement("button"); bt.id = "tgPerfil"; bt.type = "button"; bt.onclick = function () { abrir(); };
    jan = document.createElement("div"); jan.id = "tgJan"; jan.innerHTML = '<div class="c"></div>';
    jan.addEventListener("click", function (e) { if (e.target === jan) fechar(); });
    ["keydown", "keyup", "keypress"].forEach(function (t) { jan.addEventListener(t, function (e) { e.stopPropagation(); if (t === "keydown" && e.key === "Escape") fechar(); }); });
    document.body.appendChild(bt); document.body.appendChild(jan);
    setInterval(atualizarBotao, 700); atualizarBotao();
    // primeira visita sem perfil: oferece criar (e não insiste por 3 dias se a pessoa disser "agora não")
    var depois = +(ls.getItem("tiro_perfil_depois") || 0);
    if (!P && Date.now() - depois > 3 * 864e5) var t = setInterval(function () { if (noMenu()) { clearInterval(t); abrir(); } }, 800);
  }
  function noMenu() { try { return typeof MATCH !== "undefined" && MATCH.state === "menu" && !document.pointerLockElement; } catch (e) { return false; } }
  function atualizarBotao() {
    if (!bt) return;
    bt.style.display = noMenu() && jan.style.display !== "flex" ? "block" : "none";
    bt.innerHTML = P ? "👤 " + esc(P.nome) + " · <b>nível " + nivel() + "</b>" : "👤 <b>Criar perfil</b> (guardar meu nível)";
  }
  function tela(html) { jan.firstChild.innerHTML = html; jan.style.display = "flex"; atualizarBotao(); var i = jan.querySelector("input"); if (i) setTimeout(function () { i.focus(); }, 30); }
  function fechar() { jan.style.display = "none"; atualizarBotao(); }
  function erro(msg) { var e = jan.querySelector(".er"); if (e) e.textContent = msg; }
  function q(s) { return jan.querySelector(s); }
  function abrir() { P ? telaPerfil() : telaCriar(); }

  function telaCriar() {
    var apelido = ls.getItem("cod_nick") || "";
    tela('<h2>Perfil do Tiro</h2><p>Guarde seu nível, o XP das armas, suas classes e seus ajustes no servidor da Vila. Assim nada se perde e você joga em qualquer aparelho.</p>'
      + '<input id="tgNome" maxlength="24" placeholder="Seu nome" value="' + esc(apelido) + '"><div class="er"></div>'
      + '<button class="p" id="tgCriar">Criar perfil</button><button id="tgDepois">Agora não</button><hr>'
      + '<p>Já tem perfil em outro aparelho? Digite o código de 12 letras dele:</p><input id="tgCod" maxlength="16" placeholder="XXXX-XXXX-XXXX"><button id="tgEntrar">Entrar com o código</button>');
    q("#tgDepois").onclick = function () { set0.call(ls, "tiro_perfil_depois", String(Date.now())); fechar(); };
    q("#tgNome").onkeydown = function (e) { if (e.key === "Enter") q("#tgCriar").click(); };
    q("#tgCod").onkeydown = function (e) { if (e.key === "Enter") q("#tgEntrar").click(); };
    q("#tgCriar").onclick = function () {
      var nome = q("#tgNome").value.trim(); if (nome.length < 2) return erro("Escolha um nome com pelo menos 2 letras.");
      this.disabled = true;
      pedir("POST", "/criar", { nome: nome, dados: coletar() }).then(function (r) {
        P = { token: r.token, nome: r.nome }; guardaP(); ls.setItem("cod_nick", r.nome);
        telaCodigo(r.codigo, "Perfil criado! Seu progresso deste aparelho já está guardado.");
      }).catch(function (e) { erro(e.message); q("#tgCriar").disabled = false; });
    };
    q("#tgEntrar").onclick = function () {
      var c = q("#tgCod").value; if (c.replace(/[^a-z0-9]/gi, "").length !== 12) return erro("O código tem 12 letras.");
      this.disabled = true;
      pedir("POST", "/entrar", { codigo: c }).then(function (r) {
        P = { token: r.token, nome: r.nome }; guardaP(); aplicar(r.dados);
        tela("<h2>Bem-vindo de volta, " + esc(r.nome) + "!</h2><p>Carregando seu progresso...</p>"); setTimeout(function () { location.reload(); }, 600);
      }).catch(function (e) { erro(e.message); q("#tgEntrar").disabled = false; });
    };
  }
  function telaCodigo(codigo, titulo) {
    tela("<h2>" + esc(titulo) + "</h2><p>Este é o seu código. Anote: é com ele que você entra no celular ou em outro PC (botão do perfil, \"Entrar com o código\").</p>"
      + '<div class="cod">' + codigoBonito(codigo) + '</div><button class="p" id="tgOk">Anotei</button>');
    q("#tgOk").onclick = fechar;
  }
  function telaPerfil() {
    tela("<h2>" + esc(P.nome) + "</h2><p>Nível " + nivel() + ". Seu progresso fica guardado no servidor da Vila.</p>"
      + '<div class="er"></div><button class="p" id="tgFechar">Fechar</button><button id="tgCodigo">Código para outro aparelho</button><button id="tgSair">Sair deste aparelho</button>'
      + '<hr><b>Placar da galera</b><ol id="tgPlacar"><li><span>carregando...</span></li></ol>');
    q("#tgFechar").onclick = fechar;
    q("#tgCodigo").onclick = function () {
      if (!confirm("Gerar um código novo? O código antigo deixa de valer (os aparelhos que já entraram continuam).")) return;
      pedir("POST", "/codigo").then(function (r) { telaCodigo(r.codigo, "Código novo"); }).catch(function (e) { erro(e.message); });
    };
    q("#tgSair").onclick = function () {
      if (!confirm("Sair do perfil neste aparelho? O progresso continua guardado no servidor; para voltar, use o código.")) return;
      enviar(); P = null; guardaP(); fechar();
    };
    fetch(API + "/placar").then(function (r) { return r.json(); }).then(function (r) {
      var l = (r.placar || []).sort(function (a, b) { return b.xp - a.xp; }).slice(0, 10);
      q("#tgPlacar").innerHTML = l.length ? l.map(function (p) { return "<li>" + esc(p.nome) + " <span>· nível " + nivelDoXp(p.xp) + " · " + p.xp.toLocaleString("pt-BR") + " XP</span></li>"; }).join("") : "<li><span>ninguém ainda</span></li>";
    }).catch(function () { q("#tgPlacar").innerHTML = "<li><span>o placar não carregou</span></li>"; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
