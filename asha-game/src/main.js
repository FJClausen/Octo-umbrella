// ---------------------------------------------------------------------------
// GAME FLOW
//
//   name  ->  [ chapter card -> checkpoint quiz -> parcours -> ... ] x7  ->  finale
//
// Progress is saved to the phone after every checkpoint and every chapter, so
// she can close the tab and come back exactly where she left off.
// ---------------------------------------------------------------------------

import { chapters, finale, animalNames } from './data.js';
import { buildLevel, buildFinaleLevel } from './levels.js';
import { Game, VW, VH } from './engine.js';
import * as audio from './audio.js';

const SAVE_KEY = 'asha-birthday-game-v1';
const TIMES_KEY = 'asha-birthday-times-v1';

// Falling in a pit costs ten seconds. It never ends the run -- it just nudges
// her down the leaderboard, so there is something to beat on a replay.
const PIT_PENALTY_MS = 10000;

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const state = {
  name: '',
  chapterIndex: 0,
  answered: 0, // checkpoints answered in the current chapter
  hearts: 0,
  companions: [],   // animals collected, in the order she met them
  timeMs: 0,        // time spent actually playing
  penaltyMs: 0,     // ten seconds for every tumble
  falls: 0,
  game: null,
  screen: 'name',
};

// Everyone she has earned so far. A chapter's animal is won by answering that
// chapter's last question, so it is only hers once the chapter's questions are
// all done -- earlier chapters count in full.
function companionsFor(chapterIndex, answeredInCurrent = 0) {
  const list = [];
  for (let i = 0; i < chapterIndex && i < chapters.length; i++) {
    if (chapters[i].animal) list.push(chapters[i].animal);
  }
  const current = chapters[chapterIndex];
  if (current && current.animal && answeredInCurrent >= current.checkpoints.length) {
    list.push(current.animal);
  }
  return list;
}

const input = { left: false, right: false, jump: false };

// --- saving --------------------------------------------------------------

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      name: state.name,
      chapterIndex: state.chapterIndex,
      answered: state.answered,
      hearts: state.hearts,
      companions: state.companions,
      timeMs: state.timeMs,
      penaltyMs: state.penaltyMs,
      falls: state.falls,
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

// mm:ss, which is all a run of this length needs.
function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function totalMs() {
  return state.timeMs + state.penaltyMs;
}

function setHud() {
  const ch = chapters[state.chapterIndex];
  $('hud-chapter').textContent = ch
    ? `${state.chapterIndex + 1}/${chapters.length}  ${ch.title}`
    : 'Home';
  $('hud-hearts').textContent = `♥ ${state.hearts}`;
  $('hud-time').textContent = clock(totalMs());
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

// Announces a new friend over the game itself, once the quiz card clears.
let toastTimer = null;
function showToast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('on');
  void el.offsetWidth;      // restart the animation
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
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

  state.companions = companionsFor(state.chapterIndex, fromCheckpoint);
  const game = new Game(level, {
    onCheckpoint: (cp) => askQuestion(ch, cp),
    onDeath: () => {
      audio.sfxDeath();
      state.falls++;
      state.penaltyMs += PIT_PENALTY_MS;
      setHud();
      save();
    },
    onJump: () => audio.sfxJump(),
    onHeart: () => { state.hearts++; setHud(); audio.sfxHeart(); save(); },
    onGoal: () => finishChapter(ch),
  }, state.companions);

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

  // Shuffled, so the right answer is not always sitting in the same place.
  // Fisher-Yates rather than a random sort comparator, which is biased.
  const options = q.answers.map((text, i) => ({ text, right: i === q.correct }));
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  options.forEach(({ text, right }) => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = text;
    btn.onclick = () => {
      audio.start();
      if (right) {
        btn.classList.add('right');
        audio.sfxRight();
        $('quiz-feedback').textContent = 'Yes! ♥';
        $('quiz-feedback').className = 'feedback good';
        for (const b of list.children) b.disabled = true;
        cp.answered = true;
        state.answered = Math.max(state.answered, cp.index + 1);

        // Answering a chapter's last question wins its animal, which joins the
        // parade immediately -- the array is shared with the running game.
        const last = cp.index === ch.checkpoints.length - 1;
        const joined = last && ch.animal && !state.companions.includes(ch.animal)
          ? ch.animal : null;
        if (joined) state.companions.push(joined);
        save();

        if (joined) {
          $('quiz-feedback').textContent = `Yes! ♥  ${animalNames[joined]} joined you!`;
          audio.sfxHeart();
        }

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
          setTimeout(finish, joined ? 1700 : 900);
        }
        if (joined) showToast(`${animalNames[joined]} joined you!`);
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
      }, companionsFor(chapters.length)); // the whole parade comes home
      setHud();
      show(null);
      audio.playMusic();
    },
  });
}

// --- the scoreboard ------------------------------------------------------

function loadTimes() {
  try { return JSON.parse(localStorage.getItem(TIMES_KEY)) || []; } catch (e) { return []; }
}

// Records this run and returns the table, marking which row is hers.
function recordTime(entry) {
  const times = loadTimes();
  times.push(entry);
  times.sort((a, b) => a.total - b.total);
  try { localStorage.setItem(TIMES_KEY, JSON.stringify(times.slice(0, 10))); } catch (e) {}
  return times;
}

function showScore() {
  const total = totalMs();
  const entry = {
    name: state.name || 'Asha',
    total,
    falls: state.falls,
    hearts: state.hearts,
    at: Date.now(),
  };
  const times = recordTime(entry);
  const place = times.indexOf(entry);

  const tumbles = state.falls === 0
    ? 'Not a single tumble. Showing off.'
    : `${state.falls} tumble${state.falls === 1 ? '' : 's'} along the way (+${state.falls * 10}s)`;

  $('finale-score').innerHTML =
    `<span class="big">${clock(total)}</span>` +
    `<span class="small">${tumbles}<br>` +
    `${state.hearts} heart${state.hearts === 1 ? '' : 's'} · ` +
    `${state.companions.length} friend${state.companions.length === 1 ? '' : 's'} picked up` +
    `</span>`;

  const medals = ['🥇', '🥈', '🥉'];
  const rows = times.slice(0, 3).map((t, i) => {
    const mine = t === entry ? ' class="you"' : '';
    return `<li${mine}><span>${medals[i]} ${t.name}</span><span>${clock(t.total)}</span></li>`;
  }).join('');

  $('finale-board').innerHTML =
    `<h3>${place < 3 ? 'You made the podium!' : 'Fastest runs home'}</h3><ol>${rows}</ol>`;
}

function revealFinale() {
  audio.stopMusic();
  audio.sfxGoal();

  $('finale-title').textContent = finale.title;
  $('finale-message').textContent = finale.message;
  $('finale-hearts').textContent = `${state.hearts} hearts collected`;
  showScore();

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
    state.companions = [];
    state.timeMs = 0;
    state.penaltyMs = 0;
    state.falls = 0;
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
      state.companions = saved.companions ||
        companionsFor(saved.chapterIndex, saved.answered || 0);
      state.timeMs = saved.timeMs || 0;
      state.penaltyMs = saved.penaltyMs || 0;
      state.falls = saved.falls || 0;
      if (saved.chapterIndex >= chapters.length) startFinale();
      else startChapter(saved.chapterIndex, saved.answered || 0);
    };
  }

  $('start-btn').onclick = () => {
    audio.start();
    state.name = (nameInput.value || 'Asha').trim();
    state.hearts = 0;
    state.answered = 0;
    state.companions = [];
    state.timeMs = 0;
    state.penaltyMs = 0;
    state.falls = 0;
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

let lastShownSecond = -1;
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.game) {
    window.__game = state.game; // handy when tweaking levels from the console
    state.game.viewW = canvas.width;
    if (state.screen === 'play' && !state.game.paused) {
      state.timeMs += dt * 1000;
      if (Math.floor(state.timeMs / 1000) !== lastShownSecond) {
        lastShownSecond = Math.floor(state.timeMs / 1000);
        setHud();
      }
    }
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
