/* Perfil do Tiro da Galera (copiado para public/tiro/perfil-galera.js por ferramentas/tiro-frontline.js e carregado ANTES do jogo).
   O jogo guarda o progresso no navegador (cod_arsenal: nível, XP das armas, classes personalizadas, desafios; dc_settings: ajustes;
   cod_nick: o apelido do online). Este arquivo:
   1. ao abrir a página, puxa o perfil do servidor (servidor/jogos/tiro-perfil.js) e escreve essas chaves antes de o jogo lê-las;
   2. a cada vez que o jogo grava uma delas, manda uma cópia para o servidor (agrupada, e na hora de fechar a aba);
   3. mostra, nos menus, o botão do perfil: criar, entrar com o código de outro aparelho, ver o código, o placar da galera.
   O token fica no navegador (tiro_perfil) e vai no cabeçalho X-Tiro-Token. */
(function () {
  "use strict";
  var CH = ["cod_arsenal", "dc_settings", "cod_nick", "dc_grenade", "dc_couteau"], K = "tiro_perfil", PEND = "tiro_perfil_pend", API = "/tiro/perfil";
  var ls; try { ls = window.localStorage; } catch (e) { return; }
  var set0 = Storage.prototype.setItem, P = null;
  try { P = JSON.parse(ls.getItem(K) || "null"); } catch (e) { P = null; }
  if (P && !P.token) P = null;
  function guardaP() { if (P) set0.call(ls, K, JSON.stringify(P)); else ls.removeItem(K); }
  function coletar() { var d = {}; CH.forEach(function (k) { var v = ls.getItem(k); if (v != null) d[k] = v; }); return d; }
  function aplicar(d) { CH.forEach(function (k) { if (d && typeof d[k] === "string") set0.call(ls, k, d[k]); }); }
  function sincronizar(x, url) { x.open("GET", url, false); x.send(); return x; }

  // No programa de PC (o jogo em 127.0.0.1, servidor/corrida/corrida-pc.js), o perfil é o do SITE: o servidor local diz o
  // endereço. Sem internet, joga com o que está no aparelho; o que foi jogado fica marcado (tiro_perfil_pend) e sobe quando
  // a internet voltar, nesta mesma abertura ou na próxima.
  var remoto = false;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    try { var s = JSON.parse(sincronizar(new XMLHttpRequest(), API + "/site").responseText).site; if (s) { API = s + "/tiro/perfil"; remoto = true; } } catch (e) { /* servidor de desenvolvimento: o perfil local */ }
  }

  function pedir(metodo, rota, corpo, ms) {
    var op = { method: metodo, headers: Object.assign({ "Content-Type": "application/json" }, P ? { "X-Tiro-Token": P.token } : {}), body: corpo ? JSON.stringify(corpo) : undefined };
    try { if (ms && AbortSignal.timeout) op.signal = AbortSignal.timeout(ms); } catch (e) { /* navegador antigo */ }
    return fetch(API + rota, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.erro || "Erro " + r.status); er.status = r.status; throw er; } return j; }); },
      function () { throw new Error(remoto ? "Sem internet agora: tente de novo quando ela voltar." : "O servidor não respondeu. Tente de novo."); });
  }
  // o servidor tinha um progresso mais novo (jogado em outro aparelho): ele vale, e a página recarrega para o jogo ler
  function pegarDoServidor(dados) { aplicar(dados); set0.call(ls, PEND, ""); if (typeof MATCH === "undefined" || MATCH.state === "menu") location.reload(); }

  // 1. o perfil do servidor entra antes do jogo
  if (P) {
    if (ls.getItem(PEND)) setTimeout(enviar, 300); // tem progresso que ainda não subiu: ele vai primeiro (o servidor não deixa o XP voltar para trás)
    else if (!remoto) {
      // no site: uma requisição curta e síncrona de propósito, porque o jogo lê o localStorage logo em seguida
      try {
        var x = new XMLHttpRequest(); x.open("GET", API, false); x.setRequestHeader("X-Tiro-Token", P.token); x.send();
        if (x.status === 200) { var r = JSON.parse(x.responseText); aplicar(r.dados); P.nome = r.nome; guardaP(); }
        else if (x.status === 401) { P = null; guardaP(); }
      } catch (e) { /* sem rede: joga com o que está no aparelho e manda depois */ }
    } else {
      // no programa de PC, sem travar a abertura se a internet estiver ruim: se o site tiver algo diferente, recarrega com ele
      pedir("GET", "", null, 6000).then(function (r) {
        P.nome = r.nome; guardaP();
        var mudou = CH.some(function (k) { return typeof r.dados[k] === "string" && r.dados[k] !== ls.getItem(k); });
        if (mudou && !ls.getItem(PEND)) pegarDoServidor(r.dados);
      }).catch(function (e) { if (e.status === 401) { P = null; guardaP(); } });
    }
  }

  // 2. as gravações do jogo vão para o servidor (no máximo uma a cada 4 s, e a que faltar ao fechar a aba)
  var pend = 0;
  function enviar() {
    clearTimeout(pend); pend = 0; if (!P) return;
    pedir("POST", "/salvar", { dados: coletar() }, 10000).then(function (r) {
      set0.call(ls, PEND, "");
      if (r.dados) pegarDoServidor(r.dados);
    }).catch(function (e) { if (e.status === 401) { P = null; guardaP(); return; } pend = setTimeout(enviar, 20000); });
  }
  function agendar() { if (!P) return; set0.call(ls, PEND, "1"); if (!pend) pend = setTimeout(enviar, 4000); }
  Storage.prototype.setItem = function (k, v) { set0.call(this, k, v); if (this === ls && CH.indexOf(k) >= 0) agendar(); };
  addEventListener("online", function () { if (P && ls.getItem(PEND)) enviar(); });
  // ao fechar: o sendBeacon não diz se chegou, então a marca de pendente fica e a próxima abertura confere
  function aoSair() {
    if (!P || !ls.getItem(PEND)) return; clearTimeout(pend); pend = 0;
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
  var bt, jan, volta;
  function montar() {
    var st = document.createElement("style"); st.textContent = css + cssElo; document.head.appendChild(st);
    bt = document.createElement("button"); bt.id = "tgPerfil"; bt.type = "button"; bt.onclick = function () { abrir(); };
    jan = document.createElement("div"); jan.id = "tgJan"; jan.innerHTML = '<div class="c"></div>';
    jan.addEventListener("click", function (e) { if (e.target === jan) fechar(); });
    ["keydown", "keyup", "keypress"].forEach(function (t) { jan.addEventListener(t, function (e) { e.stopPropagation(); if (t === "keydown" && e.key === "Escape") fechar(); }); });
    document.body.appendChild(bt); document.body.appendChild(jan);
    // no programa de PC a janela não tem barra de endereço: o caminho de volta para a Corrida
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
      volta = document.createElement("a"); volta.id = "tgVolta"; volta.href = "/corrida/"; volta.textContent = "🏁 Corrida";
      volta.style.cssText = "position:fixed;left:14px;bottom:58px;z-index:2147483000;font:600 14px/1.2 Figtree,system-ui,sans-serif;padding:9px 14px;border-radius:999px;border:1px solid #3a404b;background:#0f1114e6;color:#f1f2f4;text-decoration:none;display:none";
      document.body.appendChild(volta);
    }
    setInterval(atualizarBotao, 700); atualizarBotao();
    carregarElo();
    // primeira visita sem perfil: oferece criar (e não insiste por 3 dias se a pessoa disser "agora não")
    var depois = +(ls.getItem("tiro_perfil_depois") || 0);
    if (!P && Date.now() - depois > 3 * 864e5) var t = setInterval(function () { if (noMenu()) { clearInterval(t); abrir(); } }, 800);
  }
  function noMenu() { try { return typeof MATCH !== "undefined" && MATCH.state === "menu" && !document.pointerLockElement; } catch (e) { return false; } }
  // o cartão "Perfil" do menu do jogo (acctChip) mostra o nosso perfil: ferramentas/tiro-frontline.js faz o jogo perguntar aqui
  var offline = function () { return P && ls.getItem(PEND) && !navigator.onLine; };
  function rotulo() {
    return P ? { ok: true, nome: P.nome, sub: "Nível " + nivel() + (ELO && ELO.partidas ? " · " + ELO.ranque.rotulo : "") + (offline() ? " · sem internet, sobe depois ⏳" : " · ver meu perfil") }
      : { ok: false, nome: "Criar perfil", sub: "Guarde seu nível e suas classes na Vila" };
  }
  var ultimo = "";
  function avisarJogo() { try { if (typeof acctChip === "function") acctChip(); } catch (e) { /* o jogo ainda não subiu */ } }
  function atualizarBotao() {
    if (!bt) return;
    var noJogo = !!document.getElementById("acctChip"); // com o cartão do jogo, o botão nosso não precisa aparecer
    var ver = noMenu() && jan.style.display !== "flex";
    bt.style.display = ver && !noJogo ? "block" : "none";
    bt.innerHTML = (P ? "👤 " + esc(P.nome) + " · <b>nível " + nivel() + "</b>" : "👤 <b>Criar perfil</b> (guardar meu nível)")
      + (offline() ? ' <span title="Sem internet: o progresso fica no aparelho e sobe quando ela voltar">⏳</span>' : "");
    if (volta) volta.style.display = ver ? "block" : "none";
    var r = JSON.stringify(rotulo()); if (r !== ultimo) { ultimo = r; avisarJogo(); }
  }
  window.tiroPerfil = { abrir: function () { if (jan) abrir(); }, rotulo: rotulo };
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
        P = { token: r.token, nome: r.nome }; guardaP(); ls.setItem("cod_nick", r.nome); carregarElo();
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
      + '<div id="tgElo"><b>Elo</b> <span style="color:#99a0ab">carregando...</span></div>'
      + '<div class="er"></div><button class="p" id="tgFechar">Fechar</button><button id="tgCodigo">Código para outro aparelho</button><button id="tgSair">Sair deste aparelho</button>'
      + '<hr><b>Ranking do elo</b><ol id="tgRank"><li><span>carregando...</span></li></ol>'
      + '<hr><b>Placar da galera</b><ol id="tgPlacar"><li><span>carregando...</span></li></ol>');
    carregarElo().then(function (e) {
      var el = q("#tgElo"); if (!el) return;
      if (!e) { el.innerHTML = '<b>Elo</b> <span style="color:#99a0ab">não carregou</span>'; return; }
      var r = e.ranque, cor = CORES[r.nome] || "#ccc";
      el.innerHTML = "<b>Elo</b> " + rqHtml(r) + ' <span style="color:#99a0ab">· ' + e.pontos + " pontos</span>"
        + (r.proximo ? '<div class="tgBar" style="--c:' + cor + '"><b style="width:' + r.naDivisao + '%"></b></div><span style="color:#99a0ab;font-size:13px">' + r.naDivisao + "/100 para a próxima divisão</span>" : "")
        + '<p style="margin:6px 0 0">' + e.vitorias + " vitórias, " + e.derrotas + " derrotas" + (e.pico > e.pontos ? " · melhor: " + e.pico + " pontos" : "") + "</p>"
        + (e.partidas ? '<p style="margin:2px 0 0;font-size:13px">Últimas: ' + e.historico.map(function (h) { return '<span style="color:' + (h.delta > 0 ? "#5ee08f" : h.delta < 0 ? "#ff6b6b" : "#99a0ab") + '">' + (h.delta > 0 ? "+" : "") + h.delta + "</span>"; }).join(" ") + "</p>"
          : '<p style="margin:6px 0 0;font-size:13px;color:#99a0ab">Vale elo: partida online de mata-mata em time ou dominação, com pelo menos ' + (e.minHumanos || 4) + " pessoas.</p>");
    });
    pedir("GET", "/elo/placar").then(function (r) {
      var l = (r.placar || []).slice(0, 10), el = q("#tgRank"); if (!el) return;
      el.innerHTML = l.length ? l.map(function (p) { return "<li>" + esc(p.nome) + ' <span>· <span class="tgRq" style="--c:' + (CORES[p.ranque.split(" ")[0]] || "#ccc") + '"><i></i>' + esc(p.ranque) + "</span> · " + p.pontos + " pontos</span></li>"; }).join("") : "<li><span>ninguém jogou valendo ainda</span></li>";
    }).catch(function () { var el = q("#tgRank"); if (el) el.innerHTML = "<li><span>o ranking não carregou</span></li>"; });
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

  // 4. o elo (servidor/jogos/tiro-elo.js). No fim de uma partida online, o jogo chama tiroElo.fim (ferramentas/tiro-frontline.js)
  // com o placar e quem jogou; isto manda para o servidor e mostra na tela do fim quanto subiu ou desceu. A partida só conta
  // quando outro jogador com perfil manda o mesmo placar: enquanto isso, a tela diz "esperando" e pergunta de novo.
  var ELO = null, CORES = { Prata: "#c3cad4", Ouro: "#f2c14e", Diamante: "#8fd3ff", Ascendente: "#3ccf8e", Imortal: "#e2475d", Radiante: "#ffe58a" };
  var cssElo = ".tgRq{display:inline-flex;align-items:center;gap:6px;font-weight:800}.tgRq i{display:inline-block;width:18px;height:18px;clip-path:polygon(50% 0,100% 28%,100% 72%,50% 100%,0 72%,0 28%);background:var(--c);box-shadow:0 0 8px var(--c)}"
    + "#tgEloFim{margin:14px auto 0;max-width:520px;padding:12px 16px;border-radius:10px;background:#0f1114d9;border:1px solid #2d323b;font:600 15px/1.35 Figtree,system-ui,sans-serif;color:#f1f2f4;text-align:center}"
    + "#tgEloFim .d{font-size:24px;font-weight:900;margin-left:8px}#tgEloFim .d.up{color:#5ee08f}#tgEloFim .d.dn{color:#ff6b6b}#tgEloFim small{display:block;color:#99a0ab;margin-top:4px;font-weight:500}"
    + ".tgBar{height:8px;border-radius:4px;background:#2a2f37;overflow:hidden;margin:8px 0 2px}.tgBar b{display:block;height:100%;background:var(--c)}"
    // a animação do fim: o número conta, a barra anda, o ranque pula quando muda (sobe brilhando, cai tremendo)
    + "#tgEloFim.ea{animation:eaIn .45s ease-out both}#tgEloFim .ea-top{display:flex;align-items:center;justify-content:center;gap:4px}"
    + "#tgEloFim .ea-rq i{width:26px;height:26px;transition:background .3s,box-shadow .3s}#tgEloFim .ea-rq b{font-size:19px}"
    + "#tgEloFim .tgBar{height:12px;border-radius:6px;margin:10px 0 4px;position:relative}#tgEloFim .tgBar b{transition:background .3s;border-radius:6px}"
    + "#tgEloFim .tgBar.dn b{background:linear-gradient(90deg,var(--c),#ff6b6b)}#tgEloFim .tgBar.up b{box-shadow:0 0 12px var(--c)}"
    + "#tgEloFim .ea-aviso{display:block;font:900 20px/1.2 Figtree,system-ui,sans-serif;letter-spacing:1px;margin-top:6px;min-height:0;opacity:0}"
    + "#tgEloFim .ea-aviso.on{animation:eaAviso .7s cubic-bezier(.2,1.6,.4,1) both}#tgEloFim .ea-aviso.up{color:#ffe58a;text-shadow:0 0 14px #ffb020}#tgEloFim .ea-aviso.dn{color:#ff6b6b}"
    + "#tgEloFim .ea-pop{animation:eaPop .7s ease-out}#tgEloFim .ea-treme{animation:eaTreme .5s ease-in-out}#tgEloFim.ea-brilha{animation:eaBrilha 1.4s ease-out}"
    + "#tgEloFim .d.ea-num{display:inline-block;animation:eaNum .5s cubic-bezier(.2,1.6,.4,1) both}"
    + "@keyframes eaIn{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}"
    + "@keyframes eaNum{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}"
    + "@keyframes eaPop{0%{transform:scale(1)}35%{transform:scale(1.45);filter:brightness(1.9)}100%{transform:scale(1)}}"
    + "@keyframes eaTreme{0%,100%{transform:none}20%{transform:translateX(-6px) rotate(-3deg)}40%{transform:translateX(6px) rotate(3deg)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}"
    + "@keyframes eaBrilha{0%{box-shadow:0 0 0 #ffb02000}30%{box-shadow:0 0 34px #ffb020cc;border-color:#ffb020}100%{box-shadow:0 0 0 #ffb02000}}"
    + "@keyframes eaAviso{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}";
  function rqHtml(r) { return '<span class="tgRq" style="--c:' + (CORES[r.nome] || "#ccc") + '"><i></i>' + esc(r.rotulo) + "</span>"; }
  function carregarElo() {
    if (!P) { ELO = null; return Promise.resolve(null); }
    return pedir("GET", "/elo", null, 8000).then(function (r) { ELO = r; ultimo = ""; atualizarBotao(); return r; }).catch(function () { return null; });
  }
  function caixaFim() {
    var c = document.getElementById("tgEloFim"); if (c) return c;
    var st = document.getElementById("endStats"); if (!st || !st.parentNode) return null;
    c = document.createElement("div"); c.id = "tgEloFim"; st.parentNode.insertBefore(c, st.nextSibling); return c;
  }
  // o ranque de um total de pontos (o mesmo cálculo do servidor, servidor/jogos/tiro-elo.js)
  var NOMES_RQ = ["Prata", "Ouro", "Diamante", "Ascendente", "Imortal"];
  function rqDe(p) {
    p = Math.max(0, Math.floor(p));
    if (p >= 1500) return { nome: "Radiante", rotulo: "Radiante", naDivisao: 100, proximo: null };
    var d = Math.floor(p / 100); return { nome: NOMES_RQ[Math.floor(d / 3)], rotulo: NOMES_RQ[Math.floor(d / 3)] + " " + (d % 3 + 1), naDivisao: p % 100, proximo: 100 };
  }
  var som = function (k) { try { if (typeof sfxUi === "function") sfxUi(k); } catch (e) { /* sem som */ } };
  // a animação do fim: conta de 0 até o ganho (ou a perda), a barra anda ponto a ponto entre o antes e o depois e, quando o
  // ranque muda no caminho, o ícone pula com o aviso "SUBIU PARA OURO 1!" (ou treme, ao cair)
  function animar(c, r) {
    var up = r.delta > 0, dn = r.delta < 0, r0 = rqDe(r.antes), cor = function (q) { return CORES[q.nome] || "#ccc"; };
    c.className = "ea";
    c.innerHTML = '<div class="ea-top"><span class="tgRq ea-rq" style="--c:' + cor(r0) + '"><i></i><b>' + esc(r0.rotulo) + '</b></span>'
      + '<span class="d ea-num ' + (up ? "up" : dn ? "dn" : "") + '">' + (up ? "+" : dn ? "-" : "") + "0</span></div>"
      + '<div class="tgBar ' + (up ? "up" : dn ? "dn" : "") + '" style="--c:' + cor(r0) + '"><b style="width:' + (r0.proximo ? r0.naDivisao : 100) + '%"></b></div>'
      + '<small class="ea-txt">' + r.antes + " pontos</small><span class=\"ea-aviso\"></span>";
    var rq = c.querySelector(".ea-rq"), nome = rq.querySelector("b"), num = c.querySelector(".ea-num"), bar = c.querySelector(".tgBar"), fill = bar.firstChild,
      txt = c.querySelector(".ea-txt"), aviso = c.querySelector(".ea-aviso"), atual = r0.rotulo, ultimoTic = 0;
    var DUR = Math.min(2600, 700 + Math.abs(r.delta) * 55), t0 = 0;
    function passo(now) {
      if (!c.isConnected) return;
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - k, 3), v = Math.round(r.antes + (r.depois - r.antes) * e), q = rqDe(v);
      num.textContent = (up ? "+" : dn ? "-" : "") + Math.abs(v - r.antes);
      fill.style.width = (q.proximo ? q.naDivisao : 100) + "%";
      txt.textContent = v + " pontos" + (q.proximo ? " · " + q.naDivisao + "/100 na divisão" : "");
      if (v !== ultimoTic && Math.abs(v - r.antes) % 4 === 0) { ultimoTic = v; som("tick"); }
      if (q.rotulo !== atual) {
        var subiu = v > r.antes; atual = q.rotulo;
        nome.textContent = q.rotulo; rq.style.setProperty("--c", cor(q)); bar.style.setProperty("--c", cor(q));
        rq.classList.remove("ea-pop", "ea-treme"); void rq.offsetWidth; rq.classList.add(subiu ? "ea-pop" : "ea-treme");
        aviso.className = "ea-aviso " + (subiu ? "up" : "dn"); void aviso.offsetWidth; aviso.classList.add("on");
        aviso.textContent = subiu ? "SUBIU PARA " + q.rotulo.toUpperCase() + "!" : "CAIU PARA " + q.rotulo.toUpperCase();
        if (subiu) { c.classList.remove("ea-brilha"); void c.offsetWidth; c.classList.add("ea-brilha"); som("unlock"); } else som("error");
      }
      if (k < 1) requestAnimationFrame(passo);
      else { num.textContent = (up ? "+" : "") + r.delta; som(up ? "confirm" : dn ? "back" : "tick"); }
    }
    setTimeout(function () { requestAnimationFrame(passo); }, 450);
  }
  var fimId = 0;
  function fim(d) {
    var id = ++fimId, c = caixaFim(); if (!c) return;
    if (!P) { c.innerHTML = "Crie um perfil (botão Perfil no menu) para entrar no elo."; return; }
    c.innerHTML = "Elo: mandando o resultado..."; var tentativas = 0;
    (function vai() {
      if (id !== fimId) return;
      pedir("POST", "/elo/resultado", d, 10000).then(function (r) {
        if (id !== fimId) return;
        if (r.estado === "contou") {
          animar(c, r);
          carregarElo();
        } else if (r.estado === "esperando" && tentativas++ < 18) {
          c.innerHTML = "Elo: esperando outro jogador com perfil confirmar o placar...<small>A partida conta quando dois perfis mandam o mesmo resultado.</small>";
          setTimeout(vai, 5000);
        } else if (r.estado === "esperando") {
          c.innerHTML = "Elo: ninguém mais confirmou este placar, a partida não contou.<small>Precisa de pelo menos dois jogadores com perfil na partida.</small>";
        } else c.innerHTML = "Esta partida não vale elo: " + esc(r.motivo || "") + ".";
      }).catch(function (e) { if (id === fimId) c.innerHTML = "Elo: " + esc(e.message); });
    })();
  }
  window.tiroElo = { fim: fim, carregar: carregarElo };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
