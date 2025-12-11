import { HEROES } from "./heroes.js";
import { store, save } from "./store.js";
import { initRaceScene } from "./race.js";

/* DOM ele */
const heroList = document.getElementById("heroList");
const coinCount = document.getElementById("coinCount");
const shopCoinDisplay = document.getElementById("shopCoinDisplay");
const playTrigger = document.getElementById("playTrigger");
const shopBtn = document.getElementById("openShop");
const trackBtn = document.getElementById("openTracks");
const shopModal = document.getElementById("shopModal");
const shopGrid = document.getElementById("shopGrid");
const closeShopBtn = document.getElementById("closeShop");
const homeView = document.getElementById("home");
const raceView = document.getElementById("raceView");
const quitRaceBtn = document.getElementById("quitRace");
const howToPlayBtn = document.getElementById("howToPlayBtn");

/* render hero on home screen */
function renderHeroes() {
  heroList.innerHTML = "";

  //selected hero
  let centerIndex = HEROES.findIndex(h => h.id === store.selected);
  if (centerIndex === -1) {
    currentIndex = 0;
    store.selected = HEROES[0].id;
  }

  const total = HEROES.length;
  const leftIdx = (currentIdx - 1 + total) % total;
  const rightIdx = (currentIdx + 1) % total;

  // Always render ALL heroes
  HEROES.forEach((hero, index) => {
    const card = document.createElement("div");
    card.className = "hero-card";

    if (index === currentIdx) {
      card.classList.add("center");
      card.onclick = () => startGame();
    } else if (index === leftIdx) {
      card.classList.add("left");
    } else if (index === rightIdx) {
      card.classList.add("right");
      card.onclick = () => selectHero(hero.id);
    } else {
      card.classList.add("hidden");
    }
    card.innerHTML = `
      <img src="${hero.img}" alt="${hero.name}">
      <div class="name-plate">${hero.name}</div>
    `;
    heroList.appendChild(card);
  });
}

function selectHero(id) {
  store.selected = id;
  save(store);
  renderHeroes();
}

function startGame() {
  const hero = HEROES.find(h => h.id === store.selected);

  if (!store.unlocked.includes(hero.id)) {
    openShop();
    return;
  }
  homeView.style.display = "none";
  document.querySelector(".navbar").style.display = "none";
  raceView.style.display = "block";

  initRaceScene((results) => {
    updateCoins();
  });
}
// making shop functional
function openShop() {
  updateCoins();
  shopModal.style.display = "flex";
  renderShop();
}

function closeShop() {
  shopModal.style.display = "none";
  renderHeroes();
}

function updateCoins() {
  const amt = store.coins;
  if (coinDisplay) coinDisplay.textContent = amt;
  if (shopCoinDisplay) shopCoinDisplay.textContent = amt;
}

function renderShop() {
  shopGrid.innerHTML = "";
  HEROES.forEach((h) => {
    const el = document.createElement("div");
    const isUnlocked = store.unlocked.includes(h.id);
    const isSelected = store.selected === h.id;

    el.className = `shop-item ${isUnlocked ? "owned" : ""}`;
    item.innerHTML = `
        <img src="${h.img}" style="width:60px; height:60px; object-fit:contain;">
        <h3 style="margin:5px 0; font-family:var(--font-marker)">${h.name}</h3>
        <div style="font-size:12px; color:#aaa;">Speed: ${h.speed}x</div>`;

    const btn = document.createElement("button");
    if (isSelected) {
      btn.textContent = "EQUIPPED";
      btn.disabled = true;
      btn.style.background = "#555";
    } else if (isUnlocked) {
      btn.textContent = "SELECT";
      btn.onclick = () => {
        selectHero(h.id);
        renderShop();
      };
    } else {
      btn.textContent = `BUY ${h.price}`;
      btn.onclick = () => {
        if (store.coins >= h.price) {
          store.coins -= h.price;
          store.unlocked.push(h.id);
          store.selected = h.id;
          save(store);
          updateCoins();
          renderShop();
        } else {
          alert("Not Enough coins!");
        }
      };
    }
    el.appendChild(btn);
    shopGrid.appendChild(el);
  });
}

if (playTrigger) playTrigger.addEventListener("click", startGame);
if (shopBtn) shopBtn.addEventListener("click", openShop);
if (closeShopBtn) closeShopBtn.addEventListener("click", closeShop);
if (trackBtn) trackBtn.addEventListener("click", () => alert("More track coming soon!"));

// ✅ Quit Race Button - Go back to home
if (quitRaceBtn) {
  quitRaceBtn.addEventListener("click", () => {
    if (confirm("Quit race?")) {
      location.reload(); // Reload to reset everything
    }
  });
}

if (howToPlayBtn) {
  howToPlayBtn.addEventListener("click", () => {
    alert("Type the Text exactly as shown to move your racer.");
  });
}
window.addEventListener("keydown", (e) => {
  if (homeView.style.display === "none" || shopModal.style.display === "flex") return;

  if (e.key === "ArrowLeft") {
    const currentIdx = HEROES.findIndex(h => h.id === store.selected);
    const prevIdx = (currentIdx - 1 + HEROES.length) % HEROES.length;
    selectHero(HEROES[prevIdx].id);
  } else if (e.key === "ArrowRight") {
    const currentIdx = HEROES.findIndex(h => h.id === store.selected);
    const nextIdx = (currentIdx + 1) % HEROES.length;
    selectHero(HEROES[nextIdx].id);
  } else if (e.key === "Enter") {
    startGame();
  }
});

updateCoins();
renderHeroes();