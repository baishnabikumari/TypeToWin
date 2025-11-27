import { SFX } from "./sfx.js";

export function initTypingEngine(text, onUpdate) {
  const displayEl = document.getElementById("displayText");
  const input = document.getElementById("hiddenInput");

  let state = {
    text,
    cursor: 0,
    typed: 0,
    correct: 0,
    wrong: 0,
    running: false,
    startTime: null,
  };

  //Building text spans
  displayEl.innerHTML = "";
  for (let i = 0; i < text.length; i++) {
    const sp = document.createElement("span");
    sp.dataset.index = i;
    sp.textContent = text[i];
    displayEl.appendChild(sp);
  }

  input.value = "";
  input.focus();

  function handleKey(e) {
    if (!state.running) return;

    //Backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      if (state.cursor > 0) {
        state.cursor--;
        const sp = displayEl.querySelector(`span[data-index="${state.cursor}"]`);
        if (sp) sp.classList.remove("correct", "wrong");

        state.typed = Math.max(0, state.typed - 1);
      }
      onUpdate && onUpdate(state);
      return;
    }

    //character
    if (e.key.length === 1) {
      e.preventDefault();

      const expected = state.text[state.cursor] || "";
      const sp = displayEl.querySelector(`span[data-index="${state.cursor}"]`);

      state.typed++;

      if (e.key === expected) {
        state.correct++;
        if (sp) sp.classList.add("correct");

        //correct SFX
        if (SFX.correct) {
          SFX.correct.currentTime = 0;
          SFX.correct.play();
        }
      } else {
        state.wrong++;
        if (sp) sp.classList.add("wrong");

        //wrong sfx
        if (SFX.wrong) {
          SFX.wrong.currentTime = 0;
          SFX.wrong.play();
        }
      }

      //General typing SFX
      if (SFX.type) {
        SFX.type.currentTime = 0;
        SFX.type.play();
      }

      state.cursor++;

      onUpdate && onUpdate(state);
    }
  }

  function start() {
    state.running = true;
    state.startTime = Date.now();
    window.addEventListener("keydown", handleKey);
  }

  function stop() {
    state.running = false;
    window.removeEventListener("keydown", handleKey);
  }

  input.addEventListener("paste", (e) => e.preventDefault());
  return { state, start, stop };
}