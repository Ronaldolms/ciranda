const CHAVE = "ciranda-mvp-v4";
const MIN = 60 * 1000;
const RESERVA_MIN = 30;          // RN08
const SESSAO_MIN = 30;           // RN25
const VALOR_PONTO = 0.10;        // 1 ponto = R$ 0,10
const LIMITE_PONTOS = 0.20;      // RN22
const VALIDADE_PONTOS_MESES = 12;// RN21
const FRETE = 15.90;

/* ------------------------------------------------------------ utilidades */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (v, d = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const agora = () => Date.now();
const dataHora = (t) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const data = (t) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const dataCurta = (t) => new Date(t).toLocaleDateString("pt-BR");
const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); // RNF09
const id = (p) => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const DIA = 24 * 60 * MIN;

/* ------------------------------------------------------------ bastidores */
const Bastidores = {
  log: [],
  nivel: 0,
  msg(de, para, mensagem, tipo = "") {
    this.log.push({ t: agora(), de, para, mensagem, nivel: this.nivel, tipo });
    if (this.log.length > 300) this.log.shift();
    this.desenhar(true);
  },
  grupo(txt) { this.log.push({ t: agora(), grupo: txt, nivel: this.nivel }); this.desenhar(true); },
  dentro(fn) { this.nivel++; try { return fn(); } finally { this.nivel--; } },
  desenhar(novo) {
    const ol = $("#logBast"); if (!ol) return;
    ol.innerHTML = this.log.map((l, i) => {
      const pad = `style="padding-left:${20 + l.nivel * 16}px"`;
      const cls = novo && i >= this.log.length - 1 ? ' class="novo"' : "";
      const hora = new Date(l.t).toLocaleTimeString("pt-BR");
      if (l.grupo) return `<li${cls} ${pad}><span class="t">${hora}</span><span class="grupo">${esc(l.grupo)}</span></li>`;
      const seta = l.tipo === "ret" ? "⇢" : l.tipo === "async" ? "⇝" : "→";
      return `<li${cls} ${pad}><span class="t">${hora}</span><span class="de">${esc(l.de)} ${seta} ${esc(l.para)}</span>: <span class="msg">${esc(l.mensagem)}</span></li>`;
    }).join("") || `<li style="padding:20px;color:#A9B3A2;font-family:var(--sans)">Nada por aqui ainda. Faça uma busca, uma compra ou despache um pedido e volte.</li>`;
    ol.scrollTop = ol.scrollHeight;
    const bt = $("#btBast"); if (novo && bt) { bt.classList.remove("pulsa"); void bt.offsetWidth; bt.classList.add("pulsa"); }
  }
};

/* ------------------------------------------------------------ fatores de impacto (RN17) */
const FONTE_ALGODAO = "Fator por quilo de algodão: 14,1 kg CO2e e 2,9 m³ de água, do berço ao portão (LCA comparativa de camisetas, Sustainability, v. 18, art. 4070, 2026), multiplicado pelo peso típico da peça.";
const FONTE_JEANS = "Levi Strauss & Co., avaliação de ciclo de vida da calça 501 (2015): 3.781 L e 33,4 kg CO2e no ciclo completo. Usamos só as fases de produção, sem a lavagem pelo consumidor: 77% da água e 63% do carbono.";
const CATEGORIAS = [
  { nome: "Camisetas e blusas", forma: "camiseta", fator: { agua: 725, co2: 3.5, pontosPorPeca: 35, peso: "250 g", fonte: FONTE_ALGODAO } },
  { nome: "Camisas", forma: "camisa", fator: { agua: 870, co2: 4.2, pontosPorPeca: 42, peso: "300 g", fonte: FONTE_ALGODAO } },
  { nome: "Vestidos", forma: "vestido", fator: { agua: 1160, co2: 5.6, pontosPorPeca: 56, peso: "400 g", fonte: FONTE_ALGODAO } },
  { nome: "Saias", forma: "saia", fator: { agua: 870, co2: 4.2, pontosPorPeca: 42, peso: "300 g", fonte: FONTE_ALGODAO } },
  { nome: "Calças jeans", forma: "calca", fator: { agua: 2911, co2: 21.0, pontosPorPeca: 210, peso: "calça 501", fonte: FONTE_JEANS } },
  { nome: "Jaquetas e casacos", forma: "jaqueta", fator: { agua: 2320, co2: 11.3, pontosPorPeca: 113, peso: "800 g", fonte: FONTE_ALGODAO } },
  { nome: "Calçados", forma: "tenis", fator: null },
  { nome: "Bolsas e acessórios", forma: "bolsa", fator: null },
];
const TAMANHOS = ["PP", "P", "M", "G", "GG", "34", "36", "38", "40", "42", "44", "Único"];
const CONSERVACAO = ["Novo com etiqueta", "Ótimo estado", "Bom estado", "Marcas de uso"];

/* ------------------------------------------------------------ dados de demonstração */
function semente() {
  const t = agora();
  const P = (o) => Object.assign({ fotos: [], vezesRevendida: 0, situacao: "Disponível", criadaEm: t - 20 * DIA, historico: [] }, o);
  const pecas = [
    P({ id: "PC01", titulo: "Camiseta listrada de algodão", marca: "Hering", tamanho: "M", cor: "#3E5C76", corNome: "Azul e off-white", conservacao: "Ótimo estado", categoria: "Camisetas e blusas", preco: 39.9, fornecedor: "F01", vezesRevendida: 1, descricao: "Listras finas, malha encorpada, gola sem deformação. Usada poucas vezes." }),
    P({ id: "PC02", titulo: "Calça jeans reta lavagem média", marca: "Levi's", tamanho: "40", cor: "#4F6D8F", corNome: "Azul médio", conservacao: "Bom estado", categoria: "Calças jeans", preco: 119.9, fornecedor: "F01", vezesRevendida: 2, descricao: "Modelo 501, cintura alta, barra original. Leve desbotado natural nos joelhos." }),
    P({ id: "PC03", titulo: "Vestido midi floral", marca: "Farm", tamanho: "P", cor: "#B5654A", corNome: "Terracota estampado", conservacao: "Ótimo estado", categoria: "Vestidos", preco: 149.0, fornecedor: "F02", descricao: "Viscose com forro, alças reguláveis e fenda lateral discreta." }),
    P({ id: "PC04", titulo: "Jaqueta jeans oversized", marca: "Zara", tamanho: "G", cor: "#5C7894", corNome: "Azul claro", conservacao: "Bom estado", categoria: "Jaquetas e casacos", preco: 129.9, fornecedor: "F02", vezesRevendida: 1, descricao: "Botões de metal, bolsos funcionais, corte amplo." }),
    P({ id: "PC05", titulo: "Camisa de linho manga longa", marca: "Reserva", tamanho: "M", cor: "#D8CFBF", corNome: "Areia", conservacao: "Novo com etiqueta", categoria: "Camisas", preco: 89.9, fornecedor: "F01", descricao: "Linho misto, nunca usada, ainda com etiqueta da loja." }),
    P({ id: "PC06", titulo: "Saia plissada", marca: "Amaro", tamanho: "38", cor: "#2E3A2C", corNome: "Verde musgo", conservacao: "Ótimo estado", categoria: "Saias", preco: 69.9, fornecedor: "F02", descricao: "Plissado firme, cós com elástico nas costas, comprimento midi." }),
    P({ id: "PC07", titulo: "Tênis de lona branco", marca: "Converse", tamanho: "38", cor: "#EDEAE2", corNome: "Branco", conservacao: "Bom estado", categoria: "Calçados", preco: 99.9, fornecedor: "F01", vezesRevendida: 1, descricao: "Cano baixo, solado sem desgaste irregular, higienizado." }),
    P({ id: "PC08", titulo: "Blusa de tricô canelado", marca: "Renner", tamanho: "P", cor: "#C9A27E", corNome: "Caramelo", conservacao: "Ótimo estado", categoria: "Camisetas e blusas", preco: 54.9, fornecedor: "F02", vezesRevendida: 3, descricao: "Tricô macio, punhos firmes, sem bolinhas." }),
    P({ id: "PC09", titulo: "Bolsa tiracolo de couro", marca: "Arezzo", tamanho: "Único", cor: "#6B3E26", corNome: "Café", conservacao: "Bom estado", categoria: "Bolsas e acessórios", preco: 159.0, fornecedor: "F02", descricao: "Couro legítimo, alça regulável, forro íntegro." }),
    P({ id: "PC10", titulo: "Calça jeans skinny escura", marca: "Colcci", tamanho: "36", cor: "#26344A", corNome: "Azul escuro", conservacao: "Ótimo estado", categoria: "Calças jeans", preco: 99.9, fornecedor: "F01", descricao: "Elastano na medida, cor ainda profunda, sem rasgos." }),
    P({ id: "PC11", titulo: "Camiseta básica orgânica", marca: "Insecta", tamanho: "G", cor: "#7C8A6A", corNome: "Oliva", conservacao: "Marcas de uso", categoria: "Camisetas e blusas", preco: 24.9, fornecedor: "F01", vezesRevendida: 1, descricao: "Algodão orgânico. Pequena mancha clara na barra, visível na segunda foto." }),
    P({ id: "PC12", titulo: "Vestido de linho cru", marca: "Cantão", tamanho: "M", cor: "#E2D7C3", corNome: "Cru", conservacao: "Ótimo estado", categoria: "Vestidos", preco: 139.0, fornecedor: "F01", situacao: "Aguardando aprovação", criadaEm: t - 2 * 3600 * 1000, descricao: "Linho puro, botões de coco, bolsos laterais." }),
    P({ id: "PC15", titulo: "Camiseta branca de bolso", marca: "Osklen", tamanho: "M", cor: "#F3F3F4", corNome: "Branco", conservacao: "Ótimo estado", categoria: "Camisetas e blusas", preco: 59.9, fornecedor: "F02", estampa: { kind: "pocket" }, descricao: "Malha pesada, bolso no peito, gola firme." }),
    P({ id: "PC16", titulo: "Moletom Clube da Roda", marca: "Redley", tamanho: "G", cor: "#2C4844", corNome: "Verde garrafa", conservacao: "Bom estado", categoria: "Camisetas e blusas", preco: 79.9, fornecedor: "F01", vezesRevendida: 2, padrao: "trico", estampa: { kind: "serif", lines: ["Clube", "da", "Roda"], ink: "#F1EDE2" }, descricao: "Moletom flanelado com estampa de clube. Punhos com leve desgaste." }),
    P({ id: "PC17", titulo: "Camisa estampada de viscose", marca: "Foxton", tamanho: "M", cor: "#2F3631", corNome: "Verde escuro estampado", conservacao: "Ótimo estado", categoria: "Camisas", preco: 84.9, fornecedor: "F02", vezesRevendida: 1, estampa: { kind: "pattern", colours: ["#20251F", "#E6DCC4", "#C7A46C", "#9FAE86", "#BF7350"] }, descricao: "Manga curta, estampa de raminhos, caimento solto." }),
    P({ id: "PC18", titulo: "Camiseta preta lisa", marca: "Basico.com", tamanho: "P", cor: "#1B1B1D", corNome: "Preto", conservacao: "Ótimo estado", categoria: "Camisetas e blusas", preco: 29.9, fornecedor: "F01", descricao: "Algodão pima, preto ainda fechado, sem desbotar." }),
    P({ id: "PC19", titulo: "Camiseta Flor de Maio", marca: "Farm", tamanho: "M", cor: "#F4F4F5", corNome: "Branco estampado", conservacao: "Bom estado", categoria: "Camisetas e blusas", preco: 44.9, fornecedor: "F02", vezesRevendida: 1, estampa: { kind: "flowers", text: "Flor de Maio", ink: "#1F1F24" }, descricao: "Estampa de flores no peito, malha fina." }),
    // vendidas nos pedidos de exemplo
    P({ id: "PC13", titulo: "Camiseta gola careca", marca: "Hering", tamanho: "M", cor: "#9A3F33", corNome: "Vinho", conservacao: "Ótimo estado", categoria: "Camisetas e blusas", preco: 34.9, fornecedor: "F01", situacao: "Vendida", vezesRevendida: 1 }),
    P({ id: "PC14", titulo: "Jaqueta de sarja", marca: "Hering", tamanho: "M", cor: "#8A7A55", corNome: "Cáqui", conservacao: "Bom estado", categoria: "Jaquetas e casacos", preco: 109.9, fornecedor: "F02", situacao: "Vendida" }),
  ];
  const usuarios = [
    { id: "U01", papel: "Cliente", nome: "Ana Costa", email: "ana@ciranda.app", senha: "ciranda123", endereco: "SQN 210, Bloco C, apto 304, Asa Norte, Brasília, DF, 70862-030", saldoDePontos: 0 },
    { id: "U02", papel: "Fornecedor", nome: "Beatriz Ribeiro", email: "beatriz@ciranda.app", senha: "ciranda123", fornecedor: "F01" },
    { id: "U03", papel: "Administradora", nome: "Lúcia Andrade", email: "lucia@ciranda.app", senha: "ciranda123" },
  ];
  const fornecedores = [
    { id: "F01", nome: "Beatriz Ribeiro", contato: "beatriz@ciranda.app", cidade: "Brasília, DF", ativo: true },
    { id: "F02", nome: "Brechó Dona Célia", contato: "celia@donacelia.com.br", cidade: "Taguatinga, DF", ativo: true },
  ];
  const consignacoes = [
    { id: "C01", fornecedor: "F01", percentualRepasse: 60, inicio: t - 90 * DIA, fim: t + 275 * DIA },
    { id: "C02", fornecedor: "F02", percentualRepasse: 55, inicio: t - 60 * DIA, fim: t + 305 * DIA },
  ];
  pecas.forEach(p => p.consignacao = p.fornecedor === "F01" ? "C01" : "C02");
  const PAD = { PC01: "listras", PC02: "jeans", PC03: "floral", PC04: "jeans", PC05: "linho", PC07: "lona", PC08: "trico", PC09: "couro", PC10: "jeans", PC12: "linho", PC14: "lona", PC16: "trico" };
  pecas.forEach(p => p.padrao = PAD[p.id] || "liso");
  const h = (s, em) => ({ situacao: s, em });
  const pedidos = [
    { id: "P-1001", cliente: "U01", endereco: usuarios[0].endereco, itens: [{ peca: "PC13", precoPraticado: 34.9 }], frete: FRETE, desconto: 0, pontosUsados: 0,
      situacao: "Entregue", criadoEm: t - 52 * DIA, pagoEm: t - 52 * DIA + 9 * MIN, pontosCreditados: 35,
      historico: [h("Aguardando pagamento", t - 52 * DIA), h("Pago", t - 52 * DIA + 9 * MIN), h("Em separação", t - 51 * DIA), h("Enviado", t - 50 * DIA), h("Entregue", t - 46 * DIA)] },
    { id: "P-1002", cliente: "U01", endereco: usuarios[0].endereco, itens: [{ peca: "PC14", precoPraticado: 109.9 }], frete: FRETE, desconto: 0, pontosUsados: 0,
      situacao: "Pago", criadoEm: t - 1 * DIA, pagoEm: t - 1 * DIA + 6 * MIN, pontosCreditados: 113,
      historico: [h("Aguardando pagamento", t - 1 * DIA), h("Pago", t - 1 * DIA + 6 * MIN)] },
  ];
  const pagamentos = [
    { id: "PG01", pedido: "P-1001", valor: 50.8, txid: "E2E8A1F0C3", situacao: "Confirmado", confirmadoEm: t - 52 * DIA + 9 * MIN },
    { id: "PG02", pedido: "P-1002", valor: 125.8, txid: "E2E77B21D9", situacao: "Confirmado", confirmadoEm: t - 1 * DIA + 6 * MIN },
  ];
  const entregas = [
    { id: "EN01", pedido: "P-1001", codigoRastreio: "CR482019334BR", prazo: t - 46 * DIA, etapas: [h("Postado", t - 50 * DIA), h("Em trânsito", t - 49 * DIA), h("Saiu para entrega", t - 46 * DIA - 5 * 3600000), h("Entregue", t - 46 * DIA)] },
  ];
  const repasses = [
    { id: "R01", peca: "PC13", consignacao: "C01", valor: 34.9 * 0.6, em: t - 52 * DIA, pago: true },
    { id: "R02", peca: "PC14", consignacao: "C02", valor: 109.9 * 0.55, em: t - 1 * DIA, pago: false },
  ];
  const extratoPontos = [
    { id: "X01", cliente: "U01", tipo: "credito", pontos: 35, pedido: "P-1001", em: t - 52 * DIA, expiraEm: t - 52 * DIA + 365 * DIA },
    { id: "X02", cliente: "U01", tipo: "credito", pontos: 113, pedido: "P-1002", em: t - 1 * DIA, expiraEm: t - 1 * DIA + 365 * DIA },
  ];
  usuarios[0].saldoDePontos = 148;
  return { versao: 1, pecas, usuarios, fornecedores, consignacoes, pedidos, pagamentos, entregas, repasses, extratoPontos, ocorrencias: [], sacola: {}, sessao: null, seq: 1003 };
}

/* ------------------------------------------------------------ Repositorio (persistência) */
let db;
const Repositorio = {
  carregar() {
    try { const s = localStorage.getItem(CHAVE); if (s) { db = JSON.parse(s); return; } } catch (e) {}
    db = semente();
  },
  salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) {} },
  peca: (i) => db.pecas.find(p => p.id === i),
  pedido: (i) => db.pedidos.find(p => p.id === i),
  usuario: (i) => db.usuarios.find(u => u.id === i),
  fornecedor: (i) => db.fornecedores.find(f => f.id === i),
  consignacao: (i) => db.consignacoes.find(c => c.id === i),
  categoria: (n) => CATEGORIAS.find(c => c.nome === n),
};

/* ------------------------------------------------------------ Autenticacao (UC10) */
async function hashSenha(s) {           // RN24: a senha nunca é guardada em texto
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ciranda:" + s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  } catch (e) { let h = 0; for (const c of "ciranda:" + s) h = (h * 31 + c.charCodeAt(0)) | 0; return "f" + (h >>> 0).toString(16); }
}
const Autenticacao = {
  async prepararSenhas() {
    for (const u of db.usuarios) if (u.senha) { u.hashSenha = await hashSenha(u.senha); delete u.senha; }
    Repositorio.salvar();
  },
  async entrar(email, senha) {
    Bastidores.grupo("UC10 Fazer login");
    Bastidores.msg("frmLogin", "ctrlAutenticacao", `entrar(${email})`);
    const u = db.usuarios.find(x => x.email.toLowerCase() === email.trim().toLowerCase());
    const h = await hashSenha(senha);
    Bastidores.dentro(() => Bastidores.msg("ctrlAutenticacao", ":Usuario", "conferirHash(hashSenha): boolean"));
    if (!u || u.hashSenha !== h) { Bastidores.msg("ctrlAutenticacao", "frmLogin", "credenciais inválidas", "ret"); return null; }
    db.sessao = { usuario: u.id, ultimaAtividade: agora() };
    Repositorio.salvar();
    Bastidores.msg("ctrlAutenticacao", "frmLogin", `sessão de ${u.papel} aberta (expira em ${SESSAO_MIN} min sem uso)`, "ret");
    return u;
  },
  async cadastrar(nome, email, senha) {
    if (db.usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())) return { erro: "Já existe uma conta com este e-mail. Entre com ela ou use outro e-mail." };
    const u = { id: id("U"), papel: "Cliente", nome, email, hashSenha: await hashSenha(senha), endereco: "", saldoDePontos: 0 };
    db.usuarios.push(u); Repositorio.salvar();
    Bastidores.grupo("UC10 Cadastro de cliente");
    Bastidores.msg("frmCadastro", "ctrlAutenticacao", `cadastrar(${email})`);
    Bastidores.dentro(() => Bastidores.msg("ctrlAutenticacao", "Serviço de e-mail", "enviarConfirmacao(email) [simulado]", "async"));
    return { usuario: u };
  },
  sair(motivo) { db.sessao = null; Repositorio.salvar(); if (motivo) toast(motivo); ir("#/entrar"); },
  atual() { return db.sessao ? Repositorio.usuario(db.sessao.usuario) : null; },
  tocar() { if (db.sessao) { db.sessao.ultimaAtividade = agora(); } },
};

/* ------------------------------------------------------------ ImpactoPontos (UC06) */
const ImpactoPontos = {
  fator(peca) { const c = Repositorio.categoria(peca.categoria); return c && c.fator; },
  pontosDaPeca(peca) { const f = this.fator(peca); return f ? f.pontosPorPeca : 0; },
  creditar(cliente, pedido) {
    const pontos = pedido.itens.reduce((s, i) => s + this.pontosDaPeca(Repositorio.peca(i.peca)), 0);
    if (!pontos) return 0;
    const u = Repositorio.usuario(cliente);
    u.saldoDePontos += pontos;
    db.extratoPontos.push({ id: id("X"), cliente, tipo: "credito", pontos, pedido: pedido.id, em: agora(), expiraEm: agora() + 365 * DIA });
    pedido.pontosCreditados = pontos;
    return pontos;
  },
  descontoMaximo(cliente, valorPecas) {
    const u = Repositorio.usuario(cliente);
    const porSaldo = u.saldoDePontos * VALOR_PONTO;
    const porRegra = valorPecas * LIMITE_PONTOS;
    const desconto = Math.floor(Math.min(porSaldo, porRegra) * 100) / 100;
    return { desconto, pontos: Math.ceil(desconto / VALOR_PONTO - 1e-9) };
  },
  debitar(cliente, pontos, pedido) {
    const u = Repositorio.usuario(cliente);
    u.saldoDePontos -= pontos;
    db.extratoPontos.push({ id: id("X"), cliente, tipo: "uso", pontos, pedido, em: agora() });
  },
  devolver(cliente, pontos, pedido) {
    const u = Repositorio.usuario(cliente);
    u.saldoDePontos += pontos;
    db.extratoPontos.push({ id: id("X"), cliente, tipo: "estorno", pontos, pedido, em: agora(), expiraEm: agora() + 365 * DIA });
  },
  resumo(cliente) {
    const pagos = db.pedidos.filter(p => p.cliente === cliente && ["Pago", "Em separação", "Enviado", "Entregue"].includes(p.situacao)); // RN18
    let agua = 0, co2 = 0, pecas = 0, semFator = 0;
    pagos.forEach(p => p.itens.forEach(i => {
      const pc = Repositorio.peca(i.peca); const f = this.fator(pc);
      if (f) { agua += f.agua; co2 += f.co2; pecas++; } else semFator++;
    }));
    return { agua, co2, pecas, semFator, pedidos: pagos };
  }
};

/* ------------------------------------------------------------ Catalogo (UC01, UC02, UC07) */
const Catalogo = {
  disponiveis(f = {}) {
    const q = semAcento(f.q || "");
    return db.pecas.filter(p => p.situacao === "Disponível")
      .filter(p => !q || semAcento([p.titulo, p.marca, p.categoria, p.corNome, p.descricao].join(" ")).includes(q))
      .filter(p => !f.categoria || p.categoria === f.categoria)
      .filter(p => !f.tamanho || p.tamanho === f.tamanho)
      .filter(p => !f.conservacao || p.conservacao === f.conservacao)
      .filter(p => !f.precoMax || p.preco <= Number(f.precoMax))
      .sort((a, b) => b.criadaEm - a.criadaEm);
  },
  reservar(pecaId, pedidoId) {                 // operação atômica: o JS roda em uma thread só
    const p = Repositorio.peca(pecaId);
    if (!p || p.situacao !== "Disponível") return false;
    p.situacao = "Reservada"; p.reservadaPara = pedidoId; return true;
  },
  liberarReserva(pecaId) { const p = Repositorio.peca(pecaId); if (p && p.situacao === "Reservada") { p.situacao = "Disponível"; delete p.reservadaPara; } },
  marcarVendida(pecaId) { const p = Repositorio.peca(pecaId); p.situacao = "Vendida"; delete p.reservadaPara; },
  publicar(dados, usuario) {
    const ehAdmin = usuario.papel === "Administradora";
    const forn = ehAdmin ? dados.fornecedor : usuario.fornecedor;
    const cons = db.consignacoes.find(c => c.fornecedor === forn && c.fim > agora());
    if (!cons) return { erro: "Não há consignação vigente para este fornecedor. Fale com a administradora." };
    const p = Object.assign({ id: id("PC"), vezesRevendida: 0, criadaEm: agora(), fornecedor: forn, consignacao: cons.id, historico: [] }, dados);
    p.situacao = ehAdmin ? "Disponível" : "Aguardando aprovação";   // UC01 8a
    db.pecas.push(p); Repositorio.salvar();
    Bastidores.grupo("UC01 Publicar peça no catálogo");
    Bastidores.msg("frmPublicarPeca", "ctrlCatalogo", `publicar(${p.titulo})`);
    Bastidores.dentro(() => {
      Bastidores.msg("ctrlCatalogo", ":Peca", `«create» situação = ${p.situacao}`);
      Bastidores.msg("ctrlCatalogo", ":Consignacao", `vincular(${cons.id})`);
      if (!ehAdmin) Bastidores.msg("ctrlCatalogo", "Administradora", "notificarPecaPendente()", "async");
    });
    return { peca: p };
  },
  decidir(pecaId, aprovar, motivo) {
    const p = Repositorio.peca(pecaId);
    p.situacao = aprovar ? "Disponível" : "Reprovada";
    if (!aprovar) p.motivoReprovacao = motivo || "Fotos ou descrição insuficientes.";
    p.decididaEm = agora(); Repositorio.salvar();
    Bastidores.grupo("UC01 Aprovação da administradora");
    Bastidores.msg("frmAprovacoes", "ctrlCatalogo", aprovar ? `aprovar(${p.id})` : `reprovar(${p.id}, motivo)`);
    Bastidores.dentro(() => Bastidores.msg("ctrlCatalogo", ":Peca", `alterarSituacao(${p.situacao})`));
  }
};

/* ------------------------------------------------------------ Pedidos (UC05) */
const Pedidos = {
  criar(cliente, endereco) {
    const p = { id: "P-" + (db.seq++), cliente, endereco, itens: [], frete: FRETE, desconto: 0, pontosUsados: 0, situacao: "Em finalização", criadoEm: agora(), historico: [] };
    db.pedidos.push(p); return p;
  },
  alterarSituacao(p, s) { p.situacao = s; p.historico.push({ situacao: s, em: agora() }); }, // RN16
  valorPecas: (p) => p.itens.reduce((s, i) => s + i.precoPraticado, 0),
  total(p) { return Math.max(0, Math.round((this.valorPecas(p) + p.frete - p.desconto) * 100) / 100); },
  doCliente: (c) => db.pedidos.filter(p => p.cliente === c && p.situacao !== "Em finalização").sort((a, b) => b.criadoEm - a.criadoEm), // RN15
};

/* ------------------------------------------------------------ Consignacao (UC04) */
const Consignacao = {
  registrarRepasse(pecaId, precoPraticado) {
    const pc = Repositorio.peca(pecaId); const c = Repositorio.consignacao(pc.consignacao);
    const valor = Math.round(precoPraticado * c.percentualRepasse) / 100;   // RN10
    db.repasses.push({ id: id("R"), peca: pecaId, consignacao: c.id, valor, em: agora(), pago: false });
    return valor;
  },
  resumo(fornecedorId) {
    const cons = db.consignacoes.filter(c => c.fornecedor === fornecedorId).map(c => c.id);
    const rep = db.repasses.filter(r => cons.includes(r.consignacao));
    return {
      pecas: db.pecas.filter(p => p.fornecedor === fornecedorId),
      vendido: rep.length,
      aPagar: rep.filter(r => !r.pago).reduce((s, r) => s + r.valor, 0),
      pago: rep.filter(r => r.pago).reduce((s, r) => s + r.valor, 0),
      repasses: rep,
    };
  },
  pagarRepasses(fornecedorId) {
    const cons = db.consignacoes.filter(c => c.fornecedor === fornecedorId).map(c => c.id);
    db.repasses.filter(r => cons.includes(r.consignacao) && !r.pago).forEach(r => { r.pago = true; r.pagoEm = agora(); });
    Repositorio.salvar();
  }
};

/* ------------------------------------------------------------ Provedor Pix (sistema externo, simulado) */
const ProvedorPixSimulado = {
  cobrancas: {},
  gerarCobranca(valor, expiracao) {
    const txid = "E2E" + Math.random().toString(16).slice(2, 12).toUpperCase();
    const copiaECola = `00020126580014br.gov.bcb.pix0136ciranda-demo-${txid.toLowerCase()}5204000053039865406${valor.toFixed(2)}5802BR5907CIRANDA6008BRASILIA62070503***6304${txid.slice(-4)}`;
    this.cobrancas[txid] = { valor, expiracao, paga: false };
    return { txid, copiaECola };
  },
  pagarPeloAppDoBanco(txid, { valorErrado = false, assinaturaFalsa = false } = {}) {   // o cliente paga fora do sistema
    const c = this.cobrancas[txid] || { valor: 0 };
    c.paga = true;
    Bastidores.msg("Cliente", "Provedor Pix", "pagarPeloAppDoBanco(copiaECola)", "async");
    setTimeout(() => {
      const valorPago = valorErrado ? Math.round(c.valor * 50) / 100 : c.valor;
      Pagamento.notificarPagamento({ txid, valorPago, assinatura: assinaturaFalsa ? "invalida" : "psp-ok:" + txid });
    }, 1400);
  },
  consultarCobranca(txid) { const c = this.cobrancas[txid]; return c ? (c.paga ? "PAGA" : "ATIVA") : "DESCONHECIDA"; }
};

/* ------------------------------------------------------------ Pagamento (UC08) */
const Pagamento = {
  realizarPagamento(pedido) {
    Bastidores.msg("ctrlFinalizarPedido", "ctrlPagamento", `realizarPagamento(${pedido.id})`);
    return Bastidores.dentro(() => {
      const valor = Pedidos.total(pedido);
      const pg = { id: id("PG"), pedido: pedido.id, valor, situacao: "Aguardando" };
      Bastidores.msg("ctrlPagamento", ":Pagamento", `«create» criar(${brl(valor)})`);
      pedido.expiraEm = agora() + RESERVA_MIN * MIN;                   // RN08: conta a partir da cobrança
      const cob = ProvedorPixSimulado.gerarCobranca(valor, pedido.expiraEm);
      Bastidores.msg("ctrlPagamento", "Provedor Pix", `gerarCobranca(${brl(valor)}, 30 min)`);
      Bastidores.msg("Provedor Pix", "ctrlPagamento", `txid ${cob.txid}, qrCode, copiaECola`, "ret");
      Object.assign(pg, cob); db.pagamentos.push(pg);
      Bastidores.msg("ctrlPagamento", ":Pagamento", `registrarCobranca(${cob.txid})`);
      Pedidos.alterarSituacao(pedido, "Aguardando pagamento");
      Bastidores.msg("ctrlPagamento", ":Pedido", "alterarSituacao(AguardandoPagamento)");
      Bastidores.msg("ctrlPagamento", "frmPagamentoPix", "exibirCodigoPix(qrCode, tempoRestante)");
      Repositorio.salvar();
      return pg;
    });
  },
  notificarPagamento({ txid, valorPago, assinatura }) {              // webhook do provedor (assíncrono)
    Bastidores.grupo("UC08 Notificação do provedor");
    Bastidores.msg("Provedor Pix", "ctrlPagamento", `notificarPagamento(${txid}, ${brl(valorPago)})`, "async");
    const pg = db.pagamentos.find(p => p.txid === txid);
    if (!pg) return;
    const pedido = Repositorio.pedido(pg.pedido);
    Bastidores.dentro(() => {
      const autentica = assinatura === "psp-ok:" + txid;
      Bastidores.msg("ctrlPagamento", "ctrlPagamento", `validarAutenticidade(notificacao): ${autentica}`);
      const confere = Math.abs(valorPago - pg.valor) < 0.005;
      Bastidores.msg("ctrlPagamento", ":Pagamento", `conferirValor(${brl(valorPago)}): ${confere}`);
      if (pedido.situacao !== "Aguardando pagamento") {
        Bastidores.msg("ctrlPagamento", "ctrlPagamento", `ignorar: pedido já está ${pedido.situacao}`);
        return;
      }
      if (autentica && confere) {                                       // RN11
        pg.situacao = "Confirmado"; pg.confirmadoEm = agora();
        Bastidores.msg("ctrlPagamento", ":Pagamento", "confirmar(dataHora, txid)");
        Bastidores.msg("ctrlPagamento", "ctrlFinalizarPedido", "pagamento confirmado", "ret");
        FachadaDeCompra.aoPagamentoConfirmado(pedido);
      } else {
        pg.situacao = "Ocorrência";
        db.ocorrencias.push({ id: id("OC"), pedido: pedido.id, em: agora(), texto: autentica ? `Valor pago (${brl(valorPago)}) diferente do cobrado (${brl(pg.valor)}).` : "Notificação de pagamento com assinatura inválida." });
        Bastidores.msg("ctrlPagamento", "ctrlPagamento", "registrarOcorrencia(pedido)");
        toast("O pagamento não foi confirmado. A administradora foi avisada e a reserva continua até expirar.", "erro");
      }
    });
    Repositorio.salvar(); render();
  }
};

/* ------------------------------------------------------------ Serviço de Entrega (externo, simulado) e Entrega (UC09) */
const ServicoDeEntregaSimulado = {
  gerarEtiqueta(endereco, pecas) {
    const n = String(Math.floor(1e8 + Math.random() * 9e8));
    return { codigoRastreio: "CR" + n + "BR", prazo: agora() + 5 * DIA, cotacao: FRETE };
  },
  ETAPAS: ["Postado", "Em trânsito", "Saiu para entrega", "Entregue"],
  consultarRastreio(entrega) {
    const i = this.ETAPAS.indexOf(entrega.etapas[entrega.etapas.length - 1].situacao);
    return this.ETAPAS[Math.min(i + 1, this.ETAPAS.length - 1)];
  }
};
const Entrega = {
  daFila: () => db.pedidos.filter(p => ["Pago", "Em separação", "Enviado"].includes(p.situacao)).sort((a, b) => a.pagoEm - b.pagoEm),
  doPedido: (pid) => db.entregas.find(e => e.pedido === pid),
  separar(pid) {
    const p = Repositorio.pedido(pid);
    Bastidores.grupo("UC09 Gerenciar entrega");
    Bastidores.msg("frmFilaDeEntregas", "ctrlEntrega", `separar(${pid})`);
    Bastidores.dentro(() => {
      Pedidos.alterarSituacao(p, "Em separação");
      Bastidores.msg("ctrlEntrega", ":Pedido", "alterarSituacao(EmSeparacao)");
      const et = ServicoDeEntregaSimulado.gerarEtiqueta(p.endereco, p.itens);
      Bastidores.msg("ctrlEntrega", "Serviço de Entrega", "gerarEtiqueta(endereco, pecas)");
      Bastidores.msg("Serviço de Entrega", "ctrlEntrega", `etiqueta, ${et.codigoRastreio}, prazo`, "ret");
      db.entregas.push({ id: id("EN"), pedido: pid, codigoRastreio: et.codigoRastreio, prazo: et.prazo, etapas: [] });
      Bastidores.msg("ctrlEntrega", ":Entrega", "«create» criar(codigoRastreio, prazoEstimado)");
    });
    Repositorio.salvar();
  },
  postar(pid) {
    const p = Repositorio.pedido(pid); const e = this.doPedido(pid);
    Bastidores.msg("frmFilaDeEntregas", "ctrlEntrega", `registrarPostagem(${pid})`);
    Bastidores.dentro(() => {
      e.etapas.push({ situacao: "Postado", em: agora() });
      Bastidores.msg("ctrlEntrega", ":Entrega", "registrarEtapa(Postado, dataHora)");
      Pedidos.alterarSituacao(p, "Enviado");
      Bastidores.msg("ctrlEntrega", ":Pedido", "alterarSituacao(Enviado)");
      Bastidores.msg("ctrlEntrega", "ctrlEntrega", `notificarCliente(${e.codigoRastreio})`);
    });
    Repositorio.salvar();
  },
  atualizarRastreio(pid) {
    const p = Repositorio.pedido(pid); const e = this.doPedido(pid);
    Bastidores.msg("ctrlEntrega", "ctrlEntrega", `acompanharEntrega(${pid})`);
    Bastidores.dentro(() => {
      const etapa = ServicoDeEntregaSimulado.consultarRastreio(e);
      Bastidores.msg("ctrlEntrega", "Serviço de Entrega", `consultarRastreio(${e.codigoRastreio})`);
      Bastidores.msg("Serviço de Entrega", "ctrlEntrega", etapa, "ret");
      e.etapas.push({ situacao: etapa, em: agora() });
      Bastidores.msg("ctrlEntrega", ":Entrega", `registrarEtapa(${etapa}, dataHora)`);
      if (etapa === "Entregue") {
        Pedidos.alterarSituacao(p, "Entregue");
        Bastidores.msg("ctrlEntrega", ":Pedido", "alterarSituacao(Entregue)");
        Bastidores.msg("ctrlEntrega", "ctrlEntrega", "notificarCliente(entregue)");
      }
    });
    Repositorio.salvar();
  }
};

/* ------------------------------------------------------------ FachadaDeCompra «facade» (UC03)
   A tela da sacola conversa só com esta fachada. Ela esconde a ordem certa das chamadas a
   Catalogo, Pedidos, ImpactoPontos, Pagamento e Consignacao. */
const FachadaDeCompra = {
  iniciarFinalizacao(clienteId) {
    const u = Repositorio.usuario(clienteId);
    const sacola = db.sacola[clienteId] || [];
    Bastidores.grupo("UC03 Finalizar pedido");
    Bastidores.msg("frmSacola", "ctrlFinalizarPedido «facade»", `iniciarFinalizacao(sacola com ${sacola.length})`);
    return Bastidores.dentro(() => {
      const pedido = Pedidos.criar(clienteId, u.endereco);
      Bastidores.msg("ctrlFinalizarPedido", ":Pedido", `«create» criar(${pedido.id})`);
      const removidas = [];
      sacola.forEach(pid => {                                         // loop + critical
        const ok = Catalogo.reservar(pid, pedido.id);
        Bastidores.msg("ctrlFinalizarPedido", ":Peca", `[critical] reservar(${pid}): ${ok}`);
        const pc = Repositorio.peca(pid);
        if (ok) pedido.itens.push({ peca: pid, precoPraticado: pc.preco });   // ItemDoPedido sem quantidade
        else { removidas.push(pc ? pc.titulo : pid); Bastidores.msg("ctrlFinalizarPedido", "ctrlFinalizarPedido", `removerDaSacola(${pid})`); }
      });
      db.sacola[clienteId] = sacola.filter(pid => pedido.itens.some(i => i.peca === pid));
      pedido.expiraEm = agora() + RESERVA_MIN * MIN;
      Bastidores.msg("ctrlFinalizarPedido", ":Pedido", `calcularTotal(): ${brl(Pedidos.total(pedido))}`);
      Bastidores.msg("ctrlFinalizarPedido", ":Cliente", `consultarSaldoDePontos(): ${u.saldoDePontos}`);
      Repositorio.salvar();
      return { pedido, removidas };
    });
  },
  confirmar(pedidoId, { usarPontos, endereco }) {
    const pedido = Repositorio.pedido(pedidoId);
    Bastidores.msg("frmSacola", "ctrlFinalizarPedido «facade»", `confirmar(${pedidoId}, usarPontos=${!!usarPontos})`);
    return Bastidores.dentro(() => {
      if (endereco) { pedido.endereco = endereco; Repositorio.usuario(pedido.cliente).endereco = endereco; }
      if (usarPontos) {
        const { desconto, pontos } = ImpactoPontos.descontoMaximo(pedido.cliente, Pedidos.valorPecas(pedido));
        if (pontos > 0) {
          pedido.desconto = desconto; pedido.pontosUsados = pontos;
          ImpactoPontos.debitar(pedido.cliente, pontos, pedido.id);
          Bastidores.msg("ctrlFinalizarPedido", ":Pedido", `aplicarDescontoDePontos(${pontos}): ${brl(desconto)} (máx. 20%)`);
        }
      }
      Bastidores.msg("ctrlFinalizarPedido", "UC08", "ref Realizar pagamento via Pix");
      return Pagamento.realizarPagamento(pedido);
    });
  },
  aoPagamentoConfirmado(pedido) {
    Bastidores.msg("ctrlPagamento", "ctrlFinalizarPedido «facade»", `aoPagamentoConfirmado(${pedido.id})`);
    Bastidores.dentro(() => {
      Pedidos.alterarSituacao(pedido, "Pago"); pedido.pagoEm = agora();
      Bastidores.msg("ctrlFinalizarPedido", ":Pedido", "alterarSituacao(Pago)");
      pedido.itens.forEach(i => {
        Catalogo.marcarVendida(i.peca);
        Bastidores.msg("ctrlFinalizarPedido", ":Peca", `*marcarVendida(${brl(i.precoPraticado)})`);
      });
      Bastidores.grupo("par");
      pedido.itens.forEach(i => {
        const v = Consignacao.registrarRepasse(i.peca, i.precoPraticado);
        Bastidores.msg("ctrlFinalizarPedido", ":Consignacao", `*registrarRepasse(${brl(i.precoPraticado)}): ${brl(v)}`);
      });
      const pts = ImpactoPontos.creditar(pedido.cliente, pedido);
      Bastidores.msg("ctrlFinalizarPedido", ":Cliente", `creditarPontos(${pts})`);
      db.sacola[pedido.cliente] = [];
    });
    Repositorio.salvar();
    pedido.celebrar = true; Repositorio.salvar();
  },
  cancelarPorExpiracao(pedido) {
    Bastidores.grupo("UC03 alt: prazo de 30 min expirado");
    Bastidores.msg("rotinaDeExpiracao", "ctrlFinalizarPedido «facade»", `cancelarPorExpiracao(${pedido.id})`);
    Bastidores.dentro(() => {
      Pedidos.alterarSituacao(pedido, "Cancelado");
      Bastidores.msg("ctrlFinalizarPedido", ":Pedido", "alterarSituacao(Cancelado)");
      pedido.itens.forEach(i => { Catalogo.liberarReserva(i.peca); Bastidores.msg("ctrlFinalizarPedido", ":Peca", "*liberarReserva()"); });
      if (pedido.pontosUsados) { ImpactoPontos.devolver(pedido.cliente, pedido.pontosUsados, pedido.id); Bastidores.msg("ctrlFinalizarPedido", ":Cliente", `estornarPontos(${pedido.pontosUsados})`); }
    });
    Repositorio.salvar();
  },
  abandonar(pedido) {          // cliente saiu da finalização antes de gerar a cobrança
    pedido.itens.forEach(i => Catalogo.liberarReserva(i.peca));
    pedido.situacao = "Cancelado"; pedido.historico.push({ situacao: "Cancelado", em: agora() });
    Repositorio.salvar();
  }
};

/* ------------------------------------------------------------ rotina de expiração (servidor) */
function rotina() {
  if (!db) return;
  let mudou = false;
  db.pedidos.forEach(p => {
    if (["Em finalização", "Aguardando pagamento"].includes(p.situacao) && p.expiraEm && p.expiraEm < agora()) {
      FachadaDeCompra.cancelarPorExpiracao(p); mudou = true;
      if (db.sessao && db.sessao.usuario === p.cliente) toast(`O prazo de 30 minutos do pedido ${p.id} acabou. As peças voltaram ao catálogo.`, "erro");
    }
  });
  if (db.sessao && agora() - db.sessao.ultimaAtividade > SESSAO_MIN * MIN) { Autenticacao.sair("Sua sessão expirou depois de 30 minutos sem uso. Entre de novo para continuar."); return; }
  document.querySelectorAll("[data-relogio]").forEach(el => {
    const r = Math.max(0, Number(el.dataset.relogio) - agora());
    el.textContent = `${String(Math.floor(r / MIN)).padStart(2, "0")}:${String(Math.floor(r / 1000) % 60).padStart(2, "0")}`;
  });
  if (mudou) render();
}

