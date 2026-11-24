/* =====================================================================
   Telas (fronteiras). Toda a compra passa pela FachadaDeCompra.
   ===================================================================== */
const app = $("#app");
let filtros = { q: "", categoria: "", tamanho: "", ordem: "novas" };
let fotoAtiva = 0;
let pubFotos = [];
let rascunho = null;
let ultimaRota = "";
const reduzMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

function ir(h) { if (location.hash === h) render(); else location.hash = h; }
function toast(t, tipo = "") {
  const el = document.createElement("div"); el.className = "toast " + tipo;
  el.innerHTML = (tipo === "erro" ? icone("info", 18) : icone("check", 18)) + `<span>${esc(t)}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("sai"); setTimeout(() => el.remove(), 320); }, 4200);
}
const SIT = {
  "Disponível": "verde", "Pago": "azul", "Entregue": "verde", "Aguardando pagamento": "ambar", "Reservada": "ambar", "Aguardando aprovação": "ambar",
  "Cancelado": "vermelho", "Reprovada": "vermelho", "Enviado": "azul", "Em separação": "azul", "Vendida": "", "Em finalização": "ambar",
};
const sit = (s) => `<span class="sit ${SIT[s] ?? ""}">${esc(s)}</span>`;
const CORES_AVATAR = { Cliente: "#2338E0", Fornecedor: "#B5654A", Administradora: "#14161B" };
const iniciais = (n) => n.split(" ").map(x => x[0]).slice(0, 2).join("");
const cabideSvg = (gancho, barra) => `<svg class="gancho" viewBox="0 0 96 40" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M48 17V13A6 6 0 1 0 42 7" stroke="${gancho}" stroke-width="2.4"/><path d="M48 17 12 34Q9 36 12 37H84Q87 36 84 34Z" stroke="${barra}" stroke-width="3.2"/></svg>`;
const ganchoSvg = cabideSvg("#5B5F66", "#8B6A44");
const ganchoBranco = cabideSvg("rgba(255,255,255,.9)", "rgba(255,255,255,.9)");

function contar(el, alvo, casas = 0, dur = 1100, sufixo = "") {
  if (!el) return;
  if (reduzMovimento) { el.textContent = num(alvo, casas) + sufixo; return; }
  const t0 = performance.now();
  const passo = (t) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = num(alvo * e, casas) + sufixo;
    if (p < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
function transicao(fn) {
  if (document.startViewTransition && !reduzMovimento) document.startViewTransition(fn); else fn();
}

/* ---------------- moldura */
const MENU = {
  Cliente: [["catalogo", "Catálogo", "cabide"], ["pedidos", "Pedidos", "pedidos"], ["impacto", "Impacto", "folha"]],
  Fornecedor: [["minhas-pecas", "Minhas peças", "tag"], ["publicar", "Publicar", "mais"], ["catalogo", "Catálogo", "cabide"]],
  Administradora: [["aprovacoes", "Aprovações", "check"], ["entregas", "Entregas", "caminhao"], ["fornecedores", "Fornecedores", "pessoas"], ["publicar", "Publicar", "mais"], ["catalogo", "Catálogo", "cabide"]],
};
function bolhaDe(r, u) {
  const n = r === "aprovacoes" ? db.pecas.filter(p => p.situacao === "Aguardando aprovação").length
    : r === "entregas" ? db.pedidos.filter(p => p.situacao === "Pago").length
    : r === "pedidos" ? db.pedidos.filter(p => p.cliente === u.id && p.situacao === "Aguardando pagamento").length : 0;
  return n ? `<span class="bolha">${n}</span>` : "";
}
let desmontarArara = null, visorAtual = null;
function pagina(u, conteudo) {
  const rota = location.hash.split("/")[1] || "";
  const novaRota = location.hash !== ultimaRota; ultimaRota = location.hash;
  if (desmontarArara) { try { desmontarArara(); } catch (e) {} desmontarArara = null; }
  if (visorAtual) { visorAtual.destruir(); visorAtual = null; }
  const itens = MENU[u.papel];
  const nSacola = (db.sacola[u.id] || []).length;
  app.innerHTML = `
  <div class="faixa">MVP acadêmico. Pix e entrega são simulados, nenhuma compra é real.</div>
  <header class="topo"><div class="topo-in">
    <nav class="abas" aria-label="Principal">${itens.map(([r, t]) => `<a href="#/${r}" ${rota === r ? 'aria-current="page"' : ""}>${t}${bolhaDe(r, u)}</a>`).join("")}</nav>
    <a class="marca-link" href="#/${itens[0][0]}" aria-label="Ciranda, início">${logoCompleto(30)}</a>
    <div class="conta">
      <span class="quem">${esc(u.nome.split(" ")[0])}, ${u.papel.toLowerCase()}</span>
      ${u.papel === "Cliente" ? `<a id="btSacola" href="#/sacola">Sacola${nSacola ? ` <span class="bolha">${nSacola}</span>` : ""}</a>` : ""}
      <button data-acao="sair">Sair</button>
    </div>
  </div></header>
  <main id="conteudo" class="${novaRota && !document.startViewTransition ? "entra" : ""}">${conteudo}</main>
  <footer class="rodape"><span>Ciranda · MVP de Análise e Projeto de Sistemas, CEUB 2026. Arara 3D: Clothes Rack, de DiMaac UI.</span>
    <button class="bt-link bt" data-acao="reiniciar">Restaurar dados de demonstração</button></footer>
  <nav class="barra" aria-label="Atalhos">${itens.slice(0, 4).map(([r, t]) => `<a href="#/${r}" ${rota === r ? 'aria-current="page"' : ""}>${t}${bolhaDe(r, u)}</a>`).join("")}
    ${u.papel === "Cliente" ? `<a href="#/sacola" ${rota === "sacola" ? 'aria-current="page"' : ""}>Sacola${nSacola ? `<span class="bolha">${nSacola}</span>` : ""}</a>` : ""}</nav>`;
}

/* ---------------- login (UC10) */
function telaLogin(modo = "entrar") {
  const vitrine = ["PC04", "PC03", "PC02"].map(Repositorio.peca).filter(Boolean);
  app.innerHTML = `<div class="login">
    <section class="lado">
      <a class="marca-link" href="#/entrar" aria-label="Ciranda">${logoCompleto(34)}</a>
      <div><h1>A peça não termina no seu armário.</h1>
        <p>Brechó em que cada peça mostra quantas voltas já deu e quanto de água e carbono deixou de ser gasto.</p></div>
      <div class="trio" aria-hidden="true">${vitrine.map(p => `<span>${fotoPeca(p, 0)}</span>`).join("")}</div>
    </section>
    <section class="form-lado"><div class="caixa entra">
      ${modo === "entrar" ? `
      <h2>Entrar</h2>
      <p class="mudo" style="margin:6px 0 4px">Escolha um perfil de demonstração. Senha de todos: <strong>ciranda123</strong>.</p>
      <div class="perfis entra-lista">
        ${[["ana@ciranda.app", "Ana Costa", "Cliente", "Compra, paga no Pix e junta pontos"],
           ["beatriz@ciranda.app", "Beatriz Ribeiro", "Fornecedor", "Publica peças em consignação"],
           ["lucia@ciranda.app", "Lúcia Andrade", "Administradora", "Aprova peças e despacha pedidos"]].map(([e, n, p, d]) =>
          `<button type="button" class="perfil" data-acao="demo" data-email="${e}"><span><strong>${n}</strong><small>${p}. ${d}</small></span><span class="seta">${icone("seta", 18)}</span></button>`).join("")}
      </div>
      <details style="margin-top:22px"><summary class="bt-link" style="cursor:pointer">Entrar com e-mail e senha</summary>
        <form class="form" id="fLogin" novalidate style="margin-top:16px">
          <label class="campo">E-mail<input name="email" type="email" autocomplete="username" required></label>
          <label class="campo">Senha<input name="senha" type="password" autocomplete="current-password" required></label>
          <div id="erroLogin" role="alert"></div>
          <button class="bt bt-pri bt-larg" type="submit">Entrar</button>
        </form></details>
      <p class="peq" style="margin-top:18px">Ainda não tem conta? <button class="bt bt-link" data-acao="ir-cadastro">Criar conta de cliente</button></p>`
      : `
      <h2>Criar conta</h2>
      <p class="mudo" style="margin:6px 0 22px">Conta de cliente. Fornecedores são cadastrados pela administradora.</p>
      <form class="form" id="fCadastro" novalidate>
        <label class="campo">Nome completo<input name="nome" autocomplete="name" required></label>
        <label class="campo">E-mail<input name="email" type="email" autocomplete="email" required></label>
        <label class="campo">Senha<input name="senha" type="password" autocomplete="new-password" minlength="8" required><span class="ajuda">Pelo menos 8 caracteres.</span></label>
        <div id="erroCad" role="alert"></div>
        <button class="bt bt-pri bt-larg" type="submit">Criar conta</button>
      </form>
      <p class="peq" style="margin-top:20px">Já tem conta? <button class="bt bt-link" data-acao="ir-login">Entrar</button></p>`}
    </div></section></div>`;
}

/* ---------------- catálogo (UC02) */
function cardPeca(p, u, opts = {}) {
  const f = ImpactoPontos.fator(p);
  const naSacola = u && (db.sacola[u.id] || []).includes(p.id);
  const podeAdd = u && u.papel === "Cliente" && p.situacao === "Disponível" && !opts.previa;
  const v = p.vezesRevendida || 0;
  return `<article class="peca${opts.previa ? "" : " revela"}" data-peca="${p.id || ""}">
    <div class="foto">${fotoPeca(p)}${p.conservacao === "Novo com etiqueta" ? `<span class="selo">Novo com etiqueta</span>` : ""}
      <span class="voltas">${v + 1}ª volta</span>
    </div>
    ${opts.previa ? "" : `<a class="link-cobre" href="#/peca/${p.id}" aria-label="${esc(p.titulo)}"></a>`}
    <div class="corpo"><div class="tit">${esc(p.titulo || "Título da peça")}</div><div class="meta">${esc(p.marca || "Marca")} · ${esc(p.tamanho || "tam.")} · ${esc(p.conservacao || "")}</div></div>
    <div class="rod"><span class="preco">${brl(p.preco || 0)}</span>${f ? `<span class="eco">evita ${num(f.co2, 1)} kg CO₂e</span>` : `<span class="eco sem">sem fator de impacto</span>`}</div>
    ${podeAdd ? `<button class="add ${naSacola ? "na-sacola" : ""}" data-acao="${naSacola ? "ir-sacola" : "add-rapido"}" data-id="${p.id}">${naSacola ? "Na sacola ✓" : "Colocar na sacola"}</button>` : ""}
  </article>`;
}
function listaCatalogo() {
  let lista = Catalogo.disponiveis(filtros);
  if (filtros.ordem === "menor") lista = lista.slice().sort((a, b) => a.preco - b.preco);
  if (filtros.ordem === "impacto") lista = lista.slice().sort((a, b) => (ImpactoPontos.fator(b)?.co2 || 0) - (ImpactoPontos.fator(a)?.co2 || 0));
  return lista;
}
function gradeHtml(u) {
  const lista = listaCatalogo();
  const c = $("#contaPecas"); if (c) c.textContent = `${lista.length} ${lista.length === 1 ? "peça" : "peças"}`;
  const t = $("#tituloGrade"); if (t) t.textContent = filtros.categoria || "Todas as peças";
  return (lista.length ? `<div class="vitrine">${lista.map(p => cardPeca(p, u)).join("")}</div>` :
    `<div class="vazio"><h3>Nada na arara com esses filtros</h3><p>Tente outro tamanho ou volte para todas as categorias.</p><p style="margin-top:16px"><button class="bt bt-sec" data-acao="limpar-filtros">Limpar filtros</button></p></div>`);
}
function atualizarGrade(u) {
  const g = $("#grade"); if (!g) return render();
  g.innerHTML = gradeHtml(u);
  document.querySelectorAll(".cats button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === filtros.categoria)));
}
function telaCatalogo(u) {
  const naArara = Catalogo.disponiveis({}).filter(p => spec3d(p).forma === "top" && !(p.fotos && p.fotos.length)).slice(0, 10);
  pagina(u, `
    <section class="vitrine-topo" aria-label="Arara">
      <div class="texto"><h1 aria-label="Roupa boa não acaba. Ela dá voltas.">${"Roupa boa não acaba. Ela dá voltas.".split(" ").map((w, i) => `<span class="pal" aria-hidden="true"><i style="--i:${i}">${w}</i></span>`).join(" ")}</h1><p>${tem3D() ? "Toque numa peça da arara para ela virar para você." : "Toque numa peça para ver os detalhes."}</p></div>
      <div class="selo-gira" aria-hidden="true"><svg class="txt" viewBox="0 0 120 120"><defs><path id="circ" d="M60 60m-48 0a48 48 0 1 1 96 0a48 48 0 1 1 -96 0"/></defs><text font-family="DM Mono,monospace" font-size="9.6" fill="#17130F"><textPath href="#circ" textLength="298" lengthAdjust="spacing">CADA PEÇA DÁ VOLTAS · CADA PEÇA DÁ VOLTAS · </textPath></text></svg><span class="meio"><span>${Catalogo.disponiveis({}).length}<small>peças na roda</small></span></span></div>
      <span class="dica">${naArara.length} de ${Catalogo.disponiveis({}).length} peças na arara</span>
      <div id="arara">${tem3D() ? "" : `<div class="sem3d">${naArara.map(p => `<a href="#/peca/${p.id}" style="aspect-ratio:4/5">${fotoPeca(p)}</a>`).join("")}</div>`}</div>
    </section>
    <div class="fita" aria-hidden="true"><div class="fita-in">${[0, 1].map(() => `<span>Cada peça mostra <b>quantas voltas</b> já deu</span><span>Uma calça jeans usada poupa <b>21 kg de CO₂e</b></span><span>Compra paga vira <b>pontos</b></span><span>Pix com reserva de <b>30 minutos</b></span><span>Quem vende recebe <b>60%</b> do preço</span>`).join("")}</div></div>
    <div class="secao-topo"><h2 id="tituloGrade">${esc(filtros.categoria || "Todas as peças")}</h2><span class="conta-pecas" id="contaPecas">${(n => `${n} ${n === 1 ? "peça" : "peças"}`)(listaCatalogo().length)}</span></div>
    <section class="filtros" aria-label="Busca e filtros">
      <div class="cats" role="group" aria-label="Categoria"><button data-acao="cat" data-v="" aria-pressed="${!filtros.categoria}">Tudo</button>${CATEGORIAS.map(c => `<button data-acao="cat" data-v="${esc(c.nome)}" aria-pressed="${filtros.categoria === c.nome}">${esc(c.nome)}</button>`).join("")}</div>
      <div class="ferr">
        <label class="busca-campo">${icone("busca", 17)}<span class="oculto">Buscar</span><input id="q" type="search" value="${esc(filtros.q)}" placeholder="Buscar peça, marca ou cor" autocomplete="off"></label>
        <select class="sel" id="tam" aria-label="Tamanho"><option value="">Tamanho</option>${TAMANHOS.map(t => `<option ${t === filtros.tamanho ? "selected" : ""}>${t}</option>`).join("")}</select>
        <select class="sel" id="ordem" aria-label="Ordenar"><option value="novas" ${filtros.ordem === "novas" ? "selected" : ""}>Mais novas</option><option value="menor" ${filtros.ordem === "menor" ? "selected" : ""}>Menor preço</option><option value="impacto" ${filtros.ordem === "impacto" ? "selected" : ""}>Maior impacto</option></select>
      </div>
    </section>
    <div id="grade">${gradeHtml(u)}</div>`);
  if (tem3D() && naArara.length) {
    const itens = naArara.map(p => Object.assign({ name: `${p.titulo} · ${brl(p.preco)}` }, spec3d(p).top));
    try { desmontarArara = window.Ciranda3D.arara($("#arara"), itens, (i) => ir(`#/peca/${naArara[i].id}`), { size: innerWidth < 700 ? 0.42 : 0.56, gap: innerWidth < 700 ? 4 : 14, showCaption: innerWidth >= 700, breeze: matchMedia('(hover:none)').matches ? 0 : 0.5 }); } catch (e) {}
  }
}
function arrastar(el) {
  if (!el) return;
  let x0 = 0, s0 = 0, ativo = false, moveu = false;
  el.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; ativo = true; moveu = false; x0 = e.clientX; s0 = el.scrollLeft; });
  window.addEventListener("pointermove", e => { if (!ativo) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moveu = true; el.classList.add("arrastando"); } el.scrollLeft = s0 - dx; });
  window.addEventListener("pointerup", () => { ativo = false; setTimeout(() => el.classList.remove("arrastando"), 0); });
  el.addEventListener("click", e => { if (moveu) { e.preventDefault(); moveu = false; } }, true);
}

/* ---------------- detalhe */
function telaPeca(u, pid) {
  const p = Repositorio.peca(pid);
  if (!p) return pagina(u, `<div class="vazio"><h3>Peça não encontrada</h3><p><a href="#/catalogo">Voltar ao catálogo</a></p></div>`);
  const f = ImpactoPontos.fator(p);
  const naSacola = (db.sacola[u.id] || []).includes(p.id);
  const n = nFotos(p); if (fotoAtiva >= n) fotoAtiva = 0;
  const forn = Repositorio.fornecedor(p.fornecedor);
  const nivel = { "Novo com etiqueta": 4, "Ótimo estado": 3, "Bom estado": 2, "Marcas de uso": 1 }[p.conservacao] || 2;
  const voltas = p.vezesRevendida || 0;
  const usaVisor = tem3D() && !(p.fotos && p.fotos.length);
  pagina(u, `
    <p class="peq" style="margin-bottom:18px"><a href="#/catalogo" style="display:inline-flex;gap:6px;align-items:center;font-weight:600;text-decoration:none">${icone("voltar", 16)} Catálogo</a> <span class="mudo">/ ${esc(p.categoria)}</span></p>
    <div class="grade2">
      <div class="galeria">
        <div class="principal palco" id="fotoPrincipal">${usaVisor ? `<canvas id="visor" tabindex="0" aria-label="Peça em 3D. Arraste ou use as setas para girar."></canvas><span class="gire">Arraste para girar</span>` : fotoPeca(p, fotoAtiva, { w: 720 })}</div>
        ${usaVisor ? `<div class="angulos" role="group" aria-label="Ângulo">${["Frente", "Lado", "Costas"].map((t, i) => `<button type="button" data-acao="angulo" data-a="${YAW[i]}">${t}</button>`).join("")}</div>`
          : `<div class="miniaturas" role="group" aria-label="Fotos da peça">${Array.from({ length: n }, (_, i) => `<button type="button" data-acao="foto" data-i="${i}" aria-pressed="${i === fotoAtiva}" aria-label="Foto ${i + 1}">${fotoPeca(p, i, { w: 200 })}</button>`).join("")}</div>`}
      </div>
      <div>
        <p class="mudo">${esc(p.marca)} · vendido por ${esc(forn ? forn.nome : "Ciranda")}</p>
        <h1 style="margin:8px 0 16px;font-size:clamp(2rem,3.4vw,2.9rem)">${esc(p.titulo)}</h1>
        <p class="preco" style="font-size:1.25rem">${brl(p.preco)}</p>
        <div style="margin-top:20px">
        ${p.situacao === "Disponível" ? (u.papel === "Cliente" ?
          (naSacola ? `<a class="bt bt-sec bt-larg" href="#/sacola">Na sacola. Ver sacola</a>`
                    : `<button class="bt bt-pri bt-larg" data-acao="add-sacola" data-id="${p.id}">Colocar na sacola</button>`)
          : `<p class="aviso info">${icone("info", 18)} Só clientes compram. Você está como ${u.papel.toLowerCase()}.</p>`)
          : `<p class="aviso alerta">${icone("relogio", 18)} ${p.situacao === "Reservada" ? "Alguém está pagando por esta peça agora. Se o Pix não cair em 30 minutos, ela volta para a arara." : "Esta peça não está mais disponível."}</p>`}
        </div>
        <p style="margin-top:22px;max-width:58ch">${esc(p.descricao || "")}</p>
        <dl class="ficha">
          <div><dt>Tamanho</dt><dd>${esc(p.tamanho)}</dd></div><div><dt>Cor</dt><dd>${esc(p.corNome || "")}</dd></div>
          <div><dt>Tecido</dt><dd>${esc(PADROES[p.padrao] || "Liso")}</dd></div>
          <div><dt>Estado</dt><dd>${esc(p.conservacao)}<span class="estado" aria-hidden="true">${[1, 2, 3, 4].map(i => `<i class="${i <= nivel ? "on" : ""}"></i>`).join("")}</span></dd></div>
        </dl>
        <section class="rastro" aria-label="Rastro da peça">
          <h3>${voltas === 0 ? "Primeira volta" : `Já rodou ${voltas} ${voltas === 1 ? "vez" : "vezes"}`}</h3>
          <p>${voltas === 0 ? "Ninguém usou esta peça pelo Ciranda ainda. A primeira volta pode ser sua." : "Cada carimbo é uma pessoa que usou e passou adiante. A próxima pode ser você."}</p>
          <div class="carimbos">${Array.from({ length: voltas }, (_, i) => `<span class="carimbo" style="transform:rotate(${-12 + i * 7}deg)"><span><strong>${i + 1}ª</strong>volta</span></span>`).join("")}
            <span class="carimbo vazio"><span><strong>${voltas + 1}ª</strong>sua?</span></span></div>
        </section>
        ${f ? `<div class="impacto-3">
            <div>${icone("gota", 20)}<strong class="num" data-conta="${f.agua}" data-suf=" L">0 L</strong><span>de água que não precisa ser gasta</span></div>
            <div>${icone("nuvem", 20)}<strong class="num" data-conta="${f.co2}" data-casas="1" data-suf=" kg">0 kg</strong><span>de CO₂e evitados</span></div>
            <div>${icone("estrela", 20)}<strong class="num" data-conta="${f.pontosPorPeca}">0</strong><span>pontos, ${brl(f.pontosPorPeca * VALOR_PONTO)} de desconto</span></div></div>
          <details class="como"><summary>Como calculamos</summary><p class="fonte">Comprar usada evita produzir uma peça nova. ${esc(f.fonte)} Peso considerado: ${esc(f.peso)}.</p></details>`
          : `<p class="aviso info" style="margin-top:18px">${icone("info", 18)} Ainda não temos um fator de impacto com fonte confiável para ${esc(p.categoria.toLowerCase())}. Por isso esta peça não entra no cálculo nem gera pontos.</p>`}
      </div>
    </div>`);
  document.querySelectorAll("[data-conta]").forEach(el => contar(el, Number(el.dataset.conta), Number(el.dataset.casas || 0), 1200, el.dataset.suf || ""));
  if (usaVisor) { try { visorAtual = window.Ciranda3D.visor($("#visor"), spec3d(p)); } catch (e) {} }
}

/* voo da peça até a sacola */
function voar(el, r1) {
  const barra = $(".barra");
  const alvo = (barra && getComputedStyle(barra).display !== "none" ? document.querySelector('.barra a[href="#/sacola"]') : null) || $("#btSacola");
  if (!alvo || reduzMovimento) { return; }
  const r2 = alvo.getBoundingClientRect();
  Object.assign(el.style, { position: "fixed", left: r1.left + "px", top: r1.top + "px", width: r1.width + "px", height: r1.height + "px", zIndex: 90, pointerEvents: "none", objectFit: "contain" });
  document.body.appendChild(el);
  const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2), dy = r2.top + r2.height / 2 - (r1.top + r1.height / 2);
  el.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx * .5}px,${dy * .5 - 60}px) scale(.4)`, offset: .55 }, { transform: `translate(${dx}px,${dy}px) scale(.05)`, opacity: .2 }],
    { duration: 700, easing: "cubic-bezier(.5,0,.2,1)" }).onfinish = () => { el.remove(); const x = $("#btSacola"); if (x) { x.classList.remove("pula"); void x.offsetWidth; x.classList.add("pula"); } };
}
function atualizarSacolaUI(u) {
  const n = (db.sacola[u.id] || []).length; const h = "Sacola" + (n ? ` <span class="bolha">${n}</span>` : "");
  const b = $("#btSacola"); if (b) b.innerHTML = h;
  const l = document.querySelector('.barra a[href="#/sacola"]'); if (l) l.innerHTML = h;
}
function addSacola(u, id, origem, botao) {
  const s = db.sacola[u.id] = db.sacola[u.id] || [];
  if (!s.includes(id)) s.push(id);
  Repositorio.salvar();
  Bastidores.msg("frmCatalogo", ":Sacola", `adicionar(${id})`);
  if (origem) { const src = origem.querySelector("canvas") || origem.querySelector("img"); if (src) { const fake = new Image(); fake.src = src.tagName === "CANVAS" ? src.toDataURL() : src.src; voar(fake, origem.getBoundingClientRect()); } }
  setTimeout(() => atualizarSacolaUI(u), 700);
  if (botao) {
    if (botao.classList.contains("add")) { botao.classList.add("na-sacola"); botao.dataset.acao = "ir-sacola"; botao.textContent = "Na sacola ✓"; }
    else botao.outerHTML = `<a class="bt bt-sec bt-larg" href="#/sacola">Na sacola. Ver sacola</a>`;
  }
  toast("Na sacola. Só fica garantida quando você finalizar.");
}

/* ---------------- sacola e finalização (UC03 via fachada) */
function passos(atual) {
  const e = ["Sacola", "Confirmar", "Pix", "Pronto"];
  return `<div class="passos" aria-label="Etapas da compra">${e.map((x, i) => `${i ? "<b></b>" : ""}<span class="${i < atual ? "feito" : i === atual ? "agora" : ""}" ${i === atual ? 'aria-current="step"' : ""}><i>${i < atual ? icone("check", 14) : i + 1}</i>${x}</span>`).join("")}</div>`;
}
function telaSacola(u) {
  const ids = db.sacola[u.id] || [];
  const pecas = ids.map(Repositorio.peca).filter(Boolean);
  const indis = pecas.filter(p => p.situacao !== "Disponível");
  const valor = pecas.filter(p => p.situacao === "Disponível").reduce((s, p) => s + p.preco, 0);
  const pts = pecas.reduce((s, p) => s + ImpactoPontos.pontosDaPeca(p), 0);
  pagina(u, `${passos(0)}
    <div class="cab"><div><h1>Sacola</h1><p>As peças só ficam garantidas quando você finaliza. Antes disso, outra pessoa pode levar.</p></div></div>
    ${pecas.length ? `<div class="grade2">
      <div class="cartao" id="listaSacola">${pecas.map(p => `<div class="item" data-item="${p.id}">
          <a class="mini" href="#/peca/${p.id}">${fotoPeca(p, 0, { semEtiqueta: true })}</a>
          <div><strong>${esc(p.titulo)}</strong><div class="peq mudo">${esc(p.marca)} · ${esc(p.tamanho)}</div>
            ${p.situacao !== "Disponível" ? `<div style="margin-top:6px">${sit(p.situacao === "Reservada" ? "Reservada" : "Indisponível")}</div>` : ""}</div>
          <div style="text-align:right"><div class="preco">${brl(p.preco)}</div><button class="bt bt-link peq" data-acao="rem-sacola" data-id="${p.id}">Tirar</button></div>
        </div>`).join("")}</div>
      <div class="cartao cinza">
        <h2 style="margin-bottom:12px">Resumo</h2>
        <div class="lin"><span>${pecas.length} ${pecas.length === 1 ? "peça" : "peças"}</span><span class="num">${brl(valor)}</span></div>
        <div class="lin"><span>Frete estimado</span><span class="num">${brl(FRETE)}</span></div>
        <div class="lin total"><span>Total</span><span class="num">${brl(valor + FRETE)}</span></div>
        ${pts ? `<p class="peq" style="color:var(--ok);font-weight:700;margin-top:8px;display:flex;gap:6px;align-items:center">Esta compra rende ${pts} pontos</p>` : ""}
        ${indis.length ? `<p class="aviso alerta" style="margin:14px 0 0">${icone("info", 18)} ${indis.length === 1 ? "Uma peça já não está disponível e sai" : "Algumas peças já não estão disponíveis e saem"} quando você finalizar.</p>` : ""}
        <button class="bt bt-pri bt-larg" style="margin-top:18px" data-acao="finalizar">Finalizar e reservar</button>
        <p class="peq mudo" style="margin-top:10px;text-align:center">Pagamento por Pix. Você usa seus pontos no próximo passo.</p>
      </div></div>`
    : `<div class="vazio"><svg class="ilu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">${IC.sacola}</svg><h3>Sua sacola está vazia</h3><p>Escolha uma peça na arara para começar.</p><p style="margin-top:16px"><a class="bt bt-pri" href="#/catalogo">Ver catálogo</a></p></div>`}
  `);
}
function anelRelogio(fim, total = RESERVA_MIN * MIN, tam = 104) {
  const C = 2 * Math.PI * 44;
  return `<div class="relogio-anel" style="width:${tam}px;height:${tam}px" data-anel="${fim}" data-total="${total}"><svg viewBox="0 0 100 100"><circle class="fundo" cx="50" cy="50" r="44" fill="none" stroke-width="8"/><circle class="frente" cx="50" cy="50" r="44" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><span data-relogio="${fim}">30:00</span></div>`;
}
function telaConfirmar(u, pid) {
  const p = Repositorio.pedido(pid);
  if (!p || p.cliente !== u.id) return ir("#/sacola");
  if (p.situacao !== "Em finalização") return ir(`#/pix/${p.id}`);
  const valorPecas = Pedidos.valorPecas(p);
  const { desconto, pontos } = ImpactoPontos.descontoMaximo(u.id, valorPecas);
  const pontosNovos = p.itens.reduce((s, i) => s + ImpactoPontos.pontosDaPeca(Repositorio.peca(i.peca)), 0);
  pagina(u, `${passos(1)}
    <div class="cab"><div><h1>Confirmar pedido</h1><p>As peças estão reservadas no seu nome enquanto o relógio corre.</p></div></div>
    ${p.removidas && p.removidas.length ? `<p class="aviso alerta" style="margin-bottom:16px">${icone("info", 18)} Saíram da sacola porque outra pessoa reservou antes: ${esc(p.removidas.join(", "))}. O total já foi recalculado.</p>` : ""}
    ${p.itens.length ? `<form id="fConfirmar" class="grade2">
      <div>
        <div class="cartao reserva">${anelRelogio(p.expiraEm)}<div><h3>Reserva garantida</h3><p class="mudo peq" style="margin-top:4px">Ninguém mais pode comprar estas peças até o relógio zerar. Depois disso, elas voltam para a arara.</p></div></div>
        <div class="cartao">${p.itens.map(i => { const pc = Repositorio.peca(i.peca); return `<div class="item"><span class="mini">${fotoPeca(pc, 0, { semEtiqueta: true })}</span><div><strong>${esc(pc.titulo)}</strong><div class="peq mudo">${esc(pc.tamanho)}</div><div style="margin-top:6px">${sit("Reservada")}</div></div><div class="preco">${brl(i.precoPraticado)}</div></div>`; }).join("")}</div>
        <div class="cartao"><label class="campo">Endereço de entrega<textarea name="endereco" required>${esc(p.endereco || "")}</textarea><span class="ajuda">Vai na etiqueta de envio. Confira número e complemento.</span></label></div>
      </div>
      <div class="cartao cinza">
        <h2 style="margin-bottom:12px">Pagamento</h2>
        <div class="lin"><span>Peças</span><span class="num">${brl(valorPecas)}</span></div>
        <div class="lin"><span>Frete</span><span class="num">${brl(p.frete)}</span></div>
        <div class="lin" id="linhaDesc" style="color:var(--ok);font-weight:700" hidden><span>Pontos</span><span class="num">− ${brl(desconto)}</span></div>
        ${pontos > 0 ? `<label class="chave" style="margin:12px 0"><input type="checkbox" name="usarPontos" id="usarPontos"><span><strong>Usar ${pontos} pontos</strong><br><span class="peq">Você tem ${u.saldoDePontos}. Economiza ${brl(desconto)}, o máximo de 20% das peças.</span></span></label>`
          : `<p class="peq mudo" style="margin:10px 0">Você ainda não tem pontos para usar.</p>`}
        <div class="lin total"><span>Total no Pix</span><span class="num" id="totalPix" data-base="${valorPecas + p.frete}" data-desc="${desconto}">${brl(valorPecas + p.frete)}</span></div>
        ${pontosNovos ? `<p class="peq" style="color:var(--ok);font-weight:700;margin-top:8px;display:flex;gap:6px;align-items:center">Rende ${pontosNovos} pontos quando o Pix cair</p>` : ""}
        <div id="erroConfirmar" role="alert"></div>
        <button class="bt bt-pri bt-larg" style="margin-top:18px" type="submit">Gerar Pix</button>
        <button class="bt bt-link bt-larg" style="margin-top:14px" type="button" data-acao="abandonar" data-id="${p.id}">Voltar e liberar as peças</button>
      </div></form>`
    : `<div class="vazio"><h3>Nenhuma peça pôde ser reservada</h3><p>Todas já estavam reservadas ou vendidas.</p><p style="margin-top:16px"><a class="bt bt-pri" href="#/catalogo">Ver catálogo</a></p></div>`}
  `);
  tique();
}
function telaPix(u, pid) {
  const p = Repositorio.pedido(pid);
  if (!p || p.cliente !== u.id) return ir("#/pedidos");
  const pg = db.pagamentos.filter(x => x.pedido === p.id).pop();
  if (p.situacao === "Aguardando pagamento" && pg) {
    const oc = db.ocorrencias.filter(o => o.pedido === p.id).pop();
    pagina(u, `${passos(2)}
      <div class="cab"><div><h1>Pague com Pix</h1><p>Não precisa voltar aqui para avisar. Quando o banco confirmar, esta tela muda sozinha.</p></div></div>
      ${oc ? `<p class="aviso erro" style="margin-bottom:16px">${icone("info", 18)} ${esc(oc.texto)} A administradora foi avisada.</p>` : ""}
      <div class="pix">
        <div class="cartao">
          <div style="display:flex;gap:26px;flex-wrap:wrap;align-items:center">
            <div class="qr">${qrSvg(pg.copiaECola)}</div>
            <div style="display:grid;gap:16px">
              <div style="display:flex;gap:14px;align-items:center">${anelRelogio(p.expiraEm, RESERVA_MIN * MIN, 84)}<div><span class="peq mudo">Total</span><div class="preco" style="font-size:1.8rem">${brl(pg.valor)}</div>${p.pontosUsados ? `<span class="peq" style="color:var(--ok);font-weight:700">${p.pontosUsados} pontos usados</span>` : ""}</div></div>
              <ol style="margin:0;padding-left:20px;display:grid;gap:4px;color:var(--tinta-2)"><li>Abra o app do seu banco e escolha Pix.</li><li>Leia o QR Code ou cole o código.</li><li>Confirme. A gente avisa quando cair.</li></ol>
            </div>
          </div>
          <span class="rotulo" style="margin-top:22px">Pix copia e cola</span>
          <div class="copia"><input readonly value="${esc(pg.copiaECola)}" aria-label="Código Pix copia e cola" id="copiaCola"><button class="bt bt-sec" data-acao="copiar">Copiar</button></div>
          <p class="peq mudo" style="margin-top:14px">QR Code de demonstração. Nenhum valor é cobrado.</p>
        </div>
        <div>
          <div class="celular" aria-label="Simulação do app do banco"><div class="tela-banco" id="telaBanco">
            <div class="banco"><i></i> Seu banco</div>
            <span class="peq">Pagar com Pix</span>
            <div class="valor num">${brl(pg.valor)}</div>
            <div class="para"><strong>Ciranda Brechó</strong><br>Brasília, DF<br><span style="font-family:var(--mono);font-size:.72rem">${esc(pg.txid)}</span></div>
            <button class="bt bt-larg" data-acao="pagar" data-tx="${pg.txid}">Pagar ${brl(pg.valor)}</button>
          </div></div>
          <p class="legenda-sim">Este celular faz o papel do banco na apresentação.</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">
            <button class="bt bt-sec" style="min-height:38px;font-size:.82rem" data-acao="pagar-errado" data-tx="${pg.txid}">Pagar valor errado</button>
            <button class="bt bt-sec" style="min-height:38px;font-size:.82rem" data-acao="expirar" data-id="${p.id}">Deixar expirar</button>
          </div>
        </div>
      </div>`);
    tique();
  } else if (["Pago", "Em separação", "Enviado", "Entregue"].includes(p.situacao)) {
    pagina(u, `${passos(3)}
      <div class="cartao" style="max-width:680px">
        <span style="color:var(--ok)">${icone("check", 40)}</span>
        <h1 style="margin:8px 0">Pedido ${esc(p.id)} pago</h1>
        <p class="mudo">O provedor confirmou o Pix. As peças são suas e já estão na fila da Lúcia, que posta em até 2 dias úteis.</p>
        <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap"><a class="bt bt-pri" href="#/pedido/${p.id}">Acompanhar pedido</a><a class="bt bt-sec" href="#/impacto">Ver meu impacto</a></div>
      </div>`);
    if (p.celebrar) { p.celebrar = false; Repositorio.salvar(); festa(p); }
  } else {
    pagina(u, `<div class="cartao" style="max-width:680px"><h1 style="margin-bottom:10px">Pedido ${esc(p.id)} cancelado</h1>
      <p class="mudo">O Pix não caiu em 30 minutos. As peças voltaram para a arara${p.pontosUsados ? " e os pontos voltaram para o seu saldo" : ""}.</p>
      <p style="margin-top:18px"><a class="bt bt-pri" href="#/catalogo">Voltar ao catálogo</a></p></div>`);
  }
}
function festa(p) {
  const agua = p.itens.reduce((s, i) => s + (ImpactoPontos.fator(Repositorio.peca(i.peca))?.agua || 0), 0);
  const co2 = p.itens.reduce((s, i) => s + (ImpactoPontos.fator(Repositorio.peca(i.peca))?.co2 || 0), 0);
  const pc = Repositorio.peca(p.itens[0].peca);
  const el = document.createElement("div"); el.className = "festa"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Pagamento confirmado");
  el.innerHTML = `<div class="festa-caixa">
    <div class="etq-grande palco">${fotoPeca(pc, 0)}<span class="carimbo-grande"><span><strong>+1</strong>volta</span></span></div>
    <h2>Pix confirmado</h2>
    <p class="mudo">${p.itens.length === 1 ? "Esta peça ganhou" : `As ${p.itens.length} peças ganharam`} mais uma volta na roda.</p>
    <div class="numeros3"><div><strong class="num" id="fA">0</strong><span>litros de água</span></div><div><strong class="num" id="fC">0</strong><span>kg de CO₂e</span></div><div><strong class="num" id="fP">0</strong><span>pontos ganhos</span></div></div>
    <button class="bt bt-pri bt-larg" data-acao="fechar-festa" data-id="${p.id}">Acompanhar pedido</button>
    <button class="bt bt-link" style="margin-top:12px" data-acao="fechar-festa">Continuar comprando</button></div>`;
  document.body.appendChild(el);
  el.querySelector(".bt-pri").focus();
  setTimeout(() => { contar($("#fA"), agua, 0, 1400); contar($("#fC"), co2, 1, 1400); contar($("#fP"), p.pontosCreditados || 0, 0, 1400); }, 500);
  confete();
}
function confete() {
  if (reduzMovimento) return;
  const cores = ["#111111", "#C8381C", "#BEBBB4", "#111111"];
  for (let i = 0; i < 36; i++) {
    const d = document.createElement("span"); d.className = "confete";
    const tag = i % 4 === 0;
    Object.assign(d.style, { width: tag ? "10px" : "8px", height: tag ? "14px" : "8px", background: cores[i % cores.length], borderRadius: tag ? "2px 2px 2px 2px" : "50%", left: (innerWidth / 2) + "px", top: (innerHeight / 2 - 60) + "px" });
    document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2, v = 180 + Math.random() * 340;
    const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 160;
    d.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720}deg)`, opacity: 1, offset: .55 }, { transform: `translate(${dx * 1.15}px,${dy + 420}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 }],
      { duration: 1800 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => d.remove();
  }
}

/* ---------------- pedidos (UC05) */
const ETAPAS_PED = ["Pago", "Em separação", "Enviado", "Entregue"];
function trilhaPedido(p) {
  const i = ETAPAS_PED.indexOf(p.situacao);
  return `<div class="trilha">${ETAPAS_PED.map((_, k) => `<i class="${k <= i ? "on" : ""}" style="--d:${k}"></i>`).join("")}</div><div class="trilha-rot">${["Pago", "Separando", "A caminho", "Entregue"].map(x => `<span>${x}</span>`).join("")}</div>`;
}
function telaPedidos(u) {
  const ps = Pedidos.doCliente(u.id);
  pagina(u, `<div class="cab"><div><h1>Pedidos</h1><p>Só os seus, com cada mudança datada.</p></div></div>
    ${ps.length ? `<div class="entra-lista">${ps.map(p => `<a class="pedido-card" href="#/${p.situacao === "Aguardando pagamento" ? "pix" : "pedido"}/${p.id}">
        <span class="pilha">${p.itens.slice(0, 3).map(i => `<span>${miniRoupa(Repositorio.peca(i.peca))}</span>`).join("")}</span>
        <span><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><strong>${esc(p.id)}</strong>${sit(p.situacao)}</span>
          <span class="peq mudo">${dataCurta(p.criadoEm)} · ${p.itens.length} ${p.itens.length === 1 ? "peça" : "peças"} · ${brl(Pedidos.total(p))}</span>
          ${ETAPAS_PED.includes(p.situacao) ? trilhaPedido(p) : ""}</span>
        <span class="seta-ir">${icone("seta", 18)}</span></a>`).join("")}</div>`
      : `<div class="vazio"><h3>Nenhum pedido ainda</h3><p><a href="#/catalogo">Ver catálogo</a></p></div>`}`);
}
function telaPedido(u, pid) {
  const p = Repositorio.pedido(pid);
  if (!p || (u.papel === "Cliente" && p.cliente !== u.id)) return pagina(u, `<div class="vazio"><h3>Pedido não encontrado</h3></div>`); // RN15
  const e = Entrega.doPedido(p.id);
  const eventos = [...p.historico.map(h => ({ t: h.situacao, em: h.em })), ...(e ? e.etapas.filter(x => x.situacao !== "Postado" && x.situacao !== "Entregue").map(x => ({ t: x.situacao, em: x.em })) : [])].sort((a, b) => a.em - b.em);
  pagina(u, `<p class="peq" style="margin-bottom:18px"><a href="#/pedidos" style="display:inline-flex;gap:6px;align-items:center;font-weight:600;text-decoration:none">${icone("voltar", 16)} Pedidos</a></p>
    <div class="cab"><div><h1>Pedido ${esc(p.id)}</h1><p>Feito em ${dataHora(p.criadoEm)}</p></div>${sit(p.situacao)}</div>
    ${ETAPAS_PED.includes(p.situacao) ? `<div class="cartao" style="margin-bottom:16px">${trilhaPedido(p)}</div>` : ""}
    <div class="grade2">
      <div class="cartao"><h2 style="margin-bottom:18px">Linha do tempo</h2>
        <ol class="linha-tempo">${eventos.map((x, i) => `<li class="${i === eventos.length - 1 ? "atual" : ""}"><strong>${esc(x.t)}</strong><time>${dataHora(x.em)}</time></li>`).join("")}</ol></div>
      <div>
        <div class="cartao"><h2 style="margin-bottom:10px">Entrega</h2>
          ${e ? `<span class="peq mudo">Código de rastreio</span><p style="font-family:var(--mono);font-weight:500;font-size:1.15rem">${esc(e.codigoRastreio)}</p><p class="peq mudo" style="margin-top:6px">Prazo estimado: ${data(e.prazo)}</p>`
              : `<p class="mudo">${p.situacao === "Pago" ? "Pago. A loja separa e posta em até 2 dias úteis." : "O código de rastreio aparece quando o pedido for postado."}</p>`}
          <p class="peq mudo" style="margin-top:12px">Para: ${esc(p.endereco)}</p></div>
        <div class="cartao"><h2 style="margin-bottom:4px">Peças</h2>
          ${p.itens.map(i => { const pc = Repositorio.peca(i.peca); return `<div class="item"><span class="mini">${fotoPeca(pc, 0, { semEtiqueta: true })}</span><div><strong>${esc(pc.titulo)}</strong><div class="peq mudo">${esc(pc.tamanho)}</div></div><div class="preco">${brl(i.precoPraticado)}</div></div>`; }).join("")}
          <div class="lin"><span>Frete</span><span class="num">${brl(p.frete)}</span></div>
          ${p.desconto ? `<div class="lin" style="color:var(--ok);font-weight:700"><span>Pontos (${p.pontosUsados})</span><span class="num">− ${brl(p.desconto)}</span></div>` : ""}
          <div class="lin total"><span>Total</span><span class="num">${brl(Pedidos.total(p))}</span></div>
          ${p.pontosCreditados ? `<p class="peq" style="color:var(--ok);font-weight:700;margin-top:8px;display:flex;gap:6px;align-items:center">${p.pontosCreditados} pontos creditados por esta compra</p>` : ""}</div>
      </div>
    </div>`);
}

/* ---------------- impacto e pontos (UC06) */
function telaImpacto(u) {
  const r = ImpactoPontos.resumo(u.id);
  const ext = db.extratoPontos.filter(x => x.cliente === u.id).sort((a, b) => b.em - a.em);
  const vencendo = ext.filter(x => x.tipo !== "uso" && x.expiraEm && x.expiraEm - agora() < 60 * DIA && x.expiraEm > agora());
  const nGarrafas = Math.min(60, Math.round(r.agua / 200));
  const fontes = [...new Set(r.pedidos.flatMap(p => p.itens.map(i => ImpactoPontos.fator(Repositorio.peca(i.peca)))).filter(Boolean).map(f => f.fonte))];
  const roupasTodas = r.pedidos.flatMap(p => p.itens.map(i => Repositorio.peca(i.peca)));
  pagina(u, `<div class="cab"><div><h1>Seu impacto</h1><p>Só contam pedidos pagos. Cada número mostra de onde vem.</p></div></div>
    ${r.pecas || r.semFator ? `<section class="impacto-topo">
      <div class="pecas-rod" aria-hidden="true">${roupasTodas.slice(0, 4).map(p => `<span>${fotoPeca(p, 0, { w: 300 })}</span>`).join("")}</div>
      <div class="nums">
        <div class="grandes">
          <div><strong class="num" data-conta="${r.agua}" data-suf=" L">0 L</strong><span>Água poupada</span></div>
          <div><strong class="num" data-conta="${r.co2}" data-casas="1" data-suf=" kg">0 kg</strong><span>CO₂e que não foi emitido</span></div>
          <div><strong class="num" data-conta="${u.saldoDePontos}">0</strong><span>Pontos, valem ${brl(u.saldoDePontos * VALOR_PONTO)}</span></div>
        </div>
        <div class="garrafas" aria-label="Cada garrafa vale 200 litros">${Array.from({ length: nGarrafas }, (_, i) => `<i class="garrafa" style="--i:${i}"></i>`).join("")}</div>
        <p class="peq mudo" style="margin-top:8px">Cada garrafa são 200 litros. ${r.pecas} ${r.pecas === 1 ? "peça voltou" : "peças voltaram"} para a roda.</p>
      </div></section>
      ${r.semFator ? `<p class="peq mudo" style="margin-top:12px">${r.semFator} ${r.semFator === 1 ? "peça comprada ficou" : "peças compradas ficaram"} fora da conta porque a categoria ainda não tem fator com fonte.</p>` : ""}
      ${vencendo.length ? `<p class="aviso alerta" style="margin-top:12px">${icone("relogio", 18)} ${vencendo.reduce((s, x) => s + x.pontos, 0)} pontos vencem em ${data(Math.min(...vencendo.map(x => x.expiraEm)))}. Use numa próxima compra.</p>` : ""}`
    : `<div class="vazio"><h3>Sua primeira compra começa a conta</h3><p>Uma calça jeans usada, por exemplo, evita cerca de 2.900 litros de água e rende 210 pontos.</p><p style="margin-top:16px"><a class="bt bt-pri" href="#/catalogo">Ver catálogo</a></p></div>`}
    <div class="grade2" style="margin-top:24px">
      <div class="cartao rolar"><h2 style="margin-bottom:10px">Extrato de pontos</h2>
        ${ext.length ? `<table class="tabela"><thead><tr><th>Data</th><th>Movimento</th><th class="dir">Pontos</th><th>Validade</th></tr></thead><tbody>
        ${ext.map(x => `<tr><td>${dataCurta(x.em)}</td><td>${x.tipo === "credito" ? `Compra ${esc(x.pedido)}` : x.tipo === "uso" ? `Desconto no ${esc(x.pedido)}` : `Estorno do ${esc(x.pedido)}`}</td>
          <td class="dir num" style="font-weight:800;color:${x.tipo === "uso" ? "var(--erro)" : "var(--ok)"}">${x.tipo === "uso" ? "−" : "+"}${x.pontos}</td><td>${x.expiraEm ? dataCurta(x.expiraEm) : ""}</td></tr>`).join("")}
        </tbody></table>` : `<p class="mudo">Sem movimentos ainda.</p>`}
        <p class="peq mudo" style="margin-top:14px">Regras: 10 pontos por kg de CO₂e evitado, 1 ponto vale R$ 0,10, valem por 12 meses e pagam até 20% das peças de um pedido.</p></div>
      <div class="cartao cinza"><h2 style="margin-bottom:10px">De onde vêm os números</h2>
        ${(fontes.length ? fontes : [FONTE_ALGODAO, FONTE_JEANS]).map(f => `<p class="fonte" style="margin:0 0 10px">${esc(f)}</p>`).join("")}
        <p class="fonte">Premissa: cada peça comprada usada substitui a compra de uma peça nova equivalente.</p></div>
    </div>`);
  document.querySelectorAll("[data-conta]").forEach(el => contar(el, Number(el.dataset.conta), Number(el.dataset.casas || 0), 1500, el.dataset.suf || ""));
  document.querySelectorAll(".garrafa").forEach((g, i) => g.style.setProperty("animation-delay", `${0.3 + i * 0.04}s`));
}

/* ---------------- fornecedor: minhas peças e publicar (UC01) */
function telaMinhasPecas(u) {
  const r = Consignacao.resumo(u.fornecedor);
  const cons = db.consignacoes.find(c => c.fornecedor === u.fornecedor);
  pagina(u, `<div class="cab"><div><h1>Minhas peças</h1><p>Consignação ${esc(cons.id)}: você recebe ${cons.percentualRepasse}% do preço de venda, até ${data(cons.fim)}.</p></div><a class="bt bt-pri" href="#/publicar">Publicar peça</a></div>
    <div class="kpis"><div><strong class="num">${r.pecas.filter(p => p.situacao === "Disponível").length}</strong><span>na arara agora</span></div><div><strong class="num">${r.vendido}</strong><span>vendidas</span></div><div><strong class="num">${brl(r.aPagar)}</strong><span>a receber de repasse</span></div></div>
    <div class="vitrine entra-lista">${r.pecas.sort((a, b) => b.criadaEm - a.criadaEm).map(p => { const rp = r.repasses.find(x => x.peca === p.id); return `<article class="peca">
      <div class="foto">${fotoPeca(p)}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${sit(p.situacao)}${rp ? `<span class="peq" style="font-weight:700;color:${rp.pago ? "var(--tinta-3)" : "var(--ok)"}">${rp.pago ? "repasse pago" : "+" + brl(rp.valor) + " a receber"}</span>` : ""}</div>
      <div><div class="tit">${esc(p.titulo)}</div><div class="meta">${esc(p.tamanho)} · ${brl(p.preco)}</div>${p.motivoReprovacao ? `<p class="peq" style="color:var(--erro);margin-top:4px">Motivo: ${esc(p.motivoReprovacao)}</p>` : ""}</div></article>`; }).join("")}</div>`);
}
function rascunhoInicial(u) { return { titulo: "", descricao: "", categoria: "Camisetas e blusas", marca: "", tamanho: "M", conservacao: "Ótimo estado", corNome: "Azul", cor: "#3E5C76", padrao: "liso", preco: "", fornecedor: u.papel === "Administradora" ? db.fornecedores[0].id : u.fornecedor, vezesRevendida: 0 }; }
function telaPublicar(u) {
  const ehAdmin = u.papel === "Administradora";
  if (!rascunho) rascunho = rascunhoInicial(u);
  const r = rascunho;
  const chips = (nome, lista, atual) => `<div class="chips" role="group" aria-label="${nome}">${lista.map(v => `<button type="button" class="chip" data-acao="pub" data-k="${nome}" data-v="${esc(v)}" aria-pressed="${v === atual}">${esc(v)}</button>`).join("")}</div>`;
  pagina(u, `<div class="cab"><div><h1>Publicar peça</h1><p>${ehAdmin ? "Peça publicada pela administradora vai direto para a arara." : "Sua peça entra na arara depois da aprovação da Lúcia."}</p></div></div>
    <div class="grade2">
      <form id="fPublicar" class="cartao form" novalidate>
        <label class="campo">Título<input name="titulo" value="${esc(r.titulo)}" maxlength="60" placeholder="Ex.: Jaqueta jeans oversized"></label>
        <div><span class="rotulo">Categoria</span><div class="chips" role="group" aria-label="Categoria">${CATEGORIAS.map(c => `<button type="button" class="chip" data-acao="pub" data-k="categoria" data-v="${esc(c.nome)}" aria-pressed="${c.nome === r.categoria}"><svg class="mini" viewBox="0 0 120 150" aria-hidden="true"><path d="${ROUPA[FORMA_DE[c.nome]].d}" fill="currentColor"/></svg>${esc(c.nome)}</button>`).join("")}</div></div>
        <div class="form-2"><label class="campo">Marca<input name="marca" value="${esc(r.marca)}" placeholder="Ex.: Levi's"></label>
          <label class="campo">Preço (R$)<input name="preco" inputmode="decimal" value="${esc(r.preco)}" placeholder="0,00"></label></div>
        <div><span class="rotulo">Tamanho</span>${chips("tamanho", TAMANHOS, r.tamanho)}</div>
        <div><span class="rotulo">Estado</span>${chips("conservacao", CONSERVACAO, r.conservacao)}</div>
        <div><span class="rotulo">Cor: <span style="font-weight:600">${esc(r.corNome)}</span></span><div class="cores" role="group" aria-label="Cor">${CORES.map(([n, h]) => `<button type="button" class="cor" style="background:${h}" data-acao="cor" data-n="${n}" data-h="${h}" aria-pressed="${h === r.cor}" aria-label="${n}"></button>`).join("")}</div></div>
        <div><span class="rotulo">Tecido</span>${chips("padrao", Object.values(PADROES), PADROES[r.padrao])}</div>
        <label class="campo">Descrição<textarea name="descricao" placeholder="Tecido, caimento e qualquer marca de uso. Seja honesta: isso evita devolução.">${esc(r.descricao)}</textarea></label>
        ${ehAdmin ? `<label class="campo">Fornecedor<select name="fornecedor">${db.fornecedores.map(f => `<option value="${f.id}" ${f.id === r.fornecedor ? "selected" : ""}>${esc(f.nome)}</option>`).join("")}</select></label>` : ""}
        <label class="campo">Fotos (opcional)<input type="file" name="fotos" accept="image/jpeg,image/png,image/webp" multiple><span class="ajuda">De 1 a 8 fotos. Sem fotos, a arara mostra o desenho da peça.</span></label>
        <div id="erroPub" role="alert"></div>
        <button class="bt bt-pri bt-larg" type="submit">${ehAdmin ? "Publicar na arara" : "Enviar para aprovação"}</button>
      </form>
      <aside class="previa" aria-live="polite"><span class="rotulo-previa"><i></i> Prévia ao vivo</span><div id="previa">${cardPeca(Object.assign({}, r, { preco: precoNum(r.preco), fotos: pubFotos }), u, { previa: true })}</div>
        <p class="peq mudo" style="margin-top:14px;max-width:300px">É assim que a peça aparece no catálogo. O desenho muda com a categoria, a cor e o tecido.</p></aside>
    </div>`);
}
function precoNum(v) { return Number(String(v || "").replace(/\./g, "").replace(",", ".")) || 0; }
function atualizarPrevia(u) { const el = $("#previa"); if (el) el.innerHTML = cardPeca(Object.assign({}, rascunho, { preco: precoNum(rascunho.preco), fotos: pubFotos }), u, { previa: true }); }

/* ---------------- administradora: aprovações (UC01) */
function telaAprovacoes(u) {
  const pend = db.pecas.filter(p => p.situacao === "Aguardando aprovação");
  pagina(u, `<div class="cab"><div><h1>Aprovações</h1><p>Peças enviadas pelos fornecedores. Só entram na arara depois do seu ok.</p></div></div>
    <div class="entra-lista">${pend.length ? pend.map(p => `<div class="cartao aprova" id="ap-${p.id}">
      <div class="foto">${fotoPeca(p)}</div>
      <div><h3>${esc(p.titulo)}</h3><p class="peq mudo" style="margin-top:4px">${esc(p.marca)} · ${esc(p.tamanho)} · ${esc(p.conservacao)} · de ${esc(Repositorio.fornecedor(p.fornecedor).nome)}</p>
        <p style="margin-top:10px;max-width:60ch">${esc(p.descricao)}</p><p class="preco" style="margin-top:10px">${brl(p.preco)}</p>
        <div id="motivo-${p.id}" hidden style="margin-top:14px;display:grid;gap:10px">
          <label class="campo">Motivo (o fornecedor vai ver)<textarea>Fotos com pouca luz. Envie de novo com luz natural.</textarea></label>
          <div style="display:flex;gap:10px"><button class="bt bt-esc" data-acao="confirmar-reprovar" data-id="${p.id}">Reprovar peça</button><button class="bt bt-sec" data-acao="cancelar-reprovar" data-id="${p.id}">Cancelar</button></div></div></div>
      <div class="acoes" style="display:grid;gap:8px"><button class="bt bt-pri" data-acao="aprovar" data-id="${p.id}">Aprovar</button><button class="bt bt-sec" data-acao="reprovar" data-id="${p.id}">Reprovar</button></div>
    </div>`).join("") : `<div class="vazio"><h3>Nada para aprovar</h3><p>Quando um fornecedor publicar uma peça, ela aparece aqui.</p></div>`}</div>
    ${db.ocorrencias.length ? `<div class="cartao" style="margin-top:24px"><h2 style="margin-bottom:12px">Ocorrências de pagamento</h2>${db.ocorrencias.slice().reverse().map(o => `<p class="aviso erro" style="margin-bottom:8px">${icone("info", 18)} ${dataHora(o.em)} · ${esc(o.pedido)}: ${esc(o.texto)}</p>`).join("")}</div>` : ""}`);
}

/* ---------------- administradora: entregas (UC09) em quadro */
function telaEntregas(u) {
  const col = (s) => db.pedidos.filter(p => p.situacao === s).sort((a, b) => (a.pagoEm || 0) - (b.pagoEm || 0));
  const fichaPed = (p) => {
    const e = Entrega.doPedido(p.id), cli = Repositorio.usuario(p.cliente);
    const ult = e && e.etapas.length ? e.etapas[e.etapas.length - 1].situacao : null;
    return `<div class="ficha-pedido" style="view-transition-name:f${p.id.replace(/\W/g, "")}">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${esc(p.id)}</strong><span class="pilha">${p.itens.slice(0, 3).map(i => `<span>${miniRoupa(Repositorio.peca(i.peca))}</span>`).join("")}</span></div>
      <span class="peq">${esc(cli.nome)}<br><span class="mudo">pago ${p.pagoEm ? dataHora(p.pagoEm) : ""}</span></span>
      ${e && p.situacao !== "Entregue" ? `<div class="etiqueta-envio"><span>Para ${esc(cli.nome)}</span><div class="barras" aria-hidden="true"></div><span class="cod">${esc(e.codigoRastreio)}</span></div>` : ""}
      ${p.situacao === "Pago" ? `<button class="bt bt-pri" data-acao="separar" data-id="${p.id}">Separar e gerar etiqueta</button>` : ""}
      ${p.situacao === "Em separação" ? `<button class="bt bt-pri" data-acao="postar" data-id="${p.id}">Confirmar postagem</button>` : ""}
      ${p.situacao === "Enviado" ? `<span class="peq mudo">Última etapa: <strong style="color:var(--tinta)">${esc(ult)}</strong></span><button class="bt bt-sec" data-acao="rastrear" data-id="${p.id}">Consultar rastreio</button>` : ""}
      ${p.situacao === "Entregue" ? `<span class="peq" style="color:var(--ok);font-weight:700">${icone("check", 14)} ${esc(e ? e.codigoRastreio : "")}</span>` : ""}
    </div>`;
  };
  const colunas = [["Pago", "Pagos, para separar"], ["Em separação", "Separando"], ["Enviado", "A caminho"], ["Entregue", "Entregues"]];
  pagina(u, `<div class="cab"><div><h1>Entregas</h1><p>Do mais antigo para o mais novo. Prazo de postagem: 2 dias úteis após o pagamento.</p></div></div>
    <div class="kanban">${colunas.map(([s, t]) => { const l = col(s).slice(s === "Entregue" ? -4 : 0); return `<section class="coluna" aria-label="${t}"><h3>${t}<span class="num">${col(s).length}</span></h3>${l.map(fichaPed).join("") || `<p class="peq mudo" style="padding:6px">Nada aqui.</p>`}</section>`; }).join("")}</div>`);
}

/* ---------------- administradora: fornecedores (UC04) */
function telaFornecedores(u) {
  pagina(u, `<div class="cab"><div><h1>Fornecedores</h1><p>O repasse é calculado sobre o preço de venda, pelo percentual de cada consignação.</p></div></div>
    <div class="cartao rolar"><table class="tabela"><thead><tr><th>Fornecedor</th><th>Consignação</th><th class="dir">Repasse</th><th class="dir">Na arara</th><th class="dir">Vendidas</th><th class="dir">A pagar</th><th></th></tr></thead><tbody>
    ${db.fornecedores.map(f => { const r = Consignacao.resumo(f.id); const c = db.consignacoes.find(x => x.fornecedor === f.id);
      return `<tr><td><div style="display:flex;gap:10px;align-items:center"><span><strong>${esc(f.nome)}</strong><br><span class="peq mudo">${esc(f.contato)} · ${esc(f.cidade)}</span></span></div></td>
      <td>${c ? `${esc(c.id)}<br><span class="peq mudo">até ${dataCurta(c.fim)}</span>` : "sem consignação"}</td><td class="dir num">${c ? c.percentualRepasse + "%" : ""}</td>
      <td class="dir num">${r.pecas.filter(p => p.situacao === "Disponível").length}</td><td class="dir num">${r.vendido}</td><td class="dir num"><strong>${brl(r.aPagar)}</strong></td>
      <td>${r.aPagar > 0 ? `<button class="bt bt-sec" style="min-height:38px" data-acao="pagar-repasse" data-id="${f.id}">Registrar pagamento</button>` : ""}</td></tr>`; }).join("")}
    </tbody></table></div>
    <form class="cartao form" id="fFornecedor" style="margin-top:20px" novalidate>
      <h2>Novo fornecedor</h2>
      <div class="form-2">
        <label class="campo">Nome<input name="nome" required></label>
        <label class="campo">Contato (e-mail)<input name="contato" type="email" required></label>
        <label class="campo">Cidade<input name="cidade" required placeholder="Brasília, DF"></label>
        <label class="campo">Percentual de repasse<input name="percentual" type="number" min="1" max="90" value="60" required><span class="ajuda">Parte do preço de venda que vai para o fornecedor.</span></label>
      </div>
      <div id="erroForn" role="alert"></div>
      <div><button class="bt bt-pri" type="submit">Cadastrar e abrir consignação de 12 meses</button></div>
    </form>`);
}

/* =====================================================================
   Roteador e eventos
   ===================================================================== */
function render() {
  if (!db) return;
  const partes = (location.hash || "#/").slice(2).split("/");
  const rota = partes[0], arg = partes[1];
  const u = Autenticacao.atual();
  if (!u) { telaLogin(rota === "cadastro" ? "cadastro" : "entrar"); return; }
  const permitido = {
    Cliente: ["catalogo", "peca", "sacola", "confirmar", "pix", "pedidos", "pedido", "impacto"],
    Fornecedor: ["minhas-pecas", "publicar", "catalogo", "peca"],
    Administradora: ["aprovacoes", "entregas", "fornecedores", "publicar", "catalogo", "peca", "pedido"],
  }[u.papel];
  if (!permitido.includes(rota)) return ir("#/" + permitido[0]);
  ({ catalogo: telaCatalogo, peca: telaPeca, sacola: telaSacola, confirmar: telaConfirmar, pix: telaPix, pedidos: telaPedidos, pedido: telaPedido, impacto: telaImpacto,
     "minhas-pecas": telaMinhasPecas, publicar: telaPublicar, aprovacoes: telaAprovacoes, entregas: telaEntregas, fornecedores: telaFornecedores })[rota](u, arg);
}
function tique() {
  document.querySelectorAll("[data-anel]").forEach(el => {
    const fim = Number(el.dataset.anel), total = Number(el.dataset.total), r = Math.max(0, fim - agora());
    const C = 2 * Math.PI * 44; const c = el.querySelector(".frente");
    if (c) c.style.strokeDashoffset = String(C * (1 - r / total));
    el.classList.toggle("urgente", r < 5 * MIN);
  });
}
function campoErro(form, nome, msg) {
  const el = form.elements[nome]; if (!el) return; const lab = el.closest(".campo"); lab.classList.add("invalido");
  if (!lab.querySelector(".msg-erro")) lab.insertAdjacentHTML("beforeend", `<span class="msg-erro">${esc(msg)}</span>`);
  el.setAttribute("aria-invalid", "true");
}
function limparErros(form) { form.querySelectorAll(".invalido").forEach(l => { l.classList.remove("invalido"); l.querySelector(".msg-erro")?.remove(); }); form.querySelectorAll("[aria-invalid]").forEach(e => e.removeAttribute("aria-invalid")); }

document.addEventListener("click", async (ev) => {
  Autenticacao.tocar();
  const b = ev.target.closest("[data-acao]"); if (!b) return;
  const a = b.dataset.acao; const u = Autenticacao.atual();
  if (a === "demo") { const r = await Autenticacao.entrar(b.dataset.email, "ciranda123"); if (r) { rascunho = null; ir(r.papel === "Cliente" ? "#/catalogo" : r.papel === "Fornecedor" ? "#/minhas-pecas" : "#/aprovacoes"); } }
  if (a === "ir-cadastro") ir("#/cadastro");
  if (a === "ir-login") ir("#/entrar");
  if (a === "sair") { rascunho = null; pubFotos = []; Autenticacao.sair(); }
  if (a === "reiniciar") {
    if (b.dataset.armado !== "1") { b.dataset.armado = "1"; b.textContent = "Clique de novo para apagar o que foi feito e restaurar"; setTimeout(() => { if (b.isConnected) { b.dataset.armado = ""; b.textContent = "Restaurar dados de demonstração"; } }, 5000); return; }
    db = semente(); await Autenticacao.prepararSenhas(); Bastidores.log = []; Bastidores.desenhar(); rascunho = null; toast("Dados de demonstração restaurados."); ir("#/entrar");
  }
  if (a === "cat") { filtros.categoria = b.dataset.v; atualizarGrade(u); }
  if (a === "angulo") { if (visorAtual) visorAtual.girarPara(Number(b.dataset.a)); }
  if (a === "limpar-filtros") { filtros = { q: "", categoria: "", tamanho: "", ordem: "novas" }; render(); }
  if (a === "foto") { fotoAtiva = Number(b.dataset.i); const p = Repositorio.peca(location.hash.split("/")[2]); $("#fotoPrincipal").innerHTML = fotoPeca(p, fotoAtiva, { w: 720 }); document.querySelectorAll(".miniaturas button").forEach((x, i) => x.setAttribute("aria-pressed", String(i === fotoAtiva))); }
  if (a === "add-sacola") { addSacola(u, b.dataset.id, $("#fotoPrincipal"), b); }
  if (a === "add-rapido") { ev.preventDefault(); addSacola(u, b.dataset.id, b.closest(".foto"), b); }
  if (a === "ir-sacola") { ev.preventDefault(); ir("#/sacola"); }
  if (a === "rem-sacola") { const it = b.closest(".item"); it.classList.add("sai"); setTimeout(() => { db.sacola[u.id] = (db.sacola[u.id] || []).filter(x => x !== b.dataset.id); Repositorio.salvar(); render(); }, 350); }
  if (a === "finalizar") {
    const { pedido, removidas } = FachadaDeCompra.iniciarFinalizacao(u.id);
    pedido.removidas = removidas; Repositorio.salvar();
    ir(`#/confirmar/${pedido.id}`);
  }
  if (a === "abandonar") { FachadaDeCompra.abandonar(Repositorio.pedido(b.dataset.id)); ir("#/sacola"); }
  if (a === "copiar") { const i = $("#copiaCola"); i.select(); try { await navigator.clipboard.writeText(i.value); } catch (e) { document.execCommand("copy"); } toast("Código Pix copiado."); }
  if (a === "pagar" || a === "pagar-errado") {
    const tela = $("#telaBanco");
    if (tela) tela.innerHTML = `<div class="banco"><i></i> Seu banco</div><div class="gira" aria-hidden="true"></div><p style="text-align:center;font-weight:700">Enviando Pix…</p>`;
    ProvedorPixSimulado.pagarPeloAppDoBanco(b.dataset.tx, { valorErrado: a === "pagar-errado" });
    setTimeout(() => { const t = $("#telaBanco"); if (t) t.innerHTML = `<div class="banco"><i></i> Seu banco</div><div class="feito">${icone("check", 34)}</div><p style="text-align:center;font-weight:800">Pix enviado</p><p class="peq" style="text-align:center">Aguardando a loja confirmar…</p>`; }, 700);
  }
  if (a === "expirar") { const p = Repositorio.pedido(b.dataset.id); p.expiraEm = agora() - 1; rotina(); render(); }
  if (a === "fechar-festa") { document.querySelector(".festa")?.remove(); if (b.dataset.id) ir(`#/pedido/${b.dataset.id}`); else ir("#/catalogo"); }
  if (a === "aprovar") { const card = $("#ap-" + b.dataset.id); card.classList.add("vai-ok"); setTimeout(() => { Catalogo.decidir(b.dataset.id, true); toast("Aprovada. A peça já está na arara."); render(); }, 450); }
  if (a === "reprovar") { const box = document.getElementById("motivo-" + b.dataset.id); box.hidden = false; box.querySelector("textarea").focus(); }
  if (a === "cancelar-reprovar") { document.getElementById("motivo-" + b.dataset.id).hidden = true; }
  if (a === "confirmar-reprovar") { const t = document.getElementById("motivo-" + b.dataset.id).querySelector("textarea"); if (!t.value.trim()) { t.focus(); toast("Escreva o motivo para o fornecedor saber o que corrigir.", "erro"); return; } Catalogo.decidir(b.dataset.id, false, t.value.trim()); toast("Reprovada. O fornecedor vê o motivo."); render(); }
  if (a === "separar") { transicao(() => { Entrega.separar(b.dataset.id); render(); }); toast("Etiqueta gerada pelo serviço de entrega."); }
  if (a === "postar") { transicao(() => { Entrega.postar(b.dataset.id); render(); }); toast("Postado. A cliente recebeu o código de rastreio."); }
  if (a === "rastrear") { transicao(() => { Entrega.atualizarRastreio(b.dataset.id); render(); }); }
  if (a === "pagar-repasse") { Consignacao.pagarRepasses(b.dataset.id); toast("Repasse registrado como pago."); render(); }
  if (a === "pub") { const k = b.dataset.k; rascunho[k] = k === "padrao" ? Object.keys(PADROES).find(x => PADROES[x] === b.dataset.v) : b.dataset.v; b.parentElement.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", String(x === b))); atualizarPrevia(u); }
  if (a === "cor") { rascunho.cor = b.dataset.h; rascunho.corNome = b.dataset.n; b.parentElement.querySelectorAll(".cor").forEach(x => x.setAttribute("aria-pressed", String(x === b))); b.closest("div").previousElementSibling.querySelector("span").textContent = b.dataset.n; atualizarPrevia(u); }
  if (a === "fechar-bast") abrirBast(false);
  if (a === "limpar-bast") { Bastidores.log = []; Bastidores.desenhar(); }
});
document.addEventListener("keydown", (e) => { Autenticacao.tocar(); if (e.key === "Escape") { abrirBast(false); document.querySelector(".festa")?.remove(); } });

document.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const f = ev.target; const u = Autenticacao.atual();
  if (f.id === "fLogin") {
    const r = await Autenticacao.entrar(f.email.value, f.senha.value);
    if (!r) { $("#erroLogin").innerHTML = `<p class="aviso erro">${icone("info", 18)} E-mail ou senha incorretos. Confira e tente de novo.</p>`; return; }
    ir(r.papel === "Cliente" ? "#/catalogo" : r.papel === "Fornecedor" ? "#/minhas-pecas" : "#/aprovacoes");
  }
  if (f.id === "fCadastro") {
    limparErros(f); let ok = true;
    if (f.nome.value.trim().length < 3) { campoErro(f, "nome", "Informe seu nome completo."); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(f.email.value)) { campoErro(f, "email", "Informe um e-mail válido, como nome@dominio.com."); ok = false; }
    if (f.senha.value.length < 8) { campoErro(f, "senha", "A senha precisa ter pelo menos 8 caracteres."); ok = false; }
    if (!ok) return;
    const r = await Autenticacao.cadastrar(f.nome.value.trim(), f.email.value.trim(), f.senha.value);
    if (r.erro) { $("#erroCad").innerHTML = `<p class="aviso erro">${esc(r.erro)}</p>`; return; }
    toast("Conta criada. Enviamos a confirmação para o seu e-mail (simulado).");
    await Autenticacao.entrar(f.email.value, f.senha.value); ir("#/catalogo");
  }
  if (f.id === "fConfirmar") {
    const pid = location.hash.split("/")[2];
    limparErros(f);
    if (f.endereco.value.trim().length < 15) { campoErro(f, "endereco", "Informe o endereço completo, com número e CEP."); return; }
    FachadaDeCompra.confirmar(pid, { usarPontos: f.usarPontos && f.usarPontos.checked, endereco: f.endereco.value.trim() });
    ir(`#/pix/${pid}`);
  }
  if (f.id === "fPublicar") {
    limparErros(f);
    const r = rascunho; let ok = true;
    if (!r.titulo.trim()) { campoErro(f, "titulo", "Dê um título para a peça."); ok = false; }
    if (!r.marca.trim()) { campoErro(f, "marca", "Informe a marca. Se não souber, escreva Sem marca."); ok = false; }
    const preco = precoNum(r.preco);
    if (!(preco > 0)) { campoErro(f, "preco", "O preço precisa ser maior que zero."); ok = false; }   // RN03
    if (!r.descricao.trim()) { campoErro(f, "descricao", "Descreva a peça, com qualquer marca de uso."); ok = false; }
    if (pubFotos.length > 8) { toast("No máximo 8 fotos por peça.", "erro"); ok = false; }      // RN02
    if (!ok) { f.querySelector(".invalido input, .invalido textarea")?.focus(); return; }
    const dados = { titulo: r.titulo.trim(), descricao: r.descricao.trim(), categoria: r.categoria, marca: r.marca.trim(), tamanho: r.tamanho, conservacao: r.conservacao, corNome: r.corNome, cor: r.cor, padrao: r.padrao, preco, fotos: pubFotos.slice() };
    if (u.papel === "Administradora") dados.fornecedor = r.fornecedor;
    const res = Catalogo.publicar(dados, u);
    if (res.erro) { $("#erroPub").innerHTML = `<p class="aviso erro">${esc(res.erro)}</p>`; return; }
    pubFotos = []; rascunho = null;
    toast(res.peca.situacao === "Disponível" ? "Publicada. A peça já está na arara." : "Enviada. Ela entra na arara depois da aprovação.");
    ir(u.papel === "Fornecedor" ? "#/minhas-pecas" : "#/catalogo");
  }
  if (f.id === "fFornecedor") {
    limparErros(f);
    const d = Object.fromEntries(new FormData(f).entries()); let ok = true;
    if (d.nome.trim().length < 2) { campoErro(f, "nome", "Informe o nome."); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(d.contato)) { campoErro(f, "contato", "Informe um e-mail válido."); ok = false; }
    if (!d.cidade.trim()) { campoErro(f, "cidade", "Informe a cidade."); ok = false; }
    const pc = Number(d.percentual); if (!(pc >= 1 && pc <= 90)) { campoErro(f, "percentual", "Use um valor entre 1 e 90."); ok = false; }
    if (!ok) return;
    const fid = id("F"); db.fornecedores.push({ id: fid, nome: d.nome.trim(), contato: d.contato.trim(), cidade: d.cidade.trim(), ativo: true });
    db.consignacoes.push({ id: id("C"), fornecedor: fid, percentualRepasse: pc, inicio: agora(), fim: agora() + 365 * DIA });
    Repositorio.salvar();
    Bastidores.grupo("UC04 Gerenciar fornecedor e consignação");
    Bastidores.msg("frmFornecedores", "ctrlConsignacao", `cadastrar(${d.nome.trim()}, ${pc}%)`);
    Bastidores.dentro(() => { Bastidores.msg("ctrlConsignacao", ":Fornecedor", "«create»"); Bastidores.msg("ctrlConsignacao", ":Consignacao", "«create» vigência 12 meses"); });
    toast("Fornecedor cadastrado com consignação aberta."); render();
  }
});

let _tb;
document.addEventListener("input", (ev) => {
  const t = ev.target; const u = Autenticacao.atual();
  if (t.id === "q") {
    filtros.q = t.value; clearTimeout(_tb);
    _tb = setTimeout(() => {
      const pos = t.selectionStart;
      Bastidores.grupo("UC02 Buscar peça no catálogo");
      Bastidores.msg("frmCatalogo", "ctrlCatalogo", `buscar(${JSON.stringify(filtros.q)}, filtros)`);
      atualizarGrade(u);
    }, 250);
  }
  if (t.id === "usarPontos") {
    const tot = $("#totalPix"); const base = Number(tot.dataset.base), d = Number(tot.dataset.desc);
    $("#linhaDesc").hidden = !t.checked;
    const de = t.checked ? base : base - d, para = t.checked ? base - d : base, t0 = performance.now();
    const passo = (x) => { const p = Math.min(1, (x - t0) / 500), e = 1 - Math.pow(1 - p, 3); tot.textContent = brl(de + (para - de) * e); if (p < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
  if (t.form && t.form.id === "fPublicar" && rascunho && ["titulo", "marca", "preco", "descricao"].includes(t.name)) { rascunho[t.name] = t.value; atualizarPrevia(u); }
});
document.addEventListener("change", (ev) => {
  const t = ev.target; const u = Autenticacao.atual();
  if (t.id === "tam") { filtros.tamanho = t.value; atualizarGrade(u); }
  if (t.id === "ordem") { filtros.ordem = t.value; atualizarGrade(u); }
  if (t.form && t.form.id === "fPublicar" && t.name === "fornecedor") rascunho.fornecedor = t.value;
  if (t.name === "fotos" && t.form?.id === "fPublicar") {
    const arqs = [...t.files].slice(0, 8); pubFotos = [];
    if (t.files.length > 8) toast("Use no máximo 8 fotos. Ficamos com as 8 primeiras.", "erro");
    arqs.forEach(arq => {
      const img = new Image(); const fr = new FileReader();
      fr.onload = () => { img.onload = () => {
        const c = document.createElement("canvas"); const s = Math.min(1, 640 / img.width); c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        pubFotos.push(c.toDataURL("image/jpeg", 0.72)); atualizarPrevia(u);
      }; img.src = fr.result; };
      fr.readAsDataURL(arq);
    });
  }
});

function abrirBast(abrir) {
  const p = $("#bastidores"), b = $("#btBast");
  p.classList.toggle("aberto", abrir); p.setAttribute("aria-hidden", String(!abrir)); b.setAttribute("aria-expanded", String(abrir));
  if (abrir) { Bastidores.desenhar(); p.querySelector(".fechar")?.focus(); }
}
$("#btBast").addEventListener("click", () => abrirBast(!$("#bastidores").classList.contains("aberto")));
window.addEventListener("hashchange", () => { fotoAtiva = 0; transicao(render); window.scrollTo({ top: 0 }); });
window.addEventListener("storage", (e) => { if (e.key === CHAVE) { Repositorio.carregar(); render(); } });

(async function iniciar() {
  Repositorio.carregar();
  if (db.usuarios.some(u => u.senha)) await Autenticacao.prepararSenhas();
  Bastidores.desenhar();
  render();
  setInterval(() => { rotina(); tique(); }, 1000);
})();
