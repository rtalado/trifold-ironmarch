// ============================================================================
// TRIFOLD: IRONMARCH — the battle simulation (top-down)
// 2D autobattle: squads of models seek, flock, and fight across a painted
// arena. Placement & reserves live in combat.js.
// ============================================================================
'use strict';

let ENT_ID = 1;

// ---------------------------------------------------------------------------
// Battle construction
// ---------------------------------------------------------------------------
function newBattle(encId, run) {
  const enc = ENCOUNTERS[encId];
  const hooks = aggHooks(run.relics);
  const fpk = (FACTIONS[run.fac] || FACTIONS.vanguard).battle;
  if (fpk.structHpMult) hooks.structHpMult *= fpk.structHpMult;
  const seed = Math.floor(Math.random() * 1e9);
  const tmpl = pick(MAP_TEMPLATES);
  const feats = tmpl.feats.map(f => ({ t: f.t, x: f.x * ARENA.w, y: f.y * ARENA.h, r: f.r }));

  const b = {
    enc, encId, run, hooks, fpk, seed, t: 0, result: null, over: false,
    fac: enc.fac, feats, bounty: 0,
    rocks: feats.filter(f => f.t === 'rocks'),
    ents: [], fx: [], squads: [],
    shake: 0, phase: 'place',        // place | fight
    wiped: [],                       // roster indices lost this battle
    lastStandUsed: false,
    stance: 'advance',               // stance applied to the NEXT squad placed: 'advance' | 'hold'
    nextWave: 35,
    reserveLeft: ECON.reserveDrops + hooks.reserveAdd,
    reserveCdT: 0,
  };

  const pfac = FACTIONS[run.fac] ? run.fac : 'vanguard';
  b.hq = spawnEnt(b, 'player', null, ARENA.coreP.x, ARENA.coreP.y, {
    core: true, name: FACTIONS[pfac].hqName, fac: pfac, w: 40,
    hp: Math.round(ECON.coreHPBase), maxhp: Math.round(ECON.coreHPBase),
  });
  b.core = spawnEnt(b, 'enemy', null, ARENA.coreE.x, ARENA.coreE.y, {
    core: true, name: coreName(enc.fac), fac: enc.fac, w: 40,
    hp: Math.round(ECON.coreHPBase * enc.coreHP), maxhp: Math.round(ECON.coreHPBase * enc.coreHP),
  });

  placeEnemyForce(b, enc.budget, true);
  return b;
}

function coreName(fac) {
  return { myriad: 'Hive Cluster', choir: 'Ossuary Gate', pact: 'Blood Altar' }[fac] || 'Core';
}

// ---------------------------------------------------------------------------
// Spawning
// ---------------------------------------------------------------------------
function spawnEnt(b, side, unitId, x, y, over) {
  const e = {
    id: ENT_ID++, side, unitId, x, y, angle: side === 'player' ? 0 : Math.PI,
    hp: 1, maxhp: 1, cd: rand(0, 0.5), dead: false,
    slow: null, frenzy: 0, spawnT: 0, squad: null,
    ...over,
  };
  b.ents.push(e);
  return e;
}

function makeModel(b, side, unitId, x, y, umod, squad) {
  const u = UNITS[unitId];
  let hp = u.hp, dmg = u.dmg;
  if (umod) { hp = Math.round(hp * (umod.hpM || 1)); dmg = Math.round(dmg * (umod.dmgM || 1)); }
  if (side === 'player') {
    hp = Math.round(hp * b.hooks.hpMult * (u.struct ? b.hooks.structHpMult : 1));
    dmg = Math.round(dmg * b.hooks.dmgMult);
  }
  const e = spawnEnt(b, side, unitId, x, y, {
    name: u.name, fac: u.fac, hp, maxhp: hp, dmg,
    rng: u.rng, rof: u.rof,
    spd: u.spd * (side === 'player' ? b.hooks.spdMult : 1),
    w: u.w,
    splash: (u.splash || 0) * (side === 'player' ? b.hooks.splashMult : 1),
    fly: !!u.fly, air: !!u.air, struct: !!u.struct,
    heal: u.heal || 0, healRng: u.healRng || 0,
    minRng: u.minRng || 0, aura: u.aura || null,
    deathSpawn: u.deathSpawn, deathBurst: u.deathBurst, dodge: u.dodge || 0,
    slowHit: u.slowHit || null, spawn: u.spawn ? { ...u.spawn } : null, boss: !!u.boss,
    raiseDead: !!u.raiseDead, squad,
  });
  if (e.spawn) e.spawnT = e.spawn.every * (0.5 + Math.random() * 0.5);
  return e;
}

// One roster squad → `models` entities in a small cluster around (x,y).
function spawnSquad(b, side, unitId, x, y, up, rosterIdx, hold) {
  const u = UNITS[unitId];
  const squad = { side, unitId, rosterIdx: rosterIdx == null ? null : rosterIdx, alive: u.models, up: !!up, hold: !!hold };
  b.squads.push(squad);
  const umod = up ? { hpM: 1.3, dmgM: 1.3 } : null;
  const n = u.models;
  for (let i = 0; i < n; i++) {
    // wider spread than a tight huddle — keeps one splash hit from catching the whole squad
    const a = (i / n) * Math.PI * 2, d = n > 1 ? u.w * 2.2 : 0;
    const mx = clamp(x + Math.cos(a) * d, 20, ARENA.w - 20);
    const my = clamp(y + Math.sin(a) * d, 20, ARENA.h - 20);
    makeModel(b, side, unitId, mx, my, umod, squad);
  }
  return squad;
}

// ---------------------------------------------------------------------------
// Enemy force generation — budget shopping + patterned placement.
// ---------------------------------------------------------------------------
function rollComp(enc, budget) {
  const list = [];
  const entries = Object.entries(enc.comp);
  let guard = 0, left = budget;
  while (left > 0 && guard++ < 200) {
    const affordable = entries.filter(([id]) => UNITS[id].pts <= left);
    if (!affordable.length) break;
    let total = 0; for (const [, w] of affordable) total += w;
    let roll = Math.random() * total, chosen = affordable[0][0];
    for (const [id, w] of affordable) { roll -= w; if (roll <= 0) { chosen = id; break; } }
    list.push(chosen);
    left -= UNITS[chosen].pts;
  }
  return list;
}

function placeEnemyForce(b, budget, initial) {
  const enc = b.enc;
  const comp = rollComp(enc, budget);
  // sort: heavies center-front, ranged behind, chaff outside
  comp.sort((a, bb) => UNITS[bb].pts - UNITS[a].pts);
  const zoneX0 = ARENA.w - ARENA.enemyW, zoneX1 = ARENA.w - 110;
  let i = 0;
  for (const unitId of comp) {
    const u = UNITS[unitId];
    let x, y;
    if (!initial) {                                   // reinforcement wave: walk in from the east edge
      x = ARENA.w - 30; y = rand(80, ARENA.h - 80);
    } else if (u.struct) {
      x = rand(zoneX1 - 120, zoneX1); y = ARENA.h / 2 + rand(-160, 160);
    } else if (enc.style === 'flank' && i % 3 === 2) {
      x = rand(zoneX0, zoneX0 + 140); y = i % 2 ? rand(50, 150) : rand(ARENA.h - 150, ARENA.h - 50);
    } else if (enc.style === 'swarm') {
      x = rand(zoneX0, zoneX1); y = rand(60, ARENA.h - 60);
    } else {                                          // line: ranged back, melee front
      const ranged = u.rng > 80;
      x = ranged ? rand(zoneX0 + 180, zoneX1) : rand(zoneX0, zoneX0 + 160);
      y = ARENA.h / 2 + (i % 2 ? 1 : -1) * (30 + i * 26) % (ARENA.h * 0.42);
    }
    spawnSquad(b, 'enemy', unitId, clamp(x, zoneX0, ARENA.w - 30), clamp(y, 40, ARENA.h - 40), false, null);
    i++;
  }
  if (initial && enc.boss) {
    const bossSquad = spawnSquad(b, 'enemy', enc.boss, ARENA.coreE.x - 120, ARENA.h / 2, false, null);
    bossSquad.boss = true;
  }
}

// ---------------------------------------------------------------------------
// Queries & effective stats
// ---------------------------------------------------------------------------
function foesOf(b, e) {
  const s = e.side === 'player' ? 'enemy' : 'player';
  return b.ents.filter(o => o.side === s && !o.dead);
}
function canHit(attacker, target) {
  if (target.fly && !attacker.air && !attacker.core) return false;
  return true;
}
function featAt2(b, x, y, type) {
  for (const f of b.feats) {
    if (f.t !== type) continue;
    if (dist2(x, y, f.x, f.y) < f.r * f.r) return f;
  }
  return null;
}

function effSpd(b, e) {
  let s = e.spd;
  if (e.slow && b.t < e.slow.until) s *= e.slow.mult;
  if (e.frenzy > b.t) s *= FRENZY.spdMult;
  const host = featAt2(b, e.x, e.y, 'hostile');
  if (host) {
    const fx = TERRAIN_FX.hostile[b.fac];
    if (e.side === 'enemy' && fx.spd) s *= fx.spd;
    if (e.side === 'player' && fx.foeSlow && !e.fly) s *= fx.foeSlow;
  }
  return s;
}
function effRng(b, e) {
  let r = e.rng;
  if (!e.fly && featAt2(b, e.x, e.y, 'ridge')) r *= (e.side === 'player' ? b.hooks.ridgeBonus : TERRAIN_FX.ridgeRange);
  if (e.side === 'player') {
    for (const a of b.ents) {
      if (a.dead || a.side !== 'player' || !a.aura) continue;
      if (dist2(a.x, a.y, e.x, e.y) < a.aura.rng * a.aura.rng) { r *= 1 + a.aura.rngBoost; break; }
    }
  }
  return r;
}
function effDmg(b, e) {
  let d = e.dmg;
  if (e.frenzy > b.t) d *= FRENZY.dmgMult;
  if (e.side === 'enemy') {
    const host = featAt2(b, e.x, e.y, 'hostile');
    if (host && TERRAIN_FX.hostile[b.fac].dmg) d *= TERRAIN_FX.hostile[b.fac].dmg;
  } else if (b.hooks.hqAura && dist2(e.x, e.y, b.hq.x, b.hq.y) < b.hooks.hqAura.rng ** 2) {
    d *= b.hooks.hqAura.dmg;
  }
  return d;
}
function effRof(b, e) {
  let r = e.rof;
  if (e.frenzy > b.t) r *= FRENZY.dmgMult;
  return r;
}
// Defensive auras (e.g. Rampart): strongest nearby armor aura on the target's own side.
function auraArmorMult(b, target) {
  let mult = 1;
  for (const a of b.ents) {
    if (a.dead || a === target || a.side !== target.side || !a.aura || !a.aura.armor) continue;
    if (dist2(a.x, a.y, target.x, target.y) < a.aura.rng * a.aura.rng) mult = Math.min(mult, a.aura.armor);
  }
  return mult;
}

// ---------------------------------------------------------------------------
// Damage & death
// ---------------------------------------------------------------------------
function dealDamage(b, target, amt, source) {
  if (target.dead) return;
  if (target.dodge && Math.random() < target.dodge) {
    b.fx.push({ kind: 'miss', x: target.x, y: target.y - 12, ttl: 0.5 });
    return;
  }
  const rangedHit = source && source.rng > 70;
  if (!target.fly && !target.struct && rangedHit && featAt2(b, target.x, target.y, 'ruins')) {
    amt *= target.side === 'player' ? b.hooks.ruinsGuard : TERRAIN_FX.ruinsGuard;
  }
  if (target.core && target.side === 'player') amt *= b.hooks.hqArmor;
  amt *= auraArmorMult(b, target);
  if (amt <= 0) return;
  // last stand: once per battle a player squad refuses to die
  if (target.side === 'player' && target.squad && target.squad.alive === 1 &&
      target.hp - amt <= 0 && b.hooks.lastStand && !b.lastStandUsed) {
    b.lastStandUsed = true;
    target.hp = 1;
    b.fx.push({ kind: 'lastStand', x: target.x, y: target.y, ttl: 1.2 });
    return;
  }
  target.hp -= amt;
  target.hitT = b.t;
  if (target.hp <= 0) killEnt(b, target, source);
}

function killEnt(b, e, source) {
  if (e.dead) return;
  e.dead = true;
  b.fx.push({ kind: e.w > 16 ? 'bigDeath' : 'death', x: e.x, y: e.y, fac: e.fac, w: e.w, ttl: 0.8 });
  if (e.core) {
    b.shake = Math.min(1.5, b.shake + 1.2);
    b.result = e.side === 'enemy' ? 'win' : 'loss';
    b.over = true;
    return;
  }
  b.shake = Math.min(1.5, b.shake + (e.w > 16 ? 0.5 : 0.1));
  if (e.squad) {
    e.squad.alive--;
    if (e.squad.alive <= 0 && e.squad.rosterIdx != null) b.wiped.push(e.squad.rosterIdx);
    if (e.squad.boss || (b.enc.elite && e.boss)) { /* noop */ }
  }
  if (e.side === 'enemy' && (e.boss || e.w >= 18) && b.hooks.eliteBounty) {
    b.run.scrap += b.hooks.eliteBounty;
    b.fx.push({ kind: 'scrapPop', x: e.x, y: e.y, amt: b.hooks.eliteBounty, ttl: 1 });
  }
  // Syndicate kill bounty: every enemy point destroyed accrues scrap (paid on victory)
  if (e.side === 'enemy' && b.fpk.killBounty && e.unitId) {
    const u = UNITS[e.unitId];
    b.bounty += (u.pts / u.models) * b.fpk.killBounty;
  }
  if (e.deathSpawn) {
    for (let i = 0; i < e.deathSpawn.n; i++)
      makeModel(b, e.side, e.deathSpawn.unit, e.x + rand(-14, 14), e.y + rand(-14, 14), null,
        e.squad && e.squad.side === e.side ? null : null);
  }
  if (e.deathBurst) {
    b.fx.push({ kind: 'burst', x: e.x, y: e.y, r: e.deathBurst.rng, fac: e.fac, ttl: 0.5 });
    for (const o of foesOf(b, e)) {
      if (!o.fly && dist2(o.x, o.y, e.x, e.y) < e.deathBurst.rng ** 2) dealDamage(b, o, e.deathBurst.dmg, e);
    }
  }
  if (e.fac === 'pact') {
    for (const o of b.ents) {
      if (o.dead || o.fac !== 'pact' || o === e) continue;
      if (dist2(o.x, o.y, e.x, e.y) < FRENZY.rng ** 2) o.frenzy = b.t + FRENZY.dur;
    }
  }
  if (e.side === 'player' && !e.struct) {
    const req = b.ents.find(o => o.raiseDead && !o.dead);
    if (req && Math.random() < 0.4) {
      makeModel(b, 'enemy', 'husk', e.x, e.y, null, null);
      b.fx.push({ kind: 'raise', x: e.x, y: e.y, ttl: 0.8 });
    }
  }
}

// ---------------------------------------------------------------------------
// The tick
// ---------------------------------------------------------------------------
function simTick(b, dt) {
  if (b.over || b.phase !== 'fight') return;
  b.t += dt;
  b.shake = Math.max(0, b.shake - dt * 2.2);
  b.reserveCdT = Math.max(0, b.reserveCdT - dt);

  // reinforcement waves (max 3 — a stalled battle must stay winnable)
  if (b.t >= b.nextWave && (b.waveCount || 0) < 3) {
    b.nextWave += 35;
    b.waveCount = (b.waveCount || 0) + 1;
    placeEnemyForce(b, b.enc.waves, false);
    b.fx.push({ kind: 'waveWarn', ttl: 2.2 });
  }

  for (const e of b.ents) {
    if (e.dead || e.core) continue;
    e.cd -= dt;

    // hostile ground regen for the act's own faction
    if (e.side === 'enemy') {
      const host = featAt2(b, e.x, e.y, 'hostile');
      if (host && TERRAIN_FX.hostile[b.fac].regen)
        e.hp = Math.min(e.maxhp, e.hp + e.maxhp * TERRAIN_FX.hostile[b.fac].regen * dt);
    }

    // spawner abilities
    if (e.spawn) {
      e.spawnT -= dt;
      if (e.spawnT <= 0) {
        e.spawnT = e.spawn.every;
        const m = makeModel(b, e.side, e.spawn.unit,
          e.x + rand(-24, 24), e.y + rand(-24, 24), null, null);
        b.fx.push({ kind: 'spawnFx', x: m.x, y: m.y, fac: e.fac, ttl: 0.5 });
      }
    }

    // heal aura
    if (e.heal) {
      for (const a of b.ents) {
        if (a.dead || a.side !== e.side || a === e || a.core || a.heal) continue;
        if (dist2(a.x, a.y, e.x, e.y) < e.healRng ** 2 && a.hp < a.maxhp) {
          a.hp = Math.min(a.maxhp, a.hp + e.heal * dt);
          if (Math.random() < dt * 1.6) b.fx.push({ kind: 'healTick', x: a.x, y: a.y - 12, ttl: 0.5 });
        }
      }
    }

    // ---- target acquisition: nearest hittable foe (cores are last resort) ----
    const rng = effRng(b, e);
    let best = null, bestD = Infinity;
    for (const o of foesOf(b, e)) {
      if (!canHit(e, o)) continue;
      let d = Math.sqrt(dist2(e.x, e.y, o.x, o.y)) - o.w;
      if (o.core) d += 220;              // prefer the army over the core
      if (d < bestD) { bestD = d; best = o; }
    }
    if (!best) continue;
    const realD = Math.sqrt(dist2(e.x, e.y, best.x, best.y)) - best.w;
    const inRange = realD <= rng && (!e.minRng || realD >= e.minRng);
    const tooClose = e.minRng && realD < e.minRng;

    // face the action
    const ta = Math.atan2(best.y - e.y, best.x - e.x);
    let da = ta - e.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    e.angle += clamp(da, -5 * dt, 5 * dt);

    if (inRange && e.dmg > 0) {
      if (e.cd <= 0) {
        const rof = effRof(b, e);
        e.cd = rof > 0 ? 1 / rof : 999;
        e.attackT = b.t;
        const dmg = effDmg(b, e);
        b.fx.push({
          kind: rng > 70 ? 'tracer' : 'slash',
          x0: e.x + Math.cos(e.angle) * e.w, y0: e.y + Math.sin(e.angle) * e.w,
          x1: best.x, y1: best.y, fac: e.fac, heavy: dmg > 25,
          ttl: rng > 70 ? 0.16 : 0.2,
        });
        if (e.splash > 0) {
          b.fx.push({ kind: 'burst', x: best.x, y: best.y, r: e.splash, fac: e.fac, ttl: 0.4 });
          for (const o of foesOf(b, e)) {
            if (o.fly !== best.fly && !o.core) continue;
            if (dist2(o.x, o.y, best.x, best.y) < e.splash ** 2) dealDamage(b, o, dmg, e);
          }
        } else {
          dealDamage(b, best, dmg, e);
        }
        if (e.slowHit && !best.dead) best.slow = { mult: e.slowHit.mult, until: b.t + e.slowHit.dur };
      }
    } else if (e.spd > 0 && !e.struct) {
      // bosses guard the core until awakened
      if (e.boss && b.t < 60 && realD > 420) continue;
      // healers just shadow the front line
      let gx = best.x, gy = best.y, back = false;
      if (e.dmg === 0 && e.heal) {
        let wounded = null, wd = Infinity;
        for (const a of b.ents) {
          if (a.dead || a.side !== e.side || a === e || a.core || a.heal) continue;
          const d = dist2(a.x, a.y, e.x, e.y) + (a.hp < a.maxhp ? 0 : 1e7);
          if (d < wd) { wd = d; wounded = a; }
        }
        if (wounded) { gx = wounded.x; gy = wounded.y;
          if (dist2(e.x, e.y, gx, gy) < (e.healRng * 0.6) ** 2) continue; }
        else continue;
      } else if (e.side === 'player' && e.squad && e.squad.hold && !tooClose) {
        // Hold stance: stand your ground — only fall back if something got inside min range.
        gx = e.x; gy = e.y;
      }
      if (tooClose) back = true;
      const spd = effSpd(b, e);
      let vx = gx - e.x, vy = gy - e.y;
      const vl = Math.hypot(vx, vy) || 1;
      vx = vx / vl * spd * dt * (back ? -0.7 : 1);
      vy = vy / vl * spd * dt * (back ? -0.7 : 1);
      // separation from other ground bodies
      if (!e.fly) {
        for (const o of b.ents) {
          if (o.dead || o === e || o.fly || o.core) continue;
          const dd = dist2(o.x, o.y, e.x, e.y), md = (o.w + e.w) * 0.9;
          if (dd < md * md && dd > 0.01) {
            const d = Math.sqrt(dd), push = (md - d) / md;
            vx += (e.x - o.x) / d * push * spd * dt * 0.9;
            vy += (e.y - o.y) / d * push * spd * dt * 0.9;
          }
        }
      }
      let nx = e.x + vx, ny = e.y + vy;
      // impassable crags (ground units slide around)
      if (!e.fly) {
        for (const r of b.rocks) {
          const dd = dist2(nx, ny, r.x, r.y), rr = r.r * 0.82 + e.w;
          if (dd < rr * rr) {
            const d = Math.sqrt(dd) || 1;
            nx = r.x + (nx - r.x) / d * rr;
            ny = r.y + (ny - r.y) / d * rr;
          }
        }
      }
      e.x = clamp(nx, 16, ARENA.w - 16);
      e.y = clamp(ny, 16, ARENA.h - 16);
      e.movingT = b.t;
    }
  }

  // player has nothing on the field and nothing to drop → the line is lost
  if (!b.over) {
    const anyPlayer = b.ents.some(e => e.side === 'player' && !e.dead && !e.core);
    const reservesLeft = b.deployed && b.deployed.some((d, i) => !d && !b.wiped.includes(i));
    if (!anyPlayer && (!reservesLeft || b.reserveLeft <= 0)) {
      b.result = 'loss'; b.over = true;
    }
  }

  for (const f of b.fx) f.ttl -= dt;
  b.fx = b.fx.filter(f => f.ttl > 0);
  b.ents = b.ents.filter(e => !e.dead || e.core);
}
