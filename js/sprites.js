// ============================================================================
// TRIFOLD: IRONMARCH — the paintbox (top-down)
// Every sprite faces +x and is rotated at draw time. Painted at load, no files.
// ============================================================================
'use strict';

const PAL = {
  vanguard: { base:'#242c3a', mid:'#3d4f66', hi:'#7396bb', rim:'#d8ecff', glow:'#ffd27a', accent:'#a87c2a', dark:'#141922' },
  syndicate:{ base:'#2e2517', mid:'#4d3d22', hi:'#b08c3c', rim:'#ffe9b0', glow:'#ffcf5e', accent:'#6e2a2a', dark:'#191307' },
  warden:   { base:'#272d33', mid:'#3e4a54', hi:'#8098aa', rim:'#e2eef6', glow:'#6fd8c0', accent:'#c0a480', dark:'#15191d' },
  myriad:   { base:'#170f22', mid:'#3a1a52', hi:'#8f3fd1', rim:'#e9d9ff', glow:'#c24bff', accent:'#4a2a63', dark:'#0a0614' },
  choir:    { base:'#262630', mid:'#3f3f52', hi:'#9191b0', rim:'#eeeeff', glow:'#8fd8e8', accent:'#cfc8b0', dark:'#14141c' },
  pact:     { base:'#2a181b', mid:'#48232a', hi:'#a34440', rim:'#ffb09a', glow:'#ff4a34', accent:'#d8c4a8', dark:'#180c0f' },
};

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w); c.height = Math.ceil(h);
  return c;
}
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

function softShape(g, fill, blur, path) {
  g.save();
  if (blur) { g.shadowColor = fill; g.shadowBlur = blur; }
  g.fillStyle = fill;
  g.beginPath(); path(g); g.fill();
  g.restore();
}
function blob(g, fill, x, y, rx, ry, rot, blur) {
  softShape(g, fill, blur || 0, gg => gg.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2));
}
function rimStroke(g, color, blur, path) {
  g.save();
  g.shadowColor = color; g.shadowBlur = blur;
  g.strokeStyle = color; g.lineWidth = 1.2; g.lineCap = 'round';
  g.beginPath(); path(g); g.stroke();
  g.restore();
}
function glowDot(g, color, x, y, r) {
  const mid = (color[0] === '#' && color.length === 7) ? color + 'aa' : color;
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 3);
  gr.addColorStop(0, color); gr.addColorStop(0.35, mid); gr.addColorStop(1, 'transparent');
  g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
}
function lgrad(g, x0, y0, x1, y1, c0, c1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  return gr;
}

// ===========================================================================
// TOP-DOWN BODY PAINTERS — all face +x, origin at unit centre.
// The light comes from the top-left; rim on that side, shade lower-right.
// ===========================================================================

function tdInfantry(g, p, o) {
  // o: {r, weapon:'rifle'|'long'|'launcher'|'none', pack, cloak, dagger, tattered}
  const r = o.r;
  if (o.cloak) blob(g, p.dark, -r * 0.5, 0, r * 0.9, r * 0.75, 0);
  // ragged burial wrappings streaming off the frame (choir husks)
  if (o.tattered) {
    g.strokeStyle = p.mid + 'aa'; g.lineWidth = r * 0.09; g.lineCap = 'round';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(-r * 0.5, s * r * 0.28);
      g.quadraticCurveTo(-r * 0.95, s * r * 0.5, -r * 1.2, s * r * 0.3); g.stroke();
      g.beginPath(); g.moveTo(-r * 0.35, s * r * 0.42);
      g.quadraticCurveTo(-r * 0.7, s * r * 0.68, -r * 0.85, s * r * 0.48); g.stroke();
    }
  }
  // shoulders
  blob(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, 0, r * 0.95, r * 0.8, 0);
  // backpack
  if (o.pack) blob(g, p.base, -r * 0.7, 0, r * 0.4, r * 0.5, 0);
  // arms toward weapon
  g.strokeStyle = p.base; g.lineWidth = r * 0.35; g.lineCap = 'round';
  g.beginPath(); g.moveTo(r * 0.1, -r * 0.5); g.lineTo(r * 0.75, -r * 0.2); g.stroke();
  // weapon
  if (o.weapon !== 'none') {
    const len = o.weapon === 'long' ? r * 2.6 : o.weapon === 'launcher' ? r * 1.7 : r * 2.0;
    g.strokeStyle = p.dark; g.lineWidth = o.weapon === 'launcher' ? r * 0.42 : r * 0.22;
    g.beginPath(); g.moveTo(r * 0.2, -r * 0.25); g.lineTo(len, -r * 0.25); g.stroke();
  }
  // crude ritual cleaver (pact thralls — unarmed of firearm, not of blade)
  if (o.dagger) {
    g.strokeStyle = p.accent; g.lineWidth = r * 0.16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(r * 0.3, -r * 0.28); g.lineTo(r * 0.95, -r * 0.42); g.stroke();
    glowDot(g, p.glow, r * 0.9, -r * 0.42, r * 0.06);
  }
  // helmet
  blob(g, p.mid, r * 0.15, 0, r * 0.55, r * 0.55, 0);
  blob(g, p.hi + '55', r * 0.0, -r * 0.15, r * 0.4, r * 0.3, 0);
  rimStroke(g, p.rim, 2, gg => gg.arc(r * 0.15, 0, r * 0.52, -2.6, -0.6));
  if (o.medic) {
    g.strokeStyle = p.rim; g.lineWidth = r * 0.22;
    g.beginPath(); g.moveTo(-r * 0.7, -r * 0.25); g.lineTo(-r * 0.7, r * 0.25);
    g.moveTo(-r * 0.95, 0); g.lineTo(-r * 0.45, 0); g.stroke();
  }
  glowDot(g, p.glow, r * 0.55, 0, r * 0.14);
}

function tdVehicle(g, p, o) {
  // o: {L, W, barrel, twin, big, turretBack, spade}
  const L = o.L, W = o.W;
  // tracks
  blob(g, p.dark, 0, -W * 0.42, L * 0.5, W * 0.16, 0);
  blob(g, p.dark, 0, W * 0.42, L * 0.5, W * 0.16, 0);
  // hull
  softShape(g, lgrad(g, -L/2, -W/2, L/2, W/2, p.mid, p.base), 0, gg => {
    gg.moveTo(-L * 0.48, -W * 0.32); gg.lineTo(L * 0.34, -W * 0.34); gg.lineTo(L * 0.5, 0);
    gg.lineTo(L * 0.34, W * 0.34); gg.lineTo(-L * 0.48, W * 0.32); gg.closePath(); });
  // recoil spades (artillery)
  if (o.spade) {
    g.strokeStyle = p.dark; g.lineWidth = W * 0.14;
    g.beginPath(); g.moveTo(-L * 0.45, -W * 0.2); g.lineTo(-L * 0.72, -W * 0.42);
    g.moveTo(-L * 0.45, W * 0.2); g.lineTo(-L * 0.72, W * 0.42); g.stroke();
  }
  // turret + barrel(s)
  const tx = o.turretBack ? -L * 0.12 : L * 0.02;
  const n = o.twin ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const by = (i - (n - 1) / 2) * W * 0.22;
    g.strokeStyle = p.base; g.lineWidth = W * (o.big ? 0.17 : 0.12); g.lineCap = 'round';
    g.beginPath(); g.moveTo(tx, by); g.lineTo(tx + (o.barrel || L * 0.62), by); g.stroke();
  }
  blob(g, p.mid, tx, 0, W * 0.34, W * 0.3, 0);
  blob(g, p.hi + '44', tx - W * 0.08, -W * 0.08, W * 0.2, W * 0.14, 0);
  rimStroke(g, p.rim, 2, gg => { gg.moveTo(-L * 0.46, -W * 0.3); gg.lineTo(L * 0.33, -W * 0.32); });
  glowDot(g, p.glow, -L * 0.38, 0, W * 0.1);
}

function tdWalker(g, p, o) {
  const r = o.r;
  // leg pods
  for (const s of [-1, 1]) {
    blob(g, p.dark, -r * 0.15, s * r * 0.72, r * 0.42, r * 0.3, s * 0.4);
    blob(g, p.base, r * 0.3, s * r * 0.6, r * 0.3, r * 0.22, s * 0.3);
  }
  // body
  blob(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, 0, r * 0.72, r * 0.62, 0);
  // guns forward
  g.strokeStyle = p.dark; g.lineWidth = r * 0.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(r * 0.3, -r * 0.35); g.lineTo(r * 1.35, -r * 0.3);
  g.moveTo(r * 0.3, r * 0.35); g.lineTo(r * 1.35, r * 0.3); g.stroke();
  blob(g, p.hi + '55', -r * 0.12, -r * 0.15, r * 0.3, r * 0.2, 0);
  rimStroke(g, p.rim, 2, gg => gg.arc(0, 0, r * 0.66, -2.8, -0.4));
  glowDot(g, p.glow, r * 0.4, 0, r * 0.16);
}

function tdFlyer(g, p, o) {
  const r = o.r;
  if (o.rotor) {
    // gunship: fuselage + rotor disc
    blob(g, p.hi + '22', 0, 0, r * 1.35, r * 1.35, 0);
    g.strokeStyle = p.hi + '66'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(0, 0, r * 1.3, 0, 7); g.stroke();
    softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, gg => {
      gg.moveTo(-r * 0.9, 0); gg.quadraticCurveTo(-r * 0.2, -r * 0.42, r * 0.95, -r * 0.1);
      gg.quadraticCurveTo(r * 0.6, r * 0.3, -r * 0.6, r * 0.34); gg.closePath(); });
    g.strokeStyle = p.dark; g.lineWidth = r * 0.16;
    g.beginPath(); g.moveTo(r * 0.3, r * 0.28); g.lineTo(r * 1.1, r * 0.26); g.stroke();
  } else {
    // bomber: swept wings
    softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, gg => {
      gg.moveTo(r * 1.2, 0); gg.lineTo(-r * 0.2, -r * 1.1); gg.lineTo(-r * 0.55, -r * 0.85);
      gg.lineTo(-r * 0.25, -r * 0.12); gg.lineTo(-r * 0.9, -r * 0.08);
      gg.lineTo(-r * 0.9, r * 0.08); gg.lineTo(-r * 0.25, r * 0.12);
      gg.lineTo(-r * 0.55, r * 0.85); gg.lineTo(-r * 0.2, r * 1.1); gg.closePath(); });
    blob(g, p.hi + '44', r * 0.3, 0, r * 0.34, r * 0.14, 0);
  }
  rimStroke(g, p.rim, 2, gg => { gg.moveTo(-r * 0.2, -r * (o.rotor ? 0.4 : 1.05)); gg.lineTo(r * (o.rotor ? 0.9 : 1.15), 0); });
  glowDot(g, p.glow, r * 0.75, 0, r * 0.15);
}

function tdBeast(g, p, o) {
  // MYRIAD ONLY — purple chitin body plan. o: {r, spikes, tail, eyes, maw, legs, antennae, plates, sacs, crown}
  const r = o.r;
  if (o.tail) {
    g.strokeStyle = p.base; g.lineWidth = r * 0.3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.7, 0); g.quadraticCurveTo(-r * 1.5, r * 0.4, -r * 1.9, -r * 0.15); g.stroke();
  }
  // legs
  g.strokeStyle = p.base; g.lineWidth = r * 0.22; g.lineCap = 'round';
  for (const s of [-1, 1]) for (let i = 0; i < (o.legs || 3); i++) {
    const lx = -r * 0.5 + i * r * 0.5;
    g.beginPath(); g.moveTo(lx, s * r * 0.4); g.lineTo(lx + r * 0.18, s * r * 0.95); g.stroke();
  }
  // trailing glow-egg sacs (broodmother)
  if (o.sacs) {
    for (let i = 0; i < 3; i++) {
      const sx = -r * 0.9 - i * r * 0.55, sy = ((i % 2) - 0.5) * r * 0.5;
      blob(g, p.accent + '99', sx, sy, r * 0.28, r * 0.24, 0);
      glowDot(g, p.glow, sx, sy, r * 0.09);
    }
  }
  // body: teardrop toward head
  softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, gg => {
    gg.moveTo(r * 1.0, 0);
    gg.quadraticCurveTo(r * 0.5, -r * 0.72, -r * 0.4, -r * 0.55);
    gg.quadraticCurveTo(-r * 0.95, 0, -r * 0.4, r * 0.55);
    gg.quadraticCurveTo(r * 0.5, r * 0.72, r * 1.0, 0); gg.closePath(); });
  // heavy plating (broodtyrant, hive regent)
  if (o.plates) {
    blob(g, p.dark + '55', -r * 0.1, 0, r * 0.6, r * 0.45, 0);
    blob(g, p.hi + '22', r * 0.2, -r * 0.2, r * 0.35, r * 0.22, 0);
  }
  // chitin seam lines across the carapace
  g.strokeStyle = p.dark + 'aa'; g.lineWidth = r * 0.045;
  for (let i = 0; i < 3; i++) {
    const sx = -r * 0.3 + i * r * 0.35;
    g.beginPath(); g.moveTo(sx, -r * 0.5); g.quadraticCurveTo(sx + r * 0.05, 0, sx, r * 0.5); g.stroke();
  }
  // spine spikes
  if (o.spikes) {
    for (let i = 0; i < o.spikes; i++) {
      const sx = -r * 0.55 + (i / (o.spikes - 1)) * r * 1.1;
      blob(g, p.dark, sx, ((i % 2) - 0.5) * r * 0.24, r * 0.14, r * 0.1, 0);
    }
  }
  // curled antennae
  if (o.antennae) {
    g.strokeStyle = p.hi + 'aa'; g.lineWidth = r * 0.06; g.lineCap = 'round';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(r * 0.75, s * r * 0.15);
      g.quadraticCurveTo(r * 1.15, s * r * 0.4, r * 1.3, s * r * 0.15); g.stroke();
    }
  }
  // maw + mandibles
  if (o.maw) {
    softShape(g, p.dark, 0, gg => { gg.moveTo(r * 0.95, 0);
      gg.lineTo(r * 0.55, -r * 0.22); gg.lineTo(r * 0.55, r * 0.22); gg.closePath(); });
    g.strokeStyle = p.hi + 'cc'; g.lineWidth = r * 0.05; g.lineCap = 'round';
    g.beginPath(); g.moveTo(r * 0.6, -r * 0.16); g.lineTo(r * 0.92, -r * 0.04);
    g.moveTo(r * 0.6, r * 0.16); g.lineTo(r * 0.92, r * 0.04); g.stroke();
  }
  const eyes = o.eyes || 2;
  for (let i = 0; i < eyes; i++)
    glowDot(g, p.glow, r * (0.45 - (i > 1 ? 0.2 : 0)), ((i % 2) - 0.5) * r * 0.42, r * 0.11);
  // hive-mind crown cluster (hive regent)
  if (o.crown) {
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      glowDot(g, p.glow, r * 0.2 + Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.05);
    }
  }
  rimStroke(g, p.rim + 'cc', 2, gg => { gg.moveTo(-r * 0.4, -r * 0.5); gg.quadraticCurveTo(r * 0.45, -r * 0.66, r * 0.95, -r * 0.06); });
}

// ---------------------------------------------------------------------------
// CHOIR — the conscripted dead. Always human-derived: hunched biped revenants
// and ragged shrouded ghosts. No lateral legs, no mandibles, no insect wings.
// ---------------------------------------------------------------------------
function tdRevenant(g, p, o) {
  // Hulking corpse-golem: two stomping legs, one oversized bone-claw arm, a
  // bound soul glowing in a broken ribcage. Gravewight.
  const r = o.r;
  // dragging broken chain
  g.strokeStyle = p.dark; g.lineWidth = r * 0.06;
  for (let i = 0; i < 4; i++) {
    const cx = -r * 0.9 - i * r * 0.16;
    g.beginPath(); g.arc(cx, r * 0.15 * ((i % 2) ? 1 : -1), r * 0.08, 0, 7); g.stroke();
  }
  // two thick stomping legs (biped stance, not paired insect legs)
  g.strokeStyle = p.base; g.lineWidth = r * 0.36; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.1, -r * 0.22); g.lineTo(-r * 0.55, -r * 0.5); g.stroke();
  g.beginPath(); g.moveTo(-r * 0.05, r * 0.28); g.lineTo(-r * 0.6, r * 0.62); g.stroke();
  // hunched, asymmetric fused-bone torso
  softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, gg => {
    gg.moveTo(r * 0.55, -r * 0.1);
    gg.quadraticCurveTo(r * 0.3, -r * 0.75, -r * 0.3, -r * 0.68);
    gg.quadraticCurveTo(-r * 0.75, -r * 0.3, -r * 0.7, r * 0.05);
    gg.quadraticCurveTo(-r * 0.6, r * 0.55, -r * 0.05, r * 0.6);
    gg.quadraticCurveTo(r * 0.45, r * 0.5, r * 0.55, -r * 0.1);
    gg.closePath();
  });
  // exposed ribcage lines
  g.strokeStyle = p.dark + 'bb'; g.lineWidth = r * 0.05;
  for (let i = 0; i < 3; i++) {
    const yy = -r * 0.3 + i * r * 0.28;
    g.beginPath(); g.moveTo(-r * 0.1, yy); g.quadraticCurveTo(r * 0.15, yy + r * 0.06, r * 0.32, yy - r * 0.02); g.stroke();
  }
  // bound soul glowing in the chest cavity
  glowDot(g, p.glow, r * 0.05, 0, r * 0.16);
  // oversized bone-claw arm reaching forward
  g.strokeStyle = p.dark; g.lineWidth = r * 0.24; g.lineCap = 'round';
  g.beginPath(); g.moveTo(r * 0.2, -r * 0.35); g.lineTo(r * 0.95, -r * 0.5); g.stroke();
  for (const s of [-1, 0, 1]) {
    g.strokeStyle = p.rim + 'aa'; g.lineWidth = r * 0.05;
    g.beginPath(); g.moveTo(r * 0.95, -r * 0.5); g.lineTo(r * 1.18 + s * 0.02 * r, -r * 0.5 + s * r * 0.18); g.stroke();
  }
  // stubby trailing arm
  g.strokeStyle = p.base; g.lineWidth = r * 0.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.15, r * 0.4); g.lineTo(r * 0.15, r * 0.65); g.stroke();
  // small sunken skull head atop the hulking frame
  blob(g, p.dark, r * 0.35, -r * 0.02, r * 0.24, r * 0.24, 0);
  glowDot(g, p.glow, r * 0.4, -r * 0.06, r * 0.06);
  glowDot(g, p.glow, r * 0.4, r * 0.04, r * 0.06);
  rimStroke(g, p.rim + '99', 2, gg => { gg.moveTo(-r * 0.5, -r * 0.5); gg.quadraticCurveTo(r * 0.1, -r * 0.78, r * 0.5, -r * 0.15); });
}

function tdShroud(g, p, o) {
  // Flying banshee: hollow hood, ragged burial shroud torn into streamers
  // instead of insect wings. Nightgaunt.
  const r = o.r;
  for (const s of [-1, 1]) {
    const wingPath = gg => {
      gg.moveTo(-r * 0.1, s * r * 0.15);
      gg.quadraticCurveTo(-r * 0.7, s * r * 0.5, -r * 1.3, s * r * 1.05);
      gg.lineTo(-r * 1.05, s * r * 0.78);
      gg.lineTo(-r * 1.22, s * r * 0.92);
      gg.lineTo(-r * 0.85, s * r * 0.55);
      gg.lineTo(-r * 0.95, s * r * 0.68);
      gg.quadraticCurveTo(-r * 0.5, s * r * 0.3, -r * 0.15, s * r * 0.05);
      gg.closePath();
    };
    softShape(g, lgrad(g, -r * 0.1, 0, -r * 1.3, 0, p.mid, p.dark), 0, wingPath);
    rimStroke(g, p.rim + '77', 1.4, gg => {
      gg.moveTo(-r * 0.1, s * r * 0.15);
      gg.quadraticCurveTo(-r * 0.7, s * r * 0.5, -r * 1.3, s * r * 1.05);
    });
  }
  // thin trailing wisp arms
  g.strokeStyle = p.mid + '99'; g.lineWidth = r * 0.1; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.1, -r * 0.15); g.quadraticCurveTo(-r * 0.5, -r * 0.4, -r * 0.9, -r * 0.3); g.stroke();
  g.beginPath(); g.moveTo(-r * 0.1, r * 0.15); g.quadraticCurveTo(-r * 0.5, r * 0.4, -r * 0.9, r * 0.3); g.stroke();
  // hollow hood
  blob(g, p.mid, r * 0.2, 0, r * 0.5, r * 0.5, 0);
  blob(g, p.dark, r * 0.32, 0, r * 0.3, r * 0.32, 0);
  glowDot(g, p.glow, r * 0.35, -r * 0.12, r * 0.09);
  glowDot(g, p.glow, r * 0.35, r * 0.12, r * 0.09);
  rimStroke(g, p.rim + '88', 2, gg => gg.arc(r * 0.2, 0, r * 0.46, -2.6, -0.6));
}

function tdRequiem(g, p, o) {
  // The Choir's masterwork: a bell-shaped mourning titan trailing an organ-
  // pipe processional train of conscripted souls.
  const r = o.r;
  softShape(g, lgrad(g, r, 0, -r * 1.7, 0, p.mid, p.dark), 0, gg => {
    gg.moveTo(r * 0.3, 0);
    gg.quadraticCurveTo(-r * 0.1, -r * 0.6, -r * 0.9, -r * 0.55);
    gg.quadraticCurveTo(-r * 1.5, -r * 0.5, -r * 1.75, -r * 0.2);
    gg.quadraticCurveTo(-r * 1.4, 0, -r * 1.75, r * 0.2);
    gg.quadraticCurveTo(-r * 1.5, r * 0.5, -r * 0.9, r * 0.55);
    gg.quadraticCurveTo(-r * 0.1, r * 0.6, r * 0.3, 0);
    gg.closePath();
  });
  // organ-pipe ribs down the bell train
  g.strokeStyle = p.accent + '66'; g.lineWidth = r * 0.035;
  for (let i = 0; i < 6; i++) {
    const yy = (-r * 0.45 + i * 0.18 * r);
    g.beginPath(); g.moveTo(-r * 0.2, yy * 0.9); g.lineTo(-r * 1.5, yy); g.stroke();
  }
  // hood
  blob(g, p.mid, r * 0.25, 0, r * 0.55, r * 0.55, 0);
  blob(g, p.dark, r * 0.4, 0, r * 0.32, r * 0.34, 0);
  glowDot(g, p.glow, r * 0.45, 0, r * 0.18);
  // bell-hammer staff
  g.strokeStyle = p.accent; g.lineWidth = r * 0.14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.1, -r * 0.65); g.lineTo(r * 0.85, -r * 0.65); g.stroke();
  blob(g, p.dark, r * 0.85, -r * 0.65, r * 0.18, r * 0.18, 0);
  glowDot(g, p.glow, r * 0.85, -r * 0.65, r * 0.2);
  // conscripted souls swirling through the train
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05, d = r * (0.5 + (i % 3) * 0.35);
    glowDot(g, p.glow, -d * 0.9, Math.sin(a) * r * 0.4, r * 0.06);
  }
  rimStroke(g, p.rim + 'bb', 3, gg => gg.arc(r * 0.25, 0, r * 0.5, -2.6, -0.6));
}

// ---------------------------------------------------------------------------
// PACT — the tithed and the fused. Always human-derived: cultists with
// bound blades or sacrificial wings, and body-horror masses of fused flesh.
// ---------------------------------------------------------------------------
function tdCultist(g, p, o) {
  // o: {r, blades, wings}
  const r = o.r;
  if (o.wings) {
    for (const s of [-1, 1]) {
      softShape(g, lgrad(g, -r * 0.05, 0, -r * 1.35, 0, p.mid, p.dark), 0, gg => {
        gg.moveTo(-r * 0.05, s * r * 0.2);
        gg.quadraticCurveTo(-r * 0.5, s * r * 0.9, -r * 1.35, s * r * 1.1);
        gg.quadraticCurveTo(-r * 0.7, s * r * 0.5, -r * 0.3, s * r * 0.15);
        gg.closePath();
      });
      rimStroke(g, p.rim + '77', 1.4, gg => {
        gg.moveTo(-r * 0.05, s * r * 0.2);
        gg.quadraticCurveTo(-r * 0.5, s * r * 0.9, -r * 1.35, s * r * 1.1);
      });
      // binding straps — sacrificed to the wings, not born with them
      g.strokeStyle = p.accent + 'cc'; g.lineWidth = r * 0.05;
      g.beginPath(); g.moveTo(-r * 0.1, s * r * 0.2); g.lineTo(-r * 1.1, s * r * 0.9); g.stroke();
    }
  }
  // hooded torso
  blob(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, 0, r * 0.85, r * 0.7, 0);
  // blood-slick streak
  g.strokeStyle = p.accent + '88'; g.lineWidth = r * 0.08; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.3, -r * 0.3); g.lineTo(r * 0.1, r * 0.35); g.stroke();
  if (o.blades) {
    for (const s of [-1, 1]) {
      g.strokeStyle = p.hi; g.lineWidth = r * 0.14; g.lineCap = 'round';
      g.beginPath(); g.moveTo(r * 0.15, s * r * 0.35); g.quadraticCurveTo(r * 0.7, s * r * 0.55, r * 0.95, s * r * 0.15); g.stroke();
      glowDot(g, p.glow, r * 0.9, s * r * 0.15, r * 0.05);
    }
  }
  // hooded head
  blob(g, p.mid, r * 0.2, 0, r * 0.5, r * 0.5, 0);
  blob(g, p.dark, r * 0.3, 0, r * 0.28, r * 0.3, 0);
  glowDot(g, p.glow, r * 0.35, 0, r * 0.1);
  rimStroke(g, p.rim + '99', 2, gg => gg.arc(r * 0.2, 0, r * 0.48, -2.6, -0.6));
}

function tdFleshHulk(g, p, o) {
  // A tithe pyramid folded in on itself: several fused torsos, irregular
  // radiating limbs, leftover eyes from the bodies it absorbed. Abomination.
  const r = o.r;
  const arms = o.arms || [-2.6, -1.9, -0.7, 0.4, 1.3, 2.2, 2.9];
  g.lineCap = 'round';
  arms.forEach((a, i) => {
    const len = r * (0.55 + (i % 3) * 0.12);
    g.strokeStyle = p.base; g.lineWidth = r * (0.12 + (i % 2) * 0.06);
    g.beginPath(); g.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
    g.lineTo(Math.cos(a) * (r * 0.4 + len), Math.sin(a) * (r * 0.4 + len)); g.stroke();
  });
  const lumps = [[0, 0, 1], [-r * 0.3, -r * 0.25, 0.65], [r * 0.25, r * 0.3, 0.6], [-r * 0.15, r * 0.4, 0.5], [r * 0.35, -r * 0.2, 0.55]];
  for (const [lx, ly, scale] of lumps)
    blob(g, lgrad(g, lx - r, ly - r, lx + r, ly + r, p.mid, p.base), lx, ly, r * 0.62 * scale, r * 0.54 * scale, 0);
  // central maw/wound
  softShape(g, p.dark, 0, gg => gg.ellipse(0, 0, r * 0.22, r * 0.14, 0.3, 0, 7));
  glowDot(g, p.glow, 0, 0, r * 0.22);
  // leftover eyes, scattered and asymmetric
  const eyeSpots = o.eyeSpots || [[r * 0.4, -r * 0.35], [-r * 0.45, r * 0.15], [r * 0.1, r * 0.5], [-r * 0.5, -r * 0.4]];
  eyeSpots.forEach(([ex, ey]) => glowDot(g, p.glow + 'aa', ex, ey, r * 0.06));
  rimStroke(g, p.rim + '77', 2, gg => gg.arc(0, 0, r * 0.75, -2.9, -0.5));
}

function tdBloodTitan(g, p, o) {
  // The Avatar: a colossal crowned humanoid wearing the debt as a wound,
  // four chained arms, standing in a pool of its own ledger.
  const r = o.r;
  blob(g, p.glow + '2a', 0, 0, r * 1.1, r * 0.95, 0, 10);
  softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, gg => {
    gg.moveTo(r * 0.75, 0);
    gg.quadraticCurveTo(r * 0.4, -r * 0.85, -r * 0.3, -r * 0.7);
    gg.quadraticCurveTo(-r * 0.85, -r * 0.2, -r * 0.85, 0);
    gg.quadraticCurveTo(-r * 0.85, r * 0.2, -r * 0.3, r * 0.7);
    gg.quadraticCurveTo(r * 0.4, r * 0.85, r * 0.75, 0);
    gg.closePath();
  });
  // the chest rift — the debt made visible
  softShape(g, p.dark, 0, gg => gg.ellipse(r * 0.1, 0, r * 0.24, r * 0.34, 0, 0, 7));
  glowDot(g, p.glow, r * 0.1, 0, r * 0.22);
  // four chained arms, drawn over the torso so they read clearly, reaching
  // well past the silhouette with a bright blade tip
  const arms = [[-2.3, 1.65], [-1.05, 1.8], [1.05, 1.8], [2.3, 1.65]];
  g.lineCap = 'round';
  arms.forEach(([a, len]) => {
    g.strokeStyle = p.dark; g.lineWidth = r * 0.05;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); g.stroke();
    g.strokeStyle = p.hi; g.lineWidth = r * 0.17;
    g.beginPath(); g.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
    g.lineTo(Math.cos(a) * r * len, Math.sin(a) * r * len); g.stroke();
    g.strokeStyle = p.rim; g.lineWidth = r * 0.07;
    g.beginPath(); g.moveTo(Math.cos(a) * r * len, Math.sin(a) * r * len);
    g.lineTo(Math.cos(a) * r * (len + 0.24), Math.sin(a) * r * (len + 0.24)); g.stroke();
  });
  // crown of fused blades
  blob(g, p.dark, r * 0.55, 0, r * 0.3, r * 0.3, 0);
  for (let i = 0; i < 5; i++) {
    const a = -0.8 + i * 0.4;
    g.strokeStyle = p.accent; g.lineWidth = r * 0.05;
    g.beginPath(); g.moveTo(r * 0.55 + Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28);
    g.lineTo(r * 0.55 + Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5); g.stroke();
  }
  glowDot(g, p.glow, r * 0.6, -r * 0.06, r * 0.06);
  glowDot(g, p.glow, r * 0.6, r * 0.06, r * 0.06);
  rimStroke(g, p.rim + '99', 3, gg => gg.arc(0, 0, r * 0.8, -2.8, -0.5));
}

function tdRobed(g, p, o) {
  const r = o.r;
  // trailing robe behind
  softShape(g, lgrad(g, r, 0, -r * 1.6, 0, p.mid, p.dark), 0, gg => {
    gg.moveTo(r * 0.3, 0);
    gg.quadraticCurveTo(-r * 0.3, -r * 0.75, -r * 1.5, -r * 0.35);
    gg.quadraticCurveTo(-r * 1.1, 0, -r * 1.5, r * 0.35);
    gg.quadraticCurveTo(-r * 0.3, r * 0.75, r * 0.3, 0); gg.closePath(); });
  // hood
  blob(g, p.mid, r * 0.25, 0, r * 0.55, r * 0.55, 0);
  blob(g, p.dark, r * 0.4, 0, r * 0.32, r * 0.34, 0);
  glowDot(g, p.glow, r * 0.45, 0, r * 0.16);
  if (o.staff) {
    g.strokeStyle = o.bone ? p.accent : p.base; g.lineWidth = r * 0.16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.1, -r * 0.7); g.lineTo(r * 0.9, -r * 0.7); g.stroke();
    glowDot(g, p.glow, r * 0.9, -r * 0.7, r * 0.2);
  }
  rimStroke(g, p.rim + 'bb', 2, gg => gg.arc(r * 0.25, 0, r * 0.5, -2.6, -0.6));
}

function tdStructure(g, p, o) {
  // o: {r, kind:'turret'|'bunker'|'cannon'|'tent'|'dish'|'spire'}
  const r = o.r;
  if (o.kind === 'turret' || o.kind === 'cannon') {
    blob(g, p.dark, 0, 0, r * 0.95, r * 0.95, 0);
    blob(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, 0, r * 0.75, r * 0.75, 0);
    g.strokeStyle = p.base; g.lineWidth = r * (o.kind === 'cannon' ? 0.3 : 0.2); g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(r * (o.kind === 'cannon' ? 1.9 : 1.4), 0); g.stroke();
    blob(g, p.mid, 0, 0, r * 0.4, r * 0.4, 0);
    rimStroke(g, p.rim, 2, gg => gg.arc(0, 0, r * 0.72, -2.8, -0.5));
    glowDot(g, p.glow, 0, 0, r * 0.14);
  } else if (o.kind === 'bunker') {
    // hexagonal pillbox
    softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.base), 0, gg => {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + Math.PI / 6;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? gg.lineTo(px, py) : gg.moveTo(px, py);
      } gg.closePath(); });
    blob(g, p.dark, 0, 0, r * 0.5, r * 0.5, 0);
    g.strokeStyle = p.dark; g.lineWidth = r * 0.16;
    g.beginPath(); g.moveTo(r * 0.5, 0); g.lineTo(r * 1.05, 0); g.stroke();
    rimStroke(g, p.rim, 2, gg => { gg.moveTo(-r * 0.85, -r * 0.5); gg.lineTo(0, -r); gg.lineTo(r * 0.85, -r * 0.5); });
    glowDot(g, p.glow, 0, 0, r * 0.14);
  } else if (o.kind === 'tent') {
    softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.dark), 0, gg => { gg.roundRect(-r, -r * 0.8, r * 2, r * 1.6, r * 0.25); });
    g.strokeStyle = p.dark; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r * 0.8); g.lineTo(0, r * 0.8); g.stroke();
    g.strokeStyle = p.rim; g.lineWidth = r * 0.18;
    g.beginPath(); g.moveTo(0, -r * 0.4); g.lineTo(0, r * 0.4); g.moveTo(-r * 0.4, 0); g.lineTo(r * 0.4, 0); g.stroke();
    rimStroke(g, p.rim + '99', 2, gg => { gg.moveTo(-r * 0.95, -r * 0.75); gg.lineTo(r * 0.95, -r * 0.75); });
  } else if (o.kind === 'dish') {
    blob(g, p.base, 0, 0, r * 0.6, r * 0.6, 0);
    softShape(g, p.mid, 0, gg => gg.ellipse(r * 0.25, -r * 0.2, r * 0.85, r * 0.5, -0.5, 0, 7));
    blob(g, p.dark, r * 0.25, -r * 0.2, r * 0.5, r * 0.28, -0.5);
    g.strokeStyle = p.hi; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(r * 0.25, -r * 0.2); g.lineTo(r * 0.85, -r * 0.75); g.stroke();
    glowDot(g, p.glow, r * 0.85, -r * 0.75, r * 0.14);
    rimStroke(g, p.rim, 2, gg => gg.ellipse(r * 0.25, -r * 0.2, r * 0.82, r * 0.47, -0.5, -2.6, -0.6));
  } else { // spire (pact)
    blob(g, p.dark, 0, 0, r, r, 0);
    softShape(g, lgrad(g, -r, -r, r, r, p.mid, p.dark), 0, gg => {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 - Math.PI / 2;
        const rr = i % 2 ? r * 0.55 : r * 0.95;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i ? gg.lineTo(px, py) : gg.moveTo(px, py);
      } gg.closePath(); });
    glowDot(g, p.glow, 0, 0, r * 0.28);
    rimStroke(g, p.rim + 'aa', 2, gg => gg.arc(0, 0, r * 0.8, -2.6, -1));
  }
}

// ===========================================================================
// RECIPES — unit id → top-down painter. r ≈ UNITS[id].w (world px).
// ===========================================================================
const RECIPES = {
  // vanguard
  marine:     { r:9,  f:(g,p)=>tdInfantry(g,p,{r:9, weapon:'rifle', pack:true}) },
  rocketeer:  { r:10, f:(g,p)=>tdInfantry(g,p,{r:10, weapon:'launcher', pack:true}) },
  sniper:     { r:9,  f:(g,p)=>tdInfantry(g,p,{r:9, weapon:'long', cloak:true}) },
  medic:      { r:9,  f:(g,p)=>tdInfantry(g,p,{r:9, weapon:'none', pack:true, medic:true}) },
  hellhound:  { r:13, f:(g,p)=>tdVehicle(g,p,{L:34,W:22,barrel:14}) },
  outrider:   { r:11, f:(g,p)=>tdVehicle(g,p,{L:30,W:16,barrel:13}) },
  mortar:     { r:10, f:(g,p)=>{ tdInfantry(g,p,{r:9, weapon:'none', pack:true});
                 g.strokeStyle=p.dark; g.lineWidth=3.4; g.lineCap='round';
                 g.beginPath(); g.moveTo(4,7); g.lineTo(13,10); g.stroke(); } },
  apc:        { r:15, f:(g,p)=>tdVehicle(g,p,{L:42,W:26,barrel:10}) },
  siegetank:  { r:16, f:(g,p)=>tdVehicle(g,p,{L:46,W:30,barrel:34,big:true,turretBack:true}) },
  gunship:    { r:13, f:(g,p)=>tdFlyer(g,p,{r:13, rotor:true}) },
  goliath:    { r:17, f:(g,p)=>tdWalker(g,p,{r:17}) },
  bomber:     { r:14, f:(g,p)=>tdFlyer(g,p,{r:14}) },
  artillery:  { r:15, f:(g,p)=>tdVehicle(g,p,{L:44,W:24,barrel:44,big:true,turretBack:true,spade:true}) },
  landship:   { r:22, f:(g,p)=>{ tdVehicle(g,p,{L:76,W:38,barrel:24,twin:true});
                 for (const s of [-1,1]) for (let i=0;i<3;i++) {
                   g.strokeStyle=p.dark; g.lineWidth=3;
                   g.beginPath(); g.moveTo(-20+i*16, s*19); g.lineTo(-14+i*16, s*26); g.stroke();
                 } } },
  leviathan:  { r:22, f:(g,p)=>{ tdWalker(g,p,{r:22}); glowDot(g,p.glow,0,0,5); } },
  ratte:      { r:28, f:(g,p)=>{ tdVehicle(g,p,{L:96,W:52,barrel:56,big:true,twin:true,turretBack:true});
                 glowDot(g,p.glow,-30,0,5); } },
  turret:     { r:12, f:(g,p)=>tdStructure(g,p,{r:12,kind:'turret'}) },
  pillbox:    { r:15, f:(g,p)=>tdStructure(g,p,{r:15,kind:'bunker'}) },
  cannon:     { r:15, f:(g,p)=>tdStructure(g,p,{r:15,kind:'cannon'}) },
  hospital:   { r:15, f:(g,p)=>tdStructure(g,p,{r:15,kind:'tent'}) },
  radar:      { r:14, f:(g,p)=>tdStructure(g,p,{r:14,kind:'dish'}) },

  // syndicate — gilded mercs: brass trim, coin glows
  enforcer:   { r:9,  f:(g,p)=>tdInfantry(g,p,{r:9, weapon:'rifle', pack:true}) },
  gunhand:    { r:9,  f:(g,p)=>{ tdInfantry(g,p,{r:8.5, weapon:'rifle'});
                 g.strokeStyle=p.hi+'88'; g.lineWidth=1.4;   // duster tails
                 g.beginPath(); g.moveTo(-8,-3); g.lineTo(-14,-5); g.moveTo(-8,3); g.lineTo(-14,5); g.stroke(); } },
  marauder:   { r:10, f:(g,p)=>tdInfantry(g,p,{r:10, weapon:'launcher', pack:true}) },
  arbalest:   { r:9,  f:(g,p)=>{ tdInfantry(g,p,{r:9, weapon:'long', cloak:true});
                 glowDot(g,p.glow,23,-2.2,1.6); } },        // beam tip
  sawbones:   { r:9,  f:(g,p)=>tdInfantry(g,p,{r:9, weapon:'none', pack:true, medic:true}) },
  dragoon:    { r:11, f:(g,p)=>tdFlyer(g,p,{r:11, rotor:true}) },
  ironhide:   { r:15, f:(g,p)=>{ tdVehicle(g,p,{L:38,W:28,barrel:9});
                 g.strokeStyle=p.hi+'aa'; g.lineWidth=2;    // riveted prow plate
                 g.beginPath(); g.moveTo(14,-9); g.lineTo(19,0); g.lineTo(14,9); g.stroke(); } },
  juggernaut: { r:16, f:(g,p)=>tdVehicle(g,p,{L:44,W:30,barrel:26,big:true}) },
  demolisher: { r:15, f:(g,p)=>tdVehicle(g,p,{L:42,W:24,barrel:42,big:true,turretBack:true,spade:true}) },
  warlord:    { r:20, f:(g,p)=>{ tdVehicle(g,p,{L:66,W:42,barrel:46,big:true,twin:true,turretBack:true});
                 glowDot(g,p.glow,-24,0,4.5); glowDot(g,p.glow,10,0,3); } },
  watchpost:  { r:11, f:(g,p)=>tdStructure(g,p,{r:11,kind:'turret'}) },
  gunbastion: { r:15, f:(g,p)=>{ tdStructure(g,p,{r:15,kind:'cannon'});
                 rimStroke(g,p.hi,2,gg=>gg.arc(0,0,17,-2.9,-0.3)); } },
  goldvault:  { r:14, f:(g,p)=>{ tdStructure(g,p,{r:14,kind:'bunker'});
                 glowDot(g,p.glow,0,0,4);                    // strongbox shine
                 g.strokeStyle=p.glow+'66'; g.lineWidth=1.4;
                 g.beginPath(); g.arc(0,0,6.5,0,7); g.stroke(); } },

  // warden — grey stone, teal wardlight
  sentinel:   { r:9,  f:(g,p)=>{ tdInfantry(g,p,{r:9, weapon:'none', pack:true});
                 blob(g,p.mid,7,0,4.5,6,0);                  // tower shield held forward
                 rimStroke(g,p.rim,2,gg=>{gg.moveTo(9,-6); gg.lineTo(9,6);}); } },
  wardenguard:{ r:10, f:(g,p)=>{ tdInfantry(g,p,{r:10, weapon:'rifle', pack:true});
                 blob(g,p.mid,5,3,3.5,4.5,0); } },           // side pavise
  pikeman:    { r:9,  f:(g,p)=>tdInfantry(g,p,{r:9, weapon:'long'}) },
  marshal:    { r:11, f:(g,p)=>{ tdInfantry(g,p,{r:10, weapon:'none', pack:true});
                 g.strokeStyle=p.accent; g.lineWidth=1.8;    // banner pole + pennant
                 g.beginPath(); g.moveTo(-4,-8); g.lineTo(-4,-20); g.stroke();
                 softShape(g,p.glow,0,gg=>{gg.moveTo(-4,-20); gg.lineTo(6,-17); gg.lineTo(-4,-14); gg.closePath();}); } },
  halberdier: { r:11, f:(g,p)=>{ tdInfantry(g,p,{r:11, weapon:'long', pack:true});
                 blob(g,p.hi,25,-2.8,3,1.8,0.5); } },        // axe head on the pole
  bombard:    { r:14, f:(g,p)=>tdVehicle(g,p,{L:36,W:22,barrel:30,big:true,spade:true}) },
  ironclad:   { r:16, f:(g,p)=>{ tdVehicle(g,p,{L:42,W:32,barrel:0});
                 blob(g,p.mid,12,0,6,10,0);                  // ram prow
                 rimStroke(g,p.rim,2,gg=>{gg.moveTo(16,-9); gg.lineTo(20,0); gg.lineTo(16,9);}); } },
  castellan:  { r:19, f:(g,p)=>{ tdWalker(g,p,{r:19}); glowDot(g,p.glow,0,0,4); } },
  trebuchet:  { r:15, f:(g,p)=>{ tdVehicle(g,p,{L:40,W:22,barrel:0,spade:true});
                 g.strokeStyle=p.dark; g.lineWidth=3.4; g.lineCap='round';
                 g.beginPath(); g.moveTo(-14,0); g.lineTo(24,-7); g.stroke();  // throwing arm
                 blob(g,p.dark,-14,0,5.5,5.5,0);             // counterweight
                 blob(g,p.hi+'66',24,-7,2.5,2.5,0); } },
  rampart:    { r:14, f:(g,p)=>{ softShape(g,p.dark,0,gg=>gg.roundRect(-6,-16,13,32,3));
                 softShape(g,lgrad(g,-5,-16,6,16,p.mid,p.base),0,gg=>gg.roundRect(-5,-15,10,30,2));
                 g.strokeStyle=p.dark; g.lineWidth=1.2;      // mortar seams
                 for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-5,-9+i*6); g.lineTo(5,-9+i*6); g.stroke(); }
                 rimStroke(g,p.rim,2,gg=>{gg.moveTo(-4,-14); gg.lineTo(4,-14);}); } },
  ballista:   { r:13, f:(g,p)=>{ tdStructure(g,p,{r:12,kind:'turret'});
                 g.strokeStyle=p.accent; g.lineWidth=2;      // crossbow limbs
                 g.beginPath(); g.moveTo(8,-8); g.lineTo(15,-3); g.moveTo(8,8); g.lineTo(15,3); g.stroke(); } },
  cauldron:   { r:13, f:(g,p)=>{ blob(g,p.dark,0,0,12,12,0);
                 blob(g,lgrad(g,-9,-9,9,9,p.mid,p.base),0,0,9.5,9.5,0);
                 blob(g,p.accent+'aa',0,0,6,6,0);            // simmering oil
                 glowDot(g,'#ff9a3a',0,0,3.4);
                 rimStroke(g,p.rim,2,gg=>gg.arc(0,0,10,-2.8,-0.6)); } },
  redoubt:    { r:15, f:(g,p)=>{ tdStructure(g,p,{r:15,kind:'bunker'});
                 g.strokeStyle=p.base; g.lineWidth=3; g.lineCap='round';
                 g.beginPath(); g.moveTo(0,0); g.lineTo(22,0); g.stroke();
                 blob(g,p.mid,0,0,5,5,0); } },
  bulwark:    { r:22, f:(g,p)=>{ tdStructure(g,p,{r:22,kind:'bunker'});
                 for(const s of [-1,1]){ g.strokeStyle=p.base; g.lineWidth=2.6; g.lineCap='round';
                   g.beginPath(); g.moveTo(4,s*9); g.lineTo(22,s*12); g.stroke(); }
                 g.strokeStyle=p.dark; g.lineWidth=4;
                 g.beginPath(); g.moveTo(0,0); g.lineTo(30,0); g.stroke();
                 glowDot(g,p.glow,0,0,5); } },

  // myriad — purple chitin swarm
  swarmling:  { r:8,  f:(g,p)=>tdBeast(g,p,{r:8, legs:3, maw:true, antennae:true}) },
  spitter:    { r:10, f:(g,p)=>{ tdBeast(g,p,{r:10, legs:3, spikes:3, antennae:true});
                 blob(g,p.accent,-7.5,0,3.5,3,0); glowDot(g,p.glow,-7.5,0,1.2); } },  // acid sac
  hunter:     { r:10, f:(g,p)=>tdBeast(g,p,{r:10, legs:3, tail:true, maw:true}) },
  miasma:     { r:11, f:(g,p)=>{ tdBeast(g,p,{r:11, legs:2, eyes:3});
                 blob(g,p.glow+'2a',0,0,13,13,0,6); } },
  broodtyrant:{ r:19, f:(g,p)=>tdBeast(g,p,{r:19, legs:4, spikes:5, maw:true, tail:true, plates:true}) },
  broodmother:{ r:18, f:(g,p)=>{ tdBeast(g,p,{r:18, legs:4, eyes:4, spikes:4, sacs:true});
                 blob(g,p.accent+'55',-6,0,9,7,0); } },
  hiveRegent: { r:26, f:(g,p)=>{ tdBeast(g,p,{r:26, legs:5, spikes:7, maw:true, tail:true, eyes:5, plates:true, crown:true});
                 glowDot(g,p.glow,-6,0,6); } },

  // choir — the conscripted dead, always human-derived: no legs-in-pairs, no mandibles
  husk:       { r:8,  f:(g,p)=>tdInfantry(g,p,{r:8, weapon:'none', cloak:true, tattered:true}) },
  wraith:     { r:9,  f:(g,p)=>{ tdRobed(g,p,{r:9});
                 blob(g,p.mid+'2a',-13,0,7,4.5,0);                              // dissolving afterimage
                 glowDot(g,p.glow,-9,4.5,1.4); glowDot(g,p.glow,-13,-3,1.1); glowDot(g,p.glow,-16.5,2,0.8); } },
  harbinger:  { r:11, f:(g,p)=>{ tdRobed(g,p,{r:11, staff:true, bone:true});
                 g.strokeStyle=p.glow+'55'; g.lineWidth=1;                      // the far voice, arriving
                 for(let i=0;i<3;i++){ g.beginPath(); g.arc(9.9,-7.7,5+i*3.5,-1.3,-0.1); g.stroke(); } } },
  gravewight: { r:18, f:(g,p)=>tdRevenant(g,p,{r:18}) },
  lich:       { r:12, f:(g,p)=>{ tdRobed(g,p,{r:12, staff:true, bone:true});
                 for(let i=0;i<3;i++){ const a=i*2.1; glowDot(g,p.glow,Math.cos(a)*14,Math.sin(a)*14,1.4); } } }, // orbiting relic shards
  nightgaunt: { r:12, f:(g,p)=>tdShroud(g,p,{r:11}) },
  requiem:    { r:26, f:(g,p)=>tdRequiem(g,p,{r:26}) },

  // pact — the tithed and the fused, always human-derived: cultists and fused-flesh masses
  thrall:     { r:8,  f:(g,p)=>tdInfantry(g,p,{r:8, weapon:'none', dagger:true}) },
  flayer:     { r:9,  f:(g,p)=>tdCultist(g,p,{r:9, blades:true}) },
  bloodpriest:{ r:11, f:(g,p)=>{ tdRobed(g,p,{r:11, staff:true});
                 g.strokeStyle=p.glow+'88'; g.lineWidth=0.9; g.lineCap='round';  // blood tithe-drips down the robe
                 for(let i=0;i<3;i++){ const yy=(i-1)*4;
                   g.beginPath(); g.moveTo(-3-i*2,yy); g.quadraticCurveTo(-7-i*2,yy+3,-9-i*2.5,yy+7); g.stroke(); }
                 glowDot(g,p.glow,-9,4,1); } },
  gargoyle:   { r:11, f:(g,p)=>{ tdCultist(g,p,{r:10, wings:true}); glowDot(g,p.accent,3,4,1.4); } }, // sacrificial flier, bound wings
  abomination:{ r:19, f:(g,p)=>tdFleshHulk(g,p,{r:19}) },
  hemospire:  { r:14, f:(g,p)=>tdStructure(g,p,{r:14,kind:'spire'}) },
  avatar:     { r:28, f:(g,p)=>tdBloodTitan(g,p,{r:28}) },
};

// ---------------------------------------------------------------------------
// Cores, top-down.
// ---------------------------------------------------------------------------
function paintCore(fac) {
  const p = PAL[fac], S = 3, R = 56;
  const c = mkCanvas(R * 2 * S, R * 2 * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(R, R);
  if (fac === 'vanguard') {
    // walled compound with command tent + banner
    softShape(g, p.dark, 0, gg => gg.roundRect(-R * 0.8, -R * 0.7, R * 1.6, R * 1.4, 8));
    softShape(g, lgrad(g, -R, -R, R, R, p.mid, p.base), 0, gg => gg.roundRect(-R * 0.68, -R * 0.58, R * 1.36, R * 1.16, 6));
    // sandbag wall studs
    g.fillStyle = p.base;
    for (let i = 0; i < 8; i++) {
      blob(g, p.mid, -R * 0.68 + (i + 0.5) * R * 0.17, -R * 0.58, 4, 3, 0);
      blob(g, p.mid, -R * 0.68 + (i + 0.5) * R * 0.17, R * 0.58, 4, 3, 0);
    }
    blob(g, p.mid, 0, 0, R * 0.34, R * 0.28, 0);              // command tent
    blob(g, p.hi + '44', -R * 0.06, -R * 0.06, R * 0.2, R * 0.14, 0);
    softShape(g, p.accent, 0, gg => { gg.moveTo(R * 0.4, -R * 0.4); gg.lineTo(R * 0.62, -R * 0.32); gg.lineTo(R * 0.4, -R * 0.22); gg.closePath(); });
    glowDot(g, p.glow, -R * 0.3, R * 0.25, 4);
    glowDot(g, p.glow, R * 0.2, R * 0.35, 3);
    rimStroke(g, p.rim, 3, gg => { gg.moveTo(-R * 0.66, -R * 0.56); gg.lineTo(R * 0.66, -R * 0.56); });
  } else if (fac === 'syndicate') {
    // the Haven: gilded counting-hall with strongroom + coin glow
    softShape(g, p.dark, 0, gg => gg.roundRect(-R * 0.78, -R * 0.66, R * 1.56, R * 1.32, 10));
    softShape(g, lgrad(g, -R, -R, R, R, p.mid, p.base), 0, gg => gg.roundRect(-R * 0.66, -R * 0.54, R * 1.32, R * 1.08, 8));
    // vault ring
    blob(g, p.dark, R * 0.22, 0, R * 0.3, R * 0.3, 0);
    blob(g, lgrad(g, 0, -R * 0.2, R * 0.4, R * 0.2, p.mid, p.base), R * 0.22, 0, R * 0.22, R * 0.22, 0);
    g.strokeStyle = p.hi; g.lineWidth = 2;
    g.beginPath(); g.arc(R * 0.22, 0, R * 0.26, 0, 7); g.stroke();
    glowDot(g, p.glow, R * 0.22, 0, 6);
    // coin stacks
    for (let i = 0; i < 3; i++) blob(g, p.hi, -R * 0.4 + i * R * 0.14, R * 0.3, 4, 3, 0);
    blob(g, p.hi + '66', -R * 0.35, -R * 0.3, R * 0.14, R * 0.08, 0);
    rimStroke(g, p.rim, 3, gg => { gg.moveTo(-R * 0.64, -R * 0.52); gg.lineTo(R * 0.64, -R * 0.52); });
  } else if (fac === 'warden') {
    // Bastion Keep: square curtain wall, corner towers, central keep
    softShape(g, p.dark, 0, gg => gg.roundRect(-R * 0.74, -R * 0.7, R * 1.48, R * 1.4, 6));
    softShape(g, lgrad(g, -R, -R, R, R, p.mid, p.base), 0, gg => gg.roundRect(-R * 0.62, -R * 0.58, R * 1.24, R * 1.16, 4));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      blob(g, p.dark, sx * R * 0.6, sy * R * 0.56, R * 0.17, R * 0.17, 0);
      blob(g, p.mid, sx * R * 0.6, sy * R * 0.56, R * 0.12, R * 0.12, 0);
    }
    // central keep
    blob(g, p.dark, 0, 0, R * 0.32, R * 0.32, 0);
    softShape(g, lgrad(g, -R * 0.2, -R * 0.2, R * 0.2, R * 0.2, p.mid, p.base), 0, gg => gg.roundRect(-R * 0.24, -R * 0.24, R * 0.48, R * 0.48, 4));
    glowDot(g, p.glow, 0, 0, 5);
    // battlements
    g.fillStyle = p.mid;
    for (let i = 0; i < 6; i++) {
      blob(g, p.mid, -R * 0.5 + i * R * 0.2, -R * 0.58, 3.5, 3, 0);
      blob(g, p.mid, -R * 0.5 + i * R * 0.2, R * 0.58, 3.5, 3, 0);
    }
    rimStroke(g, p.rim, 3, gg => { gg.moveTo(-R * 0.6, -R * 0.56); gg.lineTo(R * 0.6, -R * 0.56); });
  } else if (fac === 'myriad') {
    for (let i = 4; i > 0; i--)
      blob(g, i % 2 ? p.mid : p.dark, 0, 0, R * 0.2 * i, R * 0.18 * i, 0.2);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      blob(g, p.dark, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.5, 6, 9, a);
    }
    glowDot(g, p.glow, 0, 0, 9);
    glowDot(g, p.glow, R * 0.3, -R * 0.2, 4);
    rimStroke(g, p.rim + 'aa', 3, gg => gg.arc(0, 0, R * 0.62, -2.8, -0.6));
  } else if (fac === 'choir') {
    // bone cathedral footprint: long nave + transept
    softShape(g, lgrad(g, -R, -R, R, R, p.mid, p.dark), 0, gg => {
      gg.roundRect(-R * 0.7, -R * 0.24, R * 1.3, R * 0.48, 6);
      gg.roundRect(-R * 0.2, -R * 0.62, R * 0.44, R * 1.24, 6); });
    blob(g, p.dark, R * 0.38, 0, R * 0.16, R * 0.16, 0);
    glowDot(g, p.glow, R * 0.38, 0, 6);
    g.strokeStyle = p.accent + '88'; g.lineWidth = 2;
    for (let i = 0; i < 4; i++) { g.beginPath();
      g.moveTo(-R * 0.6 + i * R * 0.28, -R * 0.34); g.lineTo(-R * 0.56 + i * R * 0.28, -R * 0.52); g.stroke(); }
    rimStroke(g, p.rim + 'cc', 3, gg => { gg.moveTo(-R * 0.66, -R * 0.2); gg.lineTo(R * 0.56, -R * 0.2); });
  } else {
    // blood altar: monolith ring over a pool
    blob(g, p.glow + '30', 0, 0, R * 0.72, R * 0.66, 0, 8);
    blob(g, p.dark, 0, 0, R * 0.55, R * 0.5, 0);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const px = Math.cos(a) * R * 0.62, py = Math.sin(a) * R * 0.56;
      blob(g, lgrad(g, px - 6, py - 8, px + 6, py + 8, p.mid, p.dark), px, py, 6, 10, a + Math.PI / 2);
    }
    blob(g, lgrad(g, -8, -10, 8, 10, p.mid, p.dark), 0, 0, 9, 13, 0.3);
    glowDot(g, p.glow, 0, 0, 8);
    rimStroke(g, p.rim + 'cc', 3, gg => gg.arc(0, 0, R * 0.5, -2.8, -0.8));
  }
  return { canvas: c, R, S };
}

// ---------------------------------------------------------------------------
// Sprite cache & API
// ---------------------------------------------------------------------------
const Sprites = {
  _cache: {},
  SS: 3,

  unit(id) {
    if (this._cache[id]) return this._cache[id];
    const rec = RECIPES[id], u = UNITS[id], p = PAL[u.fac];
    const size = Math.ceil(rec.r * 5.2);
    const c = mkCanvas(size * this.SS, size * this.SS);
    const g = c.getContext('2d');
    g.scale(this.SS, this.SS);
    g.translate(size / 2, size / 2);
    rec.f(g, p, mulberry(hashStr(id)));
    const spr = { canvas: c, size, half: size / 2 };
    this._cache[id] = spr;
    return spr;
  },

  core(fac) {
    const k = 'core_' + fac;
    if (!this._cache[k]) this._cache[k] = paintCore(fac);
    return this._cache[k];
  },

  // Roster chip / reward art: unit over a moody vignette.
  chipArt(unitId, w, h) {
    const k = `chip_${unitId}_${w}x${h}`;
    if (this._cache[k]) return this._cache[k];
    const c = mkCanvas(w * 2, h * 2), g = c.getContext('2d');
    g.scale(2, 2);
    const bg = lgrad(g, 0, 0, 0, h, '#1c212c', '#10131a');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    glowDot(g, '#a8b8c822', w * 0.75, h * 0.25, 6);
    const spr = this.unit(unitId);
    const u = UNITS[unitId];
    const scale = Math.min((h * 0.8) / (RECIPES[unitId].r * 3), 1.6);
    g.translate(w / 2, h / 2);
    g.rotate(-Math.PI / 2);          // face "up" on the chip
    g.drawImage(spr.canvas, -spr.half * scale, -spr.half * scale, spr.size * scale, spr.size * scale);
    g.rotate(Math.PI / 2);
    g.translate(-w / 2, -h / 2);
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h);
    v.addColorStop(0, 'transparent'); v.addColorStop(1, '#000000aa');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    this._cache[k] = c;
    return c;
  },
};

// ---------------------------------------------------------------------------
// Battlefield painter — top-down ground + terrain, one canvas per battle.
// ---------------------------------------------------------------------------
const GROUNDS = {
  myriad: { base:'#170f20', lit:'#2b1a3a', dark:'#0c0714', prop:'#3a2454', glow:'#c24bff' },
  choir:  { base:'#1e1e28', lit:'#2c2c3a', dark:'#131319', prop:'#4a4a60', glow:'#8fd8e8' },
  pact:   { base:'#201316', lit:'#301b20', dark:'#130a0d', prop:'#582c34', glow:'#ff4a34' },
};

function paintField(fac, seed, feats) {
  const T = GROUNDS[fac], rnd = mulberry(seed);
  const W = ARENA.w, H = ARENA.h;
  const c = mkCanvas(W, H), g = c.getContext('2d');

  // ground
  const bg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.65);
  bg.addColorStop(0, T.lit); bg.addColorStop(1, T.dark);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // brush noise
  for (let i = 0; i < 420; i++) {
    const x = rnd() * W, y = rnd() * H;
    g.strokeStyle = (rnd() < 0.5 ? '#ffffff' : '#000000') + '08';
    g.lineWidth = 1 + rnd() * 2;
    g.beginPath(); g.moveTo(x, y);
    g.lineTo(x + 10 + rnd() * 34, y + rnd() * 8 - 4); g.stroke();
  }
  // scattered props: craters / bones / growths
  for (let i = 0; i < 26; i++) {
    const x = rnd() * W, y = rnd() * H, r = 3 + rnd() * 8;
    if (rnd() < 0.5) { // crater
      g.strokeStyle = '#00000033'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
      g.strokeStyle = '#ffffff10';
      g.beginPath(); g.arc(x, y, r, -2.6, -0.6); g.stroke();
    } else {
      blob(g, T.prop + '66', x, y, r * 0.7, r * 0.4, rnd() * 3);
    }
  }

  // terrain patches
  for (const f of feats) {
    const x = f.x, y = f.y, r = f.r;
    if (f.t === 'ridge') {
      blob(g, '#00000044', x + 6, y + 8, r * 1.05, r * 0.95, 0);
      blob(g, T.lit, x, y, r, r * 0.9, 0);
      blob(g, '#ffffff0a', x - r * 0.2, y - r * 0.2, r * 0.65, r * 0.55, 0);
      g.strokeStyle = '#ffffff22'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, r * 0.98, -2.9, -0.3); g.stroke();
      g.strokeStyle = '#00000055';
      g.beginPath(); g.arc(x, y, r * 0.98, 0.3, 2.6); g.stroke();
    } else if (f.t === 'ruins') {
      const rr = mulberry(seed + Math.floor(x));
      for (let i = 0; i < 7; i++) {
        const a = rr() * Math.PI * 2, d = rr() * r * 0.8;
        const wx = x + Math.cos(a) * d, wy = y + Math.sin(a) * d;
        const len = 10 + rr() * 22, rot = rr() * 3;
        g.save(); g.translate(wx, wy); g.rotate(rot);
        g.fillStyle = '#00000044'; g.fillRect(-len / 2 + 2, -3 + 3, len, 6);
        g.fillStyle = i % 2 ? T.prop : '#3a3f4a';
        g.fillRect(-len / 2, -3, len, 6);
        g.fillStyle = '#ffffff14'; g.fillRect(-len / 2, -3, len, 2);
        g.restore();
      }
      g.strokeStyle = '#ffffff10'; g.setLineDash([4, 6]);
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.setLineDash([]);
    } else if (f.t === 'rocks') {
      const rr = mulberry(seed + Math.floor(x) * 3);
      blob(g, '#00000055', x + 5, y + 7, r * 1.02, r * 0.92, 0);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + rr() * 0.5, d = r * (0.3 + rr() * 0.5);
        const cx = x + Math.cos(a) * d * 0.6, cy = y + Math.sin(a) * d * 0.6;
        const cr = r * (0.3 + rr() * 0.28);
        softShape(g, lgrad(g, cx - cr, cy - cr, cx + cr, cy + cr, '#2c313d', '#12151c'), 0, gg => {
          gg.moveTo(cx + cr, cy);
          for (let k = 1; k < 6; k++) {
            const ka = k * Math.PI / 3;
            gg.lineTo(cx + Math.cos(ka) * cr * (0.75 + rr() * 0.4), cy + Math.sin(ka) * cr * (0.75 + rr() * 0.4));
          } gg.closePath(); });
      }
      g.strokeStyle = '#ffffff18'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(x - r * 0.2, y - r * 0.25, r * 0.5, -2.8, -0.6); g.stroke();
    } else if (f.t === 'hostile') {
      const col = PAL[fac].glow;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, col + '26'); gr.addColorStop(0.7, col + '14'); gr.addColorStop(1, 'transparent');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      const rr = mulberry(seed + Math.floor(y) * 7);
      for (let i = 0; i < r / 4; i++) {
        const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * 0.9;
        glowDot(g, col + '55', x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + rr() * 1.6);
      }
    }
  }

  // arena vignette
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.66);
  v.addColorStop(0, 'transparent'); v.addColorStop(1, '#00000040');
  g.fillStyle = v; g.fillRect(0, 0, W, H);

  return c;
}
