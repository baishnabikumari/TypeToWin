// yooohoo when you will win this will show you colorful confettiii.

export function launchConfetti(x, y) {
  const colors = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"];
  const count = 50;

  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti";

    const size = Math.random() * 8 + 6;
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.position = "fixed";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.pointerEvents = "none";
    el.style.willChange = "transform, opacity";

    document.body.appendChild(el);

    let posX = x;
    let posY = y;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 6;

    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let opacity = 1;
    const gravity = 0.35;

    function animate() {
      vx *= 0.98;
      vy += gravity;

      posX += vx;
      posY += vy;
      opacity -= 0.015;

      el.style.transform = `translate(${posX - x}px, ${posY - y}px) rotate(${posX}deg)`;
      el.style.opacity = opacity;

      if (opacity <= 0) {
        el.remove();
      } else {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }
}