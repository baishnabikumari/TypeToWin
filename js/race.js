// for race
import { HEROES } from "./heroes.js";
import { store, addCoins, save } from "./store.js";
import { initTypingEngine } from "./typing.js";
import { launchConfetti } from "./confetti.js";
import { SFX } from "./sfx.js";

const LANE_COUNT = 5; // 1_player + 4_bots
const TRACK_PX = 2400; // now 2400 track width for better visibility

function laneTop(i, laneH = 72, gap = 30) {
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
      rect.top - (fromY - 18)
    }px) scale(0.3)`;
    el.style.opacity = "0.05";
    setTimeout(() => el.remove(), 900);
  });
}

// speed trail
function spawnTrail(trackEl, spr) {
  const t = document.createElement("div");
  t.className = "trail";
  t.style.left = spr.offsetLeft + "px";
  t.style.top = spr.offsetTop + 36 + "px";

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

  trackEl.innerHTML = "";
  resultsEl.style.display = "none";

  for (let i = 0; i < LANE_COUNT; i++) {
    const lane = document.createElement("div");
    lane.className = "lane";
    lane.style.top = laneTop(i) + "px";
    trackEl.appendChild(lane);
  }

  const finish = document.createElement("div");
  finish.className = "finish";
  trackEl.appendChild(finish);

  const players = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    const spr = document.createElement("div");
    spr.className = "sprite";
    spr.style.top = laneTop(i) + "px";

    const hero =
      i === 0
        ? HEROES.find((h) => h.id === store.selected)
        : HEROES[i % HEROES.length];

    const img = document.createElement("img");
    img.src = hero.img;
    spr.appendChild(img);

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = i === 0 ? "You" : "Bot" + i;
    spr.appendChild(badge);

    trackEl.appendChild(spr);

    players.push({
      id: i === 0 ? "you" : "bot" + i,
      heroId: hero.id,
      spr,
      progress: 0,
      finished: false,
      finishTime: null,
      wpm: i === 0 ? 0 : 30 + i * 5 + (Math.random() * 6 - 3),
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

  const { state, start, stop } = initTypingEngine(text, (live) => {
    const player = players[0];

    const pxPerChar = TRACK_PX / text.length;

    player.progress = Math.min(
      TRACK_PX,
      live.correct *
        pxPerChar *
        (HEROES.find((h) => h.id === player.heroId)?.speed || 1)
    );
  });

  goEl.classList.add("show");
  setTimeout(() => goEl.classList.remove("show"), 700);

  setTimeout(() => {
    start();
    startLoop();
  }, 900);

  let last = performance.now();

  function startLoop() {
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    const dt = (ts - last) / 1000;
    last = ts;

    for (let i = 1; i < players.length; i++) {
      const p = players[i];
      if (p.finished) continue;

      const variation =
        1 + Math.sin(ts / 1000 + i) * 0.05 + Math.random() * 0.02;

      const charsPerSec = (p.wpm * 5) / 60;

      const pxPerChar = TRACK_PX / text.length;

      p.progress +=
        charsPerSec *
        dt *
        pxPerChar *
        variation *
        (HEROES.find((h) => h.id === p.heroId)?.speed || 1);

      if (p.progress >= TRACK_PX && !p.finished) {
        p.finished = true;
        p.finishTime = Date.now();
      }

      p.spr.style.transform = `translateX(${Math.min(
        p.progress,
        TRACK_PX
      )}px)`;
    }

    const player = players[0];
    player.spr.style.transform = `translateX(${Math.min(
      player.progress,
      TRACK_PX
    )}px)`;

    if (Math.random() < 0.3) {
      spawnTrail(trackEl, player.spr);
    }

    const wpmEl = document.getElementById("wpm");
    const accEl = document.getElementById("acc");
    const progEl = document.getElementById("progress");

    const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
    const grossWPM = Math.round((state.typed / 5) / (elapsed / 60));
    const acc = state.typed
      ? Math.round((state.correct / state.typed) * 100)
      : 100;

    wpmEl.textContent = grossWPM;
    accEl.textContent = acc + "%";
    progEl.textContent =
      Math.round((player.progress / TRACK_PX) * 100) + "%";

    if (!player.finished && player.progress >= TRACK_PX) {
      player.finished = true;
      player.finishTime = Date.now();
    }

    const allDone = players.every((p) => p.finished);

    if (allDone) {
      stop();
      finalize();
      return;
    }

    requestAnimationFrame(loop);
  }

  function finalize() {
    const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
    const grossWPM = Math.round((state.typed / 5) / (elapsed / 60));
    const acc = state.typed
      ? Math.round((state.correct / state.typed) * 100)
      : 0;

    const sorted = players
      .slice()
      .sort((a, b) => (a.finishTime || 999999) - (b.finishTime || 999999));

    const order = sorted.map((p) => p.id);

    let reward = 20;
    if (order[0] === "you") reward += 50;
    if (acc >= 90) reward += 10;

    addCoins(reward);
    save(store);

    const trackRect = trackEl.getBoundingClientRect();

    if (order[0] === "you") {
      launchConfetti(
        trackRect.left + trackRect.width / 2,
        trackRect.top + 40
      );
      SFX.victory.currentTime = 0;
      SFX.victory.play();
    } else {
      SFX.lose.currentTime = 0;
      SFX.lose.play();
    }

    coinFly(
      trackRect.left + trackRect.width / 2,
      trackRect.top + trackRect.height / 2,
      document.querySelector(".coins")
    );

    document.getElementById("coinCount").textContent = store.coins;

    resultsEl.style.display = "block";
    resultsEl.innerHTML = `
      <h3>Race Results</h3>
      <p>WPM: <strong>${grossWPM}</strong> | Accuracy: <strong>${acc}%</strong></p>
      <p><strong>Final Standings</strong><br>${order
        .map((p, i) => `${i + 1}. ${p === "you" ? "🏆 You" : p}`)
        .join("<br>")}</p>
      <p style="color: #2ecc71; font-size: 18px; font-weight: 700;">Coins earned: +${reward} 🪙</p>
      <button class="btn primary" id="playAgain">Play Again</button>
    `;

    document
      .getElementById("playAgain")
      .addEventListener("click", () => location.reload());

    onFinishCb && onFinishCb({ wpm: grossWPM, acc, order, reward });
  }
}