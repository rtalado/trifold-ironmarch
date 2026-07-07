// ============================================================================
// TRIFOLD: IRONMARCH — DOM UI
// Screens: title, map (hi-dpi vector icons), battle (tray + placement), overlays.
// ============================================================================
'use strict';

const UI = {
  el: {}, mapNodes: [], hintT: null,

  init() {
    for (const id of ['title','map','battle','overlay']) this.el[id] = document.getElementById(id);
    this.el.tray = document.getElementById('tray');
    this.el.hint = document.getElementById('hintBanner');
    this.el.mapCv = document.getElementById('mapCanvas');
    const cv = document.getElementById('battleCanvas');

    // Pointer input & camera gestures.
    // Mouse: hover ghost, click places, right-click unplaces, wheel zooms,
    //        left-drag pans when nothing is selected.
    // Touch: with a squad selected, drag aims the ghost and release places;
    //        otherwise one finger pans. Pinch zooms. Long-press unplaces/cancels.
    const LP_SLOP = 14;
    const ptrs = new Map();
    let lpTimer = null, lpFired = false, touchDown = false;
    let downX = 0, downY = 0, panning = false, pinch = null, gestureT = -9999, lastTouchT = -9999;
    const stopLP = () => { clearTimeout(lpTimer); lpTimer = null; };
    const pressField = (b, wx, wy) => {
      if (b.abilityArmed) { b.abilityArmed = false; this.refreshBattleHUD(b); return; }
      if (b.selected != null) { b.selected = null; this.refreshTray(b); return; }
      fieldUnplace(b, wx, wy);
    };
    const pinchState = () => {
      const [a, c] = [...ptrs.values()];
      return { d: Math.hypot(a.x - c.x, a.y - c.y), mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2 };
    };

    cv.addEventListener('pointerdown', e => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      if (ptrs.size === 2) { stopLP(); panning = false; pinch = pinchState(); gestureT = performance.now(); return; }
      downX = e.clientX; downY = e.clientY; lpFired = false; panning = false;
      if (e.pointerType === 'mouse') return; // click/contextmenu/drag-pan handle mouse
      touchDown = true;
      const p = Render.toWorld(e.clientX, e.clientY);
      Render.mouse.wx = p.wx; Render.mouse.wy = p.wy; Render.mouse.over = true;
      stopLP();
      lpTimer = setTimeout(() => {
        lpTimer = null; lpFired = true;
        const b = G.battle; if (!b) return;
        if (navigator.vibrate && Meta.settings.haptics) navigator.vibrate(25);
        pressField(b, p.wx, p.wy);
      }, Meta.settings.holdMs);
    });

    cv.addEventListener('pointermove', e => {
      const prev = ptrs.get(e.pointerId);
      if (prev && pinch && ptrs.size === 2) {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const now = pinchState();
        if (pinch.d > 0) Render.zoomAt(now.mx, now.my, now.d / pinch.d);
        Render.panBy(now.mx - pinch.mx, now.my - pinch.my);
        pinch = now; gestureT = performance.now();
        return;
      }
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (lpTimer && moved > LP_SLOP) stopLP();
      const b = G.battle;
      const held = prev && (e.pointerType !== 'mouse' || (e.buttons & 1));
      if (held && (!b || b.selected == null) && (panning || moved > LP_SLOP)) {
        panning = true; gestureT = performance.now();
        Render.panBy(e.clientX - prev.x, e.clientY - prev.y);
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        return;
      }
      if (prev) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = Render.toWorld(e.clientX, e.clientY);
      Render.mouse.wx = p.wx; Render.mouse.wy = p.wy;
      Render.mouse.over = p.wx > -40 && p.wx < ARENA.w + 40 && p.wy > -40 && p.wy < ARENA.h + 40;
    });

    cv.addEventListener('pointerup', e => {
      const wasGesture = panning || performance.now() - gestureT < 250;
      ptrs.delete(e.pointerId);
      if (pinch && ptrs.size < 2) pinch = null;
      stopLP();
      if (e.pointerType === 'mouse') { panning = false; return; }
      touchDown = false; lastTouchT = performance.now();
      const b = G.battle;
      if (!lpFired && !wasGesture && b) {
        const p = Render.toWorld(e.clientX, e.clientY);
        fieldClick(b, p.wx, p.wy);
      }
      panning = false;
      Render.mouse.over = false;
    });
    cv.addEventListener('pointercancel', e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      touchDown = false; panning = false; stopLP();
      Render.mouse.over = false;
    });
    cv.addEventListener('pointerleave', () => { if (!ptrs.size) Render.mouse.over = false; });

    cv.addEventListener('wheel', e => {
      e.preventDefault();
      Render.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });

    cv.addEventListener('click', e => {
      const now = performance.now();
      if (now - lastTouchT < 600 || now - gestureT < 300) return; // touch tap / pan already handled
      const b = G.battle; if (!b) return;
      const p = Render.toWorld(e.clientX, e.clientY);
      fieldClick(b, p.wx, p.wy);
    });
    cv.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (touchDown || lpFired) return; // long-press already handled it
      const b = G.battle; if (!b) return;
      const p = Render.toWorld(e.clientX, e.clientY);
      pressField(b, p.wx, p.wy);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && (G.screen === 'menu' || ((G.screen === 'map' || G.screen === 'battle') && !(G.battle && (G.battle.selected != null || G.battle.abilityArmed))))) {
        this.toggleMenu();
        return;
      }
      const b = G.battle;
      if (!b) return;
      if (e.key === 'Escape' && b.abilityArmed) { b.abilityArmed = false; this.refreshBattleHUD(b); }
      if (e.key === 'Escape' && b.selected != null) { b.selected = null; this.refreshTray(b); }
      if (e.key === ' ' && G.screen === 'battle') {
        e.preventDefault();
        if (b.phase === 'place') beginFight(b);
        else { G.speed = G.speed === 0 ? 1 : 0; this.syncSpeed(); }
      }
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) {
        const idx = this.trayOrder && this.trayOrder[n - 1];
        if (idx != null) this.selectTray(b, idx);
      }
    });

    this.el.mapCv.addEventListener('click', e => {
      const rect = this.el.mapCv.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      for (const n of this.mapNodes) {
        if (n.clickable && dist2(x, y, n.x, n.y) < 26 * 26) { Run.enterNode(n.node); return; }
      }
    });

    // System back (Android gesture / browser back) drives in-game navigation:
    // a re-armed history trap turns each back-press into a backAction().
    if (location.protocol.startsWith('http')) {
      window.addEventListener('popstate', () => {
        this.navArmed = false;
        if (this.backAction()) this.armBack();
      });
    }

    // The OS releases the wake lock whenever the tab is hidden (app switch,
    // screen lock) — grab it back if we return mid-fight.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && G.screen === 'battle' &&
          G.battle && G.battle.phase === 'fight' && !G.battle.over) this.acquireWakeLock();
    });

    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    on('btnStart', () => this.showFactionSelect());
    on('btnResume', () => this.resumeRun());
    on('btnArmory', () => this.showArmory());
    on('btnCodex', () => this.showCodex());
    on('btnSettings', () => this.showSettings(() => this.showTitle()));
    on('btnRosterMap', () => this.showRoster(G.run.roster, { title: 'The Column' }));
    on('btnMenuMap', () => this.showMenu());
    on('btnMenuBattle', () => this.showMenu());
    on('btnFight', () => { const b = G.battle; if (b) beginFight(b); });
    on('stnAdvance', () => this.setStance('advance'));
    on('stnHold', () => this.setStance('hold'));
    on('stnFallback', () => this.setStance('fallback'));
    on('btnAbility', () => this.toggleAbility());
    for (const s of [0, 1, 2]) {
      document.getElementById('spd' + s).onclick = () => { G.speed = s === 0 ? 0 : s; this.syncSpeed(); };
    }
  },

  show(name) {
    for (const id of ['title','map','battle','overlay']) this.el[id].classList.toggle('hidden', id !== name);
    if (name !== 'title') this.armBack();
    // Only worth keeping the screen awake while a fight is actually running and
    // visible — leaving battle (pause menu, reward, map, title...) releases it.
    if (name === 'battle' && G.battle && G.battle.phase === 'fight' && !G.battle.over) this.acquireWakeLock();
    else this.releaseWakeLock();
  },

  // ---------------- screen wake lock (don't let the screen dim mid-fight) ----------------
  wakeLock: null,
  async acquireWakeLock() {
    if (!('wakeLock' in navigator) || this.wakeLock) return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => { this.wakeLock = null; });
    } catch (e) { this.wakeLock = null; }
  },
  releaseWakeLock() {
    if (this.wakeLock) { this.wakeLock.release().catch(() => {}); this.wakeLock = null; }
  },

  // ---------------- system back integration ----------------
  navArmed: false, backFn: null,
  armBack() {
    if (this.navArmed || !location.protocol.startsWith('http')) return;
    try { history.pushState({ ironmarch: 1 }, ''); this.navArmed = true; } catch (e) {}
  },
  backAction() {
    if (this.backFn) { const f = this.backFn; this.backFn = null; f(); return true; }
    if (G.screen === 'menu') { G.screen = this.menuFrom; this.show(this.menuFrom); return true; }
    if (G.screen === 'map' || G.screen === 'battle') { this.showMenu(); return true; }
    if (G.screen === 'title') return false;      // let the app background/exit
    return true;                                  // required-choice overlays: stay put
  },

  // =================================================================
  // TITLE
  // =================================================================
  showTitle() {
    G.screen = 'title'; this.backFn = null; this.show('title');
    const d = Meta.data;
    document.getElementById('titleStats').textContent =
      d.runs === 0 ? 'The column awaits its first order.' :
      `Marches: ${d.runs} · Victories: ${d.wins} · Squads unlocked: ${d.unlocked.length}/${META_UNLOCKS.reduce((n, u) => n + u.squads.length, 0)}`;
    document.getElementById('btnResume').classList.toggle('hidden', !localStorage.getItem('ironmarch_run_v2'));
    document.getElementById('versionTag').textContent = 'v' + GAME_VERSION;
  },

  // =================================================================
  // TITLE BACKDROP — painted ridgelines under a slow ashfall
  // =================================================================
  titleBg: null, titleAsh: null,
  drawTitle(dt) {
    const cv = document.getElementById('titleCanvas');
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; this.titleBg = null; }
    const g = cv.getContext('2d');

    if (!this.titleBg) {
      const bg = mkCanvas(w, h), q = bg.getContext('2d');
      const sky = q.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0b0c10'); sky.addColorStop(0.55, '#111320'); sky.addColorStop(1, '#191009');
      q.fillStyle = sky; q.fillRect(0, 0, w, h);
      // ember glow on the eastern horizon — the bloodfields wait
      const gl = q.createRadialGradient(w * 0.82, h * 0.8, 0, w * 0.82, h * 0.8, Math.max(w, h) * 0.55);
      gl.addColorStop(0, '#b8483a30'); gl.addColorStop(0.5, '#b8483a12'); gl.addColorStop(1, '#b8483a00');
      q.fillStyle = gl; q.fillRect(0, 0, w, h);
      const gd = q.createRadialGradient(w * 0.2, h * 0.9, 0, w * 0.2, h * 0.9, Math.max(w, h) * 0.4);
      gd.addColorStop(0, '#d8b45a14'); gd.addColorStop(1, '#d8b45a00');
      q.fillStyle = gd; q.fillRect(0, 0, w, h);
      // ridgelines, far to near
      const layers = [
        { base: 0.66, amp: 0.06, f: 5.1, col: '#14161d' },
        { base: 0.76, amp: 0.08, f: 3.3, col: '#0e1015' },
        { base: 0.87, amp: 0.06, f: 4.2, col: '#08090c' },
      ];
      layers.forEach((L, li) => {
        q.fillStyle = L.col;
        q.beginPath(); q.moveTo(0, h);
        for (let x = 0; x <= w; x += Math.max(2, w / 240)) {
          const a = x / w * Math.PI * L.f + li * 13.7;
          const yy = h * L.base + h * L.amp * (Math.sin(a) * 0.6 + Math.sin(a * 2.63) * 0.3 + Math.sin(a * 6.1) * 0.1);
          q.lineTo(x, yy);
        }
        q.lineTo(w, h); q.closePath(); q.fill();
      });
      this.titleBg = bg;
      this.titleAsh = Array.from({ length: 60 }, () => ({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-16, -5) * dpr, vy: rand(-9, -2) * dpr,
        r: rand(0.7, 1.9) * dpr, a: rand(0.08, 0.4),
        gold: Math.random() < 0.3,
      }));
    }

    g.drawImage(this.titleBg, 0, 0);
    for (const m of this.titleAsh) {
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < -4) m.x += w + 8;
      if (m.y < -4) m.y += h + 8;
      g.fillStyle = m.gold ? `rgba(216,180,90,${m.a})` : `rgba(150,152,165,${m.a * 0.8})`;
      g.beginPath(); g.arc(m.x, m.y, m.r, 0, 7); g.fill();
    }
  },

  // =================================================================
  // PAUSE MENU & SETTINGS
  // =================================================================
  toggleMenu() {
    if (G.screen === 'menu') { G.screen = this.menuFrom; this.show(this.menuFrom); }
    else this.showMenu();
  },

  showMenu() {
    if (G.screen === 'map' || G.screen === 'battle') { this.menuFrom = G.screen; G.screen = 'menu'; }
    if (!this.menuFrom) return;
    this.backFn = null;
    const inBattle = this.menuFrom === 'battle';
    const p = this.overlay(`
      <h2>THE MARCH HALTS</h2>
      <div class="btnCol">
        <button id="mnBack">Continue</button>
        <button id="mnSettings">Settings</button>
        <button id="mnTitle" class="ghostBtn">${inBattle ? 'Retreat to the muster' : 'Return to the muster'}</button>
      </div>
      ${inBattle ? '<p class="dim small" style="margin-top:14px">Retreating abandons this battle — the field resets when you return.</p>'
                 : '<p class="dim small" style="margin-top:14px">The run is saved. The column holds position.</p>'}
    `);
    p.querySelector('#mnBack').onclick = () => { G.screen = this.menuFrom; this.show(this.menuFrom); };
    p.querySelector('#mnSettings').onclick = () => this.showSettings(() => this.showMenu());
    this.arm(p.querySelector('#mnTitle'), inBattle ? 'Abandon the field?' : 'Leave the map?', () => {
      G.battle = null;
      this.showTitle();
    });
  },

  showSettings(backFn) {
    const prev = G.screen;
    if (prev !== 'menu') G.screen = 'settings';
    this.settingsBack = backFn;
    this.backFn = backFn;
    const s = Meta.settings;
    const hasRun = !!(G.run || localStorage.getItem('ironmarch_run_v2'));
    const p = this.overlay(`
      <h2>SETTINGS</h2>
      <div class="setList">
        <div class="setRow">Screen shake<button id="stShake"></button></div>
        <div class="setRow">Touch rumble<button id="stHaptics"></button></div>
        <div class="setRow">Long-press speed
          <span class="setOpts">
            <button data-ms="300">Quick</button><button data-ms="450">Normal</button><button data-ms="650">Slow</button>
          </span>
        </div>
        <div class="setRow">Save data
          <span class="setOpts">
            <button id="stExport">Export</button><button id="stImport">Import</button>
          </span>
        </div>
      </div>
      <div class="btnCol" style="margin-top:20px">
        <button id="stUpdate" class="ghostBtn">⟳ Fetch latest version</button>
        ${hasRun ? '<button id="stAbandon" class="ghostBtn">Abandon the current run</button>' : ''}
        <button id="stWipe" class="ghostBtn">Reset all progress</button>
        <button id="stBack">Back</button>
      </div>
      <p class="dim small" style="margin-top:14px">Client fetched: ${document.lastModified}</p>
    `);
    const syncToggles = () => {
      p.querySelector('#stShake').textContent = s.shake ? 'ON' : 'OFF';
      p.querySelector('#stShake').classList.toggle('on', s.shake);
      p.querySelector('#stHaptics').textContent = s.haptics ? 'ON' : 'OFF';
      p.querySelector('#stHaptics').classList.toggle('on', s.haptics);
      for (const b of p.querySelectorAll('.setOpts button'))
        b.classList.toggle('on', Number(b.dataset.ms) === s.holdMs);
    };
    syncToggles();
    p.querySelector('#stShake').onclick = () => { s.shake = !s.shake; Meta.saveSettings(); syncToggles(); };
    p.querySelector('#stHaptics').onclick = () => {
      s.haptics = !s.haptics; Meta.saveSettings(); syncToggles();
      if (s.haptics && navigator.vibrate) navigator.vibrate(25);
    };
    for (const b of p.querySelectorAll('.setOpts button'))
      b.onclick = () => { s.holdMs = Number(b.dataset.ms); Meta.saveSettings(); syncToggles(); };
    p.querySelector('#stExport').onclick = () => this.showSaveData('export');
    p.querySelector('#stImport').onclick = () => this.showSaveData('import');
    p.querySelector('#stUpdate').onclick = () => location.reload();
    if (hasRun) this.arm(p.querySelector('#stAbandon'), 'Strike the column?', () => {
      this.clearSave(); G.run = null; G.battle = null; this.showTitle();
    });
    this.arm(p.querySelector('#stWipe'), 'Forget every march?', () => {
      localStorage.removeItem(Meta.KEY); this.clearSave();
      G.run = null; G.battle = null; Meta.load(); this.showTitle();
    });
    p.querySelector('#stBack').onclick = () => { this.backFn = null; backFn(); };
  },

  // =================================================================
  // SAVE DATA — export/import the whole state as portable JSON
  // =================================================================
  showSaveData(mode) {
    const backTo = () => this.showSettings(this.settingsBack || (() => this.showTitle()));
    this.backFn = backTo;
    let run = null;
    try { run = JSON.parse(localStorage.getItem('ironmarch_run_v2')); } catch (e) {}
    const exporting = mode === 'export';
    const p = this.overlay(`
      <h2>${exporting ? 'EXPORT SAVE' : 'IMPORT SAVE'}</h2>
      <p class="dim small">${exporting
        ? `Everything the column remembers — meta progress${run ? ', the current run' : ''} and settings. Copy it somewhere safe, or paste it into Import on another device.`
        : 'Paste an exported save below. It replaces the save on this device.'}</p>
      <textarea id="svText" class="saveBox" ${exporting ? 'readonly' : ''} spellcheck="false"></textarea>
      <p id="svStatus" class="small gold">&nbsp;</p>
      <div class="btnRow">
        ${exporting
          ? '<button id="svCopy">Copy to clipboard</button><button id="svFile" class="ghostBtn">Download file</button>'
          : '<button id="svLoad">Load this save</button>'}
        <button id="svBack" class="ghostBtn">Back</button>
      </div>
    `);
    const ta = p.querySelector('#svText'), status = p.querySelector('#svStatus');

    if (exporting) {
      const stamp = new Date();
      const text = JSON.stringify({
        game: 'ironmarch', v: 1, exported: stamp.toISOString(),
        meta: Meta.data, settings: Meta.settings, run,
      });
      ta.value = text;
      p.querySelector('#svCopy').onclick = async () => {
        try { await navigator.clipboard.writeText(text); }
        catch (e) { ta.focus(); ta.select(); document.execCommand('copy'); }
        status.textContent = 'Copied. Paste it somewhere safe.';
      };
      p.querySelector('#svFile').onclick = () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        a.download = `ironmarch-save-${stamp.toISOString().slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        status.textContent = 'If nothing downloaded, use the clipboard instead.';
      };
    } else {
      p.querySelector('#svLoad').onclick = () => {
        let o = null;
        try { o = JSON.parse(ta.value.trim()); } catch (e) {}
        if (!o || o.game !== 'ironmarch' || !o.meta) {
          status.textContent = 'That doesn’t read like an Ironmarch save.';
          return;
        }
        Meta.data = Object.assign({ runs: 0, wins: 0, bestAct: 0, unlocked: [] }, o.meta);
        Meta.save();
        if (o.settings) { Object.assign(Meta.settings, o.settings); Meta.saveSettings(); }
        if (o.run) { try { localStorage.setItem('ironmarch_run_v2', JSON.stringify(o.run)); } catch (e) {} }
        else this.clearSave();
        G.run = null; G.battle = null;
        this.showTitle();
      };
    }
    p.querySelector('#svBack').onclick = backTo;
  },

  // two-tap confirm for destructive buttons
  arm(btn, armedLabel, fn) {
    const orig = btn.textContent;
    btn.onclick = () => {
      if (btn.dataset.armed) { fn(); return; }
      btn.dataset.armed = '1';
      btn.classList.add('armed');
      btn.textContent = armedLabel;
      setTimeout(() => {
        if (!btn.isConnected) return;
        delete btn.dataset.armed;
        btn.classList.remove('armed');
        btn.textContent = orig;
      }, 2600);
    };
  },

  // =================================================================
  // ARMORY — every squad type, locked ones show their requisition
  // =================================================================
  showArmory() {
    G.screen = 'armory';
    this.backFn = () => this.showTitle();
    const total = Object.keys(SQUADS).length;
    const haveAll = Object.keys(FACTIONS).reduce((n, f) => n + Meta.pool(f).length, 0);
    const p = this.overlay(`
      <h2>THE ARMORY <span class="dim">(${haveAll}/${total} requisitioned)</span></h2>
      <p class="dim small">Squads each faction can muster. Locked requisitions are earned by marching — any faction's marches count.</p>
      <div id="amSections"></div>
      <button id="amBack" class="ghostBtn">Back</button>
    `);
    const needOf = id => {
      for (const u of META_UNLOCKS) if (u.squads.includes(id)) {
        return u.need.wins ? `${u.label} — ${u.need.wins} victor${u.need.wins > 1 ? 'ies' : 'y'}` : `${u.label} — ${u.need.runs} march${u.need.runs > 1 ? 'es' : ''}`;
      }
      return '';
    };
    const sections = p.querySelector('#amSections');
    for (const [facId, f] of Object.entries(FACTIONS)) {
      const have = Meta.pool(facId);
      sections.insertAdjacentHTML('beforeend', `<h3 class="amFac">${f.name.toUpperCase()}</h3>`);
      const row = document.createElement('div');
      row.className = 'cardRow wrap';
      for (const id of Object.keys(SQUADS).filter(s => UNITS[s].fac === facId)) {
        const el = this.squadEl(id, { small: true });
        if (!have.includes(id)) {
          el.classList.add('locked');
          const lock = document.createElement('div');
          lock.className = 'lockNote';
          lock.textContent = needOf(id);
          el.appendChild(lock);
        }
        row.appendChild(el);
      }
      sections.appendChild(row);
    }
    p.querySelector('#amBack').onclick = () => this.showTitle();
  },

  saveRun() { try { localStorage.setItem('ironmarch_run_v2', JSON.stringify(G.run)); } catch (e) {} },
  clearSave() { localStorage.removeItem('ironmarch_run_v2'); },
  resumeRun() {
    try {
      const r = JSON.parse(localStorage.getItem('ironmarch_run_v2'));
      if (r && r.map && r.roster) {
        if (!r.fac || !FACTIONS[r.fac]) r.fac = 'vanguard'; // pre-faction saves
        G.run = r; G.screen = 'map'; this.showMap(); return;
      }
    } catch (e) {}
    this.showFactionSelect();
  },

  // =================================================================
  // FACTION SELECT — who marches?
  // =================================================================
  showFactionSelect() {
    G.screen = 'facselect';
    this.backFn = () => this.showTitle();
    const p = this.overlay(`
      <h2>WHO MARCHES EAST?</h2>
      <p class="dim small">Each faction musters its own squads and fights the same war its own way.</p>
      <label class="brutalToggle"><input type="checkbox" id="fsBrutal"> <b>Brutal Mode</b> — squads that survive a battle carry their wounds into the next one instead of healing up fully.</label>
      <div id="facRow" class="facRow"></div>
      <button id="fsBack" class="ghostBtn">Back</button>
    `);
    const row = p.querySelector('#facRow');
    const brutalBox = p.querySelector('#fsBrutal');
    for (const [id, f] of Object.entries(FACTIONS)) {
      const el = document.createElement('div');
      el.className = 'facCard';
      const art = document.createElement('canvas');
      art.className = 'facArt';
      art.width = 240; art.height = 120;
      const g = art.getContext('2d');
      g.fillStyle = '#10131a'; g.fillRect(0, 0, 240, 120);
      const core = Sprites.core(id);
      g.drawImage(core.canvas, 120 - 52, 60 - 52, 104, 104);
      el.appendChild(art);
      el.insertAdjacentHTML('beforeend', `
        <div class="facName">${f.name}</div>
        <div class="facMotto">“${f.motto}”</div>
        <ul class="facPerks">${f.perks.map(x => `<li>${x}</li>`).join('')}</ul>
        <div class="facStart dim small">Musters: ${f.start.map(u => UNITS[u].name).join(', ')}</div>
      `);
      el.onclick = () => { this.clearSave(); Run.start(id, brutalBox.checked); };
      row.appendChild(el);
    }
    p.querySelector('#fsBack').onclick = () => this.showTitle();
  },

  // =================================================================
  // CODEX — the war, the factions, and every unit's story
  // =================================================================
  showCodex() {
    G.screen = 'codex';
    this.backFn = () => this.showTitle();
    const p = this.overlay(`
      <h2>CODEX</h2>
      <p class="dim small">${LORE.war.kicker}</p>
      ${LORE.war.text.map(t => `<p class="loreText">${t}</p>`).join('')}
      <div class="btnCol" id="cxList" style="margin-top:16px"></div>
      <button id="cxBack" class="ghostBtn" style="margin-top:12px">Back</button>
    `);
    const list = p.querySelector('#cxList');
    const enemyNames = { myriad:'Myriad Swarm', choir:'Ashen Choir', pact:'Obsidian Pact' };
    for (const id of Object.keys(LORE.factions)) {
      const b = document.createElement('button');
      b.textContent = FACTIONS[id] ? FACTIONS[id].name : enemyNames[id];
      b.onclick = () => this.showCodexFaction(id);
      list.appendChild(b);
    }
    p.querySelector('#cxBack').onclick = () => this.showTitle();
  },

  showCodexFaction(facId) {
    G.screen = 'codex';
    this.backFn = () => this.showCodex();
    const f = LORE.factions[facId];
    const fname = FACTIONS[facId] ? FACTIONS[facId].name : { myriad:'Myriad Swarm', choir:'Ashen Choir', pact:'Obsidian Pact' }[facId];
    const units = Object.keys(UNITS).filter(id => UNITS[id].fac === facId);
    const p = this.overlay(`
      <h2>${fname.toUpperCase()}</h2>
      <p class="dim small">${f.kicker}</p>
      ${f.text.map(t => `<p class="loreText">${t}</p>`).join('')}
      <div class="loreUnits" id="cxUnits"></div>
      <button id="cxBack" class="ghostBtn" style="margin-top:14px">Back to codex</button>
    `);
    const wrap = p.querySelector('#cxUnits');
    for (const id of units) {
      const row = document.createElement('div');
      row.className = 'loreUnit';
      const art = document.createElement('canvas');
      art.width = 88; art.height = 70;
      art.getContext('2d').drawImage(Sprites.chipArt(id, 44, 35), 0, 0, 88, 70);
      row.appendChild(art);
      row.insertAdjacentHTML('beforeend',
        `<div><div class="loreUnitName">${UNITS[id].name}</div>
         <div class="loreUnitText">${LORE.units[id] || ''}</div></div>`);
      wrap.appendChild(row);
    }
    p.querySelector('#cxBack').onclick = () => this.showCodex();
  },

  // =================================================================
  // MAP — rendered at device resolution with vector icons
  // =================================================================
  showMap() {
    this.show('map');
    G.screen = 'map';
    this.saveRun();
    const r = G.run, act = ACTS[r.act];
    document.getElementById('mapActName').textContent = act.name;
    document.getElementById('mapBlurb').textContent = act.blurb;
    this.refreshTopBar();

    const cv = this.el.mapCv;
    const cssW = cv.clientWidth || 900, cssH = cv.clientHeight || 520;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = g.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, '#14161d'); bg.addColorStop(1, '#0b0c10');
    g.fillStyle = bg; g.fillRect(0, 0, cssW, cssH);
    const facPal = PAL[act.fac];
    glowDot(g, facPal.glow + '14', cssW * 0.86, cssH * 0.12, 46);

    // layout: floors march west→east, or south→north on portrait screens
    this.mapNodes = [];
    const floors = r.map, n = floors.length;
    const choiceSet = Run.choices();
    const vert = cssH > cssW;
    for (let fl = 0; fl < n; fl++) {
      const row = floors[fl];
      const along = n === 1 ? 0.5 : fl / (n - 1);
      for (let i = 0; i < row.length; i++) {
        const off = i - (row.length - 1) / 2;
        const wob = Math.sin(fl * 3.7 + i * 5.1) * 16;
        const x = vert ? cssW / 2 + off * Math.min(120, cssW * 0.3) + wob
                       : 80 + (cssW - 180) * along;
        const y = vert ? (cssH - 100) - (cssH - 200) * along
                       : cssH / 2 + off * Math.min(140, cssH * 0.28) + wob;
        this.mapNodes.push({ x, y, node: row[i], clickable: choiceSet.includes(row[i]) });
      }
    }
    // edges
    const ex = vert ? 0 : 22, ey = vert ? -22 : 0;
    g.strokeStyle = '#3a3f4d'; g.lineWidth = 1.5; g.setLineDash([3, 6]);
    for (let fl = 0; fl < n - 1; fl++) {
      const cur = this.mapNodes.filter(m => m.node.fl === fl);
      const nxt = this.mapNodes.filter(m => m.node.fl === fl + 1);
      for (const a of cur) for (const bn of nxt) {
        const proj = cur.length === 1 ? (nxt.length - 1) / 2 : a.node.i * (nxt.length - 1) / (cur.length - 1);
        if (Math.abs(bn.node.i - proj) <= 1) {
          g.beginPath(); g.moveTo(a.x + ex, a.y + ey); g.lineTo(bn.x - ex, bn.y - ey); g.stroke();
        }
      }
    }
    g.setLineDash([]);

    const COLORS = {
      battle: '#9aa8bc', elite: '#c86a3a', boss: facPal.glow, event: '#8fd8e8',
      shop: '#b8a8e0', rest: '#8ce6a0', treasure: '#ffd27a',
    };
    for (const m of this.mapNodes) {
      const done = m.node.done, cur = m.node.fl === r.floor && m.node.i === r.pos;
      const col = COLORS[m.node.type];
      const R = m.node.type === 'boss' ? 28 : 20;
      if (m.clickable) glowDot(g, col + '55', m.x, m.y, R * 0.85);
      g.fillStyle = done ? '#1a1d25' : '#252a38';
      g.strokeStyle = m.clickable ? col : done ? '#31374a' : '#4a5164';
      g.lineWidth = m.clickable ? 2.5 : 1.5;
      g.beginPath(); g.arc(m.x, m.y, R, 0, 7); g.fill(); g.stroke();
      this.drawIcon(g, m.node.type, m.x, m.y, R * 0.62, done ? '#4a5264' : col);
      if (cur) { g.strokeStyle = '#e8ecf4'; g.lineWidth = 1.5; g.beginPath(); g.arc(m.x, m.y, R + 5, 0, 7); g.stroke(); }
    }
    // legend (wraps on narrow screens)
    let lx = 22, ly = cssH - 22;
    g.font = '13px Georgia, serif'; g.textBaseline = 'middle';
    const legend = [['battle','battle'],['elite','elite'],['event','event'],['shop','market'],['rest','camp'],['treasure','cache'],['boss','boss']];
    if (vert) {
      const rows = Math.ceil(legend.reduce((w, [, l]) => w + 48 + g.measureText(l).width, 0) / (cssW - 44));
      ly = cssH - 12 - (rows - 1) * 20;
    }
    for (const [type, label] of legend) {
      const w = 30 + g.measureText(label).width + 18;
      if (lx + w > cssW - 12) { lx = 22; ly += 20; }
      this.drawIcon(g, type, lx + 8, ly, 7, '#5a6478');
      g.fillStyle = '#5a6478'; g.textAlign = 'left';
      g.fillText(label, lx + 20, ly + 1);
      lx += w;
    }
  },

  // crisp vector node icons
  drawIcon(g, type, x, y, r, col) {
    g.save();
    g.translate(x, y);
    g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(1.6, r * 0.22); g.lineCap = 'round'; g.lineJoin = 'round';
    switch (type) {
      case 'battle':   // crossed swords
        g.beginPath();
        g.moveTo(-r * 0.8, -r * 0.8); g.lineTo(r * 0.7, r * 0.7);
        g.moveTo(r * 0.8, -r * 0.8); g.lineTo(-r * 0.7, r * 0.7);
        g.moveTo(-r * 0.95, r * 0.45); g.lineTo(-r * 0.45, r * 0.95);
        g.moveTo(r * 0.95, r * 0.45); g.lineTo(r * 0.45, r * 0.95);
        g.stroke();
        break;
      case 'elite': {  // skull
        g.beginPath(); g.arc(0, -r * 0.15, r * 0.75, Math.PI * 0.95, Math.PI * 2.05); g.fill();
        g.fillRect(-r * 0.5, -r * 0.2, r, r * 0.55);
        g.fillStyle = '#1a1d25';
        g.beginPath(); g.arc(-r * 0.32, -r * 0.2, r * 0.2, 0, 7); g.arc(r * 0.32, -r * 0.2, r * 0.2, 0, 7); g.fill();
        g.fillRect(-r * 0.09, 0, r * 0.18, r * 0.3);
        g.fillStyle = col;
        for (let i = -1; i <= 1; i++) g.fillRect(i * r * 0.3 - r * 0.08, r * 0.35, r * 0.16, r * 0.35);
        break;
      }
      case 'boss':     // crown
        g.beginPath();
        g.moveTo(-r * 0.9, r * 0.6); g.lineTo(-r * 0.9, -r * 0.4); g.lineTo(-r * 0.4, r * 0.05);
        g.lineTo(0, -r * 0.75); g.lineTo(r * 0.4, r * 0.05); g.lineTo(r * 0.9, -r * 0.4);
        g.lineTo(r * 0.9, r * 0.6); g.closePath(); g.fill();
        break;
      case 'event':    // quill question
        g.font = `bold ${Math.round(r * 2.1)}px Georgia, serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('?', 0, r * 0.1);
        break;
      case 'shop':     // coin
        g.beginPath(); g.arc(0, 0, r * 0.8, 0, 7); g.stroke();
        g.font = `bold ${Math.round(r * 1.4)}px Georgia, serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('¤', 0, r * 0.05);
        break;
      case 'rest':     // tent
        g.beginPath();
        g.moveTo(0, -r * 0.8); g.lineTo(-r * 0.9, r * 0.7); g.lineTo(-r * 0.15, r * 0.7);
        g.lineTo(0, r * 0.15); g.lineTo(r * 0.15, r * 0.7); g.lineTo(r * 0.9, r * 0.7);
        g.closePath(); g.fill();
        break;
      case 'treasure': // chest
        g.beginPath(); g.roundRect(-r * 0.8, -r * 0.5, r * 1.6, r * 1.1, r * 0.15); g.fill();
        g.strokeStyle = '#1a1d25'; g.lineWidth = Math.max(1.2, r * 0.14);
        g.beginPath(); g.moveTo(-r * 0.8, -r * 0.05); g.lineTo(r * 0.8, -r * 0.05); g.stroke();
        g.fillStyle = '#1a1d25';
        g.beginPath(); g.arc(0, 0.12 * r, r * 0.16, 0, 7); g.fill();
        break;
    }
    g.restore();
  },

  refreshTopBar() {
    const r = G.run;
    document.getElementById('barScrap').textContent = `⚙ ${r.scrap}`;
    document.getElementById('barRoster').textContent = `${r.roster.length} squads`;
    const rl = document.getElementById('barRelics');
    rl.innerHTML = '';
    for (const id of r.relics) {
      const d = document.createElement('span');
      d.className = 'relicGem';
      d.textContent = RELICS[id].name.split(' ').map(w => w[0]).join('').slice(0, 2);
      d.title = `${RELICS[id].name} — ${RELICS[id].desc}`;
      rl.appendChild(d);
    }
  },

  // =================================================================
  // BATTLE — placement & fight
  // =================================================================
  enterBattle(b) {
    this.show('battle');
    const hqEl = document.getElementById('hqName');
    if (hqEl) hqEl.textContent = (FACTIONS[G.run.fac] || FACTIONS.vanguard).hqName.toUpperCase();
    this.syncStance(b);
    Render.prepare(b);
    document.getElementById('encName').textContent =
      (b.enc.boss ? '♛ ' : b.enc.elite ? '☠ ' : '') + coreName(b.fac) + ' — ' + ACTS[G.run.act].name.split('—')[1].trim();
    G.speed = 1; this.syncSpeed();
    document.getElementById('phaseBanner').textContent = 'DEPLOYMENT — place your squads, then sound the advance';
    document.getElementById('btnFight').classList.remove('hidden');
    document.getElementById('speedBox').classList.add('hidden');
    document.getElementById('reserveBox').classList.add('hidden');
    document.getElementById('abilityBox').classList.add('hidden');
    this.refreshTray(b);
    this.refreshBattleHUD(b);
  },

  enterFight(b) {
    document.getElementById('phaseBanner').textContent = '';
    document.getElementById('btnFight').classList.add('hidden');
    document.getElementById('speedBox').classList.remove('hidden');
    document.getElementById('reserveBox').classList.remove('hidden');
    document.getElementById('abilityBox').classList.toggle('hidden', !b.ability);
    this.refreshTray(b);
    this.refreshBattleHUD(b);
    this.acquireWakeLock();
  },

  syncSpeed() {
    for (const s of [0, 1, 2]) document.getElementById('spd' + s).classList.toggle('on', (s === 0 ? 0 : s) === G.speed);
  },

  // ---------------- stance: advance / hold / fallback ----------------
  // A standing order: sets the stance new placements/reserve-drops arrive in,
  // and is also a live command — every squad already on the field switches
  // immediately too.
  STANCES: {
    advance:  { btn: 'stnAdvance',  title: 'Everyone advances and seeks the enemy — new squads too' },
    hold:     { btn: 'stnHold',     title: 'Everyone holds their ground and defends where placed — new squads too' },
    fallback: { btn: 'stnFallback', title: 'Everyone falls back to regroup behind the HQ (and any forward emplacements) — new squads too' },
  },
  setStance(name) {
    const b = G.battle; if (!b || !this.STANCES[name]) return;
    b.stance = name;
    for (const squad of b.squads) if (squad.side === 'player') squad.stance = name;
    this.syncStance(b);
  },
  syncStance(b) {
    for (const [name, s] of Object.entries(this.STANCES)) {
      const btn = document.getElementById(s.btn);
      if (!btn) continue;
      btn.classList.toggle('on', b.stance === name);
      btn.title = s.title;
    }
  },

  refreshBattleHUD(b) {
    const hqF = clamp(b.hq.hp / b.hq.maxhp, 0, 1), coF = clamp(b.core.hp / b.core.maxhp, 0, 1);
    document.getElementById('hqFill').style.width = (hqF * 100) + '%';
    document.getElementById('coreFill').style.width = (coF * 100) + '%';
    document.getElementById('hqNum').textContent = Math.max(0, Math.ceil(b.hq.hp));
    document.getElementById('coreNum').textContent = Math.max(0, Math.ceil(b.core.hp));
    if (b.phase === 'fight') {
      document.getElementById('reserveNum').textContent = b.reserveLeft;
      const cdMax = ECON.reserveCd * b.hooks.reserveCdMult;
      document.getElementById('reserveFill').style.width = ((1 - b.reserveCdT / cdMax) * 100) + '%';
      const rs = document.getElementById('reserveSquads');
      if (rs) {
        const n = this.trayOrder ? this.trayOrder.length : 0;
        rs.textContent = `· ${n} squad${n === 1 ? '' : 's'} ready`;
      }
      if (b.ability) {
        const btn = document.getElementById('btnAbility');
        const ready = b.abilityCharges > 0 && b.abilityCdT <= 0;
        btn.disabled = !ready;
        btn.classList.toggle('armed', b.abilityArmed);
        btn.textContent = `☄ ${b.ability.name.toUpperCase()} ×${b.abilityCharges}`;
        btn.title = b.ability.desc;
        const cdMax = b.ability.cooldown || 1;
        document.getElementById('abilityFill').style.width = (ready ? 100 : (1 - b.abilityCdT / cdMax) * 100) + '%';
      }
    }
  },

  // ---------------- roster tray ----------------
  refreshTray(b) {
    this.el.tray.innerHTML = '';
    this.trayOrder = [];
    G.run.roster.forEach((entry, i) => {
      const wiped = b.wiped.includes(i);
      const deployed = b.deployed[i];
      if (deployed && !wiped) return; // on the field — its card is gone from the tray until it's pulled back
      const el = document.createElement('div');
      el.className = 'chip'
        + (b.selected === i ? ' selected' : '')
        + (wiped ? ' wiped' : '');
      const art = document.createElement('canvas');
      art.className = 'chipArt';
      art.width = 116; art.height = 92;
      art.getContext('2d').drawImage(Sprites.chipArt(entry.id, 58, 46), 0, 0, 116, 92);
      const name = document.createElement('div');
      name.className = 'chipName'; name.textContent = squadName(entry);
      const stats = document.createElement('div');
      stats.className = 'chipStats'; stats.innerHTML = squadStatsHtml(entry);
      el.append(art, name, stats);
      if (!wiped) {
        this.trayOrder.push(i);
        el.dataset.hotkey = this.trayOrder.length <= 9 ? this.trayOrder.length : '';
        el.onclick = () => this.selectTray(b, i);
      }
      this.el.tray.appendChild(el);
    });
    const note = document.createElement('div');
    note.className = 'trayNote dim small';
    const reserveCount = this.trayOrder.length;
    note.innerHTML = b.phase === 'place'
      ? `Pick a squad, then tap your zone to deploy.<br>Undeployed squads become <b>reserves</b> (currently <b>${reserveCount}</b>). Use <b>stance</b> to hold a defensive line or fall back.`
      : `Reserves: pick a squad, then tap your zone to drop it. <b>${reserveCount}</b> left to call in.<br>Use <b>stance</b> to hold, fall back, or advance — it commands everyone already on the field too.`;
    this.el.tray.appendChild(note);
  },

  selectTray(b, i) {
    if (b.deployed[i] || b.wiped.includes(i)) return;
    if (b.phase === 'fight' && (b.reserveLeft <= 0 || b.reserveCdT > 0)) {
      this.hint(b.reserveLeft <= 0 ? 'No reserve drops left' : 'Reserves recharging…');
      return;
    }
    b.abilityArmed = false;
    b.selected = b.selected === i ? null : i;
    this.refreshTray(b);
  },

  // ---------------- active army ability (e.g. Worldbreaker Artillery Support) ----------------
  toggleAbility() {
    const b = G.battle; if (!b || !b.ability) return;
    if (b.abilityCharges <= 0 || b.abilityCdT > 0) return;
    b.selected = null;
    b.abilityArmed = !b.abilityArmed;
    this.refreshBattleHUD(b);
  },

  hint(msg) {
    this.el.hint.textContent = msg;
    this.el.hint.classList.remove('hidden');
    clearTimeout(this.hintT);
    this.hintT = setTimeout(() => this.el.hint.classList.add('hidden'), 2000);
  },

  // =================================================================
  // SQUAD ELEMENT (overlays)
  // =================================================================
  squadEl(entryOrId, opts = {}) {
    const entry = typeof entryOrId === 'string' ? { id: entryOrId, up: !!opts.up } : entryOrId;
    const u = UNITS[entry.id];
    const el = document.createElement('div');
    el.className = `card rar-${SQUADS[entry.id].rar}${entry.up ? ' upgraded' : ''}${opts.small ? ' small' : ''}`;
    const art = document.createElement('canvas');
    art.className = 'cardArt';
    art.width = 256; art.height = 164;
    art.getContext('2d').drawImage(Sprites.chipArt(entry.id, 128, 82), 0, 0, 256, 164);
    const name = document.createElement('div');
    name.className = 'cardName'; name.textContent = squadName(entry);
    const type = document.createElement('div');
    type.className = 'cardType';
    type.textContent = (u.struct ? 'EMPLACEMENT' : u.fly ? 'SQUAD · AIR' : 'SQUAD') + ' · ' + SQUADS[entry.id].rar.toUpperCase();
    const desc = document.createElement('div');
    desc.className = 'cardDesc'; desc.innerHTML = squadStatsHtml(entry);
    el.append(art, name, type, desc);
    if (opts.price != null) {
      const p = document.createElement('div');
      p.className = 'cardPrice'; p.textContent = `⚙ ${opts.price}`;
      el.appendChild(p);
    }
    if (opts.onClick) el.onclick = opts.onClick;
    return el;
  },

  // =================================================================
  // OVERLAYS
  // =================================================================
  overlay(html) {
    this.show('overlay');
    this.el.overlay.innerHTML = `<div class="panel">${html}</div>`;
    return this.el.overlay.querySelector('.panel');
  },

  showReward(rw) {
    G.screen = 'reward';
    const hooks = aggHooks(G.run.relics);
    const p = this.overlay(`
      <h2>${rw.isBoss ? 'THE WAY IS CLEAR' : 'FIELD REPORT — VICTORY'}</h2>
      ${rw.lostNames && rw.lostNames.length ? `<p class="loss small">Lost in the fighting: ${rw.lostNames.join(', ')}</p>` : ''}
      <p class="gold">+${rw.scrap} scrap salvaged</p>
      ${rw.relic ? `<p class="relicGain">Requisition secured: <b>${RELICS[rw.relic].name}</b> — ${RELICS[rw.relic].desc}</p>` : ''}
      <p>Recruit one${hooks.recruitUp ? ' <span class="gold">(drilled — arrives ★)</span>' : ''}:</p>
      <div class="cardRow" id="rwCards"></div>
      <button id="rwSkip" class="ghostBtn">March on without recruiting</button>
    `);
    const row = p.querySelector('#rwCards');
    for (const id of rw.squads) {
      row.appendChild(this.squadEl(id, {
        up: hooks.recruitUp,
        onClick: () => { Run.addSquad(id); this.refreshTopBar(); Run.afterReward(rw.isBoss); },
      }));
    }
    p.querySelector('#rwSkip').onclick = () => Run.afterReward(rw.isBoss);
    this.refreshTopBar();
  },

  showShop(stock) {
    G.screen = 'shop';
    const p = this.overlay(`
      <h2>THE GILDED MARKET</h2>
      <p class="dim">A Syndicate caravan, neutral to a fault. Everything has a price. <span class="gold" id="shopScrap">⚙ ${G.run.scrap}</span></p>
      <div class="cardRow" id="shCards"></div>
      <div id="shRelics" class="relicRow"></div>
      <div class="btnRow">
        <button id="shDrill">Drill a squad — ★ (⚙ ${stock.drillCost})</button>
        <button id="shLeave" class="ghostBtn">Leave</button>
      </div>
    `);
    const upd = () => { p.querySelector('#shopScrap').textContent = `⚙ ${G.run.scrap}`; this.refreshTopBar(); };
    const row = p.querySelector('#shCards');
    for (const item of stock.squads) {
      const el = this.squadEl(item.id, {
        price: item.price,
        onClick: () => {
          if (item.bought || G.run.scrap < item.price) return;
          G.run.scrap -= item.price; item.bought = true;
          Run.addSquad(item.id); el.classList.add('sold'); upd();
        },
      });
      row.appendChild(el);
    }
    const rrow = p.querySelector('#shRelics');
    for (const item of stock.relics) {
      const d = document.createElement('button');
      d.className = 'relicShopItem';
      d.innerHTML = `<b>${RELICS[item.id].name}</b> — ${RELICS[item.id].desc} <span class="gold">⚙ ${item.price}</span>`;
      d.onclick = () => {
        if (d.disabled || G.run.scrap < item.price) return;
        G.run.scrap -= item.price; G.run.relics.push(item.id);
        d.disabled = true; d.classList.add('sold'); upd();
      };
      rrow.appendChild(d);
    }
    p.querySelector('#shDrill').onclick = () => {
      if (G.run.scrap < stock.drillCost) return;
      this.showRoster(G.run.roster, {
        title: 'Drill which squad?', pick: true, filter: e => !e.up,
        onPick: i => { G.run.scrap -= stock.drillCost; Run.upgradeSquadAt(i); this.showShop(stock); },
        onCancel: () => this.showShop(stock),
      });
    };
    p.querySelector('#shLeave').onclick = () => { G.screen = 'map'; this.showMap(); };
  },

  showRest() {
    G.screen = 'rest';
    const p = this.overlay(`
      <h2>FIELD CAMP</h2>
      <p class="dim">The fires are low and the pickets are set. One night's grace — use it well.</p>
      <div class="btnCol">
        <button id="rsDrill">★ Drill a squad (upgrade it)</button>
        <button id="rsRecruit">⛨ Muster local volunteers (gain ${UNITS[FACTIONS[G.run.fac || 'vanguard'].basic].name})</button>
        <button id="rsScavenge">⚙ Scavenge the area (+25 scrap)</button>
      </div>
    `);
    p.querySelector('#rsDrill').onclick = () => this.showRoster(G.run.roster, {
      title: 'Drill which squad?', pick: true, filter: e => !e.up,
      onPick: i => { Run.upgradeSquadAt(i); G.screen = 'map'; this.showMap(); },
      onCancel: () => this.showRest(),
    });
    p.querySelector('#rsRecruit').onclick = () => {
      Run.addSquad(FACTIONS[G.run.fac || 'vanguard'].basic); G.screen = 'map'; this.showMap();
    };
    p.querySelector('#rsScavenge').onclick = () => {
      G.run.scrap += 25; G.screen = 'map'; this.showMap();
    };
  },

  showTreasure(relicId) {
    G.screen = 'treasure';
    const p = this.overlay(`
      <h2>MUNITIONS CACHE</h2>
      ${relicId ? `<p class="relicGain">Inside, packed in straw: <b>${RELICS[relicId].name}</b><br>${RELICS[relicId].desc}</p>`
                : '<p class="dim">Empty. Someone got here first.</p>'}
      <button id="tsGo">Take the road</button>
    `);
    p.querySelector('#tsGo').onclick = () => { G.screen = 'map'; this.showMap(); };
    this.refreshTopBar();
  },

  showEvent(ev) {
    G.screen = 'event';
    const p = this.overlay(`
      <h2>${ev.title}</h2>
      <p class="evText">${ev.text}</p>
      <div class="btnCol" id="evChoices"></div>
    `);
    const col = p.querySelector('#evChoices');
    for (const ch of ev.choices) {
      const btn = document.createElement('button');
      btn.innerHTML = `${ch.label} <span class="dim">— ${ch.note}</span>${ch.cost ? ` <span class="gold">(⚙ ${ch.cost})</span>` : ''}`;
      if (ch.cost && G.run.scrap < ch.cost) btn.disabled = true;
      btn.onclick = () => {
        const out = Run.resolveEventChoice(ev, ch);
        if (out === false) return;
        if (out.includes('__LOSE__')) {
          this.showRoster(G.run.roster, {
            title: 'Trade away which squad?', pick: true,
            onPick: i => {
              const name = squadName(G.run.roster[i]);
              Run.removeSquadAt(i);
              this.eventOutcome(out.filter(x => x !== '__LOSE__').concat(`Lost: ${name}`));
            },
            onCancel: () => this.eventOutcome(out.filter(x => x !== '__LOSE__')),
          });
        } else this.eventOutcome(out);
      };
      col.appendChild(btn);
    }
  },
  eventOutcome(lines) {
    const p = this.overlay(`
      <h2>...</h2>
      <p class="evText">${lines.join('<br>')}</p>
      <button id="evGo">Continue the march</button>
    `);
    p.querySelector('#evGo').onclick = () => { G.screen = 'map'; this.showMap(); };
    this.refreshTopBar();
  },

  showRoster(roster, opts = {}) {
    G.screen = 'roster';
    const p = this.overlay(`
      <h2>${opts.title || 'The Column'} <span class="dim">(${roster.length} squads)</span></h2>
      <div class="cardRow wrap" id="rsCards"></div>
      <button id="rsBack" class="ghostBtn">${opts.pick ? 'Cancel' : 'Back'}</button>
    `);
    const row = p.querySelector('#rsCards');
    roster.forEach((entry, i) => {
      if (opts.filter && !opts.filter(entry)) return;
      const el = this.squadEl(entry, {
        small: true,
        onClick: opts.pick ? () => opts.onPick(i) : null,
      });
      if (opts.pick) el.classList.add('pickable');
      row.appendChild(el);
    });
    p.querySelector('#rsBack').onclick = () => {
      if (opts.onCancel) opts.onCancel();
      else { G.screen = 'map'; this.showMap(); }
    };
  },

  showGameOver(b, lostNames) {
    this.clearSave();
    const r = G.run;
    const p = this.overlay(`
      <h2 class="loss">THE COLUMN IS BROKEN</h2>
      <p class="evText">The line failed in ${ACTS[r.act].name.split('—')[1].trim()}.<br>
      ${r.act === 0 ? 'The flood rolls west, unopposed.' : r.act === 1 ? 'The Choir adds your names to the dirge.' : 'The Altar drinks well tonight.'}</p>
      ${lostNames && lostNames.length ? `<p class="dim small">Fallen squads: ${lostNames.join(', ')}</p>` : ''}
      <p class="dim">Acts cleared: ${r.act} · Squads mustered: ${r.roster.length}</p>
      <div id="unlockList"></div>
      <button id="goTitle">Return to the muster</button>
    `);
    this.fillUnlocks(p.querySelector('#unlockList'));
    p.querySelector('#goTitle').onclick = () => this.showTitle();
  },

  showVictory() {
    this.clearSave();
    const p = this.overlay(`
      <h2 class="win">THE ALTAR FALLS</h2>
      <p class="evText">The Avatar's husk cools among the bloodfields. Behind you, three provinces breathe again.<br>
      The Vanguard marches home — fewer, harder, and singing.</p>
      <div id="unlockList"></div>
      <button id="goTitle">Return to the muster</button>
    `);
    this.fillUnlocks(p.querySelector('#unlockList'));
    p.querySelector('#goTitle').onclick = () => this.showTitle();
  },

  fillUnlocks(el) {
    const news = Meta.lastUnlocks || [];
    if (!news.length) return;
    el.innerHTML = '<p class="gold">UNLOCKED:</p>' +
      news.map(u => `<p class="relicGain"><b>${UNITS[u.squad].name}</b> — ${u.label}</p>`).join('');
    Meta.lastUnlocks = [];
  },
};
