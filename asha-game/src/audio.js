// ---------------------------------------------------------------------------
// SOUND
//
// Everything is synthesised with the Web Audio API -- no audio files to host,
// and nothing to download on a phone. Browsers only allow sound after a tap,
// so start() is called from the first button press.
// ---------------------------------------------------------------------------

let ctx = null;
let master = null;
let musicGain = null;
let loopTimer = null;
let enabled = true;

export function start() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.18;
  musicGain.connect(master);
}

export function setEnabled(on) {
  enabled = on;
  if (master) master.gain.value = on ? 0.5 : 0;
}

export function isEnabled() {
  return enabled;
}

function tone(freq, at, dur, type = 'square', gain = 0.2, dest = null) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(dest || master);
  o.start(at);
  o.stop(at + dur + 0.05);
}

// note name -> frequency
const N = {};
(() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let oct = 2; oct <= 6; oct++) {
    names.forEach((n, i) => {
      N[n + oct] = 440 * Math.pow(2, (i - 9) / 12 + (oct - 4));
    });
  }
})();

// --- sound effects -------------------------------------------------------

export function sfxJump() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(N['C5'], t, 0.09, 'square', 0.14);
  tone(N['G5'], t + 0.05, 0.09, 'square', 0.12);
}

export function sfxHeart() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(N['E5'], t, 0.09, 'triangle', 0.2);
  tone(N['G5'], t + 0.07, 0.09, 'triangle', 0.2);
  tone(N['C6'], t + 0.14, 0.16, 'triangle', 0.2);
}

export function sfxDeath() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(N['G4'], t, 0.12, 'square', 0.16);
  tone(N['E4'], t + 0.1, 0.12, 'square', 0.16);
  tone(N['C4'], t + 0.2, 0.28, 'square', 0.16);
}

export function sfxRight() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [N['C5'], N['E5'], N['G5'], N['C6']].forEach((f, i) =>
    tone(f, t + i * 0.075, 0.16, 'square', 0.18)
  );
}

export function sfxWrong() {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(N['D#4'], t, 0.14, 'sawtooth', 0.1);
  tone(N['D4'], t + 0.12, 0.2, 'sawtooth', 0.1);
}

export function sfxCheckpoint() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [N['G4'], N['C5'], N['E5']].forEach((f, i) =>
    tone(f, t + i * 0.09, 0.22, 'triangle', 0.2)
  );
}

export function sfxGoal() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [N['C5'], N['D5'], N['E5'], N['G5'], N['C6']].forEach((f, i) =>
    tone(f, t + i * 0.1, 0.3, 'square', 0.2)
  );
}

// --- background music ----------------------------------------------------

// A gentle 8-bar loop that suits every chapter.
const melody = [
  ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
  ['F5', 1], ['A5', 1], ['G5', 2],
  ['D5', 1], ['F5', 1], ['A5', 1], ['F5', 1],
  ['E5', 1], ['G5', 1], ['C5', 2],
];
const bass = ['C3', 'C3', 'F3', 'F3', 'D3', 'D3', 'C3', 'G3'];

export function playMusic() {
  if (!ctx || loopTimer) return;
  const beat = 0.24;
  const schedule = () => {
    const t0 = ctx.currentTime + 0.05;
    let t = t0;
    for (const [note, len] of melody) {
      tone(N[note], t, beat * len * 0.85, 'square', 0.09, musicGain);
      t += beat * len;
    }
    bass.forEach((note, i) => {
      tone(N[note], t0 + i * beat * 2, beat * 1.6, 'triangle', 0.1, musicGain);
    });
    return t - t0;
  };
  const dur = schedule();
  loopTimer = setInterval(schedule, dur * 1000);
}

export function stopMusic() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}

// --- the birthday song ---------------------------------------------------

export function playBirthdaySong() {
  if (!ctx) return;
  stopMusic();
  const b = 0.34;
  const song = [
    ['C5', 0.75], ['C5', 0.25], ['D5', 1], ['C5', 1], ['F5', 1], ['E5', 2],
    ['C5', 0.75], ['C5', 0.25], ['D5', 1], ['C5', 1], ['G5', 1], ['F5', 2],
    ['C5', 0.75], ['C5', 0.25], ['C6', 1], ['A5', 1], ['F5', 1], ['E5', 1], ['D5', 2],
    ['A#5', 0.75], ['A#5', 0.25], ['A5', 1], ['F5', 1], ['G5', 1], ['F5', 2],
  ];
  let t = ctx.currentTime + 0.15;
  for (const [note, len] of song) {
    tone(N[note], t, b * len * 0.9, 'square', 0.22);
    tone(N[note.replace(/\d/, (d) => +d - 1)] || N['C4'], t, b * len * 0.9, 'triangle', 0.08);
    t += b * len;
  }
  return t - ctx.currentTime;
}
