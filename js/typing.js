import { SFX } from "./sfx.js";

export function initTypingEngine(text, onUpdate) {
  const displayEl = document.getElementById("displayText");
  const displayInner = document.getElementById("displayTextInner");
  const input = document.getElementById("hiddenInput");
  const progressBar = document.getElementById("typingProgressBar");

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
  displayInner.innerHTML = "";
  for (let i = 0; i < text.length; i++) {
    const sp = document.createElement("span");
    sp.dataset.index = i;
    sp.textContent = text[i];
    sp.style.position = "relative";
    displayInner.appendChild(sp);
  }

  // Add cursor indicator
  const cursorEl = document.createElement("span");
  cursorEl.id = "typingCursor";
  cursorEl.style.cssText = `
    display: inline-block;
    width: 3px;
    height: 1.3em;
    background: #4caf50;
    margin-left: 2px;
    animation: blink 1s infinite;
    vertical-align: text-bottom;
  `;
  
  // Add blink animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    .current-char {
      background: rgba(76, 175, 80, 0.2) !important;
      border-radius: 4px;
      padding: 4px 6px !important;
      margin: 0 2px;
      border-bottom: 3px solid #4caf50;
    }
  `;
  document.head.appendChild(style);

  input.value = "";
  input.focus();

  let listenerBound = false;

  function updateCursor() {
    // Remove old cursor
    const oldCursor = displayInner.querySelector("#typingCursor");
    if (oldCursor) oldCursor.remove();

    // Remove old current-char highlight
    displayInner.querySelectorAll(".current-char").forEach(el => {
      el.classList.remove("current-char");
    });

    if (state.cursor < state.text.length) {
      const currentSpan = displayInner.querySelector(`span[data-index="${state.cursor}"]`);
      if (currentSpan) {
        // Highlight current character
        currentSpan.classList.add("current-char");
        
        // Insert cursor after current span
        currentSpan.insertAdjacentElement("afterend", cursorEl);
        
        const containerWidth = displayEl.offsetWidth;
        const spanOffsetLeft = currentSpan.offsetLeft;
        const centerOffset = containerWidth / 2;
        
        // Calculate transform to center current character
        const translateX = centerOffset - spanOffsetLeft - (currentSpan.offsetWidth / 2);
        displayInner.style.transform = `translateX(${Math.min(0, translateX)}px)`;
      }
    }
    
    // Update progress bar
    const progress = (state.cursor / state.text.length) * 100;
    if (progressBar) {
      progressBar.style.width = progress + "%";
    }
  }

  // Initial cursor position
  updateCursor();

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
        const sp = displayInner.querySelector(`span[data-index="${state.cursor}"]`);

        if (sp?.classList.contains("correct")) state.correct--;
        if (sp?.classList.contains("wrong")) state.wrong--;

        sp.classList.remove("correct", "wrong");
        state.typed = Math.max(0, state.typed - 1);
      }
      updateCursor();
      onUpdate && onUpdate(state);
      return;
    }

    //character
    if (e.key.length === 1) {
      e.preventDefault();

      const expected = state.text[state.cursor] || "";
      const sp = displayInner.querySelector(`span[data-index="${state.cursor}"]`);

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

      updateCursor();
      onUpdate && onUpdate(state);
    }
  }

  function start() {
    if (listenerBound) return;
    state.running = true;
    state.startTime = Date.now();
    window.addEventListener("keydown", handleKey);
    listenerBound = true;
    updateCursor();
  }

  function stop() {
    state.running = false;
    window.removeEventListener("keydown", handleKey);
    listenerBound = false;
    
    // Remove cursor when finished
    const cursor = displayInner.querySelector("#typingCursor");
    if (cursor) cursor.remove();
    
    displayInner.querySelectorAll(".current-char").forEach(el => {
      el.classList.remove("current-char");
    });
  }

  input.addEventListener("paste", (e) => e.preventDefault());
  return { state, start, stop };
}