// sound manager for all assets/sound/

function makeAudio(path) {
    const a = new Audio(path);
    a.preload = "auto";
    a.volume = 0.7;
    return a;
}
export const SFX = {
    correct: makeAudio("assets/sounds/correct.mp3"),
    wrong: makeAudio("assets/sounds/lose.mp3"),
    victory: makeAudio("assets/sounds/type.mp3"),
    lose: makeAudio("assets/sounds/win.mp3"),
    type: makeAudio("assets/sound/wrong.mp3"),
};