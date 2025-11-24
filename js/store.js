const KEY = "typingRace_store_v1"

/* saving data */
const DEFAULT = {
    coins: 1500,
    selected: "packo",
    unlocked: ["packo", "beavy"],
    stats: {
        totalGames:0,
        bestWPM:0,
    },
};

/*Load files which are saved*/
function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return structuredClone(DEFAULT);

        return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));        
    } catch (e) {
        console.warn("store.load failed:", e);
        return structuredClone(DEFAULT);
    }
}

/*saving file*/
function save(state) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
        console.warm("stor.save failed:", e);
    }
}

let store = load();

/*add coins*/
function addCoins(amount) {
    store.coins = (store.coins || 0) + amount;
    save(store);
}

export { store, save, addCoins };