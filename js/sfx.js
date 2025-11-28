// sound manager for all assets/sound/

function makeAudio(path) {
  const base = new Audio(path);
  base.preload = "auto";
  base.volume = 0.7;
  return {
    play() {
      const a = base.cloneNode();
      a.volume = base.volume;
      a.play();
    }
  };
}

export const SFX = {
  correct: makeAudio("assets/sounds/correct.mp3"),
  wrong: makeAudio("assets/sounds/wrong.mp3"),
  victory: makeAudio("assets/sounds/win.mp3"),
  lose: makeAudio("assets/sounds/lose.mp3"),
  type: makeAudio("assets/sounds/type.mp3"),
};

let unlocked = false;
function unlockAudio() {
  if (unlocked) return;
  Object.values(SFX).forEach(a => a.play());
  unlocked = true;
}

window.addEventListener("click", unlockAudio);
window.addEventListener('keydown', unlockAudio);