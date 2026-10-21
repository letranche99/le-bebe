// ============================================================
// ENGINE: rendering, input, movement, dialogue, cutscenes, audio.
// Story content lives in world.js. Combat and items live in combat.js.
// ============================================================

const TILE = 16, VW = 320, VH = 180;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const buf = document.createElement('canvas'); buf.width = VW; buf.height = VH;
const g = buf.getContext('2d');
let K = 2; // pixel scale of the screen canvas

function resize() {
  const dpr = window.devicePixelRatio || 1;
  let s = Math.min(innerWidth / VW, innerHeight / VH);
  if (s >= 2) s = Math.floor(s);
  canvas.style.width = VW * s + 'px';
  canvas.style.height = VH * s + 'px';
  K = Math.max(1, Math.round(s * dpr));
  canvas.width = VW * K; canvas.height = VH * K;
}
addEventListener('resize', resize);

// ---------------- Game state ----------------
const G = {
  mode: 'title', t: 0,
  map: null, mapId: null, npcs: [], props: [], decals: [], particles: [], enemies: [], pickups: [],
  player: { x: 0, y: 0, face: 'down', flip: false, moving: false, anim: 0, hidden: false, lift: null },
  flags: {}, inv: [], menu: null, objective: '', banner: null, lastEntry: null,
  cam: { x: 0, y: 0 }, fade: 1, fadeTarget: 0, shake: 0,
  dialog: null, script: null, queued: null, lockInput: false, usingPad: false,
};
const F = G.flags;

// ---------------- Sound effects (synthesized, no files needed) ----------------
const Sound = {
  ac: null, muted: false,
  init() {
    if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
  },
  tone(freq, dur, type = 'square', vol = 0.05, when = 0, slide = 0) {
    if (this.muted || !this.ac) return;
    const t = this.ac.currentTime + when, o = this.ac.createOscillator(), v = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v); v.connect(this.ac.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  blip(p = 520) { this.tone(p + Math.random() * 40, 0.035, 'square', 0.02); },
  select() { this.tone(660, 0.05, 'square', 0.04); this.tone(990, 0.07, 'square', 0.04, 0.05); },
  item() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'square', 0.045, i * 0.1)); },
  splash() { this.tone(400, 0.25, 'sawtooth', 0.05, 0, -300); this.tone(180, 0.3, 'triangle', 0.06, 0.05, -100); },
  scratch() { this.tone(900, 0.28, 'sawtooth', 0.05, 0, -760); },
  rumble() { for (let i = 0; i < 6; i++) this.tone(55 + Math.random() * 20, 0.2, 'sawtooth', 0.06, i * 0.12); },
  door() { this.tone(330, 0.07, 'triangle', 0.06); this.tone(220, 0.1, 'triangle', 0.06, 0.07); },
  laugh() { [880, 760, 900, 780, 920].forEach((f, i) => this.tone(f, 0.08, 'square', 0.035, i * 0.11, -120)); },
  clue() { [392, 523, 659].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.06, i * 0.09)); },
  step() { this.tone(120 + Math.random() * 30, 0.03, 'triangle', 0.025); },
  swish() { this.tone(700, 0.09, 'triangle', 0.05, 0, -450); },
  hit() { this.tone(220, 0.08, 'square', 0.06, 0, -120); this.tone(110, 0.1, 'triangle', 0.08); },
  hurt() { this.tone(300, 0.18, 'square', 0.06, 0, -200); this.tone(150, 0.2, 'sawtooth', 0.04, 0.05, -60); },
  block() { this.tone(500, 0.05, 'square', 0.05); this.tone(250, 0.12, 'triangle', 0.07, 0.03); },
  pop() { this.tone(600, 0.06, 'square', 0.05, 0, 400); this.tone(900, 0.1, 'triangle', 0.05, 0.06, -500); },
  pickup() { this.tone(784, 0.06, 'square', 0.04); this.tone(1175, 0.1, 'square', 0.04, 0.06); },
  heal() { [523, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.07, i * 0.07)); },
  squawk() { this.tone(1100, 0.12, 'sawtooth', 0.03, 0, -500); this.tone(1000, 0.14, 'sawtooth', 0.03, 0.13, -600); },
};

// ---------------- Input ----------------
// Buttons: act (A), b (B, swing), x (X, shield), menu (items sidebar)
const keys = {}, hit = {};
const KEYMAP = {
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ' ': 'act', Enter: 'act', e: 'act', E: 'act',
  j: 'b', J: 'b', z: 'b', Z: 'b',
  k: 'x', K: 'x', x: 'x', X: 'x',
  Tab: 'menu', i: 'menu', I: 'menu',
  m: 'mute', M: 'mute',
};
function press(k) { if (!keys[k]) hit[k] = true; keys[k] = true; Sound.init(); }
function release(k) { keys[k] = false; }
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (!k) return; e.preventDefault(); G.usingPad = false; if (!e.repeat) press(k); });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) release(k); });
addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));
canvas.addEventListener('pointerdown', () => { if (G.mode !== 'play' || G.dialog) { press('act'); setTimeout(() => release('act'), 50); } });
function consume(k) { if (hit[k]) { hit[k] = false; return true; } return false; }

// Gamepads (Xbox layout: A = talk, B = swing, X = shield, Start/Y = items)
const PADMAP = { 0: 'act', 1: 'b', 2: 'x', 3: 'menu', 8: 'menu', 9: 'menu', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
let padPrev = {};
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = [...pads].find(p => p && p.connected); if (!gp) return;
  const now = {};
  for (const [i, k] of Object.entries(PADMAP)) if (gp.buttons[i] && gp.buttons[i].pressed) now[k] = true;
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if (ax < -0.5) now.left = true; if (ax > 0.5) now.right = true; if (ay < -0.5) now.up = true; if (ay > 0.5) now.down = true;
  for (const k of ['act', 'b', 'x', 'menu', 'up', 'down', 'left', 'right']) {
    if (now[k] && !padPrev[k]) { press(k); G.usingPad = true; }
    if (!now[k] && padPrev[k]) release(k);
  }
  padPrev = now;
}

const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
function setupTouch() {
  if (!IS_TOUCH) return;
  const pad = document.getElementById('touch');
  pad.style.display = 'block';
  pad.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); press(k); el.classList.add('on'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, () => { release(k); el.classList.remove('on'); }));
  });
}
// The name of a button, as the player should see it on their device
function btn(k) {
  if (G.usingPad || IS_TOUCH) return { act: 'A', b: 'B', x: 'X', menu: IS_TOUCH ? 'MENU' : 'START' }[k];
  return { act: 'SPACE', b: 'J (or Z)', x: 'K (or X)', menu: 'TAB (or I)' }[k];
}

// ---------------- Maps ----------------
let mapLayer = null;
function tileAt(tx, ty) {
  if (!G.map || tx < 0 || ty < 0 || tx >= G.map.w || ty >= G.map.h) return null;
  return G.map.grid[ty][tx];
}
function setTile(tx, ty, ch) { G.map.grid[ty][tx] = ch; bakeMap(); }
function bakeMap() {
  const m = G.map;
  mapLayer = document.createElement('canvas'); mapLayer.width = m.w * TILE; mapLayer.height = m.h * TILE;
  const mg = mapLayer.getContext('2d');
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const T = TILES[m.grid[y][x]];
    if (T && !T.anim) T.paint(mg, x * TILE, y * TILE, x, y, 0);
  }
}
function loadMap(id, tx, ty, face) {
  const def = WORLD.maps[id];
  G.mapId = id;
  G.map = { def, grid: MAP_TILES[id].map(r => [...r]), w: MAP_TILES[id][0].length, h: MAP_TILES[id].length };
  if (def.patch) def.patch((x, y, c) => { G.map.grid[y][x] = c; });
  G.npcs = def.npcs ? def.npcs() : [];
  G.props = def.props ? def.props() : [];
  G.enemies = def.enemies ? def.enemies().map(e => spawnEnemy(e[0], e[1], e[2])) : [];
  G.pickups = def.pickups ? def.pickups().filter(pk => !pk.flag || !F[pk.flag]).map(pk => ({ ...pk, x: pk.x * TILE, y: pk.y * TILE })) : [];
  G.particles = [];
  const p = G.player;
  p.x = tx * TILE; p.y = ty * TILE; if (face) setFace(p, face);
  p.moving = false; p.atk = null; p.knock = null;
  G.lastEntry = { id, tx, ty, face: face || p.face };
  bakeMap();
  snapCamera();
  if (def.music) Music.play(def.music);
  if (def.title) G.banner = { text: def.title, t: 2.6 };
  if (def.onEnter) def.onEnter();
}

// ---------------- Collision ----------------
function solidAt(px, py) {
  const ch = tileAt(Math.floor(px / TILE), Math.floor(py / TILE));
  if (ch === null) return true;
  const T = TILES[ch];
  return !T || !!T.solid;
}
function boxHitsTiles(l, t, r, b) { return solidAt(l, t) || solidAt(r, t) || solidAt(l, b) || solidAt(r, b); }
function blocked(x, y) {
  const l = x + 3, r = x + 12, t = y + 10, b = y + 15;
  if (boxHitsTiles(l, t, r, b)) return true;
  for (const n of G.npcs) {
    if (n.hidden || n.ghost) continue;
    if (l < n.x + 14 && r > n.x + 2 && t < n.y + 16 && b > n.y + 9) return true;
  }
  return false;
}
function setFace(ent, f) { ent.face = f; if (f === 'left') ent.flip = true; if (f === 'right') ent.flip = false; }

// ---------------- Player ----------------
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let stepT = 0;
function updatePlayer(dt) {
  const p = G.player;
  const free = !(G.script || G.dialog || G.lockInput || G.menu);
  const mod = updatePlayerCombat(dt, free); // null while swinging or knocked back
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (!free || !mod) { dx = 0; dy = 0; }
  p.moving = !!(dx || dy);
  if (!p.moving) return;
  if (!mod.lockFace) { if (dx) setFace(p, dx > 0 ? 'right' : 'left'); else setFace(p, dy > 0 ? 'down' : 'up'); }
  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
  const sp = 72 * mod.speed * dt;
  const nx = p.x + dx * sp; if (!blocked(nx, p.y)) p.x = nx;
  const ny = p.y + dy * sp; if (!blocked(p.x, ny)) p.y = ny;
  p.anim += dt * 9 * mod.speed;
  stepT -= dt; if (stepT <= 0) { Sound.step(); stepT = 0.22 / mod.speed; }
  checkWarps();
}
function checkWarps() {
  const p = G.player, cx = p.x + 8, cy = p.y + 13;
  const tx = Math.floor(cx / TILE), ty = Math.floor(cy / TILE);
  for (const w of G.map.def.warps || []) {
    const inside = tx >= w.x && tx < w.x + (w.w || 1) && ty >= w.y && ty < w.y + (w.h || 1);
    if (!inside) continue;
    if (w.when && !w.when()) { if (w.deny) run(w.deny); return; }
    if (w.go) { run(w.go); return; }
    run(function* () { Sound.door(); yield* travel(w.to, w.tx + (w.keepX ? tx - w.x : 0), w.ty + (w.keepY ? ty - w.y : 0), w.face); });
    return;
  }
}
function tryInteract() {
  if (tryPickup()) return;
  const p = G.player, d = DIRV[p.face];
  for (let reach = 1; reach <= 2; reach++) {
    const fx = p.x + 8 + d[0] * 13 * reach, fy = p.y + 12 + d[1] * 13 * reach;
    for (const n of G.npcs) {
      if (n.hidden || !n.talk) continue;
      if (fx >= n.x && fx < n.x + 16 && fy >= n.y - 2 && fy < n.y + 16) {
        if (n.turn !== false) setFace(n, fx > p.x + 8 ? 'left' : 'right');
        run(n.talk); return;
      }
    }
    const tx = Math.floor(fx / TILE), ty = Math.floor(fy / TILE);
    const obj = (G.map.def.objects || []).find(o => tx >= o.x && tx < o.x + (o.w || 1) && ty >= o.y && ty < o.y + (o.h || 1));
    if (obj) { run(obj.act); return; }
    const T = TILES[tileAt(tx, ty)];
    if (!(T && T.counter)) return; // only reach across counters
  }
}

// ---------------- Cutscene scripting ----------------
// Scripts are generator functions. Each `yield` hands the engine an action,
// and the script continues once that action reports it is done.
function run(genFn) {
  if (G.script) { G.queued = genFn; return; }
  G.script = { it: genFn(), cur: null };
  stepScript(0);
}
function stepScript(dt) {
  const s = G.script;
  while (s && G.script === s) {
    if (s.cur) { if (!s.cur.update(dt)) return; dt = 0; }
    const res = s.cur ? s.cur.result : undefined;
    const r = s.it.next(res);
    if (r.done) { if (G.script === s) G.script = null; return; }
    s.cur = r.value || { update: () => true };
    if (s.cur.start) s.cur.start();
  }
}
const say = (who, text, color) => ({ start() { openDialog(who, text, null, color); }, update() { return !G.dialog; } });
const ask = (who, text, choices, color) => ({ result: 0, start() { openDialog(who, text, choices, color, this); }, update() { return !G.dialog; } });
const wait = s => ({ t: s, update(dt) { this.t -= dt; return this.t <= 0; } });
const call = fn => ({ start: fn, update: () => true });
const fadeTo = v => ({ start() { G.fadeTarget = v; }, update() { return Math.abs(G.fade - v) < 0.01; } });
const shake = (t, m = 2) => call(() => { G.shake = t; G.shakeMag = m; });
function walk(ent, path, speed = 55) {
  return {
    i: 0,
    start() { ent.moving = true; },
    update(dt) {
      if (this.i >= path.length) { ent.moving = false; return true; }
      const [tx, ty] = path[this.i], gx = tx * TILE, gy = ty * TILE;
      const dx = gx - ent.x, dy = gy - ent.y, dist = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.5) setFace(ent, dx > 0 ? 'right' : 'left'); else if (Math.abs(dy) > 0.5) setFace(ent, dy > 0 ? 'down' : 'up');
      const step = speed * dt;
      if (dist <= step) { ent.x = gx; ent.y = gy; this.i++; } else { ent.x += dx / dist * step; ent.y += dy / dist * step; }
      ent.anim = (ent.anim || 0) + dt * 9;
      return false;
    },
  };
}
function* travel(id, tx, ty, face) {
  G.lockInput = true;
  yield fadeTo(1);
  loadMap(id, tx, ty, face);
  yield wait(0.1);
  yield fadeTo(0);
  G.lockInput = false;
}
function setObjective(text) { G.objective = text; G.objFlash = 1.5; }
function npc(id) { return G.npcs.find(n => n.id === id); }

// ---------------- Dialogue ----------------
const DLG = { x: 6, y: 124, w: 308, h: 52, cols: 35, lines: 3 };
function wrap(text, cols) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if ((line + (line ? ' ' : '') + word).length > cols) { out.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    out.push(line);
  }
  return out;
}
function openDialog(who, text, choices, color, action) {
  const lines = wrap(text, DLG.cols), pages = [];
  for (let i = 0; i < lines.length; i += DLG.lines) pages.push(lines.slice(i, i + DLG.lines));
  G.dialog = { who, pages, page: 0, shown: 0, choices, sel: 0, color: color || '#8a3a1a', action, blipT: 0 };
}
function updateDialog(dt) {
  const d = G.dialog; if (!d) return;
  const full = d.pages[d.page].join('').length;
  if (d.shown < full) {
    d.shown = Math.min(full, d.shown + dt * 48);
    d.blipT -= dt; if (d.blipT <= 0) { Sound.blip(d.who ? 480 : 380); d.blipT = 0.06; }
    if (consume('act')) d.shown = full;
    return;
  }
  const last = d.page === d.pages.length - 1;
  if (last && d.choices) {
    if (consume('up')) { d.sel = (d.sel + d.choices.length - 1) % d.choices.length; Sound.blip(700); }
    if (consume('down')) { d.sel = (d.sel + 1) % d.choices.length; Sound.blip(700); }
    if (consume('act')) { Sound.select(); if (d.action) d.action.result = d.sel; G.dialog = null; }
    return;
  }
  if (consume('act')) { Sound.blip(620); if (last) G.dialog = null; else { d.page++; d.shown = 0; } }
}

// ---------------- Particles and decals ----------------
function burst(x, y, color, n = 10, spread = 60, grav = 160) {
  for (let i = 0; i < n; i++) G.particles.push({ x, y, vx: (Math.random() - 0.5) * spread * 2, vy: -Math.random() * spread, grav, life: 0.5 + Math.random() * 0.5, color, size: 1 + (Math.random() < 0.3) });
}
function floatText(text, x, y, color = '#ffffff') { G.particles.push({ text, x, y, vx: (Math.random() - 0.5) * 20, vy: -28, grav: 0, life: 1.1, color }); }
function sparkle(x, y) { for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; G.particles.push({ x, y, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, grav: 0, life: 0.7, color: i % 2 ? '#ffe066' : '#ffffff', size: 1 }); } }
function updateParticles(dt) {
  for (const p of G.particles) { p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  G.particles = G.particles.filter(p => p.life > 0);
}

// ---------------- Camera ----------------
function camTarget() {
  const p = G.player, mw = G.map.w * TILE, mh = G.map.h * TILE;
  let x = p.x + 8 - VW / 2, y = p.y + 8 - VH / 2;
  x = mw <= VW ? (mw - VW) / 2 : Math.max(0, Math.min(mw - VW, x));
  y = mh <= VH ? (mh - VH) / 2 : Math.max(0, Math.min(mh - VH, y));
  return [x, y];
}
function snapCamera() { const [x, y] = camTarget(); G.cam.x = x; G.cam.y = y; }
function updateCamera(dt) { const [x, y] = camTarget(); G.cam.x += (x - G.cam.x) * Math.min(1, dt * 8); G.cam.y += (y - G.cam.y) * Math.min(1, dt * 8); }

// ---------------- Drawing ----------------
function drawSprite(name, frame, x, y, flip, white) {
  const s = SPR[name]; if (!s) return;
  const set = white ? s.white : (flip ? s.flipped : s.frames);
  g.drawImage(set[frame % set.length], Math.round(x + (s.ox || 0)), Math.round(y + (s.oy || 0)));
}
function drawEntity(e, cx, cy) {
  if (e.hidden) return;
  const fr = e.moving ? Math.floor(e.anim || 0) % 2 : (e.idleAnim ? Math.floor(G.t * 2) % 2 : 0);
  const bob = e.laughing ? -Math.abs(Math.sin(G.t * 14)) * 3 : 0;
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(Math.round(e.x - cx + 3), Math.round(e.y - cy + 14), 10, 2);
  drawSprite(e.sprite, fr, e.x - cx, e.y - cy + bob, e.flip);
  if (e.lift) drawSprite(e.lift, 0, e.x - cx, e.y - cy - 15, false);
  if (e.holding) drawSprite(e.holding, 0, e.x - cx + (e.flip ? -2 : 10), e.y - cy + 4, false);
}
function drawWorld() {
  const sx = G.shake > 0 ? (Math.random() - 0.5) * 2 * (G.shakeMag || 2) : 0;
  const sy = G.shake > 0 ? (Math.random() - 0.5) * 2 * (G.shakeMag || 2) : 0;
  const cx = Math.round(G.cam.x + sx), cy = Math.round(G.cam.y + sy);
  g.fillStyle = G.map.def.bg || '#14101c'; g.fillRect(0, 0, VW, VH);
  g.drawImage(mapLayer, -cx, -cy);
  const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
  for (let y = y0; y <= Math.min(G.map.h - 1, y0 + 12); y++) for (let x = x0; x <= Math.min(G.map.w - 1, x0 + 21); x++) {
    const T = TILES[G.map.grid[y][x]];
    if (T && T.anim) T.paint(g, x * TILE - cx, y * TILE - cy, x, y, G.t);
  }
  for (const d of G.decals) if (d.map === G.mapId) d.draw(g, d.x - cx, d.y - cy);
  for (const pr of G.props) if (!pr.hidden) pr.draw(g, pr.x - cx, pr.y - cy);
  // Everything that stands on the ground, sorted so lower things draw in front
  const list = [
    ...G.pickups.map(pk => ({ y: pk.y - 4, draw: () => drawPickup(pk, cx, cy) })),
    ...G.npcs.map(n => ({ y: n.y, draw: () => drawEntity(n, cx, cy) })),
    ...G.enemies.map(e => ({ y: e.y, draw: () => drawEnemy(e, cx, cy) })),
    { y: G.player.y, draw: () => drawPlayer(cx, cy) },
  ].sort((a, b) => a.y - b.y);
  for (const it of list) it.draw();
  for (const p of G.particles) if (!p.text) { g.fillStyle = p.color; g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size, p.size); }
  if (G.map.def.overlay) G.map.def.overlay(g, cx, cy);
  return [cx, cy];
}

// UI is drawn at full screen resolution so text stays crisp.
const FONT = '"Press Start 2P", monospace';
function uiBox(x, y, w, h) {
  const r = (a, b, c, d, col) => { ctx.fillStyle = col; ctx.fillRect(a * K, b * K, c * K, d * K); };
  r(x, y, w, h, '#3a2414'); r(x + 1, y + 1, w - 2, h - 2, '#c07a3a'); r(x + 2, y + 2, w - 4, h - 4, '#3a2414'); r(x + 3, y + 3, w - 6, h - 6, '#f6e3b4');
}
function uiText(s, x, y, color = '#3a2414', size = 8, align = 'left') {
  ctx.font = `${size * K}px ${FONT}`; ctx.fillStyle = color; ctx.textBaseline = 'top'; ctx.textAlign = align;
  ctx.fillText(s, x * K, y * K);
}
function uiShadowText(s, x, y, color, size = 8, align = 'left') { uiText(s, x + 1, y + 1, '#1a1018', size, align); uiText(s, x, y, color, size, align); }
function uiSprite(name, x, y, w, h, frame = 0) { const s = SPR[name]; if (s) ctx.drawImage(s.frames[frame], x * K, y * K, (w || s.w) * K, (h || s.h) * K); }
function drawUI(cx, cy) {
  for (const p of G.particles) if (p.text) uiShadowText(p.text, p.x - cx, p.y - cy, p.color, 8, 'center');
  drawPickupPrompts(cx, cy);
  if (G.objective && G.mode === 'play') {
    const w = Math.min(F.armed ? VW - 54 : VW - 8, G.objective.length * 8 + 22);
    const flash = G.objFlash > 0 && Math.floor(G.t * 8) % 2;
    uiBox(4, 4, w, 18);
    uiText('*', 9, 9, flash ? '#d84a3a' : '#c07a3a');
    uiText(G.objective, 18, 9, '#3a2414');
  }
  drawHearts();
  if (G.banner) {
    const a = Math.min(1, G.banner.t, 2.6 - G.banner.t + 0.3);
    ctx.globalAlpha = Math.max(0, a);
    uiShadowText(G.banner.text, VW / 2, G.objective ? 30 : 12, '#fff6dc', 8, 'center');
    ctx.globalAlpha = 1;
  }
  drawMenu();
  const d = G.dialog;
  if (d) {
    uiBox(DLG.x, DLG.y, DLG.w, DLG.h);
    if (d.who) {
      const nw = d.who.length * 8 + 14;
      uiBox(DLG.x + 6, DLG.y - 14, nw, 16);
      uiText(d.who, DLG.x + 13, DLG.y - 9, d.color);
    }
    let left = Math.floor(d.shown);
    d.pages[d.page].forEach((line, i) => {
      const part = line.slice(0, Math.max(0, left)); left -= line.length;
      uiText(part, DLG.x + 9, DLG.y + 9 + i * 12, d.who ? '#3a2414' : '#5a4a6a');
    });
    const done = d.shown >= d.pages[d.page].join('').length;
    const last = d.page === d.pages.length - 1;
    if (done && last && d.choices) {
      const w = Math.max(...d.choices.map(c => c.length)) * 8 + 26, h = d.choices.length * 13 + 10;
      const bx = VW - w - 6, by = DLG.y - h - 2;
      uiBox(bx, by, w, h);
      d.choices.forEach((c, i) => uiText((i === d.sel ? '> ' : '  ') + c, bx + 7, by + 7 + i * 13, i === d.sel ? '#a82626' : '#3a2414'));
    } else if (done && Math.floor(G.t * 3) % 2) {
      uiText(last ? '#' : 'v', DLG.x + DLG.w - 14, DLG.y + DLG.h - 13, '#c07a3a');
    }
  }
  if (Sound.muted) uiShadowText('muted (M)', VW - 6, VH - 12, '#fff6dc', 8, 'right');
}

// ---------------- Main loop ----------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  G.t += dt;
  pollPad();
  if (consume('mute')) Sound.muted = !Sound.muted;
  G.fade += (G.fadeTarget - G.fade) * Math.min(1, dt * 7); if (Math.abs(G.fade - G.fadeTarget) < 0.01) G.fade = G.fadeTarget;
  if (G.shake > 0) G.shake -= dt;
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  if (G.objFlash > 0) G.objFlash -= dt;

  ctx.imageSmoothingEnabled = false;
  if (G.mode === 'title') {
    Music.play(SCREEN_MUSIC.title);
    WORLD.drawTitle(g, G.t); ctx.drawImage(buf, 0, 0, VW * K, VH * K); WORLD.drawTitleUI();
    if (consume('act')) WORLD.start();
  } else if (G.mode === 'end') {
    Music.play(SCREEN_MUSIC.end);
    WORLD.drawEnd(g, G.t); ctx.drawImage(buf, 0, 0, VW * K, VH * K); WORLD.drawEndUI();
    if (consume('act')) WORLD.afterEnd();
  } else {
    if (!G.script && G.queued) { const q = G.queued; G.queued = null; run(q); }
    if (G.dialog) updateDialog(dt);
    else if (G.script) stepScript(dt);
    else if (G.menu) updateMenu();
    else if (!G.lockInput) { if (consume('menu')) openMenu(); else if (consume('act')) tryInteract(); }
    updatePlayer(dt);
    const paused = G.menu || G.dialog || G.script;
    for (const n of G.npcs) if (n.update) n.update(dt);
    if (!paused) updateCombat(dt);
    updateParticles(dt);
    updateCamera(dt);
    const [cx, cy] = drawWorld();
    ctx.drawImage(buf, 0, 0, VW * K, VH * K);
    drawUI(cx, cy);
  }
  Music.update();
  if (G.fade > 0) { ctx.fillStyle = `rgba(20,16,28,${G.fade})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  for (const k in hit) hit[k] = false;
  requestAnimationFrame(frame);
}

async function boot() {
  resize(); buildSprites(); setupTouch();
  try { await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
  G.fade = 0; G.fadeTarget = 0;
  requestAnimationFrame(frame);
}
addEventListener('DOMContentLoaded', boot);
