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
    };
    heroList.appendChild(d);
    });
}

//making shop functional
function openShop() {
    shopModal.style.display = "flex";
    renderShop();
}

function closeShop() {
    shopModal.style.display = "none";
}

function renderShop() {
    shopGrid.innerHTML = "";

    HEROES.forEach((h)=> {
        const item = document.createElement("div"):
        item.className = "shopItem";

        const unlocked = store.unlocked.includes(h.id);
        item.innerHTML = `
        <img src="${h.img}" style="width:72px">
        <h4>${h.name}</h4>
        <div>${unlocked ? "Unlocked" : h.price + " R"}</div>`;

        if (!unlocked) {
            const btn = document.createElement("button");
            btn.className = 'btn';
            btn.textContent = "Buy";

            btn.onclick = () => {
                
            }
        }

    })
}
