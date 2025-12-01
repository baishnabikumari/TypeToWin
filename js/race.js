// for race
import { HEROES } from "./heroes.js";
import { store, addCoins, save } from "./store.js";
import { initTypingEngine } from "./typing.js";
import { launchConfetti } from "./confetti.js";
import { SFX } from "./sfx.js";

const LANE_COUNT = 5; // 1_player + 4_bots
const TRACK_PX = 1100; // Distance to finish line (adjusted to match visual layout)

function laneTop(i, laneH = 85, gap = 18) {
  return 30 + i * (laneH + gap);
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
  const sprLeft = parseInt(spr.style.left) || 165;
  t.style.left = (sprLeft - 10) + "px";
  t.style.top = spr.style.top;

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

  // Create lanes
  for (let i = 0; i < LANE_COUNT; i++) {
    const lane = document.createElement("div");
    lane.className = "lane";
    lane.style.top = laneTop(i) + "px";
    trackEl.appendChild(lane);
  }

  // Create finish line
  const finish = document.createElement("div");
  finish.className = "finish";
  trackEl.appendChild(finish);

  // Create racers
  const players = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    // Determine hero
    let hero;
    let isPlayer = (i === 0);
    
    if (isPlayer) {
      hero = HEROES.find((h) => h.id === store.selected) || HEROES[0];
    } else {
      // Use different heroes for bots, cycling through available heroes
      hero = HEROES[i % HEROES.length];
    }

    // Create sprite
    const spr = document.createElement("div");
    spr.className = "sprite";
    spr.style.top = laneTop(i) + "px";

    const img = document.createElement("img");
    img.src = hero.img;
    img.alt = hero.name;
    spr.appendChild(img);

    // Create badge
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = isPlayer ? "You" : `Bot${i}`;
    badge.setAttribute("data-position", i + 1);
    badge.style.top = laneTop(i) + 28 + "px";
    
    trackEl.appendChild(badge);
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

  let typingEngine;
  
  const { state, start, stop } = initTypingEngine(text, (live) => {
    const player = players[0];

    const pxPerChar = TRACK_PX / text.length;

    player.progress = Math.min(
      TRACK_PX,
      live.correct *
        pxPerChar *
        (HEROES.find((h) => h.id === player.heroId)?.speed || 1)
    );
    
    // Update player finished status based on typing completion
    if (live.correct >= text.length && !player.finished) {
      player.finished = true;
      player.finishTime = Date.now();
    }
  });
  
  typingEngine = { state, start, stop };

  goEl.classList.add("show");
  setTimeout(() => goEl.classList.remove("show"), 700);

  setTimeout(() => {
    start();
    startLoop();
  }, 900);

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

      // Check if reached finish line
      if (p.progress >= TRACK_PX && !p.finished) {
        p.finished = true;
        p.finishTime = Date.now();
      }

      // Move sprite - cap at TRACK_PX
      const spritePos = Math.min(p.progress, TRACK_PX);
      p.spr.style.left = (165 + spritePos) + "px";
    }

    const player = players[0];
    const playerSpritePos = Math.min(player.progress, TRACK_PX);
    player.spr.style.left = (165 + playerSpritePos) + "px";

    if (Math.random() < 0.3) {
      spawnTrail(trackEl, player.spr);
    }

    const wpmEl = document.getElementById("wpm");
    const accEl = document.getElementById("acc");
    const progEl = document.getElementById("progress");

    const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
    const grossWPM = elapsed > 0 ? Math.round((state.typed / 5) / (elapsed / 60)) : 0;
    const acc = state.typed
      ? Math.round((state.correct / state.typed) * 100)
      : 100;

    wpmEl.textContent = grossWPM;
    accEl.textContent = acc + "%";
    progEl.textContent =
      Math.round((player.progress / TRACK_PX) * 100) + "%";

    // Player finishes when they complete the text
    if (state.correct >= text.length && !player.finished) {
      player.finished = true;
      player.finishTime = Date.now();
    }

    const allDone = players.every((p) => p.finished);
    
    // Check if all bots finished but player hasn't (Game Over - You Lose)
    const allBotsFinished = players.slice(1).every((p) => p.finished);
    const playerNotFinished = !player.finished;
    
    if (allBotsFinished && playerNotFinished) {
      raceStarted = false;
      stop();
      finalize();
      return;
    }

    if (allDone) {
      raceStarted = false;
      stop();
      finalize();
      return;
    }

    requestAnimationFrame(loop);
  }

  function finalize() {
    const elapsed = (Date.now() - (state.startTime || Date.now())) / 1000;
    const grossWPM = elapsed > 0 ? Math.round((state.typed / 5) / (elapsed / 60)) : 0;
    const acc = state.typed > 0
      ? Math.round((state.correct / state.typed) * 100)
      : 0;

    const sorted = players
      .slice()
      .sort((a, b) => {
        // If someone didn't finish, put them at the end
        if (!a.finished && !b.finished) return 0;
        if (!a.finished) return 1;
        if (!b.finished) return -1;
        return a.finishTime - b.finishTime;
      });

    const order = sorted.map((p) => p.id);

    // Check if player finished or lost
    const playerFinished = order.indexOf("you");
    const youWon = order[0] === "you" && players[0].finished;
    const youLost = !players[0].finished;

    let reward = 0;
    let baseReward = 0;
    let bonusReward = 0;
    
    if (youWon) {
      baseReward = 1000;
      bonusReward = 500;
    } else if (players[0].finished) {
      // Finished but not first
      if (playerFinished === 1 || playerFinished === 2) {
        // 2nd or 3rd place
        baseReward = 800;
        bonusReward = 300;
      } else if (playerFinished === 3 || playerFinished === 4) {
        // 4th or 5th place
        baseReward = 700;
        bonusReward = 200;
      } else {
        // Beyond 5th place
        baseReward = 500;
        bonusReward = 100;
      }
    } else {
      // Didn't finish - minimal reward
      baseReward = 100;
      bonusReward = 0;
    }
    
    reward = baseReward + bonusReward;
    
    // Accuracy bonus (additional on top)
    if (acc >= 90 && players[0].finished) {
      bonusReward += 100;
      reward += 100;
    }

    addCoins(reward);
    save(store);

    const trackRect = trackEl.getBoundingClientRect();

    if (youWon) {
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
    
    // Different messages based on result
    let resultMessage = "";
    let rewardBreakdown = "";
    
    if (youWon) {
      resultMessage = `<h3 style="color: #2ecc71;">🏆 Victory! You Won!</h3>`;
      rewardBreakdown = `
        <div style="background: rgba(46, 204, 113, 0.1); padding: 12px; border-radius: 8px; margin: 10px 0;">
          <p style="margin: 5px 0;">💰 Base Reward: <strong>1000 🪙</strong></p>
          <p style="margin: 5px 0;">🎁 Win Bonus: <strong>+500 🪙</strong></p>
          ${acc >= 90 ? '<p style="margin: 5px 0;">✨ Accuracy Bonus (90%+): <strong>+100 🪙</strong></p>' : ''}
        </div>
      `;
    } else if (youLost) {
      resultMessage = `<h3 style="color: #e74c3c;">💔 Game Over - You Lose!</h3>
        <p style="color: #e74c3c;">All bots finished before you completed the text.</p>`;
      rewardBreakdown = `
        <div style="background: rgba(231, 76, 60, 0.1); padding: 12px; border-radius: 8px; margin: 10px 0;">
          <p style="margin: 5px 0;">💰 Participation: <strong>100 🪙</strong></p>
        </div>
      `;
    } else if (playerFinished === 1 || playerFinished === 2) {
      resultMessage = `<h3 style="color: #f39c12;">${playerFinished === 1 ? '🥈' : '🥉'} ${playerFinished + 1}${getOrdinalSuffix(playerFinished + 1)} Place - Well Done!</h3>`;
      rewardBreakdown = `
        <div style="background: rgba(243, 156, 18, 0.1); padding: 12px; border-radius: 8px; margin: 10px 0;">
          <p style="margin: 5px 0;">💰 Base Reward: <strong>800 🪙</strong></p>
          <p style="margin: 5px 0;">🎁 Placement Bonus: <strong>+300 🪙</strong></p>
          ${acc >= 90 ? '<p style="margin: 5px 0;">✨ Accuracy Bonus (90%+): <strong>+100 🪙</strong></p>' : ''}
        </div>
      `;
    } else if (playerFinished === 3 || playerFinished === 4) {
      resultMessage = `<h3 style="color: #3498db;">📊 ${playerFinished + 1}${getOrdinalSuffix(playerFinished + 1)} Place</h3>`;
      rewardBreakdown = `
        <div style="background: rgba(52, 152, 219, 0.1); padding: 12px; border-radius: 8px; margin: 10px 0;">
          <p style="margin: 5px 0;">💰 Base Reward: <strong>700 🪙</strong></p>
          <p style="margin: 5px 0;">🎁 Placement Bonus: <strong>+200 🪙</strong></p>
          ${acc >= 90 ? '<p style="margin: 5px 0;">✨ Accuracy Bonus (90%+): <strong>+100 🪙</strong></p>' : ''}
        </div>
      `;
    } else {
      resultMessage = `<h3 style="color: #95a5a6;">📊 ${playerFinished + 1}${getOrdinalSuffix(playerFinished + 1)} Place</h3>`;
      rewardBreakdown = `
        <div style="background: rgba(149, 165, 166, 0.1); padding: 12px; border-radius: 8px; margin: 10px 0;">
          <p style="margin: 5px 0;">💰 Base Reward: <strong>500 🪙</strong></p>
          <p style="margin: 5px 0;">🎁 Completion Bonus: <strong>+100 🪙</strong></p>
          ${acc >= 90 ? '<p style="margin: 5px 0;">✨ Accuracy Bonus (90%+): <strong>+100 🪙</strong></p>' : ''}
        </div>
      `;
    }
    
    resultsEl.innerHTML = `
      ${resultMessage}
      <p>WPM: <strong>${grossWPM}</strong> | Accuracy: <strong>${acc}%</strong></p>
      <p><strong>Final Standings</strong><br>${order
        .map((p, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          const isYou = p === "you";
          const finishedText = isYou && !players[0].finished ? " (DNF)" : "";
          return `${medal} ${isYou ? "<strong>You</strong>" : p}${finishedText}`;
        })
        .join("<br>")}</p>
      ${rewardBreakdown}
      <p style="color: #2ecc71; font-size: 22px; font-weight: 700; margin-top: 10px;">Total Coins: +${reward} 🪙</p>
      <button class="btn primary" id="playAgain">🔄 Play Again</button>
      <button class="btn ghost" id="backHome" style="margin-left: 10px;">🏠 Back to Home</button>
    `;

    document
      .getElementById("playAgain")
      .addEventListener("click", () => location.reload());
      
    document
      .getElementById("backHome")
      .addEventListener("click", () => {
        document.getElementById("raceView").style.display = "none";
        document.getElementById("home").style.display = "block";
      });

    onFinishCb && onFinishCb({ wpm: grossWPM, acc, order, reward });
  }
  
  // Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
  function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  }
}