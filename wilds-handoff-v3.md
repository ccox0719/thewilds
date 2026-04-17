# Wilds — Digital Prototype Handoff v3

## Design Identity

**"You're all stranded together. The rescue comes for everyone. But only one of you gets the trophy."**

Wilds is a **competitive survival game with shared stakes**. Players share the same environment, draw from the same material pools, and collectively contribute to a group rescue threshold that ends the game. Scoring is individual. Helping another player survive is always a calculated decision — a collapsed player stops contributing rescue signal, which slows the group track. You cooperate when it serves you. You compete when it matters.

Survival is not abstract. Your body responds to three real conditions: hunger, thirst, and temperature. When any of those fail, Vitality drops. Vitality is the only health pool. There is no morale system.

---

## Primary Goals

1. Build a playable digital prototype of the current baseline game loop.
2. Keep all game content data-driven so rules, recipes, materials, perks, and scoring can be edited without touching core engine code.
3. Add AI players that can simulate games for tuning and balance testing.
4. Make the architecture flexible enough to later generate printable card data and reference sheets from the same source files.
5. Support self-balancing through a recipe value model that flags broken cards before sim runs confirm it.

---

## Tech Stack

- TypeScript
- Vite
- React
- Plain CSS or lightweight CSS modules
- No heavy state library unless clearly justified
- JSON or TS data files for all game content
- Prioritize readability and maintainability over cleverness

---

## Folder Structure

```
/src
  /app        — app shell, startup wiring
  /components — reusable UI pieces
  /engine     — pure headless game rules and state transitions
  /ai         — bot evaluation and turn decisions
  /data       — recipes, materials, perks, scenarios, rule config
  /types      — shared TypeScript interfaces
  /utils      — helper functions including RNG
  /views      — Play, Simulation, Debug screens
  /exports    — print/card export utilities
```

### Core Design Rule

**The game engine must be headless.** It must be fully usable without React. The UI calls engine functions. The UI contains no rules. If a rule lives in a component file, it is in the wrong place.

---

## Materials

Nine material types in two tiers:

**Raw materials** (drawn from scenario bags):
- Wood
- Fiber
- Stone
- Food
- Water

**Processed materials** (created by recipes, never drawn from bags):
- Rations — produced by Preserved Rations, consumed by Cooked Meal
- CleanWater — produced by Filtered Water, consumed by Boiled Water
- Fuel — produced by Dry Fuel, consumed by Sustained Fire
- Cordage — produced by Braided Cordage, consumed by Signal Lens and Signal Beacon

Fire was removed as a material type. Campfire and other fire-related recipes use Wood and Fiber. The persistent fire state is `HearthActive`.

**Naming note:** `HearthActive` is the tag granted by Campfire. It is the persistent fire state. Never confuse it with a raw material.

---

## Vitality — The Only Health Pool

There is no morale system. Vitality is the single measure of a player's physical condition.

- **Starting Vitality:** 9
- **Collapse condition:** Vitality ≤ 0
- **Natural regen:** +1 Vitality at the end of any round where all three survival checks pass
- **No other passive regen.** Recovery requires either all checks passing or specific recipe effects.

Vitality represents the body, not the mind. It drops when a player is hungry, thirsty, or exposed to dangerous temperatures. It recovers slowly when a player is genuinely stable.

---

## Scenario Bags

Materials are drawn from a weighted pool defined by the scenario. All players share the same scenario bags. Bag compositions live in data files. Adding a new scenario requires no code changes.

Each scenario has a `rescueThresholdAdjust` value added to the base group rescue threshold (see Rescue Model). A positive value raises the threshold so more rescue signal is needed before the game ends. Forest has the highest adjust (+15), giving more rounds for players to learn the loop. Scenarios with lower or zero adjust end faster.

### Default Scenarios

**Forest** *(cool — starting scenario)*
- Wood: 7, Fiber: 5, Stone: 3, Food: 2, Water: 4
- `temperaturePressure: 1`
- `rescueThresholdAdjust: +15`

**Rocky Highlands** *(cold)*
- Stone: 6, Wood: 3, Fiber: 3, Food: 2, Water: 4
- `temperaturePressure: 1`
- `rescueThresholdAdjust: +5`

**River Delta** *(temperate)*
- Water: 7, Food: 5, Fiber: 3, Wood: 3, Stone: 2
- `temperaturePressure: 0`
- `rescueThresholdAdjust: 0`

**Volcanic** *(harsh cold — scarce materials, high temperature pressure)*
- Stone: 3, Wood: 3, Fiber: 1, Food: 2, Water: 2
- `temperaturePressure: 3`
- `rescueThresholdAdjust: +8`

**Desert** *(hot)*
- Stone: 4, Food: 4, Water: 4, Wood: 2, Fiber: 2
- `temperaturePressure: -1`
- `rescueThresholdAdjust: +5`

The sign of `temperaturePressure` drives engine behavior. Positive = cold. Negative = heat. Zero = no warmth check.

Fire no longer exists as a material type and does not appear in any scenario bag. All fire-related recipes use Wood and Fiber as costs.

---

## Temperature Model

The warmth check reads `temperaturePressure` from the scenario (modified by any active round event `temperatureShift`) and applies it as follows:

### Cold Scenarios (`temperaturePressure > 0`)

| Player state | Vitality loss |
|---|---|
| No shelter, no HearthActive | `temperaturePressure` |
| Has `Shelter` tag (Lean-To) | `temperaturePressure - 1` (min 0) |
| Has `SturdyShelter` tag | 0 — fully eliminates temperature loss |
| Has `HearthActive` tag (Campfire) | 0 |
| Has `SustainedFire` tag | 0 |

Lean-To reduces cold exposure. Campfire or Sustained Fire eliminates it. Sturdy Shelter also eliminates it.

### Temperate Scenarios (`temperaturePressure = 0`)

No warmth check. Lean-To and Campfire retain full utility for cooking and Vitality regen eligibility.

### Hot Scenarios (`temperaturePressure < 0`)

| Player state | Vitality loss |
|---|---|
| No shelter | `abs(temperaturePressure)` |
| Has `Shelter` tag (Lean-To) | 0 — shade fully solves heat |
| Has `HearthActive` tag (Campfire) | No effect on heat — fire does not cool |

Campfire remains universally necessary in hot scenarios because cooking and boiling water require `HearthActive` regardless of temperature. Players who skip Campfire in a desert scenario cannot use Cooked Meal or Boiled Water. This is intentional and teachable.

Lean-To is the most universally valuable Tier 1 build in the game. It mitigates cold, eliminates heat exposure, and costs only 1 Wood + 1 Fiber.

---

## Draft Mechanic — Keep 1 / Share 1

### Each Round, Draft Phase

1. **Bag draw:** Draw materials from the scenario bag equal to `(playerCount × 2) + 2`. Place all face-up in the **center market**.
2. **Private draw:** Each player privately draws **2 materials** directly from the bag. These are theirs. They are not shared.
3. **Market draft (turn order):** Starting with the first player, going clockwise, each player may take 1 material from the center market. Players may pass.
4. **Leftover materials** carry over to the next round. The center market is capped at **7 materials**. When overflow occurs, the oldest material(s) are discarded.
5. **Turn order rotates** clockwise each round.

Every player always receives at least 2 materials per round from their private draw. No player can be locked out of the game by a bad market.

---

## Rescue Model — Shared Threshold, Individual Contribution

### Group Rescue Track

A shared track with a base threshold determined by player count, modified by the scenario's `rescueThresholdAdjust`:

```
groupRescueThreshold = baseThreshold[playerCount] + scenario.rescueThresholdAdjust
```

Base thresholds by player count:

```json
"rescueThresholds": {
  "solo": 12,
  "2": 18,
  "3": 28,
  "4": 40,
  "5": 52
}
```

When the group rescue track reaches or exceeds its threshold, **the game ends at the close of that round.** All players finish the round before scoring.

### Individual Rescue Contribution

- Each player tracks their own rescue score independently.
- When a player builds a signal recipe, their personal rescue score increases AND the same value is added to the group rescue track.
- A collapsed player stops contributing rescue. Their banked rescue remains on the group track permanently.
- Individual rescue score is the primary scoring currency.

---

## Recipes

### Processing Sub-Economy

Several Tier 1 recipes convert raw materials into **processed materials** (Rations, CleanWater, Fuel, Cordage). These processed materials are then consumed by other recipes. Building this sub-economy trades one-time crafting actions for a more efficient mid and late game.

### Tier 1 (available from start)

| Recipe | Cost | Requires | Type | Effect |
|---|---|---|---|---|
| Lean-To | 1 Wood, 1 Fiber | — | Persistent | Grants `Shelter` tag. Reduces cold loss by 1. Eliminates heat loss. |
| Campfire | 1 Wood, 1 Fiber | — | Persistent | Grants `HearthActive` tag. Eliminates cold loss. Required for cooking. |
| Cooked Meal | 1 Ration | `HearthActive` | One-time | Satisfies Hunger check this round. Restore 1 Vitality. |
| Boiled Water | 1 Clean Water | `HearthActive` | One-time | Satisfies Thirst check this round. Restore 2 Vitality. |
| Filtered Water | 1 Water, 1 Wood, 1 Stone | `HearthActive` | One-time | Gain 2 Clean Water. |
| Preserved Rations | 1 Food, 1 Wood, 1 Fiber | `HearthActive` | One-time | Gain 2 Rations. |
| Dry Fuel | 2 Wood, 1 Fiber | `HearthActive` | One-time | Gain 2 Fuel. |
| Braided Cordage | 2 Fiber | `HearthActive` | One-time | Gain 2 Cordage. |
| Snare | 2 Fiber, 1 Wood | — | Persistent Engine | Grants `FoodSource` tag. Owner gains 1 Food at engine income each round. |
| Basic Tool | 1 Wood, 1 Stone | — | Persistent Engine | Grants `Tool` tag. Future processing recipes cost 1 less material. |
| Simple Signal | 1 Stone, 1 Fiber | — | One-time | +1 rescue (personal score + group track). |
| Signal Platform | 1 Wood, 1 Stone | `HearthActive` | Persistent Engine | Grants `SignalEngine` tag. +4 rescue immediately. All future signal recipes built by this player gain +8 rescue. Upkeep: 1 Cordage every 2 rounds after R7. |

### Tier 2 (unlocks when player has at least one `Shelter` or `HearthActive` tag)

Tier 2 gates behind meaningful survival infrastructure, not a raw recipe count. A player who has established warmth or shelter has proven enough stability to attempt more advanced builds.

| Recipe | Cost | Requires | Type | Effect |
|---|---|---|---|---|
| Water Catcher | 1 Wood, 1 Fiber, 1 Stone | `HearthActive` | Persistent Engine | +1 Water each engine income. |
| Drying Rack | 2 Wood, 1 Fiber | `HearthActive` | Persistent Engine | +1 Rations each engine income. |
| Tool Bench | 1 Wood, 2 Stone | `Tool` tag | Persistent | Future processing recipes cost 1 less material. |
| Signal Lens | 1 Cordage, 1 Stone | `SignalEngine` | Persistent Engine | +2 rescue immediately. Future signal recipes gain +6 rescue. |
| Sturdy Shelter | 2 Wood, 1 Stone | `Shelter` tag | Persistent | Grants `SturdyShelter` tag. Fully eliminates cold and heat loss (replaces Lean-To protection). |
| Sustained Fire | 1 Stone, 1 Fuel | `HearthActive` | Persistent | Grants `SustainedFire` tag. Fully eliminates cold loss. Required for Signal Beacon. Upkeep: 1 Fuel every 2 rounds after R7. |
| Signal Beacon | 1 Wood, 1 Cordage | `SustainedFire` | One-time | +13 rescue (personal score + group track). |

### Engine Rules

- **Snare:** During engine income phase, owner gains 1 Food.
- **Basic Tool:** Future processing-family recipes cost 1 less material total.
- **Signal Platform:** +4 rescue on build. When owner builds any signal recipe after this, that recipe's rescue value increases by +8 before being applied.
- **Signal Lens:** +2 rescue on build. Future signal recipes gain an additional +6 rescue bonus on top of Signal Platform if both are built.
- **Water Catcher:** During engine income phase, owner gains 1 Water.
- **Drying Rack:** During engine income phase, owner gains 1 Ration.

### Maintenance

Signal Platform and Sustained Fire have upkeep costs starting at Round 7, applying every other round. If a player cannot pay upkeep, the recipe goes inactive that round. Inactive recipes do not provide engine income or tag benefits until upkeep is paid the following eligible round.

---

## Round Flow

Each round proceeds in this exact order:

1. **Round Event** — Draw and apply an event for the round (see Round Events).
2. **Draft Phase** — Execute the Keep 1 / Share 1 draft.
3. **Engine Income Phase** — Resolve all persistent engine effects for each player (Snare food gain, Water Catcher, Drying Rack, etc.).
4. **Craft Phase** — Each player may craft up to 1 recipe if they can pay the cost and meet all requirements.
5. **Effect Phase** — Apply all recipe effects (Vitality changes, rescue additions, tag grants).
6. **Survival Pressure Phase** — Apply the three survival checks in order for each player.
7. **Vitality Regen Check** — Any player who passed all three checks gains 1 Vitality.
8. **Round Advance** — Check win condition. If group rescue track has reached threshold, end game after this round resolves fully. Otherwise advance round counter and rotate turn order.

---

## Survival Pressure Phase

At the end of each round, apply these three checks in order for each player. Each unmet check costs Vitality. The pressure schedule scales the cost by round.

### Check 1 — Hunger

Spend 1 Food or accumulate 1 hunger debt. Once a player's hunger debt reaches **3** (configurable via `hungerMissesPerDamage`), they lose `pressureSchedule[round]` Vitality and the debt resets to zero. Missing a single hunger check does not immediately deal damage.

Cooked Meal satisfies this check automatically for the round it is crafted, regardless of Food in inventory.

### Check 2 — Thirst

Spend 1 Water or lose `pressureSchedule[round]` Vitality.

Boiled Water satisfies this check automatically for the round it is crafted, regardless of Water in inventory.

### Check 3 — Warmth

Apply the temperature model using the scenario's effective temperature (`temperaturePressure` plus any active round event `temperatureShift`) and the player's active tags. See Temperature Model section.

Warmth Vitality loss is **not** scaled by the pressure schedule. It is always the flat value from the temperature model. Only Thirst and Hunger (once debt triggers) scale with pressure.

### Pressure Schedule

```json
"pressureSchedule": [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4]
```

One value per round index. If the game runs longer than the schedule length, the last value repeats. Default stays flat until round 6 then escalates steadily. Tunable in config without code changes.

### Vitality Regen

After all three checks resolve, any player who passed all three gains **+1 Vitality**. This rewards genuine stability and creates a meaningful difference between a player who is barely surviving and one who has built proper infrastructure.

---

## Round Events

Each round, one event may trigger based on the current scenario. Events are drawn randomly from eligible candidates for that scenario and round. An event may:

- Shift temperature (`temperatureShift`) — modifies effective `temperaturePressure` for the round
- Modify survival check pressure (`pressureBonus`) — positive values increase damage, negative reduce it
- Modify signal rescue output (`signalRescueBonus`) — positive or negative
- Modify recipe family costs (`recipeFamilyCostDelta`) — temporarily increase or decrease costs for a recipe family

Events have a `family` (opportunity, escalation, neutral) for UI display and simulation analysis.

### Events by Scenario

**Forest:**
- Abundant Forage (R1–5, opportunity) — hunger -1 *(shared with River Delta)*
- Clear Skies (R1–12, neutral) — temperature -1, signal +1 *(shared with Rocky Highlands, Desert)*
- Windy Night (R4–12, escalation) — temperature +1, warmth +1, signal +2 *(shared with Rocky Highlands)*
- Heavy Rain (R5–12, escalation) — temperature +1, thirst -1, warmth +1, signal -1 *(shared with River Delta)*
- Cold Front (R8–12, escalation) — temperature +2, warmth +2 *(shared with Rocky Highlands)*

**Rocky Highlands:**
- Exposed Ridge (R1–12, opportunity) — temperature +1, warmth +1, signal +2, signal-rescue recipes -1 cost
- Thin Air (R3–12, neutral) — thirst +1
- Landslide (R5–12, escalation) — hunger +1, processing/shelter-climate recipes +1 cost
- Clear Skies, Windy Night, Cold Front *(shared with Forest)*

**River Delta:**
- Abundant Forage (R1–6, opportunity) — hunger -1 *(also appears as shared version above, R1–5)*
- Clear Skies (R1–12, neutral) — signal +2 *(Delta version; signal bonus is stronger than Forest's)*
- Heavy Rain (R3–12, opportunity) — temperature +1, warmth +1, thirst -1, signal -1 *(Delta version, starts earlier)*
- Flood Tide (R6–12, escalation) — warmth +1, signal -1
- Forest Abundant Forage, Forest Heavy Rain *(shared with Forest)*

**Desert:**
- Heat Wave (R1–12, escalation) — temperature -1, thirst +1 *(shared with Volcanic)*
- Dust Storm (R4–12, escalation) — temperature -1, warmth +1, signal -1 *(shared with Volcanic)*
- Clear Skies *(shared with Forest)*

**Volcanic:**
- Heat Wave, Dust Storm *(shared with Desert)*
- Thermal Burst (R1–12, opportunity) — temperature -1, signal +1
- Ash Fall (R3–12, escalation) — hunger +1, thirst +1, signal -2, signal-rescue recipes +2 cost, shelter-climate recipes +1 cost
- Seismic Shift (R6–12, escalation) — warmth +1, processing/signal-rescue recipes +1 cost

---

## Collapse

- Vitality ≤ 0: player is **collapsed**.
- Collapsed players take no further actions.
- Their banked rescue score remains permanently on the group rescue track.
- They contribute no further rescue.
- Collapse does not create a group penalty beyond loss of future contribution.
- Record `collapseRound` on player state for simulation analysis.

---

## Special Cards

Special cards are permanent modifier cards that augment recipes and provide ongoing advantages. Players start with a random selection of starting cards; earned cards are unlocked during play based on which recipes have been built.

### Starting Special Cards (drawn randomly at game start)

| Card | Family | Effect |
|---|---|---|
| Rain Catcher Plan | shelter-climate | Water Catcher produces +1 Water each income. |
| Field Dressing | recovery | Cooked Meal and Boiled Water each restore +1 Vitality. |
| Tripwire Snare | food-engine | Snare generates +1 Food each income. |
| Signal Mirror Plan | signal-rescue | Simple Signal costs 1 less Stone. Signal recipes gain +1 Rescue. |
| Kindling Method | shelter-climate | Lean-To and Campfire each cost 1 less Wood. |

### Earned Special Cards (unlocked during play)

Earned cards are granted when a player builds certain recipes. The trigger recipe and card are defined in `specialCards.ts` via `getAdvancedSpecialCardForRecipe()`.

| Card | Family | Unlocked By | Effect |
|---|---|---|---|
| Water Filter | processing | Water Catcher or Filtered Water | Filtered Water gains +1 Clean Water. Boiled Water restores +1 Vitality. |
| Smokehouse | processing | Drying Rack, Preserved Rations, or Snare | Preserved Rations gain +1 Rations. Drying Rack gains +1 Rations income. |
| Repair Bench | processing | Tool Bench, Braided Cordage, or Dry Fuel | Processing recipes cost 1 less material. |
| Beacon Lens | signal-rescue | Signal Platform, Signal Lens, or Signal Beacon | Signal recipes gain +4 Rescue. |
| Insulated Bedding | shelter-climate | Sturdy Shelter, Sustained Fire, Lean-To, or Campfire | Reduce warmth damage by 1. |

---

## Scoring

```
finalScore =
  (personalRescue × rescueMultiplier)
  + (remainingVitality if alive)
  + (persistentBuildBonus per persistent build)
  + (healthyVitalityBonus if vitality >= healthyVitalityThreshold AND alive)
```

All weights are in config:

```json
"scoring": {
  "rescueMultiplier": 2,
  "healthyVitalityThreshold": 5,
  "healthyVitalityBonus": 4,
  "persistentBuildBonus": 2
}
```

The `healthyVitalityBonus` rewards players who finish alive with sufficient Vitality remaining. A player who survives in good physical condition scores better than one who barely made it.

---

## Config File

```json
{
  "startingVitality": 9,
  "simulationCeiling": 12,
  "materialsPrivateDrawPerRound": 2,
  "marketCapSize": 7,
  "hungerMissesPerDamage": 3,
  "tier2UnlockCondition": "hasShelterOrHearth",
  "pressureSchedule": [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4],
  "rescueThresholds": {
    "solo": 12,
    "2": 18,
    "3": 28,
    "4": 40,
    "5": 52
  },
  "scoring": {
    "rescueMultiplier": 2,
    "healthyVitalityThreshold": 5,
    "healthyVitalityBonus": 4,
    "persistentBuildBonus": 2
  },
  "aiWeights": {
    "shelterPriority": 10,
    "firePriority": 12,
    "snarePriority": 8,
    "signalPlatformPriority": 7,
    "beaconPriority": 15,
    "stabilizePriority": 6,
    "lateSignalPriority": 10,
    "vitalityPriority": 8
  },
  "perks": {
    "builderEnabled": true,
    "providerEnabled": true,
    "trapperEnabled": true,
    "scoutEnabled": true
  }
}
```

`simulationCeiling` is the maximum rounds a simulation will run before forcing an end condition. It is not the intended game length — it prevents runaway games in batch sim.

---

## Profiles and Perks

Profiles give each player a distinct survival identity. Perks are individually toggleable in config. Running with all perks disabled must be a single config change for clean baseline testing.

### Builder
**Once per game:** Reduce one persistent recipe cost by 1 material of your choice when you craft it.

*Identity: gets infrastructure online faster. Most valuable in cold scenarios where Lean-To and Campfire are urgent. Best used on Signal Platform or Sturdy Shelter.*

### Provider
**Once per game:** When the first survival check fails at low Vitality, soften the damage and gain a supply buffer.

*Identity: emergency forager. Buys one round of grace when the economy collapses. Most valuable in high-pressure late rounds.*

### Trapper
When Snare is built, gain 1 Food immediately.

*Identity: food economy specialist. Immediate Food on Snare build helps it survive the opening pressure. Pairs well with Boiled Water for consistent check satisfaction.*

### Scout
The **first time** Simple Signal is built, gain +1 rescue (personal score and group track).

*Identity: early signal accelerator. Pushes the group rescue track faster than any other profile in the opening rounds.*

### Perk Implementation Rules

- Each perk is a data object with an `enabled` flag.
- Perks must fire through engine hooks, never UI code.
- Perk usage must be logged for simulation analysis.
- It must be possible to run zero active perks by setting all flags to false.

---

## TypeScript Types

```typescript
type MaterialType =
  | 'Wood'
  | 'Fiber'
  | 'Stone'
  | 'Food'
  | 'Water'
  | 'Rations'
  | 'CleanWater'
  | 'Fuel'
  | 'Cordage';

type RecipeTier = 1 | 2 | 3;

type RecipeType = 'persistent' | 'persistentEngine' | 'oneTime';

type RecipeFamily =
  | 'survival'
  | 'food-engine'
  | 'processing'
  | 'shelter-climate'
  | 'signal-rescue'
  | 'recovery';

type Tag =
  | 'Shelter'
  | 'SturdyShelter'
  | 'HearthActive'
  | 'SustainedFire'
  | 'FoodSource'
  | 'Tool'
  | 'SignalEngine';

type SurvivalCheck = 'hunger' | 'thirst' | 'warmth';

type EndCondition = 'rescue' | 'allCollapsed' | 'simulationCeiling';

type SpecialCardSource = 'starting' | 'earned';

type RoundEventFamily = 'opportunity' | 'escalation' | 'neutral';

interface Recipe {
  id: string;
  name: string;
  tier: RecipeTier;
  type: RecipeType;
  family: RecipeFamily;
  cost: Partial<Record<MaterialType, number>>;
  requiresTags: Tag[];
  requiresBuilds: string[];
  persistent: boolean;
  tags: Tag[];
  effects: EngineEffect[];
  maintenance?: MaintenanceRule;
  satisfiesCheck?: SurvivalCheck;
  designNotes: string;
  baseValue: number;
  // Print export fields
  printTitle: string;
  printCostText: string;
  printEffectText: string;
  printIconKeys: string[];
}

interface EngineEffect {
  type: 'vitality' | 'rescue' | 'materialGain' | 'materialIncome' | 'rescueBonus' | 'costReduction' | 'satisfyCheck';
  amount: number;
  condition?: string;
  duration?: 'permanent' | 'oneRound' | 'oncePerGame';
  targetCheck?: SurvivalCheck;
  material?: MaterialType;
}

interface MaintenanceRule {
  cost: Partial<Record<MaterialType, number>>;
  startRound?: number;
  interval?: number;
}

interface RoundEventDefinition {
  id: string;
  name: string;
  family: RoundEventFamily;
  description: string;
  scenarioIds: string[];
  startRound?: number;
  endRound?: number;
  temperatureShift?: number;
  pressureBonus?: Partial<Record<SurvivalCheck, number>>;
  signalRescueBonus?: number;
  recipeFamilyCostDelta?: Partial<Record<RecipeFamily, number>>;
}

interface SpecialCardDefinition {
  id: string;
  name: string;
  source: SpecialCardSource;
  family: RecipeFamily;
  designNotes: string;
  printEffectText: string;
  effects: SpecialCardEffect[];
}

interface OwnedSpecialCard {
  id: string;
  source: SpecialCardSource;
  earnedRound?: number;
  grantedBy?: string;
}

interface Perk {
  id: string;
  name: string;
  enabled: boolean;
  usedThisGame: boolean;
  description: string;
  triggerCondition: string;
}

interface Profile {
  id: string;
  name: string;
  perk: Perk;
  designNotes: string;
}

interface SurvivalStatus {
  hungerSatisfied: boolean;
  thirstSatisfied: boolean;
  warmthSatisfied: boolean;
  allChecksPassed: boolean;
}

interface PlayerState {
  id: string;
  name: string;
  profile: Profile;
  vitality: number;
  rescueScore: number;
  inventory: Partial<Record<MaterialType, number>>;
  hungerDebt: number;
  builtRecipes: string[];
  activeTags: Tag[];
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  specialCards: OwnedSpecialCard[];
  maintenanceInactiveRecipes: string[];
  survivalStatus: SurvivalStatus;
  isAI: boolean;
  aiStrategy?: AIStrategy;
  snareBonusRound?: number | null;
  pendingCostReduction?: { recipeId: string; material?: MaterialType; amount: number } | null;
  rescueBonuses?: Partial<Record<string, number>>;
}

interface MarketState {
  available: MaterialType[];
  roundDrawn: number[];
}

interface Scenario {
  id: string;
  name: string;
  bagComposition: Partial<Record<MaterialType, number>>;
  temperaturePressure: number;      // positive = cold, negative = heat, 0 = temperate
  rescueThresholdAdjust?: number;
  description: string;
}

interface GameState {
  gameId: string;
  scenario: Scenario;
  round: number;
  simulationCeiling: number;
  players: PlayerState[];
  groupRescueTrack: number;
  groupRescueThreshold: number;
  market: MarketState;
  bagRemaining: MaterialType[];
  turnOrder: string[];
  firstPlayerIndex: number;
  currentEvent: RoundEventInstance | null;
  gameOver: boolean;
  endCondition: EndCondition | null;
  winner: string | null;
  log: LogEntry[];
  rngSeed: number;
}

interface LogEntry {
  round: number;
  playerId: string;
  action: string;
  detail: string;
}

interface SimulationResult {
  gameId: string;
  rounds: number;
  endCondition: EndCondition;
  winner: string | null;
  groupRescueFinal: number;
  groupRescueThreshold: number;
  rescueReached: boolean;
  players: SimulationPlayerResult[];
  recipeUsageFrequency: Record<string, number>;
  tier2RecipeUsageFrequency: Record<string, number>;
  eventFrequencyByFamily: Record<RoundEventFamily, number>;
  eventFrequencyById: Record<string, number>;
  maintenanceFailureCount: number;
  maintenanceDowntimeCount: number;
  specialCardGrantFrequency: Record<string, number>;
  specialCardOwnershipFrequency: Record<string, number>;
  rngSeed: number;
  log: LogEntry[];
}

interface SimulationPlayerResult {
  playerId: string;
  profile: string;
  aiStrategy: string;
  finalScore: number;
  rescueScore: number;
  finalVitality: number;
  persistentBuilds: number;
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  builtRecipes: string[];
  firstTier2RecipeRound: number | null;
  checkFailuresByRound: Record<number, SurvivalCheck[]>;
}

interface BatchSimulationResult {
  count: number;
  scenario: string;
  perksEnabled: boolean;
  avgScore: number;
  avgRescue: number;
  avgVitality: number;
  survivalPercent: number;
  collapsePercent: number;
  rescueReachedPercent: number;
  allCollapsedPercent: number;
  simulationCeilingPercent: number;
  avgRoundsPlayed: number;
  collapseTimingDistribution: Record<number, number>;
  checkFailureFrequency: Record<SurvivalCheck, number>;
  recipeUsageFrequency: Record<string, number>;
  tier2RecipeUsageFrequency: Record<string, number>;
  eventFrequencyByFamily: Record<RoundEventFamily, number>;
  eventFrequencyById: Record<string, number>;
  maintenanceFailureCount: number;
  maintenanceDowntimeCount: number;
  specialCardGrantFrequency: Record<string, number>;
  specialCardOwnershipFrequency: Record<string, number>;
  byProfile: Record<string, ProfileBatchStats>;
}

interface ProfileBatchStats {
  avgScore: number;
  avgRescue: number;
  avgVitality: number;
  survivalPercent: number;
  perkUsagePercent: number;
  firstTier2RecipeAvgRound: number;
}

type AIStrategy = 'cautious' | 'balanced' | 'rescueFocused';

interface ValueContext {
  scenario: Scenario;
  round: number;
  playerCount: number;
}
```

---

## Engine Functions

All engine functions are pure. No hidden shared state. No mutation of inputs. Return new state objects.

```typescript
createNewGame(config: GameConfig): GameState
cloneGameState(state: GameState): GameState
drawFromBag(state: GameState, count: number): { drawn: MaterialType[], newState: GameState }
resolveMarketOverflow(market: MarketState, cap: number): MarketState
getAvailableRecipes(player: PlayerState, state: GameState): Recipe[]
canCraftRecipe(player: PlayerState, recipe: Recipe, state: GameState): boolean
payRecipeCost(player: PlayerState, recipe: Recipe): PlayerState
applyRecipeEffects(player: PlayerState, recipe: Recipe, state: GameState): { player: PlayerState, state: GameState }
resolveEngineIncome(player: PlayerState, state: GameState): PlayerState
resolveHungerCheck(player: PlayerState, state: GameState): { player: PlayerState, vitDamage: number }
resolveThirstCheck(player: PlayerState, state: GameState): { player: PlayerState, vitDamage: number }
resolveWarmthCheck(player: PlayerState, state: GameState): { player: PlayerState, vitDamage: number }
applyEndRoundPressure(player: PlayerState, state: GameState): PlayerState
applyVitalityRegen(player: PlayerState): PlayerState
scorePlayer(player: PlayerState, state: GameState): number
isPlayerCollapsed(player: PlayerState): boolean
checkGroupRescueThreshold(state: GameState): boolean
advanceRound(state: GameState): GameState
runGameSimulation(config: SimulationConfig): SimulationResult
runBatchSimulation(config: SimulationConfig, count: number): BatchSimulationResult
recipeValue(recipe: Recipe, context: ValueContext): number
```

### recipeValue()

Assigns a numerical weight to a recipe based on output relative to cost. Used to flag balance outliers before sim runs confirm them. Implement with configurable weights for rescue output per material, Vitality stability contribution, and engine multiplier potential. When a new recipe is added, compare its value score against the existing curve first.

### Three checks, three functions

`resolveHungerCheck`, `resolveThirstCheck`, and `resolveWarmthCheck` are separate functions. This keeps each survival system individually testable and makes it easy to adjust one without touching the others.

---

## AI Architecture

### Priorities (in order)

1. Satisfy immediate survival checks — if Vitality is at risk this round, stabilize first
2. Get `Shelter` or `HearthActive` online (scenario-weighted — cold scenarios raise fire priority)
3. Build Snare early if affordable
4. Build Signal Platform if affordable and not yet built
5. Build Signal Beacon when unlocked and possible
6. Craft Cooked Meal or Boiled Water if inventory allows and checks are at risk
7. Build Simple Signal late game if no stronger rescue line is available

### Functions

```typescript
evaluateRecipeOption(player: PlayerState, recipe: Recipe, state: GameState): number
chooseDraftPick(player: PlayerState, market: MarketState, state: GameState): MaterialType | null
chooseCraftAction(player: PlayerState, state: GameState): Recipe | null
simulateSingleTurnLookahead(player: PlayerState, state: GameState): Recipe | null
evaluateSurvivalRisk(player: PlayerState, state: GameState): SurvivalCheck[]
```

### Strategies

- **cautious** — prioritizes Vitality stability. Will always satisfy checks before pursuing rescue. Builds Shelter and Campfire before any signal work.
- **balanced** — follows default priority list. Balances survival infrastructure with signal output.
- **rescueFocused** — prioritizes signal output. Accepts Vitality risk. Will craft Simple Signal or Signal Beacon even at low Vitality if rescue output is high enough.

Strategy weights live in config under `aiWeights`. Adding a new strategy requires no engine changes.

---

## UI Views

### 1. Play View

Per player display:
- Round number and max rounds
- Group rescue track progress vs. threshold
- Turn order indicator with rotation history
- Per player: Vitality (with color indication of health level), rescue score, inventory, active tags, built recipes, special cards
- Survival check status for current round (hunger / thirst / warmth indicators)
- Center market contents with round-entered indicator
- Available recipes with affordability and requirement status highlighted
- Current round event (name, family, effects)
- Action log for current round

### 2. Simulation View

Controls:
- Player count (1–5)
- Scenario selector
- Profile selector per player
- AI strategy selector per player
- Perk toggle (all on / all off / individual)
- Run single game
- Run batch (10 / 100 / 1000 / custom)

Display:
- Average score by profile
- Average rescue by profile
- Average final Vitality by profile
- Survival percent
- Collapse percent and timing distribution
- Rescue-reached percent
- Check failure frequency by type (how often Hunger vs. Thirst vs. Warmth fails)
- Recipe craft frequency table (Tier 1 and Tier 2 separate)
- Event frequency by family and by id
- Maintenance failure and downtime counts
- Special card grant and ownership frequency
- First Tier 2 recipe average round
- Downloadable JSON results
- Downloadable CSV summary

### 3. Data / Debug View

- All recipes with `designNotes` and `baseValue` visible
- All special cards with effect descriptions
- All profiles and perks with live toggle controls
- Current config values (editable fields where safe)
- Scenario bag compositions and temperature pressure values
- Round events by scenario

---

## Simulation Output

Per-run output includes all `SimulationResult` fields and full action log including which checks failed each round per player.

Batch output includes all `BatchSimulationResult` fields. Exportable as JSON and CSV (one row per profile per batch).

Key metrics that matter most for balance:

- `checkFailureFrequency` — tells you which resource is most scarce relative to demand
- `collapseTimingDistribution` — tells you when pressure becomes fatal
- `firstTier2RecipeAvgRound` — tells you if Tier 2 feels early, late, or right
- `recipeUsageFrequency` — tells you which recipes are being ignored and why
- `eventFrequencyByFamily` — tells you if opportunity vs. escalation balance feels right
- `maintenanceDowntimeCount` — tells you if upkeep is punishing late-game infrastructure

---

## Print / Export Readiness

Every recipe data object contains print-ready fields. The export utility reads these and produces:

- Card export JSON (one object per card, all print fields included)
- CSV rows for printing (one row per card)
- Rules summary output (generated from engine config and recipe data)

Do not build print layout in V1. Build the data pipeline only. Structure must be in place from the first data file.

---

## Seedable RNG

All random draws use a seedable RNG utility:

```typescript
createRNG(seed: number): RNG
rng.next(): number
rng.pick<T>(array: T[]): T
rng.shuffle<T>(array: T[]): T[]
```

Seed stored in `GameState`. Every simulation result records the seed. Any result is reproducible by re-running with the same seed and config.

---

## Build Order

Build in this exact order. Do not start the next phase until the current one is verifiable.

1. **Types** — all interfaces and type aliases
2. **Data** — recipes, profiles, scenarios, config, special cards, events
3. **RNG utility** — seedable random used everywhere randomness is needed
4. **Headless engine** — all engine functions, zero React dependency
5. **Single-player test harness** — run one game in console to verify engine output
6. **AI logic** — evaluation and decision functions, all three strategies
7. **Simulation runner** — single and batch with full output structures
8. **React UI** — Play, Simulation, and Debug views
9. **Export helpers** — card JSON, CSV, rules summary

---

## Code Quality Expectations

- One responsibility per file. Keep files small and focused.
- Comments only where names cannot provide the clarity.
- Explicit names over short clever names.
- Validate recipe and config data at load time. Fail loudly on malformed data.
- No rules in UI code. If a game condition is written in a component, it is in the wrong place.
- Structure and naming must be self-documenting. Another session should be able to continue without a briefing.

---

## Design Philosophy

This is a prototype and balance lab first.

The purpose is:
- Prove the survival loop
- Tune the three-check pressure economy
- Compare profile identity across scenarios in simulation
- Surface broken recipes before they reach a physical prototype
- Prepare for print production

Every balance change is a config edit. Every new recipe is a data file edit. Every new scenario is a data file edit. If adding content requires touching engine code, the architecture has drifted from intent.

Survival should feel like survival. Hunger, thirst, and cold are real forces with real consequences. A player who ignores their checks to chase rescue signals should feel the cost in their Vitality before they feel it in their score.
