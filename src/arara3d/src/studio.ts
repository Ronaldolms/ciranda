// Estúdio 3D do Ciranda: fotos e visor giratório das peças.
// Blusas, camisas, moletons e jaquetas usam as peças drapeadas do Clothes Rack (DiMaac UI).
// Calças, saias, vestidos, calçados e bolsas são modelados aqui, em three.js, na mesma luz.
import * as THREE from "three";
import { createWardrobe, type Wardrobe, type GarmentSpec } from "./dimaac/clothes-rack/garment";

export type Spec3D = { forma: "top" | "calca" | "saia" | "vestido" | "tenis" | "bolsa"; top?: GarmentSpec; cor: string; padrao?: string };
type Obj = { object: THREE.Object3D; yaw(a: number): void; yaw0: number; alto?: number };

let S: { renderer: THREE.WebGLRenderer; wardrobe: Wardrobe; scene: THREE.Scene; camera: THREE.PerspectiveCamera; palco: THREE.Group } | null = null;
let falhou = false;
const objetos = new Map<string, Obj>();
const fotos = new Map<string, string>();

function estudio() {
  if (S || falhou) return S;
  try {
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.setClearColor(0x000000, 0);
    const wardrobe = createWardrobe(renderer);
    const scene = new THREE.Scene();
    scene.environment = wardrobe.environment;
    wardrobe.addLights(scene);
    const palco = new THREE.Group(); scene.add(palco);
    S = { renderer, wardrobe, scene, camera: new THREE.PerspectiveCamera(12, 0.8, 0.1, 80), palco };
  } catch (e) { falhou = true; S = null; }
  return S;
}

// ---------- tecido das peças modeladas aqui ----------
function mix(hex: string, alvo: string, a: number) { return "#" + new THREE.Color(hex).lerp(new THREE.Color(alvo), a).getHexString(); }
function tecido(cor: string, padrao = "liso", rep = 6) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
  g.fillStyle = cor; g.fillRect(0, 0, 256, 256);
  const esc = mix(cor, "#000000", 0.3), clr = mix(cor, "#ffffff", 0.35);
  if (padrao === "jeans") { g.strokeStyle = clr; g.globalAlpha = 0.5; g.lineWidth = 1.2; for (let i = -256; i < 512; i += 5) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); } g.globalAlpha = 1; }
  else if (padrao === "floral") { for (let i = 0; i < 9; i++) { const x = (i % 3) * 86 + 30 + ((i / 3) | 0) % 2 * 40, y = ((i / 3) | 0) * 86 + 40; for (let k = 0; k < 5; k++) { g.fillStyle = i % 2 ? "#F4E3C3" : clr; g.beginPath(); g.arc(x + 11 * Math.cos(k * 1.2566), y + 11 * Math.sin(k * 1.2566), 8, 0, 7); g.fill(); } g.fillStyle = esc; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } }
  else if (padrao === "listras") { g.fillStyle = "#F3F0E8"; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 256, 14); }
  else if (padrao === "linho" || padrao === "lona") { g.strokeStyle = esc; g.globalAlpha = 0.18; for (let y = 0; y < 256; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } for (let x = 0; x < 256; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } g.globalAlpha = 1; }
  // grão fino em todo tecido
  const d = g.getImageData(0, 0, 256, 256); let s = 7;
  for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const n = ((s % 23) - 11) * (padrao === "couro" ? 0.5 : 1); d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function pano(cor: string, padrao?: string, rep = 6) {
  const map = tecido(cor, padrao, rep);
  const couro = padrao === "couro";
  return new THREE.MeshPhysicalMaterial({ map, color: couro ? 0xd0d0d0 : 0xb4b4b4, bumpMap: map, bumpScale: couro ? 0.4 : 0.5, roughness: couro ? 0.5 : 0.95, clearcoat: couro ? 0.25 : 0, clearcoatRoughness: 0.5,
    envMapIntensity: couro ? 0.7 : 0.5, sheen: couro ? 0 : 0.25, sheenRoughness: 0.8, sheenColor: new THREE.Color(mix(cor, "#ffffff", 0.3)), side: THREE.DoubleSide });
}
const cromo = () => new THREE.MeshStandardMaterial({ color: 0xd9dbe0, metalness: 1, roughness: 0.22 });
const madeira = () => new THREE.MeshStandardMaterial({ color: 0xa97c50, roughness: 0.55 });

type Sec = { y: number; cx?: number; rx: number; rz: number; amp?: number };
function loft(secs: Sec[], ondas = 0, fase = 0, n = 96) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  secs.forEach((s) => { for (let j = 0; j <= n; j++) { const th = (j / n) * Math.PI * 2; const r = 1 + (s.amp || 0) * Math.sin(ondas * th + fase);
    pos.push((s.cx || 0) + s.rx * r * Math.cos(th), s.y, s.rz * r * Math.sin(th)); uv.push(j / n, s.y); } });
  for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// suaviza as seções com interpolação, para a peça não parecer facetada
function suave(secs: Sec[], passos = 6): Sec[] {
  const out: Sec[] = []; const h = (a: number, b: number, t: number) => a + (b - a) * (t * t * (3 - 2 * t));
  for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < passos; k++) { const t = k / passos, a = secs[i], b = secs[i + 1];
    out.push({ y: a.y + (b.y - a.y) * t, cx: h(a.cx || 0, b.cx || 0, t), rx: h(a.rx, b.rx, t), rz: h(a.rz, b.rz, t), amp: h(a.amp || 0, b.amp || 0, t) }); }
  out.push(secs[secs.length - 1]); return out;
}
function gancho(y = 0.062) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0042, 10, 40, Math.PI * 1.45), cromo()); m.position.y = y; m.rotation.z = -Math.PI * 0.22; const g = new THREE.Group(); g.add(m);
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.04, 8), cromo()); haste.position.y = y - 0.045; g.add(haste); return g; }
function cabideMadeira() { const curva = new THREE.CatmullRomCurve3([[-0.2, -0.078], [-0.1, -0.03], [0, 0], [0.1, -0.03], [0.2, -0.078]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.011, 10), madeira())); g.add(gancho()); return g; }
function cabidePregador(larg = 0.36) { const g = new THREE.Group(); const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, larg, 10), cromo()); barra.rotation.z = Math.PI / 2; g.add(barra);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.03), cromo()); p.position.set(s * larg * 0.36, -0.022, 0); g.add(p); } g.add(gancho()); return g; }

function calca(cor: string, padrao?: string): THREE.Group {
  const g = new THREE.Group(); const m = pano(cor, padrao || "jeans", 7);
  g.add(new THREE.Mesh(loft(suave([{ y: -0.035, rx: 0.18, rz: 0.018 }, { y: -0.08, rx: 0.186, rz: 0.05 }, { y: -0.2, rx: 0.198, rz: 0.092 }, { y: -0.3, rx: 0.2, rz: 0.1 }])), m));
  for (const s of [-1, 1]) g.add(new THREE.Mesh(loft(suave([{ y: -0.29, cx: s * 0.1, rx: 0.1, rz: 0.098 }, { y: -0.45, cx: s * 0.102, rx: 0.092, rz: 0.088, amp: 0.012 }, { y: -0.72, cx: s * 0.106, rx: 0.084, rz: 0.076, amp: 0.03 }, { y: -1.0, cx: s * 0.11, rx: 0.08, rz: 0.07, amp: 0.02 }]), 5, s), m));
  const cos = pano(mix(cor, "#000000", 0.22), padrao || "jeans", 7);
  g.add(new THREE.Mesh(loft([{ y: -0.03, rx: 0.184, rz: 0.021 }, { y: -0.068, rx: 0.19, rz: 0.046 }]), cos));
  const pesp = new THREE.MeshStandardMaterial({ color: 0xc98a3a, roughness: 0.8, side: THREE.DoubleSide });
  for (const s of [-1, 1]) g.add(new THREE.Mesh(loft([{ y: -0.972, cx: s * 0.11, rx: 0.0815, rz: 0.0715 }, { y: -0.978, cx: s * 0.11, rx: 0.0815, rz: 0.0715 }]), pesp));
  const botao = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 16), new THREE.MeshStandardMaterial({ color: 0xb9b3a6, metalness: 0.9, roughness: 0.35 })); botao.rotation.x = Math.PI / 2; botao.position.set(0, -0.05, 0.034); g.add(botao);
  g.add(cabidePregador()); return g;
}
function saia(cor: string, padrao?: string): THREE.Group {
  const g = new THREE.Group(); const m = pano(cor, padrao, 6);
  g.add(new THREE.Mesh(loft(suave([{ y: -0.035, rx: 0.16, rz: 0.018 }, { y: -0.075, rx: 0.165, rz: 0.05, amp: 0.004 }, { y: -0.25, rx: 0.215, rz: 0.125, amp: 0.035 }, { y: -0.66, rx: 0.3, rz: 0.2, amp: 0.085 }], 8), 16), m));
  g.add(new THREE.Mesh(loft([{ y: -0.03, rx: 0.163, rz: 0.021 }, { y: -0.07, rx: 0.168, rz: 0.05 }]), pano(mix(cor, "#000000", 0.2), padrao, 6)));
  g.add(cabidePregador(0.32)); return g;
}
function vestido(cor: string, padrao?: string): THREE.Group {
  const g = new THREE.Group(); const m = pano(cor, padrao, 5);
  g.add(new THREE.Mesh(loft(suave([{ y: -0.21, rx: 0.145, rz: 0.062 }, { y: -0.3, rx: 0.158, rz: 0.086 }, { y: -0.46, rx: 0.125, rz: 0.074 }, { y: -0.62, rx: 0.2, rz: 0.14, amp: 0.04 }, { y: -1.04, rx: 0.3, rz: 0.22, amp: 0.1 }], 8), 9), m));
  for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.095, -0.036, 0), new THREE.Vector3(s * 0.088, -0.12, 0.02), new THREE.Vector3(s * 0.085, -0.215, 0.055)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.009, 8), m));
    const c2 = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.095, -0.036, 0), new THREE.Vector3(s * 0.088, -0.12, -0.02), new THREE.Vector3(s * 0.085, -0.215, -0.055)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(c2, 12, 0.009, 8), m)); }
  g.add(cabideMadeira()); return g;
}
function pe(cor: string, padrao?: string) {
  const g = new THREE.Group();
  // cabedal: anéis elípticos ao longo do comprimento do pé
  const P: [number, number, number][] = [[0.0, 0.05, 0.05], [0.012, 0.19, 0.13], [0.05, 0.235, 0.15], [0.1, 0.24, 0.155], [0.17, 0.215, 0.16], [0.24, 0.22, 0.165], [0.32, 0.18, 0.175], [0.4, 0.135, 0.18], [0.48, 0.1, 0.17], [0.54, 0.075, 0.13], [0.565, 0.05, 0.05]];
  const secs = suave(P.map(([x, h, w]) => ({ y: x, cx: h / 2 + 0.035, rx: h / 2, rz: w / 2 })), 5);
  const geo = loft(secs, 0, 0, 48); geo.rotateZ(-Math.PI / 2); geo.scale(1, -1, 1); geo.computeVertexNormals();
  const corpo = new THREE.Mesh(geo, pano(cor, padrao || "lona", 5)); corpo.rotation.z = Math.PI; corpo.scale.set(-1, -1, 1); g.add(corpo);
  const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.004, 28), new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 1 })); boca.scale.set(1.35, 1, 0.9); boca.position.set(0.1, 0.272, 0); boca.rotation.z = -0.08; g.add(boca);
  const so = new THREE.Shape(); so.moveTo(-0.02, 0); so.lineTo(0.585, 0); so.quadraticCurveTo(0.6, 0.03, 0.585, 0.055); so.lineTo(-0.02, 0.055); so.quadraticCurveTo(-0.035, 0.03, -0.02, 0);
  const sola = new THREE.Mesh(new THREE.ExtrudeGeometry(so, { depth: 0.16, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.02, bevelSegments: 4 }), new THREE.MeshStandardMaterial({ color: 0xd9d6cd, roughness: 0.7, envMapIntensity: 0.5 })); sola.position.z = -0.08; g.add(sola);
  const friso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.007, 0.205), new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.8 })); friso.position.set(0.282, 0.05, 0); g.add(friso);
  const bico = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd9d6cd, roughness: 0.65, envMapIntensity: 0.5 })); bico.scale.set(1.05, 0.75, 1.12); bico.position.set(0.5, 0.05, 0); g.add(bico);
  const cad = new THREE.MeshStandardMaterial({ color: 0x8d8a82, roughness: 0.8 });
  for (let i = 0; i < 5; i++) { const t = i / 4; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.085, 8), cad); c.rotation.x = Math.PI / 2; c.rotation.y = i % 2 ? 0.25 : -0.25; c.position.set(0.25 + t * 0.15, 0.262 - t * 0.085, 0); g.add(c); }
  return g;
}
function tenis(cor: string, padrao?: string): THREE.Group { const g = new THREE.Group(); const a = pe(cor, padrao); a.position.set(-0.28, 0, 0.1); g.add(a); const b = pe(cor, padrao); b.position.set(-0.2, 0, -0.14); b.rotation.y = 0.18; g.add(b); return g; }
function bolsa(cor: string): THREE.Group {
  const g = new THREE.Group(); const m = pano(cor, "couro", 3);
  const r = (w1: number, w2: number, h: number, raio: number) => { const s = new THREE.Shape(); s.moveTo(-w1 / 2 + raio, 0); s.lineTo(w1 / 2 - raio, 0); s.quadraticCurveTo(w1 / 2, 0, w1 / 2, raio); s.lineTo(w2 / 2, h - raio); s.quadraticCurveTo(w2 / 2, h, w2 / 2 - raio, h); s.lineTo(-w2 / 2 + raio, h); s.quadraticCurveTo(-w2 / 2, h, -w2 / 2, h - raio); s.lineTo(-w1 / 2, raio); s.quadraticCurveTo(-w1 / 2, 0, -w1 / 2 + raio, 0); return s; };
  const corpo = new THREE.Mesh(new THREE.ExtrudeGeometry(r(0.5, 0.44, 0.34, 0.05), { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 8 }), m); corpo.position.z = -0.04; g.add(corpo);
  const aba = new THREE.Shape(); aba.moveTo(-0.235, 0.335); aba.lineTo(0.235, 0.335); aba.lineTo(0.245, 0.2); aba.quadraticCurveTo(0, 0.1, -0.245, 0.2); aba.closePath();
  const abaM = new THREE.Mesh(new THREE.ExtrudeGeometry(aba, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 3 }), pano(mix(cor, "#000000", 0.12), "couro", 3)); abaM.position.z = 0.072; g.add(abaM);
  const fecho = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0xc9a45a, metalness: 1, roughness: 0.3 })); fecho.rotation.x = Math.PI / 2; fecho.position.set(0, 0.165, 0.094); g.add(fecho);
  const alca = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 0.33, 0), new THREE.Vector3(-0.17, 0.62, 0), new THREE.Vector3(0, 0.78, 0), new THREE.Vector3(0.17, 0.62, 0), new THREE.Vector3(0.2, 0.33, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(alca, 60, 0.008, 8), m)); return g;
}

const chave = (s: Spec3D) => JSON.stringify(s);
function objeto(spec: Spec3D): Obj | null {
  const st = estudio(); if (!st) return null;
  const k = chave(spec); const tem = objetos.get(k); if (tem) return tem;
  let o: Obj;
  if (spec.forma === "top" && spec.top) { const g = st.wardrobe.garment(spec.top, "wood"); g.hook.rotation.y = Math.PI / 2; o = { object: g.object, yaw: (a) => { g.turn.rotation.y = a; }, yaw0: 0 }; }
  else { const grp = spec.forma === "calca" ? calca(spec.cor, spec.padrao) : spec.forma === "saia" ? saia(spec.cor, spec.padrao) : spec.forma === "vestido" ? vestido(spec.cor, spec.padrao) : spec.forma === "tenis" ? tenis(spec.cor, spec.padrao) : bolsa(spec.cor);
    o = { object: grp, yaw: (a) => { grp.rotation.y = a; }, yaw0: spec.forma === "tenis" ? -0.65 : spec.forma === "bolsa" ? -0.35 : 0, alto: spec.forma === "tenis" ? 1.6 : spec.forma === "bolsa" ? 0.25 : 0 }; }
  objetos.set(k, o); return o;
}
function desenhar(o: Obj, yaw: number, w: number, h: number) {
  const st = S!; st.palco.clear(); st.palco.add(o.object);
  o.yaw(0); o.object.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(o.object); const tam = caixa.getSize(new THREE.Vector3()), centro = caixa.getCenter(new THREE.Vector3());
  const lado = Math.max(tam.x, tam.z) * (o.alto && o.alto > 1 ? 1.25 : 1);
  o.yaw(yaw + o.yaw0);
  const asp = w / h, fov = (12 * Math.PI) / 180;
  const dist = Math.max((tam.y * (o.alto && o.alto > 1 ? 1.45 : 1.16)) / 2 / Math.tan(fov / 2), (lado * 1.14) / 2 / Math.tan(fov / 2) / asp);
  st.camera.aspect = asp; st.camera.near = dist * 0.2; st.camera.far = dist * 4;
  st.camera.position.set(0, centro.y + tam.y * 0.04 + (o.alto || 0) * tam.y * 2.2, dist); st.camera.lookAt(0, centro.y, 0); st.camera.updateProjectionMatrix();
  if (st.renderer.domElement.width !== w || st.renderer.domElement.height !== h) st.renderer.setSize(w, h, false);
  st.renderer.render(st.scene, st.camera);
  return st.renderer.domElement;
}
export function disponivel() { return !!estudio(); }
export function foto(spec: Spec3D, yaw = 0, w = 480, h = 600): string | null {
  const k = chave(spec) + "|" + yaw + "|" + w; const tem = fotos.get(k); if (tem) return tem;
  const o = objeto(spec); if (!o) return null;
  try { const url = desenhar(o, yaw, w, h).toDataURL("image/webp", 0.82); fotos.set(k, url); return url; } catch (e) { return null; }
}
// Visor giratório: arraste para girar. Desenha num canvas 2D da página a partir do estúdio.
export function visor(alvo: HTMLCanvasElement, spec: Spec3D) {
  const o = objeto(spec); if (!o) return null;
  const ctx = alvo.getContext("2d")!; let yaw = 0.5, vel = 0, meta: number | null = 0, vivo = true, arr = false, x0 = 0, ult = performance.now(), parado = 0;
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pintar = () => { const r = alvo.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 1.5); const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (alvo.width !== w || alvo.height !== h) { alvo.width = w; alvo.height = h; } const src = desenhar(o, yaw, w, h); ctx.clearRect(0, 0, w, h); ctx.drawImage(src, 0, 0); };
  let naTela = true, par = false; const io = new IntersectionObserver((r) => { naTela = r[0].isIntersecting; }); io.observe(alvo);
  const quadro = (t: number) => { if (!vivo || !alvo.isConnected) { vivo = false; io.disconnect(); return; } if (document.hidden || !naTela) { ult = t; requestAnimationFrame(quadro); return; } const dt = Math.min(0.05, (t - ult) / 1000); ult = t; let mexeu = false;
    if (meta !== null) { const d = meta - yaw; if (Math.abs(d) > 0.002) { yaw += d * Math.min(1, dt * 7); mexeu = true; } else { yaw = meta; meta = null; mexeu = true; } }
    else if (!arr && Math.abs(vel) > 0.01) { yaw += vel * dt; vel *= Math.pow(0.04, dt); mexeu = true; }
    else if (!arr && !calmo) { parado += dt; if (parado > 2.5) { yaw += dt * 0.35; par = !par; mexeu = par; } }
    if (mexeu || arr) pintar(); requestAnimationFrame(quadro); };
  alvo.style.touchAction = "pan-y"; alvo.style.cursor = "grab";
  alvo.addEventListener("pointerdown", (e) => { arr = true; meta = null; x0 = e.clientX; vel = 0; parado = 0; alvo.setPointerCapture(e.pointerId); alvo.style.cursor = "grabbing"; });
  alvo.addEventListener("pointermove", (e) => { if (!arr) return; const dx = e.clientX - x0; x0 = e.clientX; yaw += dx * 0.012; vel = dx * 0.6; });
  const solta = () => { arr = false; parado = 0; alvo.style.cursor = "grab"; }; alvo.addEventListener("pointerup", solta); alvo.addEventListener("pointercancel", solta);
  alvo.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") { meta = (meta ?? yaw) - 0.5; parado = 0; } if (e.key === "ArrowRight") { meta = (meta ?? yaw) + 0.5; parado = 0; } });
  pintar(); requestAnimationFrame(quadro);
  return { girarPara(a: number) { const voltas = Math.round((yaw - a) / (Math.PI * 2)); meta = a + voltas * Math.PI * 2; parado = 0; }, destruir() { vivo = false; } };
}
