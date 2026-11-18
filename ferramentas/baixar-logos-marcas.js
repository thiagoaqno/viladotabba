// Baixa os LOGOS REAIS dos patrocinadores (2026-11-18, o Thiago: "sempre logos reais; o projeto é só pra mim") do Wikimedia Commons, em SVG,
// para public/corrida/logos/marcas/<id>.<ext>, e escreve public/corrida/logos/marcas/index.json ({ id: { arquivo, fonte, titulo } }).
// O f1-marcas.js desenha a imagem quando ela existe e o desenho em código (a imitação de antes) quando não.
// Uso: node ferramentas/baixar-logos-marcas.js [id ...]   (sem ids: todas as que ainda não têm arquivo; com ids: refaz só essas)
// Para trocar uma escolha ruim: ponha o título exato do arquivo do Commons em FIXOS e rode com o id.
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "../public/corrida/logos/marcas"), INDICE = path.join(DIR, "index.json");
// id -> o que procurar (o nome da marca); as variações de desenho do jogo (o H da Honda, o A da Atlassian...) usam o logo da marca
const BUSCA = {
  hp: "HP logo 2012", shell: "Shell logo", unicredit: "UniCredit logo", ceva: "CEVA Logistics logo", ibm: "IBM logo", zyn: "ZYN nicotine logo", richardmille: "Richard Mille logo",
  bitdefender: "Bitdefender logo", bingx: "BingX logo", whoop: "Whoop logo", pirelli: "Pirelli logo", genesys: "Genesys logo", peroni: "Peroni Nastro Azzurro logo", rayban: "Ray-Ban logo",
  ambipar: "Ambipar logo", dell: "Dell logo 2016", etihad: "Etihad Airways logo", groq: "Groq logo", hilton: "Hilton logo", castrol: "Castrol logo", hyatt: "World of Hyatt logo", bp: "BP Helios logo",
  revolut: "Revolut logo", adidas: "Adidas logo", twg: "TWG Global logo", jimbeam: "Jim Beam logo", corescientific: "Core Scientific logo", hilfiger: "Tommy Hilfiger logo", coherent: "Coherent Corp logo",
  pepperstone: "Pepperstone logo", glenfiddich: "Glenfiddich logo", netapp: "NetApp logo", xerox: "Xerox logo", nexgen: "NexGen Energy logo", honda: "Honda logo", kraken: "Kraken exchange logo",
  twilio: "Twilio logo", vast: "Vast Data logo", gemini: "Google Gemini logo", mastercard: "Mastercard logo", dropbox: "Dropbox logo", microsoft: "Microsoft logo", cashapp: "Cash App logo",
  ford: "Ford Motor Company logo", gulf: "Gulf Oil logo", eni: "Eni logo", moneygram: "MoneyGram logo", stake: "Stake.com logo", kick: "Kick streaming logo", orlen: "Orlen logo", alphatauri: "AlphaTauri logo",
  alfaromeo: "Alfa Romeo logo", santander: "Banco Santander logo", palmangels: "Palm Angels logo", estrela: "Mercedes-Benz Star", syntium: "Petronas Syntium logo", gate: "Gate.io logo", carlyle: "Carlyle Group logo",
  att: "AT&T logo 2016", tagheuer: "TAG Heuer logo", tudor: "Tudor watch logo", aramco: "Saudi Aramco logo", aws: "Amazon Web Services logo", dhl: "DHL logo", heineken: "Heineken logo", lenovo: "Lenovo logo 2015",
  lvmh: "LVMH logo", msc: "MSC Cruises logo", qatar: "Qatar Airways logo", salesforce: "Salesforce logo", allwyn: "Allwyn logo", amex: "American Express logo", barilla: "Barilla logo", cryptocom: "Crypto.com logo",
  globant: "Globant logo", liquimoly: "Liqui Moly logo", louisvuitton: "Louis Vuitton logo", marsh: "Marsh McLennan logo", moethennessy: "Moët Hennessy logo", nestle: "Nestlé logo", paramount: "Paramount+ logo",
  pepsico: "PepsiCo logo", pwc: "PwC logo", standardchartered: "Standard Chartered logo", mcdonalds: "McDonald's logo", tmobile: "T-Mobile logo", rolex: "Rolex logo", aggreko: "Aggreko logo", fever: "Fever app logo",
  flexjet: "Flexjet logo", puma: "Puma logo", tata: "Tata Communications logo", fanatec: "Fanatec logo", betway: "Betway logo", fanduel: "FanDuel logo", dpworld: "DP World logo", velo: "Velo nicotine logo",
  okx: "OKX logo", petronas: "Petronas logo", teamviewer: "TeamViewer logo", solera: "Solera logo", amg: "Mercedes-AMG logo", signify: "Signify logo", ineos: "Ineos logo", iwc: "IWC Schaffhausen logo",
  snapdragon: "Snapdragon logo", crowdstrike: "CrowdStrike logo", redbull: "Red Bull logo", oracle: "Oracle logo", rokt: "Rokt logo", mobil1: "Mobil 1 logo", visa: "Visa Inc. logo", hugo: "Hugo Boss HUGO logo",
  boss: "Hugo Boss logo", coreweave: "CoreWeave logo", maaden: "Maaden logo", valvoline: "Valvoline logo", cognizant: "Cognizant logo", astonmartin: "Aston Martin logo", coinbase: "Coinbase logo",
  atlassian: "Atlassian logo", komatsu: "Komatsu logo", keeper: "Keeper Security logo", duracell: "Duracell logo", nexo: "Nexo logo", ninjaone: "NinjaOne logo", visitqatar: "Visit Qatar logo", bwt: "BWT AG logo",
  alpine: "Alpine F1 Team logo", haas: "Haas F1 Team logo", cadillac: "Cadillac logo 2021", claro: "Claro logo", ifs: "IFS AB logo", aneis: "Audi logo rings", oneflight: "ONEflight logo", myprotein: "Myprotein logo",
  stephens: "Stephens Inc logo", proforce: "Proforce logo", bwscores: "bw scores logo",
};
// as variações do jogo que usam o logo de outra marca
const ALIAS = { hhonda: "honda", atlassiana: "atlassian", revolutr: "revolut", twgai: "twg", vpower: "shell" };
const FIXOS = { unicredit: "File:UniCredit logo.svg", ibm: "File:IBM logo.svg" }; // id -> "File:..." (a escolha certa, quando a busca pegar o arquivo errado)
const UA = { "User-Agent": "corrida-logos/1.0 (projeto pessoal; download unico de logos)" };
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
// (o Commons responde "You are making too many requests" se for rápido: 1,5 s entre pedidos e, se barrar, espera e tenta de novo)
async function api(q) {
  for (let t = 0; t < 6; t++) {
    await espera(1500);
    const r = await fetch("https://commons.wikimedia.org/w/api.php?format=json&" + new URLSearchParams(q), { headers: UA }), txt = await r.text();
    try { return JSON.parse(txt); } catch { await espera(15000 * (t + 1)); }
  }
  throw Error("o Commons não respondeu");
}
// a imagem em si (upload.wikimedia.org também limita: devolve uma página "Wikimedia Error" com status 429). Só aceita o que É imagem
// (começa com <svg / <?xml ou com a assinatura do PNG); se não, espera e tenta de novo.
async function baixarImagem(url) {
  for (let t = 0; t < 6; t++) {
    await espera(10000 + t * 30000);
    const r = await fetch(url, { headers: UA }), bin = Buffer.from(await r.arrayBuffer()), ini = bin.subarray(0, 400).toString("latin1");
    if (r.ok && (/<svg|^\s*<\?xml/i.test(ini) || ini.slice(1, 4) === "PNG")) return bin;
  }
  throw Error("o arquivo não veio (só página de erro)");
}
// a nota de um título: tem as palavras da marca, tem "logo", é curto e não é de outra coisa (um evento, uma filial, um produto)
function nota(titulo, busca) {
  const t = titulo.toLowerCase(), pal = busca.toLowerCase().replace(/(logo|\d{4})/g, "").split(/[^a-z0-9&+.'-]+/).filter((w) => w.length > 1);
  let n = pal.filter((w) => t.includes(w)).length * 10 - pal.length * 10; if (/logo|wordmark/.test(t)) n += 5; if (/\.svg$/.test(t)) n += 3;
  if (/bulbank|stadium|team|cup|event|building|store|sign|photo|old|historic|19[0-9]{2}/.test(t) && !/team/.test(busca.toLowerCase())) n -= 8;
  return n - t.length / 20;
}
async function achar(id) {
  if (FIXOS[id]) return FIXOS[id];
  for (const q of [`${BUSCA[id]} filemime:image/svg+xml`, `${BUSCA[id]} filemime:image/png`]) {
    const r = await api({ action: "query", list: "search", srnamespace: 6, srlimit: 10, srsearch: q });
    const lista = (r?.query?.search || []).map((x) => x.title).sort((a, b) => nota(b, BUSCA[id]) - nota(a, BUSCA[id]));
    if (lista.length && nota(lista[0], BUSCA[id]) > -12) return lista[0];
  }
  return null;
}
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const indice = fs.existsSync(INDICE) ? JSON.parse(fs.readFileSync(INDICE, "utf8")) : {};
  const pedidos = process.argv.slice(2), ids = pedidos.length ? pedidos : Object.keys(BUSCA).filter((id) => !indice[id]);
  let ok = 0, falhou = [];
  for (const id of ids) {
    try {
      const titulo = await achar(id); if (!titulo) throw Error("nada achado");
      const info = await api({ action: "query", prop: "imageinfo", iiprop: "url|mime|size", titles: titulo });
      const ii = Object.values(info.query.pages)[0]?.imageinfo?.[0]; if (!ii) throw Error("sem imageinfo");
      const ext = ii.mime === "image/svg+xml" ? "svg" : ii.mime === "image/png" ? "png" : null; if (!ext) throw Error("formato " + ii.mime);
      if (ii.size > 3e6) throw Error("grande demais (" + ii.size + ")");
      const bin = await baixarImagem(ii.url);
      for (const f of fs.readdirSync(DIR)) if (f.startsWith(id + ".")) fs.unlinkSync(path.join(DIR, f));
      fs.writeFileSync(path.join(DIR, `${id}.${ext}`), bin);
      indice[id] = { arquivo: `${id}.${ext}`, titulo, fonte: ii.descriptionurl || ii.url }; ok++;
      console.log("ok  ", id.padEnd(18), titulo);
    } catch (e) { falhou.push(id); console.log("FALHA", id.padEnd(18), e.message); }
  }
  for (const [v, base] of Object.entries(ALIAS)) if (indice[base]) indice[v] = { ...indice[base], alias: base };
  fs.writeFileSync(INDICE, JSON.stringify(indice, null, 1) + "\n");
  console.log(`\n${ok} baixados, ${falhou.length} falharam: ${falhou.join(" ")}`);
})();
