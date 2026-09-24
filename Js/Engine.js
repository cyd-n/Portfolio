const Engine = (() => {
  let GL = false, renderer, scene, camera, refCam, W = 1, H = 1, ppu = 40, time = 0, hooks = {}, RX = 170, RY = 170;
  let V3, ZERO, MENU_CAM, DIRV, flo, floMat, floData = [], dummy, canvas;
  const TAN = Math.tan(20 * Math.PI / 180), CUBE_STEP = .93, CUBE_SPAN = 3 * .93, SCREENS = ['disc', 'memory', 'calendar', 'options'];
  const cam = { shake: 0, mode: 'free' }, par = { x: 0, y: 0, tx: 0, ty: 0 };
  const menu = { sel: 'up', mode: 'hidden', a: 0, burst: 0, spin: 0, curScale: .001, baseScale: 1, miniScale: .3, tiltX: 0, tiltY: 0, cubes: [] };
  const disc = { idx: 0, show: 0, speed: .6, tSpeed: .6, dir: 1, scale: 1, items: [], built: false };
  const boot = { built: false, running: false, t: 0, landed: -1, fin: {}, alt: false, plates: [], plateMap: new Map(), plan: [], steps: [], parts: [], partI: 0, dims: { w: 1, h: 1 }, squash: 0 };
  let floAlpha = 0, parAmt = 0;

  function init(cv, h) {
    canvas = cv; hooks = h;
    try { if (window.THREE) { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); GL = true; } } catch (e) { GL = false; }
    if (GL) { try { build(); } catch (e) { GL = false; console.warn(e); } }
    let last = performance.now();
    const frame = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
      hooks.tick && hooks.tick(time);
      stepTweens(dt);
      if (GL) {
        if (boot.running) updateBoot(dt);
        updateParts(dt);
        if (SCREENS.includes(hooks.screen())) updateAnchors();
        updateMenuCube(dt); updateDisc(dt); updateFloaters(dt); updateCamera(dt);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return GL;
  }

  function build() {
    V3 = THREE.Vector3; ZERO = new V3(); MENU_CAM = new V3(0, 0, 10);
    DIRV = { up: new V3(0, 1, 0), down: new V3(0, -1, 0), left: new V3(-1, 0, 0), right: new V3(1, 0, 0) };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0726, 14, 36);
    camera = new THREE.PerspectiveCamera(40, 1, .1, 400);
    refCam = new THREE.PerspectiveCamera(40, 1, .1, 400); refCam.position.copy(MENU_CAM); refCam.lookAt(0, 0, 0);
    cam.pos = new V3(0, 8, 10); cam.look = new V3();
    scene.add(new THREE.HemisphereLight(0xc6bdff, 0x0a0726, .75));
    const key = new THREE.DirectionalLight(0xffffff, .85); key.position.set(4, 8, 7); scene.add(key);
    const fill = new THREE.PointLight(0x7b6ff0, 1.1, 60); fill.position.set(-5, 3, 6); scene.add(fill);
    dummy = new THREE.Object3D();
    buildMenuCube(); buildFloaters();
    disc.group = new THREE.Group(); disc.anchor = new V3(); scene.add(disc.group);
  }

  /* ---------- menu cube ---------- */
  function buildMenuCube() {
    menu.outer = new THREE.Group(); menu.inner = new THREE.Group(); menu.outer.add(menu.inner); scene.add(menu.outer);
    const geo = new THREE.BoxGeometry(.86, .86, .86), eg = new THREE.EdgesGeometry(geo);
    const mat = new THREE.MeshStandardMaterial({ color: 0x5d51e6, emissive: 0x2b1f9a, emissiveIntensity: .5, roughness: .28, metalness: .2, transparent: true, opacity: .84 });
    const core = new THREE.MeshStandardMaterial({ color: 0xffc46b, emissive: 0xff9d2e, emissiveIntensity: 1.5, roughness: .4 });
    const em = new THREE.LineBasicMaterial({ color: 0xd4ccff, transparent: true, opacity: .55 });
    const R = rng(42); let i = 0;
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const isCore = !x && !y && !z;
      const m = new THREE.Mesh(isCore ? new THREE.BoxGeometry(.6, .6, .6) : geo, isCore ? core : mat);
      if (!isCore) m.add(new THREE.LineSegments(eg, em));
      const base = new V3(x, y, z).multiplyScalar(CUBE_STEP);
      const scatter = new V3(R() - .5, R() - .5, R() - .5).normalize().multiplyScalar(7 + R() * 6); scatter.z -= 4;
      m.userData = { base, scatter, delay: R() * .35, rx: (R() - .5) * 8, ry: (R() - .5) * 8, pop: 0, k: i++ };
      m.scale.setScalar(.001); menu.inner.add(m); menu.cubes.push(m);
    }
    menu.light = new THREE.PointLight(0xffa640, 0, 5); menu.inner.add(menu.light);
    menu.miniPos = new V3(); menu.tmp = new V3();
  }
  function updateMenuCube(dt) {
    const m = menu;
    if (m.a <= .001) { m.outer.visible = false; return; }
    m.outer.visible = true;
    const k = 1 - Math.exp(-dt * 7), mini = m.mode === 'mini';
    m.outer.position.lerp(mini ? m.miniPos : ZERO, k); m.curScale = lerp(m.curScale, mini ? m.miniScale : m.baseScale, k);
    m.outer.scale.setScalar(Math.max(.001, m.curScale));
    const center = m.mode === 'center' && hooks.screen() === 'menu', dv0 = DIRV[m.sel], kt = 1 - Math.exp(-dt * 6);
    m.tiltX = lerp(m.tiltX, center ? -dv0.y * .4 : 0, kt); m.tiltY = lerp(m.tiltY, center ? dv0.x * .5 : 0, kt);
    m.outer.rotation.set(m.tiltX + Math.sin(time * .6) * .05, m.tiltY, 0);
    m.spin += dt * (mini ? .9 : .3);
    m.inner.rotation.set(.42 + Math.sin(time * .4) * .08, m.spin + m.burst, 0);
    const dv = dv0.clone().applyQuaternion(m.inner.quaternion.clone().invert()), kp = 1 - Math.exp(-dt * 10);
    m.light.intensity = 1.3 * m.a;
    for (const c of m.cubes) {
      const u = c.userData, p = clamp(m.a * 1.35 - u.delay, 0, 1), e = ease.outBack(p);
      u.pop = lerp(u.pop, center && u.base.dot(dv) / CUBE_STEP > .45 ? 1 : 0, kp);
      const br = 1 + (REDUCED ? 0 : .035 * Math.sin(time * 1.7 + u.k * .5));
      m.tmp.copy(u.base).multiplyScalar(br).addScaledVector(dv, u.pop * .22);
      c.position.lerpVectors(u.scatter, m.tmp, e);
      c.rotation.set(u.rx * (1 - p), u.ry * (1 - p), 0);
      c.scale.setScalar(Math.max(.001, ease.outCubic(p)));
    }
  }

  /* ---------- floating background cubes ---------- */
  function buildFloaters() {
    const n = 80; floMat = new THREE.MeshStandardMaterial({ color: 0x4b40c4, emissive: 0x221a6e, emissiveIntensity: .6, roughness: .4, transparent: true, opacity: 0, depthWrite: false });
    flo = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), floMat, n); flo.frustumCulled = false;
    const R = rng(9);
    for (let i = 0; i < n; i++) floData.push({ x: (R() - .5) * 32, y: (R() - .5) * 18, z: -3 - R() * 20, s: .1 + R() * .32, rx: R() * 6, ry: R() * 6, vr: (R() - .5) * .6, vy: .08 + R() * .22 });
    scene.add(flo);
  }
  function updateFloaters(dt) {
    if (floAlpha <= .001) { flo.visible = false; return; }
    flo.visible = true; floMat.opacity = .45 * floAlpha;
    const mv = REDUCED ? .1 : 1;
    floData.forEach((f, i) => {
      f.y += f.vy * dt * mv; if (f.y > 9.5) f.y = -9.5; f.rx += f.vr * dt * mv; f.ry += f.vr * .7 * dt * mv;
      dummy.position.set(f.x + Math.sin(time * .2 + i) * .3, f.y, f.z); dummy.rotation.set(f.rx, f.ry, 0); dummy.scale.setScalar(f.s); dummy.updateMatrix();
      flo.setMatrixAt(i, dummy.matrix);
    });
    flo.instanceMatrix.needsUpdate = true;
  }

  /* ---------- intro: a heavy cube paints the monogram, then it stands up ---------- */
  function monogramCells(text) {
    text = (text || '').trim().toUpperCase().slice(0, 3) || 'X';
    const c = document.createElement('canvas'), x = c.getContext('2d'), fs = 104, gap = 18;
    const font = `900 ${fs}px "M PLUS Rounded 1c", "Arial Black", Arial, sans-serif`;
    x.font = font; const widths = [...text].map(ch => x.measureText(ch).width);
    const w = Math.ceil(widths.reduce((s, v) => s + v, 0) + gap * (text.length - 1) + 8), h = fs + 12;
    c.width = w; c.height = h; x.font = font; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    let px = 4; [...text].forEach((ch, i) => { x.fillText(ch, px, h / 2 + 3); px += widths[i] + gap; });
    const data = x.getImageData(0, 0, w, h).data, cs = 9, cells = [];
    for (let r = 0; r < Math.floor(h / cs); r++) for (let q = 0; q < Math.floor(w / cs); q++) {
      let sum = 0, n = 0;
      for (let yy = 1; yy < cs; yy += 2) for (let xx = 1; xx < cs; xx += 2) { sum += data[((r * cs + yy) * w + (q * cs + xx)) * 4 + 3]; n++; }
      if (sum / n / 255 > .45) cells.push({ c: q, r });
    }
    if (cells.length < 4) for (let q = 0; q < 3; q++) for (let r = 0; r < 3; r++) cells.push({ c: q, r });
    return cells;
  }
  // The cube rolls along strokes; each landing also lifts the tiles beside it, like a paint roller.
  function planPath(cells) {
    const K = (c, r) => c + ',' + r, map = new Map(cells.map(x => [K(x.c, x.r), x])), raised = new Set(), plan = [];
    let cur = cells.slice().sort((a, b) => (a.c - b.c) || (b.r - a.r))[0], dir = null;
    const visit = (cell, d) => {
      raised.add(K(cell.c, cell.r)); const extra = [];
      if (d) for (const [pc, pr] of (d[0] !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]])) {
        const n = map.get(K(cell.c + pc, cell.r + pr)); if (n && !raised.has(K(n.c, n.r))) { raised.add(K(n.c, n.r)); extra.push(n); }
      }
      plan.push({ cell, extra });
    };
    visit(cur, null);
    while (raised.size < cells.length) {
      let best = null, bs = Infinity;
      for (const n of cells) {
        if (raised.has(K(n.c, n.r))) continue;
        const dc = n.c - cur.c, dr = n.r - cur.r, d = Math.abs(dc) + Math.abs(dr);
        let s = d === 1 ? 0 : 10 + Math.hypot(dc, dr);
        if (d === 1 && dir && dc === dir[0] && dr === dir[1]) s = -1;
        if (s < bs) { bs = s; best = n; }
      }
      const dc = best.c - cur.c, dr = best.r - cur.r;
      dir = Math.abs(dc) + Math.abs(dr) === 1 ? [dc, dr] : (Math.abs(dc) >= Math.abs(dr) ? [Math.sign(dc), 0] : [0, Math.sign(dr)]);
      visit(best, dir); cur = best;
    }
    return plan;
  }
  function buildBoot() {
    const initials = CONFIG.initials || CONFIG.name.split(/\s+/).map(s => s[0]).join('');
    const cells = monogramCells(initials);
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
    cells.forEach(c => { minC = Math.min(minC, c.c); maxC = Math.max(maxC, c.c); minR = Math.min(minR, c.r); maxR = Math.max(maxR, c.r); });
    const cx = (minC + maxC) / 2, cz = (minR + maxR) / 2;
    boot.dims = { w: maxC - minC + 1, h: maxR - minR + 1 };
    cells.forEach(c => { c.x = c.c - cx; c.z = c.r - cz; c.u = (c.c - minC) / Math.max(1, maxC - minC); c.rad = Math.hypot(c.x, c.z); });
    boot.plan = planPath(cells);

    boot.root = new THREE.Group(); scene.add(boot.root);
    boot.pivot = new THREE.Group(); boot.root.add(boot.pivot);
    boot.grid = new THREE.GridHelper(120, 120, 0x4a3fb0, 0x1f1866); boot.grid.material.transparent = true; boot.grid.position.y = -.145; boot.root.add(boot.grid);

    const pg = new THREE.BoxGeometry(.9, .14, .9), pe = new THREE.EdgesGeometry(pg);
    cells.forEach(c => {
      const m = new THREE.MeshStandardMaterial({ color: 0x4d42c9, emissive: 0x6a5cff, emissiveIntensity: 0, roughness: .35, metalness: .2 });
      const p = new THREE.Mesh(pg, m); p.add(new THREE.LineSegments(pe, new THREE.LineBasicMaterial({ color: 0xcfc6ff, transparent: true, opacity: .25 })));
      p.userData = { cell: c }; boot.pivot.add(p); boot.plates.push(p); boot.plateMap.set(c, p);
    });
    const cg = new THREE.BoxGeometry(1, 1, 1);
    boot.holder = new THREE.Group(); boot.pivot.add(boot.holder);
    boot.cube = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0x9a90ff, emissive: 0x3b2fc0, emissiveIntensity: .6, roughness: .22, metalness: .2 }));
    boot.cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(cg), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .65 })));
    boot.holder.add(boot.cube);
    boot.flash = new THREE.PointLight(0xb8aaff, 0, 30); boot.flash.position.set(0, 1.5, 0); boot.root.add(boot.flash);

    const partG = new THREE.BoxGeometry(.13, .13, .13);
    for (let i = 0; i < 70; i++) {
      const p = new THREE.Mesh(partG, new THREE.MeshBasicMaterial({ color: 0xd8d0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      p.visible = false; p.userData = { life: 0, max: 1, v: new V3() }; boot.root.add(p); boot.parts.push(p);
    }

    const S = [], plan = boot.plan; let t = .55;
    const q0 = new THREE.Quaternion().setFromAxisAngle(new V3(1, .4, .2).normalize(), Math.PI * 1.5);
    S.push({ type: 'drop', to: plan[0].cell, t0: t, dur: .8, qa: q0, qb: new THREE.Quaternion() }); t += .95;
    const sp = REDUCED ? .5 : 1, base = clamp(4.8 / Math.max(1, plan.length - 1), .07, .13) * sp;
    let q = new THREE.Quaternion();
    for (let i = 1; i < plan.length; i++) {
      const a = plan[i - 1].cell, b = plan[i].cell, dx = b.x - a.x, dz = b.z - a.z, d = Math.abs(dx) + Math.abs(dz);
      const type = d === 1 ? 'roll' : 'hop';
      const axis = type === 'roll' ? new V3(dz, 0, -dx) : (Math.abs(dx) >= Math.abs(dz) ? new V3(0, 0, -Math.sign(dx)) : new V3(Math.sign(dz), 0, 0));
      const ang = type === 'roll' ? Math.PI / 2 : Math.PI, len = Math.hypot(dx, dz);
      const dur = type === 'roll' ? base : (.22 + len * .03) * sp;
      const qEnd = new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(q);
      S.push({ type, from: a, to: b, dx, dz, axis, ang, len, t0: t, dur, qa: q.clone(), qb: qEnd });
      q = qEnd; t += dur + (type === 'hop' ? .05 * sp : 0);
    }
    boot.steps = S; boot.tEnd = t; boot.built = true;
  }
  function bootCams() {
    const w = boot.dims.w, h = boot.dims.h, asp = W / H;
    const d = Math.max(w * 1.3 / (2 * TAN * asp), h * 1.9 / (2 * TAN), 9), el = 56 * Math.PI / 180;
    boot.camOver = new V3(0, d * Math.sin(el), d * Math.cos(el)); boot.lookOver = new V3(0, 0, .4);
    const df = Math.max(w * 1.18 / (2 * TAN * asp), h * 2.2 / (2 * TAN), 9), yl = -h * .26;
    boot.camFront = new V3(-df * .16, yl + df * .1, df); boot.camFront2 = new V3(df * .16, yl + df * .1, df); boot.lookFront = new V3(0, yl, 0);
    boot.fogNear = d * .7; boot.fogFar = d * 2.4;
  }
  function followCam(pr, out, look) {
    const c = boot.holder.position, a = lerp(-.6, .45, pr);
    const k = ease.smooth(clamp((pr - .04) / .86, 0, 1));
    out.set(c.x + Math.sin(a) * 6.8, 4.4, c.z + Math.cos(a) * 6.8).lerp(boot.camOver, k);
    look.set(c.x, .5, c.z).lerp(boot.lookOver, k);
  }
  function resetBoot() {
    boot.t = 0; boot.landed = -1; boot.fin = {}; boot.squash = 0; boot.root.visible = true;
    boot.pivot.rotation.set(0, 0, 0); boot.grid.material.opacity = .32; boot.flash.intensity = 0;
    boot.plates.forEach(p => { const c = p.userData.cell; p.scale.set(.001, 1, .001); p.position.set(c.x, -.07, c.z); p.material.emissiveIntensity = 0; });
    boot.holder.visible = false; boot.holder.scale.set(1, 1, 1); boot.cube.scale.setScalar(1);
    boot.parts.forEach(p => { p.visible = false; p.userData.life = 0; });
    bootCams(); scene.fog.near = boot.fogNear; scene.fog.far = boot.fogFar;
    const f = boot.plan[0].cell; boot.holder.position.set(f.x, 9, f.z);
    cam.pos.set(f.x + Math.sin(-.6) * 6.8, 4.4, f.z + Math.cos(-.6) * 6.8); cam.look.set(f.x, .5, f.z); cam.mode = 'follow';
  }
  const _q = [], _v = [];
  function poseCube(s, p) {
    const hd = boot.holder, c = boot.cube, q = _q[0] || (_q[0] = new THREE.Quaternion()), v = _v[0] || (_v[0] = new V3());
    if (s.type === 'drop') {
      hd.position.set(s.to.x, .5 + 9 * (1 - ease.outBounce(p)), s.to.z);
      c.quaternion.copy(s.qa).slerp(s.qb, ease.outCubic(Math.min(1, p * 1.3)));
    } else if (s.type === 'roll') {
      q.setFromAxisAngle(s.axis, s.ang * ease.smooth(p));
      v.set(-s.dx * .5, .5, -s.dz * .5).applyQuaternion(q);
      hd.position.set(s.from.x + s.dx * .5 + v.x, v.y, s.from.z + s.dz * .5 + v.z);
      c.quaternion.copy(q).multiply(s.qa);
    } else {
      hd.position.set(lerp(s.from.x, s.to.x, p), .5 + (1 + s.len * .22) * 4 * p * (1 - p), lerp(s.from.z, s.to.z, p));
      q.setFromAxisAngle(s.axis, s.ang * ease.smooth(p)); c.quaternion.copy(q).multiply(s.qa);
    }
    const sq = boot.squash;
    if (sq > .002) { const sy = 1 - .3 * sq, sx = 1 + .2 * sq; hd.scale.set(sx, sy, sx); hd.position.y -= .5 * (1 - sy); } else hd.scale.set(1, 1, 1);
  }
  function popPlate(cell, delay, flash) {
    const p = boot.plateMap.get(cell); if (!p) return;
    if (boot.alt) { p.material.color.setHex(0xe08a2a); p.material.emissive.setHex(0xff9d2e); } else { p.material.color.setHex(0x4d42c9); p.material.emissive.setHex(0x6a5cff); }
    tween(.32, e => p.scale.set(Math.max(.001, e), 1, Math.max(.001, e)), { ease: ease.outBack, delay });
    tween(.6, e => { p.material.emissiveIntensity = lerp(flash, .35, e); }, { delay });
  }
  function puff(x, z, n, power) {
    const R = Math.random;
    for (let i = 0; i < n; i++) {
      const p = boot.parts[boot.partI++ % boot.parts.length], a = R() * Math.PI * 2, sp = (1.4 + R() * 1.6) * power;
      p.position.set(x + Math.cos(a) * .4, .08, z + Math.sin(a) * .4); p.userData.v.set(Math.cos(a) * sp, (1.2 + R() * 2) * power, Math.sin(a) * sp);
      p.userData.life = p.userData.max = .45 + R() * .3; p.visible = true; p.material.color.setHex(boot.alt ? 0xffc27a : 0xd8d0ff);
    }
  }
  function updateParts(dt) {
    if (!boot.built) return;
    for (const p of boot.parts) {
      const u = p.userData; if (u.life <= 0) continue;
      u.life -= dt; if (u.life <= 0) { p.visible = false; continue; }
      p.position.addScaledVector(u.v, dt); u.v.y -= 7 * dt; if (p.position.y < .06) { p.position.y = .06; u.v.y *= -.3; }
      const k = u.life / u.max; p.material.opacity = k * .9; p.scale.setScalar(.4 + k * .8);
    }
  }
  function onLand(i) {
    const pl = boot.plan[i], s = boot.steps[i], pan = clamp(s.to.x / (boot.dims.w / 2), -1, 1) * .8, heavy = s.type !== 'roll';
    popPlate(pl.cell, 0, 1.8); pl.extra.forEach((c, k) => popPlate(c, .04 + k * .03, 1.2));
    boot.squash = heavy ? 1 : .35;
    if (heavy) { Audio.thud(pan, s.type === 'drop'); puff(s.to.x, s.to.z, s.type === 'drop' ? 16 : 9, s.type === 'drop' ? 1.2 : .9); cam.shake = s.type === 'drop' ? .22 : .1; }
    else if (i % 3 === 0) puff(s.to.x, s.to.z, 2, .4);
    Audio.tick(i, pan, boot.alt);
  }
  const _t = [], _l = [];
  function updateBoot(dt) {
    boot.t += dt; const T = boot.t, S = boot.steps;
    boot.squash *= Math.exp(-dt * 12);
    while (boot.landed + 1 < S.length && T >= S[boot.landed + 1].t0 + S[boot.landed + 1].dur) { boot.landed++; onLand(boot.landed); }
    const nx = S[boot.landed + 1];
    if (nx) {
      if (T >= nx.t0) { boot.holder.visible = true; poseCube(nx, (T - nx.t0) / nx.dur); }
      else if (boot.landed >= 0) poseCube(S[boot.landed], 1);
      const tgt = _t[0] || (_t[0] = new V3()), lk = _l[0] || (_l[0] = new V3());
      followCam(clamp(boot.landed / (S.length - 1), 0, 1), tgt, lk);
      cam.pos.lerp(tgt, 1 - Math.exp(-dt * 3.2)); cam.look.lerp(lk, 1 - Math.exp(-dt * 4.5));
      return;
    }
    finale(T - boot.tEnd, dt);
  }
  function finale(ft, dt) {
    const f = boot.fin, hd = boot.holder;
    if (!f.leap && ft >= .1) {
      f.leap = true; cam.mode = 'tween'; Audio.leap();
      f.p0 = hd.position.clone(); hd.scale.set(1, 1, 1);
      const cp = cam.pos.clone(), cl = cam.look.clone();
      tween(1, e => { cam.pos.lerpVectors(cp, boot.camOver, e); cam.look.lerpVectors(cl, boot.lookOver, e); }, { ease: ease.inOutCubic });
    }
    if (f.leap && !f.impact) {
      if (ft < .62) { const p = clamp((ft - .1) / .52, 0, 1), e = ease.outCubic(p); hd.position.set(lerp(f.p0.x, 0, e), lerp(f.p0.y, 6, e) + Math.sin(p * Math.PI) * 1.2, lerp(f.p0.z, 0, e)); boot.cube.rotation.x += dt * 9; boot.cube.rotation.z += dt * 6; }
      else { const p = clamp((ft - .62) / .2, 0, 1); hd.position.set(0, lerp(6, .5, ease.inCubic(p)), 0); boot.cube.rotation.x += dt * 14; }
    }
    if (!f.impact && ft >= .82) {
      f.impact = true; hd.visible = false; Audio.impact(); cam.shake = .35; puff(0, 0, 26, 1.5);
      tween(.9, e => { boot.flash.intensity = lerp(6, 0, e); });
      boot.plates.forEach(p => { const d = p.userData.cell.rad * .028; tween(.7, e => { p.material.emissiveIntensity = lerp(2.2, .45, e); }, { delay: d }); tween(.45, (e, pp) => { p.position.y = -.07 + Math.sin(pp * Math.PI) * .35; }, { delay: d, ease: ease.lin }); });
    }
    if (!f.tilt && ft >= 1.35) {
      f.tilt = true; Audio.whoom();
      tween(1.25, e => { boot.pivot.rotation.x = e * Math.PI / 2; boot.grid.material.opacity = .32 * (1 - e); }, { ease: ease.inOutCubic });
      boot.plates.forEach(p => { const d = .3 + p.userData.cell.u * .35; tween(.9, e => { const h = lerp(1, 5, e); p.scale.y = h; p.position.y = -.14 + .07 * h; }, { ease: ease.outBack, delay: d }); });
      const cp = cam.pos.clone(), cl = cam.look.clone();
      tween(1.45, e => { cam.pos.lerpVectors(cp, boot.camFront, e); cam.look.lerpVectors(cl, boot.lookFront, e); }, { ease: ease.inOutCubic });
    }
    if (!f.reveal && ft >= 2.45) {
      f.reveal = true; Audio.chord(boot.alt); hooks.bootName && hooks.bootName();
      tween(3.4, e => { cam.pos.lerpVectors(boot.camFront, boot.camFront2, e); }, { ease: ease.inOutCubic });
      boot.plates.forEach(p => { tween(1.1, e => { p.material.emissiveIntensity = lerp(2.8, .55, e); }, { delay: p.userData.cell.u * .55 }); });
      tween(1.4, e => { boot.flash.intensity = lerp(3, 0, e); });
    }
    if (!f.go && ft >= 5.6) { f.go = true; hooks.bootDone && hooks.bootDone(); }
  }

  /* ---------- discs ---------- */
  function discLabel(p) {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), m = S / 2;
    x.save(); x.beginPath(); x.arc(m, m, m - 2, 0, Math.PI * 2); x.clip();
    const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, p.colors[0]); g.addColorStop(1, p.colors[1]); x.fillStyle = g; x.fillRect(0, 0, S, S);
    const R = rng(hash(p.title));
    for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(R() * S, R() * S, 20 + R() * 140, 0, Math.PI * 2); x.fillStyle = `rgba(255,255,255,${.03 + R() * .06})`; x.fill(); }
    for (let r = 120; r < m; r += 18) { x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 1; x.stroke(); }
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 12;
    let fs = 58; const ff = '"M PLUS Rounded 1c","Arial Rounded MT Bold",Arial,sans-serif';
    do { x.font = `900 ${fs}px ${ff}`; fs -= 2; } while (x.measureText(p.title.toUpperCase()).width > 360 && fs > 20);
    x.fillText(p.title.toUpperCase(), m, 150);
    x.shadowBlur = 0; x.font = `700 22px ${ff}`; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText(p.kind || '', m, 190);
    x.font = `700 20px ${ff}`; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText([p.stack, p.year].filter(Boolean).join('  '), m, 410);
    x.beginPath(); x.arc(m, m, S * .2, 0, Math.PI * 2); x.fillStyle = 'rgba(225,228,255,.55)'; x.fill();
    x.beginPath(); x.arc(m, m, S * .16, 0, Math.PI * 2); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 2; x.stroke();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(m, m, S * .105, 0, Math.PI * 2); x.fill();
    x.restore();
    const t = new THREE.CanvasTexture(c); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  function discUnder() {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), m = S / 2;
    x.beginPath(); x.arc(m, m, m - 2, 0, Math.PI * 2); x.clip();
    if (x.createConicGradient) { const g = x.createConicGradient(0, m, m); ['#dfe3ff', '#ffc9f1', '#c8fff4', '#fff3c4', '#d7c9ff', '#c9e6ff', '#dfe3ff'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col)); x.fillStyle = g; } else x.fillStyle = '#d8dcf5';
    x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(m, m, S * .105, 0, Math.PI * 2); x.fill();
    return new THREE.CanvasTexture(c);
  }
  function buildDiscs() {
    const under = discUnder(), rimMat = new THREE.MeshStandardMaterial({ color: 0xdcdcf0, roughness: .3, metalness: .4, side: THREE.DoubleSide });
    const circ = new THREE.CircleGeometry(1, 96), rimG = new THREE.CylinderGeometry(1, 1, .036, 96, 1, true);
    CONFIG.projects.forEach(p => {
      const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
      const lab = discLabel(p);
      const top = new THREE.Mesh(circ, new THREE.MeshStandardMaterial({ map: lab, emissiveMap: lab, emissive: 0xffffff, emissiveIntensity: .55, color: 0x707070, transparent: true, alphaTest: .02, roughness: .55, metalness: .05 })); top.position.z = .018;
      const bot = new THREE.Mesh(circ, new THREE.MeshStandardMaterial({ map: under, transparent: true, alphaTest: .02, roughness: .25, metalness: .3 })); bot.rotation.y = Math.PI; bot.position.z = -.018;
      const rim = new THREE.Mesh(rimG, rimMat); rim.rotation.x = Math.PI / 2;
      spin.add(top, bot, rim); g.userData = { spin, off: 0, s: 0 }; g.visible = false;
      disc.group.add(g); disc.items.push(g);
    });
    disc.built = true;
  }
  function updateDisc(dt) {
    const d = disc; if (!d.built) return;
    d.show = lerp(d.show, hooks.screen() === 'disc' ? 1 : 0, 1 - Math.exp(-dt * 8));
    d.group.visible = d.show > .01; if (!d.group.visible) return;
    d.speed = lerp(d.speed, d.tSpeed, 1 - Math.exp(-dt * 2.5));
    d.group.position.copy(d.anchor);
    d.group.rotation.set(-.45 + par.y * .12, .35 + par.x * .18, 0);
    const k = 1 - Math.exp(-dt * 9);
    d.items.forEach((it, i) => {
      const u = it.userData, on = i === d.idx;
      u.off = lerp(u.off, on ? 0 : -d.dir * 2.6, k); u.s = lerp(u.s, on ? 1 : 0, k);
      it.visible = u.s > .01; it.position.set(u.off * d.scale, 0, 0); it.scale.setScalar(Math.max(.001, u.s * d.scale * d.show));
      u.spin.rotation.z -= dt * d.speed;
    });
  }

  /* ---------- camera + layout ---------- */
  function screenToWorld(px, py) {
    const v = new V3(px / W * 2 - 1, -(py / H) * 2 + 1, .5).unproject(refCam);
    const dir = v.sub(refCam.position).normalize(), dist = -refCam.position.z / dir.z;
    return refCam.position.clone().add(dir.multiplyScalar(dist));
  }
  function updateAnchors() {
    const cr = canvas.getBoundingClientRect(), back = document.getElementById('backBtn');
    if (back) { const bb = back.getBoundingClientRect(); if (bb.width) { menu.miniPos.copy(screenToWorld(bb.left + bb.width / 2 - cr.left, bb.top + bb.height / 2 - cr.top)); menu.miniScale = (bb.width * .95) / (ppu * CUBE_SPAN * 1.35); } }
    if (hooks.screen() === 'disc') {
      const st = document.getElementById('discStage'); if (!st) return; const r = st.getBoundingClientRect(); if (!r.width) return;
      const usable = r.height - 60;
      disc.anchor.copy(screenToWorld(r.left + r.width / 2 - cr.left, r.top + usable / 2 + 8 - cr.top));
      disc.scale = Math.max(.3, Math.min(r.width, usable) * .42 / ppu);
    }
  }
  function resize(rx, ry) {
    RX = rx; RY = ry;
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    if (!GL) return;
    renderer.setSize(W, H, false);
    camera.aspect = refCam.aspect = W / H; camera.updateProjectionMatrix(); refCam.updateProjectionMatrix(); refCam.updateMatrixWorld(true);
    ppu = H / (2 * 10 * TAN);
    menu.baseScale = (.95 * Math.min(RX, RY)) / (ppu * CUBE_SPAN * 1.35);
    if (boot.built) { bootCams(); if (boot.running) { scene.fog.near = boot.fogNear; scene.fog.far = boot.fogFar; } }
  }
  function updateCamera(dt) {
    const k = 1 - Math.exp(-dt * 3); par.x = lerp(par.x, par.tx, k); par.y = lerp(par.y, par.ty, k);
    cam.shake *= Math.exp(-dt * 7);
    const s = cam.shake, R = Math.random;
    camera.position.set(cam.pos.x + par.x * .45 * parAmt + (R() - .5) * s, cam.pos.y + par.y * .3 * parAmt + (R() - .5) * s, cam.pos.z);
    camera.lookAt(cam.look);
  }

  /* ---------- public API ---------- */
  return {
    init, resize,
    get GL() { return GL; },
    bootTime() { return boot.t; },
    pointer(e) { par.tx = (e.clientX / innerWidth - .5) * 2; par.ty = -(e.clientY / innerHeight - .5) * 2; },
    startBoot(alt) {
      if (!GL) return;
      if (!boot.built) buildBoot();
      boot.alt = alt; resetBoot(); boot.running = true; parAmt = 0;
    },
    toMenu(fast) {
      boot.running = false; if (!GL) return; cam.mode = 'free';
      if (boot.built) {
        boot.plates.forEach(p => { const d = fast ? 0 : p.userData.cell.u * .25, sx = p.scale.x, sy = p.scale.y; tween(.5, e => p.scale.set(Math.max(.001, sx * (1 - e)), Math.max(.001, sy * (1 - e)), Math.max(.001, sx * (1 - e))), { delay: d, ease: ease.inCubic }); });
        boot.holder.visible = false; boot.parts.forEach(p => { p.visible = false; p.userData.life = 0; });
      }
      const fp = cam.pos.clone(), fl = cam.look.clone(), n0 = scene.fog.near, f0 = scene.fog.far;
      tween(fast ? .9 : 1.5, e => { cam.pos.lerpVectors(fp, MENU_CAM, e); cam.look.lerpVectors(fl, ZERO, e); scene.fog.near = lerp(n0, 14, e); scene.fog.far = lerp(f0, 36, e); },
        { ease: ease.inOutCubic, done: () => { if (boot.root) boot.root.visible = false; } });
      menu.mode = 'center';
      tween(1.6, e => { menu.a = e; }, { ease: ease.lin, delay: fast ? .1 : .35 });
      tween(1.5, e => { floAlpha = e; parAmt = e; }, { delay: .2 });
    },
    powerOff() {
      if (!GL) return; menu.mode = 'hidden'; const a0 = menu.a;
      tween(.8, e => { menu.a = a0 * (1 - e); floAlpha = 1 - e; parAmt = 1 - e; }, { ease: ease.inCubic });
    },
    menuSelect(dir) { menu.sel = dir; },
    setMode(m) { menu.mode = m; },
    burst() { if (!GL) return; const b0 = menu.burst; tween(.8, e => { menu.burst = b0 + e * Math.PI * 2; }, { ease: ease.inOutCubic }); },
    discEnter(idx) { if (!GL) return; if (!disc.built) buildDiscs(); disc.idx = idx; disc.dir = 1; const u = disc.items[idx].userData; u.s = 0; u.off = 0; disc.speed = 14; },
    discGo(idx, d) { if (!GL || !disc.built) return; disc.dir = d; const u = disc.items[idx].userData; u.off = d * 2.6; u.s = 0; disc.idx = idx; },
    discRead(on) { disc.tSpeed = on ? 24 : .6; }
  };
})();
