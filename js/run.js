// ============================================================================
// TRIFOLD: IRONMARCH — the run layer
// Node map, squad rewards, shop, field camps, events, act progression.
// ============================================================================
'use strict';

// Endless/Nightmare tuning — see Run.genEndlessMap / genEndlessEncounter.
const ENDLESS = {
  BATCH: 24,        // floors generated per batch
  REFILL_AT: 10,     // regenerate another batch once this many floors remain ahead
  LOOKAHEAD: 2,       // fog of war: nodes visible ahead of the player (ui.js)
  BACK_WINDOW: 2,      // fog of war: recently-cleared nodes still shown (ui.js)
  RESTGAP: 6,           // force a rest node if none has appeared in this many floors
};

const Run = {
  // ------------------------------------------------------------------
  start(fac, brutal, mode) {
    fac = FACTIONS[fac] ? fac : 'vanguard';
    mode = (mode === 'endless' || mode === 'nightmare') ? mode : 'campaign';
    G.run = {
      fac, brutal: !!brutal, mode,
      roster: FACTIONS[fac].start.map(id => ({ id, up: false })),
      relics: [], scrap: 45,
      act: 0, floor: -1, pos: 0,
      map: null, seen: [],
      sinceRest: 0,
    };
    if (mode === 'campaign') this.genMap(); else this.genEndlessMap();
    G.screen = 'map';
    UI.showMap();
  },

  // ------------------------------------------------------------------
  // ENDLESS / NIGHTMARE — one continuous, ever-widening, fogged map that
  // mixes all three enemy factions node-by-node (or, in Nightmare, is the
  // Virulent Strain exclusively). Generated in batches so the map is
  // functionally infinite without pre-building hundreds of floors.
  // ------------------------------------------------------------------
  genEndlessMap() {
    G.run.map = [];
    G.run.sinceRest = 0;
    this.growEndlessMap(ENDLESS.BATCH);
    G.run.floor = -1;
    G.run.pos = 0;
  },

  growEndlessMap(count) {
    const r = G.run;
    const map = r.map;
    const facPool = r.mode === 'nightmare' ? ['strain'] : ['myriad', 'choir', 'pact'];
    const start = map.length;
    for (let fl = start; fl < start + count; fl++) {
      const isBoss = (fl + 1) % 10 === 0;
      const isElite = !isBoss && (fl + 1) % 5 === 0;
      const lanes = Math.min(6, 3 + Math.floor(fl / 20));
      const n = isBoss ? 1 : (fl === 0 ? 2 : lanes);
      const row = [];
      for (let i = 0; i < n; i++) {
        let type;
        if (isBoss) type = 'boss';
        else if (isElite) type = 'elite';
        else if (fl === 0) type = 'battle';
        else {
          const roll = Math.random();
          if (roll < 0.52) type = 'battle';
          else if (roll < 0.68) type = 'event';
          else if (roll < 0.84) type = 'shop';
          else if (roll < 0.94) type = 'rest';
          else type = 'treasure';
        }
        const node = { type, fl, i, done: false };
        if (type === 'battle' || type === 'elite' || type === 'boss') node.fac = pick(facPool);
        row.push(node);
      }
      if (!isBoss && !isElite) {
        if (row.some(nd => nd.type === 'rest')) r.sinceRest = 0;
        else if (++r.sinceRest > ENDLESS.RESTGAP) { row[0].type = 'rest'; delete row[0].fac; r.sinceRest = 0; }
      }
      map.push(row);
    }
  },

  // called on every endless/nightmare node entry — keeps floors ahead of the player
  ensureEndlessFloors() {
    const r = G.run;
    if (r.map.length - r.floor <= ENDLESS.REFILL_AT) this.growEndlessMap(ENDLESS.BATCH);
  },

  // procedurally builds an ENCOUNTERS-shaped object for the given faction/depth/kind
  genEndlessEncounter(fac, depth, kind) {
    const base = { battle: 18, elite: 27, boss: 34 }[kind];
    const budget = Math.round(base + depth * 2.0 + depth * depth * 0.018);
    const waves = Math.round(budget * 0.42);
    const coreHP = Math.min(3.2, 0.85 + depth * 0.01);
    const tier = Math.min(4, Math.floor(depth / 12));
    const heavyGate = depth >= 15;
    const pool = Object.keys(UNITS).filter(id => UNITS[id].fac === fac && !UNITS[id].boss);
    pool.sort((a, bId) => UNITS[a].pts - UNITS[bId].pts);
    const lockedOut = heavyGate ? 0 : Math.min(2, pool.length - 1);
    const comp = {};
    pool.forEach((id, idx) => {
      if (idx >= pool.length - lockedOut) return;    // heaviest units stay locked pre-depth15
      comp[id] = Math.max(1, 12 - UNITS[id].pts);     // cheaper units weighted higher
    });
    // deep-road escalation: past depth 35, elite packs can field the faction's
    // boss unit as a rare line entry (budget affordability keeps it bounded)
    if (kind === 'elite' && depth >= 35) comp[BOSS_UNIT[fac]] = 1;
    const enc = { fac, tier, budget, waves, style: pick(['line', 'swarm', 'flank']), coreHP, comp };
    if (kind === 'elite') enc.elite = true;
    if (kind === 'boss') { enc.boss = BOSS_UNIT[fac]; enc.budget = Math.round(enc.budget * 0.7); }
    return enc;
  },

  // ------------------------------------------------------------------
  genMap() {
    const act = ACTS[G.run.act];
    const floors = [];
    for (let fl = 0; fl < act.floors; fl++) {
      const isLast = fl === act.floors - 1;
      const n = isLast ? 1 : (fl === 0 ? 2 : 2 + Math.floor(Math.random() * 2));
      const row = [];
      for (let i = 0; i < n; i++) {
        let type = 'battle';
        if (isLast) type = 'boss';
        else if (fl === 0) type = 'battle';
        else if (fl === act.floors - 2) type = i === 0 ? 'rest' : (Math.random() < 0.5 ? 'battle' : 'shop');
        else {
          const r = Math.random();
          if (r < 0.52) type = 'battle';
          else if (r < 0.68) type = 'event';
          else if (r < 0.78 && fl >= 2) type = 'elite';
          else if (r < 0.86) type = 'shop';
          else if (r < 0.95) type = 'rest';
          else type = 'treasure';
        }
        row.push({ type, fl, i, done: false });
      }
      floors.push(row);
    }
    G.run.map = floors;
    G.run.floor = -1;
    G.run.pos = 0;
  },

  choices() {
    const r = G.run;
    if (r.floor < 0) return r.map[0];
    if (r.floor >= r.map.length - 1) return [];
    const next = r.map[r.floor + 1];
    if (next.length === 1) return next;
    const cur = r.map[r.floor], n = cur.length, m = next.length;
    if (n === 1) return next;   // a chokepoint (boss floor) fans out to every lane
    const proj = r.pos * (m - 1) / (n - 1);
    return next.filter(node => Math.abs(node.i - proj) <= 1);
  },

  enterNode(node) {
    const r = G.run;
    r.floor = node.fl; r.pos = node.i; node.done = true;
    if (r.mode !== 'campaign') {
      if (Meta.recordEndlessProgress(r.mode, r.floor + 1)) r.nightmareUnlockedThisRun = true;
      this.ensureEndlessFloors();
    }
    if (r.mode !== 'campaign' && (node.type === 'battle' || node.type === 'elite' || node.type === 'boss')) {
      startBattle(this.genEndlessEncounter(node.fac, node.fl, node.type));
      return;
    }
    const act = ACTS[r.act];
    switch (node.type) {
      case 'battle': startBattle(pick(act.normals)); break;
      case 'elite':  startBattle(act.elite); break;
      case 'boss':   startBattle(act.boss); break;
      case 'event':  this.runEvent(); break;
      case 'shop':   UI.showShop(this.shopStock()); break;
      case 'rest':   UI.showRest(); break;
      case 'treasure': {
        const relic = this.randomRelic();
        if (relic) r.relics.push(relic);
        UI.showTreasure(relic);
        break;
      }
    }
  },

  // ------------------------------------------------------------------
  afterVictory(b, scrap, lostNames) {
    const r = G.run;
    const enc = b.enc;
    const isBoss = !!enc.boss;
    const reward = {
      scrap, lostNames,
      squads: this.squadOptions(isBoss ? 'boss' : enc.elite ? 'elite' : 'normal'),
      relic: (enc.elite || isBoss) ? this.randomRelic() : null,
      isBoss,
      round: 1,
      // a boss fight costs the column dearly — replenish with 3 recruitment
      // rounds instead of the usual 1
      rounds: isBoss ? 3 : 1,
    };
    if (reward.relic) r.relics.push(reward.relic);
    UI.showReward(reward);
  },

  // rw is the reward object just resolved (card picked, or skipped)
  afterReward(rw) {
    const r = G.run;
    if (rw.isBoss && rw.round < rw.rounds) {
      UI.showReward({
        scrap: 0, lostNames: null,
        squads: this.squadOptions('boss'),
        relic: null,
        isBoss: true,
        round: rw.round + 1,
        rounds: rw.rounds,
      });
      return;
    }
    if (rw.isBoss && r.mode === 'campaign') {
      r.act++;
      if (r.act >= ACTS.length) {
        Meta.lastUnlocks = Meta.recordRunEnd(true);
        UI.showVictory();
        return;
      }
      this.genMap();
    }
    G.screen = 'map';
    UI.showMap();
  },

  // ------------------------------------------------------------------
  squadOptions(quality) {
    const pool = Meta.pool();
    const weights = quality === 'boss' ? { common: 15, uncommon: 50, rare: 35 }
                  : quality === 'elite' ? { common: 30, uncommon: 50, rare: 20 }
                  : { common: 58, uncommon: 34, rare: 8 };
    const opts = [];
    let guard = 0;
    while (opts.length < 3 && guard++ < 200) {
      const roll = Math.random() * 100;
      let want = 'common';
      if (roll > weights.common) want = 'uncommon';
      if (roll > weights.common + weights.uncommon) want = 'rare';
      const candidates = pool.filter(id => SQUADS[id].rar === want && !opts.includes(id));
      if (!candidates.length) continue;
      opts.push(pick(candidates));
    }
    return opts;
  },

  randomRelic(extraExclude) {
    const owned = G.run.relics.concat(extraExclude || []);
    const avail = Object.keys(RELICS).filter(id => !owned.includes(id));
    return avail.length ? pick(avail) : null;
  },

  shopStock() {
    const hooks = aggHooks(G.run.relics);
    const stock = { squads: [], relics: [], drillCost: Math.round(55 * hooks.shopMult) };
    const pool = Meta.pool(), seen = [];
    let guard = 0;
    while (stock.squads.length < 4 && guard++ < 300) {
      const id = pick(pool);
      if (seen.includes(id)) continue;
      seen.push(id);
      stock.squads.push({ id, price: Math.round(squadPrice(id) * hooks.shopMult * rand(0.92, 1.08)) });
    }
    for (let i = 0; i < 2; i++) {
      const rl = this.randomRelic(stock.relics.map(x => x.id));
      if (rl) stock.relics.push({ id: rl, price: Math.round(140 * hooks.shopMult * rand(0.9, 1.1)) });
    }
    return stock;
  },

  // ------------------------------------------------------------------
  runEvent() {
    const r = G.run;
    const avail = EVENTS.filter(e => !r.seen.includes(e.id));
    const ev = avail.length ? pick(avail) : pick(EVENTS);
    r.seen.push(ev.id);
    UI.showEvent(ev);
  },

  resolveEventChoice(ev, choice) {
    const r = G.run;
    if (choice.cost) {
      if (r.scrap < choice.cost) return false;
      r.scrap -= choice.cost;
    }
    let res = choice.result;
    if (res.random) res = pick(res.random);
    const out = [];
    // a column of one squad refuses to trade itself away — resolve before any
    // reward lands, so the deal simply falls through instead of paying out
    if (res.loseSquad === true && r.roster.length <= 1) {
      if (choice.cost) r.scrap += choice.cost;
      out.push('Your last squad refuses to go. The deal is off.');
      return out;
    }
    if (res.scrap) { r.scrap = Math.max(0, r.scrap + res.scrap); out.push(`${res.scrap > 0 ? '+' : ''}${res.scrap} scrap`); }
    if (res.relic) { const rl = this.randomRelic(); if (rl) { r.relics.push(rl); out.push(`Gained: ${RELICS[rl].name}`); } }
    if (res.squad) {
      let id = res.squad;
      if (id === 'basic') id = FACTIONS[r.fac || 'vanguard'].basic;
      if (id === 'uncommon' || id === 'rare' || id === 'common') {
        const pool = Meta.pool().filter(c => SQUADS[c].rar === id);
        id = pool.length ? pick(pool) : pick(Meta.pool());
      }
      const hooks = aggHooks(r.relics);
      const up = !!res.upgraded || hooks.recruitUp;
      r.roster.push({ id, up });
      out.push(`Recruited: ${UNITS[id].name}${up ? ' ★' : ''}`);
    }
    if (res.upgrade) {
      const cands = r.roster.map((_, i) => i).filter(i => !r.roster[i].up);
      if (cands.length) {
        const i = pick(cands);
        r.roster[i].up = true;
        out.push(`Drilled: ${squadName(r.roster[i])}`);
      }
    }
    if (res.loseSquad === 'random') {
      if (r.roster.length > 1) {
        const i = Math.floor(Math.random() * r.roster.length);
        out.push(`Lost: ${squadName(r.roster[i])}`);
        r.roster.splice(i, 1);
      } else out.push('Your last squad refuses to go.');
    } else if (res.loseSquad === true) {
      out.push('__LOSE__');
    }
    if (res.nothing || res.safe) out.push('You march on.');
    return out;
  },

  // ------------------------------------------------------------------
  addSquad(id, up) {
    const hooks = aggHooks(G.run.relics);
    G.run.roster.push({ id, up: !!up || hooks.recruitUp });
  },
  removeSquadAt(i) { G.run.roster.splice(i, 1); },
  upgradeSquadAt(i) { G.run.roster[i].up = true; },
};
