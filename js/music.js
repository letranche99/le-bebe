// ============================================================
// MUSIC: a tiny chiptune sequencer plus the game's songs.
// Songs are written as text. Each token is one step:
//   C4, F#5, Bb3  = a note        A3+C4+E4 = a chord
//   -             = hold the previous note
//   .             = rest          |  = bar line (ignored, just for reading)
// Drums: k = kick, s = snare, h = hat, b = brush. Combine with + (k+h).
// A channel shorter than the song simply loops (handy for drum beats).
// ============================================================

const SONGS = {
  // Café Coquille: swung jazz in F. ii-V-I with a walking bass.
  cafe: {
    bpm: 112, div: 2, swing: 0.32, bars: 8, steps: 8,
    channels: [
      ['lead', `. D5 F5 A5 G5 F5 D5 . | E5 - C5 Bb4 G4 - . . | A4 - C5 E5 - - D5 . | F#5 - E5 D5 C5 A4 F#4 - |
                . Bb4 D5 F5 A5 - G5 F5 | E5 G5 Bb5 - A5 G5 E5 C5 | D5 - C5 A4 F4 - D4 F4 | E4 G4 Bb4 C5 E5 - . .`],
      ['bass', `G2 - Bb2 - D3 - F3 - | C3 - E3 - G3 - Bb2 - | F2 - A2 - C3 - E3 - | D3 - C3 - A2 - F#2 - |
                G2 - A2 - Bb2 - B2 - | C3 - D3 - E3 - Bb2 - | F2 - A2 - D3 - C3 - | C3 - E3 - G3 - E3 -`],
      ['pluck', `Bb3+D4+F4 . . Bb3+D4+F4 . . . . | Bb3+E4+G4 . . Bb3+E4+G4 . . . . | A3+C4+E4 . . A3+C4+E4 . . . . | A3+C4+F#4 . . A3+C4+F#4 . . . . |
                 Bb3+D4+F4 . . Bb3+D4+F4 . . . . | Bb3+E4+G4 . . Bb3+E4+G4 . . . . | A3+C4+D4 . . A3+C4+D4 . . . . | Bb3+E4+G4 . . Bb3+E4+G4 . . . .`],
      ['drums', `k . h h b . h h`],
    ],
  },

  // Port-Petit: a sea-shanty jig in G, 6/8, with accordion oom-pah.
  town: {
    bpm: 96, div: 3, swing: 0, bars: 16, steps: 6,
    channels: [
      ['flute', `G4 B4 D5 G5 - D5 | E5 - G5 E5 D5 C5 | B4 - D5 G4 - B4 | A4 B4 C5 D5 - - |
                 G4 B4 D5 G5 - B5 | A5 G5 E5 C5 - E5 | D5 - F#5 A5 G5 F#5 | G5 - - G4 . . |
                 B4 - E5 G5 - E5 | C5 - E5 G5 - E5 | D5 - G5 B5 - G5 | A5 - F#5 D5 - A4 |
                 E5 F#5 G5 B5 - G5 | A5 G5 E5 C5 - A4 | D5 - A4 F#4 - A4 | G4 - - . . .`],
      ['bass', `G2 . . D3 . . | C3 . . G2 . . | G2 . . D3 . . | D3 . . A2 . . |
                G2 . . D3 . . | C3 . . G2 . . | D3 . . A2 . . | G2 . . D3 . . |
                E2 . . B2 . . | C3 . . G2 . . | G2 . . D3 . . | D3 . . A2 . . |
                E2 . . B2 . . | C3 . . G2 . . | D3 . . A2 . . | G2 . . D3 . .`],
      ['acc', `. G3+B3+D4 G3+B3+D4 . G3+B3+D4 G3+B3+D4 | . G3+C4+E4 G3+C4+E4 . G3+C4+E4 G3+C4+E4 | . G3+B3+D4 G3+B3+D4 . G3+B3+D4 G3+B3+D4 | . F#3+A3+D4 F#3+A3+D4 . F#3+A3+D4 F#3+A3+D4 |
               . G3+B3+D4 G3+B3+D4 . G3+B3+D4 G3+B3+D4 | . G3+C4+E4 G3+C4+E4 . G3+C4+E4 G3+C4+E4 | . F#3+A3+D4 F#3+A3+D4 . F#3+A3+D4 F#3+A3+D4 | . G3+B3+D4 G3+B3+D4 . G3+B3+D4 G3+B3+D4 |
               . G3+B3+E4 G3+B3+E4 . G3+B3+E4 G3+B3+E4 | . G3+C4+E4 G3+C4+E4 . G3+C4+E4 G3+C4+E4 | . G3+B3+D4 G3+B3+D4 . G3+B3+D4 G3+B3+D4 | . F#3+A3+D4 F#3+A3+D4 . F#3+A3+D4 F#3+A3+D4 |
               . G3+B3+E4 G3+B3+E4 . G3+B3+E4 G3+B3+E4 | . G3+C4+E4 G3+C4+E4 . G3+C4+E4 G3+C4+E4 | . F#3+A3+D4 F#3+A3+D4 . F#3+A3+D4 F#3+A3+D4 | . G3+B3+D4 G3+B3+D4 . G3+B3+D4 G3+B3+D4`],
      ['drums', `k . h s . h`],
    ],
  },

  // The Outskirts: a driving folk-fiddle tune in D minor.
  outskirts: {
    bpm: 132, div: 2, swing: 0.1, bars: 8, steps: 8,
    channels: [
      ['lead', `D5 - A4 D5 F5 - E5 D5 | E5 - C5 E5 G5 - F5 E5 | D5 - Bb4 D5 F5 - E5 D5 | C5 D5 E5 - G5 - - . |
                A5 - F5 A5 D6 - A5 F5 | G5 - E5 G5 C6 - G5 E5 | F5 E5 D5 - Bb4 D5 F5 - | E5 - C#5 - A4 - . .`],
      ['bass', `D2 . D3 D2 . D2 D3 . | C2 . C3 C2 . C2 C3 . | Bb1 . Bb2 Bb1 . Bb1 Bb2 . | C2 . C3 C2 . C2 C3 . |
                D2 . D3 D2 . D2 D3 . | C2 . C3 C2 . C2 C3 . | Bb1 . Bb2 Bb1 . Bb1 Bb2 . | A1 . A2 A1 . A1 A2 .`],
      ['acc', `D4+F4+A4 - - - - - - - | C4+E4+G4 - - - - - - - | Bb3+D4+F4 - - - - - - - | C4+E4+G4 - - - - - - - |
               D4+F4+A4 - - - - - - - | C4+E4+G4 - - - - - - - | Bb3+D4+F4 - - - - - - - | A3+C#4+E4 - - - - - - -`],
      ['drums', `k h s h k k s h`],
    ],
  },

  // The Hidden Guild: slow, smoky minor jazz in C minor.
  guild: {
    bpm: 76, div: 2, swing: 0.3, bars: 8, steps: 8,
    channels: [
      ['vibe', `G4 - - Eb5 - D5 C5 - | Eb5 - - - C5 - . . | Ab4 - C5 - Eb5 - D5 C5 | B4 - - - D5 - F5 - |
                G5 - - F5 Eb5 - D5 - | C5 - Eb5 - G5 - - . | F5 - Eb5 D5 - C5 Ab4 - | B4 - - - G4 - . .`],
      ['bass', `C2 - - - G2 - - - | Ab2 - - - Eb2 - - - | F2 - - - C3 - - - | G2 - - - B2 - - - |
                C2 - - - G2 - - - | Ab2 - - - Eb3 - - - | D2 - - - Ab2 - - - | G2 - - - G2 - - -`],
      ['pad', `Eb3+G3+Bb3+D4 - - - - - - - | Eb3+G3+C4 - - - - - - - | Eb3+Ab3+C4 - - - - - - - | F3+B3+D4 - - - - - - - |
               Eb3+G3+Bb3+D4 - - - - - - - | Eb3+G3+C4 - - - - - - - | F3+Ab3+C4 - - - - - - - | F3+B3+D4 - - - - - - -`],
      ['drums', `k . b h . . b h`],
    ],
  },
};

// Which song plays on the title and chapter screens
const SCREEN_MUSIC = { title: 'town', end: 'guild' };

// ---------------- Instruments ----------------
const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return null;
  const midi = 12 * (+m[3] + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
function voice(t, freq, dur, type, vol, attack = 0.01, release = 0.06, detune = 0, filter = 0) {
  const ac = Sound.ac, o = ac.createOscillator(), v = ac.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  v.gain.setValueAtTime(0.0001, t);
  v.gain.linearRampToValueAtTime(vol, t + attack);
  v.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
  v.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  let out = o;
  if (filter) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); out = f; }
  out.connect(v); v.connect(Music.bus);
  o.start(t); o.stop(t + dur + release + 0.05);
}
let noiseBuf = null;
function noise(t, dur, vol, type, freq) {
  const ac = Sound.ac;
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
  v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(v); v.connect(Music.bus); s.start(t); s.stop(t + dur + 0.02);
}
const INST = {
  lead: (t, fs, d) => fs.forEach(f => voice(t, f, d * 0.9, 'square', 0.028, 0.005, 0.04)),
  flute: (t, fs, d) => fs.forEach(f => { voice(t, f, d * 0.92, 'triangle', 0.09, 0.02, 0.05); voice(t, f * 2, d * 0.6, 'square', 0.008, 0.02, 0.04); }),
  vibe: (t, fs, d) => fs.forEach(f => { voice(t, f, d + 0.3, 'triangle', 0.08, 0.005, 0.4); voice(t, f * 4, 0.12, 'sine', 0.015, 0.002, 0.08); }),
  bass: (t, fs, d) => fs.forEach(f => voice(t, f, d * 0.85, 'triangle', 0.14, 0.005, 0.05)),
  pluck: (t, fs) => fs.forEach(f => voice(t, f, 0.09, 'square', 0.014, 0.003, 0.08)),
  acc: (t, fs, d) => fs.forEach(f => { voice(t, f, d * 0.85, 'sawtooth', 0.012, 0.02, 0.05, -6, 1600); voice(t, f, d * 0.85, 'sawtooth', 0.012, 0.02, 0.05, 6, 1600); }),
  pad: (t, fs, d) => fs.forEach(f => voice(t, f, d, 'sine', 0.03, 0.25, 0.4)),
  drums: (t, hits) => hits.forEach(h => {
    if (h === 'k') { const ac = Sound.ac, o = ac.createOscillator(), v = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      v.gain.setValueAtTime(0.16, t); v.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(v); v.connect(Music.bus); o.start(t); o.stop(t + 0.16); }
    if (h === 's') noise(t, 0.11, 0.05, 'bandpass', 1800);
    if (h === 'h') noise(t, 0.03, 0.025, 'highpass', 7000);
    if (h === 'b') noise(t, 0.16, 0.025, 'bandpass', 3000);
  }),
};

// ---------------- Sequencer ----------------
function compileSong(def) {
  const len = def.bars * def.steps, events = Array.from({ length: len }, () => []);
  for (const [inst, pattern] of def.channels) {
    const toks = pattern.split(/\s+/).filter(x => x && x !== '|');
    for (let i = 0; i < len; i++) {
      const tok = toks[i % toks.length];
      if (tok === '.' || tok === '-') continue;
      let dur = 1; while (toks[(i + dur) % toks.length] === '-' && dur < toks.length) dur++;
      const parts = tok.split('+');
      events[i].push({ inst, parts: inst === 'drums' ? parts : parts.map(noteFreq).filter(Boolean), dur });
    }
  }
  return { len, events, stepDur: 60 / def.bpm / def.div, swing: def.div === 2 ? def.swing : 0 };
}
const Music = {
  bus: null, name: null, song: null, step: 0, next: 0, volume: 0.7,
  ensure() { if (Sound.ac && !this.bus) { this.bus = Sound.ac.createGain(); this.bus.gain.value = this.volume; this.bus.connect(Sound.ac.destination); } },
  play(name) {
    if (this.name === name) return;
    this.name = name; this.song = SONGS[name] ? compileSong(SONGS[name]) : null; this.step = 0;
    if (Sound.ac) this.next = Sound.ac.currentTime + 0.08;
  },
  stop() { this.name = null; this.song = null; },
  update() {
    this.ensure();
    const ac = Sound.ac; if (!ac || !this.bus) return;
    this.bus.gain.value = Sound.muted ? 0 : this.volume;
    if (!this.song) return;
    if (this.next < ac.currentTime - 0.25) this.next = ac.currentTime + 0.05;
    while (this.next < ac.currentTime + 0.2) {
      const s = this.song, i = this.step % s.len, sw = (i % 2) ? s.swing * s.stepDur : 0;
      for (const ev of s.events[i]) INST[ev.inst](this.next + sw, ev.parts, ev.dur * s.stepDur);
      this.next += s.stepDur; this.step++;
    }
  },
};
