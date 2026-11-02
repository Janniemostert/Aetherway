// Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGame, playChain, chainIsValid, findChains, flow, flowAll, blastFor, blastCells, neighbours,
  usePower, powerReady, POWERS,
} from '../js/engine.js';
import { LEVELS } from '../js/levels.js';

const rows = (n, row) => new Array(n).fill(row);
const open = { id: 't', colors: 5, map: rows(8, 'oooooooo') };

// Paints colours onto the board; digits are colours, anything else gets a colour of its own.
function paint(state, pattern) {
  let filler = 100;
  pattern.forEach((row, y) => [...row].forEach((ch, x) => {
    const gem = state.cells[y * state.w + x].gem;
    if (gem) gem.c = /\d/.test(ch) ? Number(ch) : filler++;
  }));
}

const clearOf = (result) => result.steps.find((s) => s.type === 'clear');

test('every level has the shape and devices it needs', () => {
  for (const level of LEVELS) {
    assert.equal(level.map.length, 16, `${level.id} rows`);
    for (const row of level.map) assert.equal(row.length, 12, `${level.id} "${row}"`);
    const text = level.map.join('');
    assert.ok(text.includes('S'), `${level.id} source`);
    assert.ok(text.includes('A'), `${level.id} altar`);
  }
});

test('every altar can be reached past iron and holes', () => {
  for (const level of LEVELS) {
    const state = createGame(level, 1);
    const seen = new Set();
    const queue = [];
    state.cells.forEach((c, i) => {
      if (c.src) {
        seen.add(i);
        queue.push(i);
      }
    });
    while (queue.length) {
      for (const n of neighbours(state, queue.pop())) {
        if (seen.has(n) || state.cells[n].hole || state.cells[n].iron) continue;
        seen.add(n);
        queue.push(n);
      }
    }
    state.cells.forEach((c, i) => {
      if (c.alt) assert.ok(seen.has(i), `${level.id} altar ${i} is walled off`);
    });
  }
});

test('every level starts with a chain to play', () => {
  for (const level of LEVELS) {
    for (let seed = 1; seed <= 10; seed++) assert.ok(findChains(createGame(level, seed)).length, level.id);
  }
});

test('a chain must be long enough, one colour, touching and not repeat', () => {
  const state = createGame(open, 1);
  paint(state, ['000a1bcd', ...rows(7, 'efghijkl')]);
  assert.equal(chainIsValid(state, [0, 1]), false, 'too short');
  assert.equal(chainIsValid(state, [0, 1, 2]), true, 'a straight line');
  assert.equal(chainIsValid(state, [0, 1, 0]), false, 'repeats');
  assert.equal(chainIsValid(state, [0, 2, 1]), false, 'not touching');
  assert.equal(chainIsValid(state, [0, 1, 4]), false, 'wrong colour');
});

test('chains can run diagonally', () => {
  const state = createGame(open, 1);
  paint(state, ['0abcdefg', 'h0ijklmn', 'op0qrstu', ...rows(5, 'vwxyzABC')]);
  assert.ok(playChain(state, [0, 9, 18]).ok);
});

test('a rejected chain changes nothing', () => {
  const state = createGame(open, 1);
  paint(state, ['abcdefgh', ...rows(7, 'ijklmnop')]);
  const before = JSON.stringify(state);
  assert.equal(playChain(state, [0, 1, 2]).ok, false);
  assert.equal(JSON.stringify(state), before);
});

test('clearing a chain removes its tiles and refills the runes', () => {
  const state = createGame(open, 1);
  paint(state, ['000abcde', ...rows(7, 'fghijklm')]);
  const result = playChain(state, [0, 1, 2]);
  assert.ok(result.ok);
  assert.deepEqual(clearOf(result).opened, [0, 1, 2]);
  assert.equal(state.moves, 1);
  for (const i of [0, 1, 2]) {
    assert.equal(state.cells[i].tile, false);
    assert.ok(state.cells[i].gem, 'refilled');
  }
});

test('four runes make no explosion and five do', () => {
  const four = createGame(open, 1);
  paint(four, ['0000abcd', ...rows(7, 'efghijkl')]);
  assert.equal(clearOf(playChain(four, [0, 1, 2, 3])).blast, null);

  const five = createGame(open, 1);
  paint(five, ['00000abc', ...rows(7, 'defghijk')]);
  const clear = clearOf(playChain(five, [0, 1, 2, 3, 4]));
  assert.equal(clear.blast.idx, 4);
  assert.ok(clear.opened.includes(5) && clear.opened.includes(12), 'blast opens tiles around the last rune');
});

test('longer chains make bigger explosions', () => {
  const state = createGame(open, 1);
  let last = 0;
  for (const length of [5, 7, 10, 14, 19]) {
    const size = blastCells(state, 27, blastFor(length)).length;
    assert.ok(size > last, `length ${length} gives ${size}`);
    last = size;
  }
  assert.ok(last >= 40, 'a very long chain is a huge blast');
});

test('energy only flows through open cells and wins at the altar', () => {
  const state = createGame({ ...open, map: ['Soooo.oo', 'oooooooo', ...rows(4, 'oooooooo'), 'oooooooo', 'oooAoooo'] }, 1);
  assert.equal(flow(state), null, 'tiles block it');
  for (let x = 0; x <= 3; x++) state.cells[8 * x].tile = false;
  state.cells[8 * 7 + 1].tile = false;
  state.cells[8 * 7 + 2].tile = false;
  state.cells[8 * 7].tile = false;
  for (let y = 0; y < 8; y++) state.cells[y * 8].tile = false;
  flowAll(state);
  assert.ok(state.won);
});

test('energy moves one cell per tick', () => {
  const state = createGame({ ...open, map: ['S_______', ...rows(7, 'oooooooo')] }, 1);
  assert.deepEqual(flow(state).energized, [1]);
  assert.deepEqual(flow(state).energized, [2]);
});

test('boulders block energy until an explosion breaks them', () => {
  const state = createGame({ ...open, map: ['S#______', ...rows(7, 'oooooooo')] }, 1);
  assert.equal(flow(state), null);
  paint(state, ['..abcdef', '00000ghi', ...rows(6, 'jklmnopq')]);
  const clear = clearOf(playChain(state, [12, 11, 10, 9, 8]));
  assert.deepEqual(clear.cracks, [{ idx: 1, hp: 0 }]);
  assert.equal(state.cells[1].stone, 0);
  assert.ok(flow(state), 'energy now gets through');
});

test('iron survives everything', () => {
  const state = createGame({ ...open, map: ['X_______', ...rows(7, 'oooooooo')] }, 1);
  paint(state, ['.abcdefg', '00000hij', ...rows(6, 'klmnopqr')]);
  playChain(state, [12, 11, 10, 9, 8]);
  assert.ok(state.cells[0].iron);
});

test('frozen runes hold still and thaw when chained', () => {
  const state = createGame({ ...open, map: ['Iooooooo', ...rows(7, 'oooooooo')] }, 1);
  paint(state, ['000abcde', ...rows(7, 'fghijklm')]);
  const frozen = state.cells[0].gem.id;
  assert.ok(playChain(state, [0, 1, 2]).ok);
  assert.equal(state.cells[0].ice, false);
  assert.notEqual(state.cells[0].gem.id, frozen);

  const below = createGame({ ...open, map: ['oooooooo', 'Iooooooo', ...rows(6, 'oooooooo')] }, 1);
  paint(below, ['abcdefgh', 'ijklmnop', '000qrstu', ...rows(5, 'vwxyzABC')]);
  const held = below.cells[8].gem.id;
  playChain(below, [16, 17, 18]);
  assert.equal(below.cells[8].gem.id, held, 'a frozen rune does not fall');
});

test('a launcher fires when energy reaches it and stops at iron', () => {
  const state = createGame({ ...open, map: ['S_TooooX', ...rows(7, 'oooooooo')] }, 1);
  let beams = [];
  for (let tick = flow(state); tick; tick = flow(state)) {
    for (const step of tick.steps) if (step.beams?.length) beams = step.beams;
  }
  assert.deepEqual(beams, [{ idx: 2 }]);
  assert.equal(state.cells[6].tile, false, 'beam opens the row');
  assert.ok(state.cells[7].iron, 'iron stops it');
  assert.equal(state.cells[58].tile, false, 'beam opens the column');
});

test('an explosion sets off a launcher', () => {
  const state = createGame({ ...open, map: ['ooooTooo', ...rows(7, 'oooooooo')] }, 1);
  paint(state, ['abcd.efg', '00000hij', ...rows(6, 'klmnopqr')]);
  const clear = clearOf(playChain(state, [8, 9, 10, 11, 12]));
  assert.deepEqual(clear.beams, [{ idx: 4 }]);
});

test('power-ups charge from their colour and only work when ready', () => {
  const state = createGame({ ...open, powers: ['spade'] }, 1);
  assert.equal(powerReady(state, 'spade'), false);
  assert.equal(usePower(state, 'spade', 10).ok, false);
  paint(state, ['222abcde', ...rows(7, 'fghijklm')]);
  playChain(state, [0, 1, 2]);
  assert.equal(state.charges.spade, 3);
  state.charges.spade = POWERS.spade.need;
  const moves = state.moves;
  assert.ok(usePower(state, 'spade', 20).ok);
  assert.equal(state.cells[20].tile, false);
  assert.equal(state.moves, moves, 'power-ups cost no move');
  assert.equal(state.charges.spade, 0);
});

test('bomb, swap and shuffle do their jobs', () => {
  const state = createGame({ ...open, powers: ['bomb', 'swap', 'shuffle'] }, 1);
  state.charges.bomb = POWERS.bomb.need;
  assert.equal(clearOf(usePower(state, 'bomb', 27)).opened.length, 25);

  const swap = createGame({ ...open, powers: ['swap'] }, 1);
  swap.charges.swap = POWERS.swap.need;
  const [a, b] = [swap.cells[0].gem.id, swap.cells[1].gem.id];
  assert.ok(usePower(swap, 'swap', 0, 1).ok);
  assert.equal(swap.cells[0].gem.id, b);
  assert.equal(swap.cells[1].gem.id, a);

  const mix = createGame({ ...open, powers: ['shuffle'] }, 1);
  mix.charges.shuffle = POWERS.shuffle.need;
  const before = mix.cells.map((c) => c.gem.id).join();
  assert.equal(usePower(mix, 'shuffle').steps[0].type, 'shuffle');
  assert.notEqual(mix.cells.map((c) => c.gem.id).join(), before);
});

test('every open cell holds a rune after any move', () => {
  for (const level of LEVELS) {
    const state = createGame(level, 42);
    for (let i = 0; i < 25 && !state.won; i++) {
      const [path] = findChains(state);
      assert.ok(path, `${level.id} has a chain`);
      playChain(state, path);
      flowAll(state);
      state.cells.forEach((c, idx) => {
        const empty = c.hole || c.iron || c.stone || c.src || c.alt || c.launcher;
        if (!empty) assert.ok(c.gem, `${level.id} cell ${idx} is empty`);
      });
    }
  }
});

test('the same seed plays out identically', () => {
  const run = () => {
    const state = createGame(LEVELS[0], 123);
    for (let i = 0; i < 10; i++) {
      playChain(state, findChains(state)[0]);
      flowAll(state);
    }
    return JSON.stringify(state);
  };
  assert.equal(run(), run());
});

test('the service worker precaches every shipped file', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(root, path).replaceAll('\\', '/')];
  });
  const shipped = ['index.html', 'manifest.webmanifest', ...['css', 'js', 'icons'].flatMap((d) => walk(join(root, d)))];
  for (const file of shipped) assert.ok(sw.includes(`'./${file}'`), `${file} missing from sw.js`);
});
