// ============================================================
// WORLD: the story of Le Bébé. Characters, places, clues, cutscenes.
// This is the file you'll edit most when adding chapters.
// ============================================================

G.player.sprite = 'bebe';
const BEBE = 'Le Bébé', TRANCHE = 'La Tranche';
const C_BEBE = '#c0402a', C_TRANCHE = '#7a1e1e';
const T = n => n * TILE; // tile -> pixel

// ---------- Little reusable story beats ----------
function laughFor(ent, secs) {
  return {
    t: secs, n: 0,
    start() { ent.laughing = true; Sound.laugh(); },
    update(dt) {
      this.t -= dt; this.n -= dt;
      if (this.n <= 0) { floatText(Math.random() < 0.5 ? 'HA!' : 'HAHA', ent.x + 8, ent.y - 4, '#fff6dc'); this.n = 0.3; }
      if (Math.random() < dt * 2) Sound.laugh();
      if (this.t <= 0) { ent.laughing = false; return true; }
      return false;
    },
  };
}
function throwCup(from, ex, ey) {
  return {
    t: 0,
    start() {
      from.holding = null;
      this.prop = { x: from.x + 10, y: from.y + 4, draw: (g, x, y) => drawSprite('cup', 0, x, y) };
      this.sx = this.prop.x; this.sy = this.prop.y; G.props.push(this.prop);
    },
    update(dt) {
      this.t += dt / 0.55;
      const k = Math.min(1, this.t);
      this.prop.x = this.sx + (ex - this.sx) * k;
      this.prop.y = this.sy + (ey - this.sy) * k - Math.sin(k * Math.PI) * 30;
      if (k < 1) return false;
      G.props.splice(G.props.indexOf(this.prop), 1);
      G.decals.push({ map: 'cafe', x: ex, y: ey, draw(g, x, y) {
        g.fillStyle = '#6a3e22'; g.fillRect(x - 6, y + 2, 14, 5); g.fillRect(x - 3, y, 9, 9); g.fillRect(x + 8, y + 5, 3, 2); g.fillRect(x - 9, y + 4, 2, 2);
        g.fillStyle = '#8a5432'; g.fillRect(x - 2, y + 2, 5, 3);
        g.fillStyle = '#f4efe6'; g.fillRect(x + 4, y + 1, 3, 2); g.fillRect(x - 5, y + 6, 2, 2);
      } });
      burst(ex + 2, ey + 3, '#6a3e22', 16, 70); burst(ex + 2, ey + 3, '#f4efe6', 6, 50);
      Sound.splash(); G.shake = 0.35; G.shakeMag = 2;
      return true;
    },
  };
}
function* itemGet(sprite, name, desc) {
  const p = G.player;
  p.lift = sprite; Sound.item(); sparkle(p.x + 8, p.y - 8);
  yield say(null, `You received ${name}!`);
  yield say(null, desc);
  p.lift = null;
}
function* clueFound(text, objective) {
  Sound.clue(); sparkle(G.player.x + 8, G.player.y);
  yield say(null, text);
  if (objective) setObjective(objective);
}

// ---------- The opening ----------
function* intro() {
  const p = G.player, gull = npc('gull'), boss = npc('palourde');
  yield wait(0.3);
  yield fadeTo(0);
  yield say(null, 'Café Coquille, Port-Petit. 7:42 in the morning.');
  yield say(null, 'The finest coffee in town, served by its most serious barista.');
  Sound.door(); gull.hidden = false;
  yield walk(gull, [[9, 9], [9, 5]], 40);
  setFace(gull, 'up');
  yield say('Seagull', "Un café au lait, s'il vous plaît.");
  yield say(BEBE, 'Right away, monsieur.', C_BEBE);
  yield wait(0.4);
  p.holding = 'cup'; Sound.blip(800);
  yield wait(0.6);
  yield say('Seagull', 'Merci, merci. And your name is...');
  yield wait(0.5);
  yield say('Seagull', '...');
  yield say('Seagull', '"Le... Bébé"?');
  yield laughFor(gull, 1.4);
  yield say('Seagull', 'Oui oui, LE BÉBÉ! HA! The baby made my coffee!');
  yield laughFor(gull, 1.2);
  yield wait(0.6);
  yield say(BEBE, '...', C_BEBE);
  yield throwCup(p, T(11) + 4, T(6) + 4);
  yield wait(0.3);
  yield say('Mme Palourde', 'LE BÉBÉ!');
  yield say(BEBE, 'My whole life. Le Bébé. At school. At the market. Written on every birthday cake.', C_BEBE);
  yield say(BEBE, 'Even my own mother calls me Le Bébé.', C_BEBE);
  yield say('Seagull', '...She did name you that.');
  yield shake(0.4, 3);
  yield say(BEBE, 'ENOUGH.', C_BEBE);
  yield say(BEBE, "I will prove to everyone that I am L'HOMME.", C_BEBE);
  yield walk(p, [[16, 3], [16, 9], [10, 9], [10, 10]], 80);
  Sound.door();
  F.introDone = true;
  yield* travel('town', 5, 6, 'down');
  yield wait(0.4);
  yield say(BEBE, "Grand-père always said the Adventurers' Guild lies just outside of town.", C_BEBE);
  yield say(BEBE, 'That is where men are made.', C_BEBE);
  setObjective("Find the Adventurers' Guild");
  yield say(null, 'Move with the arrow keys or WASD. Press SPACE to talk and look at things.');
}

// ---------- The guild ----------
function* meetTranche() {
  const p = G.player, boss = npc('tranche');
  yield wait(0.5);
  yield walk(p, [[4, 7], [9, 7], [9, 6]], 50);
  setFace(p, 'up');
  yield wait(0.6);
  yield say('???', '...');
  yield say('???', 'So. Someone finally read the shells.', C_TRANCHE);
  yield say(TRANCHE, "I am La Tranche. I lead what remains of the Adventurers' Guild.", C_TRANCHE);
  yield say(TRANCHE, 'Few find this place. Fewer still know why they came looking for it.', C_TRANCHE);
  const c = yield ask(TRANCHE, 'Tell me, little crab. What are your intentions?', ['To prove I am a man.', "To prove I am L'HOMME.", 'To make them stop laughing.'], C_TRANCHE);
  if (c === 2) yield say(TRANCHE, 'Hm. More honest than most.', C_TRANCHE);
  else yield say(TRANCHE, '...To prove it. I see.', C_TRANCHE);
  yield say(TRANCHE, 'Then hear me, Le Bébé. Be wary of journeys built on the perceptions of others.', C_TRANCHE);
  yield say(TRANCHE, 'A crab who walks only to change what others see may walk forever, and never arrive.', C_TRANCHE);
  yield say(TRANCHE, 'I hope that along the way, you find your true self. Not the one they named. Not the one you are trying to prove.', C_TRANCHE);
  yield wait(0.5);
  yield say(BEBE, '...', C_BEBE);
  yield say(TRANCHE, 'Still. No one in this guild walks unarmed.', C_TRANCHE);
  yield say(TRANCHE, 'These were baked by the first guildmasters, in an oven that has not cooled in three hundred years.', C_TRANCHE);
  F.gotSword = true;
  yield* itemGet('baguette', "La Baguette de l'Aube", 'The Baguette of Dawn. Crusty. Unbreakable. Sacred.');
  F.gotShield = true;
  yield* itemGet('croissant', 'Le Croissant Éternel', 'Seventy-two layers of folded, buttered protection.');
  F.armed = true; p.sprite = 'bebeArmed';
  yield say(BEBE, 'I will not dishonor them.', C_BEBE);
  yield say(TRANCHE, 'Two paths lie below us. One leads beneath the sea. The other, into the skies.', C_TRANCHE);
  yield say(TRANCHE, 'Neither is the right one. Neither is the wrong one. Choose, and walk.', C_TRANCHE);
  F.metTranche = true;
  setObjective('Choose your path: the sea or the sky');
}
function choosePath(which) {
  return function* () {
    const p = G.player, tx = Math.round(p.x / TILE);
    G.lockInput = true;
    yield walk(p, [[tx, 15]], 40);
    yield fadeTo(1);
    yield call(() => { G.mode = 'end'; G.endPath = which; G.endT = 0; G.fadeTarget = 0; G.lockInput = false; });
  };
}
function* notYet() {
  const p = G.player;
  yield say(TRANCHE, 'Not yet. Come. Speak with me first.', C_TRANCHE);
  yield walk(p, [[Math.round(p.x / TILE), 10]], 60);
}

function* readShells() {
  if (!F.clue2) { yield say(null, 'A seashell. Pretty. Probably just a shell.'); return; }
  if (F.clue3) { yield say(null, 'The three shells point north, toward the cliff.'); return; }
  yield say(null, 'Three shells, arranged with great care.');
  yield say(null, 'They all point north. Straight at the cliff face.');
  F.clue3 = true;
  yield* clueFound('A clue! Search the cliff the shells are pointing at.', 'Search the cliff the shells point to');
}

// ---------- Places ----------
const WORLD = {
  maps: {
    cafe: {
      title: 'Café Coquille',
      npcs: () => [
        { id: 'palourde', sprite: 'clam', x: T(13), y: T(2), talk: function* () {
          yield say('Mme Palourde', 'You threw a café au lait at a paying customer, Le Bébé.');
          yield say('Mme Palourde', 'You are fired, of course.');
          yield say('Mme Palourde', '...Bonne chance out there. Truly.');
        } },
        { id: 'gull', sprite: 'gull', x: F.introDone ? T(13) : T(9), y: F.introDone ? T(7) : T(10), flip: true, hidden: !F.introDone, idleAnim: true, talk: function* () {
          yield say('Seagull', 'Oui oui, le bé... ahem.');
          yield say('Seagull', 'Sorry. That one was reflex.');
          yield say(BEBE, 'You will see. All of you will see.', C_BEBE);
        } },
      ],
      warps: [{ x: 9, y: 10, w: 2, to: 'town', tx: 5, ty: 6, face: 'down' }],
      objects: [
        { x: 9, y: 1, act: function* () { yield say(null, 'The espresso machine. It hisses at you. You hiss back.'); } },
        { x: 5, y: 1, act: function* () { yield say(null, 'MENU: Café. Café au lait. Croissant. "Le Bébé Special" (crossed out angrily).'); } },
      ],
      onEnter() { if (!F.introDone) run(intro); },
    },

    town: {
      title: 'Port-Petit',
      npcs: () => [
        { id: 'snail', sprite: 'snail', x: T(36), y: T(7), flip: true, talk: function* () {
          if (!F.clue1) {
            yield say('M. Escargot', "Hm? The Adventurers' Guild? Ah. My grandfather went looking for it.");
            yield say('M. Escargot', 'Took him six years. I am a snail; this is considered brisk.');
            yield say('M. Escargot', 'He told me: go past the east gate and find the stone that bears the claw. The stone will tell you the rest.');
            F.clue1 = true;
            yield* clueFound('A clue! The stone that bears the claw, somewhere past the east gate.', 'Find the stone that bears the claw (east)');
          } else {
            yield say('M. Escargot', 'The stone that bears the claw. East. I would walk you there, but we would arrive in spring.');
          }
        } },
        { id: 'crevette', sprite: 'shrimp', x: T(26), y: T(7), talk: function* () {
          if (F.armed) { yield say('Mme Crevette', 'Is that... a baguette of the old guild? Mon dieu.'); return; }
          yield say('Mme Crevette', 'Bonjour, Le Bé... ah. Monsieur.');
          yield say('Mme Crevette', 'You have the look of someone who is leaving. Bread is for those who stay.');
          yield say('Mme Crevette', 'But if you are seeking something, old Escargot by the east gate knows every legend in Port-Petit.');
        } },
        { id: 'kid', sprite: 'star', x: T(11), y: T(14), talk: function* () {
          yield say('Petite Étoile', 'LE BÉBÉ! Le Bébé! Are you gonna cry?');
          yield say(BEBE, 'Not today, child. Not ever again.', C_BEBE);
          yield say('Petite Étoile', '...Cool hat though.');
        } },
      ],
      warps: [
        { x: 5, y: 5, to: 'cafe', tx: 9, ty: 9, face: 'up' },
        { x: 39, y: 8, h: 2, to: 'outskirts', tx: 1, ty: 10, keepY: true, face: 'right' },
      ],
      objects: [
        { x: 20, y: 10, act: function* () {
          yield say(null, "ADVENTURERS' GUILD: NOW RECRUITING.");
          yield say(null, 'Location: Find us. That is the first test.');
          yield say(BEBE, 'A test. Good. I have been tested my whole life.', C_BEBE);
        } },
        { x: 7, y: 6, act: function* () { yield say(null, 'CAFÉ COQUILLE. Now hiring. (The ink is still wet.)'); } },
        { x: 18, y: 12, w: 3, h: 3, act: function* () { yield say(null, 'The fountain of Port-Petit. Le Bébé refuses to look at his reflection until the job is done.'); } },
        { x: 15, y: 5, act: function* () { yield say(null, 'Locked. Someone inside is practicing the accordion. Badly.'); } },
        { x: 26, y: 5, act: function* () { yield say(null, 'The bakery smells incredible. Focus, Le Bébé. Focus.'); } },
        { x: 34, y: 5, act: function* () { yield say(null, 'A note on the door: "Gone fishing. Forever, probably."'); } },
        { x: 38, y: 7, act: function* () { yield say(null, 'The east gate. Beyond it, the road out of Port-Petit.'); } },
      ],
    },

    outskirts: {
      title: 'The Outskirts',
      patch: set => { if (F.caveOpen) set(32, 4, 'O'); },
      warps: [
        { x: 0, y: 10, h: 2, to: 'town', tx: 38, ty: 8, keepY: true, face: 'left' },
        { x: 32, y: 4, to: 'guild', tx: 1, ty: 7, face: 'right', when: () => F.caveOpen },
      ],
      objects: [
        { x: 3, y: 9, act: function* () {
          yield say(null, 'EAST: Nothing. Absolutely nothing of interest. Turn back.');
          yield say(BEBE, 'Suspicious.', C_BEBE);
        } },
        { x: 19, y: 15, act: function* () {
          if (F.clue2) { yield say(null, '"Où trois coquilles regardent, la falaise écoute." Where three shells look, the cliff listens.'); return; }
          yield say(null, 'A mossy stone. Three deep claw marks are carved into its face.');
          yield say(null, 'Beneath them, an old inscription: "Où trois coquilles regardent, la falaise écoute."');
          yield say(BEBE, 'Where three shells look... the cliff listens.', C_BEBE);
          F.clue2 = true;
          yield* clueFound('A clue! Look for three shells somewhere nearby.', 'Find where three shells look');
        } },
        ...[[32, 7], [31, 9], [33, 9]].map(([x, y]) => ({ x, y, act: readShells })),
        { x: 32, y: 4, act: function* () {
          if (F.caveOpen) return;
          if (!F.clue3) { yield say(null, 'A cliff. It is extremely a cliff.'); return; }
          yield say(null, 'A thin draft whistles out of a crack in the rock.');
          yield say(BEBE, 'The cliff listens. Then let it hear me.', C_BEBE);
          yield say(null, 'Le Bébé braces his great claw against the stone, and pushes.');
          Sound.rumble(); G.shake = 1.2; G.shakeMag = 2;
          yield wait(1.2);
          F.caveOpen = true; setTile(32, 4, 'O');
          burst(T(32) + 8, T(5), '#8f7e6c', 24, 60);
          yield wait(0.4);
          yield* clueFound('A hidden passage opens in the cliff!', 'Enter the hidden passage');
        } },
      ],
    },

    guild: {
      title: 'The Hidden Guild',
      bg: '#1a1420',
      npcs: () => [
        { id: 'tranche', sprite: 'tranche', x: T(9), y: T(3), idleAnim: false, talk: function* () {
          if (!F.metTranche) return;
          yield say(TRANCHE, 'Choose, and walk. The path will tell you the rest.', C_TRANCHE);
        } },
      ],
      props: () => [
        { x: T(4), y: T(4) - 6, hidden: !!F.gotSword, draw(g, x, y) { if (!F.gotSword) drawSprite('baguette', 0, x, y - Math.sin(G.t * 2) * 1.5); } },
        { x: T(15), y: T(4) - 4, hidden: !!F.gotShield, draw(g, x, y) { if (!F.gotShield) drawSprite('croissant', 0, x, y - Math.sin(G.t * 2 + 1) * 1.5); } },
      ],
      warps: [
        { x: 0, y: 7, to: 'outskirts', tx: 32, ty: 5, face: 'down' },
        { x: 3, y: 13, w: 3, when: () => F.metTranche, deny: notYet, go: choosePath('sea') },
        { x: 14, y: 13, w: 3, when: () => F.metTranche, deny: notYet, go: choosePath('sky') },
      ],
      objects: [
        { x: 3, y: 11, w: 3, act: function* () { yield say(null, 'Cold seawater laps at the stone. The path slopes down... beneath the sea.'); } },
        { x: 14, y: 11, w: 3, act: function* () { yield say(null, 'A warm wind rises from below, smelling of clouds. Somehow, this path leads to the sky.'); } },
        { x: 6, y: 1, act: function* () { yield say(null, 'A guild banner. The emblem is a golden claw holding a loaf of bread.'); } },
        { x: 13, y: 1, act: function* () { yield say(null, 'A guild banner. It has been carefully mended many times.'); } },
      ],
      overlay(g, cx, cy) {
        // Soft torchlight glow
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const x of [3, 8, 11, 16]) for (const [r, a] of [[30, 0.03], [18, 0.04], [9, 0.05]]) {
          g.fillStyle = `rgba(255,150,50,${a})`; g.beginPath(); g.arc(T(x) + 8 - cx, T(1) + 6 - cy, r + Math.sin(G.t * 6 + x), 0, 7); g.fill();
        }
        g.restore();
      },
      onEnter() { if (!F.metTranche) run(meetTranche); },
    },
  },

  // ---------- Title screen ----------
  start() {
    Sound.init(); Sound.select();
    G.mode = 'play'; G.fade = 1; G.fadeTarget = 1;
    loadMap('cafe', 9, 3, 'down');
  },
  drawTitle(g, t) {
    const bands = ['#ffcf9a', '#ffd9ab', '#ffe3bd', '#fde9cc', '#dff0f7', '#c7e7f7'];
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 14, VW, 14); });
    g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(250, 64, 22, 0, 7); g.fill();
    for (let i = 0; i < 3; i++) {
      const x = ((t * (6 + i * 3) + i * 120) % 380) - 40, y = 18 + i * 16;
      g.fillStyle = '#ffffff'; g.fillRect(x, y, 34, 6); g.fillRect(x + 6, y - 4, 18, 4);
    }
    g.fillStyle = '#3b7dd8'; g.fillRect(0, 84, VW, 60);
    for (let i = 0; i < 26; i++) {
      const x = (i * 37 + t * 14) % (VW + 20) - 10, y = 90 + (i * 13) % 48;
      g.fillStyle = i % 3 ? '#6aa8ef' : '#2d63b4'; g.fillRect(Math.round(x), y, 8, 1);
    }
    g.fillStyle = '#ecd9a0'; g.fillRect(0, 140, VW, 40);
    g.fillStyle = '#cdb478'; for (let i = 0; i < 30; i++) g.fillRect((i * 53) % VW, 146 + (i * 7) % 30, 2, 1);
    g.fillStyle = '#fff6dc'; g.fillRect(0, 139 + Math.round(Math.sin(t * 2)), VW, 2);
    g.imageSmoothingEnabled = false;
    const bob = Math.round(Math.abs(Math.sin(t * 3)) * -3);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(130, 166, 64, 6);
    g.drawImage(SPR.bebe.frames[Math.floor(t * 3) % 2], 128, 104 + bob, 64, 64);
  },
  drawTitleUI() {
    uiShadowText('Le Bébé', VW / 2 + 1, 22, '#a82626', 24, 'center');
    uiText('a very serious adventure', VW / 2, 52, '#5a321a', 8, 'center');
    if (Math.floor(G.t * 2) % 2) uiShadowText('Press ENTER or tap to begin', VW / 2, 92, '#fff6dc', 8, 'center');
  },

  // ---------- Chapter-end screen ----------
  drawEnd(g, t) {
    G.endT += 1 / 60;
    const sea = G.endPath === 'sea';
    g.fillStyle = sea ? '#123a6e' : '#8ccaf2'; g.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 40; i++) {
      if (sea) {
        const x = (i * 47) % VW + Math.sin(t * 2 + i) * 3, y = VH - ((t * (12 + i % 5 * 6) + i * 31) % (VH + 10));
        g.fillStyle = i % 2 ? '#5f9be0' : '#a8d4ff'; g.fillRect(Math.round(x), Math.round(y), 2 + i % 2, 2 + i % 2);
      } else {
        const x = ((t * (5 + i % 4 * 4) + i * 61) % (VW + 60)) - 40, y = (i * 23) % VH;
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(x), y, 22 + i % 3 * 8, 4); g.fillRect(Math.round(x) + 5, y - 3, 12, 3);
      }
    }
    g.imageSmoothingEnabled = false;
    const fl = Math.sin(t * 2) * 4;
    g.drawImage(SPR.bebeArmed.frames[Math.floor(t * 3) % 2], 136, 112 + fl, 48, 44);
  },
  drawEndUI() {
    const sea = G.endPath === 'sea';
    uiShadowText('Chapitre deux', VW / 2, 20, '#fff6dc', 8, 'center');
    uiShadowText(sea ? 'Sous la Mer' : 'Dans le Ciel', VW / 2, 36, sea ? '#a8d4ff' : '#ffffff', 16, 'center');
    uiShadowText(sea ? 'Beneath the sea' : 'Into the skies', VW / 2, 60, '#fff6dc', 8, 'center');
    uiShadowText('The journey continues soon.', VW / 2, 82, '#fff6dc', 8, 'center');
    if (Math.floor(G.t * 2) % 2) uiShadowText('Press ENTER to return to the guild', VW / 2, 166, '#ffe066', 8, 'center');
  },
  afterEnd() {
    G.mode = 'play'; G.fade = 1; G.fadeTarget = 0;
    loadMap('guild', 9, 10, 'up');
  },
};
