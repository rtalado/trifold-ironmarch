# TRIFOLD: IRONMARCH

A single-player **roguelike tactics autobattler** set in the Trifold universe —
Mechabellum-style battles inside a Slay-the-Spire-style run. Muster a roster of
squads, **place them on a top-down battlefield before each fight**, then watch
the battle resolve. Squads that get wiped are **gone forever**.

**Three playable factions**, each with its own roster, sprites and economy:
- **The Vanguard** — combined arms, the widest arsenal (the baseline).
- **Gilded Syndicate** — mercenary economics: kill bounties pay scrap on
  victory, wiped squads refund part of their price (severance).
- **Warden Covenant** — turtle and tech: emplacements get +45% HP and pay
  masonry rent after every battle they survive, living squads run +12% HP
  faction-wide, and their commander can call in Worldbreaker Artillery
  Support — an off-map barrage on any point on the field.

The **Codex** on the title screen carries the war's lore — every faction and
every unit (see `js/lore.js`; the faction designs follow the guides in
`../trifold-rts/guides/`).

Plain HTML5 canvas + vanilla JS, no build step, no dependencies, no image files —
every sprite and battlefield is painted in code at load time.

## The run

- **Three acts**, each an enemy faction's home territory:
  - **Act I — The Creeplands** (Myriad Swarm): creep patches heal the swarm and slow you.
  - **Act II — The Gravewastes** (Ashen Choir): gravemist empowers them; the Requiem
    **raises your fallen soldiers as husks**.
  - **Act III — The Bloodfields** (Obsidian Pact): every Pact death whips its kin into
    a **blood frenzy**; the Avatar waits at the Altar.
- A branching **node map** per act: battles, elites, events, the Gilded Market,
  field camps (drill/recruit/scavenge), munitions caches, and the act boss.
- **Your roster is a real army.** Squads persist across battles; a squad wiped in
  combat is struck from the roster permanently. Rewards, shops, camps and events
  recruit new ones. Requisitions (relics) buff the whole column. By default,
  any squad that survives a battle starts the next one at full strength —
  toggle **Brutal Mode** at faction select and surviving squads carry their
  wounds (lost models, missing HP) forward instead.
- Meta-unlocks add squad types to the pool across runs (up to The Ratte).

## The battles

1. **Deployment** — the enemy's force is visible on the field. Place your squads on
   the grid in your zone (click a squad in the tray, click the field; right-click to
   take it back). Squads you *don't* place become **reserves**.
2. **The fight** — real-time autobattle. Units seek, flank, and fight on their own.
   You can drop up to **2 reserve squads** mid-fight (on a cooldown). Enemy
   **reinforcement waves** arrive from the east (up to 3) — kill their core before
   the tide swamps you. If your Field HQ falls, the run is over.
3. **Terrain matters**: high-ground rises give +25% range, ruins block 25% of ranged
   damage, impassable crags force chokepoints, and each faction's home ground
   empowers them on it.

**Controls:** click tray squad (or keys 1–9) → click field to place/drop ·
right-click to unplace or cancel · Space to start the battle / pause · 2× speed ·
wheel to zoom, drag (nothing selected) to pan · Esc for the menu.
**On touch:** tap a tray squad → drag on the field to aim the ghost, release to
place · long-press to unplace or cancel · pinch to zoom, one-finger drag to pan.
Portrait and landscape both work; portrait opens zoomed on your deployment zone.
The ☰ button (map & battle) opens the pause menu with settings.

**Stance:** the ADVANCE/HOLD toggle next to the fight button is a standing order
— it switches every squad you already have on the field immediately, and sets
the stance new placements/reserve-drops arrive in. ADVANCE squads seek and
engage the enemy as usual; HOLD squads stand their ground and only fire at
whatever comes into range — pair them with turrets/emplacements for a real
defensive line instead of everyone rushing forward. Held squads show a dashed
ring.

**Reserves:** squads left undeployed at "Sound the Advance" become reserves —
drop them mid-fight from the tray (2 drops by default, on a cooldown). The
tray note and the reserve HUD both show how many squads are actually available
to drop; if you deploy your whole roster you'll get a heads-up that there's
nothing left to hold back.

## Running it

Open `index.html` in any modern browser. That's it.
(For itch.io: zip the folder — `index.html` at the zip root — and upload as an
HTML/playable-in-browser project; ~1280×800 viewport or fullscreen.)

**Play online:** <https://rtalado.github.io/trifold-ironmarch/> — it's a PWA:
it installs to the home screen, plays offline, and picks up pushed updates on
the next launch.

**Android:** grab `ironmarch.apk` from
[Releases](https://github.com/rtalado/trifold-ironmarch/releases/latest) —
a thin WebView shell around the hosted game, built by
`.github/workflows/android.yml`. Because the game content lives in the PWA
cache, updates arrive over the air; the APK only needs rebuilding when the
shell itself changes. Signing keystore lives outside the repo
(`trifold-ironmarch-signing/`) and in the repo's Actions secrets — don't lose
it, updates must be signed with the same key. Icons are painted in code:
`node scripts/make-icons.js`.

`test_battle.html` is a dev harness: `?mode=place&enc=<id>` renders a scripted
deployment, `?mode=fight&enc=<id>&t=20` a battle in progress, `?mode=map` the run
map. Exclude it from store uploads if you like.

## Code layout

- `js/defs.js` — **all balance**: units/squads, points, encounters (budget + comp +
  placement style), relics, terrain, acts, events, meta-unlocks. Tune here.
- `js/sprites.js` — the paintbox: palettes, top-down sprite recipes, faction cores,
  chip art, battlefield painter.
- `js/core.js` — global state & helpers (relic hook aggregation).
- `js/sim.js` — the 2D battle sim (seeking, flocking, terrain, faction mechanics,
  waves, permadeath accounting).
- `js/combat.js` — placement validation, reserve drops, battle lifecycle.
- `js/render.js` — top-down renderer (ghost previews, range rings, fx, shake).
- `js/run.js` — node map, rewards, shop, camps, events, act progression.
- `js/meta.js` — persistent unlocks (localStorage).
- `js/ui.js` — DOM UI: hi-dpi map with vector icons, roster tray, overlays,
  run save/resume.
- `js/main.js` — boot + main loop.

## Balance notes (v1)

Verified headlessly (Node driving the real placement API with a fixed 66-point
roster): all 18 encounters resolve; act 1 clears cleanly, its boss is a costly win
(~5 squads lost), and the act 2/3 bosses defeat an undeveloped roster — a real
player's grown, upgraded roster is the intended answer. Reinforcement waves cap at
3 per battle so a stalled fight stays winnable.
