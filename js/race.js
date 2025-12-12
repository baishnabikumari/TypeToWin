import { HEROES } from "./heroes.js";
import { store, addCoins, save } from "./store.js";
import { initTypingEngine } from "./typing.js";
import { SFX } from "./sfx.js";

const LANE_COUNT = 4;

export function initRaceScene(onFinishCb) {
  const trackEl = document.getElementById("track");
  const goEl = document.getElementById("go");
  const resultsEl = document.getElementById("results");

  trackEl.innerHTML = "";
  resultsEl.style.display = "none";

  const players = [];

  for (let i = 0; i < LANE_COUNT; i++) {
    const lane = document.createElement("div");
    lane.className = "track-lane";
    trackEl.appendChild(lane);

    let isPlayer = (i === 1);
    let hero;

    if (isPlayer) {
      hero = HEROES.find((h) => h.id === store.selected) || HEROES[0];
    } else {
      hero = HEROES[(i + 2) % HEROES.length];
    }

    const spr = document.createElement("div");
    spr.className = "sprite";
    spr.style.left = "0%";

    const img = document.createElement("img");
    img.src = hero.img;
    img.alt = hero.name;
    spr.appendChild(img);

    if (isPlayer) {
      const tag = document.createElement("div");
      tag.className = "player-tag";
      tag.textContent = "YOU";
      spr.appendChild(tag);
    } 
    
    lane.appendChild(spr);

    players.push({
      id: isPlayer ? "you" : "bot" + i,
      heroId: hero.id,
      spr,
      progress: 0,
      finished: false,
      finishTime: null,
      wpm: isPlayer ? 0 : 20 + Math.random() * 30,
    });
  }

  const texts = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing speed improves with daily practice and focus.",
    "Accuracy is just as important as speed in this game.",
    "Keep your eyes on the screen and fingers on the keys.",
    "Coding is like typing but you have to think a lot more."
  ];
  const text = texts[Math.floor(Math.random() * texts.length)];

  let typingEngine;
  const { state, start, stop } = initTypingEngine(text, (live) => {
    const player = players.find(p => p.id === "you");
    
    const percent = (live.correct / text.length) * 100;
    const speedMod = HEROES.find((h) => h.id === player.heroId)?.speed || 1;
    
    player.progress = Math.min(100, percent * speedMod);

    if (live.correct >= text.length && !player.finished) {
      player.finished = true;
      player.finishTime = Date.now();
    }
  });

  typingEngine = { state, start, stop };

  goEl.classList.add("show");
  
  setTimeout(() => {
    goEl.classList.remove("show");
    start();
    startLoop();
  }, 1000);

  let last = performance.now();
  let raceStarted = true;

  function startLoop() {
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!raceStarted) return;
    const dt = (ts - last) / 1000;
    last = ts;

    for (const p of players) {
      if (p.id === "you") continue;
      if (p.finished) continue;

      const charsPerSec = (p.wpm * 5) / 60;
      const percentPerSec = (charsPerSec / text.length) * 100;
      p.progress += percentPerSec * dt;

      if (p.progress >= 100) {
        p.progress = 100;
        p.finished = true;
        p.finishTime = Date.now();
      }
    }

    const VISUAL_LIMIT = 92; 
    players.forEach(p => {
      const visualPos = (p.progress / 100) * VISUAL_LIMIT;
      p.spr.style.left = visualPos + "%";
    });

    const wpmEl = document.getElementById("wpm");
    const accEl = document.getElementById("acc");
    const progEl = document.getElementById("progress");
    const barEl = document.getElementById("typingProgressBar");

    const human = players.find(p => p.id === "you");
    const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
    const grossWPM = elapsed > 0 ? Math.round((state.typed / 5) / (elapsed / 60)) : 0;
    const acc = state.typed ? Math.round((state.correct / state.typed) * 100) : 100;

    if (wpmEl) wpmEl.textContent = grossWPM;
    if (accEl) accEl.textContent = acc + "%";
    if (progEl) progEl.textContent = Math.round(human.progress) + "%";
    if (barEl) barEl.style.width = human.progress + "%";

    const allBotsDone = players.filter(p => p.id !== "you").every(p => p.finished);
    const playerDone = human.finished;

    if (playerDone || (allBotsDone && !playerDone)) {
      if (playerDone || allBotsDone) {
        raceStarted = false;
        stop();
        setTimeout(finalize, 1000);
      }
    }
    
    if (raceStarted) requestAnimationFrame(loop);
  }

  function finalize() {
    const sorted = players.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });

    const rank = sorted.findIndex(p => p.id === "you") + 1;
    let coins = 0;
    let title = "";

    if (rank === 1) { coins = 100; title = "🏆 1st Place!"; SFX.victory.play(); }
    else if (rank === 2) { coins = 50; title = "🥈 2nd Place!"; SFX.lose.play(); }
    else { coins = 10; title = "🥉 3rd Place!"; SFX.lose.play(); }

    addCoins(coins);
    
    resultsEl.style.display = "block";
    resultsEl.innerHTML = `
    <h1 style="font-family: var(--font-marker); font-size: 40px; margin: 0; color: #2c3e50;">${title}</h1>
    <p style="font-size: 18px; color: #555;">You earned <strong>${coins} 🪙</strong></p>

    <div style="background: #eee; padding:15px; border-radius:10px; margin:20px 0; text-align:left;">
    ${sorted.map((p, i) => `
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #ddd; padding:5px 0; ${p.id === 'you' ? 'font-weight:bold; color: #f25349' : ''}">
        <span>#${i + 1} ${p.id === 'you' ? 'YOU' : HEROES.find(h => h.id === p.heroId).name}</span>
        <span>${p.finished ? 'Finished' : Math.floor(p.progress) + '%'}</span>
      </div>
      `).join('')}
    </div>
    
    <div style="display:flex; gap:10px; justify-content:center;">
      <button class="nav-pill" onclick="location.reload()">RACE AGAIN</button>
      <button class="nav-pill" style="background: #444;" onclick="location.reload()">HOME</button>
    </div>
    `;
  }
}