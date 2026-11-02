// Pure game rules: no DOM, no timers. Actions return a list of steps for the renderer to play,
// so the same code runs in the browser and in tests.
//
// You drag a chain through touching runes of one colour. Clearing a rune also removes the tile
// under it, and energy flows by itself through open cells towards the altars. Chains of 5 or more
// end in an explosion that grows with the length of the chain.

export const MIN_CHAIN = 3;
export const BLAST_FROM = 5;

// Each power-up charges from clearing runes of one colour.
export const POWERS = {
  spade: { colour: 2, need: 16 },
  bomb: { colour: 0, need: 22 },
  swap: { colour: 1, need: 14 },
  shuffle: { colour: 3, need: 18 },
};

function random(state) {
  let t = (state.seed = (state.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const randInt = (state, n) => Math.floor(random(state) * n);

function newGem(state) {
  return { id: state.nextId++, c: randInt(state, state.colors) };
}

export function neighbours(state, i) {
  const { w, h } = state;
  const x = i % w;
  const y = Math.floor(i / w);
  const out = [];
  if (x > 0) out.push(i - 1);
  if (x < w - 1) out.push(i + 1);
  if (y > 0) out.push(i - w);
  if (y < h - 1) out.push(i + w);
  return out;
}

// Chains may also run diagonally.
export function touching(state, a, b) {
  const { w } = state;
  const dx = Math.abs((a % w) - (b % w));
  const dy = Math.abs(Math.floor(a / w) - Math.floor(b / w));
  return a !== b && dx <= 1 && dy <= 1;
}

const isDevice = (c) => c.src || c.alt || c.launcher;
const conducts = (c) => !c.hole && !c.iron && !c.stone && !c.tile;
const inChannel = (c) => !c.hole && !c.iron && !c.stone && !c.ice && !isDevice(c);
const movable = (c) => inChannel(c) && !!c.gem;

// Level maps: o rune on a tile, _ rune with no tile, . hole, X iron block, # boulder,
// I frozen rune, S source, A altar, T beam launcher
export function createGame(level, seed = (Math.random() * 2147483647) | 0) {
  const rows = level.map;
  const h = rows.length;
  const w = rows[0].length;
  const state = {
    w, h, seed,
    cells: [],
    nextId: 1,
    colors: level.colors ?? 5,
    moves: 0,
    score: 0,
    charges: Object.fromEntries((level.powers ?? []).map((name) => [name, 0])),
    won: false,
  };
  for (const row of rows) {
    if (row.length !== w) throw new Error(`Level ${level.id}: uneven row "${row}"`);
    for (const ch of row) {
      const device = ch === 'S' || ch === 'A' || ch === 'T';
      const cell = {
        hole: ch === '.',
        iron: ch === 'X',
        stone: ch === '#' ? 1 : 0,
        ice: ch === 'I',
        src: ch === 'S',
        alt: ch === 'A',
        launcher: ch === 'T',
        fired: false,
        tile: ch === 'o' || ch === 'I',
        e: ch === 'S',
        gem: null,
      };
      if (!device && !cell.hole && !cell.iron && !cell.stone) cell.gem = newGem(state);
      state.cells.push(cell);
    }
  }
  ensurePlayable(state);
  return state;
}

function snapshot(state) {
  return state.cells.map((c) => ({ e: c.e, tile: c.tile, stone: c.stone, ice: c.ice, fired: c.fired }));
}

// Explosion size by chain length: 8, then 12, 24, 40 and 48 surrounding cells.
export function blastFor(length) {
  if (length < BLAST_FROM) return null;
  if (length <= 6) return { r: 1, shape: 'square' };
  if (length <= 9) return { r: 2, shape: 'diamond' };
  if (length <= 13) return { r: 2, shape: 'square' };
  if (length <= 18) return { r: 4, shape: 'diamond' };
  return { r: 3, shape: 'square' };
}

export function blastCells(state, idx, { r, shape }) {
  const { w, h } = state;
  const x0 = idx % w;
  const y0 = Math.floor(idx / w);
  const out = [];
  for (let y = y0 - r; y <= y0 + r; y++) {
    for (let x = x0 - r; x <= x0 + r; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if (shape === 'diamond' && Math.abs(x - x0) + Math.abs(y - y0) > r) continue;
      out.push(y * w + x);
    }
  }
  return out;
}

function newBlow() {
  return { removed: [], opened: [], cracks: [], beams: [], pending: [] };
}

function destroy(state, blow, i) {
  const cell = state.cells[i];
  if (cell.hole || cell.iron || cell.src || cell.alt) return;
  if (cell.launcher) {
    if (!cell.fired) {
      cell.fired = true;
      blow.pending.push(i);
    }
    return;
  }
  if (cell.stone) {
    cell.stone--;
    blow.cracks.push({ idx: i, hp: cell.stone });
    if (!cell.stone) {
      cell.tile = false;
      blow.opened.push(i);
    }
    return;
  }
  if (cell.gem) {
    blow.removed.push({ id: cell.gem.id, idx: i, c: cell.gem.c });
    cell.gem = null;
    cell.ice = false;
  }
  if (cell.tile) {
    cell.tile = false;
    blow.opened.push(i);
  }
}

// A launcher shoots beams along its row and column until they hit iron, a hole or the edge.
function fireLaunchers(state, blow) {
  const { w, h, cells } = state;
  while (blow.pending.length) {
    const idx = blow.pending.pop();
    blow.beams.push({ idx });
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let x = idx % w + dx;
      let y = Math.floor(idx / w) + dy;
      while (x >= 0 && y >= 0 && x < w && y < h) {
        const i = y * w + x;
        if (cells[i].iron || cells[i].hole) break;
        destroy(state, blow, i);
        x += dx;
        y += dy;
      }
    }
  }
}

function clearStep(state, blow, extra = {}) {
  fireLaunchers(state, blow);
  const length = extra.path?.length ?? 0;
  const points = length * length * 10 + (blow.removed.length - length) * 15 + blow.opened.length * 5 + blow.cracks.length * 25;
  state.score += points;
  for (const [name, power] of Object.entries(POWERS)) {
    if (!(name in state.charges)) continue;
    const gained = blow.removed.filter((r) => r.c === power.colour).length;
    state.charges[name] = Math.min(power.need, state.charges[name] + gained);
  }
  return {
    type: 'clear',
    path: [],
    blast: null,
    ...extra,
    removed: blow.removed,
    opened: blow.opened,
    cracks: blow.cracks,
    beams: blow.beams,
    points,
    score: state.score,
    charges: { ...state.charges },
    cells: snapshot(state),
  };
}

function applyGravity(state) {
  const { w, h, cells } = state;
  const moves = [];
  const spawns = [];
  for (let x = 0; x < w; x++) {
    const channel = [];
    for (let y = h - 1; y >= 0; y--) {
      const i = y * w + x;
      if (inChannel(cells[i])) channel.push(i);
    }
    const gems = [];
    for (const i of channel) {
      if (cells[i].gem) gems.push({ gem: cells[i].gem, from: i });
      cells[i].gem = null;
    }
    channel.forEach((i, k) => {
      if (k < gems.length) {
        cells[i].gem = gems[k].gem;
        if (gems[k].from !== i) moves.push({ id: gems[k].gem.id, from: gems[k].from, to: i });
      } else {
        const gem = newGem(state);
        cells[i].gem = gem;
        spawns.push({ id: gem.id, c: gem.c, to: i, row: -1 - (k - gems.length) });
      }
    });
  }
  return moves.length || spawns.length ? { type: 'fall', moves, spawns } : null;
}

function settle(state, first) {
  const steps = [first];
  const fall = applyGravity(state);
  if (fall) steps.push(fall);
  if (ensurePlayable(state)) steps.push(shuffleStep(state));
  return steps;
}

function shuffleStep(state) {
  return {
    type: 'shuffle',
    gems: state.cells.flatMap((c, i) => (c.gem ? [{ id: c.gem.id, idx: i, c: c.gem.c }] : [])),
  };
}

export function chainIsValid(state, path) {
  if (path.length < MIN_CHAIN || new Set(path).size !== path.length) return false;
  const colour = state.cells[path[0]]?.gem?.c;
  if (colour === undefined) return false;
  return path.every((i, k) => state.cells[i]?.gem?.c === colour && (k === 0 || touching(state, path[k - 1], i)));
}

export function playChain(state, path) {
  if (state.won || !chainIsValid(state, path)) return { ok: false };
  state.moves++;
  const blow = newBlow();
  for (const i of path) destroy(state, blow, i);
  const tail = path[path.length - 1];
  const size = blastFor(path.length);
  if (size) for (const i of blastCells(state, tail, size)) destroy(state, blow, i);
  const blast = size ? { idx: tail, ...size, length: path.length } : null;
  return { ok: true, steps: settle(state, clearStep(state, blow, { path: [...path], blast })) };
}

// One tick of energy flow: it moves one cell further through every open channel.
// Returns null once nothing can move.
export function flow(state) {
  const { cells } = state;
  const energized = cells.flatMap((c, i) => (
    !c.e && conducts(c) && neighbours(state, i).some((n) => cells[n].e) ? [i] : []
  ));
  if (!energized.length) return null;
  const blow = newBlow();
  for (const i of energized) {
    cells[i].e = true;
    if (cells[i].launcher && !cells[i].fired) destroy(state, blow, i);
  }
  const litAltars = energized.filter((i) => cells[i].alt);
  state.won = cells.every((c) => !c.alt || c.e);
  const result = { type: 'flow', energized, litAltars, cells: snapshot(state), steps: [] };
  if (blow.pending.length) result.steps = settle(state, clearStep(state, blow));
  return result;
}

export function flowAll(state) {
  while (flow(state));
}

export function powerReady(state, name) {
  return !state.won && name in state.charges && state.charges[name] >= POWERS[name].need;
}

const POWER_BLAST = { r: 2, shape: 'square' };

export function usePower(state, name, a, b) {
  if (!powerReady(state, name)) return { ok: false };
  const { cells } = state;
  if (name === 'shuffle') {
    state.charges.shuffle = 0;
    shuffleGems(state);
    return { ok: true, steps: [shuffleStep(state)] };
  }
  if (name === 'swap') {
    if (!touching(state, a, b) || !movable(cells[a]) || !movable(cells[b])) return { ok: false };
    state.charges.swap = 0;
    const ga = cells[a].gem;
    const gb = cells[b].gem;
    cells[a].gem = gb;
    cells[b].gem = ga;
    const swap = { type: 'swap', a, b, ida: ga.id, idb: gb.id };
    return { ok: true, steps: ensurePlayable(state) ? [swap, shuffleStep(state)] : [swap] };
  }
  const target = cells[a];
  if (!target || target.hole || target.iron || target.src || target.alt) return { ok: false };
  state.charges[name] = 0;
  const blow = newBlow();
  let blast = null;
  if (name === 'spade') {
    destroy(state, blow, a);
  } else {
    for (const i of blastCells(state, a, POWER_BLAST)) destroy(state, blow, i);
    blast = { idx: a, ...POWER_BLAST, length: 0 };
  }
  return { ok: true, steps: settle(state, clearStep(state, blow, { blast })) };
}

export function powerArea(state, name, idx) {
  if (name === 'bomb') return blastCells(state, idx, POWER_BLAST);
  return [idx];
}

const DFS_BUDGET = 500;

// The longest chain found from one starting rune, searched with a node budget.
function longestFrom(state, start) {
  const { cells, w, h } = state;
  const colour = cells[start].gem.c;
  let best = [start];
  let budget = DFS_BUDGET;
  const used = new Set([start]);
  const path = [start];
  const visit = (i) => {
    if (path.length > best.length) best = [...path];
    const x = i % w;
    const y = Math.floor(i / w);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (used.has(n) || cells[n].gem?.c !== colour || budget-- <= 0) continue;
        used.add(n);
        path.push(n);
        visit(n);
        path.pop();
        used.delete(n);
      }
    }
  };
  visit(start);
  return best;
}

// One good chain for each group of touching same-coloured runes.
export function findChains(state) {
  const { cells } = state;
  const seen = new Set();
  const chains = [];
  cells.forEach((cell, start) => {
    if (!cell.gem || seen.has(start)) return;
    const group = [start];
    seen.add(start);
    for (let k = 0; k < group.length; k++) {
      cells.forEach((other, n) => {
        if (other.gem?.c === cell.gem.c && !seen.has(n) && touching(state, group[k], n)) {
          seen.add(n);
          group.push(n);
        }
      });
    }
    if (group.length < MIN_CHAIN) return;
    let best = [];
    for (const from of group.slice(0, 4)) {
      const path = longestFrom(state, from);
      if (path.length > best.length) best = path;
    }
    if (best.length >= MIN_CHAIN) chains.push(best);
  });
  return chains;
}

function shuffleGems(state) {
  const free = state.cells.filter(movable);
  const gems = free.map((c) => c.gem);
  for (let i = gems.length - 1; i > 0; i--) {
    const j = randInt(state, i + 1);
    [gems[i], gems[j]] = [gems[j], gems[i]];
  }
  free.forEach((c, i) => {
    c.gem = gems[i];
  });
}

// Returns true if the board had to change to leave the player a chain.
function ensurePlayable(state) {
  if (findChains(state).length) return false;
  for (let attempt = 0; attempt < 40; attempt++) {
    shuffleGems(state);
    if (findChains(state).length) return true;
  }
  for (const cell of state.cells) if (movable(cell)) cell.gem.c = randInt(state, state.colors);
  return true;
}

export function clone(state) {
  return JSON.parse(JSON.stringify(state));
}
