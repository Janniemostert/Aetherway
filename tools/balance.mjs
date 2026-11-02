// Plays every level with a simple bot to prove it can be finished and to measure par.
// Run: node tools/balance.mjs [--write]   (--write updates js/par.js)
import { writeFileSync } from 'node:fs';
import { createGame, playChain, findChains, flowAll, clone, neighbours, usePower, powerReady } from '../js/engine.js';
import { LEVELS } from '../js/levels.js';

const SEEDS = 8;
const MOVE_CAP = 200;
// The bot weighs every chain on the board, so people need a wider target than its median.
const PAR_MARGIN = 1.6;

// Work left between the energy and the unlit altars: tiles cost 1, boulders more, holes block.
function distance(state) {
  const { cells } = state;
  const dist = new Array(cells.length).fill(Infinity);
  const open = [];
  cells.forEach((c, i) => {
    if (c.e) {
      dist[i] = 0;
      open.push(i);
    }
  });
  while (open.length) {
    let at = 0;
    for (let k = 1; k < open.length; k++) if (dist[open[k]] < dist[open[at]]) at = k;
    const [i] = open.splice(at, 1);
    for (const n of neighbours(state, i)) {
      const c = cells[n];
      if (c.hole || c.iron) continue;
      const d = dist[i] + (c.stone ? 3 : c.tile ? 1 : 0);
      if (d < dist[n]) {
        dist[n] = d;
        open.push(n);
      }
    }
  }
  return cells.reduce((sum, c, i) => (c.alt && !c.e ? sum + dist[i] : sum), 0);
}

function value(state) {
  return state.won ? -1e9 : distance(state) * 10 - state.score / 5000;
}

// Trials get a different seed so the bot cannot see which runes will fall next.
function trialOf(state) {
  const trial = clone(state);
  trial.seed = (trial.seed ^ 0x5bd1e995) | 0;
  return trial;
}

function play(level, seed) {
  const state = createGame(level, seed);
  let longest = 0;
  while (!state.won && state.moves < MOVE_CAP) {
    for (const name of ['spade', 'bomb']) {
      if (!powerReady(state, name)) continue;
      let target = null;
      state.cells.forEach((c, i) => {
        if (c.hole || c.iron || c.src || c.alt) return;
        const trial = trialOf(state);
        usePower(trial, name, i);
        flowAll(trial);
        const v = value(trial);
        if (!target || v < target.v) target = { i, v };
      });
      usePower(state, name, target.i);
      flowAll(state);
    }
    if (state.won) break;
    if (powerReady(state, 'shuffle')) usePower(state, 'shuffle');
    let best = null;
    for (const path of findChains(state)) {
      const trial = trialOf(state);
      playChain(trial, path);
      flowAll(trial);
      const v = value(trial);
      if (!best || v < best.v) best = { path, v };
    }
    if (!best) return { moves: Infinity, longest };
    longest = Math.max(longest, best.path.length);
    playChain(state, best.path);
    flowAll(state);
  }
  return { moves: state.won ? state.moves : Infinity, longest };
}

let failures = 0;
const par = {};
console.log('level            par   best median worst  failed  longest');
for (const level of LEVELS) {
  const runs = [];
  for (let s = 1; s <= SEEDS; s++) runs.push(play(level, s * 7919));
  const results = runs.map((r) => r.moves).sort((a, b) => a - b);
  const failed = results.filter((m) => m === Infinity).length;
  failures += failed;
  const finite = results.filter((m) => m !== Infinity);
  const median = finite[finite.length >> 1];
  par[level.id] = Math.ceil((median ?? 20) * PAR_MARGIN);
  console.log(
    level.id.padEnd(16),
    String(par[level.id]).padStart(3),
    String(finite[0] ?? '-').padStart(6),
    String(median ?? '-').padStart(6),
    String(finite[finite.length - 1] ?? '-').padStart(5),
    String(failed).padStart(7),
    String(Math.max(...runs.map((r) => r.longest))).padStart(8),
  );
}
if (process.argv.includes('--write')) {
  const body = Object.entries(par).map(([id, n]) => `  '${id}': ${n},`).join('\n');
  writeFileSync(
    new URL('../js/par.js', import.meta.url),
    `// Written by tools/balance.mjs --write. Do not edit by hand.\nexport const PAR = {\n${body}\n};\n`,
  );
  console.log('\nUpdated js/par.js');
}
console.log(failures ? `\n${failures} failed runs` : '\nAll levels finished on every seed.');
process.exit(failures ? 1 : 0);
