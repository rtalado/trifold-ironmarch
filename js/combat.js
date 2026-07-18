// ============================================================================
// TRIFOLD: IRONMARCH — the combat controller
// Placement phase, reserve drops, battle lifecycle & permadeath accounting.
// ============================================================================
'use strict';

function startBattle(encId) {
  const run = G.run;
  const b = newBattle(encId, run);
  b.deployed = run.roster.map(() => false);   // roster index → on the field?
  b.selected = null;                          // roster index being placed
  b.endT = 0;
  G.battle = b;
  G.screen = 'battle';
  UI.enterBattle(b);
}

// valid drop point inside the deployment zone?
function validPlace(b, x, y, unitId) {
  if (x < 30 || x > ARENA.deployW || y < 30 || y > ARENA.h - 30) return false;
  const u = UNITS[unitId];
  if (!u.fly) {
    for (const r of b.rocks) if (dist2(x, y, r.x, r.y) < (r.r * 0.82 + u.w) ** 2) return false;
  }
  if (dist2(x, y, b.hq.x, b.hq.y) < (b.hq.w + u.w + 14) ** 2) return false;
  return true;
}

// snap to the placement grid
function snapGrid(x, y) {
  const c = ARENA.cell;
  return { x: Math.round(x / c) * c, y: Math.round(y / c) * c };
}

// Click on the field during placement (or during battle with a reserve armed).
function fieldClick(b, wx, wy) {
  if (b.abilityArmed) {
    b.abilityArmed = false;
    if (!triggerAbility(b, wx, wy)) UI.hint('Artillery support unavailable');
    UI.refreshBattleHUD(b);
    return;
  }
  if (b.selected == null) return;
  const i = b.selected;
  const entry = G.run.roster[i];
  if (!entry || b.deployed[i] || b.wiped.includes(i)) { b.selected = null; UI.refreshTray(b); return; }
  const p = snapGrid(wx, wy);
  if (!validPlace(b, p.x, p.y, entry.id)) { UI.hint('Deploy inside your zone — clear of crags and the HQ'); return; }

  if (b.phase === 'place') {
    const squad = spawnSquad(b, 'player', entry.id, p.x, p.y, entry.up, i, b.stance);
    b.deployed[i] = true;
    b.selected = null;
    b.fx.push({ kind: 'deploy', x: p.x, y: p.y, ttl: 0.5 });
  } else if (b.phase === 'fight' && !b.over) {
    if (b.reserveLeft <= 0) { UI.hint('No reserve drops left'); return; }
    if (b.reserveCdT > 0) { UI.hint('Reserves recharging…'); return; }
    spawnSquad(b, 'player', entry.id, p.x, p.y, entry.up, i, b.stance);
    b.deployed[i] = true;
    b.selected = null;
    b.reserveLeft--;
    b.reserveCdT = ECON.reserveCd * b.hooks.reserveCdMult;
    b.fx.push({ kind: 'dropPods', x: p.x, y: p.y, ttl: 0.9 });
    b.shake = Math.min(1.5, b.shake + 0.25);
  }
  UI.refreshTray(b);
}

// Right-click a deployed squad during placement to take it back off the field.
function fieldUnplace(b, wx, wy) {
  if (b.phase !== 'place') return;
  let hit = null, hd = 1e9;
  for (const e of b.ents) {
    if (e.dead || e.side !== 'player' || e.core || !e.squad) continue;
    const d = dist2(e.x, e.y, wx, wy);
    if (d < hd && d < 40 * 40) { hd = d; hit = e; }
  }
  if (!hit) return;
  const idx = hit.squad.rosterIdx;
  b.ents = b.ents.filter(e => e.squad !== hit.squad);
  b.squads = b.squads.filter(s => s !== hit.squad);
  if (idx != null) b.deployed[idx] = false;
  UI.refreshTray(b);
}

function beginFight(b) {
  if (b.phase !== 'place') return;
  if (!b.ents.some(e => e.side === 'player' && !e.core && !e.dead)) {
    UI.hint('Deploy at least one squad'); return;
  }
  const heldBack = G.run.roster.some((_, idx) => !b.deployed[idx] && !b.wiped.includes(idx));
  b.phase = 'fight';
  b.selected = null;
  UI.enterFight(b);
  if (!heldBack) UI.hint('No squads held back — reserve drops unavailable this fight');
}

// ---------------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------------
function battleTick(dt) {
  const b = G.battle; if (!b) return;
  if (b.phase !== 'fight') return;
  if (!b.over) {
    simTick(b, dt);
    UI.refreshBattleHUD(b);
  } else {
    b.endT += dt;
    if (b.endT > 1.5) finishBattle(b);
  }
}

function finishBattle(b) {
  G.battle = null;
  const run = G.run;

  // permadeath: strike wiped squads from the roster (indices descending)
  const lost = [...new Set(b.wiped)].sort((a, z) => z - a);
  const lostNames = lost.map(i => squadName(run.roster[i]));

  // Brutal Mode: surviving squads carry their remaining models/HP into the next
  // battle instead of healing up fully. Off by default — see FACTIONS/Run.start.
  for (const squad of b.squads) {
    if (squad.side !== 'player' || squad.rosterIdx == null || lost.includes(squad.rosterIdx)) continue;
    const entry = run.roster[squad.rosterIdx]; if (!entry) continue;
    if (!run.brutal) { delete entry.dmg; continue; }
    const ents = b.ents.filter(e => e.squad === squad && !e.dead);
    if (!ents.length) continue;
    const totalHp = ents.reduce((s, e) => s + e.hp, 0);
    const totalMax = ents.reduce((s, e) => s + e.maxhp, 0);
    entry.dmg = { alive: ents.length, hpFrac: clamp(totalHp / totalMax, 0.01, 1) };
  }
  // Syndicate severance: wiped squads refund part of their price (before the splice)
  let severance = 0;
  if (b.fpk.severance) {
    for (const i of lost) {
      const entry = run.roster[i];
      severance += Math.round(squadPrice(entry.id) * b.fpk.severance * (entry.up ? 1.3 : 1));
    }
  }
  for (const i of lost) run.roster.splice(i, 1);

  if (b.result === 'win') {
    // masonry rent + unit-level rents from emplacements still standing
    let rent = 0;
    for (const e of b.ents) {
      if (e.dead || e.side !== 'player' || !e.struct) continue;
      rent += (b.fpk.structRent || 0) + (UNITS[e.unitId] && UNITS[e.unitId].rent || 0);
    }
    const scrap = Math.round((ECON.scrapWinBase + b.enc.tier * 9 + (b.enc.elite ? 18 : 0) + (b.enc.boss ? 35 : 0)
                + Math.floor(rand(0, 8)) + b.hooks.scrapAdd
                + Math.round(b.bounty || 0) + severance + rent) * b.hooks.scrapMult);
    run.scrap += scrap;
    Run.afterVictory(b, scrap, lostNames);
  } else {
    Meta.lastUnlocks = Meta.recordRunEnd(false);
    UI.showGameOver(b, lostNames);
  }
}
