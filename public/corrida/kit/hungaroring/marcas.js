// Hungaroring — os letreiros do circuito. Sem marcas registradas de patrocinadores: são nomes de lugar, comidas e bebidas da Hungria (inventados, no jeito dos painéis de beira de
// pista), desenhados no canvas como o resto de `kit/marcas.js` (que é quem desenha).
import { MARCAS } from "../marcas.js";

export function registrarMarcasHungaroring() {
  Object.assign(MARCAS, {
    hungaroring: { fundo: "#ffffff", cor: "#15161a", texto: "HUNGARORING", fonte: "900 {s}px Arial, sans-serif", moldura: "#ce2939" },
    nagydij: { fundo: "#15161a", cor: "#ffffff", texto: "MAGYAR NAGYDÍJ", fonte: "italic 900 {s}px 'Arial Black', Arial, sans-serif", moldura: "#477050" },
    mogyorod: { fundo: "#477050", cor: "#ffffff", texto: "MOGYORÓD", fonte: "900 {s}px Arial, sans-serif", moldura: "#ffffff" },
    budapest: { fundo: "#ce2939", cor: "#ffffff", texto: "BUDAPEST", fonte: "900 {s}px Arial, sans-serif" },
    paprika: { fundo: "#c8321e", cor: "#fff3d6", texto: "PAPRIKA SZEGED", fonte: "italic 900 {s}px 'Arial Black', Arial, sans-serif", moldura: "#fff3d6" },
    tokaji: { fundo: "#e8c547", cor: "#3b2418", texto: "TOKAJI ASZÚ", fonte: "700 {s}px Georgia, serif", moldura: "#3b2418" },
    gulyas: { fundo: "#7a2e12", cor: "#ffe9b0", texto: "GULYÁSLEVES", fonte: "700 {s}px Georgia, serif", moldura: "#ffe9b0" },
    langos: { fundo: "#ffffff", cor: "#ce2939", texto: "LÁNGOS ÉS KOLBÁSZ", fonte: "900 {s}px Arial, sans-serif", moldura: "#ce2939" },
    balaton: { fundo: "#2a7fc2", cor: "#ffffff", texto: "BALATON", fonte: "700 {s}px Arial, sans-serif" },
    duna: { fundo: "#1d4f9a", cor: "#ffffff", texto: "DUNA · DANÚBIO", fonte: "700 {s}px Georgia, serif", moldura: "#ffffff" },
  });
}
