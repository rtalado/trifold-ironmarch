// ============================================================================
// TRIFOLD: IRONMARCH — game data
// Top-down placement autobattler. Everything balance lives here.
// ============================================================================
'use strict';

// ---------------------------------------------------------------------------
// Arena / economy tuning
// ---------------------------------------------------------------------------
const ARENA = {
  w: 1400, h: 760,          // world size, viewed top-down
  cell: 40,                 // placement grid
  deployW: 420,             // player deployment zone: x < deployW
  enemyW: 420,              // enemy zone: x > w - enemyW
  coreP: { x: 70, y: 380 }, // your Field HQ
  coreE: { x: 1330, y: 380 },
};

const ECON = {
  coreHPBase: 400,
  reserveDrops: 2,          // squads droppable mid-battle
  reserveCd: 12,            // seconds between reserve drops
  scrapWinBase: 25,
};

// ---------------------------------------------------------------------------
// Units.  One roster entry = one SQUAD of `models` of these.
//   hp/dmg per model.  rng px, rof attacks/s, spd px/s, w visual radius.
//   pts = value for enemy budgets & shop pricing.
// ---------------------------------------------------------------------------
const UNITS = {
  // ======================= VANGUARD (player) =======================
  marine:     { name:'Marine Squad',   fac:'vanguard', models:4, pts:4,  hp:52,  dmg:7,  rng:150, rof:1.1, spd:52, w:9,  air:true },
  rocketeer:  { name:'Rocketeers',     fac:'vanguard', models:3, pts:5,  hp:58,  dmg:26, rng:170, rof:0.42,spd:48, w:10, air:true, splash:26 },
  sniper:     { name:'Sniper Team',    fac:'vanguard', models:2, pts:5,  hp:34,  dmg:34, rng:300, rof:0.36,spd:46, w:9,  air:true },
  medic:      { name:'Medics',         fac:'vanguard', models:2, pts:4,  hp:46,  dmg:0,  rng:0,   rof:0,   spd:50, w:9,  heal:6, healRng:120 },
  hellhound:  { name:'Hellhound',      fac:'vanguard', models:1, pts:5,  hp:150, dmg:9,  rng:34,  rof:1.7, spd:88, w:13, splash:30 },
  outrider:   { name:'Outriders',      fac:'vanguard', models:2, pts:6,  hp:80,  dmg:11, rng:130, rof:1.5, spd:118,w:11, air:true },
  mortar:     { name:'Mortar Team',    fac:'vanguard', models:2, pts:6,  hp:44,  dmg:20, rng:260, rof:0.4, spd:40, w:10, splash:44, minRng:90 },
  apc:        { name:'APC',            fac:'vanguard', models:1, pts:7,  hp:240, dmg:8,  rng:140, rof:1.2, spd:70, w:15, deathSpawn:{unit:'marine', n:2} },
  siegetank:  { name:'Siege Tank',     fac:'vanguard', models:1, pts:9,  hp:300, dmg:34, rng:230, rof:0.5, spd:44, w:16, splash:40 },
  gunship:    { name:'Gunship',        fac:'vanguard', models:1, pts:8,  hp:180, dmg:13, rng:170, rof:1.6, spd:86, w:13, fly:true, air:true },
  goliath:    { name:'Goliath',        fac:'vanguard', models:1, pts:10, hp:480, dmg:24, rng:160, rof:1.0, spd:38, w:17, air:true },
  bomber:     { name:'Vulture Bomber', fac:'vanguard', models:1, pts:9,  hp:150, dmg:38, rng:70,  rof:0.5, spd:96, w:14, fly:true, splash:60 },
  artillery:  { name:'Artillery',      fac:'vanguard', models:1, pts:10, hp:110, dmg:52, rng:420, rof:0.26,spd:30, w:15, splash:56, minRng:170 },
  landship:   { name:'Landship',       fac:'vanguard', models:1, pts:15, hp:700, dmg:16, rng:240, rof:2.4, spd:26, w:22, air:true, splash:20 },
  leviathan:  { name:'Leviathan',      fac:'vanguard', models:1, pts:18, hp:980, dmg:48, rng:190, rof:0.8, spd:30, w:22, air:true, splash:36 },
  ratte:      { name:'The Ratte',      fac:'vanguard', models:1, pts:26, hp:1600,dmg:60, rng:330, rof:0.6, spd:16, w:28, air:true, splash:60 },
  // ---- emplacements (spd 0, placed like squads) ----
  turret:     { name:'Turret',         fac:'vanguard', models:1, pts:4,  hp:170, dmg:11, rng:230, rof:1.6, spd:0, w:12, air:true, struct:true },
  pillbox:    { name:'Pillbox',        fac:'vanguard', models:1, pts:6,  hp:420, dmg:14, rng:190, rof:2.0, spd:0, w:15, struct:true },
  cannon:     { name:'Cannon Emplacement', fac:'vanguard', models:1, pts:8, hp:240, dmg:44, rng:380, rof:0.3, spd:0, w:15, splash:48, minRng:140, struct:true },
  hospital:   { name:'Field Hospital', fac:'vanguard', models:1, pts:6,  hp:220, dmg:0,  rng:0, rof:0, spd:0, w:15, struct:true, heal:5, healRng:180 },
  radar:      { name:'Radar Station',  fac:'vanguard', models:1, pts:6,  hp:180, dmg:0,  rng:0, rof:0, spd:0, w:14, struct:true, aura:{rng:220, rngBoost:0.2} },

  // ======================= GILDED SYNDICATE (player) =======================
  enforcer:   { name:'Enforcers',      fac:'syndicate', models:4, pts:4,  hp:50,  dmg:7,  rng:145, rof:1.15,spd:56, w:9,  air:true },
  gunhand:    { name:'Gun Hands',      fac:'syndicate', models:3, pts:4,  hp:38,  dmg:6,  rng:110, rof:1.6, spd:125,w:9,  air:true },
  marauder:   { name:'Marauders',      fac:'syndicate', models:3, pts:5,  hp:70,  dmg:16, rng:90,  rof:0.8, spd:60, w:10, splash:30 },
  arbalest:   { name:'Arbalests',      fac:'syndicate', models:2, pts:5,  hp:32,  dmg:36, rng:310, rof:0.35,spd:46, w:9,  air:true },
  sawbones:   { name:'Sawbones',       fac:'syndicate', models:2, pts:4,  hp:44,  dmg:0,  rng:0,   rof:0,   spd:52, w:9,  heal:6, healRng:125 },
  dragoon:    { name:'Dragoons',       fac:'syndicate', models:2, pts:7,  hp:95,  dmg:9,  rng:150, rof:1.8, spd:105,w:11, fly:true, air:true },
  ironhide:   { name:'Ironhide',       fac:'syndicate', models:1, pts:7,  hp:340, dmg:12, rng:40,  rof:1.3, spd:52, w:15 },
  juggernaut: { name:'Juggernaut',     fac:'syndicate', models:1, pts:8,  hp:320, dmg:30, rng:180, rof:0.55,spd:48, w:16, splash:36 },
  demolisher: { name:'Demolisher',     fac:'syndicate', models:1, pts:9,  hp:120, dmg:46, rng:390, rof:0.28,spd:32, w:15, splash:50, minRng:150 },
  warlord:    { name:'The Warlord',    fac:'syndicate', models:1, pts:16, hp:850, dmg:40, rng:260, rof:0.7, spd:34, w:20, air:true, splash:44 },
  watchpost:  { name:'Watchpost',      fac:'syndicate', models:1, pts:4,  hp:150, dmg:10, rng:220, rof:1.5, spd:0, w:11, air:true, struct:true },
  gunbastion: { name:'Gun Bastion',    fac:'syndicate', models:1, pts:7,  hp:520, dmg:20, rng:230, rof:0.9, spd:0, w:15, splash:30, struct:true },
  goldvault:  { name:'Bullion Vault',  fac:'syndicate', models:1, pts:5,  hp:260, dmg:0,  rng:0,   rof:0,   spd:0, w:14, struct:true, rent:10 },

  // ======================= WARDEN COVENANT (player) =======================
  sentinel:   { name:'Sentinels',      fac:'warden', models:4, pts:4,  hp:98,  dmg:7,  rng:34,  rof:1.3, spd:52, w:9 },
  wardenguard:{ name:'Warden Guard',   fac:'warden', models:3, pts:5,  hp:94,  dmg:12, rng:150, rof:1.0, spd:42, w:10, air:true },
  pikeman:    { name:'Pikemen',        fac:'warden', models:3, pts:5,  hp:74,  dmg:22, rng:38,  rof:0.8, spd:46, w:9 },
  marshal:    { name:'Marshal',        fac:'warden', models:1, pts:5,  hp:132, dmg:0,  rng:0,   rof:0,   spd:44, w:11, heal:8, healRng:150 },
  halberdier: { name:'Halberdiers',    fac:'warden', models:2, pts:6,  hp:124, dmg:26, rng:42,  rof:0.9, spd:50, w:11 },
  bombard:    { name:'Bombard',        fac:'warden', models:1, pts:7,  hp:172, dmg:34, rng:300, rof:0.35,spd:30, w:14, splash:42, minRng:110 },
  ironclad:   { name:'Ironclad',       fac:'warden', models:1, pts:8,  hp:472, dmg:25, rng:48,  rof:0.9, spd:40, w:16 },
  castellan:  { name:'Castellan',      fac:'warden', models:1, pts:12, hp:770, dmg:36, rng:220, rof:0.6, spd:26, w:19, air:true, splash:30 },
  trebuchet:  { name:'Trebuchet',      fac:'warden', models:1, pts:11, hp:106, dmg:60, rng:460, rof:0.22,spd:22, w:15, splash:60, minRng:200 },
  rampart:    { name:'Rampart',        fac:'warden', models:1, pts:3,  hp:660, dmg:0,  rng:0,   rof:0,   spd:0, w:14, struct:true, rent:2, aura:{rng:150, armor:0.8} },
  ballista:   { name:'Ballista Tower', fac:'warden', models:1, pts:5,  hp:240, dmg:36, rng:320, rof:0.5, spd:0, w:13, air:true, struct:true },
  cauldron:   { name:'Oil Cauldron',   fac:'warden', models:1, pts:5,  hp:322, dmg:17, rng:120, rof:1.1, spd:0, w:13, splash:34, struct:true },
  redoubt:    { name:'Redoubt',        fac:'warden', models:1, pts:8,  hp:410, dmg:25, rng:300, rof:0.6, spd:0, w:15, splash:36, struct:true },
  bulwark:    { name:'The Bulwark',    fac:'warden', models:1, pts:18, hp:1620,dmg:40, rng:280, rof:1.2, spd:0, w:22, air:true, splash:26, struct:true },

  // ======================= MYRIAD SWARM (act 1) =======================
  swarmling:  { name:'Swarmlings',     fac:'myriad', models:5, pts:4,  hp:30,  dmg:5,  rng:22, rof:1.8, spd:92, w:8 },
  spitter:    { name:'Spitters',       fac:'myriad', models:3, pts:5,  hp:55,  dmg:10, rng:160,rof:0.9, spd:58, w:10, air:true },
  hunter:     { name:'Hunters',        fac:'myriad', models:2, pts:6,  hp:85,  dmg:14, rng:26, rof:1.4, spd:120,w:10 },
  miasma:     { name:'Miasma Hosts',   fac:'myriad', models:2, pts:6,  hp:70,  dmg:4,  rng:24, rof:1,   spd:64, w:11, deathBurst:{dmg:20, rng:52} },
  broodtyrant:{ name:'Brood Tyrant',   fac:'myriad', models:1, pts:11, hp:600, dmg:30, rng:44, rof:0.8, spd:44, w:19, splash:40 },
  broodmother:{ name:'Broodmother',    fac:'myriad', models:1, pts:12, hp:420, dmg:10, rng:150,rof:0.7, spd:36, w:18, air:true, spawn:{unit:'swarmling', every:7} },
  hiveRegent: { name:'Hive Regent',    fac:'myriad', models:1, pts:30, hp:1600,dmg:34, rng:64, rof:0.9, spd:26, w:26, splash:50, boss:true,
                spawn:{unit:'swarmling', every:4.5}, deathBurst:{dmg:60, rng:120} },

  // ======================= ASHEN CHOIR (act 2) =======================
  husk:       { name:'Husks',          fac:'choir', models:5, pts:4,  hp:40,  dmg:7,  rng:22, rof:1.4, spd:70, w:8 },
  wraith:     { name:'Wraiths',        fac:'choir', models:3, pts:6,  hp:60,  dmg:12, rng:28, rof:1.6, spd:110,w:9, dodge:0.25 },
  harbinger:  { name:'Harbingers',     fac:'choir', models:2, pts:8,  hp:80,  dmg:30, rng:330,rof:0.3, spd:40, w:11, splash:30 },
  gravewight: { name:'Gravewight',     fac:'choir', models:1, pts:10, hp:560, dmg:28, rng:40, rof:0.8, spd:40, w:18 },
  lich:       { name:'Lich',           fac:'choir', models:1, pts:9,  hp:180, dmg:14, rng:210,rof:0.6, spd:38, w:12, air:true, slowHit:{mult:0.6, dur:2.5} },
  nightgaunt: { name:'Nightgaunts',    fac:'choir', models:2, pts:7,  hp:130, dmg:16, rng:32, rof:1.2, spd:95, w:12, fly:true },
  requiem:    { name:'The Requiem',    fac:'choir', models:1, pts:32, hp:1800,dmg:30, rng:240,rof:0.7, spd:22, w:26, air:true, splash:40, boss:true,
                raiseDead:true, spawn:{unit:'husk', every:6} },

  // ======================= OBSIDIAN PACT (act 3) =======================
  thrall:     { name:'Thralls',        fac:'pact', models:5, pts:4,  hp:36,  dmg:6,  rng:22, rof:1.5, spd:80, w:8 },
  flayer:     { name:'Flayers',        fac:'pact', models:3, pts:6,  hp:75,  dmg:13, rng:24, rof:1.7, spd:115,w:9 },
  bloodpriest:{ name:'Blood Priest',   fac:'pact', models:1, pts:7,  hp:150, dmg:6,  rng:140,rof:0.8, spd:52, w:11, heal:8, healRng:140 },
  gargoyle:   { name:'Gargoyles',      fac:'pact', models:2, pts:7,  hp:110, dmg:15, rng:28, rof:1.3, spd:100,w:11, fly:true },
  abomination:{ name:'Abomination',    fac:'pact', models:1, pts:11, hp:640, dmg:36, rng:44, rof:0.7, spd:38, w:19, splash:36 },
  hemospire:  { name:'Hemorrhage Spire', fac:'pact', models:1, pts:8, hp:300, dmg:18, rng:240, rof:0.8, spd:0, w:14, struct:true },
  avatar:     { name:'Avatar of the Pact', fac:'pact', models:1, pts:36, hp:2400, dmg:44, rng:74, rof:1.0, spd:28, w:28, splash:56, boss:true,
                frenzyAura:true, spawn:{unit:'thrall', every:5} },
};

// Pact frenzy: when a pact model dies, nearby pact units rage.
const FRENZY = { dmgMult:1.35, spdMult:1.35, dur:6, rng:140 };

// Squad recruitment metadata (player-side only).
const SQUADS = {
  // vanguard
  marine:    { rar:'common' }, rocketeer:{ rar:'common' }, sniper:{ rar:'common' },
  medic:     { rar:'common' }, hellhound:{ rar:'common' }, turret:{ rar:'common' },
  outrider:  { rar:'uncommon' }, mortar:{ rar:'uncommon' }, apc:{ rar:'uncommon' },
  pillbox:   { rar:'uncommon' }, hospital:{ rar:'uncommon' }, radar:{ rar:'uncommon' },
  siegetank: { rar:'uncommon' }, gunship:{ rar:'uncommon' },
  goliath:   { rar:'rare' }, bomber:{ rar:'rare' }, artillery:{ rar:'rare' },
  cannon:    { rar:'rare' }, landship:{ rar:'rare' }, leviathan:{ rar:'rare' }, ratte:{ rar:'rare' },
  // syndicate
  enforcer:  { rar:'common' }, gunhand:{ rar:'common' }, marauder:{ rar:'common' },
  arbalest:  { rar:'common' }, sawbones:{ rar:'common' }, watchpost:{ rar:'common' },
  dragoon:   { rar:'uncommon' }, ironhide:{ rar:'uncommon' }, juggernaut:{ rar:'uncommon' },
  goldvault: { rar:'uncommon' },
  demolisher:{ rar:'rare' }, gunbastion:{ rar:'rare' }, warlord:{ rar:'rare' },
  // warden
  sentinel:  { rar:'common' }, wardenguard:{ rar:'common' }, pikeman:{ rar:'common' },
  marshal:   { rar:'common' }, rampart:{ rar:'common' }, ballista:{ rar:'common' },
  halberdier:{ rar:'uncommon' }, bombard:{ rar:'uncommon' }, ironclad:{ rar:'uncommon' },
  cauldron:  { rar:'uncommon' },
  redoubt:   { rar:'rare' }, castellan:{ rar:'rare' }, trebuchet:{ rar:'rare' }, bulwark:{ rar:'rare' },
};

// ---------------------------------------------------------------------------
// Playable factions. `battle` hooks are applied by the sim/run layer:
//   killBounty  — scrap per enemy point destroyed (paid on victory)
//   severance   — fraction of a wiped squad's price refunded as scrap
//   structHpMult— emplacement HP multiplier
//   structRent  — scrap per surviving emplacement after a victory
// Unit-level `rent` pays out per surviving emplacement regardless of faction.
// ---------------------------------------------------------------------------
const FACTIONS = {
  vanguard: {
    name:'The Vanguard', motto:'Hold the line. Bring them home.',
    blurb:'The last professional army of the west — combined arms, deep reserves, and the widest arsenal in the war.',
    perks:['The broadest roster: armour, air, artillery and emplacements', 'Balanced squads that reward combined arms'],
    start:['marine','marine','rocketeer','medic','turret'],
    basic:'marine', hqName:'Field HQ',
    battle:{},
  },
  syndicate: {
    name:'Gilded Syndicate', motto:'Gold breeds gold.',
    blurb:'A mercantile cartel that wages war with money: fast mercenaries, kill bounties, and severance insurance that makes trading armies profitable.',
    perks:['Kill bounty: enemy squads destroyed pay scrap after a victory', 'Severance: wiped squads refund part of their price', 'Fast, cheap mercs — fight constantly, re-hire freely'],
    start:['enforcer','enforcer','marauder','sawbones','watchpost'],
    basic:'enforcer', hqName:'The Haven',
    battle:{ killBounty:0.5, severance:0.4 },
  },
  warden: {
    name:'Warden Covenant', motto:'The wall pays for itself.',
    blurb:'A walled brotherhood that turtles and techs: armoured foot, brutal siege, and emplacements so sturdy they turn a profit.',
    perks:['Emplacements have +45% HP', 'Masonry rent: every surviving emplacement pays scrap after victory',
           'Living squads run +12% HP faction-wide — built to close the distance and hold it',
           'Worldbreaker Artillery Support: call down an off-map barrage anywhere on the field'],
    start:['sentinel','sentinel','wardenguard','marshal','ballista'],
    basic:'sentinel', hqName:'Bastion Keep',
    battle:{ structHpMult:1.45, structRent:3, hpMult:1.12 },
    ability:{
      id:'worldbreaker', name:'Worldbreaker Artillery Support',
      desc:'Mark any point on the field. After a delay, a barrage of shells hits the area — heavy splash damage to enemies only.',
      charges:2, cooldown:22, delay:2.2, radius:120, shellRadius:65, shells:5, dmg:130,
    },
  },
};

// Legacy alias (old saves): default starting roster.
const STARTER_ROSTER = FACTIONS.vanguard.start;

// Squad shop price ≈ pts × 9, tweaked by rarity.
function squadPrice(unitId) {
  const mult = { common: 9, uncommon: 10, rare: 11 }[SQUADS[unitId].rar];
  return UNITS[unitId].pts * mult;
}

// ---------------------------------------------------------------------------
// Relics — "Requisitions".
// ---------------------------------------------------------------------------
const RELICS = {
  r_veterans:   { name:'Veteran Cadre',      desc:'Your units have +12% HP.',                    hooks:{hpMult:1.12} },
  r_rounds:     { name:'Hardened Rounds',    desc:'Your units deal +12% damage.',                hooks:{dmgMult:1.12} },
  r_servos:     { name:'Servo Motors',       desc:'Your units move 15% faster.',                 hooks:{spdMult:1.15} },
  r_salvage:    { name:'Salvage Teams',      desc:'+12 scrap after every battle.',               hooks:{scrapAdd:12} },
  r_bulkOrders: { name:'Bulk Orders',        desc:'Shop prices are 25% lower.',                  hooks:{shopMult:0.75} },
  r_foundry:    { name:'Forward Foundry',    desc:'Emplacements have +40% HP.',                  hooks:{structHpMult:1.4} },
  r_doctrine:   { name:'Siege Doctrine',     desc:'Splash radii are 25% larger.',                hooks:{splashMult:1.25} },
  r_corpsmen:   { name:'Corpsmen',           desc:'Once per battle, a wiped squad survives with one model.', hooks:{lastStand:true} },
  r_airCav:     { name:'Air Cavalry Pact',   desc:'+1 reserve drop per battle.',                 hooks:{reserveAdd:1} },
  r_telegraph:  { name:'Field Telegraph',    desc:'Reserve drops recharge 40% faster.',          hooks:{reserveCdMult:0.6} },
  r_optics:     { name:'Long Optics',        desc:'High ground grants +40% range instead of +25%.', hooks:{ridgeBonus:1.4} },
  r_engineers:  { name:'Combat Engineers',   desc:'Ruins block 40% of ranged damage instead of 25%.', hooks:{ruinsGuard:0.6} },
  r_standard:   { name:'Battle Standard',    desc:'Units near your Field HQ deal +20% damage.',  hooks:{hqAura:{rng:300, dmg:1.2}} },
  r_warbonds:   { name:'War Bonds',          desc:'+15 scrap whenever an enemy elite or boss falls.', hooks:{eliteBounty:15} },
  r_plating:    { name:'HQ Plating',         desc:'Your Field HQ takes 30% less damage.',        hooks:{hqArmor:0.7} },
  r_drills:     { name:'Drill Instructors',  desc:'Newly recruited squads arrive upgraded.',     hooks:{recruitUp:true} },
};

// ---------------------------------------------------------------------------
// Terrain patches (top-down). Placed by map templates; x/y in [0..1].
//   ridge  — high ground disc: +25% range for units on it
//   ruins  — cover disc: −25% ranged damage taken inside
//   rocks  — impassable crag (ground units path around)
//   hostile— the act faction's home ground (per-faction effect)
// ---------------------------------------------------------------------------
const TERRAIN_FX = {
  ridgeRange: 1.25,
  ruinsGuard: 0.75,
  hostile: {
    myriad: { regen: 0.02, foeSlow: 0.85 },
    choir:  { dmg: 1.15 },
    pact:   { spd: 1.15 },
  },
};

const MAP_TEMPLATES = [
  { id:'open',      feats:[ {t:'ridge',x:0.5,y:0.5,r:110}, {t:'rocks',x:0.5,y:0.14,r:70}, {t:'rocks',x:0.5,y:0.86,r:70} ] },
  { id:'pass',      feats:[ {t:'rocks',x:0.52,y:0.32,r:120}, {t:'rocks',x:0.52,y:0.78,r:100}, {t:'ruins',x:0.34,y:0.55,r:90} ] },
  { id:'ruinfield', feats:[ {t:'ruins',x:0.42,y:0.3,r:95}, {t:'ruins',x:0.6,y:0.7,r:95}, {t:'hostile',x:0.78,y:0.4,r:110} ] },
  { id:'plateau',   feats:[ {t:'ridge',x:0.38,y:0.32,r:95}, {t:'ridge',x:0.62,y:0.68,r:95}, {t:'rocks',x:0.5,y:0.5,r:60} ] },
  { id:'overgrown', feats:[ {t:'hostile',x:0.45,y:0.28,r:120}, {t:'hostile',x:0.62,y:0.74,r:120}, {t:'ruins',x:0.3,y:0.6,r:80} ] },
  { id:'scarline',  feats:[ {t:'rocks',x:0.4,y:0.5,r:85}, {t:'rocks',x:0.68,y:0.24,r:75}, {t:'ridge',x:0.72,y:0.62,r:90}, {t:'ruins',x:0.24,y:0.26,r:75} ] },
];

// ---------------------------------------------------------------------------
// Encounters.  budget = pts the enemy commander fields at battle start.
//   waves = extra pts arriving as reinforcements at t=35s/70s... (per wave)
//   style: line | swarm | flank  (placement pattern)
// ---------------------------------------------------------------------------
const ENCOUNTERS = {
  // -------- ACT 1 · Myriad Swarm --------
  m_skirmish:  { fac:'myriad', tier:0, budget:18, waves:8,  style:'swarm', coreHP:0.8,
                 comp:{ swarmling:5, spitter:2 } },
  m_pack:      { fac:'myriad', tier:0, budget:22, waves:9,  style:'flank', coreHP:0.9,
                 comp:{ swarmling:4, hunter:2, spitter:2 } },
  m_bursters:  { fac:'myriad', tier:1, budget:26, waves:10, style:'swarm', coreHP:1.0,
                 comp:{ swarmling:3, miasma:3, spitter:2 } },
  m_tyrant:    { fac:'myriad', tier:1, budget:30, waves:10, style:'line',  coreHP:1.0,
                 comp:{ swarmling:4, spitter:2, broodtyrant:1 } },
  m_elite:     { fac:'myriad', tier:2, elite:true, budget:40, waves:14, style:'flank', coreHP:1.25,
                 comp:{ swarmling:4, hunter:3, miasma:2, broodmother:1 } },
  m_boss:      { fac:'myriad', tier:3, boss:'hiveRegent', budget:34, waves:12, style:'line', coreHP:1.4,
                 comp:{ swarmling:5, spitter:3, hunter:2, broodtyrant:1 } },

  // -------- ACT 2 · Ashen Choir --------
  c_procession:{ fac:'choir', tier:1, budget:34, waves:12, style:'line',  coreHP:1.1,
                 comp:{ husk:5, wraith:2 } },
  c_dirge:     { fac:'choir', tier:1, budget:38, waves:13, style:'line',  coreHP:1.15,
                 comp:{ husk:4, harbinger:2, wraith:2 } },
  c_coven:     { fac:'choir', tier:2, budget:42, waves:14, style:'flank', coreHP:1.2,
                 comp:{ husk:4, lich:2, nightgaunt:2 } },
  c_wights:    { fac:'choir', tier:2, budget:46, waves:15, style:'line',  coreHP:1.25,
                 comp:{ husk:3, gravewight:2, harbinger:1 } },
  c_elite:     { fac:'choir', tier:2, elite:true, budget:56, waves:18, style:'flank', coreHP:1.45,
                 comp:{ husk:4, wraith:3, lich:2, gravewight:2 } },
  c_boss:      { fac:'choir', tier:3, boss:'requiem', budget:48, waves:15, style:'line', coreHP:1.7,
                 comp:{ husk:5, harbinger:2, nightgaunt:2, gravewight:1 } },

  // -------- ACT 3 · Obsidian Pact --------
  p_tithe:     { fac:'pact', tier:2, budget:50, waves:16, style:'swarm', coreHP:1.3,
                 comp:{ thrall:5, flayer:2 } },
  p_flensing:  { fac:'pact', tier:2, budget:54, waves:17, style:'flank', coreHP:1.35,
                 comp:{ thrall:4, flayer:3, gargoyle:2 } },
  p_choirBlood:{ fac:'pact', tier:2, budget:58, waves:18, style:'line',  coreHP:1.4,
                 comp:{ thrall:4, bloodpriest:2, abomination:1 } },
  p_spires:    { fac:'pact', tier:3, budget:62, waves:19, style:'line',  coreHP:1.45,
                 comp:{ thrall:4, flayer:2, hemospire:1, gargoyle:1 } },
  p_elite:     { fac:'pact', tier:3, elite:true, budget:74, waves:24, style:'flank', coreHP:1.7,
                 comp:{ thrall:5, flayer:3, bloodpriest:2, abomination:2 } },
  p_boss:      { fac:'pact', tier:4, boss:'avatar', budget:66, waves:20, style:'line', coreHP:2.0,
                 comp:{ thrall:5, flayer:3, bloodpriest:2, gargoyle:2, abomination:1 } },
};

// ---------------------------------------------------------------------------
// Acts
// ---------------------------------------------------------------------------
const ACTS = [
  { id:'creeplands', name:'ACT I — The Creeplands', fac:'myriad',
    blurb:'The Myriad has blanketed the eastern provinces. Burn a road through the flood.',
    normals:['m_skirmish','m_pack','m_bursters','m_tyrant'], elite:'m_elite', boss:'m_boss',
    floors:7 },
  { id:'gravewastes', name:'ACT II — The Gravewastes', fac:'choir',
    blurb:'Ash falls like snow here, and the dead do not stay down. March quietly.',
    normals:['c_procession','c_dirge','c_coven','c_wights'], elite:'c_elite', boss:'c_boss',
    floors:7 },
  { id:'bloodfields', name:'ACT III — The Bloodfields', fac:'pact',
    blurb:'The Pact bleeds itself to feed something ancient. End it at the Altar.',
    normals:['p_tithe','p_flensing','p_choirBlood','p_spires'], elite:'p_elite', boss:'p_boss',
    floors:8 },
];

// ---------------------------------------------------------------------------
// Events — resolved in run.js
// ---------------------------------------------------------------------------
const EVENTS = [
  { id:'wreck', title:'The Broken Column',
    text:'A shattered Vanguard column lies across the road — a battle lost weeks ago. Their supplies are intact. Some of their soldiers still breathe.',
    choices:[
      { label:'Strip the supplies', result:{scrap:35}, note:'+35 scrap' },
      { label:'Rally the survivors', result:{squad:'basic'}, note:'Gain a basic squad' },
      { label:'Take their battle plans', result:{squad:'uncommon'}, note:'Gain an uncommon squad' },
    ]},
  { id:'obelisk', title:'The Broken Obelisk',
    text:'A chunk of standing stone leans by the roadside, small enough to have fallen off something much larger, long enough ago that moss has claimed the fracture. It isn\'t one of the three the column marches toward — the surveyors are certain of that much — but the animals still won\'t go near it, and neither, this close, do your engineers really want to.',
    choices:[
      { label:'Tap it for the war effort', result:{scrap:50}, note:'+50 scrap' },
      { label:'Read the warnings', result:{relic:true}, note:'Gain a random requisition' },
      { label:'Leave it be', result:{nothing:true}, note:'Nothing happens' },
    ]},
  { id:'deserters', title:'Deserters',
    text:'Four men in Vanguard colours sit around a cold fire. They ran at the Creeplands. They ask to run with you instead.',
    choices:[
      { label:'Take them in', result:{squad:'basic', upgraded:true}, note:'Gain an upgraded basic squad' },
      { label:'Take their gear, send them home', result:{scrap:28}, note:'+28 scrap' },
    ]},
  { id:'cache', title:'Munitions Cache',
    text:'A pre-war bunker, sealed. The lock is military — one of your codes might still fit. Or you could blow it.',
    choices:[
      { label:'Try the codes', result:{random:[{squad:'rare'},{nothing:true}]}, note:'50%: a rare squad. 50%: nothing' },
      { label:'Blow the door', result:{random:[{scrap:55},{loseSquad:'random'}]}, note:'50%: +55 scrap. 50%: the blast takes a squad' },
    ]},
  { id:'pilgrims', title:'Solari Pilgrims',
    text:'A crawler of Solari pilgrims shares your road. Their Collectors hum with siphoned light. They offer a trade — power for iron.',
    choices:[
      { label:'Trade (30 scrap)', cost:30, result:{relic:true}, note:'Gain a random requisition' },
      { label:'Trade away a squad', result:{loseSquad:true, scrap:60}, note:'Lose a squad, +60 scrap' },
      { label:'Decline politely', result:{nothing:true}, note:'Nothing happens' },
    ]},
  { id:'gravesong', title:'Gravesong',
    text:'Your radio operators pick up singing on a dead channel. The Choir knows your column by name. Some men want to answer.',
    choices:[
      { label:'Jam the channel', result:{scrap:-10, safe:true}, note:'-10 scrap, but nothing follows you' },
      { label:'Let them sing back', result:{random:[{squad:'rare'},{loseSquad:true}]}, note:'50%: a rare squad. 50%: a squad walks into the ash' },
    ]},
];

// ---------------------------------------------------------------------------
// Meta progression
// ---------------------------------------------------------------------------
const META_UNLOCKS = [
  { need:{runs:1},  squads:['cannon'],    label:'Siege Requisition' },
  { need:{wins:1},  squads:['landship'],  label:'Naval Requisition' },
  { need:{runs:3},  squads:['bomber'],    label:'Air Wing' },
  { need:{wins:2},  squads:['leviathan'], label:'Titan Works' },
  { need:{wins:3},  squads:['ratte'],     label:'The Impossible Gun' },
  { need:{runs:2},  squads:['gunbastion'],label:'Bastion Contract' },
  { need:{wins:1},  squads:['warlord'],   label:'The War Exchange' },
  { need:{runs:2},  squads:['trebuchet'], label:'Grand Arsenal' },
  { need:{wins:2},  squads:['bulwark'],   label:'The Bulwark Writ' },
];

const UNLOCK_IDS = META_UNLOCKS.flatMap(u => u.squads);
// Squads available from the start, per faction.
function basePool(fac) {
  return Object.keys(SQUADS).filter(id => UNITS[id].fac === fac && !UNLOCK_IDS.includes(id));
}
const BASE_POOL = basePool('vanguard'); // legacy alias
