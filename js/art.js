// ============================================================
// ART: palette, character sprites, items, and tile painting.
// Sprites are drawn as text grids so you can edit them by hand.
// Each character maps to a color in PAL. "." is transparent.
// ============================================================

const PAL = {
  o: '#2b1b24', // outline
  r: '#d9502e', R: '#f07a4a', d: '#a33a22',          // crab shell
  y: '#f5c542', Y: '#ffe58a', j: '#c9952a',          // fiddler claw
  k: '#262338', K: '#4a4570',                        // beret
  w: '#ffffff', x: '#141018',                        // eyes
  u: '#3a62c8', U: '#6f93ec',                        // neckerchief
  g: '#eef1f5', G: '#a9b4c0', O: '#f29a2e',          // seagull
  n: '#8a4f2a', N: '#c4844a', l: '#d8cf98', L: '#a89e66', // snail
  c: '#9c6cc0', C: '#d4b2ee',                        // clam
  p: '#ee7f98', P: '#ffbccb',                        // shrimp
  s: '#f2a33a', S: '#ffd27a',                        // starfish
  m: '#a82626', M: '#d84a3a', z: '#d6d6de', Z: '#8a8a98', // lobster
  B: '#c98838', b: '#f0c070', q: '#6a3e22', Q: '#f4efe6', // bread, coffee
  a: '#f6f0dc', A: '#3a2a20',                        // apron, misc dark
};

const SPRITES = {
  // Le Bébé, facing right. Big fiddler claw on the right.
  bebe: [[
    '......oo........',
    '....oookKo......',
    '..ookkkkKKo.....',
    '.okkkkkkkko..ooo',
    '..ooooooooo.oYYo',
    '..owwo.owwo.oyYo',
    '..owxo.owxooyyyo',
    '...oo...oo.oyyoo',
    '.oorrrrrrrooyo..',
    'orRRrrrrrrdoyyoo',
    'orRuuuuuurdoyyyo',
    'ordrrUurrddojyyo',
    '.oodddddddo.ojjo',
    'o.o.o..o.o...oo.',
    '................',
    '................',
  ], [
    '......oo........',
    '....oookKo......',
    '..ookkkkKKo.....',
    '.okkkkkkkko..ooo',
    '..ooooooooo.oYYo',
    '..owwo.owwo.oyYo',
    '..owxo.owxooyyyo',
    '...oo...oo.oyyoo',
    '.oorrrrrrrooyo..',
    'orRRrrrrrrdoyyoo',
    'orRuuuuuurdoyyyo',
    'ordrrUurrddojyyo',
    '.oodddddddo.ojjo',
    '.o.o.o..o.o.oo..',
    '................',
    '................',
  ]],
  gull: [[
    '................',
    '......oooo......',
    '.....ogggo......',
    '....oggxggo.....',
    '....oggggoOOo...',
    '....ogggggoOOo..',
    '...ooggggggoo...',
    '..oGGgggggggo...',
    '.oGGGgggggggo...',
    '.oGGGGggggggo...',
    '..oGGGGgggggo...',
    '...ooGGGgggo....',
    '.....ooooo......',
    '......O..O......',
    '.....OO.OO......',
    '................',
  ], [
    '................',
    '................',
    '......oooo......',
    '.....ogggo......',
    '....oggxggoOo...',
    '....ogggggoOOOo.',
    '...ooggggggoOo..',
    '..oGGgggggggo...',
    '.oGGGgggggggo...',
    '.oGGGGggggggo...',
    '..oGGGGgggggo...',
    '...ooGGGgggo....',
    '.....ooooo......',
    '......O..O......',
    '.....OO.OO......',
    '................',
  ]],
  snail: [[
    '................',
    '................',
    '.......oooo.....',
    '.....ooNNnnoo...',
    '....oNNnnnnNno..',
    '...oNnnooonnNno.',
    '...oNnoNNnonnno.',
    '.o.oNnonnoonnno.',
    'oxo.oNnnooonnno.',
    'olo.oNNnnnnnnno.',
    'olo..ooNNnnnoo..',
    'olloooooooooolo.',
    'olllllllllllllo.',
    '.oLLLLLLLLLLLo..',
    '..ooooooooooo...',
    '................',
  ]],
  clam: [[
    '................',
    '................',
    '.....oooooo.....',
    '....oCCCCCCo....',
    '...oCcCcCcCco...',
    '..oCcCcCcCcCco..',
    '..ocwxcccwxcco..',
    '..occcccccccco..',
    '..oooooooooooo..',
    '..oaaaaaaaaaao..',
    '..ocaaaaaaaaco..',
    '...occcccccco...',
    '....oCCCCCCo....',
    '.....oooooo.....',
    '.....o.o.o.o....',
    '................',
  ]],
  shrimp: [[
    '................',
    '.....oo..oo.....',
    '....o..oo..o....',
    '.......oo.......',
    '......oPPo......',
    '.....oPpxpo.....',
    '.....oppppo.....',
    '....oaaaaaao....',
    '....oaPppPao....',
    '...opaPppPapo...',
    '...o.apppPa.o...',
    '.....opppPo.....',
    '......opPpo.....',
    '.......opPo.oo..',
    '........oopoPPo.',
    '..........oooo..',
  ]],
  star: [[
    '................',
    '.......oo.......',
    '......oSSo......',
    '......oSso......',
    '.oooooossoooooo.',
    '.oSSsswxswxssso.',
    '..ossssssssssso.',
    '...osssooossso..',
    '....osssssso....',
    '....ossssssso...',
    '...osssoossso...',
    '...ossso.ossso..',
    '..osso....osso..',
    '..oso......oso..',
    '..oo........oo..',
    '................',
  ]],
  // La Tranche: a grizzled old lobster with a white beard.
  tranche: [[
    '..o..........o..',
    '...o.oo..oo.o...',
    '....oMMooMMo....',
    '...oMmmmmmmMo...',
    'oo.omwxmmwxmo.oo',
    'oMooMmmmmmmMooMo',
    'oMMmozzzzzzomMMo',
    '.oMmzzzZZzzzmMo.',
    '..oozzzZZzzzoo..',
    '...omzzzzzzmo...',
    '...oMmzzzzmMo...',
    '...omMmmmmMmo...',
    '....omMmmMmo....',
    '....oommmmoo....',
    '...omo.oo.omo...',
    '...oo......oo...',
  ]],
  baguette: [[
    '............oo..',
    '...........obbo.',
    '..........obBbo.',
    '.........obBbo..',
    '........obBbo...',
    '.......obBbo....',
    '......obBbo.....',
    '.....obBbo......',
    '....obBbo.......',
    '...obBbo........',
    '..obBbo.........',
    '.oAAbo..........',
    'oAAAo...........',
    'oAAo............',
    '.oo.............',
    '................',
  ]],
  croissant: [[
    '................',
    '................',
    '................',
    '...oo......oo...',
    '..obBo....oBbo..',
    '..oBbBoooobBBo..',
    '..obBBbbbbBbbo..',
    '...obBbBbBbBo...',
    '....obbBbBbo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ]],
  cup: [[
    '..oooo..',
    '.oQQQQo.',
    '.oqqqqoo',
    '.oQQQQoo',
    '.oQQQQo.',
    '..oooo..',
    '........',
    '........',
  ]],
};

// Builds canvases for every sprite frame, plus mirrored copies.
const SPR = {};
function gridToCanvas(rows) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.' && PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); }
  }));
  return c;
}
function mirror(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
function buildSprites() {
  for (const [name, frames] of Object.entries(SPRITES)) {
    const f = frames.map(gridToCanvas);
    SPR[name] = { frames: f, flipped: f.map(mirror), w: f[0].width, h: f[0].height };
  }
  // Armed Le Bébé: baguette slung on his back, croissant in the small claw.
  const armed = SPR.bebe.frames.map(base => {
    const c = document.createElement('canvas'); c.width = 24; c.height = 22;
    const g = c.getContext('2d');
    g.drawImage(SPR.baguette.flipped[0], 0, 0, 16, 16, 0, 0, 15, 15);
    g.drawImage(base, 4, 4);
    g.drawImage(SPR.croissant.frames[0], 0, 3, 16, 8, 0, 13, 12, 6);
    return c;
  });
  SPR.bebeArmed = { frames: armed, flipped: armed.map(mirror), w: 24, h: 22, ox: -4, oy: -4 };
}

// ------------------------------------------------------------
// TILES. Each tile char has: solid, optional anim, and a paint fn.
// paint(g, x, y, tx, ty, t) draws one 16x16 tile at pixel x,y.
// ------------------------------------------------------------
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

function grass(g, x, y, tx, ty) {
  R(g, x, y, 16, 16, '#5aa548');
  for (let i = 0; i < 6; i++) {
    const px = Math.floor(hash(tx, ty, i) * 15), py = Math.floor(hash(tx, ty, i + 9) * 14);
    R(g, x + px, y + py, 1, 2, i % 2 ? '#478f3a' : '#76c25c');
  }
}
function floorWood(g, x, y, tx, ty) {
  R(g, x, y, 16, 16, '#a8703e');
  R(g, x, y + 7, 16, 1, '#86552c'); R(g, x, y + 15, 16, 1, '#86552c');
  const o = (ty % 2) * 8;
  R(g, x + (4 + o) % 16, y, 1, 7, '#86552c'); R(g, x + (12 + o) % 16, y + 8, 1, 7, '#86552c');
  R(g, x + 1, y + 2, 3, 1, '#bd844f');
}
function caveFloor(g, x, y, tx, ty) {
  R(g, x, y, 16, 16, '#4b4254');
  for (let i = 0; i < 4; i++) {
    const px = Math.floor(hash(tx, ty, i) * 14), py = Math.floor(hash(tx, ty, i + 5) * 14);
    R(g, x + px, y + py, 2, 1, i % 2 ? '#3d3546' : '#5b5166');
  }
}
function water(g, x, y, tx, ty, t) {
  R(g, x, y, 16, 16, '#3b7dd8');
  const ph = Math.floor(t * 2 + hash(tx, ty) * 4) % 4;
  R(g, x + ((ph * 4 + tx * 3) % 12), y + 4 + (ty % 2) * 6, 4, 1, '#7db3f2');
  R(g, x + ((ph * 3 + 8) % 12), y + 11 - (ty % 2) * 5, 3, 1, '#2d63b4');
}

const TILES = {
  '.': { paint: grass },
  ',': { paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty);
      const cols = ['#ffffff', '#ffd94a', '#ff8fb1', '#b9a2ff'];
      for (let i = 0; i < 3; i++) { const px = 2 + Math.floor(hash(tx, ty, i + 20) * 11), py = 2 + Math.floor(hash(tx, ty, i + 30) * 11);
        R(g, x + px, y + py, 2, 2, cols[Math.floor(hash(tx, ty, i + 40) * 4)]); R(g, x + px, y + py + 2, 1, 1, '#3d7f33'); } } },
  ':': { paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#d0aa72');
      for (let i = 0; i < 4; i++) R(g, x + Math.floor(hash(tx, ty, i) * 14), y + Math.floor(hash(tx, ty, i + 4) * 14), 2, 1, '#b48c58'); } },
  s: { paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#ecd9a0');
      for (let i = 0; i < 3; i++) R(g, x + Math.floor(hash(tx, ty, i) * 15), y + Math.floor(hash(tx, ty, i + 4) * 15), 1, 1, '#cdb478'); } },
  '~': { solid: true, anim: true, paint: water },
  T: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty);
      R(g, x + 6, y + 10, 4, 5, '#6b4226'); R(g, x + 1, y + 1, 14, 11, '#2f7a34');
      R(g, x + 2, y, 12, 1, '#2f7a34'); R(g, x + 3, y + 2, 6, 4, '#47a04a'); R(g, x + 4, y + 3, 2, 1, '#6cc36a');
      R(g, x + 1, y + 11, 14, 1, '#235c27'); } },
  r: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty);
      R(g, x + 2, y + 5, 12, 9, '#4a4552'); R(g, x + 3, y + 4, 10, 9, '#8d8798'); R(g, x + 4, y + 5, 4, 2, '#b3aec0'); } },
  F: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty);
      R(g, x, y + 5, 16, 2, '#8a5a32'); R(g, x, y + 10, 16, 2, '#8a5a32'); R(g, x + 2, y + 3, 3, 12, '#a8703e'); R(g, x + 11, y + 3, 3, 12, '#a8703e'); } },
  // Buildings
  R: { solid: true, paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#c0504a'); for (let i = 0; i < 4; i++) R(g, x, y + i * 4 + 3, 16, 1, '#8e3434');
      R(g, x + (ty % 2) * 8, y, 1, 16, '#a64040'); } },
  U: { solid: true, paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#4f74b8'); for (let i = 0; i < 4; i++) R(g, x, y + i * 4 + 3, 16, 1, '#36548c');
      R(g, x + (ty % 2) * 8, y, 1, 16, '#4466a4'); } },
  W: { solid: true, paint(g, x, y) { R(g, x, y, 16, 16, '#efe2c4'); R(g, x, y + 14, 16, 2, '#b8a582'); R(g, x, y, 1, 16, '#8a5a32'); R(g, x + 15, y, 1, 16, '#8a5a32'); } },
  v: { solid: true, paint(g, x, y) { TILES.W.paint(g, x, y); R(g, x + 3, y + 3, 10, 9, '#6a4a2a'); R(g, x + 4, y + 4, 8, 7, '#9fd0ff');
      R(g, x + 7, y + 4, 2, 7, '#6a4a2a'); R(g, x + 4, y + 7, 8, 1, '#6a4a2a'); R(g, x + 2, y + 12, 12, 2, '#c0504a'); } },
  D: { paint(g, x, y) { TILES.W.paint(g, x, y); R(g, x + 3, y + 2, 10, 14, '#5a3a20'); R(g, x + 4, y + 3, 8, 13, '#8a5a32');
      R(g, x + 10, y + 9, 1, 2, '#ffd94a'); } },
  S: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty); R(g, x + 7, y + 8, 2, 7, '#6b4226');
      R(g, x + 2, y + 2, 12, 8, '#6b4226'); R(g, x + 3, y + 3, 10, 6, '#c4844a'); R(g, x + 4, y + 5, 8, 1, '#6b4226'); } },
  b: { solid: true, paint(g, x, y, tx, ty) { TILES[':'].paint(g, x, y, tx, ty); R(g, x + 1, y + 1, 14, 11, '#6b4226'); R(g, x + 2, y + 2, 12, 9, '#c4844a');
      R(g, x + 3, y + 3, 4, 5, '#fff6dc'); R(g, x + 8, y + 4, 5, 4, '#ffe0e0'); R(g, x + 3, y + 12, 2, 4, '#6b4226'); R(g, x + 11, y + 12, 2, 4, '#6b4226'); } },
  q: { solid: true, paint(g, x, y, tx, ty) { TILES[':'].paint(g, x, y, tx, ty); R(g, x, y + 6, 16, 9, '#8a5a32'); R(g, x, y + 5, 16, 2, '#a8703e');
      R(g, x + 2, y + 1, 9, 4, '#d8994a'); R(g, x + 3, y + 1, 7, 1, '#f0c070'); R(g, x + 11, y + 2, 4, 3, '#e8b060'); } },
  g: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty); R(g, x + 4, y + 1, 8, 15, '#6e6878'); R(g, x + 5, y + 2, 6, 13, '#9690a2'); R(g, x + 3, y, 10, 3, '#4a4552'); } },
  u: { solid: true, paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#a49eb0'); R(g, x, y + 15, 16, 1, '#7d7788');
      R(g, x + (ty % 2) * 8, y, 1, 8, '#8a8496'); R(g, x + 4 + (ty % 2) * 8, y + 8, 1, 8, '#8a8496'); R(g, x, y + 7, 16, 1, '#8a8496');
      R(g, x + 2, y + 2, 3, 1, '#c2bcce'); R(g, x + 9, y + 10, 3, 1, '#c2bcce'); } },
  // Fountain center: animated water inside a stone ring
  Q: { solid: true, anim: true, paint(g, x, y, tx, ty, t) { TILES.u.paint(g, x, y, tx, ty); R(g, x + 3, y + 3, 10, 10, '#3b7dd8');
      const h = Math.floor(t * 6) % 3; R(g, x + 7, y + 1 - h, 2, 7, '#bfe0ff'); R(g, x + 5, y + 5, 6, 1, '#7db3f2'); } },
  // Café interior
  '#': { solid: true, paint(g, x, y) { R(g, x, y, 16, 16, '#f3e3c3'); R(g, x, y + 10, 16, 6, '#7a4a2a'); R(g, x, y + 10, 16, 1, '#5a321a'); R(g, x, y, 16, 1, '#e2cfa8'); } },
  n: { solid: true, paint(g, x, y) { TILES['#'].paint(g, x, y); R(g, x + 2, y + 1, 12, 8, '#5a321a'); R(g, x + 3, y + 2, 10, 6, '#bfe6ff'); R(g, x + 7, y + 2, 2, 6, '#5a321a'); } },
  M: { solid: true, paint(g, x, y) { TILES['#'].paint(g, x, y); R(g, x + 1, y + 1, 14, 9, '#2c3a2e'); R(g, x + 3, y + 3, 8, 1, '#fff'); R(g, x + 3, y + 5, 10, 1, '#fff'); R(g, x + 3, y + 7, 6, 1, '#fff'); } },
  h: { solid: true, paint(g, x, y) { TILES['#'].paint(g, x, y); R(g, x, y + 7, 16, 2, '#5a321a'); R(g, x + 2, y + 3, 3, 4, '#fff'); R(g, x + 7, y + 3, 3, 4, '#e8e0f8'); R(g, x + 12, y + 4, 3, 3, '#fff'); } },
  E: { solid: true, paint(g, x, y) { TILES['#'].paint(g, x, y); R(g, x + 2, y + 1, 12, 9, '#9aa6b2'); R(g, x + 3, y + 2, 10, 3, '#c9d3dc'); R(g, x + 6, y + 6, 4, 3, '#2b1b24'); R(g, x + 4, y + 2, 2, 2, '#e04040'); } },
  '=': { paint: floorWood },
  C: { solid: true, counter: true, paint(g, x, y, tx, ty) { floorWood(g, x, y, tx, ty); R(g, x, y + 2, 16, 13, '#6a3e22'); R(g, x, y + 1, 16, 4, '#d9b886'); R(g, x, y + 4, 16, 1, '#b8956a'); R(g, x + 1, y + 7, 14, 1, '#7d4c2c'); } },
  m: { solid: true, paint(g, x, y, tx, ty) { floorWood(g, x, y, tx, ty); R(g, x + 2, y + 3, 12, 8, '#ffffff'); R(g, x + 2, y + 9, 12, 2, '#e04a4a'); R(g, x + 5, y + 11, 6, 4, '#5a321a'); R(g, x + 6, y + 5, 3, 3, '#f4efe6'); } },
  // Rug: draws its gold border only on edges that don't touch more rug
  K: { paint(g, x, y, tx, ty) {
      const rug = (dx, dy) => typeof tileAt === 'function' && tileAt(tx + dx, ty + dy) === 'K';
      R(g, x, y, 16, 16, '#b84a4a');
      if ((tx + ty) % 2 === 0) { R(g, x + 7, y + 5, 2, 6, '#cf6a4a'); R(g, x + 5, y + 7, 6, 2, '#cf6a4a'); }
      if (!rug(0, -1)) { R(g, x, y, 16, 3, '#7a2a2a'); R(g, x, y + 1, 16, 1, '#e0b04a'); }
      if (!rug(0, 1)) { R(g, x, y + 13, 16, 3, '#7a2a2a'); R(g, x, y + 14, 16, 1, '#e0b04a'); }
      if (!rug(-1, 0)) { R(g, x, y, 3, 16, '#7a2a2a'); R(g, x + 1, y, 1, 16, '#e0b04a'); }
      if (!rug(1, 0)) { R(g, x + 13, y, 3, 16, '#7a2a2a'); R(g, x + 14, y, 1, 16, '#e0b04a'); } } },
  p: { solid: true, paint(g, x, y, tx, ty) { floorWood(g, x, y, tx, ty); R(g, x + 4, y + 9, 8, 6, '#a8583a'); R(g, x + 3, y + 2, 10, 8, '#3f8a3a'); R(g, x + 5, y + 1, 4, 3, '#5aa548'); } },
  // Cliffs and the guild entrance
  k: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty); R(g, x, y, 16, 16, '#4f9440'); R(g, x + Math.floor(hash(tx, ty) * 12), y + 6, 3, 2, '#3e7a33'); } },
  c: { solid: true, paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#8f7e6c'); R(g, x, y, 16, 2, '#4f9440');
      R(g, x + Math.floor(hash(tx, ty) * 10), y + 5, 6, 1, '#6c5c4e'); R(g, x + Math.floor(hash(tx, ty, 2) * 10), y + 10, 5, 1, '#6c5c4e');
      R(g, x + Math.floor(hash(tx, ty, 3) * 12), y + 7, 3, 2, '#ab9b88'); R(g, x, y + 15, 16, 1, '#5e4f43'); } },
  X: { solid: true, paint(g, x, y, tx, ty) { TILES.c.paint(g, x, y, tx, ty); R(g, x + 7, y + 3, 1, 4, '#3a2f28'); R(g, x + 8, y + 6, 1, 4, '#3a2f28'); R(g, x + 7, y + 9, 1, 5, '#3a2f28'); R(g, x + 5, y + 12, 3, 1, '#3a2f28'); R(g, x + 9, y + 4, 2, 1, '#3a2f28'); } },
  O: { paint(g, x, y, tx, ty) { TILES.c.paint(g, x, y, tx, ty); R(g, x + 2, y + 3, 12, 13, '#1a1420'); R(g, x + 3, y + 2, 10, 1, '#1a1420'); R(g, x + 4, y + 1, 8, 1, '#5e4f43'); } },
  Z: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty); R(g, x + 1, y + 3, 14, 12, '#4a4552'); R(g, x + 2, y + 2, 12, 12, '#8d8798');
      R(g, x + 4, y + 4, 1, 7, '#3a3442'); R(g, x + 7, y + 4, 1, 7, '#3a3442'); R(g, x + 10, y + 4, 1, 7, '#3a3442'); R(g, x + 2, y + 12, 12, 2, '#5aa548'); } },
  o: { solid: true, paint(g, x, y, tx, ty) { grass(g, x, y, tx, ty); R(g, x + 4, y + 6, 8, 7, '#fff1e0'); R(g, x + 5, y + 5, 6, 1, '#fff1e0'); R(g, x + 7, y + 4, 2, 1, '#fff1e0');
      R(g, x + 6, y + 7, 1, 5, '#e8a0a0'); R(g, x + 9, y + 7, 1, 5, '#e8a0a0'); R(g, x + 6, y + 13, 4, 1, '#c88080'); } },
  // Guild hall
  P: { paint: caveFloor },
  H: { solid: true, paint(g, x, y, tx, ty) { R(g, x, y, 16, 16, '#2e2836'); R(g, x + Math.floor(hash(tx, ty) * 10), y + Math.floor(hash(tx, ty, 1) * 12), 5, 2, '#3a3344'); R(g, x, y + 14, 16, 2, '#221d29'); } },
  f: { solid: true, anim: true, paint(g, x, y, tx, ty, t) { TILES.H.paint(g, x, y, tx, ty); R(g, x + 7, y + 7, 2, 7, '#6b4226');
      const fl = Math.floor(t * 8 + tx) % 3; R(g, x + 6, y + 3 + fl % 2, 4, 4, '#ff9a2e'); R(g, x + 7, y + 2 + fl, 2, 3, '#ffe066'); } },
  I: { solid: true, paint(g, x, y, tx, ty) { TILES.H.paint(g, x, y, tx, ty); R(g, x + 3, y + 1, 10, 13, '#3a62c8'); R(g, x + 3, y + 1, 10, 2, '#c9952a');
      R(g, x + 6, y + 5, 4, 5, '#f5c542'); R(g, x + 3, y + 14, 3, 2, '#3a62c8'); R(g, x + 10, y + 14, 3, 2, '#3a62c8'); } },
  J: { solid: true, paint(g, x, y, tx, ty) { caveFloor(g, x, y, tx, ty); R(g, x + 1, y + 4, 14, 10, '#5a321a'); R(g, x + 1, y + 3, 14, 3, '#8a5a32'); R(g, x + 3, y + 2, 4, 2, '#f4efe6'); R(g, x + 10, y + 1, 2, 3, '#ffe066'); } },
  // Path to the sea (shallow water you can walk in) and path to the sky
  L: { anim: true, paint(g, x, y, tx, ty, t) { water(g, x, y, tx, ty, t); const b = (t * 20 + tx * 5) % 16; R(g, x + 4 + (tx % 3) * 3, y + 15 - b, 2, 2, '#bfe0ff'); } },
  Y: { anim: true, paint(g, x, y, tx, ty, t) { R(g, x, y, 16, 16, '#9fd0ff'); R(g, x, y + (ty % 2) * 8, 16, 2, '#e8f4ff');
      const c = Math.floor(t * 3 + tx) % 3; R(g, x + 2 + c * 4, y + 5, 6, 3, '#ffffff'); R(g, x + 8 - c * 2, y + 11, 5, 2, '#ffffff'); } },
};
