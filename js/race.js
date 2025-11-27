//for race
import { HEROES } from "./heroes.js";
import { store, addCoins, save } from "./store.js";
import { initTypingEngine } from "./typing.js";
import { launchConfetti } from "./confetti.js";
import { SFX } from "./sfx.js";

const LANE_COUNT = 5; //1_player + 4_bots
const TRACK_PX = 820;

function laneTop(i, laneH = 72, gap = 18) {
    return 12 + i * (laneH + gap);
}

// coins fly animation
function coinFly(fromX, fromY, toEl) {
    const el = document.createElement("div");
    el.className = "coin-fly";
    el.textContent = "R";
    document.body.appendChild(el);

    el.style.left = fromX - 18 + "px";
    el.style.top = fromY - 18 + "px";
    const rect = toEl.getBoundingClientRect();

    requestAnimationFrame(() => {
        el.style.transform = `translate(${rect.left - (fromX - 18)}px, ${
            rect.top - (fromY- 18)
        }px) scale(0.3)`;
        el.style.opacity = "0.05";
        setTimeout(() => el.remove(), 900);
    });
}

//speed-trail
function spawnTrail(trackEl, spr) {
    const t = document.createElement("div");
    t.className = "trail";
    t.style.left = spr.offsetlLeft + "px";
    t.style.top = spr.offsetTop + 50 + "px";

    trackEl.appendChild(t);
    setTimeout(() => {
        t.style.opacity = "0";
        setTimeout(() => t.remove(), 250);
    }, 30);
}
export function initRaceScene(onFinishCb) {
    const trackEl = document.getElementById("track");
    const goEl = document.getElementById("go");
    const resultsEl = document.getElementById("results");

    //track reset
    trackEl.innerHTML = "";
    resultsEl.style.display = "none";

    //lane 
    for(let i = 0; i < LANE_COUNT; i++) {
        const lane = document.createElement("div");
        lane.className = "lane";
        lane.style.top = laneTop(i) + "px";
        trackEl.appendChild(lane);
    }

    //finsh lane
    const finish = document.createElement("div");
    finish.className = "finish";
    finish.style.top = "8px";
    finish.style.bottom = "8px";
    trackEl.appendChild(finish);

    //player + bot
    const players = [];
    for (let i = 0; i < LANE_COUNT; i++) {
        const spr = document.createElement("div");
        spr.className = "sprite";
        spr.style.top = laneTop(i) - 8 + "px";

        const hero = i === 0 ? HEROES.find((h) => h.id === store.selected) : HEROES[i % HEROES.length];

        const img = document.createElement("img");
        img.src = hero.img;
        spr.appendChild(img);

        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = i === 0 ? "You" : "Bot" + i;
        spr.appendChild(badge);

        trackEl.appendChild(spr);
        players.push({
            id: i === 0 ? "You" : "bot" + i,
            heroId: hero.id,
            spr,
            progress: 0,
            finished: false,
            finishTime: null,
            wpm: i === 0 ? 0 : 35 + i * 6 + (Math.random() * 8 - 4),
        });
    }

    //typing engine
    const texts = [
        "Learning to type quickly improves confidence and productivity.",
        "The quickly brown fox jumps over the lazy dog.",
        "Practice daily for short sessions and you will iprove steadily."
    ];

    const text = texts[Math.floor(Math.random() * text.length)];

    const { state, start, stop } = initTypingEngine(text, (live) => {
        const player = players[0];
        const pxPerChar = TRACK_PX / Math.max(60, text.length);

        player.progress = Math.min(
            TRACK_PX,
            live.correct * pxPerChar * (HEROES.find(h => h.id === player.heroId)?.speed || 1)
        );
    });

    //GO animation
    goEl.classList.add("show");
    setTimeout(() => goEl.classList.remove("show"), 700);

    //start after small delay
    setTimeout(() => {
        start();
        startLoop();
    }, 900);

    let last = performance.now();
    //animation loop
    function startLoop() {
        last = performance.now();
        requestAnimationFrame(loop);
    }

    function loop(ts) {
        const dt = (ts - last) / 1000;
        last = ts;

        //updating bots
        for (let i = 1; i < players.length; i++) {
            const p = players[i];
            if (p.finished) continue;

            const variation = 1 + Math.sin(ts / 1000 + i) * 0.05 + (Math.random() * 0.02);
            const charsPerSec = (p.wpm * 5) / 60;
            const pxPerChar = TRACK_PX / Math.max(60, text.length);

            p.progress += charsPerSec * dt * pxPerChar * variation * (HEROES.find((h) => h.id === p.heroId)?.speed || 1);

            if (p.progress >= TRACK_PX && !p.finished) {
                p.finished = true;
                p.finishedTime = Date.now();
            }

            p.spr.style.transform = `translateX(${Math.min(
                p.progress,
                TRACK_PX
            )}px)`;
        }

        //update player
        const player = players[0];
        player.spr.style.transform = `translateX(${Math.min(
            player.progress,
            TRACK_PX
        )}px)`;

        spawnTrail(trackEl, player.spr);

        const wpmEl = document.getElementById("wpm");
        const accEl = document.getElementById("acc");
        const progEl = document.getElementById("progress");

        const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
        const grossWPM = Math.round((state.typed / 5) / (elapsed / 60));
        const acc = state.typed ? Math.round((state.correct / state.typed) * 100) : 100;

        wpmEl.textContent = grossWPM;
        accEl.textContent = acc + "%";
        progEl.textContent = Math.round((player.progress / TRACK_PX) * 100) + "%";

        //when player finishes
        if (!player.finished && player.progress >= TRACK_PX) {
            player.finished = true;
            player.finished
        }
    }
}