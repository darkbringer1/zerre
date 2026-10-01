// The homepage's live scenes, drawn from Zerre's own sprites (assets/sprites/art, copied from the
// app by `make site-art`) on whole pixels, the way the app draws them: the page's notch and the hop
// into it, one focus block told in six scenes, the first-time celebrations, the vine in the margin.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = (name) => window.zerreCount?.(name);
  const imgs = {};

  // ---------- Drawing ----------
  function load(names) {
    return Promise.all(names.map((name) => imgs[name] ? null : new Promise((resolve) => {
      const image = new Image();
      image.onload = () => { imgs[name] = image; resolve(); };
      image.onerror = resolve;
      image.src = name.startsWith('site:') ? `/assets/sprites/${name.slice(5)}.png` : `/assets/sprites/art/${name}.png`;
    })));
  }

  // A canvas w×h art px at `scale` CSS px each, sharp on any display.
  function stage(canvas, w, h, scale) {
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    if (canvas.width !== w * scale * dpr || canvas.height !== h * scale * dpr) {
      canvas.width = w * scale * dpr; canvas.height = h * scale * dpr;
      canvas.style.width = `${w * scale}px`; canvas.style.height = `${h * scale}px`;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  // Anchor (default bottom centre) at (x, y), y down, on whole pixels.
  function draw(ctx, name, x, y, o = {}) {
    const image = typeof name === 'string' ? imgs[name] : name;
    if (!image) return;
    const [ax, ay] = o.anchor ?? [0.5, 1];
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (o.flip) ctx.scale(-1, 1);
    ctx.drawImage(image, Math.round(-image.width * ax), Math.round(-image.height * ay));
    ctx.restore();
  }

  // A pixel-honest squash: resampled to whole art pixels, nearest neighbour.
  const squashCache = {};
  function squashed(name, sx, sy) {
    const key = `${name}@${sx}x${sy}`;
    if (squashCache[key]) return squashCache[key];
    const image = imgs[name]; if (!image) return null;
    const c = document.createElement('canvas');
    c.width = Math.round(image.width * sx); c.height = Math.round(image.height * sy);
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(image, 0, 0, c.width, c.height);
    return squashCache[key] = c;
  }

  // Runs while the element is on screen, and draws a still first frame right away.
  function loop(el, fn) {
    let visible = true;
    const start = performance.now();
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(el);
    fn(reduce ? 4 : 0);
    if (reduce) return;
    const tick = (now) => { if (visible) fn((now - start) / 1000); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // ---------- The app's pieces ----------
  // The mini at its desk: one paw tapping at a time in bursts, a glance up, a blink.
  function deskPose(t) {
    const cycle = t % 4.2;
    if (cycle > 3.0 && cycle < 3.7) return { frame: cycle > 3.5 && cycle < 3.62 ? 'mini.blink' : 'mini.idle', paws: [0, 0] };
    const step = Math.floor(t * 12);
    return { frame: t % 5.3 > 5.15 ? 'mini.blink' : 'mini.focus', paws: cycle < 2.6 ? (Math.floor(step / 2) % 2 ? [0, 1] : [1, 0]) : [0, 0] };
  }

  const vineCache = {};
  function vine(ripe = 0, green = 0, flower = false) {
    const key = `${ripe}.${green}.${flower}`;
    if (vineCache[key]) return vineCache[key];
    const base = imgs['prop.vine']; if (!base) return null;
    const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
    const x = c.getContext('2d'); x.drawImage(base, 0, 0);
    const slots = [[1, 14], [11, 10], [1, 6], [11, 2]];
    const fruit = [...Array(ripe).fill('prop.tomato'), ...Array(green).fill('prop.tomato.green'), ...(flower ? ['prop.tomato.flower'] : [])];
    fruit.slice(0, 4).forEach((f, i) => imgs[f] && x.drawImage(imgs[f], ...slots[i]));
    return vineCache[key] = c;
  }

  // A day's jar, as the app composes it: fruit, glass over it, the lid once the day is over.
  function jar(ripe, green = 0, { open = false, gold = false } = {}) {
    const c = document.createElement('canvas'); c.width = 11; c.height = 13;
    const x = c.getContext('2d');
    const slots = [[2, 10], [6, 10], [4, 8], [2, 6], [6, 6], [4, 4]];
    [...Array(ripe).fill('shelf.tomato'), ...Array(green).fill('shelf.tomato.green')].slice(0, 6)
      .forEach((f, i) => imgs[f] && x.drawImage(imgs[f], ...slots[i]));
    if (imgs['shelf.jar']) x.drawImage(imgs['shelf.jar'], 0, 3);
    if (!open) { const lid = imgs[gold ? 'shelf.lid.gold' : 'shelf.lid']; if (lid) x.drawImage(lid, 2, 0); }
    return c;
  }

  // The notch room, 200 art px wide, floor 24 px above its bottom. `mini`: null for an empty chair,
  // or { frame, y } to place the mini yourself (dropping in), or true to work at the desk.
  function room(ctx, ox, oy, w, h, t, o = {}) {
    const floor = oy + h - 24, desk = ox + 30;
    draw(ctx, 'home.chair.back', desk, floor - 6);
    const pose = deskPose(t);
    if (o.mini === true) draw(ctx, pose.frame, desk, floor - 6);
    else if (o.mini) draw(ctx, o.mini.frame, desk, o.mini.y);
    draw(ctx, 'home.chair.seat', desk, floor);
    draw(ctx, 'home.table', desk + 9, floor);
    draw(ctx, 'prop.laptop', desk + 19, floor - 11);
    if (o.mini === true) {
      draw(ctx, 'mini.paw', desk + 7, floor - 11 - pose.paws[0]);
      draw(ctx, 'mini.paw', desk + 12, floor - 11 - pose.paws[1]);
    }
    const v = vine(o.ripe ?? 1, 0, o.flower ?? true);
    if (v) draw(ctx, v, ox + w / 2, floor);
    draw(ctx, 'board', ox + w - 35, floor);
    [[3, 3, 'board.note.pick'], [12, 4, 'board.note'], [22, 3, 'board.note']]
      .forEach(([dx, dy, n]) => draw(ctx, n, ox + w - 51 + dx, floor - 30 + dy, { anchor: [0, 0] }));
  }

  // The composed poses (assets/sprites/zerre-*.png) leave room for a held card on one side: the
  // body's centre is 28 px from their left edge, not in the middle.
  const POSE = { anchor: [28 / 68, 1] };

  function roundedBottom(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.closePath(); ctx.fill();
  }

  const SPRITES = [
    'home.chair.back', 'home.chair.seat', 'home.table', 'prop.laptop', 'mini.paw', 'mini.focus', 'mini.idle', 'mini.blink', 'mini.air', 'mini.happy', 'mini.crouch',
    'prop.vine', 'prop.tomato', 'prop.tomato.green', 'prop.tomato.flower', 'prop.basket', 'board', 'board.note', 'board.note.pick',
    'shelf.jar', 'shelf.lid', 'shelf.lid.gold', 'shelf.tomato', 'shelf.tomato.green', 'shelf.plank', 'shelf.bracket', 'shelf.bottle',
    'body', 'shadow', 'sprout.2', 'arm.up', 'backpack', 'backpack.paper', 'card.agent_done', 'card.command_done',
    'face.neutral', 'face.blink', 'face.happy', 'face.focused', 'face.curious', 'face.surprised', 'face.grin', 'face.yawn', 'face.sleep',
    'site:zerre-idle', 'site:zerre-idle-blink', 'site:zerre-focus', 'site:zerre-focus-blink',
    'particle.sparkle', 'particle.star', 'particle.dust', 'particle.zzz', 'particle.steam', 'particle.confetti', 'particle.note',
    'trait.badge', 'trait.nightcap', 'trait.headphones', 'trait.bottle', 'trait.mug.0', 'trait.mug.1', 'trait.mug.2',
    'trait.robot.0', 'trait.robot.1', 'trait.robot.2', 'trait.robot.3',
    'fx.parcel', 'fx.flame.0', 'fx.flame.1', 'fx.parachute', 'fx.sun', 'fx.moon', 'fx.bird.sit', 'fx.bird.fly.0', 'fx.bird.fly.1', 'fx.bubble',
  ];

  let celebrations;
  load(SPRITES).then(() => {
    celebrations = makeCelebrations();
    setUpNotch();
    setUpPageZerre();
    setUpMoments();
    setUpStory();
    setUpFirsts();
  });

  // ---------- The page's notch ----------
  const notch = document.getElementById('notch');
  const state = { resident: false, landedAt: -10, open: false, hovering: false, autoCloseAt: 0, storyProgress: 0, storyReached: false };

  function remaining() { return Math.round(25 * 60 * (1 - state.storyProgress)); }

  function setUpNotch() {
    const toggle = document.getElementById('notch-toggle');
    const panel = document.getElementById('notch-room');
    const compact = document.getElementById('notch-compact');
    const canvas = document.getElementById('notch-canvas');
    const status = document.getElementById('notch-status');
    const title = document.getElementById('notch-title');
    const detail = document.getElementById('notch-detail');
    const hover = matchMedia('(hover: hover)').matches;

    const setOpen = (open) => {
      state.open = open;
      notch.style.setProperty('--open-height', `${36 + panel.scrollHeight}px`);
      notch.classList.toggle('is-open', open);
      panel.inert = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? "Close Zerre's home in the notch." : "Zerre's home in the notch. Open it.");
    };
    state.setOpen = setOpen;
    if (hover) {
      notch.addEventListener('mouseenter', () => { state.hovering = true; setOpen(true); });
      notch.addEventListener('mouseleave', () => { state.hovering = false; setOpen(false); });
    }
    toggle.addEventListener('click', () => { if (!hover || !state.open) count('click-notch'); setOpen(hover ? true : !state.open); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.open) setOpen(false); });

    const roomScale = () => (innerWidth < 460 ? 1.5 : 2);
    const frame = (now) => {
      const t = now / 1000;
      if (state.autoCloseAt && t > state.autoCloseAt && !state.hovering) { state.autoCloseAt = 0; setOpen(false); }
      // Compact: the head peeks over the lower edge; it pops a little as it lands.
      const ctx = stage(compact, 30, 16, 2);
      if (state.resident) {
        const since = t - state.landedAt;
        const frameName = since < 0.6 ? 'mini.happy' : (t % 4.4 > 4.28 ? 'mini.blink' : 'mini.idle');
        draw(ctx, frameName, 15, 16 + 8 + (since < 0.25 ? 4 : 0));
      }
      const left = remaining();
      const clock = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      const done = state.storyProgress >= 1;
      const text = !state.resident ? 'zerre' : done ? 'done ✓' : clock;
      if (status.textContent !== text) status.textContent = text;
      if (state.open || !canvas.width || canvas.width === 300) {
        const s = roomScale();
        const c = stage(canvas, 200, 80, s);
        let mini = null;
        if (state.resident) {
          const since = t - state.landedAt;
          if (since < 0.35 && !reduce) mini = { frame: 'mini.air', y: 80 - 24 - 6 - (1 - (since / 0.35) ** 2) * 60 };
          else if (since < 0.9 && !reduce) mini = { frame: since < 0.5 ? 'mini.crouch' : 'mini.happy', y: 80 - 24 - 6 };
          else mini = true;
        }
        room(c, 0, 0, 200, 80, t, { mini, ripe: done ? 2 : 1, flower: !done });
        title.textContent = state.resident ? (done ? 'Block done' : 'Block 2') : 'Zerre’s home';
        detail.textContent = state.resident ? (done ? 'A tomato ripened' : `${Math.max(1, Math.ceil(left / 60))} min left`) : 'Start a block to move in';
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    frame(performance.now()); // a still first frame right away
  }

  function moveIn({ show = true } = {}) {
    if (state.resident) return;
    state.resident = true;
    state.landedAt = performance.now() / 1000;
    notch.dataset.state = 'home';
    if (show && !reduce) { state.setOpen?.(true); state.autoCloseAt = state.landedAt + 2.8; }
  }

  function moveOut() {
    state.resident = false;
    notch.dataset.state = 'empty';
  }

  // ---------- The page's own Zerre: it lives on the bottom edge of the window ----------
  // The real creature, composed like the rig (body, face, sprout) at 2 px per art pixel: it
  // blinks, follows the cursor with its eyes, wanders a little, hops when clicked, and during a
  // focus block it leaves through the top of the window into the page's notch.
  function setUpPageZerre() {
    const canvas = document.createElement('canvas');
    canvas.className = 'page-zerre';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', 'Zerre. Click to say hi.');
    document.body.append(canvas);
    const SCALE = innerWidth < 560 ? 1.5 : 2;
    const W = 96, H = 76, GROUND = 72;
    const width = W * SCALE, height = H * SCALE;
    const now = () => performance.now() / 1000;
    let x = innerWidth * 0.84, target = null, nextWander = now() + 6, facing = 0;
    let mode = 'floor', flight = null, crouchUntil = 0, landedAt = -10, pokedAt = -10, nextBlink = now() + 3;
    let mouse = null;
    addEventListener('pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });

    const composites = {};
    function creature(face, look) {
      const key = `${face}.${look}`;
      if (composites[key]) return composites[key];
      const c = document.createElement('canvas'); c.width = 44; c.height = 54;
      const g = c.getContext('2d');
      g.drawImage(imgs.body, 0, 12);
      g.drawImage(imgs[`face.${face}`], 12 + look, 54 - 12 - 10);
      g.drawImage(imgs['sprout.2'], 14, 54 - 35 - 10);
      return composites[key] = c;
    }
    const squashes = {};
    function squash(src, key, sx, sy) {
      const k = `${key}@${sx}x${sy}`;
      if (squashes[k]) return squashes[k];
      const c = document.createElement('canvas'); c.width = Math.round(src.width * sx); c.height = Math.round(src.height * sy);
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
      return squashes[k] = c;
    }
    const snap = (v) => Math.round(v / SCALE) * SCALE;
    const floorTop = () => innerHeight - height;
    function place(left, top) {
      canvas.style.left = `${snap(left)}px`;
      canvas.style.top = `${snap(top)}px`;
    }

    function poke() {
      if (mode !== 'floor') return;
      pokedAt = now();
      count('click-zerre');
    }
    canvas.addEventListener('click', poke);
    canvas.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

    function notchSpot() {
      const rect = notch.getBoundingClientRect();
      return { left: rect.left + rect.width / 2 - width / 2, top: -height - 8 };
    }

    // Off to the notch: a crouch, then one hop up and across, behind the notch (it's drawn above).
    function leave(byHand) {
      if (mode !== 'floor') return;
      if (byHand) count('click-demo-block');
      setToggle(true);
      if (reduce) { mode = 'away'; canvas.hidden = true; moveIn({ show: byHand }); return; }
      mode = 'leaving';
      crouchUntil = now() + 0.22;
      setTimeout(() => {
        flight = { from: { left: x - width / 2, top: floorTop() }, to: notchSpot(), start: now(), duration: 0.62, rising: true,
          done: () => { mode = 'away'; canvas.hidden = true; moveIn(); } };
      }, 220);
    }
    // Back down: the mini hops out of the room, Zerre drops from behind the notch to the floor.
    function comeBack(byHand) {
      if (mode !== 'away') return;
      setToggle(false);
      moveOut();
      state.setOpen?.(false);
      canvas.hidden = false;
      if (reduce) { mode = 'floor'; return; }
      mode = 'returning';
      flight = { from: notchSpot(), to: { left: x - width / 2, top: floorTop() }, start: now(), duration: 0.55, rising: false,
        done: () => { mode = 'floor'; landedAt = now(); } };
    }
    state.leave = leave;
    state.comeBack = comeBack;
    state.isAway = () => mode === 'away' || mode === 'leaving';

    const toggle = document.getElementById('block-toggle');
    function setToggle(away) {
      toggle.innerHTML = away ? 'End the block <span aria-hidden="true">↓</span>' : 'Start a focus block <span aria-hidden="true">◷</span>';
      toggle.setAttribute('aria-pressed', String(away));
    }
    toggle.addEventListener('click', () => (mode === 'floor' ? leave(true) : comeBack(true)));

    let last = now();
    const frame = () => {
      const t = now(), dt = Math.min(0.1, t - last); last = t;
      if (mode === 'away') { requestAnimationFrame(frame); return; }
      const ctx = stage(canvas, W, H, SCALE);
      if (flight) {
        const u = Math.min(1, (t - flight.start) / flight.duration);
        const k = flight.rising ? u * (1.6 - 0.6 * u) : u * u; // still rising as it leaves; falling faster and faster
        place(flight.from.left + (flight.to.left - flight.from.left) * u, flight.from.top + (flight.to.top - flight.from.top) * k);
        draw(ctx, squash(creature(flight.rising ? 'happy' : 'surprised', 0), 'fly', 0.92, 1.1), W / 2, GROUND);
        if (u >= 1) { const done = flight.done; flight = null; done(); }
        requestAnimationFrame(frame);
        return;
      }
      // Wander a little along the bottom edge, never while you're pointing at it.
      const near = mouse && Math.hypot(mouse.x - x, mouse.y - (innerHeight - height / 2)) < 140;
      if (!reduce && mode === 'floor' && !target && t > nextWander && !near) {
        target = innerWidth * (0.6 + Math.random() * 0.32);
        nextWander = t + 8 + Math.random() * 10;
      }
      let walking = false;
      if (target !== null && !near) {
        const step = 34 * dt, d = target - x;
        if (Math.abs(d) <= step) { x = target; target = null; } else { x += Math.sign(d) * step; walking = true; facing = Math.sign(d); }
      }
      x = Math.min(innerWidth - width * 0.4, Math.max(width * 0.4, x));
      place(x - width / 2, floorTop());
      // Face: a poke wins, then a blink; eyes toward the cursor, or the way it walks.
      if (t > nextBlink + 0.14) nextBlink = t + 2.5 + Math.random() * 3.5;
      const poked = t - pokedAt < 0.9;
      const face = poked ? 'happy' : walking ? 'neutral' : (t > nextBlink ? 'blink' : near ? 'curious' : 'neutral');
      const look = walking ? facing * 2 : mouse ? Math.max(-2, Math.min(2, Math.round((mouse.x - x) / 160))) : 0;
      const hop = poked ? 4 * 14 * ((t - pokedAt) / 0.45) * (1 - (t - pokedAt) / 0.45) : 0;
      const lift = hop > 0 ? Math.round(hop) : walking && Math.floor(t * 6) % 2 ? 1 : 0;
      draw(ctx, 'shadow', W / 2, GROUND + 2, { alpha: lift > 6 ? 0.6 : 1 });
      let body = creature(face, look);
      if (t < crouchUntil) body = squash(body, `${face}.${look}`, 1.1, 0.86);
      else if (t - landedAt < 0.22) body = squash(body, `${face}.${look}`, 1.08, 0.9);
      draw(ctx, body, W / 2, GROUND - lift);
      if (t - landedAt < 0.4) [-1, 1].forEach((side) => draw(ctx, 'particle.dust', W / 2 + side * (14 + (t - landedAt) * 30), GROUND + 1));
      if (poked && t - pokedAt < 0.6) [-1, 1].forEach((side) => draw(ctx, 'particle.sparkle', W / 2 + side * 20, GROUND - 46 - (t - pokedAt) * 20, { anchor: [0.5, 0.5] }));
      requestAnimationFrame(frame);
    };
    frame();
  }

  // ---------- The hero card: the illustrated moments, drawn live ----------
  function setUpMoments() {
    const card = document.getElementById('moments-demo');
    const canvas = document.getElementById('moment-stage');
    const parts = ['command', 'output', 'message', 'detail'].map((id) => document.getElementById(`demo-${id}`));
    const buttons = [...card.querySelectorAll('[data-moment]')];
    const MOMENTS = {
      agent: ['codex finished a task', 'Done. Zerre noticed.', 'Your agent is done!', 'Ready when you are.'],
      commit: ['git commit completed', 'A little thing shipped.', 'You shipped it!', 'That deserves a tiny celebration.'],
      focus: ['focus block running', 'Others can wait.', 'Working with you.', 'It keeps you company.'],
      first: ['a first, just now', 'A new trait.', 'Look what grew!', 'Every trait gets a moment.'],
    };
    const firsts = Object.keys(celebrations.SCENES);
    let moment = 'agent', startedAt = performance.now() / 1000, firstIndex = 0;
    for (const button of buttons) {
      button.addEventListener('click', () => {
        moment = button.dataset.moment;
        if (moment === 'first') firstIndex = (firstIndex + 1) % firsts.length;
        startedAt = performance.now() / 1000;
        MOMENTS[moment].forEach((text, i) => { parts[i].textContent = text; });
        for (const b of buttons) { const on = b === button; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); }
        if (!reduce) { card.classList.remove('is-reacting'); void card.offsetWidth; card.classList.add('is-reacting'); }
      });
    }
    const { W, H, GY, S, put, zerre, burst } = celebrations;
    const CX = W / 2;
    celebrations.paint(canvas, card.clientWidth < 520 ? 1 : 1.5, (c) => {
      const t = reduce ? 4 : performance.now() / 1000 - startedAt; // Reduce Motion: straight to the resting pose
      if (moment === 'first') { celebrations.SCENES[firsts[firstIndex]](c, Math.floor(Math.min(t, celebrations.L) * 12) / 12, { CX: W / 2 }); return; }
      if (moment === 'agent') {
        // The card comes up out of the backpack and is held over its head.
        // As the rig does it: the card's bottom just over its head, both arms up in front gripping its corners.
        const k = Math.min(1, t / 0.35), hop = t < 0.4 ? Math.round(Math.sin(t / 0.4 * Math.PI) * 10) : 0;
        zerre(c, CX, GY, { face: t < 0.5 ? 'surprised' : 'happy', lift: hop });
        const cardBottom = GY - hop - 40 - Math.round(k * 40);
        put(c, 'card.agent_done', CX, cardBottom);
        if (k >= 1) { put(c, 'arm.up', CX - 16, cardBottom + 10, { flip: true }); put(c, 'arm.up', CX + 16, cardBottom + 10); }
      } else if (moment === 'commit') {
        const cycle = t % 1.6;
        zerre(c, CX, GY, { face: 'grin', lift: cycle < 0.5 ? Math.round(4 * 22 * (cycle / 0.5) * (1 - cycle / 0.5)) : 0, sy: cycle > 0.5 && cycle < 0.6 ? 0.88 : 1, sx: cycle > 0.5 && cycle < 0.6 ? 1.08 : 1 });
        burst(c, 'particle.confetti', CX, GY - 70, t % 1.6, 0.05, 10, { speed: 60 });
        burst(c, 'particle.sparkle', CX, GY - 80, t % 1.6, 0.25, 5, { speed: 40 });
      } else {
        put(c, t % 4.3 > 4.15 ? 'site:zerre-focus-blink' : 'site:zerre-focus', CX - 12, GY, { anchor: [28 / 68, 1] });
      }
    }, { stage: false });
    void S;
  }

  // ---------- One focus block, told in scenes ----------
  function setUpStory() {
    const story = document.getElementById('a-block');
    const chapters = [...story.querySelectorAll('.chapter')];
    const marginVine = document.getElementById('margin-vine');

    // The shield on the page: the step you're reading stays sharp; a toggle lifts it.
    story.classList.add('is-shielded');
    const lift = document.createElement('button');
    lift.type = 'button'; lift.className = 'shield-toggle'; lift.textContent = 'Lift the blur';
    lift.setAttribute('aria-pressed', 'false');
    lift.addEventListener('click', () => {
      const on = story.classList.toggle('is-shielded');
      lift.textContent = on ? 'Lift the blur' : 'Blur again';
      lift.setAttribute('aria-pressed', String(!on));
    });
    story.querySelector('.story-heading p').append(' ', lift);

    let current = -1;
    const update = () => {
      const rect = story.getBoundingClientRect();
      state.storyProgress = Math.min(1, Math.max(0, (innerHeight * 0.5 - rect.top) / rect.height));
      if (rect.top < innerHeight * 0.6 && !state.storyReached) {
        state.storyReached = true;
        state.leave?.(false); // reading the block starts one, if you didn't
      }
      let best = 0, bestDistance = Infinity;
      chapters.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - innerHeight / 2);
        if (d < bestDistance) { bestDistance = d; best = i; }
      });
      if (state.storyProgress >= 1 && !state.cameBack && state.resident) {
        state.cameBack = true; // the block is over: back down to the bottom of the window
        setTimeout(() => state.comeBack?.(false), 1200);
      }
      if (best !== current) { current = best; chapters.forEach((c, i) => c.classList.toggle('is-current', i === best)); }
      marginVine.classList.toggle('is-shown', state.storyReached);
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();

    // When you stop scrolling inside the story, the step nearest the middle glides to the centre,
    // with its neighbours still on screen above and below, blurred.
    let settleTimer;
    const settle = () => {
      if (reduce) return;
      const box = story.getBoundingClientRect();
      if (box.top > innerHeight * 0.5 || box.bottom < innerHeight * 0.5) return;
      const middle = chapters[current]?.getBoundingClientRect();
      if (!middle) return;
      const offset = middle.top + middle.height / 2 - innerHeight / 2;
      if (Math.abs(offset) > 6 && Math.abs(offset) < innerHeight * 0.45) scrollBy({ top: offset, behavior: 'smooth' });
    };
    addEventListener('scroll', () => { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 180); }, { passive: true });

    // The vine in the margin: a tomato for every step read, full when the block is done.
    loop(marginVine, () => {
      const ctx = stage(marginVine, 17, 30, 3);
      const ripe = state.storyProgress >= 1 ? 4 : Math.min(3, Math.max(0, current - 1));
      draw(ctx, vine(ripe, 0, state.storyProgress < 1), 8.5, 30);
    });

    tripScene(document.getElementById('stage-trip'));
    roomScene(document.getElementById('stage-room'));
    shieldDemo(document.getElementById('shield-demo'));
    packScene(document.getElementById('stage-pack'));
    vineScene(document.getElementById('stage-vine'));
    shelfScene(document.getElementById('stage-shelf'));
  }

  // The whole trip in miniature: a crouch, a hop up behind the notch, the mini dropping in.
  function tripScene(canvas) {
    loop(canvas, (raw) => {
      const space = canvas.parentElement.clientWidth;
      const W = 200, H = 130, ctx = stage(canvas, W, H, space >= 440 ? 2 : 1.5);
      const t = Math.floor((raw % 6.4) * 12) / 12;
      const ground = H - 4;
      draw(ctx, 'shadow', W / 2, ground + 2, { alpha: t > 1.25 && t < 6 ? 0 : 1 });
      if (t < 1.0) draw(ctx, t % 1 > 0.88 ? 'site:zerre-idle-blink' : 'site:zerre-idle', W / 2, ground, POSE);
      else if (t < 1.25) draw(ctx, squashed('site:zerre-idle', 1.1, 0.86), W / 2, ground, POSE);
      else if (t < 1.8) { const u = (t - 1.25) / 0.55; draw(ctx, 'site:zerre-idle', W / 2, ground - u * (1.6 - 0.6 * u) * 190, POSE); }
      // The notch, drawn after the body so the hop passes behind it.
      const open = t < 2.0 ? 0 : Math.min(1, (t - 2.0) / 0.2);
      const w = Math.round(100 + 100 * open), h = Math.round(14 + 66 * open);
      ctx.fillStyle = '#0b0b0c'; roundedBottom(ctx, (W - w) / 2, 0, w, h, 4 + 6 * open);
      if (open >= 1) {
        const k = t - 2.2;
        let mini = true;
        if (k < 0.35) mini = { frame: 'mini.air', y: 80 - 30 - (1 - (Math.max(0, k) / 0.35) ** 2) * 50 };
        else if (k < 0.9) mini = { frame: k < 0.5 ? 'mini.crouch' : 'mini.happy', y: 80 - 30 };
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 80); ctx.clip();
        room(ctx, 0, 0, W, 80, raw, { mini, ripe: 1 });
        ctx.restore();
      }
    });
  }

  function roomScene(canvas) {
    loop(canvas, (t) => {
      const space = canvas.parentElement.clientWidth;
      const ctx = stage(canvas, 200, 92, space >= 440 ? 2 : 1.5);
      ctx.fillStyle = '#0b0b0c'; roundedBottom(ctx, 0, 0, 200, 92, 12);
      ctx.fillStyle = '#fff'; ctx.font = '600 6px -apple-system, sans-serif'; ctx.fillText('Block 2', 10, 14);
      ctx.fillStyle = '#ffffff99'; ctx.font = '500 5px -apple-system, sans-serif'; ctx.fillText('18 min left', 162, 14);
      ctx.fillStyle = '#ffffff30'; ctx.fillRect(10, 19, 180, 2);
      ctx.fillStyle = '#d9503f'; ctx.fillRect(10, 19, Math.round(180 * (0.28 + ((t / 40) % 0.6))), 2);
      room(ctx, 0, 12, 200, 80, t, { mini: true, ripe: 1 });
    });
  }

  function shieldDemo(demo) {
    demo.querySelectorAll('.mini-window').forEach((win) => win.addEventListener('click', () => {
      demo.querySelectorAll('.mini-window').forEach((w) => w.classList.toggle('is-focus', w === win));
    }));
  }

  // Zerre with its backpack; deliveries slide in one by one and the pack fills.
  function packScene(canvas) {
    loop(canvas, (raw) => {
      const ctx = stage(canvas, 78, 70, 2);
      const t = raw % 6, cx = 46, ground = 66;
      const papers = Math.min(3, Math.floor(t / 1.5));
      for (let i = 0; i < papers; i++) draw(ctx, 'backpack.paper', cx - 24 + (i * 4 - 4), ground - 9 - 15 + 2);
      draw(ctx, 'backpack', cx - 24, ground - 9);
      draw(ctx, 'shadow', cx, ground + 2);
      draw(ctx, 'body', cx, ground);
      draw(ctx, t % 3 > 2.86 ? 'face.blink' : 'face.focused', cx, ground - 12);
      draw(ctx, 'sprout.2', cx, ground - 35);
      // The next delivery flying in from the right.
      const k = (t % 1.5) / 0.6;
      if (papers < 3 && k < 1) draw(ctx, papers % 2 ? 'card.command_done' : 'card.agent_done', cx - 20 + (1 - k) * 46, ground - 30 + (1 - k) * -6, { alpha: 1 - k * 0.3 });
    });
  }

  // The vine to play with: finish blocks, stop one early, the basket at the long break.
  function vineScene(canvas) {
    const caption = document.getElementById('vine-caption');
    let ripe = 0, green = 0, basket = false;
    document.getElementById('vine-finish').addEventListener('click', () => {
      if (ripe + green >= 4) { basket = true; caption.textContent = 'Long break: picked into the basket.'; return; }
      ripe += 1;
      caption.textContent = ripe + green === 4 ? 'A full vine. Finish one more for the long break.' : `${ripe} ripe${green ? `, ${green} green` : ''}.`;
    });
    document.getElementById('vine-stop').addEventListener('click', () => {
      if (ripe + green >= 4 || basket) return;
      green += 1; caption.textContent = `Stopped early. It still counts: ${green} green.`;
    });
    document.getElementById('vine-reset').addEventListener('click', () => {
      ripe = green = 0; basket = false; caption.textContent = 'A new day. Flowering: a block is running.';
    });
    loop(canvas, () => {
      const ctx = stage(canvas, 44, 40, 4);
      if (basket) { draw(ctx, 'mini.happy', 22, 40); draw(ctx, 'prop.basket', 22, 9); return; }
      draw(ctx, vine(ripe, green, ripe + green < 4), 22, 38);
    });
  }

  function shelfScene(canvas) {
    const week = [[3, 0], [2, 1], [4, 0, true], [1, 0], [5, 0], [2, 1, false, true]];
    const last = [[2, 0], [3, 1], [4, 0]];
    loop(canvas, (t) => {
      const W = 110, ctx = stage(canvas, W, 76, canvas.parentElement.clientWidth < 420 ? 2 : 3);
      const plank = (y) => {
        for (let x = 0; x < W; x += 4) draw(ctx, 'shelf.plank', x, y, { anchor: [0, 1] });
        draw(ctx, 'shelf.bracket', 6, y + 4, { anchor: [0, 1] }); draw(ctx, 'shelf.bracket', W - 6, y + 4, { anchor: [0, 1], flip: true });
      };
      plank(36); plank(74);
      const shown = reduce ? week.length : Math.min(week.length, Math.floor(t * 1.6) + 1);
      week.slice(0, shown).forEach(([r, g, gold, open], i) => draw(ctx, jar(r, g, { gold, open }), 10 + i * 15, 31));
      last.forEach(([r, g], i) => draw(ctx, jar(r, g), 10 + i * 15, 69));
      [0, 1, 2].forEach((i) => draw(ctx, 'shelf.bottle', 58 + i * 11, 69));
      draw(ctx, t % 4.3 > 4.15 ? 'mini.blink' : (shown === week.length && t % 6 < 1.2 ? 'mini.happy' : 'mini.idle'), W - 14, 31);
    });
  }

  // ---------- The celebrations engine (the hero card and the Firsts stage share it) ----------
  // Ported from the app's `Celebration` scenes (drafted in points, y down from the floor).
  function makeCelebrations() {
    const W = 280, H = 210, GY = H - 26, CX = 118, S = 2, L = 4.6;
    const STAGE = '#eaf1e2';
    const snap = (v) => Math.round(v / 2) * 2;
    const u = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
    const arc = (t, a, d, h) => (t >= a && t < a + d ? 4 * h * ((t - a) / d) * (1 - (t - a) / d) : 0);

    function put(c, name, x, y, o = {}) {
      const image = typeof name === 'string' ? imgs[name] : name; if (!image) return;
      const [ax, ay] = o.anchor ?? [0.5, 1];
      c.save();
      if (o.alpha !== undefined) c.globalAlpha = o.alpha;
      c.translate(snap(x), snap(y));
      if (o.rot) c.rotate(o.rot);
      if (o.flip) c.scale(-1, 1);
      c.drawImage(image, -image.width * S * ax, -image.height * S * ay, image.width * S, image.height * S);
      c.restore();
    }
    const bodies = {};
    function body(face) {
      if (bodies[face]) return bodies[face];
      const c = document.createElement('canvas'); c.width = 44; c.height = 54;
      const x = c.getContext('2d');
      x.drawImage(imgs.body, 0, 12); x.drawImage(imgs[`face.${face}`], 12, 54 - 12 - 10); x.drawImage(imgs['sprout.2'], 14, 54 - 35 - 10);
      return bodies[face] = c;
    }
    const SLOT = { shipper: ['trait.badge', -11, 4, 'top'], nightOwl: ['trait.nightcap', -4, 30, 'top'], deepDiver: ['trait.headphones', 0, 25, 'top'],
      earlyBird: ['trait.mug.0', 30, 0, 'ground'], hydrated: ['trait.bottle', 30, 0, 'ground'] };
    function zerre(c, cx, gy, z = {}) {
      const sx = z.sx ?? 1, sy = z.sy ?? 1, lift = z.lift ?? 0;
      const at = (bx, by) => [cx + bx * sx * S, gy - lift - by * sy * S];
      put(c, 'shadow', cx, gy + 4, { alpha: lift > 20 ? 0.5 : 1 });
      if (z.arms) {
        const wave = z.arms === 'wave' ? (Math.floor(z.t * 6) % 2 ? 2 : 0) : 0;
        put(c, 'arm.up', ...at(-15, 30 + wave), { flip: true });
        if (z.arms !== 'wave') put(c, 'arm.up', ...at(15, 30));
      }
      const b = body(z.face ?? 'neutral');
      put(c, sx !== 1 || sy !== 1 ? squashFrom(b, sx, sy, z.face) : b, cx, gy - lift);
      for (const t of z.worn ?? []) { const s = SLOT[t]; if (s?.[3] === 'top') put(c, s[0], ...at(s[1], s[2])); }
      for (const t of z.worn ?? []) { const s = SLOT[t]; if (s?.[3] === 'ground') put(c, s[0], cx + s[1] * S, gy); }
    }
    const squashBodies = {};
    function squashFrom(src, sx, sy, face) {
      const key = `${face}@${sx}x${sy}`;
      if (squashBodies[key]) return squashBodies[key];
      const c = document.createElement('canvas'); c.width = Math.round(src.width * sx); c.height = Math.round(src.height * sy);
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
      return squashBodies[key] = c;
    }
    function burst(c, name, x, y, t, t0, n = 6, o = {}) {
      const life = o.life ?? 0.9, k = t - t0;
      if (k < 0 || k > life) return;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (o.turn ?? 0.3), sp = (o.speed ?? 40) * (0.7 + ((i * 37) % 10) / 20);
        put(c, name, x + Math.cos(a) * sp * k, y - Math.sin(a) * sp * k + (o.gravity ?? 60) * k * k, { anchor: [0.5, 0.5] });
      }
    }
    let tinting = true;
    function tint(c, color, alpha) { if (!tinting || alpha <= 0) return; c.save(); c.globalAlpha = Math.round(alpha * 8) / 8; c.fillStyle = color; c.fillRect(0, 0, W, H); c.restore(); }

    const SCENES = {
      shipper: (c, t) => {
        const fly = u(t, 1.6, 2.5), y = GY - fly * fly * 220;
        zerre(c, CX, GY, { face: t < 1.6 ? 'curious' : t < 2.8 ? 'surprised' : 'grin', worn: t > 3 ? ['shipper'] : [], arms: t > 0.8 && t < 1.4 ? 'wave' : null, t });
        if (t > 0.3 && t < 2.5) { put(c, 'fx.parcel', CX + 64, y); if (t > 1.3) put(c, `fx.flame.${Math.floor(t * 12) % 2}`, CX + 64, y + 8); }
        if (t > 1.6 && t < 2.6) burst(c, 'particle.dust', CX + 64, GY, t, 1.6, 4, { speed: 30, gravity: 0 });
        if (t > 2.6 && t < 3) put(c, 'trait.badge', CX - 22, GY - 8 - (3 - t) * 90);
        burst(c, 'particle.sparkle', CX - 22, GY - 14, t, 3.0, 5);
      },
      agentWrangler: (c, t) => {
        const drop = u(t, 0.2, 1.8), five = t > 2.2 && t < 2.8;
        zerre(c, CX, GY, { face: five ? 'happy' : t < 1.8 ? 'curious' : 'neutral', arms: five ? 'wave' : null, t, lift: arc(t, 2.2, 0.35, 10) });
        const robot = `trait.robot.${Math.floor(t * 8) % 4}`;
        if (t < 3.2) {
          const x = five ? CX + 44 : CX + 60 + Math.round(Math.sin(t * 4) * 3) * 2 * (1 - drop), y = five ? GY - 50 : GY - 150 * (1 - drop);
          if (t < 1.8) put(c, 'fx.parachute', x, y - 18);
          put(c, robot, x, y);
        } else { const a = (t - 3.2) * 3; put(c, robot, CX + Math.cos(a) * 64, GY - 68 - Math.sin(a) * 10, { anchor: [0.5, 0.5] }); }
        burst(c, 'particle.sparkle', CX + 38, GY - 70, t, 2.3, 6);
      },
      earlyBird: (c, t) => {
        tint(c, '#f4a7b9', 0.35 * u(t, 0, 0.8) * (1 - u(t, 3.6, 4.4)));
        put(c, 'fx.sun', CX - 70, GY - 30 - u(t, 0.2, 2.0) * 80);
        if (tinting) { c.fillStyle = STAGE; c.fillRect(0, GY, W, H - GY); }
        const sip = t > 2.6 && t < 3.6;
        zerre(c, CX, GY, { face: sip ? 'happy' : t > 1.2 ? 'curious' : 'blink', worn: t >= 3.6 ? ['earlyBird'] : [] });
        const k = u(t, 0.8, 1.8);
        if (t > 0.8) {
          const x = CX + 4 + (1 - k) * 150, y = GY - 88 - (1 - k) * 60 - Math.sin(k * Math.PI) * 20;
          put(c, k < 1 ? `fx.bird.fly.${Math.floor(t * 10) % 2}` : 'fx.bird.sit', x, y, { flip: k >= 1 && t > 3.2 });
        }
        const mug = `trait.mug.${Math.floor(t * 6) % 3}`;
        if (t > 2.2 && t <= 2.6) put(c, mug, CX + 60, GY);
        if (sip) put(c, mug, CX + 22, GY - 26);
        if (t > 2.2) burst(c, 'particle.steam', CX + (sip ? 22 : 60), GY - (sip ? 46 : 20), t, 2.2 + Math.floor((t - 2.2) / 0.5) * 0.5, 2, { speed: 20, gravity: -30, life: 0.5, turn: 1.4 });
      },
      nightOwl: (c, t) => {
        const dark = u(t, 0, 0.8) * (1 - u(t, 3.8, 4.5));
        tint(c, '#142a32', 0.7 * dark);
        if (dark > 0.5) { put(c, 'fx.moon', W - 50, 46); for (let i = 0; i < 6; i++) if ((Math.floor(t * 3) + i) % 3) put(c, 'particle.star', 30 + i * 37, 30 + (i * 23) % 50); }
        const cap = u(t, 0.6, 2.2);
        zerre(c, CX, GY, { face: t > 2.4 && t < 3.4 ? 'yawn' : t > 3.4 ? 'blink' : 'curious', worn: cap >= 1 ? ['nightOwl'] : [] });
        if (cap < 1) put(c, 'trait.nightcap', CX - 8 + Math.round(Math.sin(cap * 9) * 6) * 2, GY - 220 + cap * 160, { rot: Math.sin(cap * 9) * 0.15 });
        if (t > 2.6) burst(c, 'particle.zzz', CX + 40, GY - 100, t, 2.6, 1, { speed: 30, gravity: -20, life: 1.2, turn: 1.1 });
      },
      hydrated: (c, t) => {
        const holding = t > 0.9 && t < 3.0;
        zerre(c, CX, GY, { face: t < 0.9 ? 'surprised' : holding ? 'happy' : 'grin', arms: holding ? 'up' : null, worn: t > 3.0 ? ['hydrated'] : [], sy: t > 0.9 && t < 1.0 ? 0.92 : 1 });
        if (t < 0.9) put(c, 'trait.bottle', CX, GY - 220 + u(t, 0.1, 0.9) * 120);
        if (holding) {
          put(c, 'trait.bottle', CX, GY - 96);
          for (let i = 0; i < 4; i++) { const k = (t * 1.4 + i * 0.25) % 1; put(c, 'fx.bubble', CX - 4 + (i % 2) * 8, GY - 110 - k * 40, { alpha: 1 - k }); }
        }
        burst(c, 'particle.confetti', CX, GY - 100, t, 2.4, 6, { speed: 40 });
      },
      deepDiver: (c, t) => {
        const water = u(t, 0, 0.6) * (1 - u(t, 3.6, 4.3));
        tint(c, '#5fa8d3', 0.45 * water);
        const head = u(t, 0.8, 2.2), diving = t > 0.5 && t < 0.9;
        zerre(c, CX, GY, { face: t < 2.2 ? 'focused' : 'happy', sy: diving ? 1.1 : 1, sx: diving ? 0.92 : 1, worn: head >= 1 ? ['deepDiver'] : [] });
        if (head < 1) put(c, 'trait.headphones', CX, GY - 230 + head * 170);
        if (water > 0.3) for (let i = 0; i < 6; i++) { const k = (t * 0.8 + i / 6) % 1; put(c, 'fx.bubble', 20 + i * 44, H - k * H, { anchor: [0.5, 0.5] }); }
        if (t > 2.3) burst(c, 'particle.note', CX + 40, GY - 90, t, 2.3 + Math.floor((t - 2.3) / 0.6) * 0.6, 1, { speed: 30, gravity: -20, life: 0.6, turn: 1.2 });
      },
    };
    const INFO = {
      shipper: ['Shipper', 'Commits on most days'], agentWrangler: ['Agent wrangler', 'Lots of coding agent turns'],
      earlyBird: ['Early bird', 'At the Mac before 8 on most days'], nightOwl: ['Night owl', 'Still up after 23:00 on most days'],
      hydrated: ['Hydrated', 'Water, several times a day'], deepDiver: ['Deep diver', 'Three or more focus blocks a day'],
    };

    // Paints a stage every frame: the background, the floor line, then the scene.
    // `o.stage: false` draws on a transparent canvas, without the stage's colour washes.
    function paint(canvas, scale, scene, o = {}) {
      loop(canvas, () => {
        const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
        if (canvas.width !== W * scale * dpr) {
          canvas.width = W * scale * dpr; canvas.height = H * scale * dpr;
          canvas.style.width = `${W * scale}px`; canvas.style.height = `${H * scale}px`;
        }
        const c = canvas.getContext('2d');
        c.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0); c.imageSmoothingEnabled = false;
        tinting = o.stage !== false;
        if (tinting) {
          c.fillStyle = STAGE; c.fillRect(0, 0, W, H);
          c.fillStyle = '#425e4b22'; c.fillRect(0, GY + 2, W, 2);
        } else c.clearRect(0, 0, W, H);
        scene(c);
      });
    }

    return { W, H, GY, CX, S, L, put, zerre, burst, SCENES, INFO, paint };
  }

  // ---------- Firsts: six celebrations, played exactly as the app plays them ----------
  function setUpFirsts() {
    const canvas = document.getElementById('stage-firsts');
    const caption = document.getElementById('firsts-caption');
    const grid = document.getElementById('firsts-grid');
    const { SCENES, INFO, L } = celebrations;
    // The 22, in the app's order: six to watch, the rest as outlines.
    const ALL = [['terminal', 'trait.terminal.cursor', 42, 33], ['shipper', 'trait.badge', 21, 21], ['agentWrangler', 'trait.robot.0', 27, 27],
      ['noteKeeper', 'trait.pencil', 12, 30], ['earlyBird', 'trait.mug.0', 27, 27], ['nightOwl', 'trait.nightcap', 54, 33],
      ['mover', 'trait.sweatband', 96, 9], ['hydrated', 'trait.bottle', 15, 27], ['deepDiver', 'trait.headphones', 78, 30],
      ['explorer', 'trait.compass', 15, 18], ['fixer', 'trait.wrench', 33, 21], ['meetingSurvivor', 'trait.tie', 15, 24],
      ['tidy', 'trait.broom', 18, 39], ['steady', 'trait.watch', 15, 18], ['rester', 'trait.pillow', 48, 33], ['polyglot', 'trait.walkie', 15, 33],
      ['marathoner', 'trait.trophy', 21, 27], ['planner', 'trait.clipboard', 24, 30], ['finisher', 'trait.star', 21, 21],
      ['builder', 'trait.hardhat', 72, 27], ['lunchBreaker', 'trait.bento', 30, 18], ['sundowner', 'trait.visor', 90, 12]];
    const buttons = {};
    for (const [id, sprite, w, h] of ALL) {
      const li = document.createElement('li');
      if (SCENES[id]) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'achievement';
        b.setAttribute('aria-label', `Play the ${INFO[id][0]} celebration`);
        b.innerHTML = `<span class="achievement-art"><img src="/assets/sprites/${sprite}.png" alt="" width="${w}" height="${h}"></span><span>${INFO[id][0]}</span>`;
        b.addEventListener('click', () => { count('click-first'); play(id, true); });
        buttons[id] = b; li.append(b);
      } else {
        li.className = 'achievement is-locked';
        li.innerHTML = `<span class="achievement-art"><img src="/assets/sprites/outline.${sprite}.png" alt="A locked achievement" width="${w}" height="${h}"></span><span>???</span>`;
      }
      grid.append(li);
    }

    const order = Object.keys(SCENES);
    let playing = order[0], startedAt = performance.now() / 1000, pinned = false;
    function play(id, byHand) {
      playing = id; startedAt = performance.now() / 1000; pinned = byHand || pinned;
      for (const [key, b] of Object.entries(buttons)) b.classList.toggle('is-playing', key === id);
      caption.textContent = `${INFO[id][0]} · ${INFO[id][1]}`;
    }
    play(playing, false);
    celebrations.paint(canvas, canvas.parentElement.clientWidth < 460 ? 1 : 1.5, (c) => {
      const elapsed = performance.now() / 1000 - startedAt;
      if (elapsed > L + 1.2 && !reduce) {
        // On to the next one, around the six.
        play(order[(order.indexOf(playing) + 1) % order.length], false);
      }
      const t = reduce ? L : Math.floor(Math.min(elapsed, L) * 12) / 12;
      SCENES[playing](c, t);
    });
  }
})();
