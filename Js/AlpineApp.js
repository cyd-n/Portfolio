const SCREENS = ['disc', 'memory', 'calendar', 'options'];
const MENU_TO = { up: 'disc', right: 'memory', left: 'calendar', down: 'options' };
const META = {
  disc: { title: 'PLAY DISC', sub: 'Projects' }, memory: { title: 'MEMORY CARD', sub: 'Skills saved to two slots' },
  calendar: { title: 'CALENDAR', sub: 'Experience and education' }, options: { title: 'OPTIONS', sub: 'About, contact and settings' }
};
const HINTS = {
  menu: [['✚', '', 'Move'], ['A', 'bg-padA', 'Open']],
  disc: [['◀ ▶', '', 'Switch'], ['A', 'bg-padA', 'Start'], ['B', 'bg-padB', 'Back']],
  memory: [['✚', '', 'Browse'], ['B', 'bg-padB', 'Back']],
  calendar: [['◀ ▶', '', 'Browse'], ['B', 'bg-padB', 'Back']],
  options: [['▲ ▼', '', 'Select'], ['◀ ▶', '', 'Change'], ['A', 'bg-padA', 'Open'], ['B', 'bg-padB', 'Back']]
};
const ICONS = {
  disc: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="3.2"/><path d="M16 7.5a8.5 8.5 0 0 1 8.5 8.5" stroke-linecap="round" opacity=".6"/></svg>',
  calendar: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="7" width="22" height="20" rx="4"/><path d="M5 13h22M11 4v5M21 4v5"/><circle cx="11" cy="19" r="1" fill="currentColor"/><circle cx="16" cy="19" r="1" fill="currentColor"/><circle cx="21" cy="19" r="1" fill="currentColor"/><circle cx="11" cy="23" r="1" fill="currentColor"/></svg>',
  memory: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 4h14l3 3v21H6V7z"/><path d="M10 10h12v8H10z" opacity=".6"/><path d="M11 23v2M14 23v2M17 23v2M20 23v2" stroke-linecap="round"/></svg>',
  options: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9h20M6 16h20M6 23h20"/><circle cx="12" cy="9" r="2.6" fill="#130d40"/><circle cx="21" cy="16" r="2.6" fill="#130d40"/><circle cx="14" cy="23" r="2.6" fill="#130d40"/></svg>'
};
const KEYS = new Set();
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', Enter: 'a', ' ': 'a', Escape: 'b', Backspace: 'b' };
// mouse clicks shouldn't leave focus on buttons, so the keyboard keeps driving the "controller"
addEventListener('click', e => { if (e.detail > 0 && document.activeElement && document.activeElement.blur) document.activeElement.blur(); });

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    C: CONFIG, TYPES, Audio,
    screen: 'power', layer: 'power', lock: false, led: false, veil: true, bootName: false,
    menuSel: 'up', rx: 170, ry: 170, pos: clamp(store.get('cube.pos', 0), -4, 4),
    disc: { idx: 0, reading: false },
    mem: { idx: 0, checked: false, checking: true, text: '' },
    cal: { idx: -1 },
    opt: { idx: 0, lang: 0, sound: Audio.mode },
    toast: { msg: '', on: false }, clock: { h: '00', m: '00', s: '00', date: '' },
    slots: [], files: [], calList: [], optRows: [], nameChars: [],
    menuOpts: [
      { dir: 'up', label: 'PLAY DISC', icon: ICONS.disc }, { dir: 'left', label: 'CALENDAR', icon: ICONS.calendar },
      { dir: 'right', label: 'MEMORY CARD', icon: ICONS.memory }, { dir: 'down', label: 'OPTIONS', icon: ICONS.options }
    ],
    downT: 0, swipeX: null, pad: { prev: {}, rep: {} },

    init() {
      document.title = `${this.C.name}, ${this.C.role}`;
      this.nameChars = [...this.C.name.toUpperCase()];
      this.C.projects.forEach(p => { p.points = p.points || []; p.links = p.links || {}; });
      this.C.experience.forEach(e => { e.points = e.points || []; });
      this.slots = ['A', 'B', 'C', 'D'].map(k => {
        const s = this.C.skills[k];
        const files = s.files.map(f => { const o = Object.assign({ i: this.files.length, src: f.iconimg, slot: k }, f); this.files.push(o); return o; });
        return { k, label: s.label, files, free: 251 - files.reduce((t, f) => t + (f.blocks || 0), 0) };
      });
      this.calList = this.C.experience.slice().sort((a, b) => String(a.start).localeCompare(String(b.start)));
      const rows = [{ sect: 'SETTINGS' }, { k: 'SOUND', kind: 'set', key: 'sound' }, { k: 'SCREEN POSITION', kind: 'set', key: 'pos' }, { k: 'LANGUAGE', kind: 'set', key: 'lang' },
        { sect: 'CONTACT' }, ...this.C.contact.map(c => ({ k: c.label, kind: 'link', c })), { sect: 'SYSTEM' }, { k: 'POWER OFF', kind: 'act', v: 'Replay the intro' }];
      let n = 0; this.optRows = rows.map((r, id) => Object.assign({ id, n: r.sect ? -1 : n++ }, r));
      this.tickClock(); setInterval(() => this.tickClock(), 1000);
      Engine.init(document.getElementById('gl'), {
        screen: () => this.screen,
        bootName: () => { this.bootName = true; },
        bootDone: () => this.enterMenu(false),
        tick: t => this.pollPad(t)
      });
      if (document.fonts && document.fonts.load) document.fonts.load('900 104px "M PLUS Rounded 1c"').catch(() => {});
      this.$nextTick(() => this.onResize());
      addEventListener('resize', () => this.onResize());
      addEventListener('pointermove', e => Engine.pointer(e), { passive: true });
      addEventListener('blur', () => KEYS.clear());
    },

    /* ----- derived ----- */
    get isScreen() { return SCREENS.includes(this.layer); },
    get meta() { return META[this.layer] || META[this.screen] || { title: '', sub: '' }; },
    get hints() { return HINTS[this.layer] || []; },
    get menuDesc() {
      return { up: `${this.C.projects.length} projects in the tray`, right: `${this.files.length} skills across two slots`, left: 'Experience and education', down: 'About me, contact and settings' }[this.menuSel];
    },
    get project() { return this.C.projects[this.disc.idx]; },
    get projectMeta() { const p = this.project; return [['Built with', p.stack], ['Role', p.role], ['Team', p.team]].filter(m => m[1]); },
    get projectLinks() { const p = this.project; return [['play', 'Try it'], ['source', 'Source code']].filter(l => p.links[l[0]]); },
    get memFile() { return this.files[this.mem.idx] || {}; },
    get memLine() { const f = this.memFile; return [f.level, f.comment].filter(Boolean).join('. ').replace(/\.\./g, '.'); },
    get calItem() { return this.calList[Math.max(0, this.cal.idx)] || { points: [] }; },

    /* ----- helpers used in templates ----- */
    optStyle(dir) {
      const ox = dir === 'left' ? -this.rx : dir === 'right' ? this.rx : 0, oy = dir === 'up' ? -this.ry : dir === 'down' ? this.ry : 0;
      return `transform:translate(-50%,-50%) translate(${ox}px,${oy}px)`;
    },
    ym(s) { const [y, m] = String(s).split('-').map(Number); return { y, m: m || 0 }; },
    typeOf(e) { return TYPES[e && e.type] || TYPES.work; },
    tileLabel(e) { const d = this.ym(e.start); return d.m ? MONTHS[d.m - 1] : this.typeOf(e).label.toUpperCase(); },
    fmtOne(d) { return d.m ? `${MONTHS[d.m - 1][0]}${MONTHS[d.m - 1].slice(1).toLowerCase()} ${d.y}` : `${d.y}`; },
    fmtPeriod(e) {
      if (!e || !e.start) return '';
      const a = this.ym(e.start); if (!e.end || e.end === e.start) return this.fmtOne(a);
      const now = new Date(), live = e.end === 'present', b = live ? { y: now.getFullYear(), m: now.getMonth() + 1 } : this.ym(e.end);
      let dur = '';
      if (a.m && b.m) { const mo = (b.y - a.y) * 12 + (b.m - a.m) + 1, y = Math.floor(mo / 12), r = mo % 12; dur = [y ? `${y} yr${y > 1 ? 's' : ''}` : '', r ? `${r} mo${r > 1 ? 's' : ''}` : ''].filter(Boolean).join(' '); }
      return `${this.fmtOne(a)} to ${live ? 'present' : this.fmtOne(b)}${dur ? ', ' + dur : ''}`;
    },
    optVal(r) {
      if (r.key === 'sound') return { stereo: 'Stereo', mono: 'Mono', off: 'Off' }[this.opt.sound];
      if (r.key === 'lang') { const l = this.C.languages[this.opt.lang]; return l.level ? `${l.name} (${l.level})` : l.name; }
      if (r.kind === 'link') return r.c.value;
      return r.v || '';
    },
    showToast(msg) { this.toast.msg = msg; this.toast.on = true; clearTimeout(this._tt); this._tt = setTimeout(() => { this.toast.on = false; }, 2200); },
    openUrl(url) {
      Audio.select();
      if (!url) { this.showToast('Link coming soon'); return; }
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    },
    tickClock() {
      const d = new Date(), p = n => String(n).padStart(2, '0');
      this.clock = { h: p(d.getHours()), m: p(d.getMinutes()), s: p(d.getSeconds()), date: d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) };
    },
    onResize() {
      const r = document.getElementById('gl').getBoundingClientRect();
      this.ry = clamp(r.height * .27, 100, 220); this.rx = Math.max(90, Math.min(this.ry * 1.4, r.width / 2 - 66));
      Engine.resize(this.rx, this.ry);
    },

    /* ----- flow ----- */
    pwrClick() { const held = this.downT && performance.now() - this.downT > 700; this.downT = 0; this.powerOn(held || KEYS.has('z')); },
    powerOn(alt) {
      if (this.screen !== 'power' || this.lock) return;
      Audio.init(); Audio.resume(); Audio.power();
      this.led = true; this.screen = 'boot'; this.layer = null; this.bootName = false;
      if (!Engine.GL) { setTimeout(() => this.enterMenu(true), 500); return; }
      Engine.startBoot(alt);
      setTimeout(() => { if (this.screen === 'boot') this.layer = 'boot'; }, 300);
      if (alt) this.showToast('Alternate boot unlocked');
    },
    skipIntro() { if (this.screen !== 'power') return; Audio.init(); Audio.resume(); this.led = true; this.screen = 'boot'; this.enterMenu(true); },
    skip() { if (this.screen === 'boot' && (!Engine.GL || Engine.bootTime() > .35)) this.enterMenu(true); },
    enterMenu(fast) {
      if (this.screen !== 'boot') return;
      this.screen = 'menu-enter'; this.lock = true; this.layer = null; this.veil = false;
      Audio.startAmb(); if (fast) Audio.select();
      Engine.toMenu(fast);
      setTimeout(() => { this.screen = 'menu'; this.layer = 'menu'; this.lock = false; Engine.menuSelect(this.menuSel); }, Engine.GL ? (fast ? 700 : 1300) : 0);
    },
    menuSelect(dir, silent) { if (this.menuSel !== dir && !silent) Audio.move(dir); this.menuSel = dir; Engine.menuSelect(dir); },
    hoverSel(dir) { if (this.screen === 'menu' && !this.lock) this.menuSelect(dir); },
    openFromMenu(dir) { if (this.screen !== 'menu') return; this.menuSelect(dir, true); this.openScreen(MENU_TO[dir]); },
    openScreen(key) {
      if (this.lock) return; this.lock = true;
      Audio.open(); Engine.burst(); this.screen = key; this.layer = null;
      setTimeout(() => {
        this.layer = key; Engine.setMode('mini'); this.lock = false;
        if (key === 'disc') { Engine.discEnter(this.disc.idx); Audio.spin(); }
        if (key === 'memory') this.memEnter();
        if (key === 'calendar') this.calFocus(this.cal.idx < 0 ? this.calList.length - 1 : this.cal.idx);
        if (key === 'options') this.optFocus(this.opt.idx);
      }, 260);
    },
    back() {
      if (this.lock || !SCREENS.includes(this.screen)) return; this.lock = true;
      Audio.back(); Engine.discRead(false); this.disc.reading = false;
      this.screen = 'menu'; Engine.setMode('center'); this.layer = null;
      setTimeout(() => { this.layer = 'menu'; this.lock = false; }, 240);
    },
    powerOff() {
      if (this.lock) return; this.lock = true;
      Audio.back(); Audio.stopAmb();
      this.screen = 'power-off'; this.layer = null; this.veil = true; this.led = false; this.bootName = false;
      Engine.powerOff();
      setTimeout(() => { this.screen = 'power'; this.layer = 'power'; this.lock = false; }, 900);
    },

    /* ----- input ----- */
    input(a) {
      if (this.lock) return; const s = this.screen;
      if (s === 'power') { if (a === 'a') this.powerOn(false); return; }
      if (s === 'boot') { this.skip(); return; }
      if (s === 'menu') { if (a === 'a') this.openScreen(MENU_TO[this.menuSel]); else if (a !== 'b') this.menuSelect(a); return; }
      if (!SCREENS.includes(s)) return;
      if (a === 'b') { this.back(); return; }
      if (s === 'disc') { if (a === 'left') this.discGo(-1); else if (a === 'right') this.discGo(1); else if (a === 'a') this.discStart(); }
      if (s === 'memory' && a !== 'a' && !this.mem.checking) { const n = spatial([...document.querySelectorAll('[data-file]')], this.mem.idx, a); this.memFocus(n, true); }
      if (s === 'calendar' && (a === 'left' || a === 'right')) this.calFocus(clamp(this.cal.idx + (a === 'left' ? -1 : 1), 0, this.calList.length - 1), true);
      if (s === 'options') {
        if (a === 'up' || a === 'down') this.optFocus(clamp(this.opt.idx + (a === 'up' ? -1 : 1), 0, this.optRows.filter(r => !r.sect).length - 1), true);
        else if (a === 'left' || a === 'right') this.optChange(a === 'left' ? -1 : 1);
        else if (a === 'a') this.optAct();
      }
    },
    onKey(e) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; KEYS.add(k);
      const onButton = e.target.closest && e.target.closest('button');
      if (this.screen === 'boot') { if (!e.repeat) this.skip(); return; }
      if (this.screen === 'power') { if ((k === 'Enter' || k === ' ') && !onButton) { e.preventDefault(); this.powerOn(KEYS.has('z')); } return; }
      const act = KEYMAP[k]; if (!act) return;
      if ((k === 'Enter' || k === ' ') && onButton) return;
      e.preventDefault(); this.input(act);
    },
    onKeyUp(e) { KEYS.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); },
    pollPad(time) {
      let gp = null; try { const list = navigator.getGamepads ? navigator.getGamepads() : []; for (const g of list) if (g) { gp = g; break; } } catch (e) { return; }
      if (!gp) return;
      const B = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, pad = this.pad;
      const st = { up: B(12) || ay < -.55, down: B(13) || ay > .55, left: B(14) || ax < -.55, right: B(15) || ax > .55, a: B(0) || B(9), b: B(1) };
      for (const k in st) {
        if (st[k] && !pad.prev[k]) { this.screen === 'power' && k === 'a' ? this.powerOn(B(6) || B(7)) : this.input(k); pad.rep[k] = time + .4; }
        else if (st[k] && ['up', 'down', 'left', 'right'].includes(k) && time > pad.rep[k]) { this.input(k); pad.rep[k] = time + .13; }
      }
      pad.prev = st;
    },

    /* ----- play disc ----- */
    discGo(d) { const n = this.C.projects.length; this.disc.idx = (this.disc.idx + d + n) % n; Engine.discGo(this.disc.idx, d); Audio.whoosh(d); },
    discStart() {
      const p = this.project, url = p.links.play || p.links.source;
      Audio.spin(); Engine.discRead(true); this.disc.reading = true;
      setTimeout(() => this.openUrl(url), 1100);
      setTimeout(() => { Engine.discRead(false); this.disc.reading = false; }, 1500);
    },
    swipeStart(e) { if (!e.target.closest('button')) this.swipeX = e.clientX; },
    swipeEnd(e) { if (this.swipeX == null) return; const dx = e.clientX - this.swipeX; this.swipeX = null; if (Math.abs(dx) > 40) this.discGo(dx < 0 ? 1 : -1); },

    /* ----- memory card ----- */
    memEnter() {
      if (this.mem.checked) { this.mem.checking = false; this.memFocus(this.mem.idx); return; }
      this.mem.checked = true; this.mem.checking = true; this.mem.text = 'Checking the memory card in slot A…';
      setTimeout(() => { this.mem.text = 'Checking the memory card in slot B…'; }, 550);
      setTimeout(() => { this.mem.checking = false; Audio.blip(); this.memFocus(this.mem.idx); }, 1100);
    },
    memFocus(i, snd) {
      if (snd && i !== this.mem.idx) Audio.blip(); this.mem.idx = i;
      this.$nextTick(() => { const el = document.querySelector(`[data-file="${i}"]`); el && el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    },

    /* ----- calendar ----- */
    calFocus(i, snd) {
      if (snd && i !== this.cal.idx) Audio.blip(); this.cal.idx = i;
      this.$nextTick(() => { const el = document.querySelector(`[data-cal="${i}"]`); el && el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
    },

    /* ----- options ----- */
    optFocus(i, snd) {
      if (snd && i !== this.opt.idx) Audio.blip(); this.opt.idx = i;
      this.$nextTick(() => { const el = document.querySelector(`[data-row="${i}"]`); el && el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    },
    optRow() { return this.optRows.find(r => r.n === this.opt.idx); },
    optChange(d) {
      const r = this.optRow(); if (!r || r.kind !== 'set') return;
      if (r.key === 'sound') { const m = ['stereo', 'mono', 'off'], n = m[(m.indexOf(this.opt.sound) + d + 3) % 3]; Audio.setMode(n); this.opt.sound = n; if (n !== 'off') Audio.move(d < 0 ? 'left' : 'right'); }
      if (r.key === 'pos') { this.pos = clamp(this.pos + d, -4, 4); store.set('cube.pos', this.pos); Audio.blip(); }
      if (r.key === 'lang') { const n = this.C.languages.length; this.opt.lang = (this.opt.lang + d + n) % n; Audio.blip(); }
    },
    optAct() {
      const r = this.optRow(); if (!r) return;
      if (r.kind === 'link') this.openUrl(r.c.href);
      else if (r.kind === 'act') this.powerOff();
      else this.optChange(1);
    },
    optClick(r, e) { this.optFocus(r.n); const arr = e.target.closest('[data-d]'); if (r.kind === 'set') this.optChange(arr ? +arr.dataset.d : 1); else this.optAct(); }
  }));
});