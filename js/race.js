// for race
import { HEROES } from "./heroes.js";
import { store, addCoins, save } from "./store.js";
import { initTypingEngine } from "./typing.js";
import { launchConfetti } from "./confetti.js";
import { SFX } from "./sfx.js";

const LANE_COUNT = 3; // 1_player + 4_bots
const TRACK_PX = 100; // Distance to finish line (adjusted to match visual layout)

export function initRaceScene(onFinishCb) {
  const trackEl = document.getElementById("track");
  const goEl = document.getElementById("go");
  const resultsEl = document.getElementById("results");

  trackEl.innerHTML = "";
  resultsEl.style.display = "none";

  const players = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    let hero;
    let isPlayer = (i === 0);

    if (isPlayer) {
      hero = HEROES.find((h) => h.id === store.selected) || HEROES[0];
    } else {
      hero = HEROES[(i + 1) % HEROES.length];
    }
    const spr = document.createElement("div");
    spr.className = "sprite";

    spr.style.marginTop = (i * 20 - 20) + "px";
    const img = document.createElement("img");
    img.src = hero.img;
    img.alt = hero.name;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    spr.appendChild(img);
    if (isPlayer) {
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = "YOU";
      badge.style.top = "-20px";
      spr.appendChild(badge);
    }
    trackEl.appendChild(spr);

    players.push({
      id: isPlayer ? "you" : "bot" + i,
      heroId: hero.id,
      spr,
      progress: 0,
      finished: false,
      finishTime: null,
      wpm: isPlayer ? 0 : 30 + (i * 10) + (Math.random() * 10),
    });
  }
  const texts = [
    "Typing skills are an art that can be mastered as one gains more time and practice in the craft of learning to type fast and correctly. The more you keep typing the more your fingers will automatically know the keyboard arrangement and you do not really need to spend much time searching where your keys are located but rather communicate effectively and succinctly what you want to say. It is important to remember that being accurate is always better than being fast because developing good habits in the early years will not make you fall into the pit of errors.",
    "The ability to type well has turned out to be a key to success in nearly all professions in the digital era. It can be the speed at which you type without glancing at the keyboard which can whole heartedly enhance effectiveness and minimize frustrating situations whether you are sending email, writing documents, coding programs or just chatting with your friends on the internet. Begin with the mastery of home row keys then slowly learn to use all the letters, numbers and special characters.",
    "The proper typing posture and the placement of the fingers are underestimated by many people. Seating straight, avoiding using a footstool and keeping your wrists slightly raised can help avoid strain and fatigue in a protracted typing session. Your fingers must be automatically on the home row keys with index fingers on F and J keys which are normally raised a small bump to make you find them without necessarily looking.",
    "The most effective way that you enhance your typing speed is by undertaking a calculated practice by using a collection of exercises and the true world typing cases. Attempt to type quotes of your favorite books, write down podcasts or even a journal entry about your day. The more varied your practice material the more you will be ready to encounter any typing task that will arise either in school, work or in your own projects.",
    "Touch typing is typing without having to look at the keyboard and instead having muscle memory and spatial awareness. It might be clumsy and slow initially but once the first learning curve is gotten over it will definitely reward the effort with tremendous returns in the long run. Practice enables most professional typists to work at sixty to eighty words per minute and even faster with some rare individuals working at over a hundred words per minute with almost perfect accuracy."
  ];

  const text = texts[Math.floor(Math.random() * texts.length)];

  let typingEngine;

  const { state, start, stop } = initTypingEngine(text, (live) => {
    const player = players[0];
    const percent = (live.correct / text.length) * 100;
    const speedMod = HEROES.find((h) => h.id === player.heroId)?.speed || 1;

    player.progress = Math.min(100, percent * speedMod);
    // Update player finished status based on typing completion
    if (live.correct >= text.length && !player.finished) {
      player.finished = true;
      player.finishTime = Date.now();
    }
  });

  typingEngine = { state, start, stop };

  goEl.classList.add("show");
  setTimeout(() => goEl.classList.remove("show"), 1000);

  setTimeout(() => {
    start();
    startLoop();
  }, 1200);

  let last = performance.now();
  let raceStarted = false;

  function startLoop() {
    last = performance.now();
    raceStarted = true;
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!raceStarted) return;

    const dt = (ts - last) / 1000;
    last = ts;

    for (let i = 1; i < players.length; i++) {
      const p = players[i];
      if (p.finished) continue;

      const charsPerSec = (p.wpm * 5) / 60;
      const percentPerSec = (charsPerSec / text.length) * 100;

      p.progress += percentPerSec * dt;
      // Check if reached finish line
      if (p.progress >= 100) {
        p.progress = 100;
        p.finished = true;
        p.finishTime = Date.now();
      }
    }
    players.forEach(p => {
      p.spr.style.offsetDistance = `${p.progress}%`;
    });
    const wpmEl = document.getElementById("wpm");
    const accEl = document.getElementById("acc");
    const progEl = document.getElementById("progress");
    const barEl = document.getElementById("typingProgressBar");
    const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
    const grossWPM = elapsed > 0 ? Math.round((state.typed / 5) / (elapsed / 60)) : 0;
    const acc = state.typed ? Math.round((state.correct / state.typed) * 100) : 100;

    if (wpmEl) wpmEl.textContent = grossWPM;
    if (accEl) accEl.textContent = acc + "%";
    if (progEl) progEl.textContent = Math.round(players[0].progress) + "%";
    if (barEl) barEl.style.width = Math.round(players[0].progress) + "%";

    const allBotsDone = players.slice(1).every((p) => p.finished);
    const playerDone = players[0].finished;
    if (playerDone || (allBotsDone && !playerDone)) {
      if (!playerDone && allBotsDone) {

      }
      if (!playerDone || allBotsDone) {
        raceStarted = false;
        stop();
        finalize();
        return;
      }
    }
    requestAnimationFrame(loop);
  }

  function finalize() {
    const sorted = players.slice().sort((a, b) => {
      // If someone didn't finish, put them at the end
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    const rank = sorted.findIndex(p => p.id === "you") + 1;
    let coins = 0;
    let title = "";

    if (rank === 1) {
      coins = 100; title = "🏆 1st Place!"; SFX.victory.play();
    }
    else if (rank === 2) {
      coins = 50; title = "🥈 2nd Place!"; SFX.lose.play();
    }
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
    </div >
    <div style="display:flex; gap:10px; justify-content:center;">
      <button class="nav-pill" onclick="location.reload()">RACE AGAIN</button>
      <button class="nav-pill" style="background: #444;" onclick="location.reload()">HOME</button>
    </div>
    `;
  }
}