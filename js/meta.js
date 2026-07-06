// ============================================================================
// TRIFOLD: IRONMARCH — meta progression (localStorage)
// ============================================================================
'use strict';

const Meta = {
  KEY: 'ironmarch_meta_v2',
  SKEY: 'ironmarch_settings_v1',
  data: null,
  settings: null,
  lastUnlocks: [],

  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)) || null; } catch (e) { this.data = null; }
    if (!this.data) this.data = { runs: 0, wins: 0, bestAct: 0, unlocked: [] };
    let s = null;
    try { s = JSON.parse(localStorage.getItem(this.SKEY)); } catch (e) {}
    this.settings = Object.assign({ shake: true, haptics: true, holdMs: 450 }, s || {});
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
  },
  saveSettings() {
    try { localStorage.setItem(this.SKEY, JSON.stringify(this.settings)); } catch (e) {}
  },

  // squad ids available in rewards & shops
  pool() {
    return BASE_POOL.concat(this.data.unlocked);
  },

  recordRunEnd(won) {
    const d = this.data;
    d.runs++;
    if (won) d.wins++;
    if (G.run) d.bestAct = Math.max(d.bestAct, G.run.act + 1);
    const news = [];
    for (const u of META_UNLOCKS) {
      const met = (!u.need.runs || d.runs >= u.need.runs) && (!u.need.wins || d.wins >= u.need.wins);
      if (met) {
        for (const s of u.squads) {
          if (!d.unlocked.includes(s) && !BASE_POOL.includes(s)) {
            d.unlocked.push(s);
            news.push({ squad: s, label: u.label });
          }
        }
      }
    }
    this.save();
    return news;
  },
};
