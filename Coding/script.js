// ---------- Settings (change these to customise) ----------
const CURRENCY = "Rs ";
const TAX_RATE = 0.16;          // set this to your local sales tax rate
const DELIVERY_FEE = 150;
const WHATSAPP_NUMBER = "923001234567";   // country code + number, no + or spaces
const MAX_BOOKINGS_PER_SLOT = 5;
const TIME_SLOTS = ["12:00","13:00","14:00","15:00","19:00","20:00","21:00","22:00","23:00"];

// ---------- Menu data ----------
const MENU = [
  { id: 1,  name: "Chicken Karahi",   cat: "Karahi",   price: 1650, icon: "🍲", tag: "Popular", desc: "Wok-cooked with tomatoes, ginger and green chilies. Serves 2." },
  { id: 2,  name: "Mutton Karahi",    cat: "Karahi",   price: 2400, icon: "🍲", desc: "Tender mutton on the bone, finished with fresh coriander. Serves 2." },
  { id: 3,  name: "Beef Nihari",      cat: "Curries",  price: 950,  icon: "🥘", tag: "Signature", desc: "Slow-cooked overnight, served with ginger, lemon and naan." },
  { id: 4,  name: "Haleem",           cat: "Curries",  price: 650,  icon: "🥣", desc: "Wheat, lentils and shredded beef, topped with fried onions." },
  { id: 5,  name: "Daal Mash",        cat: "Curries",  price: 480,  icon: "🍛", desc: "Creamy white lentils with a garlic and cumin tarka." },
  { id: 6,  name: "Chicken Biryani",  cat: "Rice",     price: 750,  icon: "🍛", tag: "Popular", desc: "Dum-cooked basmati with spiced chicken, raita on the side." },
  { id: 7,  name: "Mutton Pulao",     cat: "Rice",     price: 900,  icon: "🍚", desc: "Fragrant yakhni pulao with tender mutton and whole spices." },
  { id: 8,  name: "Chapli Kebab",     cat: "BBQ",      price: 700,  icon: "🥩", tag: "Spicy", desc: "Two crisp beef patties with pomegranate seeds and naan." },
  { id: 9,  name: "Chicken Tikka",    cat: "BBQ",      price: 800,  icon: "🍗", desc: "Charcoal-grilled leg piece marinated overnight in yogurt." },
  { id: 10, name: "Seekh Kebab",      cat: "BBQ",      price: 850,  icon: "🍢", desc: "Four minced beef skewers with mint chutney." },
  { id: 11, name: "Tandoori Naan",    cat: "Bread",    price: 60,   icon: "🫓", desc: "Fresh from the tandoor." },
  { id: 12, name: "Garlic Naan",      cat: "Bread",    price: 120,  icon: "🫓", desc: "Brushed with garlic butter and coriander." },
  { id: 13, name: "Aloo Paratha",     cat: "Bread",    price: 220,  icon: "🫓", desc: "Stuffed with spiced potato, served with yogurt." },
  { id: 14, name: "Sweet Lassi",      cat: "Drinks",   price: 280,  icon: "🥛", desc: "Thick chilled yogurt drink, topped with malai." },
  { id: 15, name: "Doodh Patti Chai", cat: "Drinks",   price: 150,  icon: "🍵", desc: "Strong tea simmered with milk and cardamom." },
  { id: 16, name: "Gulab Jamun",      cat: "Desserts", price: 250,  icon: "🍮", desc: "Two warm milk dumplings in cardamom syrup." },
  { id: 17, name: "Falooda",          cat: "Desserts", price: 450,  icon: "🍨", desc: "Rose milk, vermicelli, basil seeds and kulfi." }
];

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const money = (n) => CURRENCY + n.toLocaleString();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function setMsg(el, text, type) {
  el.textContent = text;
  el.className = "msg " + (type || "");
}
const validPhone = (p) => /^(\+92|0092|92|0)?3\d{9}$/.test(p.replace(/[\s-]/g, ""));

// ---------- State ----------
let cart = load("cart", {});            // { dishId: quantity }
let reservations = load("reservations", []);
let activeCat = "All";
let searchText = "";

// ---------- Menu ----------
function renderFilters() {
  const cats = ["All", ...new Set(MENU.map((m) => m.cat))];
  $("#filters").innerHTML = cats
    .map((c) => `<button class="chip" data-cat="${c}" aria-pressed="${c === activeCat}">${c}</button>`)
    .join("");
}

function renderMenu() {
  const items = MENU.filter((m) =>
    (activeCat === "All" || m.cat === activeCat) &&
    (m.name + m.desc).toLowerCase().includes(searchText)
  );
  $("#menu-grid").innerHTML = items.length
    ? items.map((m) => `
      <article class="dish">
        <div class="icon" aria-hidden="true">${m.icon}${m.tag ? `<span class="tag">${m.tag}</span>` : ""}</div>
        <div class="body">
          <h3>${m.name}</h3>
          <p>${m.desc}</p>
          <div class="bottom">
            <span class="price">${money(m.price)}</span>
            <button class="add" data-id="${m.id}">Add</button>
          </div>
        </div>
      </article>`).join("")
    : `<p class="empty">No dishes match your search. Try another word or category.</p>`;
}

$("#filters").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderFilters();
  renderMenu();
});
$("#search").addEventListener("input", (e) => {
  searchText = e.target.value.trim().toLowerCase();
  renderMenu();
});
$("#menu-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".add");
  if (!btn) return;
  changeQty(Number(btn.dataset.id), 1);
});

// ---------- Cart ----------
function changeQty(id, delta) {
  const next = (cart[id] || 0) + delta;
  if (next <= 0) delete cart[id]; else cart[id] = next;
  save("cart", cart);
  renderCart();
}

function calcTotals() {
  const subtotal = Object.entries(cart).reduce((sum, [id, q]) => {
    const dish = MENU.find((m) => m.id === Number(id));
    return sum + (dish ? dish.price * q : 0);
  }, 0);
  const delivery = $("#order-type").value === "delivery" && subtotal > 0 ? DELIVERY_FEE : 0;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, delivery, total: subtotal + tax + delivery };
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id]) => MENU.some((m) => m.id === Number(id)));
  const count = entries.reduce((s, [, q]) => s + q, 0);
  $("#cart-count").textContent = count;

  $("#cart-items").innerHTML = entries.length
    ? entries.map(([id, q]) => {
        const m = MENU.find((d) => d.id === Number(id));
        return `<li>
          <strong>${m.name}</strong><span>${money(m.price * q)}</span>
          <div class="qty">
            <button data-act="dec" data-id="${id}" aria-label="Remove one ${m.name}">&minus;</button>
            <span>${q}</span>
            <button data-act="inc" data-id="${id}" aria-label="Add one ${m.name}">+</button>
          </div>
          <button class="rm" data-act="rm" data-id="${id}">Remove</button>
        </li>`;
      }).join("")
    : `<li>Your order is empty. Add something from the menu.</li>`;

  const t = calcTotals();
  $("#totals").innerHTML = `
    <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    <div><span>Tax (${TAX_RATE * 100}%)</span><span>${money(t.tax)}</span></div>
    ${t.delivery ? `<div><span>Delivery</span><span>${money(t.delivery)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
}

$("#cart-items").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === "inc") changeQty(id, 1);
  if (btn.dataset.act === "dec") changeQty(id, -1);
  if (btn.dataset.act === "rm") changeQty(id, -(cart[id] || 0));
});

function openCart(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", String(!open));
  $("#overlay").hidden = !open;
}
$("#cart-btn").addEventListener("click", () => openCart(true));
$("#close-cart").addEventListener("click", () => openCart(false));
$("#overlay").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") openCart(false); });

$("#order-type").addEventListener("change", (e) => {
  $("#addr-wrap").hidden = e.target.value !== "delivery";
  renderCart();
});

let sendViaWhatsApp = false;
$("#wa-btn").addEventListener("click", () => {
  sendViaWhatsApp = true;
  $("#order-form").requestSubmit();
  sendViaWhatsApp = false;
});

$("#order-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $("#order-msg");
  const f = new FormData(e.target);
  const name = f.get("name").trim(), phone = f.get("phone"), type = f.get("type"), address = (f.get("address") || "").trim();

  if (!Object.keys(cart).length) return setMsg(msg, "Add at least one dish before ordering.", "err");
  if (name.length < 2) return setMsg(msg, "Enter your name.", "err");
  if (!validPhone(phone)) return setMsg(msg, "Enter a valid mobile number, like 0300 1234567.", "err");
  if (type === "delivery" && address.length < 5) return setMsg(msg, "Enter a delivery address.", "err");

  const orders = load("orders", []);
  const order = {
    id: "ORD-" + String(orders.length + 1).padStart(4, "0"),
    name, phone, type, address,
    items: { ...cart },
    total: calcTotals().total,
    placed: new Date().toISOString()
  };
  orders.push(order);
  save("orders", orders);

  if (sendViaWhatsApp) {
    const lines = Object.entries(cart).map(([id, q]) => {
      const m = MENU.find((d) => d.id === Number(id));
      return `${q} x ${m.name} (${money(m.price * q)})`;
    });
    const text = [`New order ${order.id}`, ...lines, `Total: ${money(order.total)}`,
      `Name: ${name}`, `Phone: ${phone}`,
      type === "delivery" ? `Delivery to: ${address}` : "Pickup"].join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  }
  sendViaWhatsApp = false;

  cart = {};
  save("cart", cart);
  e.target.reset();
  $("#addr-wrap").hidden = true;
  renderCart();
  setMsg(msg, `Order ${order.id} placed. Total ${money(order.total)}. We'll call you to confirm.`, "ok");
});

// ---------- Reservations ----------
function setupReservationForm() {
  $("#res-time").innerHTML = TIME_SLOTS.map((t) => `<option>${t}</option>`).join("");
  const today = new Date().toISOString().slice(0, 10);
  $("#res-date").min = today;
  $("#res-date").value = today;
}

function renderReservations() {
  const list = reservations.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  $("#res-list").innerHTML = list.length
    ? list.map((r) => `
      <li>
        <span><strong>${esc(r.date)} at ${esc(r.time)}</strong><br>${esc(r.name)}, ${r.guests} guest${r.guests > 1 ? "s" : ""} (${esc(r.code)})</span>
        <button data-code="${esc(r.code)}">Cancel</button>
      </li>`).join("")
    : `<li>No bookings yet.</li>`;
}

$("#res-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $("#res-msg");
  const f = new FormData(e.target);
  const name = f.get("name").trim(), phone = f.get("phone"), date = f.get("date"), time = f.get("time"), guests = Number(f.get("guests"));

  if (name.length < 2) return setMsg(msg, "Enter your name.", "err");
  if (!validPhone(phone)) return setMsg(msg, "Enter a valid mobile number, like 0300 1234567.", "err");
  if (!date || date < $("#res-date").min) return setMsg(msg, "Pick today's date or a future date.", "err");
  if (!(guests >= 1 && guests <= 12)) return setMsg(msg, "We seat 1 to 12 guests per booking.", "err");

  const taken = reservations.filter((r) => r.date === date && r.time === time).length;
  if (taken >= MAX_BOOKINGS_PER_SLOT) return setMsg(msg, "That time is fully booked. Please choose another slot.", "err");

  const code = "R" + Math.random().toString(36).slice(2, 6).toUpperCase();
  reservations.push({ code, name, phone, date, time, guests });
  save("reservations", reservations);
  renderReservations();
  setMsg(msg, `Table booked for ${date} at ${time}. Your code is ${code}.`, "ok");
});

$("#res-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-code]");
  if (!btn) return;
  reservations = reservations.filter((r) => r.code !== btn.dataset.code);
  save("reservations", reservations);
  renderReservations();
});

// ---------- Start ----------
renderFilters();
renderMenu();
renderCart();
setupReservationForm();
renderReservations();