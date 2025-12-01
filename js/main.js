import { HEROES } from "./heroes.js";
import { store, save } from "./store.js";
import { initRaceScene } from "./race.js";

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
const quitRaceBtn = document.getElementById("quitRace");

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

  // Always render ALL heroes
  HEROES.forEach((h, i) => {
    const d = document.createElement("div");
    d.className = "hero";
    d.dataset.index = i;

    const diff = i - centerIndex;
    const abs = Math.abs(diff);

    // Show center card + 1 on each side (total 3 visible)
    if (diff === 0) {
      d.classList.add("center");
    } else if (abs === 1) {
      d.classList.add("side");
    } else {
      d.style.display = "none"; // Hide cards that are not in view
    }

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

  // Update dots to show current page
  const dots = document.querySelectorAll(".carousel-dots .dot");
  if (dots && dots.length) {
    const currentPage = Math.floor(centerIndex / 1); // One hero per "page"
    const activeDot = Math.min(currentPage, dots.length - 1);
    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === activeDot);
    });
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

// ✅ Quit Race Button - Go back to home
if (quitRaceBtn) {
  quitRaceBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to quit the race? Progress will be lost.")) {
      location.reload(); // Reload to reset everything
    }
  });
}

// ✅ FIXED: Added Start Button Event Listener with unlock check
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const selectedHero = HEROES.find(h => h.id === store.selected);
    
    // Check if selected hero is unlocked
    if (!store.unlocked.includes(store.selected)) {
      alert(`${selectedHero?.name || 'This hero'} is locked! Please unlock it in the shop or select an unlocked hero.`);
      return;
    }
    
    homeView.style.display = "none";
    raceView.style.display = "block";
    initRaceScene(() => {
      // Callback after race finishes
      renderHUD();
    });
  });
}

if (resetBtn)
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset progress?")) return;
    store.coins = 0;
    store.unlocked = ["packo", "beavy"];
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
  let nextIndex = currentIndex + delta;
  
  // Loop around if at edges
  if (nextIndex < 0) {
    nextIndex = HEROES.length - 1;
  } else if (nextIndex >= HEROES.length) {
    nextIndex = 0;
  }
  
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