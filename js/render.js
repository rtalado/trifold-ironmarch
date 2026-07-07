// ============================================================================
// TRIFOLD: IRONMARCH — top-down battle renderer
// Canvas backing store at device resolution; a camera (pan + zoom) maps
// world coords (ARENA.w × ARENA.h) onto it.
// ============================================================================
'use strict';

const Render = {
  cv: null, g: null, back: null, dpr: 1,
  mouse: { wx: -999, wy: -999, over: false },
  cam: { x: ARENA.w / 2, y: ARENA.h / 2, z: 1 }, // z=1 → whole field fits
  ZMAX: 4,

  init() {
    this.cv = document.getElementById('battleCanvas');
    this.g = this.cv.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width) return;
    this.dpr = window.devicePixelRatio || 1;
    this.cv.width = Math.round(r.width * this.dpr);
    this.cv.height = Math.round(r.height * this.dpr);
    this.clampCam();
  },

  // world → canvas transform (device px): scale s, offset (ox, oy)
  xform() {
    const fit = Math.min(this.cv.width / ARENA.w, this.cv.height / ARENA.h);
    const s = fit * this.cam.z;
    return { s, ox: this.cv.width / 2 - this.cam.x * s, oy: this.cv.height / 2 - this.cam.y * s };
  },

  toWorld(clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    const k = r.width ? this.cv.width / r.width : 1;
    const { s, ox, oy } = this.xform();
    return {
      wx: ((clientX - r.left) * k - ox) / s,
      wy: ((clientY - r.top) * k - oy) / s,
    };
  },

  clampCam() {
    const { s } = this.xform();
    const vw = this.cv.width / (2 * s), vh = this.cv.height / (2 * s);
    const M = 30; // let the view breathe a little past the field edge
    this.cam.x = vw * 2 >= ARENA.w + M * 2 ? ARENA.w / 2 : clamp(this.cam.x, vw - M, ARENA.w - vw + M);
    this.cam.y = vh * 2 >= ARENA.h + M * 2 ? ARENA.h / 2 : clamp(this.cam.y, vh - M, ARENA.h - vh + M);
  },

  panBy(dxCss, dyCss) {
    const r = this.cv.getBoundingClientRect();
    const k = r.width ? this.cv.width / r.width : 1;
    const { s } = this.xform();
    this.cam.x -= dxCss * k / s;
    this.cam.y -= dyCss * k / s;
    this.clampCam();
  },

  zoomAt(clientX, clientY, factor) {
    const before = this.toWorld(clientX, clientY);
    this.cam.z = clamp(this.cam.z * factor, 1, this.ZMAX);
    const after = this.toWorld(clientX, clientY);
    this.cam.x += before.wx - after.wx;
    this.cam.y += before.wy - after.wy;
    this.clampCam();
  },

  prepare(b) {
    this.back = paintField(b.fac, b.seed, b.feats);
    this.resize();
    if (this.cv.height > this.cv.width) {
      // portrait: open zoomed onto the deployment zone; pan east to scout
      const fit = Math.min(this.cv.width / ARENA.w, this.cv.height / ARENA.h);
      this.cam.z = clamp((this.cv.height / ARENA.h) / fit * 0.95, 1, 2.6);
      this.cam.x = ARENA.deployW * 0.65;
      this.cam.y = ARENA.h / 2;
    } else {
      this.cam.z = 1;
      this.cam.x = ARENA.w / 2;
      this.cam.y = ARENA.h / 2;
    }
    this.clampCam();
  },

  draw(b) {
    const g = this.g, W = ARENA.w, H = ARENA.h, t = b.t;
    const { s, ox, oy } = this.xform();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#07080b';
    g.fillRect(0, 0, this.cv.width, this.cv.height);
    g.setTransform(s, 0, 0, s, ox, oy);
    g.save();
    if (b.shake > 0.01 && Meta.settings.shake) g.translate(rand(-1, 1) * b.shake * 7, rand(-1, 1) * b.shake * 5);
    g.drawImage(this.back, 0, 0);

    const placing = b.phase === 'place' || (b.phase === 'fight' && b.selected != null);

    // ---- deployment zone & grid ----
    if (placing) {
      g.fillStyle = '#6fb3e80d';
      g.fillRect(0, 0, ARENA.deployW, H);
      g.strokeStyle = '#6fb3e833'; g.lineWidth = 1.5; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(ARENA.deployW, 0); g.lineTo(ARENA.deployW, H); g.stroke();
      g.setLineDash([]);
      g.strokeStyle = '#6fb3e80f'; g.lineWidth = 1;
      for (let x = ARENA.cell; x < ARENA.deployW; x += ARENA.cell) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
      }
      for (let y = ARENA.cell; y < H; y += ARENA.cell) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(ARENA.deployW, y); g.stroke();
      }
    }
    // enemy zone hint during placement
    if (b.phase === 'place') {
      g.fillStyle = '#c84a3a08';
      g.fillRect(W - ARENA.enemyW, 0, ARENA.enemyW, H);
    }

    // ---- entities: cores, structures & ground first, flyers on top ----
    const order = [...b.ents].sort((a, z) =>
      (a.core ? 0 : a.struct ? 1 : a.fly ? 3 : 2) - (z.core ? 0 : z.struct ? 1 : z.fly ? 3 : 2) || a.y - z.y);
    for (const e of order) this.drawEnt(g, b, e, t);

    // ---- placement ghost ----
    if (b.selected != null && this.mouse.over) {
      const entry = G.run.roster[b.selected];
      if (entry) {
        const p = snapGrid(this.mouse.wx, this.mouse.wy);
        const ok = validPlace(b, p.x, p.y, entry.id);
        const u = UNITS[entry.id];
        const spr = Sprites.unit(entry.id);
        g.save();
        g.globalAlpha = 0.55;
        g.translate(p.x, p.y);
        g.drawImage(spr.canvas, -spr.half, -spr.half, spr.size, spr.size);
        g.restore();
        g.strokeStyle = ok ? '#8ce6a0aa' : '#e8635aaa'; g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, u.w + 8, 0, 7); g.stroke();
        if (u.rng > 70) {
          g.strokeStyle = ok ? '#8ce6a044' : '#e8635a44'; g.setLineDash([6, 8]);
          g.beginPath(); g.arc(p.x, p.y, u.rng, 0, 7); g.stroke(); g.setLineDash([]);
        }
        g.fillStyle = b.stance === 'hold' ? '#8fd8e8dd' : '#ffd27add';
        g.font = 'bold 11px Georgia, serif'; g.textAlign = 'center';
        g.fillText(b.stance === 'hold' ? 'HOLD' : 'ADVANCE', p.x, p.y - u.w - 14);
        g.textAlign = 'left';
      }
    }

    // ---- army-ability targeting reticle ----
    if (b.abilityArmed && this.mouse.over) {
      const ab = b.ability;
      const mx = clamp(this.mouse.wx, 0, W), my = clamp(this.mouse.wy, 0, H);
      g.strokeStyle = '#e8635acc'; g.lineWidth = 2; g.setLineDash([8, 6]);
      g.beginPath(); g.arc(mx, my, ab.radius, 0, 7); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#e8635a55'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(mx - 14, my); g.lineTo(mx + 14, my);
      g.moveTo(mx, my - 14); g.lineTo(mx, my + 14); g.stroke();
      g.fillStyle = '#e8635add';
      g.font = 'bold 11px Georgia, serif'; g.textAlign = 'center';
      g.fillText('ARTILLERY', mx, my - ab.radius - 10);
      g.textAlign = 'left';
    }

    // ---- fx ----
    for (const f of b.fx) this.drawFx(g, b, f, t);
    g.restore();

    // ---- screen-space warnings (pinned regardless of camera) ----
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (const f of b.fx) {
      if (f.kind !== 'waveWarn') continue;
      const k = clamp(f.ttl / 2.2, 0, 1);
      g.fillStyle = `rgba(200,74,58,${Math.min(1, k) * (0.5 + 0.5 * Math.sin(t * 8))})`;
      g.font = `${Math.round(15 * this.dpr)}px serif`;
      g.textAlign = 'center';
      g.fillText('⟶  ENEMY REINFORCEMENTS FROM THE EAST  ⟵', this.cv.width / 2, 40 * this.dpr);
      g.textAlign = 'left';
    }
  },

  // ---------------------------------------------------------------
  drawEnt(g, b, e, t) {
    if (e.core) {
      const spr = Sprites.core(e.fac);
      const d = spr.R * 2;
      if (!e.dead) {
        g.drawImage(spr.canvas, e.x - spr.R, e.y - spr.R, d, d);
      } else {
        g.save(); g.globalAlpha = 0.4;
        g.drawImage(spr.canvas, e.x - spr.R, e.y - spr.R, d, d);
        g.restore();
        glowDot(g, '#00000088', e.x, e.y, spr.R * 0.5);
      }
      this.hpBar(g, e.x, e.y - spr.R - 10, 84, e, true);
      return;
    }
    const spr = Sprites.unit(e.unitId);
    const VIS = 1.3;                 // draw sprites chunkier than their hitbox
    // shadow
    const sh = e.fly ? 14 : 3;
    g.fillStyle = e.fly ? '#00000038' : '#00000055';
    g.beginPath(); g.ellipse(e.x + sh * 0.6, e.y + sh, e.w * 1.05 * VIS, e.w * 0.8 * VIS, 0, 0, 7); g.fill();

    g.save();
    g.translate(e.x, e.y + (e.fly ? -6 - Math.sin(t * 2.6 + e.id) * 3 : 0));
    g.rotate(e.angle);
    if (e.attackT && t - e.attackT < 0.1) {
      const k = 1 - (t - e.attackT) / 0.1;
      g.translate((e.rng > 70 ? -2.5 : 3) * k, 0);
    }
    g.drawImage(spr.canvas, -spr.half * VIS, -spr.half * VIS, spr.size * VIS, spr.size * VIS);
    g.restore();

    if (e.frenzy > t) glowDot(g, '#ff4a3455', e.x, e.y, e.w * 0.6);
    if (e.slow && t < e.slow.until) glowDot(g, '#8fd8e83c', e.x, e.y, e.w * 0.5);
    if (e.boss) {
      g.strokeStyle = PAL[e.fac].glow + '66'; g.lineWidth = 2;
      g.beginPath(); g.arc(e.x, e.y, e.w + 9 + Math.sin(t * 2) * 2, 0, 7); g.stroke();
    }
    if (e.side === 'player' && e.squad && e.squad.hold) {
      g.strokeStyle = '#8fd8e877'; g.lineWidth = 1; g.setLineDash([3, 3]);
      g.beginPath(); g.arc(e.x, e.y, e.w + 5, 0, 7); g.stroke(); g.setLineDash([]);
    }
    if (e.hitT && t - e.hitT < 0.1) glowDot(g, '#ffffff44', e.x, e.y, e.w * 0.55);
    if (e.hp < e.maxhp) this.hpBar(g, e.x, e.y - e.w - 10, Math.max(20, e.w * 2.1), e, false);
  },

  hpBar(g, x, y, w, e, big) {
    const h = big ? 5 : 3;
    const frac = clamp(e.hp / e.maxhp, 0, 1);
    g.fillStyle = '#000000aa'; g.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
    g.fillStyle = e.side === 'player' ? (frac > 0.35 ? '#6fb3e8' : '#e8c86f') : (frac > 0.35 ? '#c84a3a' : '#e88a3a');
    g.fillRect(x - w / 2, y, w * frac, h);
  },

  // ---------------------------------------------------------------
  drawFx(g, b, f, t) {
    const a = clamp(f.ttl / 0.5, 0, 1);
    switch (f.kind) {
      case 'tracer': {
        const col = PAL[f.fac] ? PAL[f.fac].glow : '#ffd27a';
        g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = f.heavy ? 2.5 : 1.3;
        g.shadowColor = col; g.shadowBlur = 6;
        g.beginPath(); g.moveTo(f.x0, f.y0); g.lineTo(f.x1, f.y1); g.stroke();
        g.shadowBlur = 0; g.globalAlpha = 1;
        break;
      }
      case 'slash': {
        g.strokeStyle = '#e8e8f4'; g.globalAlpha = a; g.lineWidth = 2;
        const ang = Math.atan2(f.y1 - f.y0, f.x1 - f.x0);
        g.beginPath(); g.arc(f.x1, f.y1, 9, ang - 0.9 + (1 - a) * 1.4, ang + 0.9 + (1 - a) * 1.4); g.stroke();
        g.globalAlpha = 1;
        break;
      }
      case 'burst': {
        const col = PAL[f.fac] ? PAL[f.fac].glow : '#ffd27a';
        g.strokeStyle = col; g.globalAlpha = a * 0.8; g.lineWidth = 2;
        g.beginPath(); g.arc(f.x, f.y, f.r * (1 - a * 0.6), 0, 7); g.stroke();
        glowDot(g, col + '44', f.x, f.y, f.r * 0.2 * a);
        g.globalAlpha = 1;
        break;
      }
      case 'death': case 'bigDeath': {
        const col = PAL[f.fac] ? PAL[f.fac].glow : '#c8c8d4';
        const r = (f.kind === 'bigDeath' ? f.w * 1.5 : f.w) * (1.7 - a);
        glowDot(g, col + '44', f.x, f.y, r * 0.5);
        g.fillStyle = `rgba(16,14,20,${a * 0.55})`;
        g.beginPath(); g.arc(f.x, f.y, r, 0, 7); g.fill();
        break;
      }
      case 'healTick': {
        g.strokeStyle = '#8ce6a0'; g.globalAlpha = a; g.lineWidth = 1.5;
        const yy = f.y - (1 - a) * 12;
        g.beginPath(); g.moveTo(f.x, yy - 3); g.lineTo(f.x, yy + 3); g.moveTo(f.x - 3, yy); g.lineTo(f.x + 3, yy); g.stroke();
        g.globalAlpha = 1;
        break;
      }
      case 'deploy': {
        g.strokeStyle = `rgba(127,163,200,${a})`; g.lineWidth = 2;
        g.beginPath(); g.arc(f.x, f.y, 26 * (1 - a) + 5, 0, 7); g.stroke();
        break;
      }
      case 'dropPods': {
        const k = 1 - clamp(f.ttl / 0.9, 0, 1);
        g.strokeStyle = `rgba(200,220,240,${1 - k})`; g.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const px = f.x + (i - 1) * 20;
          g.beginPath(); g.moveTo(px + 30 * (1 - k), f.y - 220 * (1 - k) - 20);
          g.lineTo(px + 34 * (1 - k), f.y - 220 * (1 - k)); g.stroke();
        }
        glowDot(g, `rgba(255,210,122,${1 - k})`, f.x, f.y, 12 * k + 3);
        break;
      }
      case 'spawnFx': {
        glowDot(g, PAL[f.fac].glow + '66', f.x, f.y, 8 * (1 - a) + 3);
        break;
      }
      case 'raise': {
        g.fillStyle = `rgba(143,216,232,${a * 0.7})`;
        g.beginPath(); g.arc(f.x, f.y - (1 - a) * 26, 4, 0, 7); g.fill();
        break;
      }
      case 'miss': {
        g.fillStyle = `rgba(220,225,235,${a})`; g.font = '11px serif';
        g.fillText('—', f.x - 3, f.y);
        break;
      }
      case 'lastStand': {
        const k = clamp(f.ttl / 1.2, 0, 1);
        glowDot(g, `rgba(255,210,122,${k})`, f.x, f.y, 16 * (1 - k) + 6);
        g.strokeStyle = `rgba(255,210,122,${k})`; g.lineWidth = 2;
        g.beginPath(); g.arc(f.x, f.y, 30 * (1 - k) + 8, 0, 7); g.stroke();
        break;
      }
      case 'scrapPop': {
        const k = clamp(f.ttl, 0, 1);
        g.fillStyle = `rgba(216,180,90,${k})`; g.font = 'bold 13px serif'; g.textAlign = 'center';
        g.fillText(`+${f.amt}⚙`, f.x, f.y - (1 - k) * 26 - 8);
        g.textAlign = 'left';
        break;
      }
      case 'barrageMark': {
        g.strokeStyle = '#e8635a99'; g.lineWidth = 2; g.setLineDash([10, 7]);
        g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.stroke(); g.setLineDash([]);
        glowDot(g, `rgba(232,99,90,${0.15 + 0.15 * Math.sin(t * 12)})`, f.x, f.y, f.r * 0.15);
        break;
      }
      case 'barrageImpact': {
        const k = 1 - clamp(f.ttl / 0.6, 0, 1);
        glowDot(g, `rgba(255,180,90,${(1 - k) * 0.8})`, f.x, f.y, f.r * (0.3 + k * 0.7));
        g.strokeStyle = `rgba(255,210,122,${(1 - k) * 0.9})`; g.lineWidth = 3;
        g.beginPath(); g.arc(f.x, f.y, f.r * k, 0, 7); g.stroke();
        g.fillStyle = `rgba(20,14,10,${(1 - k) * 0.5})`;
        g.beginPath(); g.arc(f.x, f.y, f.r * 0.6 * k, 0, 7); g.fill();
        break;
      }
      case 'waveWarn': break; // drawn in the screen-space pass
    }
  },
};
