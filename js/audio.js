// Sound effects synthesised with Web Audio, so there are no sound files to download.
// iOS only starts audio inside a user gesture, so unlock() runs on every pointer press.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.enabled) return;
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return;
    if (!this.ctx) this.ctx = new Ctor();
    // iOS reports "interrupted" after a call or when returning from the background.
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  tone(freq, { at = 0, dur = 0.14, vol = 0.14, type = 'sine', slide = 0 } = {}) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise({ at = 0, dur = 0.5, vol = 0.3 } = {}) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const { ctx } = this;
    const t = ctx.currentTime + at;
    const data = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const samples = data.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = data;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(t);
  }

  // Each rune added to a chain rings a step higher.
  link(length) {
    const step = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][Math.min(length - 1, 10)];
    this.tone(440 * 2 ** (step / 12), { dur: 0.1, vol: 0.09, type: 'triangle' });
  }

  unlink() {
    this.tone(300, { dur: 0.05, vol: 0.05, type: 'triangle' });
  }

  invalid() {
    this.tone(150, { dur: 0.14, vol: 0.08, type: 'square', slide: -50 });
  }

  clear(length) {
    for (let k = 0; k < Math.min(length, 8); k++) {
      this.tone(520 + k * 70, { at: k * 0.03, dur: 0.1, vol: 0.06 });
    }
  }

  explosion(radius) {
    this.noise({ dur: 0.4 + radius * 0.2, vol: 0.2 + radius * 0.09 });
    this.tone(120, { dur: 0.35 + radius * 0.12, vol: 0.25, type: 'sine', slide: -80 });
  }

  beam() {
    this.tone(1400, { dur: 0.4, vol: 0.1, type: 'sawtooth', slide: -1100 });
    this.noise({ dur: 0.3, vol: 0.14 });
  }

  crack() {
    this.tone(110, { dur: 0.13, vol: 0.15, type: 'sawtooth', slide: -60 });
  }

  charged() {
    [880, 1175].forEach((f, k) => this.tone(f, { at: k * 0.08, dur: 0.2, vol: 0.07 }));
  }

  altar() {
    [523, 784, 1047].forEach((f, k) => this.tone(f, { at: k * 0.07, dur: 0.34, vol: 0.1 }));
  }

  win() {
    [523, 659, 784, 1047, 1319].forEach((f, k) => this.tone(f, { at: k * 0.11, dur: 0.42, vol: 0.11, type: 'triangle' }));
  }

  lose() {
    [392, 330, 262].forEach((f, k) => this.tone(f, { at: k * 0.16, dur: 0.36, vol: 0.09, type: 'triangle' }));
  }
}
