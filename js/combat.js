// ============================================================
// COMBAT + ITEMS: Zelda-style swinging and blocking, hearts,
// enemies, pickups, and the items sidebar.
//   B = swing the baguette   X = hold up the croissant shield
//   A = pick things up / use the selected item in the sidebar
// ============================================================

Object.assign(G.player, { hp: 6, maxHp: 6, inv: 0, atk: null, atkCool: 0, shielding: false, knock: null });

// ---------------- Items ----------------
// gear: always shown when owned. use(): what A does in the sidebar (optional).
const ITEMS = {
  baguette: { name: 'Baguette', icon: 'baguette', gear: true, owned: () => F.gotSword,
    desc: () => `La Baguette de l'Aube. Swing it with ${btn('b')}.` },
  croissant: { name: 'Croissant', icon: 'croissant', gear: true, owned: () => F.gotShield,
    desc: () => `Le Croissant Eternel. Hold ${btn('x')} to block.` },
  macaron: { name: 'Macaron', icon: 'macaron',
    desc: () => 'Restores one heart. Raspberry, obviously.',
    use: function* () {
      const p = G.player;
      if (p.hp >= p.maxHp) { yield say(null, 'Le Bébé is at full health. The macaron can wait.'); return; }
      removeItem('macaron'); p.hp = Math.min(p.maxHp, p.hp + 2);
      Sound.heal(); sparkle(p.x + 8, p.y + 6);
      yield say(null, 'Le Bébé eats the macaron with great dignity. One heart restored.');
    } },
  shell: { name: 'Shells', icon: 'shellItem',
    desc: () => 'Pretty shells. Someone, somewhere, will want these.' },
};
function itemCount(id) { const it = G.inv.find(i => i.id === id); return it ? it.count : 0; }
function addItem(id, n = 1) { const it = G.inv.find(i => i.id === id); if (it) it.count += n; else G.inv.push({ id, count: n }); }
function removeItem(id, n = 1) { const it = G.inv.find(i => i.id === id); if (!it) return; it.count -= n; if (it.count <= 0) G.inv.splice(G.inv.indexOf(it), 1); }

// ---------------- Player combat ----------------
function updatePlayerCombat(dt, free) {
  const p = G.player;
  if (p.inv > 0) p.inv -= dt;
  if (p.atkCool > 0) p.atkCool -= dt;
  if (p.knock) {
    p.knock.t -= dt;
    const nx = p.x + p.knock.vx * dt, ny = p.y + p.knock.vy * dt;
    if (!blocked(nx, p.y)) p.x = nx;
    if (!blocked(p.x, ny)) p.y = ny;
    if (p.knock.t <= 0) p.knock = null;
    p.shielding = false;
    return null;
  }
  p.shielding = free && F.armed && !!keys.x && !p.atk;
  if (free && F.armed && !p.shielding && !p.atk && p.atkCool <= 0 && consume('b')) {
    p.atk = { t: 0, dur: 0.26, dir: p.face, hit: new Set() };
    Sound.swish();
  }
  if (p.atk) {
    p.atk.t += dt;
    if (p.atk.t > 0.03 && p.atk.t < 0.2) swingHits();
    if (p.atk.t >= p.atk.dur) { p.atk = null; p.atkCool = 0.12; }
    return null;
  }
  return { speed: p.shielding ? 0.5 : 1, lockFace: p.shielding };
}
function swingHits() {
  const p = G.player, a = p.atk, v = DIRV[a.dir];
  const cx = p.x + 8 + v[0] * 14, cy = p.y + 10 + v[1] * 13;
  for (const e of G.enemies) {
    if (e.dead || a.hit.has(e)) continue;
    if (cx + 11 > e.x + 1 && cx - 11 < e.x + 15 && cy + 11 > e.y + 1 && cy - 11 < e.y + 15) { a.hit.add(e); damageEnemy(e, 1, v); }
  }
}
function hurtPlayer(amount, fromX, fromY) {
  const p = G.player;
  if (p.inv > 0 || G.script || p.hp <= 0) return false;
  const dx = fromX - (p.x + 8), dy = fromY - (p.y + 10), d = Math.hypot(dx, dy) || 1, f = DIRV[p.face];
  if (p.shielding && (dx / d * f[0] + dy / d * f[1]) > 0.35) {
    Sound.block(); burst(p.x + 8 + f[0] * 10, p.y + 8 + f[1] * 10, '#f0c070', 6, 40);
    p.knock = { vx: -dx / d * 70, vy: -dy / d * 70, t: 0.1 };
    return 'blocked';
  }
  p.hp -= amount; p.inv = 1.0;
  p.knock = { vx: -dx / d * 150, vy: -dy / d * 150, t: 0.18 };
  p.atk = null;
  Sound.hurt(); G.shake = 0.2; G.shakeMag = 2;
  if (p.hp <= 0) { p.hp = 0; run(faint); }
  return true;
}
function* faint() {
  const p = G.player;
  yield wait(0.4);
  yield say(null, 'Le Bébé collapses...');
  yield say(BEBE, 'A man... does not stay down.', C_BEBE);
  yield fadeTo(1);
  p.hp = p.maxHp; p.inv = 0;
  const e = G.lastEntry; loadMap(e.id, e.tx, e.ty, e.face);
  yield wait(0.2);
  yield fadeTo(0);
}

// ---------------- Enemies ----------------
// Add new monsters here. Each has hp, contact damage, and an update(e, dt).
const ENEMY_TYPES = {
  // Grumpy urchin: wanders, then rolls toward you when you get close.
  urchin: { sprite: 'urchin', hp: 2, dmg: 1, drops: { shell: 0.5, macaron: 0.25 },
    update(e, dt) {
      const p = G.player, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.t -= dt;
      if (d < 72) { e.vx = dx / d * 26; e.vy = dy / d * 26; }
      else if (e.t <= 0) { e.t = 1 + Math.random() * 1.5; const a = Math.random() * 7, go = Math.random() < 0.7; e.vx = go ? Math.cos(a) * 18 : 0; e.vy = go ? Math.sin(a) * 18 : 0; }
      moveEnemy(e, e.vx * dt, e.vy * dt);
      e.anim += dt * 4;
    } },
  // Squawker: hovers, squawks a warning, then dive-bombs in a straight line.
  gull: { sprite: 'squawker', hp: 3, dmg: 1, fly: true, drops: { shell: 0.6, macaron: 0.3 },
    init(e) { e.state = 'hover'; e.hx = e.x; e.hy = e.y; e.cool = 0; },
    update(e, dt) {
      const p = G.player, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.st = (e.st || 0) + dt; e.cool -= dt; e.anim += dt * 8;
      if (e.state === 'hover') {
        e.x = e.hx + Math.sin(e.st * 1.3) * 18; e.y = e.hy + Math.sin(e.st * 2.1) * 6; e.flip = Math.cos(e.st * 1.3) < 0;
        if (d < 85 && e.cool <= 0) { e.state = 'windup'; e.st = 0; e.flip = dx < 0; Sound.squawk(); }
      } else if (e.state === 'windup') {
        e.jit = (Math.random() - 0.5) * 3;
        if (e.st > 0.55) { e.state = 'dive'; e.st = 0; e.jit = 0; e.vx = dx / d * 150; e.vy = dy / d * 150; }
      } else if (e.state === 'dive') {
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.st > 0.6) { e.state = 'recover'; e.st = 0; }
      } else if (e.state === 'recover' && e.st > 0.9) { e.state = 'hover'; e.hx = e.x; e.hy = e.y; e.st = 0; e.cool = 0.8; }
      e.x = Math.max(0, Math.min(G.map.w * TILE - 16, e.x)); e.y = Math.max(16, Math.min(G.map.h * TILE - 16, e.y));
    },
    onBlocked(e) { e.state = 'recover'; e.st = 0; } },
  // Training mannequin: can't be hurt, can't hurt you. Counts hits.
  dummy: { sprite: 'dummy', hp: Infinity, dmg: 0, solid: true,
    update(e, dt) { if (e.wob > 0) e.wob -= dt; },
    onHit(e) { e.wob = 0.3; e.hits = (e.hits || 0) + 1; floatText(String(e.hits), e.x + 8, e.y - 4, '#ffe066'); if (WORLD.onDummyHit) WORLD.onDummyHit(e.hits); } },
};
function spawnEnemy(kind, tx, ty) {
  const T = ENEMY_TYPES[kind];
  const e = { kind, type: T, x: tx * TILE, y: ty * TILE, hp: T.hp, vx: 0, vy: 0, t: 0, anim: 0, flash: 0, knock: null, flip: false };
  if (T.init) T.init(e);
  return e;
}
function moveEnemy(e, dx, dy) {
  const box = (x, y) => boxHitsTiles(x + 3, y + 9, x + 12, y + 15);
  if (!box(e.x + dx, e.y)) e.x += dx; else e.vx = -e.vx;
  if (!box(e.x, e.y + dy)) e.y += dy; else e.vy = -e.vy;
  if (dx) e.flip = dx < 0;
}
function damageEnemy(e, amount, dirv) {
  if (e.type.onHit) e.type.onHit(e);
  Sound.hit(); burst(e.x + 8, e.y + 8, '#fff6dc', 5, 50);
  if (!isFinite(e.hp)) return;
  e.hp -= amount; e.flash = 0.15;
  e.knock = { vx: dirv[0] * 170, vy: dirv[1] * 170, t: 0.15 };
  if (e.type.onBlocked) e.type.onBlocked(e);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; Sound.pop();
  burst(e.x + 8, e.y + 8, '#ffffff', 12, 70, 60); burst(e.x + 8, e.y + 8, '#c8b8e8', 8, 50, 60);
  for (const [item, chance] of Object.entries(e.type.drops || {})) {
    if (Math.random() < chance) { G.pickups.push({ item, x: e.x, y: e.y, born: G.t }); break; }
  }
}
function updateCombat(dt) {
  const p = G.player;
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (e.flash > 0) e.flash -= dt;
    if (e.knock) {
      e.knock.t -= dt;
      if (e.type.fly) { e.x += e.knock.vx * dt; e.y += e.knock.vy * dt; } else moveEnemy(e, e.knock.vx * dt, e.knock.vy * dt);
      if (e.knock.t <= 0) { e.knock = null; if (e.type.fly) { e.hx = e.x; e.hy = e.y; } }
      continue;
    }
    e.type.update(e, dt);
    // Touch damage
    if (e.type.dmg && p.hp > 0) {
      const l = p.x + 3, r = p.x + 12, t = p.y + 8, b = p.y + 15;
      if (l < e.x + 13 && r > e.x + 3 && t < e.y + 14 && b > e.y + 5) {
        const res = hurtPlayer(e.type.dmg, e.x + 8, e.y + 8);
        if (res === 'blocked') {
          const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
          e.knock = { vx: dx / d * 160, vy: dy / d * 160, t: 0.18 };
          if (e.type.onBlocked) e.type.onBlocked(e);
        }
      }
    }
  }
  G.enemies = G.enemies.filter(e => !e.dead);
}

// ---------------- Pickups ----------------
function nearestPickup() {
  const p = G.player, px = p.x + 8, py = p.y + 11;
  let best = null, bd = 18;
  for (const pk of G.pickups) { const d = Math.hypot(pk.x + 8 - px, pk.y + 10 - py); if (d < bd) { bd = d; best = pk; } }
  return best;
}
function tryPickup() {
  const pk = nearestPickup(); if (!pk) return false;
  G.pickups.splice(G.pickups.indexOf(pk), 1);
  if (pk.flag) F[pk.flag] = true;
  addItem(pk.item, pk.count || 1);
  Sound.pickup(); sparkle(pk.x + 8, pk.y + 8);
  floatText('+' + ITEMS[pk.item].name, pk.x + 8, pk.y - 2, '#fff6dc');
  return true;
}
function drawPickup(pk, cx, cy) {
  const bob = Math.round(Math.sin(G.t * 3 + pk.x) * 1.5);
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(Math.round(pk.x - cx + 4), Math.round(pk.y - cy + 13), 8, 2);
  drawSprite(ITEMS[pk.item].icon, 0, pk.x - cx, pk.y - cy - 2 + bob);
  if (Math.floor(G.t * 2 + pk.x) % 4 === 0) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(pk.x - cx + 11), Math.round(pk.y - cy + 2 + bob), 1, 1); }
}
function drawPickupPrompts(cx, cy) {
  if (G.script || G.dialog || G.menu) return;
  const pk = nearestPickup(); if (!pk) return;
  const label = btn('act'), w = label.length * 8 + 8, x = Math.round(pk.x - cx + 8 - w / 2), y = Math.round(pk.y - cy - 14);
  uiBox(x, y, w, 14); uiText(label, x + 4, y + 4, '#a82626');
}

// ---------------- Drawing the player, enemies, gear ----------------
function drawPlayer(cx, cy) {
  const p = G.player;
  if (p.inv > 0 && Math.floor(p.inv * 14) % 2) return; // blink while invulnerable
  drawEntity(p, cx, cy);
  const px = Math.round(p.x - cx + 8), py = Math.round(p.y - cy + 10);
  if (p.atk) {
    const base = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[p.atk.dir];
    const k = Math.min(1, p.atk.t / 0.18), e = 1 - Math.pow(1 - k, 3);
    const a = base - 1.3 + 2.6 * e;
    g.save(); g.translate(px, py); g.rotate(a + Math.PI / 4);
    g.drawImage(SPR.baguette.frames[0], -1, -14);
    g.restore();
    if (k < 1) { // a little swoosh trail
      g.strokeStyle = 'rgba(255,246,220,0.55)'; g.lineWidth = 2;
      g.beginPath(); g.arc(px, py, 15, base - 1.3, a); g.stroke();
    }
  }
  if (p.shielding) {
    const o = { right: [16, 0, Math.PI / 2], left: [-12, 0, -Math.PI / 2], down: [0, 9, 0], up: [0, -11, 0] }[p.face];
    g.save(); g.translate(px + o[0], py + o[1]); g.rotate(o[2]);
    g.drawImage(SPR.croissant.frames[0], -8, -6);
    g.restore();
  }
}
function drawEnemy(e, cx, cy) {
  const T = e.type, fly = T.fly ? 6 + Math.round(Math.sin(G.t * 5 + e.x) * 2) : 0;
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(Math.round(e.x - cx + 4), Math.round(e.y - cy + 14), 8, 2);
  const wob = e.wob > 0 ? Math.round(Math.sin(e.wob * 40) * 2) : 0;
  const frame = Math.floor(e.anim) % 2;
  drawSprite(T.sprite, frame, e.x - cx + (e.jit || 0) + wob, e.y - cy - fly, e.flip, e.flash > 0);
}

// ---------------- HUD hearts ----------------
function drawHearts() {
  if (!F.armed || G.mode !== 'play') return;
  const p = G.player, n = Math.ceil(p.maxHp / 2);
  uiBox(VW - (n * 11 + 10), 4, n * 11 + 6, 17);
  for (let i = 0; i < n; i++) {
    const v = p.hp - i * 2, name = v >= 2 ? 'heart' : v === 1 ? 'heartHalf' : 'heartEmpty';
    uiSprite(name, VW - (n * 11 + 4) + i * 11, 9, 8, 7);
  }
}

// ---------------- Items sidebar ----------------
function menuRows() {
  const rows = [];
  for (const [id, it] of Object.entries(ITEMS)) if (it.gear && it.owned()) rows.push({ id, it, count: 0 });
  for (const s of G.inv) rows.push({ id: s.id, it: ITEMS[s.id], count: s.count });
  return rows;
}
function openMenu() { G.menu = { sel: 0, t: 0 }; Sound.select(); }
function updateMenu() {
  const m = G.menu, rows = menuRows();
  if (consume('menu') || consume('b')) { G.menu = null; Sound.blip(400); return; }
  if (!rows.length) { consume('act'); return; }
  if (consume('up')) { m.sel = (m.sel + rows.length - 1) % rows.length; Sound.blip(700); }
  if (consume('down')) { m.sel = (m.sel + 1) % rows.length; Sound.blip(700); }
  m.sel = Math.min(m.sel, rows.length - 1);
  if (consume('act')) { const r = rows[m.sel]; if (r.it.use) { Sound.select(); run(r.it.use); } else Sound.blip(300); }
}
function drawMenu() {
  const m = G.menu; if (!m) return;
  m.t += 1 / 60;
  const slide = Math.min(1, m.t * 6), w = 132, x = Math.round(VW - w * slide - 2), y = 2, h = VH - 4;
  ctx.fillStyle = 'rgba(20,16,28,0.35)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  uiBox(x, y, w, h);
  uiText('Items', x + 10, y + 9, '#a82626');
  const rows = menuRows();
  if (!rows.length) uiText('Empty', x + 10, y + 30, '#8a6a5a');
  rows.forEach((r, i) => {
    const ry = y + 22 + i * 19;
    if (i === m.sel) { ctx.fillStyle = '#ecc98a'; ctx.fillRect((x + 5) * K, (ry - 1) * K, (w - 10) * K, 18 * K); }
    uiSprite(r.it.icon, x + 7, ry, 16, 16);
    uiText(r.it.name, x + 26, ry + 5, '#3a2414');
    if (r.count > 1) uiText('x' + r.count, x + w - 9, ry + 5, '#8a3a1a', 8, 'right');
    if (r.it.gear) uiText(r.id === 'baguette' ? 'B' : 'X', x + w - 9, ry + 5, '#c07a3a', 8, 'right');
  });
  const sel = rows[m.sel];
  if (sel && !G.dialog) {
    const lines = wrap(sel.it.desc(), 20).slice(0, 3);
    const bw = VW - w - 12, by = VH - 50;
    uiBox(4, by, bw, 46);
    lines.forEach((l, i) => uiText(l, 11, by + 9 + i * 12, '#3a2414'));
  }
  uiText(`${btn('act').split(' ')[0]}: use`, x + 10, y + h - 26, '#8a6a5a');
  uiText(`${btn('b').split(' ')[0]}: close`, x + 10, y + h - 14, '#8a6a5a');
}
