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

  HEROES.forEach((h) => {
    const d = document.createElement("div");
    d.className = "hero";

    if (store.selected === h.id) d.classList.add("selected");

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