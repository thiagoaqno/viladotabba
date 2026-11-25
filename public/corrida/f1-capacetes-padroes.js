// Corrida da Galera — os "Padrões" do editor do capacete (2026-11-25, o Thiago: "gera todos esses capacetes no editor de capacete como padrões").
// Cada um é um capacete das folhas de pixel art (public/corrida/pilotos-pixel/capacete/<id>.png): o desenho do editor e as três cores principais
// tiradas da imagem por ferramenta (k-médias no casco, sem o visor e o que é quase preto), em ordem de quanto aparecem. O desenho dos 22 pilotos é o
// deles em f1-capacetes.js (CAPACETES); os extras, que sobraram das folhas, usam um rodízio de desenhos do editor. Todos estão na lista do servidor
// (corrida-base.js DESENHOS_CAPACETE). A imagem em pixel fica como miniatura do padrão.
export const PADROES_PIXEL = [
  { id: "NOR", nome: "Lando Norris", desenho: "faixa", cores: ["#3a4738","#c0e642","#7db42b"], viseira: "#0b0d12" },
  { id: "PIA", nome: "Oscar Piastri", desenho: "bandas", cores: ["#f2850e","#605356","#be5312"], viseira: "#0b0d12" },
  { id: "LEC", nome: "Charles Leclerc", desenho: "blocos", cores: ["#b7162c","#e2c4ce","#44465d"], viseira: "#0b0d12" },
  { id: "HAM", nome: "Lewis Hamilton", desenho: "faixa", cores: ["#b81423","#eed187","#323a52"], viseira: "#0b0d12" },
  { id: "RUS", nome: "George Russell", desenho: "faixa", cores: ["#90d1e4","#20333e","#45525c"], viseira: "#0b0d12" },
  { id: "ANT", nome: "Kimi Antonelli", desenho: "blocos", cores: ["#344c53","#71a4aa","#d2e2e5"], viseira: "#0b0d12" },
  { id: "VER", nome: "Max Verstappen", desenho: "cruz", cores: ["#40405d","#b7282e","#d7d1dc"], viseira: "#0b0d12" },
  { id: "HAD", nome: "Isack Hadjar", desenho: "topo", cores: ["#e3ccbf","#42538d","#da222b"], viseira: "#0b0d12" },
  { id: "LAW", nome: "Liam Lawson", desenho: "faixa", cores: ["#e7e7ec","#a3aace","#41435b"], viseira: "#0b0d12" },
  { id: "LIN", nome: "Arvid Lindblad", desenho: "triangulos", cores: ["#293f73","#96a379","#f0f2f0"], viseira: "#0b0d12" },
  { id: "ALO", nome: "Fernando Alonso", desenho: "bandas", cores: ["#0d4562","#c8d7cc","#556d62"], viseira: "#0b0d12" },
  { id: "STR", nome: "Lance Stroll", desenho: "asas", cores: ["#0a4949","#668284","#c3d9d7"], viseira: "#0b0d12" },
  { id: "ALB", nome: "Alexander Albon", desenho: "topo", cores: ["#e0e7ee","#234279","#7f9ecc"], viseira: "#0b0d12" },
  { id: "SAI", nome: "Carlos Sainz", desenho: "bandas", cores: ["#cdcddf","#273d7b","#bb2739"], viseira: "#0b0d12" },
  { id: "HUL", nome: "Nico Hülkenberg", desenho: "faixa", cores: ["#78c658","#2d5c2a","#5f696a"], viseira: "#0b0d12" },
  { id: "BOR", nome: "Gabriel Bortoleto", desenho: "asas", cores: ["#639545","#17a233","#c0d599"], viseira: "#0b0d12" },
  { id: "GAS", nome: "Pierre Gasly", desenho: "faixa", cores: ["#c9add2","#145bb8","#0e3683"], viseira: "#0b0d12" },
  { id: "COL", nome: "Franco Colapinto", desenho: "triangulos", cores: ["#d0c6e4","#334475","#6d78af"], viseira: "#0b0d12" },
  { id: "CAM", nome: "Rafael Câmara", desenho: "faixa", cores: ["#e5dadb","#823743","#b48c97"], viseira: "#0b0d12" },
  { id: "BEA", nome: "Oliver Bearman", desenho: "faixa", cores: ["#ede4df","#4e3440","#bba7ae"], viseira: "#0b0d12" },
  { id: "PER", nome: "Sergio Pérez", desenho: "asas", cores: ["#a8a1a7","#573f49","#eae7e4"], viseira: "#0b0d12" },
  { id: "BOT", nome: "Valtteri Bottas", desenho: "blocos", cores: ["#ede9e3","#6f5a44","#aca3a1"], viseira: "#0b0d12" },
  { id: "extra1", nome: "Extra 1", desenho: "faixas", cores: ["#284e67","#d9d14b","#c9dadc"], viseira: "#0b0d12" },
  { id: "extra2", nome: "Extra 2", desenho: "linhas", cores: ["#104a59","#117d8d","#6e9061"], viseira: "#0b0d12" },
  { id: "extra3", nome: "Extra 3", desenho: "degrade", cores: ["#e3e0df","#332e38","#60515c"], viseira: "#0b0d12" },
  { id: "extra4", nome: "Extra 4", desenho: "geometrico", cores: ["#ed7719","#46383c","#cfc5c6"], viseira: "#0b0d12" },
  { id: "extra5", nome: "Extra 5", desenho: "stripe", cores: ["#dfe8f4","#134a98","#849fc8"], viseira: "#0b0d12" },
  { id: "extra6", nome: "Extra 6", desenho: "e_racing", cores: ["#ccd3ea","#24326b","#a65b77"], viseira: "#0b0d12" },
  { id: "extra7", nome: "Extra 7", desenho: "e_split", cores: ["#e3bf55","#796044","#cd111e"], viseira: "#0b0d12" },
  { id: "extra8", nome: "Extra 8", desenho: "e_tech", cores: ["#e8e0df","#c3a4ae","#b71c30"], viseira: "#0b0d12" },
];
export const imagemDoPadrao = (id) => `/corrida/pilotos-pixel/capacete/${id}.png`;
