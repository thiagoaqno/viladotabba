// Corrida da Galera — as pinturas NA TEXTURA (f1-uv.js) de cada equipe e ano, feitas pelas fotos que o Thiago manda, uma equipe por vez.
// `cor(p, n, qual)`: a cor de base no ponto p = { x, y, s } (metros do carro; s desde o bico) com a normal n, no material `qual` ("livery" é o corpo,
// "asas" são as asas). `marcas`: o que vai por cima, posto por ponto do carro (f1-uv.js `colocar`: plano "lado", "topo" ou "tras").
// `numero`: onde vai o número do piloto. As imagens dos logos ficam em /corrida/logos-carro/ (as que o Thiago mandou).
import { DESENHOS_UV, mistura } from "./f1-uv.js";

const L = (n) => "/corrida/logos-carro/" + n + ".png";
const dosDoisLados = (lista) => lista.flatMap((m) => (m.plano === "lado" && m.lado == null ? [{ ...m, lado: 1 }, { ...m, lado: -1 }] : [m]));
const castrol = (ctx, larg) => { const h = larg * 0.3; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(-larg / 2, -h / 2, larg, h, h * 0.25); ctx.fill();
  ctx.fillStyle = "#009639"; ctx.beginPath(); ctx.arc(-larg / 2 + h * 0.62, 0, h * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e4002b"; ctx.font = `italic 800 ${h * 0.72}px Arial, sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("Castrol", -larg / 2 + h * 1.15, h * 0.04, larg - h * 1.3); };
const tricolor = (ctx, larg) => { const h = larg * 0.06, w = larg / 3; [["#0055a4", -w], ["#ffffff", 0], ["#ef4135", w]].forEach(([c, x]) => { ctx.fillStyle = c; ctx.fillRect(x - w / 2 + w * 0.08, -h / 2, w * 0.84, h); }); };

// ---- Alpine A523 (2023), pelas fotos do Thiago: o azul brilhante de cima (do bico ao alto da tampa e o halo), o preto-azulado do resto, a faixa rosa
// da caixa lateral com o BWT azul grande, as asas rosa com o BWT, a pilha de marcas no bico e o MOBILIZE nos ombros do cockpit
{
  const AZUL = "#1c6fe3", AZUL_ESC = "#0d47b0", PRETO = "#0f1424", ROSA = "#f2a5d3", LILAS = "#d9b1ec";
  DESENHOS_UV["alpine@2023"] = {
    cor(p, n, qual) {
      const ax = Math.abs(p.x);
      if (qual === "asas") {
        if (p.s < 0.8) return ax > 0.74 || n.y < -0.2 ? PRETO : ROSA; // a asa dianteira: os planos rosa, as placas das pontas pretas
        if (p.s > 3.8) return (ax > 0.42 && Math.abs(n.x) > 0.5) || n.y < -0.3 ? PRETO : ROSA; // a asa traseira: o plano rosa, as placas pretas
        return PRETO;
      }
      // a faixa rosa na face de lado da caixa lateral (cavada para baixo neste carro: a normal aponta para fora e para baixo), do rosa para o lilás atrás
      if (Math.abs(n.x) > 0.22 && n.y > -0.8 && n.y < 0.5 && p.s > 2.0 && p.s < 3.35 && p.y > 0.12 && p.y < 0.42 - Math.max(0, 2.3 - p.s) * 0.7) return mistura(ROSA, LILAS, (p.s - 2.0) / 1.35);
      if (n.y < -0.35) return PRETO; // por baixo
      // o azul: a faixa de cima (do bico à tampa, no meio), o bico inteiro e o halo; escurece para trás
      const cima = n.y > 0.45 && ax < 0.3 && p.s < 3.7, bico = p.s < 1.3 && p.y > 0.12, halo = p.y > 0.72 && p.s > 1.6 && p.s < 2.6;
      if (cima || bico || halo) return mistura(AZUL, AZUL_ESC, (p.s - 1.0) / 2.8);
      return PRETO;
    },
    marcas: dosDoisLados([
      // de lado
      { plano: "lado", a: 2.66, b: 0.27, larg: 0.74, o: { img: L("bwt") } },
      { plano: "lado", a: 1.72, b: 0.47, larg: 0.3, o: { texto: "ALPINE", cor: "#ffffff", peso: 300, esp: 14 } },
      { plano: "lado", a: 1.72, b: 0.43, larg: 0.12, o: { fn: tricolor } },
      { plano: "lado", a: 3.05, b: 0.66, larg: 0.22, o: { fn: castrol } },
      { plano: "lado", a: 2.95, b: 0.76, larg: 0.15, o: { texto: "RENAULT E-TECH", cor: "#ffffff", peso: 700 } },
      { plano: "lado", a: 2.25, b: 0.13, larg: 0.3, o: { texto: "BINANCE  yahoo!  sprinklr", cor: "#ffffff", peso: 700 } },
      { plano: "lado", a: 1.55, b: 0.12, larg: 0.16, o: { texto: "ecowatt", cor: "#ffffff", peso: 700 } },
      // de cima: os ombros do cockpit (MOBILIZE e BWT, lidos ao longo do carro), o ALPINE no bico e a pilha de marcas, lida por quem vem de frente
      { plano: "topo", a: 2.2, b: 0.24, larg: 0.24, giro: 90, o: { img: L("mobilize-branco") } },
      { plano: "topo", a: 2.2, b: -0.24, larg: 0.24, giro: 90, o: { img: L("mobilize-branco") } },
      { plano: "topo", a: 1.98, b: 0.24, larg: 0.08, giro: 90, o: { img: L("bwt-branco") } },
      { plano: "topo", a: 1.98, b: -0.24, larg: 0.08, giro: 90, o: { img: L("bwt-branco") } },
      { plano: "topo", a: 1.3, b: 0, larg: 0.22, giro: 90, o: { texto: "ALPINE", cor: "#ffffff", peso: 300, esp: 14 } },
      { plano: "topo", a: 0.64, b: 0, larg: 0.12, giro: 180, o: { img: L("bwt-branco") } },
      { plano: "topo", a: 0.56, b: 0, larg: 0.13, giro: 180, o: { img: L("mobilize-branco") } },
      { plano: "topo", a: 0.48, b: 0, larg: 0.11, giro: 180, o: { marca: "pirelli", tinta: "#ffffff", proporcao: 3.6 } },
      { plano: "topo", a: 0.41, b: 0, larg: 0.12, giro: 180, o: { marca: "microsoft", tinta: "#ffffff", proporcao: 5.6 } },
      { plano: "topo", a: 0.33, b: 0, larg: 0.11, giro: 180, o: { fn: castrol } },
      { plano: "topo", a: 0.8, b: 0, larg: 0.13, giro: 180, o: { fn: tricolor } },
      // as asas
      { qual: "asas", plano: "topo", a: 0.32, b: 0.45, larg: 0.38, giro: 195, o: { img: L("bwt") } },
      { qual: "asas", plano: "topo", a: 0.32, b: -0.45, larg: 0.38, giro: 165, o: { img: L("bwt") } },
      { qual: "asas", plano: "topo", a: 4.12, b: 0, larg: 0.55, o: { img: L("bwt") } },
      { qual: "asas", plano: "tras", a: 0.22, b: 0.86, larg: 0.3, o: { img: L("bwt") } },
      { qual: "asas", plano: "tras", a: -0.22, b: 0.86, larg: 0.3, o: { img: L("bwt") } },
      { qual: "asas", plano: "lado", a: 4.2, b: 0.72, larg: 0.2, o: { fn: castrol } },
      { qual: "asas", plano: "lado", a: 0.4, b: 0.2, larg: 0.22, o: { marca: "microsoft", tinta: "#ffffff", proporcao: 5.6 } },
    ]),
    numero: [
      { plano: "topo", a: 1.0, b: 0, larg: 0.16, giro: 180, cor: "#f2a5d3", borda: "#ffffff", altura: 0.12 },
      { plano: "lado", lado: 1, a: 3.62, b: 0.62, larg: 0.12, cor: "#ffffff", altura: 0.09 },
      { plano: "lado", lado: -1, a: 3.62, b: 0.62, larg: 0.12, cor: "#ffffff", altura: 0.09 },
    ],
  };
}
