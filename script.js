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
