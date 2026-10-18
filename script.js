const $ = (id) => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Sound (Web Audio) + mute ---------- */
let ctx = null, muted = false;
function chime(freq = 660) {
  if (muted) return;
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  o.connect(g).connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.65);
}
$("soundBtn").addEventListener("click", (e) => {
  muted = !muted;
  e.target.textContent = muted ? "Sound: off" : "Sound: on";
  e.target.setAttribute("aria-pressed", String(muted));
  chime(880);
});

/* ---------- Day / night toggle ---------- */
$("moodBtn").addEventListener("click", (e) => {
  const night = document.body.dataset.mood !== "night";
  document.body.dataset.mood = night ? "night" : "day";
  e.target.textContent = night ? "Turn off nightlight" : "Turn on nightlight";
  e.target.setAttribute("aria-pressed", String(night));
  chime(night ? 520 : 780);
});

/* ---------- Eyes follow pointer (mouse and touch) ---------- */
const eyes = [$("eyeL"), $("eyeR")];
function look(x, y) {
  eyes.forEach((eye) => {
    const r = eye.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1, max = r.width * 0.22;
    const k = Math.min(max, d) / d;
    eye.firstElementChild.style.transform =
      `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
  });
}
addEventListener("pointermove", (e) => look(e.clientX, e.clientY));
addEventListener("touchmove", (e) => look(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

/* ---------- Sparkle trail ---------- */
let last = 0;
addEventListener("pointermove", (e) => {
  if (reduce || e.pointerType === "touch" || Date.now() - last < 60) return;
  last = Date.now();
  const s = document.createElement("span");
  s.className = "spark"; s.textContent = "✦";
  s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 800);
});

/* ---------- Click on Pip = giggle chime ---------- */
$("pip").addEventListener("click", () => chime(540 + Math.random() * 400));
