/* =====================================================================
   Arte: logo, roupas (três vistas), etiqueta kraft, ícones
   ===================================================================== */
let _uid = 0;
const PADROES = { liso: "Liso", listras: "Listras", jeans: "Jeans", floral: "Floral", trico: "Tricô", linho: "Linho", couro: "Couro", lona: "Lona" };
const CORES = [
  ["Azul", "#3E5C76"], ["Jeans", "#4F6D8F"], ["Marinho", "#26344A"], ["Verde", "#5E7357"], ["Oliva", "#7C8A6A"],
  ["Musgo", "#2E3A2C"], ["Terracota", "#B5654A"], ["Vinho", "#7A2E33"], ["Rosa", "#D69A9A"], ["Mostarda", "#C9A64A"],
  ["Caramelo", "#C9A27E"], ["Areia", "#D8CFBF"], ["Cru", "#E8DFCF"], ["Branco", "#EFEDE7"], ["Cinza", "#8A8F84"], ["Preto", "#2B2B2B"],
];

// --- logo: a roda aberta. O anel é a ciranda e a letra c; o ponto é a peça que entra na roda.
function logoMarca(t = 28, cor = "currentColor", ponto = "#5B34F2") {
  return `<svg class="logo-roda" width="${t}" height="${t}" viewBox="-24 -24 48 48" aria-hidden="true"><circle r="14" fill="none" stroke="${cor}" stroke-width="9.5" stroke-dasharray="67.2 20.76" transform="rotate(-2)"/><circle cx="9.9" cy="-9.9" r="5" fill="${ponto}"/></svg>`;
}
function logoCompleto(t = 30, cor = "currentColor", ponto) {
  return `<span class="logo" style="color:${cor}">${logoMarca(Math.round(t * .95), cor, ponto)}<span class="logo-txt" style="font-size:${(t / 17).toFixed(2)}rem">ciranda</span></span>`;
}

// --- cor
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return "#" + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join(""); }
function misturar(h, alvo, a) { const [r, g, b] = hexRgb(h), [R, G, B] = hexRgb(alvo); return rgbHex(r + (R - r) * a, g + (G - g) * a, b + (B - b) * a); }
function matiz(h) {
  let [r, g, b] = hexRgb(h).map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hh = 0; if (d) { hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; }
  return { h: (hh * 60 + 360) % 360, s: mx ? d / mx : 0, l: (mx + mn) / 2 };
}
function fundoDe(cor) {
  const m = matiz(cor);
  if (m.s < 0.12) return "#ECEEF1";
  return `hsl(${Math.round((m.h + 30) % 360)} ${m.l > 0.7 ? 30 : 38}% ${m.l > 0.7 ? 84 : 90}%)`;
}

// --- formas (coordenadas 120 x 150)
const ROUPA = {
  camiseta: {
    d: "M44 26 30 32 16 52 30 61 36 54V128H84V54L90 61 104 52 90 32 76 26C73 35 67 39 60 39 53 39 47 35 44 26Z",
    linhas: ["M46.5 27.8C49.5 34.5 54 37 60 37 66 37 70.5 34.5 73.5 27.8", "M19 50.5 31.5 58.6", "M101 50.5 88.5 58.6"],
    costura: ["M37.5 124.5H82.5", "M36 54V60"],
    dobras: ["M47 66C52 88 49 106 55 124", "M77 62C71 84 76 102 69 124"], cabide: 30,
  },
  camisa: {
    d: "M44 24 28 30 14 106 28 108 36 58V128H84V58L92 108 106 106 92 30 76 24 66 30H54Z",
    linhas: ["M54 30 60 42 66 30", "M60 42V128", "M15.2 100 29 102", "M104.8 100 91 102", "M67 54H79V66H67Z"],
    costura: ["M37.5 124.5H82.5", "M62.5 42V126"],
    botoes: [[60, 52], [60, 68], [60, 84], [60, 100], [60, 116]],
    dobras: ["M46 70C50 90 46 108 50 124", "M74 72C70 92 76 108 72 124"], cabide: 28,
  },
  vestido: {
    d: "M48 18H52L54 36H66L68 18H72L76 42 70 56 96 130H24L50 56 44 42Z",
    linhas: ["M50 56H70", "M54 36C56 40 64 40 66 36"],
    costura: ["M27.5 126.5H92.5"],
    dobras: ["M55 60C50 86 42 106 38 128", "M64 60C68 88 72 106 80 128", "M60 62V128"], cabide: 20,
  },
  saia: {
    d: "M38 34H82L100 124H20Z",
    linhas: ["M38 42H82", "M48 42 40 124", "M60 42V124", "M72 42 80 124", "M54 42 50 124", "M66 42 70 124"],
    costura: ["M23 120.5H97"],
    faixa: "M38 34H82V42H38Z",
    dobras: [], cabide: 34, prendedor: true,
  },
  calca: {
    d: "M38 16H82L88 128H66L60 58 54 128H32Z",
    linhas: ["M38 24H82", "M60 24V44C59.5 48 57.5 50 55 51", "M41 24C44 31 48 33 52 33", "M79 24C76 31 72 33 68 33"],
    costura: ["M34.5 123H52.5", "M67.5 123H85.5", "M63 26V46"],
    faixa: "M38 16H82V24H38Z", botoes: [[60, 20]],
    dobras: ["M44 70C46 90 42 106 44 124", "M76 70C74 90 78 106 76 124"], cabide: 16, prendedor: true,
  },
  jaqueta: {
    d: "M44 20 26 28 14 112 30 114 36 62V126H84V62L90 114 106 112 94 28 76 20 60 44Z",
    linhas: ["M60 44V126", "M40 72H54V80H40Z", "M66 72H80V80H66Z", "M44 20 52 36 60 44 68 36 76 20", "M15 105 30 107", "M105 105 90 107", "M36 116H84"],
    costura: ["M57.5 46V124", "M62.5 46V124", "M41 77H53", "M67 77H79"],
    botoes: [[60, 56], [60, 74], [60, 92], [60, 110]],
    dobras: ["M44 86C48 100 44 110 46 120", "M76 86C72 100 76 110 74 120"], cabide: 24,
  },
  tenis: {
    d: "M14 98V76C32 76 42 66 48 54L62 58C68 72 82 80 102 84 110 86 112 94 108 100H16Z",
    linhas: ["M14 92H109", "M50 60 46 70", "M55 62 51 72", "M60 64 56 74", "M88 80C92 84 100 86 108 88", "M14 76C20 80 24 86 26 92"],
    costura: ["M16 88C40 89 80 89 106 90"],
    sola: "M13 92H110C111 96 110 100 108 101H15C13 100 12.5 96 13 92Z",
    dobras: [], cabide: null,
  },
  bolsa: {
    d: "M26 58H94L100 118H20Z",
    linhas: ["M26 58H94L90 84H30Z", "M56 84H64V92H56Z"],
    costura: ["M29 61H91", "M23.5 114H96.5"],
    alca: "M44 58C44 30 76 30 76 58",
    dobras: [], cabide: null,
  },
};
const FORMA_DE = { "Camisetas e blusas": "camiseta", "Camisas": "camisa", "Vestidos": "vestido", "Saias": "saia", "Calças jeans": "calca", "Jaquetas e casacos": "jaqueta", "Calçados": "tenis", "Bolsas e acessórios": "bolsa" };

function padraoDef(id, padrao, cor, escala = 1) {
  const esc = misturar(cor, "#000000", 0.28), clr = misturar(cor, "#ffffff", 0.38);
  const tf = escala !== 1 ? ` patternTransform="scale(${escala})"` : "";
  switch (padrao) {
    case "listras": return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"${tf}><rect width="8" height="8" fill="${cor}"/><rect y="4.4" width="8" height="3.6" fill="#F3F0E8"/></pattern>`;
    case "jeans": return `<pattern id="${id}" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)${escala !== 1 ? ` scale(${escala})` : ""}"><rect width="2.6" height="2.6" fill="${cor}"/><rect width="1" height="2.6" fill="${clr}" opacity=".55"/></pattern>`;
    case "floral": return `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"${tf}><rect width="20" height="20" fill="${cor}"/>${[[5, 5], [15, 15]].map(([x, y], k) => `<g fill="${k ? "#F4E3C3" : clr}">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(x + 2.1 * Math.cos(a * Math.PI / 180)).toFixed(2)}" cy="${(y + 2.1 * Math.sin(a * Math.PI / 180)).toFixed(2)}" r="1.5"/>`).join("")}<circle cx="${x}" cy="${y}" r="1.1" fill="${esc}"/></g>`).join("")}<path d="M10 4q2 2 4 1M2 14q2-1 3 1" stroke="${misturar(cor, "#2E5A2C", .5)}" stroke-width=".8" fill="none"/></pattern>`;
    case "trico": return `<pattern id="${id}" width="3.4" height="3" patternUnits="userSpaceOnUse"${tf}><rect width="3.4" height="3" fill="${cor}"/><path d="M0 0 1.7 1.6 3.4 0M0 1.5 1.7 3.1 3.4 1.5" stroke="${esc}" stroke-width=".45" fill="none" opacity=".55"/></pattern>`;
    case "linho": return `<pattern id="${id}" width="7" height="4" patternUnits="userSpaceOnUse"${tf}><rect width="7" height="4" fill="${cor}"/><path d="M0 1H4M3 3H7" stroke="${esc}" stroke-width=".35" opacity=".35"/><path d="M5 1H7M0 3H2" stroke="#fff" stroke-width=".35" opacity=".35"/></pattern>`;
    case "lona": return `<pattern id="${id}" width="2" height="2" patternUnits="userSpaceOnUse"${tf}><rect width="2" height="2" fill="${cor}"/><rect width="1" height="1" fill="${esc}" opacity=".14"/><rect x="1" y="1" width="1" height="1" fill="${esc}" opacity=".14"/></pattern>`;
    case "couro": return `<radialGradient id="${id}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${clr}"/><stop offset=".55" stop-color="${cor}"/><stop offset="1" stop-color="${esc}"/></radialGradient>`;
    default: return `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${cor}"/></pattern>`;
  }
}

function textoVolta(n) { return n === 0 ? "estreia" : `rodou ${n}×`; }

// etiqueta kraft pendurada (coordenadas absolutas do svg 300 x 375)
function etiquetaKraft(x, y, rot, linha1, linha2, ox, oy) {
  return `<g class="etq-kraft">
    <path d="M${ox} ${oy}C${ox + 14} ${oy + 10} ${x + 8} ${y - 18} ${x + 18} ${y + 12}" stroke="#3B2A17" stroke-width="1.4" fill="none" opacity=".75"/>
    <g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M8 0H64L74 12V82H8L0 72V10Z" fill="#D9B98C" stroke="#B4925F" stroke-width="1"/>
      <circle cx="18" cy="12" r="4.2" fill="#fff" stroke="#B4925F"/>
      <text x="38" y="48" text-anchor="middle" font-family="Caveat, 'Segoe Print', cursive" font-size="${linha1.length > 7 ? 19 : 24}" font-weight="700" fill="#3B2A17">${linha1}</text>
      <text x="38" y="68" text-anchor="middle" font-family="'DM Mono', ui-monospace, monospace" font-size="9" fill="#5A4428">${linha2}</text>
    </g></g>`;
}

/* vista 0: flat lay; 1: no cabide; 2: detalhe da etiqueta da marca */
function arteRoupa(peca, vista = 0, opts = {}) {
  const k = ++_uid;
  const forma = ROUPA[FORMA_DE[peca.categoria] || "camiseta"];
  const cor = peca.cor || "#8A8F84";
  const padrao = peca.padrao || "liso";
  const fundo = opts.fundo || fundoDe(cor);
  const pid = `pt${k}`, cid = `cl${k}`, lid = `lz${k}`, sid = `sb${k}`;
  const esc = misturar(cor, "#000000", 0.32);
  const costuraCor = padrao === "jeans" ? "#D9892B" : misturar(cor, "#000", .45);
  const defs = `<defs>${padraoDef(pid, padrao, cor)}${padraoDef(pid + "g", padrao, cor, 5)}
    <clipPath id="${cid}"><path d="${forma.d}"/>${forma.alca ? "" : ""}</clipPath>
    <linearGradient id="${lid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <filter id="${sid}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3.2" stdDeviation="2.6" flood-color="#1b2030" flood-opacity=".22"/></filter></defs>`;
  const fill = `url(#${pid})`;
  const corpo = (detalhe = true) => `
    ${forma.alca ? `<path d="${forma.alca}" fill="none" stroke="${esc}" stroke-width="5.5" stroke-linecap="round"/>` : ""}
    <g filter="url(#${sid})"><path d="${forma.d}" fill="${fill}"/></g>
    ${forma.sola ? `<path d="${forma.sola}" fill="#F4F2EC" stroke="rgba(0,0,0,.18)" stroke-width=".8"/>` : ""}
    ${forma.faixa ? `<path d="${forma.faixa}" fill="${esc}" opacity=".35"/>` : ""}
    <g clip-path="url(#${cid})">
      <rect x="0" y="0" width="120" height="150" fill="url(#${lid})"/>
      ${(forma.dobras || []).map(d => `<path d="${d}" stroke="#000" stroke-opacity=".10" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${d}" transform="translate(1.6 0)" stroke="#fff" stroke-opacity=".10" stroke-width="1.4" fill="none"/>`).join("")}
    </g>
    ${detalhe ? `${(forma.linhas || []).map(d => `<path d="${d}" stroke="${esc}" stroke-opacity=".55" stroke-width=".9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}
    ${(forma.costura || []).map(d => `<path d="${d}" stroke="${costuraCor}" stroke-opacity=".8" stroke-width=".7" stroke-dasharray="1.6 1.2" fill="none"/>`).join("")}
    ${(forma.botoes || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${padrao === "jeans" || FORMA_DE[peca.categoria] === "calca" ? "#B7B2A6" : "#F2EEE4"}" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>`).join("")}` : ""}`;
  const aria = `role="img" aria-label="${(peca.titulo || "").replace(/"/g, "&quot;")}"`;

  if (vista === 2) {   // detalhe: tecido de perto e a etiqueta da marca
    const marca = (peca.marca || "").toUpperCase().slice(0, 14);
    return `<svg viewBox="0 0 300 375" ${aria} xmlns="http://www.w3.org/2000/svg">${defs}
      <rect width="300" height="375" fill="url(#${pid}g)"/>
      <rect width="300" height="375" fill="url(#${lid})"/>
      <path d="M-10 60C80 50 220 70 310 52" stroke="${costuraCor}" stroke-width="2" stroke-dasharray="7 5" fill="none" opacity=".8"/>
      <g transform="translate(150 196) rotate(-3)" filter="url(#${sid})">
        <rect x="-82" y="-54" width="164" height="108" rx="3" fill="#FBFAF6"/>
        <rect x="-74" y="-46" width="148" height="92" rx="2" fill="none" stroke="#C9C3B5" stroke-dasharray="3 2.5"/>
        <text x="0" y="-8" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-stretch="125%" font-weight="800" font-size="${marca.length > 9 ? 17 : 22}" fill="#14161B">${marca}</text>
        <line x1="-48" x2="48" y1="6" y2="6" stroke="#14161B" stroke-width=".8"/>
        <text x="0" y="28" text-anchor="middle" font-family="'DM Mono', ui-monospace, monospace" font-size="13" fill="#14161B">TAM ${peca.tamanho || ""}</text>
      </g></svg>`;
  }
  if (vista === 1) {   // no cabide, contra a parede
    const semCabide = forma.cabide === null;
    const y0 = semCabide ? 70 : 58;
    return `<svg viewBox="0 0 300 375" ${aria} xmlns="http://www.w3.org/2000/svg">${defs}
      <rect width="300" height="375" fill="${misturar(fundo.startsWith("#") ? fundo : "#ECEEF1", "#ffffff", .25)}"/>
      <rect width="300" height="375" fill="${fundo}" opacity=".55"/>
      <rect y="300" width="300" height="75" fill="#000" opacity=".04"/>
      <g transform="translate(${semCabide ? 33 : 42} ${y0}) scale(${semCabide ? 1.95 : 1.8})">
        ${semCabide ? "" : `<path d="M60 ${forma.cabide - 13}A5 5 0 1 1 63.3 ${forma.cabide - 16.2}" stroke="#5B5F66" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M60 ${forma.cabide - 13}V${forma.cabide - 9}${forma.prendedor ? `M34 ${forma.cabide - 1}H86` : `L30 ${forma.cabide + 2}H90L60 ${forma.cabide - 9}`}" stroke="#8B6A44" stroke-width="2.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
          ${forma.prendedor ? `<rect x="38" y="${forma.cabide - 3}" width="5" height="7" rx="1" fill="#5B5F66"/><rect x="77" y="${forma.cabide - 3}" width="5" height="7" rx="1" fill="#5B5F66"/>` : ""}`}
        ${semCabide && FORMA_DE[peca.categoria] === "tenis" ? `<g transform="translate(6 -14) scale(.94)" opacity=".92">${corpo(false)}</g>` : ""}
        ${corpo()}
      </g></svg>`;
  }
  // vista 0: flat lay com etiqueta kraft
  const etq = opts.semEtiqueta ? "" : etiquetaKraft(206, 28, 9, textoVolta(peca.vezesRevendida || 0), (peca.tamanho ? "TAM " + peca.tamanho : ""), 172, 70);
  return `<svg viewBox="0 0 300 375" ${aria} xmlns="http://www.w3.org/2000/svg">${defs}
    <rect width="300" height="375" fill="${fundo}"/>
    <g class="roupa" transform="translate(24 36) scale(2.1)">${corpo()}</g>
    ${etq}</svg>`;
}

// miniatura para listas e cabides da arara
function miniSvg(peca) {
  const k = ++_uid, forma = ROUPA[FORMA_DE[peca.categoria] || "camiseta"], cor = peca.cor || "#8A8F84";
  const pid = `mp${k}`, cid = `mc${k}`, lid = `ml${k}`, esc = misturar(cor, "#000", .32);
  return `<svg viewBox="0 0 120 150" aria-hidden="true"><defs>${padraoDef(pid, peca.padrao || "liso", cor)}<clipPath id="${cid}"><path d="${forma.d}"/></clipPath>
    <linearGradient id="${lid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
    ${forma.alca ? `<path d="${forma.alca}" fill="none" stroke="${esc}" stroke-width="5.5" stroke-linecap="round"/>` : ""}
    <path d="${forma.d}" fill="url(#${pid})"/>${forma.sola ? `<path d="${forma.sola}" fill="#F4F2EC"/>` : ""}
    <g clip-path="url(#${cid})"><rect width="120" height="150" fill="url(#${lid})"/></g>
    ${(forma.linhas || []).map(d => `<path d="${d}" stroke="${esc}" stroke-opacity=".5" stroke-width="1" fill="none"/>`).join("")}</svg>`;
}

// --- fotos 3D: cada peça vira uma especificação para o estúdio (window.Ciranda3D)
function spec3d(p) {
  const cat = p.categoria, cor = p.cor || "#8A8F84", pd = p.padrao || "liso";
  const top = (kind, print) => { const t = { kind, colour: cor }; if (print) t.print = print; return { forma: "top", top: t, cor: "" }; };
  if (cat === "Camisetas e blusas") return top(pd === "trico" ? "crewneck" : "tee", p.estampa || (pd === "listras" ? { kind: "stripes", colour: "#F3F0E8" } : null));
  if (cat === "Camisas") return top("shirt", p.estampa || (pd === "floral" ? { kind: "pattern", colours: [misturar(cor, "#000000", .3), "#E6DCC4", "#C7A46C", "#9FAE86", "#BF7350"] } : pd === "listras" ? { kind: "stripes", colour: "#F3F0E8" } : null));
  if (cat === "Jaquetas e casacos") return top("crewneck", { kind: "jacket", stitch: pd === "jeans" ? "#D9892B" : misturar(cor, "#000000", .4) });
  return { forma: { "Vestidos": "vestido", "Saias": "saia", "Calças jeans": "calca", "Calçados": "tenis", "Bolsas e acessórios": "bolsa" }[cat] || "calca", cor, padrao: cat === "Calças jeans" ? "jeans" : pd };
}
const tem3D = () => { try { return !!(window.Ciranda3D && window.Ciranda3D.disponivel()); } catch (e) { return false; } };
const YAW = [0, 1.05, Math.PI];
function fotoPeca(peca, vista = 0, opts = {}) {
  const alt = (peca.titulo || "").replace(/"/g, "&quot;");
  if (peca.fotos && peca.fotos.length) return `<span class="palco" style="display:block;width:100%;height:100%"><img class="foto-real" src="${peca.fotos[Math.min(vista, peca.fotos.length - 1)]}" alt="${alt}"></span>`;
  if (!tem3D()) return `<span class="palco" style="display:block;width:100%;height:100%">${arteRoupa(peca, vista, { semEtiqueta: true, fundo: "none" })}</span>`;
  const s = JSON.stringify(spec3d(peca)).replace(/"/g, "&quot;");
  return `<span class="palco" style="display:block;width:100%;height:100%"><img class="f3d" alt="${alt}" data-s="${s}" data-yaw="${YAW[vista] || 0}" data-w="${opts.w || 480}"></span>`;
}
const miniRoupa = (peca) => fotoPeca(peca, 0, { w: 200 });
// Fotos 3D sem travar a tela: só renderiza o que está perto de aparecer, uma por vez
// e nos intervalos livres do navegador. O resultado fica guardado para a próxima visita.
const CH_FOTOS = "ciranda-fotos-v2";
let _cacheFotos = {}; try { _cacheFotos = JSON.parse(localStorage.getItem(CH_FOTOS) || "{}"); } catch (e) {}
let _salvaFotos = 0;
function guardarFotos() {
  clearTimeout(_salvaFotos);
  _salvaFotos = setTimeout(() => { try { localStorage.setItem(CH_FOTOS, JSON.stringify(_cacheFotos)); } catch (e) { _cacheFotos = {}; try { localStorage.removeItem(CH_FOTOS); } catch (e2) {} } }, 1200);
}
const _fila = []; let _rodando = false;
const _livre = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 250 }) : (f) => setTimeout(f, 30);
function _proxima() {
  const img = _fila.shift();
  if (!img) { _rodando = false; return; }
  if (img.isConnected && !img.src) {
    const w = Number(img.dataset.w) || 480, k = img.dataset.s + "|" + img.dataset.yaw + "|" + w;
    let url = _cacheFotos[k];
    if (!url) { url = window.Ciranda3D.foto(JSON.parse(img.dataset.s), Number(img.dataset.yaw) || 0, w, Math.round(w * 1.25)); if (url) { _cacheFotos[k] = url; guardarFotos(); } }
    if (url) img.src = url; else img.removeAttribute("class");
  }
  _livre(_proxima);
}
const _olhoFoto = ("IntersectionObserver" in window) ? new IntersectionObserver((es) => es.forEach(e => {
  if (!e.isIntersecting) return; _olhoFoto.unobserve(e.target); _fila.push(e.target);
  if (!_rodando) { _rodando = true; _livre(_proxima); }
}), { rootMargin: "350px 0px" }) : null;
function preencher3D() {
  if (!tem3D()) return;
  document.querySelectorAll("img.f3d:not([src]):not([data-o])").forEach(img => {
    img.dataset.o = 1; img.decoding = "async";
    const w = Number(img.dataset.w) || 480, pronto = _cacheFotos[img.dataset.s + "|" + img.dataset.yaw + "|" + w];
    if (pronto) img.src = pronto;                       // já renderizada antes: aparece na hora
    else if (_olhoFoto) _olhoFoto.observe(img);
    else { _fila.push(img); if (!_rodando) { _rodando = true; _livre(_proxima); } }
  });
}
function nFotos(peca) { return peca.fotos && peca.fotos.length ? peca.fotos.length : 3; }
// cartões aparecem conforme entram na tela
const _olho = ("IntersectionObserver" in window) ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visto"); _olho.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" }) : null;
function revelar() {
  document.querySelectorAll(".revela:not([data-r])").forEach((el, i) => { el.dataset.r = 1; el.style.setProperty("--d", (i % 4) * 0.07 + "s"); if (_olho) _olho.observe(el); else el.classList.add("visto"); });
}
let _mutou = false;
new MutationObserver(() => { if (_mutou) return; _mutou = true; requestAnimationFrame(() => { _mutou = false; preencher3D(); revelar(); }); }).observe(document.documentElement, { childList: true, subtree: true });

// --- ícones (traço único 1.75)
const IC = {
  sacola: '<path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  busca: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
  pedidos: '<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5Z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/>',
  folha: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z"/><path d="M5 19 13 11"/>',
  sair: '<path d="M14 5H6v14h8"/><path d="M11 12h9m-3-3 3 3-3 3"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  caminhao: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  pessoas: '<circle cx="9" cy="9" r="3"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6.5a3 3 0 0 1 0 5.5M18 14c2 .7 3 2.4 3 5"/>',
  relogio: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  copiar: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  cabide: '<path d="M12 9a2.5 2.5 0 1 1 2.5-2.5"/><path d="M12 9v1.5L3.5 17h17L12 10.5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8" r="1.3"/>',
  gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  nuvem: '<path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9Z"/>',
  estrela: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6Z"/>',
  seta: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  voltar: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  painel: '<path d="M4 5h16v14H4zM4 10h16M10 10v9"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  lixo: '<path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/>',
};
const icone = (n, t = 20) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

function qrSvg(texto) {
  const N = 29; let h = 2166136261; const bits = [];
  for (let i = 0; i < N * N; i++) { h ^= texto.charCodeAt(i % texto.length) + i; h = Math.imul(h, 16777619); bits.push((h >>> 7) & 1); }
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" rx="1.4" fill="#14161B"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".6" fill="#14161B"/>`;
  const fora = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  let r = "";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!fora(x, y) && bits[y * N + x]) r += `<rect x="${x + .08}" y="${y + .08}" width=".84" height=".84" rx=".25"/>`;
  return `<svg viewBox="0 0 ${N} ${N}" width="100%" height="100%" role="img" aria-label="QR Code Pix de demonstração"><g fill="#14161B">${r}</g>${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}
    <g transform="translate(${N / 2 - 3.4} ${N / 2 - 3.4})"><rect width="6.8" height="6.8" rx="1.4" fill="#fff"/><g transform="translate(.5 .5) scale(.145)"><circle cx="14.5" cy="14.5" r="10" fill="none" stroke="#111" stroke-width="5" pathLength="63"/></g></g></svg>`;
}
