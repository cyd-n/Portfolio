const Audio = {
  ctx: null, master: null, wet: null, amb: null, mode: store.get('cube.sound', 'stereo'),
  init() {
    if (this.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.mode === 'off' ? 0 : .7;
    const comp = ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(ctx.destination);
    const conv = ctx.createConvolver(); conv.buffer = this.impulse(2.8, 2.6);
    this.wet = ctx.createGain(); this.wet.gain.value = .8; this.wet.connect(conv); conv.connect(this.master);
  },
  resume() { try { this.ctx && this.ctx.resume(); } catch (e) {} },
  impulse(sec, decay) { const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; },
  pan(p) { return this.mode === 'stereo' ? p : 0; },
  out(node, o) {
    const ctx = this.ctx; let n = node;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = this.pan(o.pan || 0); n.connect(p); n = p; }
    n.connect(this.master);
    if (o.wet) { const s = ctx.createGain(); s.gain.value = o.wet; n.connect(s); s.connect(this.wet); }
  },
  tone(f, dur, o = {}) {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime + (o.when || 0);
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    const g = ctx.createGain(), peak = o.gain == null ? .15 : o.gain, a = o.attack == null ? .005 : o.attack;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g); let n = g;
    if (o.lp) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; g.connect(lp); n = lp; }
    this.out(n, o); osc.start(t); osc.stop(t + dur + .05);
  },
  noise(dur, o = {}) {
    if (!this.ctx) return; const ctx = this.ctx, t = ctx.currentTime + (o.when || 0);
    if (!this._nb) { const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this._nb = b; }
    const src = ctx.createBufferSource(); src.buffer = this._nb; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = o.q || 1.2;
    bp.frequency.setValueAtTime(o.from || 500, t); bp.frequency.exponentialRampToValueAtTime(o.to || 3000, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.gain || .06, t + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(bp); bp.connect(g); this.out(g, o); src.start(t); src.stop(t + dur + .05);
  },
  power() { this.tone(1400, .03, { type: 'square', gain: .025 }); this.tone(90, .35, { to: 40, gain: .16 }); },
  tick(i, pan, alt) {
    const sc = [0, 2, 4, 7, 9], n = (alt ? 67 : 72) + sc[i % 5] + 12 * Math.floor((i % 10) / 5);
    if (alt) this.tone(mf(n), .09, { type: 'square', gain: .028, lp: 2200, pan, wet: .25 });
    else this.tone(mf(n), .12, { type: 'triangle', gain: .045, pan, wet: .3 });
  },
  thud(pan, big) { this.tone(big ? 130 : 160, big ? .3 : .2, { to: 50, slide: .18, gain: big ? .26 : .18, pan }); this.noise(.07, { from: 2200, to: 700, gain: .025, pan }); },
  leap() { this.tone(300, .45, { to: 1000, slide: .4, type: 'triangle', gain: .05, wet: .35 }); this.noise(.45, { from: 400, to: 4000, gain: .03 }); },
  impact() { this.tone(95, .7, { to: 32, slide: .5, gain: .28 }); this.noise(.5, { from: 3500, to: 180, gain: .05, wet: .5 }); },
  whoom() { this.tone(55, 1.3, { to: 110, slide: 1.1, gain: .14, attack: .2, wet: .4 }); this.noise(1.2, { from: 180, to: 1600, gain: .03, q: .8, wet: .5 }); },
  chord(alt) {
    if (alt) {
      [67, 70, 74, 77, 79, 82, 86].forEach((m, i) => this.tone(mf(m), .2, { type: 'square', gain: .035, when: i * .07, to: mf(m + (i % 2 ? 5 : -2)), slide: .12, wet: .35, lp: 2600, pan: i % 2 ? .5 : -.5 }));
      this.tone(mf(55), .5, { type: 'square', gain: .04, when: .5, to: mf(67), slide: .3, lp: 1200, wet: .4 });
      [79, 83, 86, 91].forEach((m, i) => this.tone(mf(m), 1.8, { type: 'triangle', gain: .06, when: .62 + i * .02, wet: .7 }));
      return;
    }
    const notes = [60, 64, 67, 71, 74, 79];
    notes.forEach((m, i) => {
      this.tone(mf(m), 3.6, { gain: .085, when: i * .075, attack: .01, wet: .85, pan: (i / (notes.length - 1) - .5) * .9 });
      this.tone(mf(m + 12), 1.3, { type: 'triangle', gain: .018, when: i * .075 + .01, wet: .9 });
    });
    this.tone(mf(36), 4.2, { gain: .12, attack: .05, wet: .4 });
    this.tone(mf(48), 3.6, { type: 'triangle', gain: .04, attack: .3, wet: .6, lp: 800 });
  },
  move(dir) { const pan = { left: -.7, right: .7 }[dir] || 0; this.tone(620, .09, { to: 930, slide: .05, gain: .09, pan, wet: .2 }); },
  blip() { this.tone(980, .05, { gain: .05, wet: .1 }); },
  select() { this.tone(784, .14, { type: 'triangle', gain: .1, wet: .3 }); this.tone(1175, .22, { type: 'triangle', gain: .08, when: .07, wet: .3 }); },
  open() { this.select(); this.noise(.45, { from: 300, to: 3500, gain: .04, wet: .3 }); },
  back() { this.tone(700, .14, { to: 420, slide: .1, type: 'triangle', gain: .09, wet: .2 }); },
  whoosh(d) { this.noise(.3, { from: 600, to: 2600, gain: .05, pan: d * .6 }); this.tone(330, .12, { to: 500, gain: .04, pan: d * .5 }); },
  spin() { this.noise(1.1, { from: 200, to: 4000, gain: .05, q: 3 }); this.tone(180, 1.1, { to: 900, slide: .9, type: 'triangle', gain: .04, wet: .3 }); },
  startAmb() {
    if (!this.ctx) return; const ctx = this.ctx;
    if (!this.amb) {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(this.master);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = .6; lp.connect(g);
      const s = ctx.createGain(); s.gain.value = .6; lp.connect(s); s.connect(this.wet);
      [45, 52, 57, 64].forEach((m, i) => { const o = ctx.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = mf(m); o.detune.value = i % 2 ? 7 : -7; const og = ctx.createGain(); og.gain.value = i < 2 ? .16 : .12; o.connect(og); og.connect(lp); o.start(); });
      const lfo = ctx.createOscillator(); lfo.frequency.value = .07; const lg = ctx.createGain(); lg.gain.value = 320; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      this.amb = g;
    }
    this.amb.gain.cancelScheduledValues(ctx.currentTime); this.amb.gain.setTargetAtTime(.05, ctx.currentTime, 1.2);
  },
  stopAmb() { if (this.amb) { this.amb.gain.cancelScheduledValues(this.ctx.currentTime); this.amb.gain.setTargetAtTime(0, this.ctx.currentTime, .3); } },
  setMode(m) { this.mode = m; store.set('cube.sound', m); if (this.master) this.master.gain.setTargetAtTime(m === 'off' ? 0 : .7, this.ctx.currentTime, .05); }
};