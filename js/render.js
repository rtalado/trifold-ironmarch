// ============================================================================
// TRIFOLD: IRONMARCH — top-down battle renderer
// Logical resolution ARENA.w × ARENA.h, scaled by CSS.
// ============================================================================
'use strict';

const Render = {
  cv: null, g: null, back: null,
  mouse: { wx: -999, wy: -999, over: false },

  init() {
    this.cv = document.getElementById('battleCanvas');
    this.cv.width = ARENA.w; this.cv.height = ARENA.h;
    this.g = this.cv.getContext('2d');
  },

  prepare(b) {
    this.back = paintField(b.fac, b.seed, b.feats);
  },

  draw(b) {
    const g = this.g, W = ARENA.w, H = ARENA.h, t = b.t;
    g.save();
    if (b.shake > 0.01) g.translate(rand(-1, 1) * b.shake * 7, rand(-1, 1) * b.shake * 5);
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
      }
    }

    // ---- fx ----
    for (const f of b.fx) this.drawFx(g, b, f, t);
    g.restore();
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
      case 'waveWarn': {
        const k = clamp(f.ttl / 2.2, 0, 1);
        g.fillStyle = `rgba(200,74,58,${Math.min(1, k) * (0.5 + 0.5 * Math.sin(t * 8))})`;
        g.font = '20px serif'; g.textAlign = 'center';
        g.fillText('⟶  ENEMY REINFORCEMENTS FROM THE EAST  ⟵', ARENA.w / 2, 40);
        g.textAlign = 'left';
        break;
      }
    }
  },
};
