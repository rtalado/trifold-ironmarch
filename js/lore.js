// ============================================================================
// TRIFOLD: IRONMARCH — the codex
// Faction histories and unit lore. Purely flavour; nothing here is balance.
// ============================================================================
'use strict';

const LORE = {
  // -------------------------------------------------------------------------
  // The war itself — the codex's front page.
  // -------------------------------------------------------------------------
  war: {
    name: 'The Trifold War',
    kicker: 'THE WORLD AS IT STANDS',
    text: [
      'Three generations ago the Obelisks woke — silent stone antennae older than any map, humming with a power nobody agreed on how to use. Every state, cult and cartel that touched one came away changed, and the wars that followed ran together into one long fire the chroniclers gave up naming. Soldiers just call it the Trifold War: the war for ground, the war for gold, and the war for whatever sleeps under both.',
      'The east fell first. The Myriad Swarm blanketed the farm provinces in creep, the Ashen Choir sang the graveyards empty behind it, and the Obsidian Pact opened its veins in the south to feed something that has almost finished waking. Between them and the living west stands one road, and on that road marches a single Vanguard column.',
      'Elsewhere — beyond this campaign — other powers still contend: the Gilded Syndicate counts its interest, the Warden Covenant walls its valleys, Solari pilgrims drag their light-engines across the wastes, and stranger banners yet move on the far rim of the war. Their stories touch this one at the road\'s edge. For now, the column marches east.',
    ],
  },

  // -------------------------------------------------------------------------
  // Factions
  // -------------------------------------------------------------------------
  factions: {
    vanguard: {
      kicker: 'THE LAST PROFESSIONAL ARMY',
      text: [
        'The Vanguard was never a nation — it was the army the nations built together, back when the western compact still meant something. When the compact burned, the Vanguard kept its oaths anyway: hold the line, answer the call, bring them home. It is smaller every year. It has never once broken.',
        'Vanguard doctrine is combined arms taken to the point of religion: marines to hold ground, armour to break it, guns to shape it, and always — always — a reserve. Its quartermasters can field anything from a sandbagged turret to the Ratte, a gun so large the engineers who finished it refused to sign it.',
        'The Ironmarch is the Vanguard\'s last expedition: one column, mustered from every surviving garrison, marching east through three occupied provinces to put out the fire at its source. Nobody ordered it. Nobody needed to.',
      ],
    },
    syndicate: {
      kicker: 'GOLD BREEDS GOLD',
      text: [
        'The Gilded Syndicate began as an escort company that noticed wars pay better than caravans. It has no citizens, only shareholders; no territory, only holdings; no ideology, only the ledger. Its Havens — part bank, part hiring hall, part fortress — stand neutral in every war and profit from all of them.',
        'Syndicate war-making is arithmetic. Every merc is a line item, every kill pays a bounty, and every casualty is insured — the famous severance clause that refunds a dead soldier\'s contract to the treasury before the body cools. Critics call it ghoulish. The Syndicate calls it liquidity, and notes that its soldiers are the best-fed and best-armed on any field, because a dead investment is a bad one.',
        'The Syndicate joined the eastern war the day the Myriad ate three of its trade roads. This is not a crusade. It is a foreclosure.',
      ],
    },
    warden: {
      kicker: 'THE WALL PAYS FOR ITSELF',
      text: [
        'The Warden Covenant is a brotherhood of masons, engineers and oath-bound soldiery that survived the old wars by the simple expedient of never losing a siege. Its valleys are ringed with curtain walls a century deep, and its law is carved over every gate: what stands, pays; what falls, teaches.',
        'Warden economy and Warden war are the same discipline. Every rampart raised is income, every bastion a citizen, every stone accounted. Its soldiers advance the way its walls do — slowly, in order, and permanently. The Covenant has never taken ground it later gave back.',
        'The Covenant marches east because its surveyors did the arithmetic: the creep grows at four leagues a season, and stone does not negotiate. Better to grind the fire out in someone else\'s province than to test the walls at home.',
      ],
    },
    myriad: {
      kicker: 'ACT I — THE FLOOD',
      text: [
        'The Myriad Swarm is not an army, and calling it one has killed better commanders than you. It is a single distributed appetite — millions of fast, cheap, disposable bodies steered by brood-minds that treat casualties as postage. The creep that carpets its territory is the Swarm too: it feeds them, heals them, and slows everyone else.',
        'The Swarm took the eastern breadbasket in a single season. It did not besiege the cities; it simply grew through them. What the Vanguard fights in the Creeplands is less an invasion than a digestion in progress.',
        'Swarm tactics are volume with patience attached: swarmlings to drown a line, spitters to rake it, hunters to run down whatever tries to leave. At the centre of every infestation squats a Hive Regent — kill it, and the flood around it forgets, briefly, what it was for.',
      ],
    },
    choir: {
      kicker: 'ACT II — THE SONG',
      text: [
        'The Ashen Choir was a burial faith once — psalms for the dead, ash on the brow, a promise that no grave would be forgotten. The promise held. That is the problem. Somewhere in the long war the Choir stopped mourning the dead and started conscripting them.',
        'The Gravewastes are its diocese: ash falls like snow, the mist carries the harmony, and the dead walk in processions that do not stop for weather or gunfire. Your own casualties are recruitment — the Requiem raises fallen soldiers as husks mid-battle, still wearing your colours.',
        'The Choir does not hate you. It grieves for you, ahead of schedule. Its harbingers sing ruin from the far side of the field, its wraiths dance through rifle fire, and its liches slow warm bodies to the tempo of the hymn. March quietly. It already knows your name.',
      ],
    },
    pact: {
      kicker: 'ACT III — THE DEBT',
      text: [
        'The Obsidian Pact is exactly what it sounds like: an agreement, signed in the oldest currency there is. Its founders opened their veins over the Altar in the Bloodfields and something beneath it answered. Every drop since has been interest on a loan no one alive remembers taking.',
        'Pact society is a tithe pyramid — thralls bleed for flayers, flayers for priests, priests for the Avatar — and its battle doctrine follows suit: every death whips the kin beside it into frenzy, so a dying Pact line accelerates instead of breaking. Fighting it is like fighting a fire that pays dividends.',
        'The Avatar of the Pact waits at the Altar itself, wearing the debt like a crown. The Vanguard\'s cartographers marked the Bloodfields "end of the road." They meant it both ways.',
      ],
    },
    strain: {
      kicker: 'BEYOND THE MAPPED WAR',
      text: [
        'Nobody in the column can say where they first heard the word. It isn\'t in any dispatch log, and Command\'s cartographers won\'t put it on a map with an Obelisk on it — because whatever this is, it isn\'t near one. It doesn\'t sing, doesn\'t tithe, doesn\'t grow the way the other three grow. It just keeps testing what already worked on it, and keeping the part that hurt.',
        'The scouts who came back call it the Virulent Strain, mostly because nobody offered a better name before it ate the first one. It has no banner, no doctrine, and — as far as anyone has lived long enough to report — no leadership to kill. Only an appetite, a memory for pain, and, as of the last transmission, no bottom anyone has found.',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // The Trifold Obelisks — the war's namesake. Never explained; three
  // generations of chroniclers have tried. One sits under each act's
  // stronghold, and each has been shaped by three centuries of what grew
  // up around it.
  // -------------------------------------------------------------------------
  obelisksIntro: [
    'Three generations of chroniclers have called this the Trifold War without agreeing on what the word means. The surveyors who\'ve actually stood near all three Obelisks have a theory, and they don\'t love it: it means exactly what it sounds like. There are three of them.',
  ],
  obelisks: {
    myriad: { name: 'The Creeplands Obelisk',
      text: 'Chitin has grown over the stone in overlapping plates, thick as siege armour, and still the shape beneath is unmistakably an Obelisk — a tower the Swarm didn\'t build and cannot stop growing around. The brood-minds don\'t worship it. They don\'t need to. Every drone within a hundred leagues moves like it\'s listening to something the column can\'t hear, and the listening gets worse the closer you get to the Hive.' },
    choir: { name: 'The Gravewastes Obelisk',
      text: 'Bone dust has settled into every seam of it, generations deep, until the Obelisk reads less like stone than like a headstone that outgrew the grave. The Choir built the Ossuary Gate around it the way a shrine gets built around a relic — not to contain it, but to be near it. The hymns get louder the closer you stand. Nobody has explained why the dead seem to agree.' },
    pact: { name: 'The Bloodfields Obelisk',
      text: 'The stone has gone the colour of an old wound, and the ground around it never quite dries. The Pact didn\'t find their god here — they found this, and decided it would do. The Altar grew up around the Obelisk like scar tissue, tithe by tithe, until it was impossible to say where the monument ended and the shrine began. It has never once answered a question. It has never once stopped taking payment.' },
  },

  // -------------------------------------------------------------------------
  // Command staff — the named voices of each playable faction's column.
  // Flavour only; they don't appear as units or affect anything mechanical.
  // -------------------------------------------------------------------------
  staff: {
    vanguard: [
      { name: 'Colonel Aldous Rourke', role: 'Commanding Officer',
        text: 'Commands the column. Doesn\'t talk about winning the war anymore, only about getting the column to the next province intact. Older than his rank suggests; everyone senior enough to outrank him is dead.' },
      { name: 'Quartermaster Sergeant Nessa Vale', role: 'Logistics',
        text: 'Keeps the column fed, armed, and barely solvent. Dry, exact, unsentimental about numbers — the only person on staff who can tell you the exact cost of a battle before it\'s fought.' },
      { name: 'Lieutenant Corin Ashe', role: 'Scout & Intelligence',
        text: 'Rides ahead with the Outriders. Terse to the point of unsettling. Has seen every province before the column marches into it, and it shows.' },
    ],
    syndicate: [
      { name: 'Underwriter Sable Voss', role: 'Haven Handler',
        text: 'The Haven\'s man riding with the column. Here to protect the investment, not the province. Talks in premiums, payouts, and severance; quietly the most feared person in camp, because everyone knows exactly what they\'re worth to him.' },
      { name: 'Captain Idris Rho', role: 'Field Captain',
        text: 'Leads the mercs on the ground. Fights for the paycheck same as everyone, but the soldiers trust him anyway — he\'s never once let the actuarial tables decide who gets left behind.' },
    ],
    warden: [
      { name: 'Marshal Ada Wallwright', role: 'Banner Officer',
        text: 'Holds the column to its oaths the way she\'d hold a wall. Doesn\'t inspire with speeches — inspires by being visibly, permanently unmovable.' },
      { name: 'Master Engineer Bram Kiln', role: 'Siege Engineer',
        text: 'Designs the siege pieces and reads a battlefield like a quarry survey. Speaks mostly in tonnage, range, and mortar cure-times; apologises to guns that miss.' },
    ],
  },

  // -------------------------------------------------------------------------
  // Campaign ending — shown after the Bloodfields boss falls. Same beat
  // (the Obelisk outlives the Avatar; the debt isn't over), three voices.
  // -------------------------------------------------------------------------
  ending: {
    vanguard: { title: 'THE ALTAR FALLS',
      text: 'The Avatar\'s husk cools among the bloodfields. Behind you, three provinces breathe again. But the Obelisk under the Altar hasn\'t stopped humming, and Rourke doesn\'t pretend otherwise in his report: <b>the debt is paid down, not paid off.</b> The Vanguard marches home — fewer, harder, and singing anyway, because that\'s what\'s left to do.' },
    syndicate: { title: 'THE ALTAR FALLS',
      text: 'The Avatar defaults on three centuries of debt in one afternoon; Voss actually smiles. But the ledger doesn\'t balance to zero — the Obelisk is still there, still taking, and everyone on staff knows a standing account when they see one. <b>The column banks its win and marches home rich.</b> Voss is already drafting the next contract.' },
    warden: { title: 'THE ALTAR FALLS',
      text: 'The Avatar breaks like a wall finally does — all at once, after refusing to for a very long time. Wallwright walks the ground afterward and says nothing; Kiln does the arithmetic nobody asked for and doesn\'t like the answer. <b>The Obelisk still hums under the ruin. What stands, pays.</b> This one\'s still standing.' },
  },

  // -------------------------------------------------------------------------
  // Units — one or two lines each, in the column's voice.
  // -------------------------------------------------------------------------
  units: {
    // ---- vanguard ----
    marine:     'The rifle line the west is held with. Four soldiers, one drill manual, no illusions — marines take ground the artillery can see and keep it after the artillery stops.',
    rocketeer:  'Launcher teams with a cheerful disregard for backblast discipline. The tubes are older than the crews; the warheads, regrettably for the enemy, are not.',
    sniper:     'Two-man teams that measure the war in exhaled half-breaths. Doctrine says they harvest officers; snipers say they harvest whatever is worth a bullet\'s paperwork.',
    medic:      'Corpsmen with more courage than armament. The column forgives medics anything, because everyone marching has already owed one their life.',
    hellhound:  'A flame-tank bred from a farm tractor and a grudge. Hellhound crews are selected for enthusiasm and then carefully never promoted.',
    outrider:   'Light cavalry cars that fight the war at forty miles an hour. Outriders scout, screen, raid, and invoice the quartermaster for tyres nobody believes they used honestly.',
    mortar:     'The infantry\'s pocket artillery. A good mortar team drops the third round through the hole the first two argued about.',
    apc:        'An armoured box full of marines and opinions. When an APC dies, the marines get out — angrier.',
    siegetank:  'The Vanguard\'s door-knocker. Slow to arrive, slower to leave, and the wall it was sent to argue with usually concedes first.',
    gunship:    'Rotor-craft flying low enough to read unit patches. Gunship pilots claim air superiority is a state of mind.',
    goliath:    'A walking weapons platform with a gait like a siege in progress. Goliaths were built to hold crossroads; mostly they hold funerals for whatever contested them.',
    bomber:     'The Vulture earns its name on the return leg — it circles back over its own bomb-line to photograph the results. Command pretends to disapprove.',
    artillery:  'The long guns. Artillery crews fight a war of coordinates and never see a single face; the column prefers it that way, and so do the faces.',
    landship:   'A warship the naval yards finished after the sea stopped being relevant. It rolls, it broadsides, and its crew still salutes the quarterdeck.',
    leviathan:  'The pattern the Goliath was simplified from. A Leviathan on the field is the Vanguard stating, formally, that it intends to stay.',
    ratte:      'The Impossible Gun. Its firing solution paperwork outweighs its shells, and its shells outweigh cavalry. Fired in anger three times; three provinces renamed.',
    turret:     'A crate, a gun, a prayer, in that order of assembly. Turrets die so marines don\'t.',
    pillbox:    'Poured concrete with a firing slit and a pedigree — the design is older than the Vanguard itself and has outlived everything that ever attacked one.',
    cannon:     'A fortress gun on a field mount, traded from the Covenant back when the Covenant still traded. Nothing on the field out-ranges it and survives the discovery.',
    hospital:   'A tent, a surgeon, and the war\'s only unconditional promise. Squads fight measurably harder inside its lamplight.',
    radar:      'A dish listening for tomorrow. Under its sweep, every gun in the column shoots a shade further than the enemy planned around.',
    valkyrie:   'Jump infantry off the Skyfall Contract — the last airborne school the west still runs. Valkyries arrive by falling out of the sky on purpose, and the enemy line rarely improves on that first impression.',

    // ---- syndicate ----
    enforcer:   'The Syndicate\'s standard line item: rifle, armour, contract, severance policy. Enforcers fight well because the bonus structure is explained before every engagement.',
    gunhand:    'Freelance pistoleers paid by the errand. Too fast to invoice, too cheap to mourn — the Guild hires them in bundles.',
    marauder:   'Grenade men in reinforced dusters who bill by the doorway. The Syndicate classifies them as "demolition consultants" for tariff reasons.',
    arbalest:   'Beam marksmen with optics worth more than their contracts. An Arbalest\'s ledger lists one column: settled accounts, at two hundred paces.',
    sawbones:   'Field surgeons on retainer. The severance clause pays out on death, so the Sawbones exist to keep the actuarial tables friendly — and the mercs walking.',
    dragoon:    'Aerial gunners on rotor rigs, paid loiter rates. Dragoons chase routed enemies with the particular diligence of men paid per confirmed receipt.',
    ironhide:   'A walking vault door with a temper. The Syndicate finally bought the frontline it could never rent, and armour-plated it like the asset it is.',
    juggernaut: 'A heavy shell-thrower crewed by veterans whose contracts have matured into something like loyalty. Its splash damage is itemised as "collateral, anticipated."',
    demolisher: 'Siege ordnance for turtle markets. When a client\'s enemy digs in, the Demolisher renegotiates the position from four hundred paces.',
    warlord:    'The apex of the hire hall: a private battleship on treads, with four autocannons and a payment plan. When the Warlord deploys, the war is officially over-budget — for the other side.',
    watchpost:  'A prefab picket gun the Syndicate air-drops onto anything it intends to own. The flag it flies is a receipt.',
    gunbastion: 'The heavy anchor of a Syndicate hold — nine hundred pounds of turret bought, not built. It holds ground the way the Syndicate holds debt: with interest.',
    goldvault:  'A strongroom on the battlefield, humming with compound interest. Guard it well; a standing vault pays the column the moment the shooting stops.',
    auditor:    'A survey car from the Long Count, the Syndicate\'s census of everything ownable. Its instruments were built to appraise territory; pointed at a battlefield, they extend every nearby gun\'s reach to the exact edge of what the ledger says is theirs.',

    // ---- warden ----
    sentinel:   'Oath-sworn shield infantry, first stone in every Warden wall. A Sentinel\'s tower shield is inscribed with the names of everyone who carried it before him.',
    wardenguard:'Armoured musketry that advances at the pace of mortar drying. The Guard\'s volleys are unhurried, rhythmic, and as negotiable as gravity.',
    pikeman:    'Anti-armour foot with iron-tipped pikes and the patience of masonry. Cavalry has been trying the same joke on pikemen for four hundred years.',
    marshal:    'A banner officer of the Hall of Oaths. Where the Marshal\'s pennant stands, soldiers mend, hold, and remember exactly what they swore.',
    halberdier: 'The Covenant\'s answer to everything with too much armour and too little humility. The halberd is a can-opener that took holy orders.',
    bombard:    'A wheeled siege piece cast in the deep foundries. Every Bombard bears its foundry-mother\'s mark; crews polish it before battle and apologise to it after misses.',
    ironclad:   'A ram-prowed engine that breaks lines the way the Covenant breaks sieges: once, slowly, permanently.',
    castellan:  'A walking keep — the Covenant\'s architecture out for a march. Where a Castellan halts, cartographers add a fortification symbol and move on.',
    trebuchet:  'The longest arm in the war, rebuilt from temple drawings the Covenant never explains. It out-ranges everything, including its own spotters\' courage.',
    rampart:    'A section of curtain wall, delivered. It blocks, it endures, and by Covenant law it pays rent the whole time it stands.',
    ballista:   'A tower bolt-thrower with a bell-tower\'s judgement: one target, one bolt, one conclusion, at three hundred paces.',
    cauldron:   'Burning oil on a swivel. The recipe is scripture, the smell is punishment, and the ground it guards stays guarded.',
    redoubt:    'A self-contained strongpoint with a long gun and no further requirements. Redoubts are where enemy offensives go to become sieges, and Warden sieges have one ending.',
    bulwark:    'The doomsday fortress of the Grand Arsenal — a citadel that arrives by writ, guns already sighted. The Covenant builds one when it has decided a place is finished changing hands.',
    aegis:      'The Moving Wall made literal: paired shield-bearers whose tower shields were quarried, not forged. Soldiers marching in their shadow take wounds the way a wall takes weather.',

    // ---- myriad ----
    swarmling:  'The Swarm\'s smallest thought — chitin, teeth, and forward momentum. One is vermin. Five hundred are weather.',
    spitter:    'Artillery that evolved instead of being invented. Spitters dissolve a line from range and drink what runs off.',
    hunter:     'The Swarm\'s pursuit instinct with legs. Hunters exist so nothing that sees the Swarm clearly gets to describe it.',
    miasma:     'Walking gas-bladders the brood-minds spend like ammunition. The bang is chemical; the smell is a war crime with no author.',
    broodtyrant:'A siege-organ grown for one campaign. The creep feeds it until the walls come down; what happens after is not the Tyrant\'s department.',
    broodmother:'A mobile hatchery, laying reinforcements into the battle as it walks. Killing her is the only order that survives contact with her children.',
    hiveRegent: 'A brood-mind grown a body worth the name. The Regent does not command the flood — it is the flood, briefly wearing a crown of chitin.',

    // ---- choir ----
    husk:       'The recently mourned, walking. Husks wear whatever they died in — some of it, lately, is Vanguard issue.',
    wraith:     'Grief that learned footwork. Rifle fire passes through a Wraith the way an argument passes through a hymn.',
    harbinger:  'The Choir\'s far voice. A Harbinger\'s verse arrives from beyond the horizon and ends conversations mid-sentence.',
    gravewight: 'A cathedral-mass of graveyard soil and consecrated bone. It walks the processional route regardless of what is standing on it.',
    lich:       'A cantor of the old rite, keeping tempo. Everything a Lich touches slows to the speed of mourning.',
    nightgaunt: 'The Choir\'s winged descant — silent until directly overhead, and then only briefly.',
    requiem:    'The Choir\'s masterwork: a requiem mass given mass. It sings your dead into its processional while the battle is still deciding whose they are.',

    // ---- pact ----
    thrall:     'The base of the tithe pyramid. Thralls bleed first, by covenant, and go to the field grateful for the scheduling.',
    flayer:     'Tithe collectors of the middle rank, fast and lean. Their knives are inherited; the debts they collect are older than the knives.',
    bloodpriest:'An accountant of the only currency the Pact accepts. He heals the line by redistribution — someone always pays.',
    gargoyle:   'Altar statuary that finished its apprenticeship. Gargoyles roost among their unfinished siblings until the tithe requires wings.',
    abomination:'A payment the Altar declined to fully digest. The Pact bound it in brass and pointed it west.',
    hemospire:  'A drilled monolith that taps the Bloodfields themselves. The Pact grows them along its borders the way other nations plant flags.',
    avatar:     'The debt, personified and impatient. The Avatar wears the accumulated tithe of three centuries; at the Altar it stops being a metaphor.',
  },
};
