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

/* ---------- Toast helper ---------- */
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

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
const MELODY = [0, 1, 2, 1, 0, 3, 2, 1, 0, 2, 4, 3, 2, 1, 0]; // YOUR LULLABY: edit these numbers (0-4)!
const RAIN = [4, 3, 2, 3, 4, 3, 1, 2, 0, 1, 2, 1, 0];          // second tune: edit me too
const keys = [];
NOTES.forEach((f, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "key"; b.textContent = "✦";
  b.setAttribute("aria-label", "Music box note " + (i + 1));
  b.addEventListener("click", () => { tone(f); flash(i); });
  $("keys").appendChild(b); keys.push(b);
});
const box = $("mbox"), wrap = $("mboxWrap");
function floatNote() {
  if (reduce || !wrap) return;
  const n = document.createElement("span");
  n.className = "fnote";
  n.textContent = ["♪", "♫", "✦"][Math.floor(Math.random() * 3)];
  n.style.left = 20 + Math.random() * 60 + "%";
  wrap.appendChild(n);
  setTimeout(() => n.remove(), 1500);
}
function flash(i) {
  keys[i].classList.add("lit");
  setTimeout(() => keys[i].classList.remove("lit"), 300);
  floatNote();
  if (box && !reduce) { box.classList.remove("bump"); void box.offsetWidth; box.classList.add("bump"); }
}
let playing = false, timers = [];
function stopLullaby() {
  timers.forEach(clearTimeout); timers = []; playing = false;
}
function playLullaby(step = 450, mel = MELODY) {
  if (playing) return;
  if (muted) toast("Sound is off. Tap the Sound button to hear the music box.");
  playing = true;
  timers = mel.map((n, i) => setTimeout(() => { tone(NOTES[n], 0, 1.4); flash(n); }, i * step));
  timers.push(setTimeout(() => (playing = false), mel.length * step + 300));
}
$("playBtn").addEventListener("click", () => playLullaby());
$("playBtn2").addEventListener("click", () => playLullaby(380, RAIN));
$("stopBtn").addEventListener("click", stopLullaby);

/* ---------- Nightlight lamps ---------- */
document.querySelectorAll(".lamp").forEach((l, i) =>
  l.addEventListener("click", () => {
    const on = l.getAttribute("aria-pressed") !== "true";
    l.setAttribute("aria-pressed", String(on));
    if (on) tone(NOTES[i + 1], 0, 0.8);
    const lantern = $("lantern");
    if (lantern) lantern.classList.toggle("lit", [...document.querySelectorAll(".lamp")].some((x) => x.getAttribute("aria-pressed") === "true"));
  })
);

/* ---------- Story scenes reveal on scroll ---------- */
const io = new IntersectionObserver(
  (items) => items.forEach((it) => it.isIntersecting && it.target.classList.add("in")),
  { threshold: 0.3 }
);
document.querySelectorAll(".scene").forEach((s) => io.observe(s));

/* ---------- Wobbles the nervous ghost ---------- */
const WOB = ["Is it dark yet?", "I heard something. It was me.", "Can we leave one lamp on? Or all of them?", "Boo! Oh no, I scared myself.", "Pip made me a lullaby. I cried a little.", "I’m not scared. I’m just very alert.", "Ghosts don’t get nightmares. We get… concerns."];
let wi = 0;
$("wobbles").addEventListener("click", (e) => {
  wi = (wi + 1) % WOB.length;
  $("wobLine").textContent = WOB[wi];
  const b = e.currentTarget;
  b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
  tone(NOTES[wi % 5], 0, 0.7);
});

/* ---------- Hidden Easter egg #1: tap the pom-pom 3 times ---------- */
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

/* ---------- Hidden Easter egg #2: tap the moon ---------- */
$("moonBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  [4, 3, 2, 1, 0].forEach((n, i) => tone(NOTES[n], i * 0.18, 1));
  toast("Shh… you’ll wake the moon.");
  if (reduce) return;
  const s = document.createElement("span");
  s.className = "shoot"; s.textContent = "★";
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1300);
});

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

/* ---------- Dream Delivery Route (scroll-driven + "Fly" button) ---------- */
(function () {
  const base = $("routeBase");
  if (!base) return;
  const done = $("routeDone"), cloud = $("cloud"), section = $("route");
  const NS = "http://www.w3.org/2000/svg";
  const STOPS = [
    { at: 0.04, name: "Nursery Row", dream: "floating in a bath of warm milk" },
    { at: 0.34, name: "Wobbles’ Attic", dream: "a world where every lamp stays on" },
    { at: 0.66, name: "Moonlight Bakery", dream: "very quiet cupcakes" },
    { at: 0.97, name: "Sleepy Lighthouse", dream: "a boat that hums along" },
  ];
  const len = base.getTotalLength();
  done.style.strokeDasharray = len;
  STOPS.forEach((s) => {
    const p = base.getPointAtLength(len * s.at);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 13);
    c.setAttribute("class", "r-stop");
    $("stopDots").appendChild(c); s.dot = c;
    const li = document.createElement("li");
    li.textContent = s.name; $("stopList").appendChild(li); s.li = li;
  });
  let current = -1, flying = false;
  function setProgress(p, sound) {
    const pt = base.getPointAtLength(len * p);
    cloud.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    done.style.strokeDashoffset = len * (1 - p);
    let idx = -1;
    STOPS.forEach((s, i) => {
      const on = p >= s.at - 0.01;
      s.dot.classList.toggle("on", on); s.li.classList.toggle("done", on);
      if (on) idx = i;
    });
    if (idx !== current) {
      current = idx;
      $("routeCaption").textContent = idx < 0
        ? "Waiting at the nursery door…"
        : `Delivered to ${STOPS[idx].name}: a dream about ${STOPS[idx].dream}.`;
      if (sound && idx >= 0) chime(500 + idx * 110);
    }
  }
  function fromScroll() {
    if (flying) return;
    const r = section.getBoundingClientRect();
    setProgress(Math.max(0, Math.min(1, (innerHeight * 0.9 - r.top) / (r.height * 0.9))), false);
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { fromScroll(); ticking = false; });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  fromScroll();

  $("flyBtn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (flying) return;
    if (reduce) { setProgress(1, false); return; }
    flying = true; btn.disabled = true; btn.textContent = "Flying…";
    if (muted) toast("Sound is off. The route will fly silently.");
    setProgress(0, false);
    const t0 = performance.now(), D = 7000;
    (function step(now) {
      const p = Math.min(1, (now - t0) / D);
      setProgress(p, true);
      if (p < 1) return requestAnimationFrame(step);
      flying = false; btn.disabled = false; btn.textContent = "Fly the route again";
    })(t0);
  });
})();