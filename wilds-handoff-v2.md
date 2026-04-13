# Wilds — Digital Prototype Handoff v2

## Design Identity

**"You're all stranded together. The rescue comes for everyone. But only one of you gets the trophy."**

Wilds is a **competitive survival game with shared stakes**. Players share the same environment, draw from the same material pools, and collectively contribute to a group rescue threshold that ends the game. But scoring is individual. Helping another player survive is always a calculated decision — a collapsed player stops contributing rescue signal, which can cost everyone the win. You cooperate when it serves you. You compete when it matters.

This identity shapes every mechanic. Keep it in view when making implementation decisions.

---

## Primary Goals

1. Build a playable digital prototype of the current baseline game loop.
2. Keep all game content data-driven so rules, recipes, materials, perks, and scoring can be edited without touching core engine code.
3. Add AI players that can simulate games for tuning and balance testing.
4. Make the architecture flexible enough to later generate printable card data and reference sheets from the same source files.
5. Support self-balancing through a recipe value model that can flag broken cards before sim runs confirm it.

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

**Important naming note:** `Fire` is both a material type and a persistent tag that players gain from building a Campfire. To avoid collision in engine logic, the persistent tag must be named `HearthActive` everywhere in data files and engine code. The material remains `Fire`.

---

## Scenario Bags

Materials are not drawn from a single uniform pool. Each scenario defines a **bag composition** — a weighted set of materials that reflects the terrain. All players share the same scenario bags for that game.

### Default Scenario Bags (V1 Baseline)

**Forest** (starting scenario)
- Wood: 6, Fiber: 5, Stone: 2, Food: 3, Water: 2, Fire: 0

**Rocky Highlands**
- Stone: 6, Wood: 3, Fiber: 2, Food: 1, Water: 2, Fire: 2

**River Delta**
- Water: 6, Food: 5, Fiber: 3, Wood: 2, Stone: 1, Fire: 0

**Volcanic**
- Fire: 5, Stone: 4, Wood: 2, Fiber: 1, Food: 1, Water: 1

Bag compositions live in data files. Adding a new scenario requires no code changes.

---

## Draft Mechanic — Keep 1 / Share 1

This is the core economic layer. It creates a shared negotiation space without requiring explicit trading rules.

### Each Round, Draft Phase:

1. **Bag draw:** Draw materials from the scenario bag equal to (number of players × 2) + 2. Place them all face-up in the **center market**.
2. **Private draw:** Each player privately draws 1 material directly from the bag. This is theirs — not shared, not negotiable.
3. **Market draft (turn order):** Starting with the first player and going clockwise, each player may take **1 material** from the center market. Players may pass.
4. **Leftover materials** remain in the center market and carry over to the next round (rolling market). The center market is capped at **6 materials**. When it would overflow, the oldest material(s) are discarded.
5. **Turn order rotates** clockwise each round. The player who went last this round goes first next round.

### Why This Works

- Every player always gets at least 1 material (private draw). No one is ever locked out.
- The center market creates genuine tension — do you take something good now, or leave it hoping it's still there next round?
- Putting a material in the center (by not drafting it) is a social signal. Experienced players read the table through the market.
- Rolling leftovers reward patience but punish hoarding via the overflow cap.
- Easy to sim: AI evaluates market materials against private draw and makes a binary take/pass decision.

---

## Rescue Model — Shared Threshold, Individual Contribution

### Group Rescue Track

- There is a shared **group rescue track** with a threshold based on player count:
  - Solo: 8
  - 2 players: 14
  - 3 players: 18
  - 4 players: 22
  - 5 players: 26
- Thresholds live in config. Tunable without code changes.
- When the group rescue track reaches or exceeds the threshold, **the game ends at the close of that round** (all players finish the round).

### Individual Rescue Contribution

- Each player tracks their own rescue score independently.
- When a player builds a signal recipe, their personal rescue score increases AND the same amount is added to the group rescue track.
- A player's individual rescue score is their scoring currency at the end of the game.
- A collapsed player stops contributing rescue. Their banked rescue remains on the group track permanently.

### Why This Works

- The rescue arrival feels earned by the group.
- Individual scoring keeps competition alive until the final round.
- A Scout who chains signal structures accelerates the game end — which hurts a Builder who needs more rounds. That's genuine tension.
- A collapsed player still contributed to the track before they went down, so collapse feels consequential but not catastrophic.

---

## Recipes

### Tier 1 (available from start)

| Recipe | Cost | Requires | Type | Effect |
|---|---|---|---|---|
| Lean-To | 1 Wood, 1 Fiber | — | Persistent | Adds `Shelter` tag |
| Campfire | 1 Wood, 1 Fire | — | Persistent | Adds `HearthActive` tag |
| Cooked Meal | 1 Food | `HearthActive` | One-time | +2 morale |
| Boiled Water | 1 Water | `HearthActive` | One-time | +2 morale |
| Snare | 1 Fiber, 1 Wood | — | Persistent Engine | Adds `FoodSource` tag; income each round |
| Basic Tool | 1 Wood, 1 Stone | — | Persistent Engine | Adds `Tool` tag; effect reserved for later |
| Simple Signal | 1 Stone, 1 Fire | — | One-time | +2 rescue (personal + group track) |
| Signal Platform | 1 Wood, 1 Stone, 1 Fiber | — | Persistent Engine | Adds `SignalEngine` tag; future signal recipes gain +1 rescue |

### Tier 2 (unlocks after player has built 1 Shelter OR HearthActive recipe)

Tier 2 unlocks when a player has at least one `Shelter` or `HearthActive` tag — not after a raw recipe count. This reinforces profile identity and makes the unlock feel earned rather than automatic.

| Recipe | Cost | Requires | Type | Effect |
|---|---|---|---|---|
| Sturdy Shelter | 1 Wood, 1 Stone | `Shelter` build | Persistent | Upgrades Shelter; adds `SturdyShelter` tag |
| Sustained Fire | 1 Wood, 1 Stone | `HearthActive` build | Persistent | Upgrades fire; adds `SustainedFire` tag |
| Signal Beacon | 1 Wood, 1 Stone, 1 Fiber | `SustainedFire` tag | One-time | +5 rescue (personal + group track) |

### Unlock Rule Change (from v1)

V1 used "2 completed recipes" as the Tier 2 unlock. This was replaced because it made Tier 1 feel like a speed bump — players hit Tier 2 by round 2 regardless of strategy. The new condition gates Tier 2 behind meaningful survival infrastructure, which is thematically correct and strategically interesting.

### Engine Rules

- **Snare:** At the start of each round's engine income phase, owner gains 1 Food.
- **Signal Platform:** When owner builds any signal recipe, that recipe gains +1 rescue (applied before adding to personal score and group track).
- **Basic Tool:** Implemented as a persistent engine object. No live effect in V1. Effect placeholder is toggleable in data. Do not wire a discount mechanic until it is isolated and confirmed in design.

---

## Round Flow

Each round proceeds in this exact order:

1. **Draft Phase** — Execute the Keep 1 / Share 1 draft as described above.
2. **Engine Income Phase** — Resolve all persistent engine effects for each player (Snare food gain, etc.).
3. **Craft Phase** — Each player may craft up to 1 recipe if they can pay the cost and meet requirements.
4. **Effect Phase** — Apply all recipe effects (morale changes, rescue additions, tag grants).
5. **Survival Pressure Phase** — Apply end-of-round survival checks.
6. **Round Advance** — Check win condition. If group rescue track has reached threshold, end the game after this round resolves fully. Otherwise advance round counter and rotate turn order.

---

## Survival Pressure

At the end of each round:

- Each player must spend 1 Food or lose 1 morale.
- If a player has neither a `Shelter` tag nor a `HearthActive` tag, they lose an additional 1 morale.

### Pressure Schedule (Configurable)

Pressure is not flat. A schedule defines Food cost per round, allowing escalation tuning without code changes:

```json
"pressureSchedule": [1, 1, 1, 2, 2]
```

One value per round. Engine reads the schedule by round index. If the game runs longer than the schedule, the last value repeats. Default is flat 1 for V1 but the hook must exist from day one.

---

## Collapse

- If a player's morale reaches 0 or below, they are **collapsed**.
- A collapsed player takes no further actions.
- Their banked rescue score remains permanently on the group rescue track.
- They do not contribute any further rescue.
- Collapse does not create a group penalty in V1 beyond the loss of future contribution. This keeps the rules clean for the first build and can be expanded later.
- Record `collapseRound` on the player state for simulation analysis.

---

## Scoring

Final score for each player:

```
score =
  (personal rescue × rescueMultiplier)
  + (remaining morale if alive)
  + (1 per persistent build)
  + (aliveRescueBonus if rescue >= aliveRescueThreshold AND alive)
  - (collapsePenalty if collapsed)
```

All weights are in config:

```json
"scoring": {
  "rescueMultiplier": 2,
  "aliveRescueThreshold": 6,
  "aliveRescueBonus": 3,
  "collapsePenalty": 1
}
```

---

## Config File

A single balance config file controls all tunable constants. No balance changes should require code edits.

```json
{
  "startingMorale": 5,
  "maxRounds": 7,
  "materialsPrivateDrawPerRound": 1,
  "marketCapSize": 6,
  "tier2UnlockCondition": "hasShelterOrHearth",
  "pressureSchedule": [1, 1, 1, 2, 2, 2, 2],
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

Profiles give each player a distinct identity. Perks are individually toggleable. Running the sim with all perks disabled should be a one-line config change for clean baseline testing.

### Builder
**Once per game:** Reduce one persistent recipe cost by 1 material of your choice, then draw 1 material privately from the bag.

### Provider
**Once per game:** Ignore 1 morale loss from the starvation check, but only if a Cooked Meal or Boiled Water was crafted this round.

### Trapper
When Snare is built, gain 1 Food immediately. On the **next round only**, Snare produces +1 extra Food during engine income.

### Scout
The **first time** Simple Signal is built, gain +1 rescue (personal and group track), but only if the player is not collapsed when built.

### Perk Implementation Rules

- Each perk is a data object with an `enabled` flag.
- Perks must fire through engine hooks, not UI code.
- It must be possible to run with zero active perks by setting all flags to false in config.
- Perk usage must be logged for simulation analysis.

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

interface Recipe {
  id: string;
  name: string;
  tier: RecipeTier;
  type: RecipeType;
  cost: Partial<Record<MaterialType, number>>;
  requiresTags: Tag[];
  requiresBuilds: string[];       // recipe ids
  persistent: boolean;
  tags: Tag[];                    // tags granted on build
  effects: EngineEffect[];
  designNotes: string;            // designer intent, never rendered in game
  baseValue: number;              // estimated value for balance tooling
  // Print export fields
  printTitle: string;
  printCostText: string;
  printEffectText: string;
  printIconKeys: string[];
}

interface EngineEffect {
  type: 'morale' | 'rescue' | 'materialIncome' | 'rescueBonus' | 'costReduction';
  amount: number;
  condition?: string;
  duration?: 'permanent' | 'oneRound' | 'oncePerGame';
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

interface PlayerState {
  id: string;
  name: string;
  profile: Profile;
  morale: number;
  rescueScore: number;
  inventory: Partial<Record<MaterialType, number>>;
  builtRecipes: string[];         // recipe ids
  activeTags: Tag[];
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  isAI: boolean;
  aiStrategy?: AIStrategy;
}

interface MarketState {
  available: MaterialType[];      // center market, ordered oldest first
  roundDrawn: number[];           // which round each material entered
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
  turnOrder: string[];            // player ids in current draft order
  firstPlayerIndex: number;
  gameOver: boolean;
  winner: string | null;
  log: LogEntry[];
  rngSeed: number;
}

interface Scenario {
  id: string;
  name: string;
  bagComposition: Partial<Record<MaterialType, number>>;
  description: string;
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
  finalMorale: number;
  persistentBuilds: number;
  collapsed: boolean;
  collapseRound: number | null;
  perkUsed: boolean;
  builtRecipes: string[];
  firstTier2RecipeRound: number | null;
}

interface BatchSimulationResult {
  count: number;
  scenario: string;
  perksEnabled: boolean;
  avgScore: number;
  avgRescue: number;
  avgMorale: number;
  survivalPercent: number;
  collapsePercent: number;
  rescueReachedPercent: number;
  avgRoundsPlayed: number;
  collapseTimingDistribution: Record<number, number>;
  recipeUsageFrequency: Record<string, number>;
  byProfile: Record<string, ProfileBatchStats>;
}

interface ProfileBatchStats {
  avgScore: number;
  avgRescue: number;
  survivalPercent: number;
  perkUsagePercent: number;
  firstTier2RecipeAvgRound: number;
}

type AIStrategy = 'cautious' | 'balanced' | 'rescueFocused';
```

---

## Engine Functions

All engine functions are pure. No hidden shared state. No mutation of inputs. Prefer explicit immutable updates or tightly controlled local mutation inside a single engine step that returns a new state.

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
applyEndRoundPressure(player: PlayerState, state: GameState): PlayerState
scorePlayer(player: PlayerState, state: GameState): number
isPlayerCollapsed(player: PlayerState): boolean
checkGroupRescueThreshold(state: GameState): boolean
advanceRound(state: GameState): GameState
runGameSimulation(config: SimulationConfig): SimulationResult
runBatchSimulation(config: SimulationConfig, count: number): BatchSimulationResult
recipeValue(recipe: Recipe, context: ValueContext): number
```

### recipeValue()

This function is the self-balancing hook. It assigns a numerical weight to a recipe based on its output relative to its cost. When a new recipe is added, its value score can be compared against the existing curve before sim runs validate it. Implement a simple version first — rescue output per material spent, morale stability contribution, engine multiplier potential — and make the weights configurable.

---

## AI Architecture

### Priorities (in order)

1. Get `Shelter` or `HearthActive` online early
2. Build Snare early if affordable
3. Build Signal Platform if affordable and not yet built
4. Build Signal Beacon when unlocked and possible
5. Craft Cooked Meal or Boiled Water if morale is low
6. Build Simple Signal late game if no stronger rescue line is available

### Functions

```typescript
evaluateRecipeOption(player: PlayerState, recipe: Recipe, state: GameState): number
chooseDraftPick(player: PlayerState, market: MarketState, state: GameState): MaterialType | null
chooseCraftAction(player: PlayerState, state: GameState): Recipe | null
simulateSingleTurnLookahead(player: PlayerState, state: GameState): Recipe | null
```

### Strategies

Three pluggable strategies for V1:

- **cautious** — prioritizes morale stability and Shelter/Fire before signaling
- **balanced** — follows the default priority list
- **rescueFocused** — prioritizes signal output, accepts morale risk

Strategy weights live in config under `aiWeights`. Adding a new strategy requires no engine changes.

---

## UI Views

### 1. Play View

Display per player:
- Round number and max rounds
- Group rescue track progress vs. threshold
- Turn order indicator
- Per-player: morale, rescue score, inventory, active tags, built recipes
- Center market contents (with round-entered indicator for overflow awareness)
- Available recipes with affordability highlighted
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
- Survival percent
- Collapse percent
- Rescue-reached percent
- Collapse timing distribution (which round collapses happen)
- Recipe craft frequency table
- First Tier 2 recipe average round
- Downloadable JSON results
- Downloadable CSV summary

### 3. Data / Debug View

Display raw loaded data:
- All recipes (with designNotes and baseValue visible)
- All profiles and perks
- Current config values
- Perk toggles (live, affect next simulation run)
- Scenario bag compositions

---

## Simulation Output

Per-run output includes:
- All `SimulationResult` fields
- Full action log

Batch output includes:
- All `BatchSimulationResult` fields
- Exportable as JSON
- Exportable as CSV with one row per profile per batch

---

## Print / Export Readiness

Every recipe data object already contains print-ready fields (`printTitle`, `printCostText`, `printEffectText`, `printIconKeys`). The export utility reads these fields and transforms them into:

- Card export JSON (one object per card)
- CSV rows for printing (one row per card)
- Rules summary output (generated from engine config and recipe data)

Do not build print layout in V1. Build the data pipeline only.

---

## Seedable RNG

All random draws (bag draws, any tie-breaking) must use a seedable RNG utility:

```typescript
createRNG(seed: number): RNG
rng.next(): number           // 0 to 1
rng.pick(array): T           // random element
rng.shuffle(array): T[]
```

Seed is stored in `GameState`. Simulation results record the seed. This makes any result reproducible by re-running with the same seed.

---

## Nice to Have (if time allows)

- Save/load JSON snapshot of a full GameState
- Replay log viewer that steps through a saved log
- Toggle between baseline (no perks) and perk-enabled modes from the UI
- Scenario builder in the debug view

---

## Build Order

Build in this exact order. Do not start the next phase until the current one is verifiable.

1. **Types** — all interfaces and type aliases
2. **Data** — recipes, profiles, scenarios, config
3. **RNG utility** — seedable random, used everywhere random is needed
4. **Headless engine** — all engine functions, no React dependency
5. **Single-player test harness** — run one game in console/terminal to verify engine
6. **AI logic** — evaluation and decision functions, all three strategies
7. **Simulation runner** — single and batch, with output structures
8. **React UI** — Play, Simulation, and Debug views
9. **Export helpers** — card JSON, CSV, rules summary

---

## Code Quality Expectations

- Keep files small and focused. One responsibility per file.
- Use comments only where they add clarity that names cannot provide.
- Prefer explicit names over short clever names.
- Add basic validation for malformed recipe or config data at load time.
- No rules in UI code. If you find yourself writing a game condition in a component, stop and move it to the engine.
- Make it easy for another AI session to continue the work. Structure and naming should be self-documenting.

---

## Design Philosophy

This is a prototype and balance lab first.

The purpose is:
- Prove the game loop
- Tune the material economy
- Compare profile identity in simulation
- Surface broken recipes before they reach a physical prototype
- Prepare for later print production

Favor clarity, testability, and data-driven design over visual polish. Every balance change should be a config edit. Every new recipe should be a data file edit. Every new profile should be a data file edit. If adding content requires touching engine code, the architecture has drifted from intent.
