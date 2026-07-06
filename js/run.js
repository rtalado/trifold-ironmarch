// ============================================================================
// TRIFOLD: IRONMARCH — the run layer
// Node map, squad rewards, shop, field camps, events, act progression.
// ============================================================================
'use strict';

const Run = {
  // ------------------------------------------------------------------
  start() {
    G.run = {
      roster: STARTER_ROSTER.map(id => ({ id, up: false })),
      relics: [], scrap: 45,
      act: 0, floor: -1, pos: 0,
      map: null, seen: [],
    };
    this.genMap();
    G.screen = 'map';
    UI.showMap();
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
    const proj = n === 1 ? (m - 1) / 2 : r.pos * (m - 1) / (n - 1);
    return next.filter(node => Math.abs(node.i - proj) <= 1);
  },

  enterNode(node) {
    const r = G.run;
    r.floor = node.fl; r.pos = node.i; node.done = true;
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
    };
    if (reward.relic) r.relics.push(reward.relic);
    UI.showReward(reward);
  },

  afterReward(isBoss) {
    const r = G.run;
    if (isBoss) {
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
    if (res.scrap) { r.scrap = Math.max(0, r.scrap + res.scrap); out.push(`${res.scrap > 0 ? '+' : ''}${res.scrap} scrap`); }
    if (res.relic) { const rl = this.randomRelic(); if (rl) { r.relics.push(rl); out.push(`Gained: ${RELICS[rl].name}`); } }
    if (res.squad) {
      let id = res.squad;
      if (id === 'uncommon' || id === 'rare' || id === 'common') {
        const pool = Meta.pool().filter(c => SQUADS[c].rar === id);
        id = pool.length ? pick(pool) : pick(Meta.pool());
      }
      const hooks = aggHooks(r.relics);
      const up = !!res.upgraded || hooks.recruitUp;
      r.roster.push({ id, up });
      out.push(`Recruited: ${UNITS[id].name}${up ? ' ★' : ''}`);
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
