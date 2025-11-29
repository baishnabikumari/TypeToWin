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
    sp.style.position = "relative";
    displayEl.appendChild(sp);
  }

  // Add cursor indicator
  const cursorEl = document.createElement("span");
  cursorEl.id = "typingCursor";
  cursorEl.style.cssText = `
    display: inline-block;
    width: 2px;
    height: 1.2em;
    background: #2ecc71;
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
      background: rgba(43, 124, 255, 0.15) !important;
      border-radius: 3px;
      padding: 2px 4px;
      margin: 0 1px;
    }
  `;
  document.head.appendChild(style);

  input.value = "";
  input.focus();

  let listenerBound = false;

  function updateCursor() {
    // Remove old cursor
    const oldCursor = displayEl.querySelector("#typingCursor");
    if (oldCursor) oldCursor.remove();

    // Remove old current-char highlight
    displayEl.querySelectorAll(".current-char").forEach(el => {
      el.classList.remove("current-char");
    });

    if (state.cursor < state.text.length) {
      const currentSpan = displayEl.querySelector(`span[data-index="${state.cursor}"]`);
      if (currentSpan) {
        // Highlight current character
        currentSpan.classList.add("current-char");
        
        // Insert cursor after current span
        currentSpan.insertAdjacentElement("afterend", cursorEl);
        
        // Auto-scroll to keep current position visible
        const displayRect = displayEl.getBoundingClientRect();
        const spanRect = currentSpan.getBoundingClientRect();
        
        // Scroll if current character is near the bottom
        if (spanRect.bottom > displayRect.bottom - 40) {
          currentSpan.scrollIntoView({ 
            behavior: "smooth", 
            block: "center",
            inline: "nearest"
          });
        }
      }
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
        const sp = displayEl.querySelector(`span[data-index="${state.cursor}"]`);

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
    const cursor = displayEl.querySelector("#typingCursor");
    if (cursor) cursor.remove();
    
    displayEl.querySelectorAll(".current-char").forEach(el => {
      el.classList.remove("current-char");
    });
  }

  input.addEventListener("paste", (e) => e.preventDefault());
  return { state, start, stop };
}