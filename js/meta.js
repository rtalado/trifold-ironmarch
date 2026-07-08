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
    this.data = Object.assign({
      runs: 0, wins: 0, bestAct: 0, unlocked: [],
      bestEndlessLevel: 0, bestNightmareLevel: 0, nightmareUnlocked: false,
    }, this.data || {});
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

  // squad ids available in rewards & shops for the given (or current run's) faction
  pool(fac) {
    fac = fac || (G.run && G.run.fac) || 'vanguard';
    return basePool(fac).concat(this.data.unlocked.filter(id => UNITS[id].fac === fac));
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
          if (!d.unlocked.includes(s)) {
            d.unlocked.push(s);
            news.push({ squad: s, label: u.label });
          }
        }
      }
    }
    this.save();
    return news;
  },

  // called live as the player advances floors in Endless/Nightmare (not just
  // at run end) — returns true the moment Nightmare unlocks, so the caller
  // can flag the current run to show the banner on its eventual game-over.
  recordEndlessProgress(mode, depth) {
    const d = this.data;
    let justUnlocked = false;
    if (mode === 'endless') {
      if (depth > d.bestEndlessLevel) d.bestEndlessLevel = depth;
      if (depth >= 100 && !d.nightmareUnlocked) { d.nightmareUnlocked = true; justUnlocked = true; }
    } else if (mode === 'nightmare') {
      if (depth > d.bestNightmareLevel) d.bestNightmareLevel = depth;
    }
    this.save();
    return justUnlocked;
  },
};
