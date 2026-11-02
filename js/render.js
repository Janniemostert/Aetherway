// Draws the board on a canvas and plays back the steps produced by the engine.
// All art is drawn in code, so the game has no image assets to load.

const RUNES = [
  { hi: '#ffb9a0', mid: '#e8301f', low: '#7c0d0a', mark: '#ffe1c4' }, // ember
  { hi: '#bfe6ff', mid: '#1f7fe8', low: '#0b2f7c', mark: '#e4f5ff' }, // droplet
  { hi: '#d4f7a0', mid: '#37ae2c', low: '#0e5416', mark: '#f0ffd2' }, // leaf
  { hi: '#ffffff', mid: '#8fd0e0', low: '#2c6d8a', mark: '#ffffff' }, // wind
  { hi: '#ecc8ff', mid: '#9840dc', low: '#40127c', mark: '#f6e4ff' }, // crystal
  { hi: '#fff6b0', mid: '#f2b81c', low: '#935206', mark: '#fff9d8' }, // sun
];

const THEMES = {
  earth: { energy: '70,215,70', slate: ['#a3aeb8', '#75828e'], pit: '#14231c' },
  water: { energy: '50,170,255', slate: ['#a2b6c8', '#6c8299'], pit: '#0f1c2e' },
  air: { energy: '190,225,255', slate: ['#b4b4cc', '#808099'], pit: '#1a1b33' },
  fire: { energy: '255,130,35', slate: ['#b5a297', '#85706a'], pit: '#2a1410' },
};

const REDUCED_MOTION = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const MAX_CELL = 56;
const FRAME_SPACE = 12;
const SHINE_FRAMES = 8;

const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;
const lerp = (a, b, t) => a + (b - a) * t;

function roundedPolygon(points, radius) {
  const p = new Path2D();
  points.forEach((pt, k) => {
    const prev = points[(k + points.length - 1) % points.length];
    const next = points[(k + 1) % points.length];
    const toward = (from, to) => {
      const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const r = Math.min(radius, d / 2);
      return [from[0] + ((to[0] - from[0]) / d) * r, from[1] + ((to[1] - from[1]) / d) * r];
    };
    const start = toward(pt, prev);
    const end = toward(pt, next);
    if (k) p.lineTo(start[0], start[1]);
    else p.moveTo(start[0], start[1]);
    p.quadraticCurveTo(pt[0], pt[1], end[0], end[1]);
  });
  p.closePath();
  return p;
}

// Each colour has its own pebble shape, so colour-blind players can still tell them apart.
function runeShape(c) {
  switch (c) {
    case 0:
      return roundedPolygon([[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], 0.36);
    case 1:
      return roundedPolygon([[0, -1.02], [0.94, 0.04], [0, 1.02], [-0.94, 0.04]], 0.34);
    case 2:
      return roundedPolygon([[-0.84, -0.78], [0.84, -0.78], [0.84, 0.16], [0, 1], [-0.84, 0.16]], 0.3);
    case 3: {
      const p = new Path2D();
      p.arc(0, 0, 0.88, 0, Math.PI * 2);
      return p;
    }
    case 4:
      return roundedPolygon([[0, -1.04], [1, 0.82], [-1, 0.82]], 0.38);
    default: {
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
        pts.push([Math.cos(a) * 0.98, Math.sin(a) * 0.98]);
      }
      return roundedPolygon(pts, 0.26);
    }
  }
}

function runeMark(ctx, c, colour) {
  ctx.save();
  ctx.scale(0.48, 0.48);
  if (c === 4) ctx.translate(0, 0.24);
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const p = new Path2D();
  switch (c) {
    case 0: // flame
      p.moveTo(0.02, -1);
      p.bezierCurveTo(0.2, -0.55, 0.85, -0.3, 0.76, 0.34);
      p.bezierCurveTo(0.7, 0.8, 0.32, 1, 0, 1);
      p.bezierCurveTo(-0.42, 1, -0.78, 0.72, -0.76, 0.26);
      p.bezierCurveTo(-0.74, -0.05, -0.5, -0.2, -0.42, -0.5);
      p.bezierCurveTo(-0.28, -0.36, -0.2, -0.26, -0.18, -0.12);
      p.bezierCurveTo(-0.05, -0.42, -0.08, -0.72, 0.02, -1);
      ctx.fill(p);
      break;
    case 1: // drop
      p.moveTo(0, -1);
      p.bezierCurveTo(0.3, -0.5, 0.78, -0.08, 0.78, 0.32);
      p.bezierCurveTo(0.78, 0.74, 0.42, 1, 0, 1);
      p.bezierCurveTo(-0.42, 1, -0.78, 0.74, -0.78, 0.32);
      p.bezierCurveTo(-0.78, -0.08, -0.3, -0.5, 0, -1);
      ctx.fill(p);
      break;
    case 2: // leaf
      p.moveTo(0.72, -0.82);
      p.bezierCurveTo(0.98, 0.1, 0.5, 0.82, -0.2, 0.74);
      p.quadraticCurveTo(-0.5, 0.92, -0.78, 0.94);
      p.quadraticCurveTo(-0.72, 0.68, -0.58, 0.42);
      p.bezierCurveTo(-0.76, -0.3, 0, -0.84, 0.72, -0.82);
      ctx.fill(p);
      break;
    case 3: // spiral
      ctx.lineWidth = 0.24;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 3.4; a += 0.2) {
        const r = 0.06 + a * 0.085;
        if (a) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      break;
    case 4: // crystal
      p.moveTo(0, -1);
      p.lineTo(0.68, -0.34);
      p.lineTo(0, 1);
      p.lineTo(-0.68, -0.34);
      p.closePath();
      ctx.fill(p);
      break;
    default: // sun
      for (let k = 0; k < 16; k++) {
        const r = k % 2 ? 0.55 : 1;
        const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
        if (k) p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      p.closePath();
      ctx.fill(p);
  }
  ctx.restore();
}

function canvasOf(px) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = Math.max(1, Math.ceil(px));
  return sprite;
}

// A rune is built up in layers: dark underside, curved body, rim light, recessed emblem, gloss.
function makeRuneSprite(c, px) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.translate(px / 2, px / 2 - px * 0.025);
  ctx.scale(px * 0.4, px * 0.4);
  const colours = RUNES[c];
  const shape = runeShape(c);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.65)';
  ctx.shadowBlur = px * 0.07;
  ctx.shadowOffsetY = px * 0.05;
  ctx.translate(0, 0.13);
  ctx.fillStyle = colours.low;
  ctx.fill(shape);
  ctx.restore();

  const body = ctx.createRadialGradient(-0.32, -0.48, 0.05, 0, 0.05, 1.3);
  body.addColorStop(0, colours.hi);
  body.addColorStop(0.42, colours.mid);
  body.addColorStop(1, colours.low);
  ctx.fillStyle = body;
  ctx.fill(shape);

  ctx.save();
  ctx.clip(shape);

  const rim = ctx.createLinearGradient(0, -1, 0, 1);
  rim.addColorStop(0, 'rgba(255,255,255,.85)');
  rim.addColorStop(0.5, 'rgba(255,255,255,.05)');
  rim.addColorStop(1, 'rgba(0,0,0,.45)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.14;
  ctx.stroke(shape);

  ctx.save();
  ctx.scale(0.68, 0.68);
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  ctx.fill(shape);
  ctx.restore();

  // A dark copy just below the emblem makes it look pressed into the rune.
  ctx.save();
  ctx.translate(0.02, 0.05);
  runeMark(ctx, c, 'rgba(0,0,0,.55)');
  ctx.restore();
  runeMark(ctx, c, colours.mark);

  const gloss = ctx.createLinearGradient(0, -1, 0, 0);
  gloss.addColorStop(0, 'rgba(255,255,255,.72)');
  gloss.addColorStop(1, 'rgba(255,255,255,.04)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(-0.08, -0.56, 0.72, 0.42, -0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.beginPath();
  ctx.ellipse(0.08, 0.72, 0.5, 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath();
  ctx.ellipse(-0.36, -0.54, 0.13, 0.08, -0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  ctx.lineWidth = 0.035;
  ctx.stroke(shape);
  return sprite;
}

// A bright band that slides across the rune, clipped to its shape.
function makeShineSprite(c, px, frame) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.translate(px / 2, px / 2 - px * 0.025);
  ctx.scale(px * 0.4, px * 0.4);
  ctx.clip(runeShape(c));
  const x = lerp(-1.4, 1.4, frame / (SHINE_FRAMES - 1));
  ctx.rotate(0.5);
  const band = ctx.createLinearGradient(x - 0.42, 0, x + 0.42, 0);
  band.addColorStop(0, 'rgba(255,255,255,0)');
  band.addColorStop(0.5, 'rgba(255,255,255,.85)');
  band.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = band;
  ctx.fillRect(-2, -2, 4, 4);
  return sprite;
}

function makeStarSprite(px) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.translate(px / 2, px / 2);
  ctx.scale(px / 2, px / 2);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.6);
  glow.addColorStop(0, 'rgba(255,255,255,.95)');
  glow.addColorStop(0.3, 'rgba(255,245,200,.4)');
  glow.addColorStop(1, 'rgba(255,245,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.fillStyle = '#fff';
  for (const rot of [0, Math.PI / 4]) {
    const reach = rot ? 0.5 : 1;
    ctx.save();
    ctx.rotate(rot);
    for (let k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -reach);
      ctx.quadraticCurveTo(0.03, -0.05, 0.12, 0);
      ctx.lineTo(-0.12, 0);
      ctx.quadraticCurveTo(-0.03, -0.05, 0, -reach);
      ctx.fill();
    }
    ctx.restore();
  }
  return sprite;
}

function makeTileSprite(px, slate) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.scale(px, px);
  const face = ctx.createLinearGradient(0, 0, 1, 1);
  face.addColorStop(0, slate[0]);
  face.addColorStop(1, slate[1]);
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, 1, 1);
  // Fixed speckle, so every tile looks like the same cut of stone.
  for (let k = 0; k < 40; k++) {
    const x = (k * 0.137 + 0.03) % 1;
    const y = (k * 0.291 + 0.07) % 1;
    ctx.fillStyle = k % 2 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
    ctx.fillRect(x, y, 0.035, 0.035);
  }
  const edge = 0.075;
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(1, 0);
  ctx.lineTo(1 - edge, edge);
  ctx.lineTo(edge, edge);
  ctx.lineTo(edge, 1 - edge);
  ctx.lineTo(0, 1);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  ctx.beginPath();
  ctx.moveTo(1, 1);
  ctx.lineTo(0, 1);
  ctx.lineTo(edge, 1 - edge);
  ctx.lineTo(1 - edge, 1 - edge);
  ctx.lineTo(1 - edge, edge);
  ctx.lineTo(1, 0);
  ctx.fill();
  return sprite;
}

function makeIronSprite(px) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.scale(px, px);
  const face = ctx.createLinearGradient(0, 0, 1, 1);
  face.addColorStop(0, '#d0a868');
  face.addColorStop(0.5, '#96703a');
  face.addColorStop(1, '#5c4220');
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, 1, 1);
  ctx.strokeStyle = 'rgba(40,24,6,.65)';
  ctx.lineWidth = 0.05;
  ctx.strokeRect(0.17, 0.17, 0.66, 0.66);
  ctx.strokeStyle = 'rgba(255,230,170,.5)';
  ctx.lineWidth = 0.025;
  ctx.strokeRect(0.21, 0.21, 0.58, 0.58);
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillRect(0, 0, 1, 0.05);
  ctx.fillRect(0, 0, 0.05, 1);
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillRect(0, 0.95, 1, 0.05);
  ctx.fillRect(0.95, 0, 0.05, 1);
  for (const [x, y] of [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]]) {
    const rivet = ctx.createRadialGradient(x - 0.015, y - 0.015, 0, x, y, 0.05);
    rivet.addColorStop(0, '#fff2c8');
    rivet.addColorStop(1, '#5c4220');
    ctx.fillStyle = rivet;
    ctx.beginPath();
    ctx.arc(x, y, 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  return sprite;
}

function makeBoulderSprite(px) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.scale(px, px);
  const shape = roundedPolygon(
    [[0.2, 0.08], [0.78, 0.05], [0.96, 0.42], [0.86, 0.9], [0.32, 0.97], [0.05, 0.62]],
    0.14,
  );
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = px * 0.08;
  ctx.shadowOffsetY = px * 0.05;
  const body = ctx.createRadialGradient(0.36, 0.28, 0.04, 0.5, 0.5, 0.72);
  body.addColorStop(0, '#d8cfc0');
  body.addColorStop(0.55, '#857a6c');
  body.addColorStop(1, '#3a342c');
  ctx.fillStyle = body;
  ctx.fill(shape);
  ctx.restore();
  ctx.strokeStyle = 'rgba(25,20,15,.55)';
  ctx.lineWidth = 0.028;
  ctx.beginPath();
  ctx.moveTo(0.3, 0.3);
  ctx.lineTo(0.48, 0.46);
  ctx.lineTo(0.42, 0.72);
  ctx.moveTo(0.48, 0.46);
  ctx.lineTo(0.76, 0.38);
  ctx.stroke();
  return sprite;
}

function makeIceSprite(px) {
  const sprite = canvasOf(px);
  const ctx = sprite.getContext('2d');
  ctx.scale(px, px);
  const face = ctx.createLinearGradient(0, 0, 1, 1);
  face.addColorStop(0, 'rgba(235,250,255,.62)');
  face.addColorStop(0.5, 'rgba(170,220,250,.28)');
  face.addColorStop(1, 'rgba(120,180,235,.55)');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.roundRect(0.03, 0.03, 0.94, 0.94, 0.08);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 0.04;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath();
  ctx.moveTo(0.12, 0.12);
  ctx.lineTo(0.5, 0.12);
  ctx.lineTo(0.12, 0.5);
  ctx.fill();
  return sprite;
}

export class BoardView {
  constructor(canvas, { onStep } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onStep = onStep ?? (() => {});
    this.size = 0;
    this.sprites = new Map();
    this.gems = new Map();
    this.cells = [];
    this.tweens = [];
    this.particles = [];
    this.floats = [];
    this.blasts = [];
    this.beams = [];
    this.glints = [];
    this.flow = [];
    this.chain = null;
    this.hint = null;
    this.selected = -1;
    this.targetCells = null;
    this.running = false;
    this.time = 0;
    this.last = 0;
    this.shake = 0;
    this.tilesDirty = true;
    this.tileLayer = document.createElement('canvas');
    this.frame = this.frame.bind(this);
  }

  load(state, book) {
    this.w = state.w;
    this.h = state.h;
    this.fixed = state.cells.map((c) => ({
      hole: c.hole, iron: c.iron, src: c.src, alt: c.alt, launcher: c.launcher,
    }));
    this.cells = state.cells.map((c) => ({ e: c.e, tile: c.tile, stone: c.stone, ice: c.ice, fired: c.fired }));
    this.theme = THEMES[book];
    this.gems.clear();
    this.tweens = [];
    this.particles = [];
    this.floats = [];
    this.blasts = [];
    this.beams = [];
    this.glints = [];
    this.chain = null;
    this.hint = null;
    this.selected = -1;
    this.targetCells = null;
    this.shake = 0;
    state.cells.forEach((c, i) => {
      if (c.gem) this.addGem(c.gem.id, c.gem.c, i);
    });
    this.computeFlow();
    this.sprites.clear();
    this.resize();
  }

  addGem(id, c, idx, row) {
    const gem = { id, c, scale: 1, alpha: 1, x: idx % this.w, y: row ?? Math.floor(idx / this.w) };
    this.gems.set(id, gem);
    return gem;
  }

  // Fits the board inside its parent. Sizes stay in cell units, so this is safe mid-animation.
  resize() {
    if (!this.w) return;
    const parent = this.canvas.parentElement;
    const fit = Math.min(
      (parent.clientWidth - FRAME_SPACE) / this.w,
      (parent.clientHeight - FRAME_SPACE) / this.h,
    );
    const cell = Math.floor(Math.min(fit, MAX_CELL));
    if (cell <= 0) return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2.5);
    this.canvas.style.width = `${cell * this.w}px`;
    this.canvas.style.height = `${cell * this.h}px`;
    this.canvas.width = Math.round(cell * this.w * dpr);
    this.canvas.height = Math.round(cell * this.h * dpr);
    this.tileLayer.width = this.canvas.width;
    this.tileLayer.height = this.canvas.height;
    this.cellCss = cell;
    this.size = cell * dpr;
    this.sprites.clear();
    this.tilesDirty = true;
  }

  cached(key, make) {
    let sprite = this.sprites.get(key);
    if (!sprite) {
      sprite = make();
      this.sprites.set(key, sprite);
    }
    return sprite;
  }

  // The cell under a pointer and how far the pointer is from its centre, in cells.
  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const fx = (clientX - rect.left) / this.cellCss;
    const fy = (clientY - rect.top) / this.cellCss;
    const x = Math.floor(fx);
    const y = Math.floor(fy);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return { idx: -1, dist: Infinity };
    return { idx: y * this.w + x, dist: Math.hypot(fx - x - 0.5, fy - y - 0.5) };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.time += dt;
    this.updateTweens(dt);
    this.updateEffects(dt);
    this.draw();
    requestAnimationFrame(this.frame);
  }

  tween(ms, fn, ease = easeOut, delayMs = 0) {
    return new Promise((resolve) => {
      this.tweens.push({ t: -delayMs / 1000, d: ms / 1000, fn, ease, resolve });
    });
  }

  updateTweens(dt) {
    const done = [];
    this.tweens = this.tweens.filter((tw) => {
      tw.t += dt;
      if (tw.t < 0) return true;
      const k = Math.min(tw.t / tw.d, 1);
      tw.fn(tw.ease(k));
      if (k >= 1) done.push(tw);
      return k < 1;
    });
    done.forEach((tw) => tw.resolve());
  }

  updateEffects(dt) {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      return p.life > 0;
    });
    this.floats = this.floats.filter((f) => {
      f.life -= dt;
      f.y -= dt * f.rise;
      return f.life > 0;
    });
    this.blasts = this.blasts.filter((b) => (b.life -= dt) > 0);
    this.beams = this.beams.filter((b) => (b.life -= dt) > 0);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.updateGlints(dt);
  }

  // Runes catch the light at random, so the board is always glimmering a little.
  updateGlints(dt) {
    this.glints = this.glints.filter((g) => (g.t += dt / g.dur) < 1);
    const rate = REDUCED_MOTION ? 2 : 22;
    let toAdd = rate * dt + (Math.random() < (rate * dt) % 1 ? 1 : 0);
    if (!this.gems.size) return;
    const gems = [...this.gems.values()];
    while (toAdd-- >= 1 && this.glints.length < 26) {
      const gem = gems[Math.floor(Math.random() * gems.length)];
      this.glints.push({
        gem,
        t: 0,
        dur: 0.45 + Math.random() * 0.4,
        ox: -0.22 + Math.random() * 0.44,
        oy: -0.3 + Math.random() * 0.36,
        star: Math.random() < 0.65,
        big: 0.5 + Math.random() * 0.45,
      });
    }
  }

  spray(idx, colour, count, { speed = 3.4, life = 0.42, size = 0.055, gravity = 8 } = {}) {
    if (REDUCED_MOTION || this.particles.length > 420) return;
    const cx = idx % this.w + 0.5;
    const cy = Math.floor(idx / this.w) + 0.5;
    for (let k = 0; k < count; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random());
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1,
        life: life * (0.5 + Math.random()),
        r: size * (0.5 + Math.random()),
        colour, gravity,
      });
    }
  }

  // Distance from the source along charged cells; drives the moving ripple in the energy.
  computeFlow() {
    const { w, h, cells, fixed } = this;
    const flow = new Array(cells.length).fill(-1);
    const queue = [];
    fixed.forEach((c, i) => {
      if (c.src) {
        flow[i] = 0;
        queue.push(i);
      }
    });
    while (queue.length) {
      const i = queue.shift();
      const x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n >= 0 && n < w * h && cells[n].e && flow[n] < 0) {
          flow[n] = flow[i] + 1;
          queue.push(n);
        }
      }
    }
    this.flow = flow;
  }

  rebuildTiles() {
    const { w, cells, fixed, size } = this;
    const px = Math.ceil(size);
    const tile = this.cached('tile', () => makeTileSprite(px, this.theme.slate));
    const iron = this.cached('iron', () => makeIronSprite(px));
    const boulder = this.cached('boulder', () => makeBoulderSprite(px));
    const ctx = this.tileLayer.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.tileLayer.width, this.tileLayer.height);
    ctx.setTransform(size, 0, 0, size, 0, 0);
    // Tiles are raised, so each throws a shadow down into the open channel beside it.
    ctx.shadowColor = 'rgba(0,0,0,.75)';
    ctx.shadowBlur = size * 0.2;
    ctx.shadowOffsetX = size * 0.05;
    ctx.shadowOffsetY = size * 0.07;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].tile) ctx.drawImage(tile, i % w, Math.floor(i / w), 1, 1);
    }
    for (let i = 0; i < cells.length; i++) {
      if (fixed[i].iron) ctx.drawImage(iron, i % w, Math.floor(i / w), 1, 1);
    }
    ctx.shadowColor = 'transparent';
    for (let i = 0; i < cells.length; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      if (fixed[i].hole) {
        ctx.fillStyle = '#05060c';
        ctx.fillRect(x, y, 1, 1);
      }
      if (cells[i].stone) ctx.drawImage(boulder, x, y, 1, 1);
    }
    this.tilesDirty = false;
  }

  draw() {
    const { ctx, size, canvas, w, cells, fixed, time } = this;
    if (!size) return;
    if (this.tilesDirty) this.rebuildTiles();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.theme.pit;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.setTransform(size, 0, 0, size, sx * size, sy * size);

    this.drawEnergy();
    ctx.drawImage(this.tileLayer, 0, 0, canvas.width / size, canvas.height / size);

    for (let i = 0; i < cells.length; i++) {
      if (fixed[i].src || fixed[i].alt || fixed[i].launcher) this.drawDevice(i);
    }
    if (this.targetCells) {
      ctx.fillStyle = `rgba(255,225,130,${0.32 + 0.14 * Math.sin(time * 8)})`;
      for (const i of this.targetCells) ctx.fillRect(i % w, Math.floor(i / w), 1, 1);
    }
    if (this.selected >= 0) {
      ctx.strokeStyle = '#fff1b8';
      ctx.lineWidth = 0.09;
      ctx.strokeRect(this.selected % w + 0.05, Math.floor(this.selected / w) + 0.05, 0.9, 0.9);
    }

    const inChain = this.chain ? new Set(this.chain.ids) : null;
    const hinted = this.hint ? new Set(this.hint) : null;
    const pulse = 1 + Math.sin(time * 7) * 0.1;
    this.gems.forEach((gem) => {
      if (inChain?.has(gem.id)) return;
      this.drawRune(gem, hinted?.has(gem.id) ? pulse : 1);
    });

    ctx.globalCompositeOperation = 'lighter';
    this.drawGlints();
    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < cells.length; i++) {
      if (cells[i].ice) ctx.drawImage(this.cached('ice', () => makeIceSprite(Math.ceil(size))), i % w, Math.floor(i / w), 1, 1);
    }

    if (this.chain) this.drawChain();
    this.drawEffects();
  }

  // Liquid energy sits below the tiles, with ripples running away from the source.
  drawEnergy() {
    const { ctx, w, cells, fixed, time } = this;
    const energy = this.theme.energy;
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i].e || fixed[i].hole) continue;
      const x = i % w;
      const y = Math.floor(i / w);
      ctx.fillStyle = `rgb(${energy})`;
      ctx.fillRect(x, y, 1.01, 1.01);
      const wave = Math.sin(time * 3 - this.flow[i] * 0.75);
      const mottle = Math.sin(x * 12.9 + y * 78.2 + time * 1.3);
      ctx.fillStyle = wave > 0
        ? `rgba(255,255,255,${wave * 0.3 + mottle * 0.04})`
        : `rgba(0,30,10,${-wave * 0.2})`;
      ctx.fillRect(x, y, 1.01, 1.01);
    }
  }

  drawDevice(i) {
    const { ctx, w, cells, fixed, time } = this;
    const cx = i % w + 0.5;
    const cy = Math.floor(i / w) + 0.5;
    const lit = cells[i].e;
    const energy = this.theme.energy;
    ctx.save();
    ctx.translate(cx, cy);

    const ring = ctx.createLinearGradient(-0.5, -0.5, 0.5, 0.5);
    ring.addColorStop(0, '#fff0a8');
    ring.addColorStop(0.5, '#d49a26');
    ring.addColorStop(1, '#6e4608');

    if (fixed[i].launcher) {
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.rotate((k / 4) * Math.PI * 2);
        ctx.fillStyle = cells[i].fired ? '#6d6450' : ring;
        ctx.beginPath();
        ctx.moveTo(0, -0.5);
        ctx.lineTo(0.2, -0.16);
        ctx.lineTo(-0.2, -0.16);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(0, 0, 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cells[i].fired ? '#3a3226' : `rgba(255,70,40,${0.75 + 0.25 * Math.sin(time * 5)})`;
      ctx.beginPath();
      ctx.arc(0, 0, 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const glow = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 0.95);
    const strength = fixed[i].src || lit ? 0.85 + 0.15 * Math.sin(time * 4) : 0.25;
    glow.addColorStop(0, `rgba(${fixed[i].src || lit ? energy : '255,205,90'},${strength})`);
    glow.addColorStop(1, `rgba(${fixed[i].src || lit ? energy : '255,205,90'},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(-1, -1, 2, 2);

    ctx.rotate(fixed[i].alt ? time * (lit ? 1.4 : 0.35) : -time * 0.8);
    ctx.fillStyle = ring;
    for (let k = 0; k < (fixed[i].alt ? 8 : 4); k++) {
      ctx.rotate(Math.PI / (fixed[i].alt ? 4 : 2));
      ctx.beginPath();
      ctx.moveTo(0.28, -0.1);
      ctx.lineTo(0.5, 0);
      ctx.lineTo(0.28, 0.1);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,0,.8)';
    ctx.lineWidth = 0.03;
    ctx.stroke();

    const jewel = ctx.createRadialGradient(-0.07, -0.08, 0.01, 0, 0, 0.22);
    if (fixed[i].src) {
      jewel.addColorStop(0, '#ffffff');
      jewel.addColorStop(1, `rgb(${energy})`);
    } else if (lit) {
      jewel.addColorStop(0, '#ffffff');
      jewel.addColorStop(1, '#ffd24a');
    } else {
      jewel.addColorStop(0, '#ff9c8a');
      jewel.addColorStop(1, '#9b1409');
    }
    ctx.fillStyle = jewel;
    ctx.beginPath();
    ctx.arc(0, 0, 0.21, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRune(gem, pulse) {
    const { ctx, size } = this;
    if (gem.alpha <= 0 || gem.scale <= 0) return;
    const cx = gem.x + 0.5;
    const cy = gem.y + 0.5;
    if (cy < -0.6) return;
    const s = gem.scale * pulse;
    const sprite = this.cached(`rune${gem.c}`, () => makeRuneSprite(gem.c, Math.ceil(size)));
    ctx.globalAlpha = gem.alpha;
    ctx.drawImage(sprite, cx - s / 2, cy - s / 2, s, s);
    ctx.globalAlpha = 1;
  }

  drawGlints() {
    const { ctx, size } = this;
    const px = Math.ceil(size);
    const star = this.cached('star', () => makeStarSprite(px));
    for (const g of this.glints) {
      const { gem } = g;
      if (!this.gems.has(gem.id)) continue;
      const cx = gem.x + 0.5;
      const cy = gem.y + 0.5;
      const frame = Math.min(SHINE_FRAMES - 1, Math.floor(g.t * SHINE_FRAMES));
      const shine = this.cached(`shine${gem.c}.${frame}`, () => makeShineSprite(gem.c, px, frame));
      ctx.globalAlpha = 0.8;
      ctx.drawImage(shine, cx - 0.5, cy - 0.5, 1, 1);
      if (g.star) {
        const k = Math.sin(g.t * Math.PI);
        const s = g.big * k;
        ctx.globalAlpha = k;
        ctx.drawImage(star, cx + g.ox - s / 2, cy + g.oy - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawChain() {
    const { ctx, w, time } = this;
    const { path, area } = this.chain;
    if (area) {
      ctx.fillStyle = `rgba(255,190,70,${0.28 + 0.14 * Math.sin(time * 9)})`;
      for (const i of area) ctx.fillRect(i % w, Math.floor(i / w), 1, 1);
    }
    const centre = (i) => [i % w + 0.5, Math.floor(i / w) + 0.5];
    const line = (width, colour) => {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      path.forEach((i, k) => {
        const [x, y] = centre(i);
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    };
    ctx.globalCompositeOperation = 'lighter';
    line(0.4, 'rgba(255,190,70,.35)');
    ctx.globalCompositeOperation = 'source-over';
    for (const id of this.chain.ids) {
      const gem = this.gems.get(id);
      if (gem) this.drawRune(gem, 1.2 + Math.sin(time * 10 + id) * 0.04);
    }
    ctx.globalCompositeOperation = 'lighter';
    line(0.16, 'rgba(255,225,130,.9)');
    line(0.06, '#ffffff');
    ctx.globalCompositeOperation = 'source-over';

    // Sits above the finger, which would otherwise hide the count.
    const [tx, ty] = centre(path[path.length - 1]);
    const by = ty > 1.6 ? ty - 1.25 : ty + 1.25;
    const ready = path.length >= 5;
    ctx.fillStyle = ready ? '#ffcf4a' : '#2a2135';
    ctx.strokeStyle = ready ? '#fff' : '#e3bd62';
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    ctx.arc(tx, by, 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ready ? '#3a1d00' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 0.62px Georgia, serif';
    ctx.fillText(String(path.length), tx, by + 0.03);
    ctx.textBaseline = 'alphabetic';
  }

  drawEffects() {
    const { ctx, w, h } = this;
    ctx.globalCompositeOperation = 'lighter';
    const energy = this.theme.energy;
    for (const b of this.beams) {
      const k = b.life / b.max;
      const cx = b.idx % w + 0.5;
      const cy = Math.floor(b.idx / w) + 0.5;
      for (const [width, colour] of [[1.5 * k, `rgba(${energy},${k * 0.6})`], [0.7 * k, `rgba(255,240,170,${k})`], [0.26 * k, '#ffffff']]) {
        ctx.fillStyle = colour;
        ctx.fillRect(0, cy - width / 2, w, width);
        ctx.fillRect(cx - width / 2, 0, width, h);
      }
      const flare = ctx.createRadialGradient(cx, cy, 0, cx, cy, 2.4);
      flare.addColorStop(0, `rgba(255,255,255,${k})`);
      flare.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = flare;
      ctx.fillRect(cx - 2.4, cy - 2.4, 4.8, 4.8);
    }
    for (const b of this.blasts) {
      const k = 1 - b.life / b.max;
      const reach = (b.r + 0.7) * (0.35 + 0.95 * easeOut(k));
      const fade = 1 - k;
      const flash = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, reach);
      flash.addColorStop(0, `rgba(255,255,255,${fade})`);
      flash.addColorStop(0.4, `rgba(255,225,120,${fade * 0.85})`);
      flash.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = flash;
      ctx.fillRect(b.x - reach, b.y - reach, reach * 2, reach * 2);
      ctx.strokeStyle = `rgba(255,240,180,${fade})`;
      ctx.lineWidth = 0.22 * fade;
      ctx.beginPath();
      ctx.arc(b.x, b.y, reach * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${fade * 0.9})`;
      const rays = 6 + b.r * 2;
      for (let n = 0; n < rays; n++) {
        const a = (n / rays) * Math.PI * 2 + b.spin;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -0.14 * fade);
        ctx.lineTo(reach * 1.5, 0);
        ctx.lineTo(0, 0.14 * fade);
        ctx.fill();
        ctx.restore();
      }
    }
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life * 3);
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.textAlign = 'center';
    for (const f of this.floats) {
      ctx.font = `700 ${f.size}px Georgia, serif`;
      ctx.globalAlpha = Math.min(1, f.life * 2.4);
      ctx.lineWidth = f.size * 0.18;
      ctx.strokeStyle = 'rgba(50,20,0,.9)';
      // Keeps banners on the board, even when the chain ends beside the edge.
      const half = ctx.measureText(f.text).width / 2 + f.size * 0.2;
      const x = Math.min(w - half, Math.max(half, f.x));
      ctx.strokeText(f.text, x, f.y);
      ctx.fillStyle = f.colour;
      ctx.fillText(f.text, x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  setChain(path, gemId, area) {
    this.chain = path.length ? { path, ids: path.map(gemId), area } : null;
  }

  setHint(path, gemId) {
    this.hint = path ? path.map(gemId) : null;
  }

  async play(steps) {
    for (const step of steps) {
      this.onStep(step);
      await this[`play_${step.type}`](step);
    }
  }

  // One tick of energy flow. The cells update here, so the channel fills as it travels.
  applyFlow(tick) {
    this.cells = tick.cells;
    this.computeFlow();
    const colour = `rgb(${this.theme.energy})`;
    for (const i of tick.energized) this.spray(i, colour, 1, { speed: 1.2, life: 0.3, gravity: 0 });
    for (const i of tick.litAltars) {
      this.blasts.push(this.makeBlast(i, 1.5));
      this.spray(i, '#fff3b0', 40, { speed: 6, life: 0.9 });
      this.shake = Math.max(this.shake, 0.25);
    }
  }

  makeBlast(idx, r, max = 0.42 + r * 0.09) {
    return {
      x: idx % this.w + 0.5,
      y: Math.floor(idx / this.w) + 0.5,
      r, max, life: max,
      spin: Math.random() * 6,
    };
  }

  // Lights up the whole board once a level is won.
  celebrate(altars) {
    for (const i of altars) this.blasts.push(this.makeBlast(i, 3));
    this.shake = 0.3;
    this.gems.forEach((gem) => {
      this.glints.push({ gem, t: Math.random() * 0.3, dur: 0.8, ox: 0, oy: -0.15, star: true, big: 1 });
    });
  }

  moveGem(gem, toX, toY, ms, ease) {
    const fromX = gem.x;
    const fromY = gem.y;
    return this.tween(ms, (k) => {
      gem.x = lerp(fromX, toX, k);
      gem.y = lerp(fromY, toY, k);
    }, ease);
  }

  play_swap(step) {
    const ga = this.gems.get(step.ida);
    const gb = this.gems.get(step.idb);
    const pos = (i) => [i % this.w, Math.floor(i / this.w)];
    return Promise.all([this.moveGem(ga, ...pos(step.b), 170), this.moveGem(gb, ...pos(step.a), 170)]);
  }

  play_clear(step) {
    const { w } = this;
    this.chain = null;
    this.cells = step.cells;
    this.computeFlow();
    this.tilesDirty = true;

    // The chain pops rune by rune towards the last one, then that one explodes.
    const gap = step.path.length ? Math.min(32, 300 / step.path.length) : 0;
    const order = new Map(step.path.map((i, k) => [i, k]));
    const chainTime = step.path.length * gap;
    for (const r of step.removed) {
      const gem = this.gems.get(r.id);
      const inPath = order.has(r.idx);
      const delay = inPath ? order.get(r.idx) * gap : chainTime;
      if (!gem) continue;
      this.tween(150, (k) => {
        gem.scale = 1 + k * 0.35;
        gem.alpha = 1 - k;
      }, easeOut, delay).then(() => this.gems.delete(r.id));
      setTimeout(() => this.spray(r.idx, RUNES[r.c]?.mid ?? '#fff', inPath ? 8 : 5), delay);
    }
    for (const i of step.opened) {
      setTimeout(() => this.spray(i, this.theme.slate[0], 4, { speed: 2.6, life: 0.5, size: 0.075, gravity: 12 }), chainTime);
    }
    for (const c of step.cracks) this.spray(c.idx, '#b8ae9e', 16, { speed: 4.5, life: 0.7, size: 0.1, gravity: 12 });

    if (step.blast) {
      const { idx, r, length } = step.blast;
      setTimeout(() => {
        this.blasts.push(this.makeBlast(idx, r));
        this.spray(idx, '#ffe9a0', 20 + r * 16, { speed: 3.5 + r * 2, life: 0.7 });
        this.shake = Math.max(this.shake, 0.14 + r * 0.14);
        if (length) {
          this.floats.push({
            text: `Chain ${length}!`, life: 1, rise: 0.7, size: 0.75 + r * 0.2, colour: '#ffe27a',
            x: Math.min(w - 2, Math.max(2, idx % w + 0.5)),
            y: Math.max(1.2, Math.floor(idx / w) - 0.4),
          });
        }
      }, chainTime);
    }
    for (const b of step.beams) {
      setTimeout(() => {
        this.beams.push({ idx: b.idx, life: 0.48, max: 0.48 });
        this.shake = Math.max(this.shake, 0.32);
      }, chainTime);
    }
    if (step.removed.length) {
      const anchor = step.path.length ? step.path[step.path.length - 1] : step.removed[0].idx;
      this.floats.push({
        text: `+${step.points}`, life: 0.95, rise: 0.9, size: 0.5, colour: '#fff3c4',
        x: Math.min(w - 1, Math.max(1, anchor % w + 0.5)),
        y: Math.floor(anchor / w) + 0.3,
      });
    }
    return this.tween(chainTime + (step.blast ? 170 : 120), () => {});
  }

  play_fall(step) {
    const jobs = [];
    const speed = (d) => 90 + 70 * Math.sqrt(Math.max(d, 1));
    for (const m of step.moves) {
      const gem = this.gems.get(m.id);
      if (!gem) continue;
      const toY = Math.floor(m.to / this.w);
      jobs.push(this.moveGem(gem, m.to % this.w, toY, speed(toY - gem.y), easeIn));
    }
    for (const s of step.spawns) {
      const gem = this.addGem(s.id, s.c, s.to, s.row);
      const toY = Math.floor(s.to / this.w);
      jobs.push(this.moveGem(gem, s.to % this.w, toY, speed(toY - gem.y), easeIn));
    }
    return Promise.all(jobs);
  }

  play_shuffle(step) {
    const jobs = step.gems.map((g) => {
      const gem = this.gems.get(g.id);
      if (!gem) return null;
      gem.c = g.c;
      return this.moveGem(gem, g.idx % this.w, Math.floor(g.idx / this.w), 420);
    });
    return Promise.all(jobs);
  }
}
