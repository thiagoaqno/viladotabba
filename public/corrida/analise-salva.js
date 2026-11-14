// Corrida da Galera — a análise 3D de um GP já guardado na carreira (solo e com os amigos), dentro da aba Análise da Central
// (temporada/central-analise.js): as sub-abas Momentos (a principal), Posições, Ultrapassagens e Replay usam o mesmo módulo da tela do resultado
// (resultado-analise.js), sem o cabeçalho e as abas dele (as da Central mandam) e no tema da carreira (claro ou escuro, a engrenagem do topo).
// O bloco onde ela entra tem `data-cx-vivo`: o redesenho da Central (central.js, pintar) não mexe nele enquanto a marca for a mesma.
// O resumo do GP vem no save (`resultado.analise`); o replay, só quando a sub-aba Replay pede (`pedirReplay`, o socket da carreira).
import { montarAnaliseSalva } from "/corrida/resultado-analise.js";

const corOk = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#e10600");

// `el`: o bloco da sub-aba; `r`: o resultado do save ({ ano, gp, pista, linhas, analise }); `nomes`: { id: nome } dos humanos;
// `meu`: o id de quem olha ("voce"); `aba`: momentos | posicoes | ultrapassagens | replay; `pedirReplay()`: Promise do replay (ou null);
// `aoAba(aba)`: troca a sub-aba da Central (o "Ver no replay" das ultrapassagens)
export function montarNaCentral(el, { r, nomes = {}, meu = "voce", aba, pedirReplay, aoAba }) {
  const A = r && r.analise; if (!el || !A || !A.pilotos) return false;
  const FP = window.F1Pilotos || { EQUIPES: {}, PILOTOS: [] };
  const piloto = (id) => FP.PILOTOS.find((p) => p.id === id);
  const nomeDe = (id) => nomes[id] || (piloto(id) && piloto(id).nome) || id;
  const siglaDe = (id) => (piloto(id) && piloto(id).sigla) || String(nomeDe(id)).replace(/[^A-Za-zÀ-ú]/g, "").slice(0, 3).toUpperCase() || "???";
  const linhas = [...r.linhas].sort((a, b) => a.pos - b.pos);
  const players = linhas.map((l) => ({ id: l.piloto, name: nomeDe(l.piloto), nomeCompleto: nomeDe(l.piloto), equipe: l.equipe, sigla: siglaDe(l.piloto), color: corOk(FP.EQUIPES[l.equipe] && FP.EQUIPES[l.equipe].cor) }));
  const resultado = linhas.map((l) => ({ id: l.piloto, pos: l.pos, grid: Math.max(0, ((A.pilotos[l.piloto] && A.pilotos[l.piloto].g) || l.pos) - 1), dnf: !!l.dnf, nc: !!l.nc, dsq: false }));
  const chave = `salvo:${r.ano}:${r.gp}:${r.pista}`;
  const S = { startAt: chave, config: { pista: r.pista, regras: "f1", voltas: A.voltas }, players, resultado };
  const meuEq = (linhas.find((l) => l.piloto === meu) || {}).equipe, cor = corOk(FP.EQUIPES[meuEq] && FP.EQUIPES[meuEq].cor);
  el.style.setProperty("--eq-ra", cor);
  const fonte = { analise: () => Promise.resolve(A), replay: () => (pedirReplay ? Promise.resolve(pedirReplay()) : Promise.resolve(null)), sNow: () => Date.now() };
  const tema = document.body.classList.contains("cx-escuro") ? "escuro" : "claro";
  montarAnaliseSalva(el, S, { id: meu }, A, fonte, chave, { semCab: true, tema, aba, aoAba });
  return true;
}
