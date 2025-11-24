import { store, save } from "./store.js"

/* DOM ele */
const heroList = document.getElementById("heroList");
const coinCount = document.getElementById("coinCount");
const startBtn = document.getElementById("startBtn");
const shopBtn = document.getElementById("openShop");
const shopModal = document.getElementById("shopModal");
const shopGrid = document.getElementById("shopGrid");
const closeShop = document.getElementById("closeShop")
const homeView = document.getElementById("home");
const raceView = document.getElementById("raceView");
const resetBtn = document.getElementById("resetBtn");

/*render hud*/
function renderHUD(){
    coinCount.textContent = store.coins;
}

/*render hero on home screen*/
function renderHeroes(){
    heroList.innerHTML = "";

    Heroes.forEach((h)=> {
        const d = document.createElement("div");
        d.className = "hero";

        if (store.selected === h.id) d.classList.add("selected");

        d.innerHTML = `
      <img src="${h.img}">
      <div class="label">${h.name}</div>
    `;

    d.onclick = () => {
        if (!store.unlocked.includes(h.id)) {
            if (!confirm("This hero is locked. Open shop?")) return;
            shopBtn.click();
            return;
        }

        store.selected = h.id;
        save(store);
        renderHeroes();
    };
    heroList.appendChild(d);
    });
}

