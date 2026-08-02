// ---------------------------------------------------------------------------
// GAME FLOW
//
//   name  ->  [ chapter card -> checkpoint quiz -> parcours -> ... ] x7  ->  finale
//
// Progress is saved to the phone after every checkpoint and every chapter, so
// she can close the tab and come back exactly where she left off.
// ---------------------------------------------------------------------------

import { chapters, finale } from './data.js';
import { buildLevel, buildFinaleLevel } from './levels.js';
import { Game, VW, VH } from './engine.js';
import * as audio from './audio.js';

const SAVE_KEY = 'asha-birthday-game-v1';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const state = {
  name: '',
  chapterIndex: 0,
  answered: 0, // checkpoints answered in the current chapter
  hearts: 0,
  game: null,
  screen: 'name',
};

const input = { left: false, right: false, jump: false };

// --- saving --------------------------------------------------------------

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      name: state.name,
      chapterIndex: state.chapterIndex,
      answered: state.answered,
      hearts: state.hearts,
    }));
  } catch (e) { /* private browsing -- just play without saving */ }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

// --- screens -------------------------------------------------------------

function show(id) {
  for (const el of document.querySelectorAll('.screen')) el.classList.remove('on');
  if (id) $(id).classList.add('on');
  state.screen = id || 'play';
  $('hud').classList.toggle('on', !id);
  $('controls').classList.toggle('on', !id);
}

function setHud() {
  const ch = chapters[state.chapterIndex];
  $('hud-chapter').textContent = ch
    ? `${state.chapterIndex + 1}/${chapters.length}  ${ch.title}`
    : 'Home';
  $('hud-hearts').textContent = `♥ ${state.hearts}`;
}

// --- photos --------------------------------------------------------------

// Shows a photo, or a friendly placeholder if the file has not been uploaded.
function photoEl(file, caption) {
  const wrap = document.createElement('div');
  wrap.className = 'photo';
  if (!file) {
    wrap.classList.add('missing');
    wrap.innerHTML = `<span>photo<br>coming soon</span>`;
    return wrap;
  }
  const img = document.createElement('img');
  img.alt = caption || '';
  img.src = `photos/${file}`;
  img.onerror = () => {
    wrap.classList.add('missing');
    wrap.innerHTML = `<span>${file}<br>not uploaded yet</span>`;
  };
  wrap.appendChild(img);
  return wrap;
}

// A shut photo: what she sees before answering a reveal-after question.
function lockedEl() {
  const wrap = document.createElement('div');
  wrap.className = 'photo locked';
  wrap.innerHTML = '<span>?<small>answer to see the photo</small></span>';
  return wrap;
}

// --- chapter cards -------------------------------------------------------

function showCard({ kicker, title, body, button, onClick }) {
  $('card-kicker').textContent = kicker || '';
  $('card-title').textContent = title;
  $('card-body').textContent = body;
  const btn = $('card-btn');
  btn.textContent = button;
  btn.onclick = () => { audio.start(); onClick(); };
  show('screen-card');
}

function startChapter(index, resumeAtCheckpoint = 0) {
  state.chapterIndex = index;
  state.answered = resumeAtCheckpoint;
  const ch = chapters[index];
  showCard({
    kicker: [ch.year, ch.place].filter(Boolean).join(' · '),
    title: ch.title,
    body: ch.intro,
    button: resumeAtCheckpoint > 0 ? 'Keep going' : 'Let’s go',
    onClick: () => beginLevel(ch, resumeAtCheckpoint),
  });
}

function beginLevel(ch, fromCheckpoint) {
  const level = buildLevel(ch);

  const game = new Game(level, {
    onCheckpoint: (cp) => askQuestion(ch, cp),
    onDeath: () => audio.sfxDeath(),
    onJump: () => audio.sfxJump(),
    onHeart: () => { state.hearts++; setHud(); audio.sfxHeart(); save(); },
    onGoal: () => finishChapter(ch),
  });

  // Resuming: treat already-answered checkpoints as done and start at the last.
  for (let i = 0; i < fromCheckpoint && i < level.checkpoints.length; i++) {
    const cp = level.checkpoints[i];
    cp.reached = true;
    cp.answered = true;
    game.setRespawn(cp.x, cp.y);
    game.player.x = cp.x;
    game.player.y = cp.y;
    game.camX = Math.max(0, Math.min(level.length - VW, cp.x - VW * 0.38));
  }

  state.game = game;
  setHud();
  show(null);
  audio.playMusic();
}

// --- quiz ----------------------------------------------------------------

function askQuestion(ch, cp) {
  const q = ch.checkpoints[cp.index];
  audio.sfxCheckpoint();

  $('quiz-caption').textContent = q.caption || `${ch.title} · ${ch.year}`;
  $('quiz-question').textContent = q.question;
  $('quiz-feedback').textContent = '';
  $('quiz-feedback').className = 'feedback';

  const photos = $('quiz-photos');
  const files = (q.photos || []).filter(Boolean);
  // Some questions would be given away by their own photo, so those stay shut
  // until she gets it right -- the picture is the prize.
  const revealAfter = q.reveal === 'after';

  photos.className = 'photos' + (files.length === 1 ? ' single' : '');
  photos.innerHTML = '';
  if (revealAfter) {
    photos.appendChild(lockedEl());
  } else {
    photos.appendChild(photoEl(files[0], q.caption));
    if (files.length !== 1) photos.appendChild(photoEl(files[1], q.caption));
  }

  const cont = $('quiz-continue');
  cont.classList.remove('on');
  cont.onclick = null;

  const list = $('quiz-answers');
  list.innerHTML = '';
  let misses = 0;

  const finish = () => {
    show(null);
    state.game.paused = false;
  };

  q.answers.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = text;
    btn.onclick = () => {
      audio.start();
      if (i === q.correct) {
        btn.classList.add('right');
        audio.sfxRight();
        $('quiz-feedback').textContent = 'Yes! ♥';
        $('quiz-feedback').className = 'feedback good';
        for (const b of list.children) b.disabled = true;
        cp.answered = true;
        state.answered = Math.max(state.answered, cp.index + 1);
        save();

        if (revealAfter) {
          // Open the photo and let her look at it for as long as she likes.
          photos.innerHTML = '';
          files.forEach((f) => {
            const el = photoEl(f, q.caption);
            el.classList.add('revealing');
            photos.appendChild(el);
          });
          cont.classList.add('on');
          cont.onclick = finish;
        } else {
          setTimeout(finish, 900);
        }
      } else {
        misses++;
        btn.classList.add('wrong');
        btn.disabled = true;
        audio.sfxWrong();
        // Never a dead end: a nudge first, then the hint.
        $('quiz-feedback').textContent =
          misses === 1 ? 'Not quite — try again!' : `Hint: ${q.hint}`;
        $('quiz-feedback').className = 'feedback bad';
      }
    };
    list.appendChild(btn);
  });

  show('screen-quiz');
}

// --- chapter end ---------------------------------------------------------

function finishChapter(ch) {
  audio.sfxGoal();
  const next = state.chapterIndex + 1;
  state.chapterIndex = next;
  state.answered = 0;
  save();

  showCard({
    kicker: 'Chapter complete',
    title: ch.title,
    body: ch.outro,
    button: next < chapters.length ? 'Next chapter' : 'Go home',
    onClick: () => {
      if (next < chapters.length) startChapter(next);
      else startFinale();
    },
  });
}

// --- the finale ----------------------------------------------------------

function startFinale() {
  state.chapterIndex = chapters.length; // past the last chapter -- HUD says "Home"
  showCard({
    kicker: 'Today',
    title: 'Home',
    body: 'Two people are waiting for you at the end of this one, Mama.',
    button: 'Walk home',
    onClick: () => {
      const level = buildFinaleLevel();
      state.game = new Game(level, {
        onJump: () => audio.sfxJump(),
        onGoal: () => revealFinale(),
      });
      setHud();
      show(null);
      audio.playMusic();
    },
  });
}

function revealFinale() {
  audio.stopMusic();
  audio.sfxGoal();

  $('finale-title').textContent = finale.title;
  $('finale-message').textContent = finale.message;
  $('finale-hearts').textContent = `${state.hearts} hearts collected`;

  const wrap = $('finale-photo');
  wrap.innerHTML = '';
  wrap.appendChild(photoEl(finale.groupPhoto, 'Our family'));

  show('screen-finale');
  setTimeout(() => audio.playBirthdaySong(), 700);

  $('finale-replay').onclick = () => {
    clearSave();
    state.chapterIndex = 0;
    state.answered = 0;
    state.hearts = 0;
    audio.stopMusic();
    startChapter(0);
  };
  $('finale-song').onclick = () => audio.playBirthdaySong();
}

// --- title screen --------------------------------------------------------

function initTitle() {
  const saved = loadSave();
  const nameInput = $('name-input');

  if (saved && saved.name) {
    nameInput.value = saved.name;
    $('resume-row').classList.add('on');
    $('resume-btn').textContent =
      `Continue — chapter ${Math.min(saved.chapterIndex + 1, chapters.length)}`;
    $('resume-btn').onclick = () => {
      audio.start();
      state.name = saved.name;
      state.hearts = saved.hearts || 0;
      state.chapterIndex = saved.chapterIndex;
      state.answered = saved.answered || 0;
      if (saved.chapterIndex >= chapters.length) startFinale();
      else startChapter(saved.chapterIndex, saved.answered || 0);
    };
  }

  $('start-btn').onclick = () => {
    audio.start();
    state.name = (nameInput.value || 'Asha').trim();
    state.hearts = 0;
    state.answered = 0;
    clearSave();
    save();
    startChapter(0);
  };

  show('screen-name');
}

// --- input ---------------------------------------------------------------

function bindButton(el, key) {
  const on = (e) => { e.preventDefault(); audio.start(); input[key] = true; };
  const off = (e) => { e.preventDefault(); input[key] = false; };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

bindButton($('btn-left'), 'left');
bindButton($('btn-right'), 'right');
bindButton($('btn-jump'), 'jump');

const keyMap = {
  ArrowLeft: 'left', a: 'left',
  ArrowRight: 'right', d: 'right',
  ArrowUp: 'jump', ' ': 'jump', w: 'jump',
};
addEventListener('keydown', (e) => {
  const k = keyMap[e.key];
  if (k) { input[k] = true; e.preventDefault(); audio.start(); }
});
addEventListener('keyup', (e) => {
  const k = keyMap[e.key];
  if (k) { input[k] = false; e.preventDefault(); }
});

$('sound-btn').onclick = () => {
  const on = !audio.isEnabled();
  audio.setEnabled(on);
  $('sound-btn').textContent = on ? '🔊' : '🔇';
};

// --- canvas sizing -------------------------------------------------------

// The canvas shows at least VW x VH of the world, then grows into whatever
// extra room the screen has, so a tall phone gets a tall picture instead of a
// letterboxed strip. Pixels stay square -- only how much world we see changes.
function resize() {
  const sw = document.body.clientWidth;
  const total = document.body.clientHeight;
  if (!sw || !total) return;

  // Reserve a comfortable strip for the thumb controls, give the rest to the
  // game window, then let the window keep a landscape-ish shape.
  const controlsH = Math.min(200, Math.max(128, total * 0.24));
  const stageH = Math.max(120, total - controlsH);
  const maxAspect = 1.15; // height as a fraction of width

  const scale = Math.max(0.5, Math.min(sw / VW, stageH / (VW * maxAspect)));
  const w = Math.round(sw / scale);
  const h = Math.min(Math.round(stageH / scale), Math.round(w * maxAspect));

  canvas.width = w;
  canvas.height = h;
  ctx.imageSmoothingEnabled = false; // resizing the canvas resets this

  const cssW = Math.floor(w * scale);
  const cssH = Math.floor(h * scale);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  $('stage').style.height = `${cssH}px`;

  if (state.game) state.game.viewW = w;
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// --- main loop -----------------------------------------------------------

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.game) {
    window.__game = state.game; // handy when tweaking levels from the console
    state.game.viewW = canvas.width;
    state.game.update(dt, input);
    state.game.draw(ctx);
  } else {
    ctx.fillStyle = '#0e1230';
    ctx.fillRect(0, 0, VW, VH);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

initTitle();
