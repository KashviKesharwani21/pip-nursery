const $ = (id) => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Sound (Web Audio) + mute ---------- */
let ctx = null, muted = false;
function tone(freq, delay = 0, dur = 1.2, vol = 0.18) {
  if (muted) return;
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  const t = ctx.currentTime + delay, g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(ctx.destination);
  [["sine", 1, 1], ["triangle", 2, 0.25]].forEach(([type, mult, amp]) => {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = type; o.frequency.value = freq * mult; og.gain.value = amp;
    o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05);
  });
}
const chime = (f) => tone(f, 0, 0.6, 0.2);
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

/* ---------- Eyes follow pointer ---------- */
const eyes = [$("eyeL"), $("eyeR")];
function look(x, y) {
  eyes.forEach((eye) => {
    const r = eye.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1, k = Math.min(r.width * 0.22, d) / d;
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

/* ---------- Lullaby Lab (music box) ---------- */
const NOTES = [523.25, 587.33, 659.25, 783.99, 880]; // C D E G A
const MELODY = [0, 1, 2, 1, 0, 3, 2, 1, 0, 2, 4, 3, 2, 1, 0];
const keys = [];
NOTES.forEach((f, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "key"; b.textContent = "✦";
  b.setAttribute("aria-label", "Music box note " + (i + 1));
  b.addEventListener("click", () => { tone(f); flash(i); });
  $("keys").appendChild(b); keys.push(b);
});
function flash(i) {
  keys[i].classList.add("lit");
  setTimeout(() => keys[i].classList.remove("lit"), 300);
}
let playing = false;
function playLullaby(step = 450) {
  if (playing) return;
  playing = true;
  MELODY.forEach((n, i) => setTimeout(() => { tone(NOTES[n], 0, 1.4); flash(n); }, i * step));
  setTimeout(() => (playing = false), MELODY.length * step + 300);
}
$("playBtn").addEventListener("click", () => playLullaby());

/* ---------- Nightlight lamps ---------- */
document.querySelectorAll(".lamp").forEach((l, i) =>
  l.addEventListener("click", () => {
    const on = l.getAttribute("aria-pressed") !== "true";
    l.setAttribute("aria-pressed", String(on));
    if (on) tone(NOTES[i + 1], 0, 0.8);
  })
);

/* ---------- Story scenes reveal on scroll ---------- */
const io = new IntersectionObserver(
  (items) => items.forEach((it) => it.isIntersecting && it.target.classList.add("in")),
  { threshold: 0.3 }
);
document.querySelectorAll(".scene").forEach((s) => io.observe(s));

/* ---------- Hidden Easter egg: tap the pom-pom 3 times ---------- */
let taps = 0, tapTimer;
$("pom").addEventListener("click", (e) => {
  e.stopPropagation();
  const pip = $("pip");
  if (pip.classList.contains("asleep")) {
    pip.classList.remove("asleep"); taps = 0; chime(900); return;
  }
  taps++; chime(500 + taps * 120);
  clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 2000);
  if (taps >= 3) {
    taps = 0; pip.classList.add("asleep");
    playLullaby(650);
    if (!reduce) starBurst(e.clientX, e.clientY);
  }
});
function starBurst(x, y) {
  for (let i = 0; i < 24; i++) {
    const s = document.createElement("span");
    s.className = "star"; s.textContent = i % 2 ? "✦" : "★";
    const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 140;
    s.style.left = x + "px"; s.style.top = y + "px";
    s.style.setProperty("--dx", Math.cos(a) * d + "px");
    s.style.setProperty("--dy", Math.sin(a) * d + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

/* ---------- Click on Pip = giggle chime ---------- */
$("pip").addEventListener("click", () => chime(540 + Math.random() * 400));

/* ---------- Dreams delivered odometer (remembers visits in this browser) ---------- */
(function () {
  const BASE = 1204;
  let visits = 0;
  try {
    visits = (parseInt(localStorage.getItem("pipVisits"), 10) || 0) + 1;
    localStorage.setItem("pipVisits", String(visits));
  } catch (e) {}
  const target = BASE + visits, odo = $("odo");
  function draw(n) {
    odo.innerHTML = String(n).padStart(6, "0").split("").map((d) => `<b>${d}</b>`).join("");
  }
  if (reduce) return draw(target);
  let n = target - 25;
  draw(n);
  const t = setInterval(() => { draw(++n); if (n >= target) clearInterval(t); }, 40);
})();