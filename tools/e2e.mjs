import { webkit, chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Plays the game in WebKit at iPhone and iPad sizes, then checks offline support in Chrome.
// Setup: npm install, then npx playwright install webkit. Run: node tools/e2e.mjs
const SERVE = fileURLToPath(new URL('./serve.mjs', import.meta.url));
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const PORT = 8123;
const URLBASE = `http://localhost:${PORT}/`;
const server = spawn('node', [SERVE, String(PORT)], { stdio: 'ignore' });
process.on('exit', () => server.kill());
await new Promise((r) => setTimeout(r, 800));

const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
};
const watch = (page, errors) => {
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
};

const longestChain = (page) => page.evaluate(async () => {
  const { findChains } = await import('/js/engine.js');
  const chains = findChains(globalThis.aetherway.state);
  return chains.reduce((a, b) => (b.length > a.length ? b : a), []);
});

const cellPoint = (page, i) => page.evaluate((i) => {
  const { view } = globalThis.aetherway;
  const r = view.canvas.getBoundingClientRect();
  return { x: r.left + (i % view.w + 0.5) * view.cellCss, y: r.top + (Math.floor(i / view.w) + 0.5) * view.cellCss };
}, i);

// Real pointer input: press on the first rune, drag through the rest, optionally stop before release.
async function drag(page, path, { release = true } = {}) {
  const start = await cellPoint(page, path[0]);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const i of path.slice(1)) {
    const p = await cellPoint(page, i);
    await page.mouse.move(p.x, p.y, { steps: 3 });
  }
  if (release) await page.mouse.up();
}

const idle = (page) => page.waitForFunction(() => !globalThis.aetherway.busy, null, { timeout: 15000 });

async function boardFits(page, label, minCell) {
  const m = await page.evaluate(() => {
    const c = document.getElementById('board').getBoundingClientRect();
    return {
      w: innerWidth, h: innerHeight, l: c.left, r: c.right, t: c.top, b: c.bottom,
      cell: globalThis.aetherway.view.cellCss, sw: document.documentElement.scrollWidth,
    };
  });
  check(`${label}: board inside the screen`, m.l >= 0 && m.t >= 0 && m.r <= m.w + 0.5 && m.b <= m.h + 0.5, JSON.stringify(m));
  check(`${label}: tiles at least ${minCell}px`, m.cell >= minCell, `${m.cell}px`);
}

// --- WebKit, iPhone portrait: full play-through ---
{
  const browser = await webkit.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = [];
  watch(page, errors);
  await page.goto(`${URLBASE}?debug`);
  await page.screenshot({ path: `${OUT}1-title-iphone.png` });
  check('iPhone: title shown', await page.isVisible('#play'));
  check('iPhone: install tip shown in Safari', await page.isVisible('#install'));
  await page.tap('#play');
  await page.screenshot({ path: `${OUT}2-map-iphone.png` });
  check('iPhone: only the first level is open', await page.$$eval('.level-node:not(:disabled)', (b) => b.length) === 1);
  await page.tap('.level-node:not(:disabled)');
  await page.waitForSelector('#overlay:not([hidden])');
  await page.screenshot({ path: `${OUT}3-tip-iphone.png` });
  await page.tap('#overlay-actions .btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}4-board-iphone.png` });
  await boardFits(page, 'iPhone portrait', 28);

  const first = await longestChain(page);
  await drag(page, first, { release: false });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}5-dragging-iphone.png` });
  const linked = await page.evaluate(() => globalThis.aetherway.view.chain?.path.length ?? 0);
  check('iPhone: dragging links every rune', linked === first.length, `${linked} of ${first.length}`);
  const sparse = await page.evaluate(() => globalThis.aetherway.state.moves);
  await page.mouse.up();
  if (first.length >= 5) {
    await page.waitForTimeout(first.length * 30 + 90);
    await page.screenshot({ path: `${OUT}6-explosion-iphone.png` });
  }
  await page.waitForTimeout(100);
  await idle(page);
  check('iPhone: releasing a chain counts as a move', await page.evaluate(() => globalThis.aetherway.state.moves) === sparse + 1);
  const opened = await page.evaluate(() => globalThis.aetherway.state.cells.filter((c) => !c.tile && !c.src && !c.alt).length);
  check('iPhone: chain removed the tiles under it', opened >= first.length, `${opened} open`);

  // A chain of two must do nothing.
  const before = await page.evaluate(() => JSON.stringify(globalThis.aetherway.state.moves));
  const pair = (await longestChain(page)).slice(0, 2);
  await drag(page, pair);
  await page.waitForTimeout(150);
  check('iPhone: a chain of two is refused', await page.evaluate(() => JSON.stringify(globalThis.aetherway.state.moves)) === before);

  let safety = 0;
  while (safety++ < 60 && !(await page.isVisible('#overlay'))) {
    const won = await page.evaluate(() => globalThis.aetherway.state.won);
    if (won) {
      await page.waitForTimeout(150);
      continue;
    }
    const path = await longestChain(page);
    await drag(page, path);
    await page.waitForTimeout(120);
    await idle(page);
    await page.waitForTimeout(350);
    if (safety === 3) await page.screenshot({ path: `${OUT}7-channel-iphone.png` });
  }
  await page.waitForSelector('#overlay:not([hidden])', { timeout: 6000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}8-win-iphone.png` });
  check('iPhone: level can be won', (await page.textContent('#overlay-title')) === 'Altars lit');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('aetherway.save.v2')).stars);
  check('iPhone: stars saved', saved['earth-1'] >= 1, JSON.stringify(saved));

  await page.tap('#overlay-actions .btn.primary');
  await page.waitForSelector('#overlay:not([hidden])');
  await page.tap('#overlay-actions .btn');
  await page.waitForTimeout(200);
  check('iPhone: next level opens', await page.evaluate(() => globalThis.aetherway.state.charges.spade === 0));

  // Spade: fill it through a real chain's HUD refresh, then use it by touch.
  await page.evaluate(() => { globalThis.aetherway.state.charges.spade = 999; });
  const chainNow = await longestChain(page);
  await drag(page, chainNow);
  await page.waitForTimeout(100);
  await idle(page);
  await page.tap('#power-spade');
  check('iPhone: spade asks for a target', (await page.textContent('#status')).includes('Tap a tile'));
  const target = await page.evaluate(() => globalThis.aetherway.state.cells.findIndex((c) => c.tile && c.gem));
  const point = await cellPoint(page, target);
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(100);
  await idle(page);
  const used = await page.evaluate((i) => ({
    tile: globalThis.aetherway.state.cells[i].tile,
    charge: globalThis.aetherway.state.charges.spade,
  }), target);
  check('iPhone: spade removes a tile', used.tile === false && used.charge === 0, JSON.stringify(used));
  check('iPhone: no JavaScript errors', errors.length === 0, errors.join(' | '));
  await browser.close();
}

// --- WebKit, other device shapes ---
for (const [label, device, level, minCell] of [
  ['iPhone SE', devices['iPhone SE'], 15, 22],
  ['iPad portrait', devices['iPad (gen 7)'], 15, 40],
  ['iPad landscape', devices['iPad (gen 7) landscape'], 12, 40],
]) {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({ ...device });
  const page = await ctx.newPage();
  const errors = [];
  watch(page, errors);
  await page.goto(`${URLBASE}?debug`);
  const name = label.replace(' ', '-').toLowerCase();
  await page.screenshot({ path: `${OUT}title-${name}.png` });
  await page.evaluate((i) => { const g = globalThis.aetherway; g.save.tips = new Proxy({}, { get: () => true }); g.startLevel(g.levels[i]); }, level);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}board-${name}.png` });
  await boardFits(page, label, minCell);
  check(`${label}: no JavaScript errors`, errors.length === 0, errors.join(' | '));
  await browser.close();
}

// --- WebKit, iPhone landscape asks the player to turn the phone ---
{
  const browser = await webkit.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] });
  const page = await ctx.newPage();
  await page.goto(`${URLBASE}?debug`);
  await page.evaluate(() => { const g = globalThis.aetherway; g.startLevel(g.levels[0]); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}rotate-iphone.png` });
  check('iPhone landscape: asks to rotate', await page.isVisible('.rotate-tip'));
  await browser.close();
}

// --- Chrome: install metadata and offline reload ---
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  watch(page, errors);
  await page.goto(`${URLBASE}?debug`);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 10000 }).catch(() => {});
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys[0]);
    return (await cache.keys()).length;
  });
  check('PWA: service worker cached the game', cached === 13, `${cached} files`);
  const manifest = await (await page.request.get(`${URLBASE}manifest.webmanifest`)).json();
  check('PWA: manifest valid', manifest.display === 'standalone' && manifest.icons.length === 3);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('#play');
  await page.click('#play');
  await page.click('.level-node:not(:disabled)');
  await page.waitForSelector('#overlay:not([hidden])');
  check('PWA: game starts with no network', true);
  check('PWA: no JavaScript errors', errors.filter((e) => !e.includes('ERR_INTERNET')).length === 0, errors.join(' | '));
  await browser.close();
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
