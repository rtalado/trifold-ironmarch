// ============================================================================
// TRIFOLD: IRONMARCH — headless faction balance smoke test
// Drives the real sim (defs + core + sim, no DOM) for each playable faction
// against act-1 encounters and reports win rates. Not a proof of balance —
// a tripwire for units that crash, stall, or wildly over/underperform.
// Run: node scripts/balance-check.js
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, JSON, Object, Array });
for (const f of ['js/defs.js', 'js/core.js', 'js/sim.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}

const code = `
(function () {
  // deploy a roster in a rough line inside the deployment zone
  function deploy(b, roster) {
    const spots = [];
    for (let gy = 2; gy <= 17; gy++) for (let gx = 2; gx <= 9; gx++) spots.push([gx * 40, gy * 40]);
    let si = 0;
    roster.forEach((entry, i) => {
      for (let t = 0; t < spots.length; t++) {
        const [x, y] = spots[(si + t * 7) % spots.length];
        // reuse the real placement validity rules from combat via geometry here:
        if (x < 30 || x > ARENA.deployW) continue;
        let bad = false;
        const u = UNITS[entry.id];
        if (!u.fly) for (const r of b.rocks) if (dist2(x, y, r.x, r.y) < (r.r * 0.82 + u.w) ** 2) { bad = true; break; }
        if (dist2(x, y, b.hq.x, b.hq.y) < (b.hq.w + u.w + 14) ** 2) bad = true;
        if (bad) continue;
        spawnSquad(b, 'player', entry.id, x, y, entry.up, i);
        si += t + 3;
        return;
      }
    });
  }

  function fight(fac, roster, encId) {
    const run = { fac, roster: roster.map(id => ({ id, up: false })), relics: [], scrap: 0 };
    const b = newBattle(encId, run);
    b.deployed = run.roster.map(() => false);
    deploy(b, run.roster);
    b.phase = 'fight';
    let guard = 0;
    while (!b.over && guard++ < 9000) simTick(b, 0.035);
    if (!b.over) {
      // stalemate: whoever still has living non-core units loses least badly
      const alive = s => b.ents.filter(e => !e.dead && !e.core && e.side === s).length;
      b.result = alive('player') >= alive('enemy') ? 'win' : 'loss';
      b.stall = true;
    }
    return b;
  }

  const ROSTERS = {
    small: {
      vanguard:  ['marine','marine','rocketeer','medic','turret'],
      syndicate: ['enforcer','enforcer','marauder','sawbones','watchpost'],
      warden:    ['sentinel','sentinel','wardenguard','marshal','ballista'],
    },
    grown: {
      vanguard:  ['marine','marine','rocketeer','sniper','medic','siegetank','mortar','turret','pillbox'],
      syndicate: ['enforcer','enforcer','marauder','arbalest','sawbones','juggernaut','ironhide','watchpost','gunbastion'],
      warden:    ['sentinel','sentinel','wardenguard','pikeman','marshal','ironclad','bombard','ballista','redoubt'],
    },
  };
  const TESTS = [
    ['small', 'm_skirmish'], ['small', 'm_pack'],
    ['grown', 'm_tyrant'],   ['grown', 'm_bursters'], ['grown', 'm_elite'],
  ];
  const N = 12;
  const out = [];
  for (const fac of ['vanguard', 'syndicate', 'warden']) {
    for (const [size, enc] of TESTS) {
      let wins = 0, stalls = 0, scrap = 0;
      for (let i = 0; i < N; i++) {
        const b = fight(fac, ROSTERS[size][fac], enc);
        if (b.result === 'win') wins++;
        if (b.stall) stalls++;
        scrap += Math.round(b.bounty || 0);
      }
      out.push(fac.padEnd(10) + enc.padEnd(12) + size.padEnd(7)
        + ' wins ' + String(wins).padStart(2) + '/' + N
        + (stalls ? '  stalls ' + stalls : '')
        + (scrap ? '  bounty~' + Math.round(scrap / N) : ''));
    }
  }
  return out.join('\\n');
})()
`;
console.log(vm.runInContext(code, ctx, { filename: 'balance-harness' }));
