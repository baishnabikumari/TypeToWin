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

  let listenerBound = false;

  function handleKey(e) {
    if (!state.running) return;

    if (state.cursor >= state.text.length) {
      stop();
      return;
    }

    //Backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      if (state.cursor > 0) {
        state.cursor--;
        const sp = displayEl.querySelector(`span[data-index="${state.cursor}"]`);

        if (sp?.classList.contains("correct")) state.correct--;
        if (sp?.classList.contains("wrong")) state.wrong--;

        sp.classList.remove("correct", "wrong");
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

      let played = false;

      if (e.key === expected) {
        state.correct++;
        if (sp) sp.classList.add("correct");
        if (SFX.correct) {
          SFX.correct.play();
          played = true;
        }
      } else {
        state.wrong++;
        if (sp) sp.classList.add("wrong");
        if (SFX.wrong) {
          SFX.wrong.play();
          played = true;
        }
      }

      if (!played && SFX.type) {
        SFX.type.play();
      }

      state.cursor++;

      // FINISH TRIGGER FIX
      if (state.cursor === state.text.length) {
        stop();
        if (typeof onUpdate === "function") {
          onUpdate({ ...state, finished: true });
        }
        return;
      }

      onUpdate && onUpdate(state);
    }
  }

  function start() {
    if (listenerBound) return;
    state.running = true;
    state.startTime = Date.now();
    window.addEventListener("keydown", handleKey);
    listenerBound = true;
  }

  function stop() {
    state.running = false;
    window.removeEventListener("keydown", handleKey);
    listenerBound = false;
  }

  input.addEventListener("paste", (e) => e.preventDefault());
  return { state, start, stop };
}