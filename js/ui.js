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

    const toWorld = e => {
      const rect = cv.getBoundingClientRect();
      const scale = Math.min(rect.width / ARENA.w, rect.height / ARENA.h);
      const offX = (rect.width - ARENA.w * scale) / 2;
      const offY = (rect.height - ARENA.h * scale) / 2;
      return {
        wx: (e.clientX - rect.left - offX) / scale,
        wy: (e.clientY - rect.top - offY) / scale,
      };
    };
    // Pointer input. Mouse: hover ghost, click places, right-click unplaces.
    // Touch: drag shows the ghost, release places, long-press unplaces/cancels.
    const LP_MS = 450, LP_SLOP = 14;
    let lpTimer = null, lpFired = false, touchDown = false, downX = 0, downY = 0, lastTouchT = -9999;
    const stopLP = () => { clearTimeout(lpTimer); lpTimer = null; };
    const pressField = (b, wx, wy) => {
      if (b.selected != null) { b.selected = null; this.refreshTray(b); return; }
      fieldUnplace(b, wx, wy);
    };

    cv.addEventListener('pointermove', e => {
      const p = toWorld(e);
      Render.mouse.wx = p.wx; Render.mouse.wy = p.wy;
      Render.mouse.over = p.wx > -40 && p.wx < ARENA.w + 40 && p.wy > -40 && p.wy < ARENA.h + 40;
      if (lpTimer && Math.hypot(e.clientX - downX, e.clientY - downY) > LP_SLOP) stopLP();
    });
    cv.addEventListener('pointerleave', () => { Render.mouse.over = false; });
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      touchDown = true; lpFired = false;
      downX = e.clientX; downY = e.clientY;
      const p = toWorld(e);
      Render.mouse.wx = p.wx; Render.mouse.wy = p.wy; Render.mouse.over = true;
      stopLP();
      lpTimer = setTimeout(() => {
        lpTimer = null; lpFired = true;
        const b = G.battle; if (!b) return;
        if (navigator.vibrate) navigator.vibrate(25);
        pressField(b, p.wx, p.wy);
      }, LP_MS);
    });
    cv.addEventListener('pointerup', e => {
      if (e.pointerType === 'mouse') return;
      touchDown = false; lastTouchT = performance.now();
      stopLP();
      const b = G.battle;
      if (!lpFired && b) { const p = toWorld(e); fieldClick(b, p.wx, p.wy); }
      Render.mouse.over = false;
    });
    cv.addEventListener('pointercancel', () => { touchDown = false; stopLP(); Render.mouse.over = false; });
    cv.addEventListener('click', e => {
      if (performance.now() - lastTouchT < 600) return; // synthesized after touch tap
      const b = G.battle; if (!b) return;
      const p = toWorld(e);
      fieldClick(b, p.wx, p.wy);
    });
    cv.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (touchDown || lpFired) return; // long-press already handled it
      const b = G.battle; if (!b) return;
      const p = toWorld(e);
      pressField(b, p.wx, p.wy);
    });
    document.addEventListener('keydown', e => {
      const b = G.battle;
      if (!b) return;
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

    document.getElementById('btnStart').onclick = () => { this.clearSave(); Run.start(); };
    document.getElementById('btnResume').onclick = () => this.resumeRun();
    document.getElementById('btnRosterMap').onclick = () => this.showRoster(G.run.roster, { title: 'The Column' });
    document.getElementById('btnFight').onclick = () => { const b = G.battle; if (b) beginFight(b); };
    for (const s of [0, 1, 2]) {
      document.getElementById('spd' + s).onclick = () => { G.speed = s === 0 ? 0 : s; this.syncSpeed(); };
    }
  },

  show(name) {
    for (const id of ['title','map','battle','overlay']) this.el[id].classList.toggle('hidden', id !== name);
  },

  // =================================================================
  // TITLE
  // =================================================================
  showTitle() {
    G.screen = 'title'; this.show('title');
    const d = Meta.data;
    document.getElementById('titleStats').textContent =
      d.runs === 0 ? 'The column awaits its first order.' :
      `Marches: ${d.runs} · Victories: ${d.wins} · Squads unlocked: ${d.unlocked.length}/${META_UNLOCKS.reduce((n, u) => n + u.squads.length, 0)}`;
    document.getElementById('btnResume').classList.toggle('hidden', !localStorage.getItem('ironmarch_run_v2'));
  },

  saveRun() { try { localStorage.setItem('ironmarch_run_v2', JSON.stringify(G.run)); } catch (e) {} },
  clearSave() { localStorage.removeItem('ironmarch_run_v2'); },
  resumeRun() {
    try {
      const r = JSON.parse(localStorage.getItem('ironmarch_run_v2'));
      if (r && r.map && r.roster) { G.run = r; G.screen = 'map'; this.showMap(); return; }
    } catch (e) {}
    Run.start();
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
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = g.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, '#14161d'); bg.addColorStop(1, '#0b0c10');
    g.fillStyle = bg; g.fillRect(0, 0, cssW, cssH);
    const facPal = PAL[act.fac];
    glowDot(g, facPal.glow + '14', cssW * 0.86, cssH * 0.12, 46);

    // layout
    this.mapNodes = [];
    const floors = r.map, n = floors.length;
    const choiceSet = Run.choices();
    for (let fl = 0; fl < n; fl++) {
      const row = floors[fl];
      const x = 80 + (cssW - 180) * (fl / (n - 1));
      for (let i = 0; i < row.length; i++) {
        const y = cssH / 2 + (i - (row.length - 1) / 2) * Math.min(140, cssH * 0.28) + Math.sin(fl * 3.7 + i * 5.1) * 16;
        this.mapNodes.push({ x, y, node: row[i], clickable: choiceSet.includes(row[i]) });
      }
    }
    // edges
    g.strokeStyle = '#3a3f4d'; g.lineWidth = 1.5; g.setLineDash([3, 6]);
    for (let fl = 0; fl < n - 1; fl++) {
      const cur = this.mapNodes.filter(m => m.node.fl === fl);
      const nxt = this.mapNodes.filter(m => m.node.fl === fl + 1);
      for (const a of cur) for (const bn of nxt) {
        const proj = cur.length === 1 ? (nxt.length - 1) / 2 : a.node.i * (nxt.length - 1) / (cur.length - 1);
        if (Math.abs(bn.node.i - proj) <= 1) {
          g.beginPath(); g.moveTo(a.x + 22, a.y); g.lineTo(bn.x - 22, bn.y); g.stroke();
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
    // legend
    let lx = 22;
    g.font = '13px Georgia, serif'; g.textBaseline = 'middle';
    for (const [type, label] of [['battle','battle'],['elite','elite'],['event','event'],['shop','market'],['rest','camp'],['treasure','cache'],['boss','boss']]) {
      this.drawIcon(g, type, lx + 8, cssH - 22, 7, '#5a6478');
      g.fillStyle = '#5a6478'; g.textAlign = 'left';
      g.fillText(label, lx + 20, cssH - 21);
      lx += 30 + g.measureText(label).width + 18;
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
    Render.prepare(b);
    document.getElementById('encName').textContent =
      (b.enc.boss ? '♛ ' : b.enc.elite ? '☠ ' : '') + coreName(b.fac) + ' — ' + ACTS[G.run.act].name.split('—')[1].trim();
    G.speed = 1; this.syncSpeed();
    document.getElementById('phaseBanner').textContent = 'DEPLOYMENT — place your squads, then sound the advance';
    document.getElementById('btnFight').classList.remove('hidden');
    document.getElementById('speedBox').classList.add('hidden');
    document.getElementById('reserveBox').classList.add('hidden');
    this.refreshTray(b);
    this.refreshBattleHUD(b);
  },

  enterFight(b) {
    document.getElementById('phaseBanner').textContent = '';
    document.getElementById('btnFight').classList.add('hidden');
    document.getElementById('speedBox').classList.remove('hidden');
    document.getElementById('reserveBox').classList.remove('hidden');
    this.refreshTray(b);
  },

  syncSpeed() {
    for (const s of [0, 1, 2]) document.getElementById('spd' + s).classList.toggle('on', (s === 0 ? 0 : s) === G.speed);
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
    }
  },

  // ---------------- roster tray ----------------
  refreshTray(b) {
    this.el.tray.innerHTML = '';
    this.trayOrder = [];
    G.run.roster.forEach((entry, i) => {
      const wiped = b.wiped.includes(i);
      const deployed = b.deployed[i];
      const el = document.createElement('div');
      el.className = 'chip'
        + (b.selected === i ? ' selected' : '')
        + (deployed ? ' deployed' : '')
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
      if (!deployed && !wiped) {
        this.trayOrder.push(i);
        el.dataset.hotkey = this.trayOrder.length <= 9 ? this.trayOrder.length : '';
        el.onclick = () => this.selectTray(b, i);
      } else if (deployed && b.phase === 'place') {
        el.title = 'Right-click (or long-press) it on the field to take it back';
      }
      this.el.tray.appendChild(el);
    });
    const note = document.createElement('div');
    note.className = 'trayNote dim small';
    note.innerHTML = b.phase === 'place'
      ? 'Pick a squad, then tap your zone to deploy.<br>Undeployed squads become <b>reserves</b>.'
      : `Reserves: pick a squad, then tap your zone to drop it.`;
    this.el.tray.appendChild(note);
  },

  selectTray(b, i) {
    if (b.deployed[i] || b.wiped.includes(i)) return;
    if (b.phase === 'fight' && (b.reserveLeft <= 0 || b.reserveCdT > 0)) {
      this.hint(b.reserveLeft <= 0 ? 'No reserve drops left' : 'Reserves recharging…');
      return;
    }
    b.selected = b.selected === i ? null : i;
    this.refreshTray(b);
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
        <button id="rsRecruit">⛨ Muster local volunteers (gain a Marine Squad)</button>
        <button id="rsScavenge">⚙ Scavenge the area (+25 scrap)</button>
      </div>
    `);
    p.querySelector('#rsDrill').onclick = () => this.showRoster(G.run.roster, {
      title: 'Drill which squad?', pick: true, filter: e => !e.up,
      onPick: i => { Run.upgradeSquadAt(i); G.screen = 'map'; this.showMap(); },
      onCancel: () => this.showRest(),
    });
    p.querySelector('#rsRecruit').onclick = () => {
      Run.addSquad('marine'); G.screen = 'map'; this.showMap();
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
