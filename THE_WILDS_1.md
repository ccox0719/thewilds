# THE WILDS
### Survival Crafting Card Game — Design Document v2.0

---

## Core Fantasy

A competitive survival crafting game where stranded players make hard tradeoffs between staying alive, building capability, and pushing toward rescue. Survival should feel earned, not granted by random food luck.

---

## Design Goals

- Survival pressure comes from player choices, not only passive decay
- Food and water are mostly secured through preparation and tool use
- Each zone feels dangerous and distinct
- Characters are asymmetric and interdependent
- Crafted tools are the point of the loop: build them, then use them in the zone where they matter
- Rescue is a strategic race, not an automatic timer

---

## Player Experience

Players should feel:
- Exposed in the early game
- Clever when they assemble a working survival loop
- Tension when deciding whether to stabilize or push risk
- Dependent on the right tools in the right places
- That death happens because of bad planning, greed, or bad luck under pressure

---

## Game Structure

| Property | Value |
|---|---|
| Players | 3–4 |
| Format | Competitive survival with shared rescue end trigger |
| Length Target | 45–75 minutes |
| Winner | Most points when rescue is achieved or round limit is reached |

---

## Survival Meters

Each player tracks four personal meters.

| Meter | Start | Max | Behavior |
|---|---|---|---|
| Hunger | 8 | 10 | Decays -1 per round end. Search actions cost Hunger. |
| Hydration | 8 | 10 | Decays -1 per round end. Move actions cost Hydration. |
| Warmth | 5 | 10 | Shifts based on environment pressure and player actions. Does NOT decay automatically. |
| Morale | 8 | 10 | Event-driven only. Does not decay passively. Affects efficiency. |

Shared rescue track: 0–20. Hitting 20 ends the game.

### Warmth Model

Warmth is a balance bar, not a countdown. The environment applies pressure each round. Players counter it through rest, sleep, fire, and shelter.

**Environment pressure by variant (applied each round end):**

| Variant | Warmth Shift |
|---|---|
| Temperate Forest (base) | -1 per round |
| Northern Wilderness | -2 per round |
| Desert (day) | +2 per round |
| Desert (night) | -2 per round |
| Tropical | +1 per round |

**Warmth consequences:**

| Warmth | Consequence |
|---|---|
| Above 7 (Overheated) | Hydration decays -2 instead of -1 that round |
| Below 3 (Cold) | Morale loses -1 that round |
| 3–7 (Comfortable) | No penalty |

Campfire or Sustained Fire in tableau reduces environment warmth pressure by 1 per round.

### Morale Model

Morale affects gameplay efficiency, not just survival.

| Morale | Effect |
|---|---|
| 8–10 (High) | +1 bonus card draw per Search |
| 5–7 (Stable) | No effect |
| 3–4 (Low) | Hand limit reduced by 1 |
| 1–2 (Desperate) | Hand limit reduced by 2, cannot trade or help others |
| 0 (Broken) | Elimination or heavy point penalty (TBD) |

**Morale loss triggers:**
- Animal Attack hazard: -2
- Poison Forage / Wrong Plant hazard: -1
- Waterborne Illness flag triggered: -2
- Bee Sting hazard: -1
- Rockslide hazard: -1
- Exposure hazard: -1
- Warmth hits Cold zone at round end: -1
- Any meter hits critical (2 or below): -1
- Night without shelter in tableau: -1

**Morale gain triggers:**
- Sleep action: +2
- Honeycomb consumed: +1
- Crafted Expert item (Debris Hut, Signal Fire, Rescue Cache): +1
- Rescue progress milestone (every 5 points): +1
- Shelter in tableau at round end: prevents night penalty

---

## Action Economy

Each turn a player spends actions from this list. Action count per turn: 3 for the prototype, then tune from playtesting.

| Action | Cost | Effect |
|---|---|---|
| Move | Hydration -1 | Travel to a zone |
| Search | Hunger -1 | Draw 2 cards from current zone deck |
| Craft | None | Build a recipe from hand materials |
| Use Tool | None | Activate a zone-use item in its matching zone |
| Rest | 1 action | Recover Warmth based on shelter quality |
| Sleep | Full turn | Warmth resets to 5, +2 Morale. No draws or crafts. |
| Signal | 1 action | Contribute rescue progress via specific tools or locations |

**Rest warmth recovery by shelter:**

| Shelter | Rest Recovery |
|---|---|
| No shelter | +1 Warmth |
| Lean-To | +2 Warmth |
| Sturdy Shelter | +3 Warmth |
| Debris Hut | +4 Warmth |
| Cave Entrance | +3 Warmth |

---

## Value System

Every material card has a value of 1, 2, or 3. Every recipe has a minimum value threshold. Players select cards meeting the required categories whose values sum to the threshold or higher.

There is no rarity system. Value is the only quality indicator.

| Value | Meaning |
|---|---|
| 1 | Common find. Weak forage, basic materials, emergency food. |
| 2 | Solid resource. Reliable crafting component. |
| 3 | Premium find. One per zone deck. Unlocks expert crafts. |

**Example:** Campfire requires 2x Wood + 1x Fire Starter, threshold 4.
- Fallen Branch (1) + Thick Log (2) + Sap (1) = 4 ✓
- Fallen Branch (1) + Fallen Branch (1) + Dry Fungus (2) = 4 ✓
- Any combination of those categories summing to 4+ works.

---

## Zones

Each zone has a 16-card deck: 9x value-1, 4x value-2, 1x value-3, 2x hazard cards.

Hazard cards have no value and trigger immediately on draw — they are never held in hand.

### Forest 🌲
**Identity:** Shelter, wood, hunting cover
**Opportunity:** Bow and snare use, rare herbs
**Danger:** Animal attack, poisonous forage

| Card | Value | Category | Notes |
|---|---|---|---|
| Fallen Branch | 1 | Wood | Basic framing or kindling |
| Dry Leaves | 1 | Plant | Tinder and bedding insulation |
| Pine Needles | 1 | Plant | Dense tinder and ground cover |
| Tree Bark | 1 | Fiber | Rough cordage or shelter skin |
| Vine | 1 | Fiber | Flexible binding material |
| Wild Herbs | 1 | Plant | Medicine ingredient |
| Berries | 1 | Food | +1 Hunger. Raw risk of misidentification |
| Grubs | 1 | Food | +1 Hunger. Safe protein |
| Sap | 1 | Fire Starter | Flammable. Weak fire starter |
| Thick Log | 2 | Wood | Long burn fire or shelter wall |
| Straight Sapling | 2 | Wood | Tool handles, poles, weapon blanks |
| Medicinal Moss | 2 | Plant | Key medicine ingredient |
| Dry Fungus | 2 | Fire Starter | Best basic fire starter |
| Hardwood Bough | 3 | Wood | Required for Bow crafting |
| Animal Attack ⚠️ | — | Hazard | -2 Morale. No shelter: also -1 Hunger |
| Poison Forage ⚠️ | — | Hazard | -1 Morale, -1 Hunger. Forager: negated |

### River 🏞️
**Identity:** Water access, fish, clay, reeds
**Opportunity:** Fishing, water collection, filtration
**Danger:** Unsafe water, flooding, injury

| Card | Value | Category | Notes |
|---|---|---|---|
| Unsafe Water (x2) | 1 | Water | Must treat before safe drinking |
| Reeds | 1 | Fiber | Thatching and filtration material |
| River Stone | 1 | Stone | Fire ring or basic tool blank |
| Sand | 1 | Stone | Filtration layer |
| Mud | 1 | Plant | Shelter insulation |
| Cattails | 1 | Fiber | Cordage and tinder |
| Small Fish | 1 | Food | +1 Hunger raw, +3 cooked |
| Crayfish | 1 | Food | +1 Hunger raw, +2 cooked |
| Clay | 2 | Stone | Container crafting |
| Flat Stone | 2 | Stone | Cooking surface |
| Large Fish | 2 | Food | +2 Hunger raw, +5 cooked |
| Smooth Stone | 2 | Stone | Grinding and construction |
| Flint | 3 | Fire Starter | Best fire starter. Sharp cutting edge |
| Flash Flood ⚠️ | — | Hazard | Discard 1 random card. -1 Morale |
| Waterborne Illness ⚠️ | — | Hazard | Sets illness flag. Next unsafe water: -3 Hydration, -2 Morale |

### Meadow 🌾
**Identity:** Open ground, fibers, small game, medicinal plants
**Opportunity:** Snare placement, herb gathering, beeswax, feathers
**Danger:** Exposure, stings, bad plant identification

| Card | Value | Category | Notes |
|---|---|---|---|
| Wild Grass | 1 | Fiber | Cordage and weaving |
| Dry Soil | 1 | Plant | Fire pit base |
| Dandelion | 1 | Food | +1 Hunger. Safe emergency food |
| Clover | 1 | Food | +1 Hunger |
| Insects | 1 | Food | +1 Hunger |
| Thistle | 1 | Plant | Medicine and cordage |
| Nettle | 1 | Fiber | Strong processed cordage |
| Sunlight | 1 | Plant | Consume for +2 Warmth shift |
| Feathers | 1 | Fiber | Insulation and fletching |
| Beeswax | 2 | Plant | Waterproofing and candle crafts |
| Medicinal Root | 2 | Plant | Potent healing ingredient |
| Wild Onion | 2 | Food | +1 Hunger raw. Cook bonus +1 to any meal |
| Snare Bait | 2 | Food | Required to activate Snare craft |
| Honeycomb | 3 | Food | +3 Hunger, +1 Morale |
| Bee Sting ⚠️ | — | Hazard | -1 Morale, -1 Warmth |
| Wrong Plant ⚠️ | — | Hazard | -1 Morale, -2 Hunger. Forager: negated |

### High Ground ⛰️
**Identity:** Visibility, stone, rescue signaling, wind exposure
**Opportunity:** Signaling, rare stone, scouting bonus
**Danger:** Rockslide, cold wind, falls

| Card | Value | Category | Notes |
|---|---|---|---|
| Loose Rock | 1 | Stone | Basic tool blank |
| Gravel | 1 | Stone | Filtration and drainage |
| Lichen | 1 | Food | +1 Hunger. Always available |
| Exposed Root | 1 | Fiber | Strong cordage |
| Dense Shrub | 1 | Plant | Windbreak and shelter walls |
| Wind | 1 | Plant | Warmth -2 immediately on draw |
| Visibility | 1 | Plant | Consume for +1 Rescue |
| Animal Track | 1 | Food | Draw 1 bonus food card next turn |
| Flat Rock Shelf | 1 | Stone | Cooking surface or shelter floor |
| Quartz | 2 | Fire Starter | Reliable spark source |
| Signal Rock Pile | 2 | Stone | Consume for +2 Rescue |
| Cave Entrance | 2 | Plant | Immediately acts as Lean-To |
| Obsidian Shard | 2 | Stone | Cutting tool blank |
| Rescue Signal Site | 3 | Stone | +4 Rescue. Required for Signal Kit full effect |
| Rockslide ⚠️ | — | Hazard | Discard 1 random card. -1 Morale |
| Exposure ⚠️ | — | Hazard | Warmth -2, -1 Morale |

---

## Characters

Each character has a primary craft category, secondary craft category, and one passive perk.

| Character | Primary | Secondary | Passive |
|---|---|---|---|
| Firekeeper | Fire | Shelter | Campfire warmth reduction counts as -2 instead of -1 |
| Forager | Water | Medicine | Poison Forage and Wrong Plant hazards negated |
| Hunter | Food Procurement | Utility Tools | Fishing Pole and Bow produce +1 extra food on activation |
| Pathfinder | Utility Tools | Rescue Signaling | Rockslide discard is player choice not random. Move costs -1 Hydration |

---

## Craft Categories

### Shelter
| Recipe | Type | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|
| Lean-To | Camp | 2x Wood, 1x Fiber | 4 | Rest: +2 Warmth | 2 |
| Sturdy Shelter | Camp | 3x Wood, 1x Fiber, 1x Stone | 8 | Rest: +3 Warmth. Reduces Animal Attack -1 | 4 |
| Debris Hut | Camp | 3x Wood, 2x Fiber, 1x Plant | 11 | Rest: +4 Warmth. Sleep: +1 bonus Morale | 6 |

### Fire
| Recipe | Type | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|
| Campfire | Camp | 2x Wood, 1x Fire Starter | 4 | Warmth pressure -1/round. Enables cooking | 2 |
| Sustained Fire | Camp | 3x Wood, 1x Fire Starter, 1x Stone | 7 | Warmth pressure -2/round for 4 rounds | 4 |
| Signal Fire | Camp | 3x Wood, 2x Fire Starter | 9 | Warmth pressure -1/round. +1 Rescue/round | 5 |

### Water
| Recipe | Type | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|
| Boiled Water | Recovery | 1x Water + campfire in tableau | 1 | +4 Hydration, safe | 1 |
| Water Filter | Camp | 2x Stone, 1x Fiber | 4 | Treats unsafe water. +1 water draw at River | 3 |
| Water Collection Rig | Camp | 2x Stone, 2x Fiber, 1x Plant | 7 | Passive +1 Hydration/round. Treats water | 5 |

### Food Procurement
| Recipe | Type | Zone | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|---|
| Snare | Zone-Use | Meadow | 2x Fiber, 1x Wood | 4 | Trap food in Meadow (needs Snare Bait) | 2 |
| Fishing Pole | Zone-Use | River | 1x Wood, 2x Fiber | 5 | Fish in River: all fish +2 Hunger bonus | 3 |
| Bow | Zone-Use | Forest | 1x Wood, 2x Fiber | 7 | Hunt in Forest: success +6 Hunger, fail -1 Hunger | 4 |
| Drying Rack | Camp | — | 2x Wood, 1x Fiber | 5 | Cooked meals +1 Hunger. Prevents spoilage | 3 |

### Utility Tools
| Recipe | Type | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|
| Stone Tool | Camp | 2x Stone | 3 | +1 card draw per Search | 2 |
| Cutting Tool | Camp | 1x Stone, 1x Wood | 4 | Next craft threshold -1 | 3 |
| Knife | Camp | 1x Stone, 1x Wood | 3 | Raw food can be eaten without the morale penalty | 2 |
| Axe | Camp | 1x Wood, 2x Stone | 4 | When you draw wood, gain +1 extra wood | 3 |
| Climbing Staff | Camp | 1x Wood, 1x Fiber | 4 | Rockslide: choose discard. Move -1 Hydration | 2 |

### Medicine
| Recipe | Type | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|
| Basic Poultice | Recovery | 2x Plant | 3 | +1 Morale, +1 any meter | 1 |
| Medicine | Recovery | 2x Plant, 1x Water | 5 | +2 Morale, +2 any meter | 2 |
| Strong Medicine | Recovery | 3x Plant, 1x Water | 8 | +3 Morale, +4 any meter, clears illness flags | 4 |

### Rescue Signaling
| Recipe | Type | Zone | Requires | Threshold | Effect | Points |
|---|---|---|---|---|---|---|
| Signal Mirror | Zone-Use | High Ground | 2x Stone | 4 | +4 Rescue on use | 3 |
| Signal Kit | Zone-Use | High Ground | 2x Stone, 1x Fiber, 1x Fire Starter | 7 | +6 Rescue + 1/round after (needs Rescue Signal Site) | 5 |
| Rescue Cache | Recovery | — | 1x each category | 10 | +5 Rescue, +2 Morale | 6 |

---

## Danger System

Each zone hazard has a trigger, consequence, and at least one protection condition.

| Zone | Hazard | Consequence | Protection |
|---|---|---|---|
| Forest | Animal Attack | -2 Morale. No shelter: -1 Hunger | Shelter in tableau reduces to -1 Morale only |
| Forest | Poison Forage | -1 Morale, -1 Hunger | Forager passive negates entirely |
| River | Flash Flood | Discard 1 random card, -1 Morale | Pathfinder: discard is player choice |
| River | Waterborne Illness | Flag set: next unsafe water = -3 Hydration, -2 Morale | Water Filter or Boiling Setup negates |
| Meadow | Bee Sting | -1 Morale, -1 Warmth | None. Minor and unavoidable |
| Meadow | Wrong Plant | -1 Morale, -2 Hunger | Forager passive negates entirely |
| High Ground | Rockslide | Discard 1 random card, -1 Morale | Pathfinder or Climbing Staff: player choice |
| High Ground | Exposure | Warmth -2, -1 Morale | Shelter in tableau: Warmth loss -1 only |

---

## Scoring

Points are awarded when items are crafted and accumulate throughout the game.

Rewards:
- Crafted infrastructure (shelter, fire, tools)
- Advanced survival solutions (zone-use tools, water rig)
- Rescue contribution (signal items, signal fire)
- End condition bonuses (TBD)

Avoid rewarding passive turtling too heavily.

---

## End Conditions

| Condition | Trigger |
|---|---|
| Rescue | Shared rescue track hits 20 — game ends, most points wins |
| Round Cap | After X rounds, most points wins (TBD) |
| Elimination | Any meter hits zero — player eliminated or penalized (TBD) |

---

## Open Design Questions

| Question | Status |
|---|---|
| Exact action count per turn | Prototype baseline set to 3; continue tuning with playtesting |
| Movement between adjacent zones vs open access | TBD |
| How many danger checks per zone visit | Currently 1 (drawn from deck) |
| Whether tools degrade or require upkeep | TBD |
| Whether characters can share crafted benefits freely | TBD |
| Whether dead players are eliminated or penalized | TBD |
| Morale at zero — eliminate or penalize | TBD |
| Round cap number | TBD |
| Hand limit | TBD — suggest 7 |
| Night/day cycle for Desert variant | Future session |
| Skill system (Foraging skill concept) | Future session |

---

## File Structure

```
the-wilds/
├── index.html              ← Playable prototype
├── THE_WILDS.md            ← This document
├── VSCODE_HANDOFF.md       ← Paste into VS Code AI at session start
└── data/
    ├── materials.json      ← All zone decks with value system
    ├── zones.json          ← Zone definitions
    └── recipes.json        ← All recipes with value thresholds
```

---

## Session History

| Version | Changes |
|---|---|
| v0.1 | Core loop, zones, basic material and recipe lists |
| v0.2 | Rarity system added |
| v1.0 | First prototype built. Meters, tableau, crafting, hazards |
| v1.1 | Warmth redesigned as balance bar. Morale added. Rest/Sleep actions. Hazard system expanded |
| v2.0 | Full reboot. Rarity removed. Value threshold system. Characters added. Zone-use craft type. Reboot blueprint applied. |

---

*The Wilds — Design Document v2.0 | Built with Claude*
