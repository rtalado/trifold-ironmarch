// ============================================================================
// TRIFOLD: IRONMARCH — global state & small helpers
// ============================================================================
'use strict';

// Bump on every player-facing change — shown bottom-right on the title screen
// so players (and app owners chasing OTA delivery) can confirm they're current.
const GAME_VERSION = '1.2.0';

const G = {
  screen: 'title',       // title | map | battle | reward | shop | rest | event | gameover | victory | roster
  run: null,
  battle: null,
  meta: null,
  speed: 1,
};

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Aggregate relic hooks into one lookup the engine reads.
function aggHooks(relicIds) {
  const h = {
    hpMult: 1, dmgMult: 1, spdMult: 1, shopMult: 1, structHpMult: 1, splashMult: 1,
    hqArmor: 1, reserveCdMult: 1,
    scrapAdd: 0, reserveAdd: 0, eliteBounty: 0,
    lastStand: false, recruitUp: false,
    ridgeBonus: TERRAIN_FX.ridgeRange, ruinsGuard: TERRAIN_FX.ruinsGuard,
    hqAura: null,
  };
  for (const id of relicIds || []) {
    const k = RELICS[id] && RELICS[id].hooks; if (!k) continue;
    for (const key of Object.keys(k)) {
      const v = k[key];
      if (key === 'hqAura') h.hqAura = v;
      else if (key === 'ridgeBonus') h.ridgeBonus = Math.max(h.ridgeBonus, v);
      else if (key === 'ruinsGuard') h.ruinsGuard = Math.min(h.ruinsGuard, v);
      else if (typeof v === 'boolean') h[key] = h[key] || v;
      else if (['hpMult','dmgMult','spdMult','shopMult','structHpMult','splashMult','hqArmor','reserveCdMult'].includes(key)) h[key] *= v;
      else h[key] += v;
    }
  }
  return h;
}

// Squad display helpers. A roster entry is {id, up}.
function squadName(entry) {
  return UNITS[entry.id].name + (entry.up ? ' ★' : '');
}
function squadStatsHtml(entry) {
  const u = UNITS[entry.id];
  const m = entry.up ? 1.3 : 1;
  let s = `<b>${u.models}×</b> ${Math.round(u.hp * m)}hp`;
  if (u.dmg) s += ` · <b>${Math.round(u.dmg * m)}</b>dmg`;
  if (u.rng > 70) s += ` · rng ${u.rng}`;
  if (u.splash) s += ' · splash';
  if (u.heal) s += ' · heals';
  if (u.fly) s += ' · flies';
  if (u.struct) s += ' · emplacement';
  if (u.minRng) s += ' · min range';
  return s;
}
