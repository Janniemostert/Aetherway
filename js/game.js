import {
  createGame, playChain, flow, findChains, usePower, powerReady, powerArea, touching,
  blastFor, blastCells, chainIsValid, MIN_CHAIN, POWERS,
} from './engine.js';
import { BOOKS, LEVELS, starsFor, timeLimit } from './levels.js';
import { BoardView } from './render.js';
import { Sfx } from './audio.js';

const SAVE_KEY = 'aetherway.save.v2';
const HINT_DELAY_MS = 9000;
const FLOW_TICK_MS = 85;
const WIN_PAUSE_MS = 950;
// A drag joins a rune only near its centre, so moving past a corner does not grab a diagonal.
const LINK_RADIUS = 0.44;
const POWER_HELP = {
  spade: 'Tap a tile or boulder to remove it',
  bomb: 'Tap the board to drop the bomb',
  swap: 'Tap two touching runes to trade them',
};
const $ = (id) => document.getElementById(id);

// Storage can throw in private browsing, so progress falls back to memory.
function loadSave() {
  const fallback = { stars: {}, best: {}, sound: true, timed: false, tips: {}, installHidden: false };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') };
  } catch {
    return fallback;
  }
}

const save = loadSave();
function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Progress lasts for this session only.
  }
}

const sfx = new Sfx();
sfx.enabled = save.sound;

const view = new BoardView($('board'), { onStep });

let level = null;
let state = null;
let busy = false;
let paused = false;
let ended = false;
let chain = [];
let dragging = false;
let lastPoint = null;
let targeting = null;
let swapFirst = -1;
let timeLeft = 0;
let lastTick = 0;
let hintTimer = 0;
let clockTimer = 0;
let flowTimer = 0;

const gemId = (i) => state.cells[i].gem.id;

/* ---------- Navigation ---------- */

function showScreen(id) {
  document.body.dataset.screen = id;
  for (const screen of document.querySelectorAll('.screen')) screen.hidden = screen.id !== id;
  if (id === 'game') {
    view.resize();
    view.start();
  } else {
    view.stop();
    clearInterval(clockTimer);
    clearInterval(flowTimer);
    clearTimeout(hintTimer);
  }
}

function isUnlocked(lv) {
  const i = LEVELS.indexOf(lv);
  return i === 0 || !!save.stars[LEVELS[i - 1].id];
}

function totalStars() {
  return Object.values(save.stars).reduce((a, b) => a + b, 0);
}

function renderMap() {
  const host = $('books');
  host.replaceChildren();
  BOOKS.forEach((book, bookIndex) => {
    const levels = LEVELS.filter((lv) => lv.bookIndex === bookIndex);
    const open = isUnlocked(levels[0]);
    const card = document.createElement('section');
    card.className = 'book';
    card.dataset.book = book.id;
    if (!open) card.classList.add('locked');

    const title = document.createElement('h2');
    title.textContent = book.name;
    const stars = levels.reduce((sum, lv) => sum + (save.stars[lv.id] ?? 0), 0);
    const count = document.createElement('p');
    count.className = 'book-meta';
    count.textContent = open ? `${stars} of ${levels.length * 3} stars` : `Finish ${BOOKS[bookIndex - 1].name} to open`;

    const grid = document.createElement('div');
    grid.className = 'level-grid';
    for (const lv of levels) {
      const button = document.createElement('button');
      const got = save.stars[lv.id] ?? 0;
      button.className = 'level-node';
      button.disabled = !isUnlocked(lv);
      button.setAttribute('aria-label', `${lv.name}, level ${lv.index + 1}, ${got} stars`);
      const number = document.createElement('span');
      number.textContent = lv.index + 1;
      const mark = document.createElement('small');
      mark.textContent = got ? '★'.repeat(got) : '';
      button.append(number, mark);
      button.addEventListener('click', () => startLevel(lv));
      grid.append(button);
    }
    card.append(title, count, grid);
    host.append(card);
  });
  $('total-stars').textContent = `★ ${totalStars()} / ${LEVELS.length * 3}`;
}

/* ---------- Level flow ---------- */

function startLevel(lv) {
  level = lv;
  state = createGame(lv);
  busy = false;
  paused = false;
  ended = false;
  chain = [];
  dragging = false;
  targeting = null;
  swapFirst = -1;
  const book = BOOKS[lv.bookIndex];
  $('game').dataset.book = book.id;
  $('level-book').textContent = book.name;
  $('level-name').textContent = lv.name;
  timeLeft = timeLimit(lv);
  closeOverlay();
  showScreen('game');
  view.load(state, book.id);
  setupPowers();
  setStatus('');
  updateHud();
  armHint();
  clearInterval(clockTimer);
  clearInterval(flowTimer);
  lastTick = performance.now();
  clockTimer = setInterval(tickClock, 250);
  flowTimer = setInterval(tickFlow, FLOW_TICK_MS);
  if (lv.tip && !save.tips[lv.id]) {
    save.tips[lv.id] = true;
    persist();
    paused = true;
    showOverlay({
      title: lv.name,
      body: lv.tip,
      actions: [{ label: 'Play', primary: true, run: resume }],
    });
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function setStatus(text) {
  $('status').textContent = text;
}

function updateHud() {
  $('counter-label').textContent = save.timed ? 'Time' : 'Moves';
  $('counter').textContent = save.timed ? formatTime(timeLeft) : `${state.moves}`;
  $('counter').classList.toggle('urgent', save.timed && timeLeft <= 15);
  $('par').textContent = save.timed ? '' : `★★★ ${level.par}`;
  $('score').textContent = state.score.toLocaleString('en-ZA');
  updatePowers(state.charges);
}

function setupPowers() {
  for (const button of document.querySelectorAll('.power')) {
    const available = button.dataset.power in state.charges;
    button.classList.toggle('empty', !available);
    button.classList.remove('ready', 'active', 'ready-seen');
    button.style.setProperty('--charge', '0%');
    button.disabled = !available;
  }
}

function updatePowers(charges) {
  for (const button of document.querySelectorAll('.power')) {
    const name = button.dataset.power;
    if (!(name in charges)) continue;
    const share = charges[name] / POWERS[name].need;
    button.style.setProperty('--charge', `${Math.round(share * 100)}%`);
    button.classList.toggle('ready', share >= 1);
    button.classList.toggle('active', targeting === name);
    button.setAttribute('aria-disabled', String(share < 1));
  }
}

// Keeps the HUD and sound in step with the animation rather than jumping to the final result.
function onStep(step) {
  if (step.type !== 'clear') return;
  if (step.path.length) sfx.clear(step.path.length);
  if (step.blast) setTimeout(() => sfx.explosion(step.blast.r), step.path.length * 30);
  if (step.beams.length) sfx.beam();
  if (step.cracks.length) sfx.crack();
  $('score').textContent = step.score.toLocaleString('en-ZA');
  updatePowers(step.charges);
  const nowReady = Object.keys(step.charges).some((name) => step.charges[name] >= POWERS[name].need && !$(`power-${name}`).classList.contains('ready-seen'));
  for (const name of Object.keys(step.charges)) {
    $(`power-${name}`).classList.toggle('ready-seen', step.charges[name] >= POWERS[name].need);
  }
  if (nowReady) sfx.charged();
}

async function runSteps(steps) {
  busy = true;
  view.setHint(null);
  await view.play(steps);
  busy = false;
  updateHud();
  armHint();
}

async function tickFlow() {
  if (busy || paused || ended || dragging) return;
  const tick = flow(state);
  if (!tick) return;
  view.applyFlow(tick);
  if (tick.litAltars.length) {
    sfx.altar();
    navigator.vibrate?.(30);
  }
  if (tick.steps.length) await runSteps(tick.steps);
  if (state.won) finishWin();
}

function finishWin() {
  ended = true;
  clearInterval(clockTimer);
  clearInterval(flowTimer);
  clearTimeout(hintTimer);
  const stars = save.timed
    ? (timeLeft >= timeLimit(level) * 0.4 ? 3 : timeLeft >= timeLimit(level) * 0.15 ? 2 : 1)
    : starsFor(level, state.moves);
  save.stars[level.id] = Math.max(save.stars[level.id] ?? 0, stars);
  save.best[level.id] = Math.max(save.best[level.id] ?? 0, state.score);
  persist();
  sfx.win();
  view.celebrate(state.cells.flatMap((c, i) => (c.alt ? [i] : [])));
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  const finishedBook = !next || next.bookIndex !== level.bookIndex;
  const body = !next
    ? 'All four books are restored. The last flame burns again.'
    : finishedBook
      ? `${BOOKS[level.bookIndex].name} is restored. ${BOOKS[next.bookIndex].name} is now open.`
      : `Finished in ${state.moves} moves. Score ${state.score.toLocaleString('en-ZA')}.`;
  setTimeout(() => {
    showOverlay({
      title: 'Altars lit',
      stars,
      body,
      actions: [
        next && { label: 'Next level', primary: true, run: () => startLevel(next) },
        { label: 'Replay', run: () => startLevel(level) },
        { label: 'Book map', run: goMap },
      ].filter(Boolean),
    });
  }, WIN_PAUSE_MS);
}

function finishLose() {
  ended = true;
  clearInterval(clockTimer);
  clearInterval(flowTimer);
  clearTimeout(hintTimer);
  cancelChain();
  sfx.lose();
  showOverlay({
    title: 'Time ran out',
    body: 'The energy faded before it reached the altars.',
    actions: [
      { label: 'Try again', primary: true, run: () => startLevel(level) },
      { label: 'Book map', run: goMap },
    ],
  });
}

function tickClock() {
  const now = performance.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  if (paused || ended || !save.timed) return;
  timeLeft -= dt;
  $('counter').textContent = formatTime(timeLeft);
  $('counter').classList.toggle('urgent', timeLeft <= 15);
  if (timeLeft <= 0 && !busy) finishLose();
}

function goMap() {
  closeOverlay();
  renderMap();
  showScreen('map');
}

function pause() {
  if (ended || paused) return;
  paused = true;
  cancelChain();
  view.setHint(null);
  clearTimeout(hintTimer);
  showOverlay({
    title: 'Paused',
    body: 'Chains of 5 or more explode, and longer chains make bigger explosions.',
    actions: [
      { label: 'Resume', primary: true, run: resume },
      { label: 'Restart level', run: () => startLevel(level) },
      { label: 'Book map', run: goMap },
    ],
  });
}

function resume() {
  paused = false;
  lastTick = performance.now();
  closeOverlay();
  armHint();
}

/* ---------- Hints ---------- */

function armHint() {
  clearTimeout(hintTimer);
  view.setHint(null);
  hintTimer = setTimeout(showHint, HINT_DELAY_MS);
}

function showHint() {
  if (busy || paused || ended || dragging || targeting) return;
  const chains = findChains(state);
  if (!chains.length) return;
  const longest = chains.reduce((a, b) => (b.length > a.length ? b : a));
  view.setHint(longest, gemId);
}

/* ---------- Overlay ---------- */

function showOverlay({ title, body, stars, actions }) {
  $('overlay-title').textContent = title;
  $('overlay-body').textContent = body;
  const row = $('overlay-stars');
  row.hidden = stars === undefined;
  row.textContent = stars === undefined ? '' : '★'.repeat(stars) + '☆'.repeat(3 - stars);
  row.setAttribute('aria-label', `${stars ?? 0} of 3 stars`);
  const host = $('overlay-actions');
  host.replaceChildren();
  actions.forEach((action) => {
    const button = document.createElement('button');
    button.className = action.primary ? 'btn primary' : 'btn';
    button.textContent = action.label;
    button.addEventListener('click', action.run);
    host.append(button);
  });
  $('overlay').hidden = false;
}

function closeOverlay() {
  $('overlay').hidden = true;
}

/* ---------- Dragging chains ---------- */

function showChain() {
  const tail = chain[chain.length - 1];
  const size = blastFor(chain.length);
  view.setChain(chain, gemId, size ? blastCells(state, tail, size) : null);
  setStatus(chain.length >= 5 ? `Chain of ${chain.length}: explosion ready` : chain.length ? `Chain of ${chain.length}` : '');
}

function cancelChain() {
  chain = [];
  dragging = false;
  lastPoint = null;
  view.setChain([]);
  setStatus('');
}

function extendChain(x, y) {
  const { idx, dist } = view.hitTest(x, y);
  if (idx < 0 || dist > LINK_RADIUS) return;
  const tail = chain[chain.length - 1];
  if (idx === tail) return;
  if (chain[chain.length - 2] === idx) {
    chain.pop();
    sfx.unlink();
    showChain();
    return;
  }
  const gem = state.cells[idx].gem;
  if (!gem || chain.includes(idx) || !touching(state, tail, idx)) return;
  if (gem.c !== state.cells[tail].gem.c) return;
  chain.push(idx);
  sfx.link(chain.length);
  showChain();
}

// Fast swipes move many cells between events, so the path is checked in small steps.
function dragTo(x, y) {
  const step = view.cellCss * 0.2;
  const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y);
  const count = Math.max(1, Math.ceil(dist / step));
  for (let k = 1; k <= count; k++) {
    extendChain(lastPoint.x + ((x - lastPoint.x) * k) / count, lastPoint.y + ((y - lastPoint.y) * k) / count);
  }
  lastPoint = { x, y };
}

async function releaseChain() {
  const path = chain;
  const ok = chainIsValid(state, path);
  const tooShort = path.length > 1 && path.length < MIN_CHAIN;
  chain = [];
  dragging = false;
  lastPoint = null;
  setStatus('');
  if (!ok) {
    view.setChain([]);
    if (tooShort) {
      sfx.invalid();
      setStatus(`Link at least ${MIN_CHAIN} runes`);
    }
    return;
  }
  const result = playChain(state, path);
  if (!save.timed) $('counter').textContent = `${state.moves}`;
  await runSteps(result.steps);
}

/* ---------- Power-ups ---------- */

function clearTargeting() {
  targeting = null;
  swapFirst = -1;
  view.selected = -1;
  view.targetCells = null;
  setStatus('');
  updatePowers(state.charges);
}

async function applyPower(name, a, b) {
  const result = usePower(state, name, a, b);
  clearTargeting();
  if (result.ok) {
    $(`power-${name}`).classList.remove('ready-seen');
    await runSteps(result.steps);
  } else {
    sfx.invalid();
  }
}

function pressPower(name) {
  if (busy || paused || ended || dragging || !powerReady(state, name)) return;
  if (targeting === name) {
    clearTargeting();
    return;
  }
  clearTargeting();
  view.setHint(null);
  if (name === 'shuffle') {
    applyPower(name);
    return;
  }
  targeting = name;
  setStatus(POWER_HELP[name]);
  updatePowers(state.charges);
}

function targetTap(idx) {
  if (targeting === 'swap') {
    if (swapFirst < 0 || !touching(state, swapFirst, idx)) {
      swapFirst = idx;
      view.selected = idx;
      return;
    }
    applyPower('swap', swapFirst, idx);
    return;
  }
  applyPower(targeting, idx);
}

/* ---------- Touch and mouse input ---------- */

const canvas = $('board');

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (busy || paused || ended) return;
  const { idx } = view.hitTest(event.clientX, event.clientY);
  if (idx < 0) return;
  armHint();
  canvas.setPointerCapture(event.pointerId);
  if (targeting) {
    view.targetCells = targeting === 'swap' ? null : powerArea(state, targeting, idx);
    return;
  }
  if (!state.cells[idx].gem) return;
  dragging = true;
  chain = [idx];
  lastPoint = { x: event.clientX, y: event.clientY };
  sfx.link(1);
  showChain();
});

canvas.addEventListener('pointermove', (event) => {
  if (targeting && view.targetCells) {
    const { idx } = view.hitTest(event.clientX, event.clientY);
    if (idx >= 0) view.targetCells = powerArea(state, targeting, idx);
    return;
  }
  if (dragging) dragTo(event.clientX, event.clientY);
});

canvas.addEventListener('pointerup', (event) => {
  if (targeting) {
    const { idx } = view.hitTest(event.clientX, event.clientY);
    view.targetCells = null;
    if (idx >= 0 && !busy && !paused && !ended) targetTap(idx);
    return;
  }
  if (dragging) releaseChain();
});

canvas.addEventListener('pointercancel', () => {
  view.targetCells = null;
  if (dragging) cancelChain();
});

/* ---------- Buttons and system events ---------- */

function setSound(on) {
  save.sound = on;
  sfx.enabled = on;
  persist();
  if (on) sfx.unlock();
  $('sound').textContent = `Sound: ${on ? 'On' : 'Off'}`;
  $('sound').setAttribute('aria-pressed', String(on));
}

function setTimed(on) {
  save.timed = on;
  persist();
  $('mode').textContent = `Mode: ${on ? 'Timed' : 'Relaxed'}`;
  $('mode').setAttribute('aria-pressed', String(on));
}

$('play').addEventListener('click', goMap);
$('sound').addEventListener('click', () => setSound(!save.sound));
$('mode').addEventListener('click', () => setTimed(!save.timed));
$('map-back').addEventListener('click', () => showScreen('title'));
$('pause').addEventListener('click', pause);
for (const button of document.querySelectorAll('.power')) {
  button.addEventListener('click', () => pressPower(button.dataset.power));
}
$('install-close').addEventListener('click', () => {
  save.installHidden = true;
  persist();
  $('install').hidden = true;
});

window.addEventListener('pointerdown', () => sfx.unlock(), { capture: true });
document.addEventListener('gesturestart', (event) => event.preventDefault());
document.addEventListener('dblclick', (event) => event.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden && !$('game').hidden && !ended && !paused) pause();
});

new ResizeObserver(() => {
  if (!$('game').hidden) view.resize();
}).observe($('board-wrap'));

/* ---------- Install prompt and offline support ---------- */

const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
$('install').hidden = !isIos || standalone || save.installHidden;

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  // A new version takes over in the background; reload once so players are not left on the old files.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) {
      reloading = true;
      location.reload();
    }
  });
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
navigator.storage?.persist?.().catch(() => {});

setSound(save.sound);
setTimed(save.timed);
showScreen('title');

if (new URLSearchParams(location.search).has('debug')) {
  globalThis.aetherway = {
    get state() { return state; },
    get view() { return view; },
    get busy() { return busy; },
    startLevel,
    levels: LEVELS,
    save,
  };
}
