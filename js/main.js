import { HEROES } from "./heroes.js";
import { store, save } from "./store.js";

/* DOM ele */
const heroList = document.getElementById("heroList");
const coinCount = document.getElementById("coinCount");
const startBtn = document.getElementById("startBtn");
const shopBtn = document.getElementById("openShop");
const shopModal = document.getElementById("shopModal");
const shopGrid = document.getElementById("shopGrid");
const closeShopBtn = document.getElementById("closeShop");
const homeView = document.getElementById("home");
const raceView = document.getElementById("raceView");
const resetBtn = document.getElementById("resetBtn");

/* render hud */
function renderHUD() {
  coinCount.textContent = store.coins;
}

/* render hero on home screen */
function renderHeroes() {
  heroList.innerHTML = "";

  //selected hero
  let centerIndex = HEROES.findIndex(h => h.id === store.selected);
  if (centerIndex === -1) centerIndex = 0;

  HEROES.forEach((h, i) => {
  const d = document.createElement("div");
  d.className = "hero";
  d.dataset.index = i;

  const diff = i - centerIndex;
  const abs = Math.abs(diff);

  if (diff === 0) d.classList.add("center");
  else if (abs === 1) d.classList.add("side");
  else if (abs === 2) d.classList.add("side2");
  else d.style.opacity = "0.0";

  d.innerHTML = `
    <img src="${h.img}">
    <div class="label">${h.name}</div>`;

    d.onclick = () => {
      if (!store.unlocked.includes(h.id)) {
        if (!confirm("This hero is locked. Open shop?")) return;
        shopBtn.click();
        return;
      }

      store.selected = h.id;
      save(store);
      renderHeroes();
      renderHUD();
    };
    heroList.appendChild(d);
  });

  const children = heroList.children;
  if (children.length > 0 && children[centerIndex]) {
    const el = children[centerIndex];
    //smoooth scroool
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest"});
  }

  const dots = document.querySelectorAll(".carousel-dots .dot");
  if (dots && dots.length) {
    const page = Math.floor(centerIndex / Math.max(1, Math.ceil(HEROES.length / dots.length)));
    dots.forEach((dot, idx) => dot.classList.toggle("active", idx === page));
  }
}

// making shop functional
function openShop() {
  shopModal.style.display = "flex";
  renderShop();
}

function closeShopModal() {
  shopModal.style.display = "none";
}

function renderShop() {
  shopGrid.innerHTML = "";

  HEROES.forEach((h) => {
    const item = document.createElement("div");
    item.className = "shopItem";

    const unlocked = store.unlocked.includes(h.id);
    item.innerHTML = `
        <img src="${h.img}" style="width:72px">
        <h4>${h.name}</h4>
        <div>${unlocked ? "Unlocked" : h.price + " R"}</div>`;

    if (!unlocked) {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Buy";

      btn.onclick = () => {
        if (store.coins >= (h.price || 0)) {
          store.coins -= h.price || 0;
          if (!store.unlocked.includes(h.id)) store.unlocked.push(h.id);
          save(store);
          renderShop();
          renderHeroes();
          renderHUD();
        } else {
          alert("Not enough coins");
        }
      };

      item.appendChild(btn);
    }

    shopGrid.appendChild(item);
  });
}

/* Event bindings */
if (shopBtn) shopBtn.addEventListener("click", openShop);
if (closeShopBtn) closeShopBtn.addEventListener("click", closeShopModal);
if (resetBtn)
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset progress?")) return;
    store.coins = 0;
    store.unlocked = [];
    store.selected = HEROES[0]?.id || null;
    save(store);
    renderHUD();
    renderHeroes();
    renderShop();
  });

/* Initial render */
renderHUD();
renderHeroes();

const prevBtn = document.getElementById("prevHero");
const nextBtn = document.getElementById("nextHero");
const dotsContainer = document.querySelector(".carousel-dots");

function moveCenter(delta) {
  const currentIndex = HEROES.findIndex(h => h.id === store.selected);
  let nextIndex = (currentIndex + delta + HEROES.length) % HEROES.length;
  store.selected = HEROES[nextIndex].id;
  save(store);
  renderHeroes();
  renderHUD();
}

if (prevBtn) prevBtn.addEventListener("click", () => moveCenter(-1));
if (nextBtn) nextBtn.addEventListener("click", () => moveCenter(1));

if (dotsContainer) {
  const dots = Array.from(dotsContainer.querySelectorAll(".dot"));
  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => {
      const chunk = Math.max(1, Math.ceil(HEROES.length / dots.length));
      const target = Math.min(HEROES.length - 1, idx * chunk);
      store.selected = HEROES[target].id;
      save(store);
      renderHeroes();
      renderHUD();
    });
  });
}