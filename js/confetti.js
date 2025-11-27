// yooohoo when you will win this will show you colorful confettiii.

export function launchConfetti(x, y) {
  const colors = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"];

  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti";

    const size = Math.random() * 8 + 6;
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];

    document.body.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 6 + 4;
    const gravity = 0.25 + Math.random() * 0.1;

    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity;
    let opacity = 1;

    function step() {
      const curX = parseFloat(el.style.left);
      const curY = parseFloat(el.style.top);

      vx *= 0.99;
      vy += gravity;

      el.style.left = curX + vx + "px";
      el.style.top = curY + vy + "px";
      opacity -= 0.02;
      el.style.opacity = opacity;

      if (opacity <= 0) {
        el.remove();
      } else {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }
}