// Corrida da Galera — os "Padrões" do editor do capacete (2026-11-25, o Thiago: "gera todos esses capacetes no editor de capacete como padrões").
// Cada um é um capacete das folhas de pixel art (public/corrida/pilotos-pixel/capacete/<id>.png): o desenho do editor e as três cores principais
// tiradas da imagem por ferramenta (k-médias no casco, sem o visor e o que é quase preto), em ordem de quanto aparecem. O desenho dos 22 pilotos é o
// deles em f1-capacetes.js (CAPACETES); os extras, que sobraram das folhas, usam um rodízio de desenhos do editor. Todos estão na lista do servidor
// (corrida-base.js DESENHOS_CAPACETE). A imagem em pixel fica como miniatura do padrão.
// (2026-11-25) os 22 pilotos do grid usam o desenho próprio deles (p_XXX, f1-capacetes-estilos.js ESTILOS_PILOTOS: as formas, o logo da equipe, o nome
// e os patrocínios); os extras seguem com o desenho do editor.
export const PADROES_PIXEL = [
  { id: "NOR", nome: "Lando Norris", desenho: "p_NOR", cores: ["#c4f31a", "#101114", "#ff8000"], viseira: "#0b0d12" },
  { id: "PIA", nome: "Oscar Piastri", desenho: "p_PIA", cores: ["#ff8000", "#101114", "#f4f4f4"], viseira: "#0b0d12" },
  { id: "LEC", nome: "Charles Leclerc", desenho: "p_LEC", cores: ["#e10600", "#f4f4f4", "#101114"], viseira: "#0b0d12" },
  { id: "HAM", nome: "Lewis Hamilton", desenho: "p_HAM", cores: ["#c8102e", "#8a0a1a", "#f4d22c"], viseira: "#0b0d12" },
  { id: "RUS", nome: "George Russell", desenho: "p_RUS", cores: ["#6fc6f0", "#101114", "#f4f4f4"], viseira: "#0b0d12" },
  { id: "ANT", nome: "Kimi Antonelli", desenho: "p_ANT", cores: ["#101114", "#00a19b", "#c8ccd2"], viseira: "#0b0d12" },
  { id: "VER", nome: "Max Verstappen", desenho: "p_VER", cores: ["#1e2a5a", "#16204a", "#d3202a"], viseira: "#0b0d12" },
  { id: "HAD", nome: "Isack Hadjar", desenho: "p_HAD", cores: ["#f4f4f4", "#1e3d96", "#d3202a"], viseira: "#0b0d12" },
  { id: "LAW", nome: "Liam Lawson", desenho: "p_LAW", cores: ["#f4f4f4", "#1e3d96", "#d3202a"], viseira: "#0b0d12" },
  { id: "LIN", nome: "Arvid Lindblad", desenho: "p_LIN", cores: ["#1e2a5a", "#16204a", "#e6f01a"], viseira: "#0b0d12" },
  { id: "ALO", nome: "Fernando Alonso", desenho: "p_ALO", cores: ["#0b4f45", "#e6f01a", "#101114"], viseira: "#0b0d12" },
  { id: "STR", nome: "Lance Stroll", desenho: "p_STR", cores: ["#0b5d4a", "#229971", "#f4f4f4"], viseira: "#0b0d12" },
  { id: "ALB", nome: "Alexander Albon", desenho: "p_ALB", cores: ["#f4f4f4", "#1868db", "#0a1b3d"], viseira: "#0b0d12" },
  { id: "SAI", nome: "Carlos Sainz", desenho: "p_SAI", cores: ["#0a1b3d", "#1868db", "#d3202a"], viseira: "#0b0d12" },
  { id: "HUL", nome: "Nico Hülkenberg", desenho: "p_HUL", cores: ["#101114", "#3cd23c", "#d3202a"], viseira: "#0b0d12" },
  { id: "BOR", nome: "Gabriel Bortoleto", desenho: "p_BOR", cores: ["#101114", "#7dff2e", "#d3202a"], viseira: "#0b0d12" },
  { id: "GAS", nome: "Pierre Gasly", desenho: "p_GAS", cores: ["#1f56d8", "#ff8fc2", "#0a1b3d"], viseira: "#0b0d12" },
  { id: "COL", nome: "Franco Colapinto", desenho: "p_COL", cores: ["#0a1b3d", "#5fb8f0", "#f4f4f4"], viseira: "#0b0d12" },
  { id: "CAM", nome: "Rafael Câmara", desenho: "p_CAM", cores: ["#f4f4f4", "#d3202a", "#101114"], viseira: "#0b0d12" },
  { id: "BEA", nome: "Oliver Bearman", desenho: "p_BEA", cores: ["#f4f4f4", "#d3202a", "#101114"], viseira: "#0b0d12" },
  { id: "PER", nome: "Sergio Pérez", desenho: "p_PER", cores: ["#101114", "#f4f4f4", "#c9a227"], viseira: "#0b0d12" },
  { id: "BOT", nome: "Valtteri Bottas", desenho: "p_BOT", cores: ["#f4f4f4", "#c9a227", "#101114"], viseira: "#0b0d12" },
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
