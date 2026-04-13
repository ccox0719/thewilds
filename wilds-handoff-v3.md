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

Six material types:

- Wood
- Fiber
- Stone
- Food
- Water
- Fire

**Naming note:** `Fire` is both a spendable material and a persistent tag granted by Campfire. The persistent tag is named `HearthActive` everywhere in data files and engine code. The material remains `Fire`. Never use these interchangeably.

---

## Vitality — The Only Health Pool

There is no morale system. Vitality is the single measure of a player's physical condition.

- **Starting Vitality:** 10
- **Collapse condition:** Vitality ≤ 0
- **Natural regen:** +1 Vitality at the end of any round where all three survival checks pass
- **No other passive regen.** Recovery requires either all checks passing or specific recipe effects.

Vitality represents the body, not the mind. It drops when a player is hungry, thirsty, or exposed to dangerous temperatures. It recovers slowly when a player is genuinely stable.

---

## Scenario Bags

Materials are drawn from a weighted pool defined by the scenario. All players share the same scenario bags. Bag compositions live in data files. Adding a new scenario requires no code changes.

### Default Scenarios (V1)

**Forest** *(temperate, starting scenario)*
- Wood: 6, Fiber: 5, Stone: 2, Food: 3, Water: 2, Fire: 0
- `temperaturePressure: 0`

**Rocky Highlands** *(cold)*
- Stone: 6, Wood: 3, Fiber: 2, Food: 1, Water: 2, Fire: 2
- `temperaturePressure: 2`

**River Delta** *(temperate)*
- Water: 6, Food: 5, Fiber: 3, Wood: 2, Stone: 1, Fire: 0
- `temperaturePressure: 0`

**Volcanic** *(cold pressure offset by Fire abundance)*
- Fire: 5, Stone: 4, Wood: 2, Fiber: 1, Food: 1, Water: 1
- `temperaturePressure: 1`

**Desert** *(hot — future expansion slot)*
- Stone: 5, Fire: 3, Food: 2, Water: 2, Wood: 2, Fiber: 2
- `temperaturePressure: -2`

The sign of `temperaturePressure` drives engine behavior. Positive = cold. Negative = heat. Zero = no warmth check. One field handles all three cases now and in future scenarios.

---

## Temperature Model

The warmth check reads `temperaturePressure` from the scenario and applies it as follows:

### Cold Scenarios (`temperaturePressure > 0`)

| Player state | Vitality loss |
|---|---|
| No shelter, no HearthActive | `temperaturePressure` |
| Has `Shelter` tag (Lean-To) | `temperaturePressure - 1` (min 0) |
| Has `HearthActive` tag (Campfire) | 0 |

Lean-To reduces cold exposure. Campfire eliminates it.

### Temperate Scenarios (`temperaturePressure = 0`)

No warmth check. Lean-To and Campfire retain full utility for cooking and Vitality regen eligibility.

### Hot Scenarios (`temperaturePressure < 0`, future expansion)

| Player state | Vitality loss |
|---|---|
| No shelter | `abs(temperaturePressure)` |
| Has `Shelter` tag (Lean-To) | 0 — shade fully solves heat |
| Has `HearthActive` tag (Campfire) | No effect on heat — fire does not cool |

Campfire remains universally necessary in hot scenarios because cooking and boiling water require `HearthActive` regardless of temperature. Players who skip Campfire in a desert scenario cannot use Cooked Meal or Boiled Water. This is intentional and teachable.

Lean-To is the most universally valuable Tier 1 build in the game. It mitigates cold, eliminates heat exposure, and costs only 1 Wood + 1 Fiber. Watch its value score in simulation — it may be undercosted.

---

## Draft Mechanic — Keep 1 / Share 1

### Each Round, Draft Phase

1. **Bag draw:** Draw materials from the scenario bag equal to `(playerCount × 2) + 2`. Place all face-up in the **center market**.
2. **Private draw:** Each player privately draws 1 material directly from the bag. This is theirs. It is not shared.
3. **Market draft (turn order):** Starting with the first player, going clockwise, each player may take 1 material from the center market. Players may pass.
4. **Leftover materials** carry over to the next round. The center market is capped at **6 materials**. When overflow occurs, the oldest material(s) are discarded.
5. **Turn order rotates** clockwise each round. The player who went last this round goes first next round.

Every player always receives at least 1 material per round from their private draw. No player can be locked out of the game by a bad market.

---

## Rescue Model — Shared Threshold, Individual Contribution

### Group Rescue Track

A shared track with a threshold based on player count:

```json
"rescueThresholds": {
  "solo": 8,
  "2": 14,
  "3": 18,
  "4": 22,
  "5": 26
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

### Tier 1 (available from start)

| Recipe | Cost | Requires | Type | Effect |
|---|---|---|---|---|
| Lean-To | 1 Wood, 1 Fiber | — | Persistent | Grants `Shelter` tag. Reduces cold Vitality loss by 1. Eliminates heat Vitality loss. |
| Campfire | 1 Wood, 1 Fire | — | Persistent | Grants `HearthActive` tag. Eliminates cold Vitality loss. Required for cooking. |
| Cooked Meal | 1 Food | `HearthActive` | One-time | Satisfies Hunger check this round. Restores 1 Vitality. |
| Boiled Water | 1 Water | `HearthActive` | One-time | Satisfies Thirst check this round. Restores 1 Vitality. |
| Snare | 1 Fiber, 1 Wood | — | Persistent Engine | Grants `FoodSource` tag. Owner gains 1 Food at start of engine income each round. |
| Basic Tool | 1 Wood, 1 Stone | — | Persistent Engine | Grants `Tool` tag. Effect reserved. Placeholder toggleable in data. |
| Simple Signal | 1 Stone, 1 Fire | — | One-time | +2 rescue (personal score + group track). |
| Signal Platform | 1 Wood, 1 Stone, 1 Fiber | — | Persistent Engine | Grants `SignalEngine` tag. All future signal recipes built by this player gain +1 rescue. |

### Tier 2 (unlocks when player has at least one `Shelter` or `HearthActive` tag)

Tier 2 gates behind meaningful survival infrastructure, not a raw recipe count. A player who has established warmth or shelter has proven enough stability to attempt more advanced builds.

| Recipe | Cost | Requires | Type | Effect |
|---|---|---|---|---|
| Sturdy Shelter | 1 Wood, 1 Stone | `Shelter` tag | Persistent | Grants `SturdyShelter` tag. Fully eliminates cold and heat Vitality loss (replaces Lean-To protection). |
| Sustained Fire | 1 Wood, 1 Stone | `HearthActive` tag | Persistent | Grants `SustainedFire` tag. Upgrades fire infrastructure. Required for Signal Beacon. |
| Signal Beacon | 1 Wood, 1 Stone, 1 Fiber | `SustainedFire` tag | One-time | +5 rescue (personal score + group track). |

### Engine Rules

- **Snare:** During engine income phase, owner gains 1 Food.
- **Signal Platform:** When owner builds any signal recipe after this, that recipe's rescue value increases by 1 before being applied to personal score and group track.
- **Basic Tool:** Implemented as a persistent engine object. No live effect in V1. Effect placeholder must be isolated and toggleable in data before any discount mechanic is wired.

---

## Round Flow

Each round proceeds in this exact order:

1. **Draft Phase** — Execute the Keep 1 / Share 1 draft.
2. **Engine Income Phase** — Resolve all persistent engine effects for each player (Snare food gain, etc.).
3. **Craft Phase** — Each player may craft up to 1 recipe if they can pay the cost and meet all requirements.
4. **Effect Phase** — Apply all recipe effects (Vitality changes, rescue additions, tag grants).
5. **Survival Pressure Phase** — Apply the three survival checks in order for each player.
6. **Vitality Regen Check** — Any player who passed all three checks gains 1 Vitality.
7. **Round Advance** — Check win condition. If group rescue track has reached threshold, end game after this round resolves fully. Otherwise advance round counter and rotate turn order.

---

## Survival Pressure Phase

At the end of each round, apply these three checks in order for each player. Each unmet check costs Vitality. The pressure schedule scales the cost by round.

### Check 1 — Hunger

Spend 1 Food or lose `pressureSchedule[round]` Vitality.

Cooked Meal satisfies this check automatically for the round it is crafted, regardless of Food in inventory.

### Check 2 — Thirst

Spend 1 Water or lose `pressureSchedule[round]` Vitality.

Boiled Water satisfies this check automatically for the round it is crafted, regardless of Water in inventory.

### Check 3 — Warmth

Apply temperature model based on scenario `temperaturePressure` and player's active tags. See Temperature Model section.

Warmth check Vitality loss is **not** scaled by pressure schedule. It is always the flat value from the temperature model. Only Hunger and Thirst scale with the pressure schedule.

### Pressure Schedule

```json
"pressureSchedule": [1, 1, 1, 2, 2, 3, 3]
```

One value per round index. If the game runs longer than the schedule length, the last value repeats. Default escalates from round 4 onward. Tunable in config without code changes.

### Vitality Regen

After all three checks resolve, any player who passed all three gains **+1 Vitality**. This rewards genuine stability and creates a meaningful difference between a player who is barely surviving and one who has built proper infrastructure.

---

## Collapse

- Vitality ≤ 0: player is **collapsed**.
- Collapsed players take no further actions.
- Their banked rescue score remains permanently on the group rescue track.
- They contribute no further rescue.
- Collapse does not create a group penalty in V1 beyond loss of future contribution.
- Record `collapseRound` on player state for simulation analysis.

---

## Scoring

```
finalScore =
  (personalRescue × rescueMultiplier)
  + (remainingVitality if alive)
  + (1 per persistent build)
  + (aliveRescueBonus if personalRescue >= aliveRescueThreshold AND alive)
  - (collapsePenalty if collapsed)
```

All weights are in config:

```json
"scoring": {
  "rescueMultiplier": 2,
  "aliveRescueThreshold": 6,
  "aliveRescueBonus": 3,
  "collapsePenalty": 1,
  "persistentBuildBonus": 1
}
```

Vitality replaces morale in the alive scoring bonus. A player who survives in good physical condition scores better than one who barely made it.

---

## Config File

```json
{
  "startingVitality": 10,
  "maxRounds": 7,
  "materialsPrivateDrawPerRound": 1,
  "marketCapSize": 6,
  "tier2UnlockCondition": "hasShelterOrHearth",
  "pressureSchedule": [1, 1, 1, 2, 2, 3, 3],
  "rescueThresholds": {
    "solo": 8,
    "2": 14,
    "3": 18,
    "4": 22,
    "5": 26
  },
  "scoring": {
    "rescueMultiplier": 2,
    "aliveRescueThreshold": 6,
    "aliveRescueBonus": 3,
    "collapsePenalty": 1,
    "persistentBuildBonus": 1
  },
  "aiWeights": {
    "shelterPriority": 10,
    "firePriority": 9,
    "snarePriority": 8,
    "signalPlatformPriority": 7,
    "beaconPriority": 9,
    "stabilizePriority": 6,
    "lateSignalPriority": 5
  },
  "perks": {
    "builderEnabled": true,
    "providerEnabled": true,
    "trapperEnabled": true,
    "scoutEnabled": true
  }
}
```

---

## Profiles and Perks

Profiles give each player a distinct survival identity. Perks are individually toggleable in config. Running with all perks disabled must be a single config change for clean baseline testing.

### Builder
**Once per game:** Reduce one persistent recipe cost by 1 material of your choice, then draw 1 material privately from the bag.

*Identity: gets infrastructure online faster than anyone. Most valuable in cold scenarios where Lean-To and Campfire are urgent.*

### Provider
**Once per game:** Automatically satisfy one failed survival check (Hunger, Thirst, or Warmth — whichever would deal damage first that round) without spending a material.

*Identity: emergency forager. Buys one round of grace when the economy collapses. Most valuable in high-pressure late rounds.*

### Trapper
When Snare is built, gain 1 Food immediately. On the **next round only**, Snare produces +1 extra Food during engine income.

*Identity: food economy specialist. Snowballs once Snare is established. Pairs well with Boiled Water for consistent check satisfaction.*

### Scout
The **first time** Simple Signal is built, gain +1 rescue (personal score and group track), but only if the player is not collapsed when built.

*Identity: early signal accelerator. Pushes the group rescue track faster than any other profile in the opening rounds. Creates natural tension with Builder who wants more rounds.*

### Perk Implementation Rules

- Each perk is a data object with an `enabled` flag.
- Perks must fire through engine hooks, never UI code.
- Perk usage must be logged for simulation analysis.
- It must be possible to run zero active perks by setting all flags to false.

---

## TypeScript Types

```typescript
type MaterialType = 'Wood' | 'Fiber' | 'Stone' | 'Food' | 'Water' | 'Fire';

type RecipeTier = 1 | 2 | 3;

type RecipeType = 'persistent' | 'persistentEngine' | 'oneTime';

type Tag =
  | 'Shelter'
  | 'SturdyShelter'
  | 'HearthActive'
  | 'SustainedFire'
  | 'FoodSource'
  | 'Tool'
  | 'SignalEngine';

type SurvivalCheck = 'hunger' | 'thirst' | 'warmth';

interface Recipe {
  id: string;
  name: string;
  tier: RecipeTier;
  type: RecipeType;
  cost: Partial<Record<MaterialType, number>>;
  requiresTags: Tag[];
  requiresBuilds: string[];
  persistent: boolean;
  tags: Tag[];
  effects: EngineEffect[];
  satisfiesCheck?: SurvivalCheck;   // hunger or thirst for Cooked Meal / Boiled Water
  designNotes: string;              // designer intent, never rendered in game
  baseValue: number;                // estimated value for balance tooling
  // Print export fields
  printTitle: string;
  printCostText: string;
  printEffectText: string;
  printIconKeys: string[];
}

interface EngineEffect {
  type: 'vitality' | 'rescue' | 'materialIncome' | 'rescueBonus' | 'costReduction' | 'satisfyCheck';
  amount: number;
  condition?: string;
  duration?: 'permanent' | 'oneRound' | 'oncePerGame';
  targetCheck?: SurvivalCheck;
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
  builtRecipes: string[];
  activeTags: Tag[];
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  survivalStatus: SurvivalStatus;   // updated each pressure phase
  isAI: boolean;
  aiStrategy?: AIStrategy;
}

interface MarketState {
  available: MaterialType[];
  roundDrawn: number[];             // which round each material entered, for overflow
}

interface Scenario {
  id: string;
  name: string;
  bagComposition: Partial<Record<MaterialType, number>>;
  temperaturePressure: number;      // positive = cold, negative = heat, 0 = temperate
  description: string;
}

interface GameState {
  gameId: string;
  scenario: Scenario;
  round: number;
  maxRounds: number;
  players: PlayerState[];
  groupRescueTrack: number;
  groupRescueThreshold: number;
  market: MarketState;
  bagRemaining: MaterialType[];
  turnOrder: string[];
  firstPlayerIndex: number;
  gameOver: boolean;
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
  winner: string | null;
  groupRescueFinal: number;
  groupRescueThreshold: number;
  rescueReached: boolean;
  players: SimulationPlayerResult[];
  recipeUsageFrequency: Record<string, number>;
  rngSeed: number;
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
  checkFailuresByRound: Record<number, SurvivalCheck[]>;  // which checks failed each round
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
  avgRoundsPlayed: number;
  collapseTimingDistribution: Record<number, number>;
  checkFailureFrequency: Record<SurvivalCheck, number>;   // how often each check fails across all games
  recipeUsageFrequency: Record<string, number>;
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
evaluateSurvivalRisk(player: PlayerState, state: GameState): SurvivalCheck[]  // which checks are at risk
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
- Per player: Vitality (with color indication of health level), rescue score, inventory, active tags, built recipes
- Survival check status for current round (hunger / thirst / warmth indicators)
- Center market contents with round-entered indicator
- Available recipes with affordability and requirement status highlighted
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
- Recipe craft frequency table
- First Tier 2 recipe average round
- Downloadable JSON results
- Downloadable CSV summary

### 3. Data / Debug View

- All recipes with `designNotes` and `baseValue` visible
- All profiles and perks with live toggle controls
- Current config values (editable fields where safe)
- Scenario bag compositions
- Temperature pressure values per scenario

---

## Simulation Output

Per-run output includes all `SimulationResult` fields and full action log including which checks failed each round per player.

Batch output includes all `BatchSimulationResult` fields. Exportable as JSON and CSV (one row per profile per batch).

Key metrics that matter most for balance:

- `checkFailureFrequency` — tells you which resource is most scarce relative to demand
- `collapseTimingDistribution` — tells you when pressure becomes fatal
- `firstTier2RecipeAvgRound` — tells you if Tier 2 feels early, late, or right
- `recipeUsageFrequency` — tells you which recipes are being ignored and why

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
2. **Data** — recipes, profiles, scenarios, config
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
