/* =========================================================
   Bolos da Carmen — montador de bolo, cardápio e pedido
   ========================================================= */

/* WhatsApp da confeitaria (DDI + DDD + número) */
const WHATSAPP = "5531999742331";

const TAMANHOS = [10, 15, 20, 30, 40, 60, 80];
const MASSAS = ["Baunilha", "Chocolate"];
const RECHEIOS = ["Abacaxi", "Coco", "Chocolate", "Morango", "Maracujá", "Limão", "Ninho",
  "Óreo", "Doce de Leite", "Nutella", "Nozes", "Ganache", "Castanha", "Café"];

const CARDAPIO = [
  { id: "docinhos", nome: "Docinhos", img: "img/docinhos.jpg", desc: "Perfeitos para festas, mesas de doces e presentes.",
    itens: ["Bombons", "Brigadeiro", "Beijinho", "Cajuzinho", "Ninho", "Limão", "Maracujá"] },
  { id: "bolos", nome: "Bolos caseiros", img: "img/caseiros.jpg", desc: "Para o café da tarde, com gostinho de casa.",
    itens: ["Cenoura", "Laranja", "Chocolate", "Fubá", "Aipim", "Coco", "Milho", "Limão", "Banana Caramelizada"] },
  { id: "sobremesas", nome: "Sobremesas", img: "img/sobremesas.jpg", desc: "Aquele docinho depois do almoço de domingo.",
    itens: ["Bombom Aberto", "Pavê", "Pudim", "Chico Balanceado", "Mousse de Maracujá", "Mousse de Limão", "Delícia de Abacaxi"] },
  { id: "tortas", nome: "Tortas", img: "img/tortas.jpg", desc: "Cremosas, geladinhas e cheias de sabor.",
    itens: ["Limão", "Maracujá", "Chocolate", "Morango", "Banoffee"] },
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const wa = (msg) => `https://wa.me/${WHATSAPP}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

/* ---------- Toast ---------- */
let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Monte seu bolo ---------- */
const bolo = { tamanho: null, massa: null, recheios: [] };

function chips(el, values, fmt = (v) => v) {
  el.innerHTML = values.map((v) => `<button type="button" class="opt" data-v="${v}">${fmt(v)}</button>`).join("");
}
chips($("#optTamanho"), TAMANHOS, (v) => `${v} fatias`);
chips($("#optMassa"), MASSAS);
chips($("#optRecheio"), RECHEIOS);

$("#optTamanho").addEventListener("click", (e) => pickOne(e, "tamanho"));
$("#optMassa").addEventListener("click", (e) => pickOne(e, "massa"));
$("#optRecheio").addEventListener("click", (e) => {
  const b = e.target.closest(".opt"); if (!b) return;
  const v = b.dataset.v, i = bolo.recheios.indexOf(v);
  if (i >= 0) bolo.recheios.splice(i, 1);
  else if (bolo.recheios.length < 2) bolo.recheios.push(v);
  else return toast("Escolha no máximo 2 recheios 💗");
  $$(".opt", $("#optRecheio")).forEach((o) => o.classList.toggle("on", bolo.recheios.includes(o.dataset.v)));
  updateSummary();
});
function pickOne(e, key) {
  const b = e.target.closest(".opt"); if (!b) return;
  bolo[key] = b.dataset.v;
  $$(".opt", e.currentTarget).forEach((o) => o.classList.toggle("on", o === b));
  updateSummary();
}

function updateSummary() {
  const p = [];
  if (bolo.tamanho) p.push(`${bolo.tamanho} fatias`);
  if (bolo.massa) p.push(`massa de ${bolo.massa.toLowerCase()}`);
  if (bolo.recheios.length) p.push(`recheio de ${bolo.recheios.join(" + ").toLowerCase()}`);
  $("#summaryText").textContent = p.length ? cap(p.join(", ")) : "Escolha o tamanho para começar ✨";
  drawCake();
}

/* ---------- Bolo em SVG que se monta conforme as escolhas ---------- */
const COR_MASSA = { Baunilha: "#f3d49b", Chocolate: "#6b3a2a" };
const COR_RECHEIO = {
  Abacaxi: "#f7d64a", Coco: "#fffaf0", Chocolate: "#4a2618", Morango: "#e8506e", "Maracujá": "#f2a900",
  "Limão": "#c9e27a", Ninho: "#fff1d6", "Óreo": "#3a3433", "Doce de Leite": "#c98a4b", Nutella: "#5c3a21",
  Nozes: "#a47148", Ganache: "#3b1e14", Castanha: "#b88a5a", "Café": "#6f4e37",
};
const CHOCOLATUDOS = ["Chocolate", "Nutella", "Ganache", "Óreo"];
/* Andares (de baixo para cima) por tamanho: largura e altura no desenho */
const ANDARES = {
  10: [[150, 82]], 15: [[180, 88]], 20: [[210, 94]], 30: [[250, 100]],
  40: [[250, 90], [170, 76]], 60: [[290, 92], [204, 80]], 80: [[310, 86], [232, 76], [156, 68]],
};
const cakeSvg = $("#cakeSvg");
let ultimoTamanho, ultimoCompleto = false;

function corMassa() { return COR_MASSA[bolo.massa] || "#efe2d6"; }
function corRecheio(i) {
  const r = bolo.recheios;
  if (!r.length) return "#f8ece4";
  return COR_RECHEIO[r[i % r.length]];
}
function corCalda() { return bolo.recheios.some((r) => CHOCOLATUDOS.includes(r)) ? "#4a2618" : "#e2728f"; }

function drawCake() {
  if (bolo.tamanho !== ultimoTamanho) { ultimoTamanho = bolo.tamanho; buildCake(); }
  paintCake();
  const completo = !!(bolo.tamanho && bolo.massa && bolo.recheios.length);
  if (completo && !ultimoCompleto) celebrate();
  ultimoCompleto = completo;
  const label = $("#cakeLabel");
  if (!bolo.tamanho) label.innerHTML = "Seu bolo vai aparecer aqui ✨";
  else label.innerHTML = `${bolo.tamanho} fatias${bolo.massa ? ` · massa de ${bolo.massa.toLowerCase()}` : ""}` +
    `<small>${bolo.recheios.length ? bolo.recheios.join(" + ") : "escolha os recheios"}</small>`;
}

/* Monta a estrutura (só quando muda o tamanho) */
function buildCake() {
  const W = 400, base = 296;
  let svg = `<defs>
    <linearGradient id="shade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
  </defs>
  <ellipse cx="200" cy="${base + 26}" rx="150" ry="9" fill="#4a2620" opacity=".08"/>`;

  if (!bolo.tamanho) {
    cakeSvg.innerHTML = svg + `<g class="cake-ghost" fill="none" stroke="#c4506c" stroke-width="2.5" stroke-dasharray="8 8" stroke-linecap="round">
      <rect x="100" y="${base - 100}" width="200" height="100" rx="12"/>
      <path d="M70 ${base + 4} H330"/><path d="M175 ${base + 4} l-8 16 h66 l-8 -16"/>
      <circle cx="200" cy="${base - 122}" r="11"/></g>`;
    return;
  }

  const tiers = ANDARES[bolo.tamanho];
  const larguraBase = tiers[0][0];
  /* boleira */
  svg += `<g><rect x="${200 - larguraBase / 2 - 26}" y="${base}" width="${larguraBase + 52}" height="9" rx="4.5" fill="#fff" stroke="#e7c9c4" stroke-width="1.5"/>
    <path d="M178 ${base + 9} l-10 16 h64 l-10 -16 z" fill="#fff" stroke="#e7c9c4" stroke-width="1.5"/></g>`;

  let y = base;
  tiers.forEach(([w, h], t) => {
    const x = (W - w) / 2, top = y - h;
    const id = `clip${t}`;
    /* camadas: massa, recheio, massa, recheio, massa, cobertura */
    const parts = [["m", .24], ["r0", .1], ["m", .22], ["r1", .1], ["m", .2], ["top", .14]];
    let cy = y, stripes = "";
    parts.forEach(([k, f]) => {
      const sh = h * f; cy -= sh;
      const cls = k === "m" ? "cake-stripe st-m" : k === "top" ? "cake-top" : `cake-stripe st-${k}`;
      stripes += `<rect class="${cls}" x="${x}" y="${cy}" width="${w}" height="${sh + .6}"/>`;
    });
    /* calda escorrendo */
    const n = Math.max(4, Math.round(w / 38)), step = w / n, yb = top + h * .14 + 3;
    const comp = [14, 26, 10, 31, 18, 22, 12, 28], larg = [.62, .5, .7, .48, .58, .66, .52, .6];
    let drip = `M${x} ${top - 2} V${yb}`;
    for (let i = 0; i < n; i++) {
      const k = (i + t * 3) % comp.length;
      const mid = x + (i + .5) * step + (i % 2 ? 3 : -3), L = comp[k] * (h / 95), hw = step * larg[k] / 2;
      drip += ` L${mid - hw - 4} ${yb}` +
        ` Q${mid - hw} ${yb} ${mid - hw} ${yb + 4}` +
        ` C${mid - hw} ${yb + L * .7} ${mid - hw * .8} ${yb + L} ${mid} ${yb + L}` +
        ` C${mid + hw * .8} ${yb + L} ${mid + hw} ${yb + L * .7} ${mid + hw} ${yb + 4}` +
        ` Q${mid + hw} ${yb} ${mid + hw + 4} ${yb}`;
    }
    drip += ` L${x + w} ${yb} V${top - 2} Z`;
    svg += `<g class="cake-tier" style="animation-delay:${t * 160}ms">
      <clipPath id="${id}"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="12"/></clipPath>
      <g clip-path="url(#${id})">${stripes}<path class="cake-drip" d="${drip}" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round"/><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="url(#shade)"/></g>
      <rect x="${x}" y="${top}" width="${w}" height="${h}" rx="12" fill="none" stroke="#4a2620" stroke-opacity=".14" stroke-width="2"/>
      ${pearls(x, y, w, t)}
    </g>`;
    y = top;
  });
  svg += `<g id="cakeTopper" data-top="${y}"></g><g id="cakeSparks"></g>`;
  cakeSvg.innerHTML = svg;
}

/* bolinhas de confeito na base de cada andar */
function pearls(x, y, w, t) {
  const n = Math.floor(w / 16); let s = "";
  for (let i = 0; i < n; i++) s += `<circle cx="${x + 10 + i * ((w - 20) / (n - 1))}" cy="${y - 5}" r="3.4" fill="#fff" opacity=".9"/>`;
  return `<g style="animation-delay:${t * 160 + 200}ms">${s}</g>`;
}

/* Pinta as cores (transição suave a cada escolha) */
function paintCake() {
  if (!bolo.tamanho) return;
  $$(".st-m", cakeSvg).forEach((e) => e.style.fill = corMassa());
  $$(".st-r0", cakeSvg).forEach((e) => e.style.fill = corRecheio(0));
  $$(".st-r1", cakeSvg).forEach((e) => e.style.fill = corRecheio(1));
  $$(".cake-top", cakeSvg).forEach((e) => e.style.fill = "#fff8f3");
  $$(".cake-drip", cakeSvg).forEach((e) => e.style.fill = bolo.recheios.length ? corCalda() : "#fff8f3");

  const topper = $("#cakeTopper", cakeSvg); if (!topper) return;
  const ty = +topper.dataset.top;
  const tipo = !bolo.recheios.length ? "" : bolo.recheios.includes("Morango") ? "morango" : "cereja";
  if (topper.dataset.tipo === tipo) return;
  topper.dataset.tipo = tipo;
  topper.innerHTML = tipo === "morango"
    ? `<g class="cake-topper"><path d="M200 ${ty - 2} c-16 -4 -22 -22 -12 -32 c4 -4 8 -4 12 -2 c4 -2 8 -2 12 2 c10 10 4 28 -12 32z" fill="#e23b55"/>
        <g fill="#ffe08a">${[[-6, -22], [5, -24], [-2, -14], [7, -12], [-8, -10]].map(([dx, dy]) => `<ellipse cx="${200 + dx}" cy="${ty + dy}" rx="1.3" ry="2"/>`).join("")}</g>
        <path d="M190 ${ty - 33} q10 -8 20 0 q-4 -9 -10 -10 q-6 1 -10 10z" fill="#4f9d4f"/></g>`
    : tipo === "cereja"
    ? `<g class="cake-topper"><path d="M200 ${ty - 18} q4 -20 18 -26" fill="none" stroke="#4f7d3a" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="200" cy="${ty - 11}" r="11" fill="#c8102e"/><circle cx="196" cy="${ty - 15}" r="3" fill="#fff" opacity=".7"/></g>`
    : "";
}

/* Comemoração quando o bolo fica completo */
function celebrate() {
  const sp = $("#cakeSparks", cakeSvg); if (!sp) return;
  const pts = [[70, 90], [330, 80], [110, 40], [290, 130], [60, 200], [340, 210], [200, 20]];
  sp.innerHTML = pts.map(([x, y], i) => `<path class="cake-spark" style="animation-delay:${i * 90}ms" d="M${x} ${y - 9} L${x + 2.5} ${y - 2.5} L${x + 9} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 9} L${x - 2.5} ${y + 2.5} L${x - 9} ${y} L${x - 2.5} ${y - 2.5} Z" fill="${i % 2 ? "#e2728f" : "#f2c14e"}"/>`).join("");
  cakeSvg.classList.remove("cake-ready"); void cakeSvg.getBoundingClientRect(); cakeSvg.classList.add("cake-ready");
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* Data mínima: daqui a 2 dias */
const min = new Date(Date.now() + 2 * 864e5);
$("#data").min = min.toISOString().slice(0, 10);

$("#builder").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!bolo.tamanho) return toast("Escolha o tamanho do bolo");
  if (!bolo.massa) return toast("Escolha a massa");
  if (!bolo.recheios.length) return toast("Escolha pelo menos 1 recheio");
  const data = $("#data").value ? new Date($("#data").value + "T12:00").toLocaleDateString("pt-BR") : "a combinar";
  const nome = $("#nome").value.trim();
  const obs = $("#obs").value.trim();
  const msg = [
    `Olá, Bolos da Carmen! 🎂${nome ? ` Sou ${nome}.` : ""}`,
    "Gostaria de encomendar um bolo:",
    "",
    `• Tamanho: ${bolo.tamanho} fatias`,
    `• Massa: ${bolo.massa}`,
    `• Recheio: ${bolo.recheios.join(" + ")}`,
    `• Data: ${data}`,
    obs ? `• Tema/decoração: ${obs}` : "",
    orderLines().length ? `\nE também do cardápio:\n${orderLines().join("\n")}` : "",
  ].filter(Boolean).join("\n");
  window.open(wa(msg), "_blank");
});

/* ---------- Cardápio ---------- */
let pedido = JSON.parse(localStorage.getItem("bc-pedido") || "{}"); // { "Docinhos|Brigadeiro": 2 }
let aba = CARDAPIO[0].id;

$("#tabs").innerHTML = CARDAPIO.map((c) => `<button class="tab" role="tab" data-tab="${c.id}">${c.nome}</button>`).join("");
$("#tabs").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) { aba = t.dataset.tab; renderMenu(); } });

function renderMenu() {
  const c = CARDAPIO.find((x) => x.id === aba);
  $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === aba));
  $("#menu").innerHTML = `
    <div class="menu__img"><img src="${c.img}" alt="${c.nome}" loading="lazy" /></div>
    <div class="menu__list">
      <h3>${c.nome}</h3><p>${c.desc}</p>
      <ul>${c.itens.map((it, i) => {
        const k = `${c.nome}|${it}`, q = pedido[k] || 0;
        return `<li class="item" style="animation-delay:${i * 40}ms">
          <span class="item__name">${it}</span><span class="item__dots"></span>
          <span class="qty">
            <button data-dec="${k}" aria-label="Diminuir ${it}" ${q ? "" : "disabled"}>−</button>
            <input type="number" inputmode="numeric" min="0" max="9999" placeholder="0" value="${q || ""}" data-k="${k}" aria-label="Quantidade de ${it}" />
            <button data-inc="${k}" aria-label="Aumentar ${it}">+</button>
          </span>
        </li>`;
      }).join("")}</ul>
    </div>`;
}

$("#menu").addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
  if (inc) { const k = inc.dataset.inc; pedido[k] = (pedido[k] || 0) + 1; if (pedido[k] === 1) toast(`${k.split("|")[1]} adicionado ao pedido`); }
  else if (dec) { const k = dec.dataset.dec; pedido[k]--; if (pedido[k] <= 0) delete pedido[k]; }
  else return;
  saveOrder(); renderMenu();
});

/* Quantidade digitada: atualiza o pedido sem redesenhar a lista (o campo não perde o foco) */
$("#menu").addEventListener("input", (e) => {
  const inp = e.target.closest("input[data-k]"); if (!inp) return;
  const k = inp.dataset.k;
  const n = Math.min(9999, Math.max(0, parseInt(inp.value, 10) || 0));
  const antes = pedido[k] || 0;
  if (n > 0) pedido[k] = n; else delete pedido[k];
  inp.closest(".qty").querySelector("[data-dec]").disabled = n === 0;
  if (!antes && n) toast(`${k.split("|")[1]} adicionado ao pedido`);
  saveOrder();
});
$("#menu").addEventListener("focusin", (e) => { if (e.target.matches("input[data-k]")) e.target.select(); });
$("#menu").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("input[data-k]")) e.target.blur(); });

/* ---------- Pedido ---------- */
function orderLines() {
  return Object.entries(pedido).map(([k, q]) => { const [cat, it] = k.split("|"); return `• ${q}x ${it} (${cat})`; });
}
function saveOrder() { localStorage.setItem("bc-pedido", JSON.stringify(pedido)); renderOrder(); }
function renderOrder() {
  const total = Object.values(pedido).reduce((a, b) => a + b, 0);
  $("#orderCount").textContent = total;
  $("#orderbar").classList.toggle("show", total > 0);
  document.body.classList.toggle("has-order", total > 0);
  if (!total) $("#orderbar").classList.remove("open");
  $("#orderList").innerHTML = Object.entries(pedido).map(([k, q]) => {
    const [cat, it] = k.split("|");
    return `<div><span>${q}x ${it} <small style="opacity:.6">· ${cat}</small></span><button data-rm="${k}">remover</button></div>`;
  }).join("");
}
$("#orderToggle").addEventListener("click", () => $("#orderbar").classList.toggle("open"));
$("#orderList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]"); if (!b) return;
  delete pedido[b.dataset.rm]; saveOrder(); renderMenu();
});
$("#orderSend").addEventListener("click", () => {
  const msg = `Olá, Bolos da Carmen! 💗\nGostaria de fazer este pedido:\n\n${orderLines().join("\n")}\n\nPode me passar valores e disponibilidade?`;
  window.open(wa(msg), "_blank");
});

/* ---------- Geral ---------- */
$$("[data-whats]").forEach((a) => { a.href = wa("Olá, Bolos da Carmen! Gostaria de fazer uma encomenda 🎂"); a.target = "_blank"; a.rel = "noopener"; });

const header = $("#header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 30), { passive: true });

$("#burger").addEventListener("click", (e) => { e.currentTarget.classList.toggle("open"); $("#nav").classList.toggle("open"); });
$$("#nav a").forEach((a) => a.addEventListener("click", () => { $("#burger").classList.remove("open"); $("#nav").classList.remove("open"); }));

const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
}), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });

$("#year").textContent = new Date().getFullYear();
renderMenu();
renderOrder();
drawCake();
