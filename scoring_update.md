You are auditing and overhauling the **scoring system** for **The Wilds** so the score spread is narrower, fairer across multiple play styles, and still fun.

## Main Goal

Reduce score swing between players without making the game flat or boring.

The final scoring model should:

* reward different viable play styles fairly
* reduce runaway leads
* reduce giant point spikes from a small number of crafts
* keep the game exciting and satisfying
* make scoring feel earned through play, not accidental through one overpowered lane

## Current Problem

The score spread is too large.
Some players can score much higher than others depending on which craft lane or engine they hit.
This suggests that some scoring paths are:

* too explosive
* too front-loaded
* too recursive
* too rewarding for utility that is already strong
* or too dependent on a few high-value moments

## Design Goal

Scoring should support multiple ways to win:

* survival infrastructure
* food procurement and preparation
* water and recovery support
* rescue signaling
* zone-use efficiency
* riskier strategic lines

But those paths should have **similar total scoring ceilings** over the course of a normal game.

## Your Job

Audit the entire scoring system and rebalance it.

Review:

* craft points
* recurring points
* rescue points
* endgame points
* support/recovery points
* points from utilities and engines
* points from epic or higher-tier crafts
* points from successful zone-use actions
* anything that snowballs score disproportionately

## Phase 1  Identify Scoring Problems

Look through the whole game and identify:

1. which scoring sources are too large
2. which scoring sources stack too well
3. which scoring sources pay players twice for the same advantage
4. which paths have much higher scoring ceilings than others
5. which scoring sources are too front-loaded
6. which scoring sources are too passive
7. whether rescue scoring is too weak or too spiky
8. whether survival itself is under-rewarded or over-rewarded

Output a structured diagnosis.

## Phase 2  Establish Scoring Principles

Create a clear scoring philosophy for the game.

Suggested principles:

* strong utility should not also be top-tier scoring
* recurring points should be small and controlled
* epic crafts should feel powerful because of gameplay impact, not just big point values
* rescue should score in smaller chunks, not giant jackpots
* support and recovery play should be worth something, but not dominate
* multiple strategies should end in a similar score range

Refine and apply these principles.

## Phase 3  Rebuild the Scoring Framework

Create a scoring system with these buckets:

### A. Craft Points

Points for crafting something.

### B. Use Points

Points for successfully using certain tools or executing meaningful actions.

### C. Rescue Contribution Points

Points for helping move the rescue track.

### D. Endgame Survival Points

Points for still being alive / stable at the end.

### E. Recurring / Engine Points

Very limited passive points from long-term builds.

For each bucket, recommend:

* what should score
* how much it should score
* what should NOT score

## Phase 4  Normalize Score Ceiling by Strategy

Review major strategic lanes and make sure they have comparable scoring potential.

These should all be evaluated:

* Fire / Shelter infrastructure
* Water / Medicine support
* Food procurement / preparation
* Utility / tools
* Rescue signaling
* Epic / tier 3 crafts
* Support / stabilization play

For each lane:

* estimate its realistic total score potential in a normal game
* identify overperforming lanes
* identify underperforming lanes
* adjust so no lane has a much higher ceiling than the others

## Phase 5  Control Runaway Scoring

Specifically look for score sources that create runaway leads.

Audit:

* per-round point engines
* stacked passive scoring
* utility crafts that also score too much
* large one-time reward spikes
* endgame bonuses that erase the rest of the game

Reduce runaway scoring without removing excitement.

## Phase 6  Recommend Point Value Targets

Create a new point-value structure for the game.

Suggested target framework:

* Tier 1 crafts: small points
* Tier 2 crafts: moderate points
* Tier 3 / epic crafts: meaningful but not huge points
* successful zone-use: small reward
* rescue contribution: incremental reward
* endgame survival: modest reward
* recurring points: capped and low

Refine that into a concrete recommendation.

## Phase 7  Output a Scoring Overhaul

Provide:

### 1. A written diagnosis

What is currently causing unfair or wide score spread.

### 2. A scoring philosophy

The rules for what should and should not score heavily.

### 3. A new scoring framework

How the scoring system should work going forward.

### 4. Specific point change recommendations

For:

* crafts
* rescue
* recurring effects
* endgame bonuses
* epic crafts
* successful tool use

### 5. A practical implementation plan

List the easiest high-impact scoring changes first.

---

# PRODUCTION ORDER

Use this as the build sequence for the scoring revision. Keep the base scoring model stable before tuning edge cases.

## Step 1: Lock the scoring philosophy

### Task
Define what should score heavily and what should stay secondary.

### Done when

* utility is not also top-tier scoring
* recurring points are small and capped
* rescue is rewarded, but not through giant jackpots
* survival matters, but does not dominate every route

### Why this comes first

If the scoring philosophy is unclear, every point tweak will pull the game in a different direction.

## Step 2: Audit every scoring source

### Task
List every current point source and sort it by lane.

### Done when

* craft points are separated from use points
* rescue points are separated from survival points
* engine points are separated from one-time points
* every source is marked as front-loaded, recurring, or endgame

### Design rule

No scoring source should be invisible inside another one.

## Step 3: Find double-dips

### Task
Identify places where one action gets rewarded more than once.

### Done when

* strong utility does not also become strong scoring without cause
* future-bonus chains are not stacking too hard
* rescue chains are not multiplying unrelated rewards
* passive engines are not generating both power and score uncontested

### Design rule

If a lane solves survival and also wins scoring, it is too efficient.

## Step 4: Set lane ceilings

### Task
Give each major strategy lane a similar realistic scoring ceiling.

### Done when

* fire / shelter
* water / recovery
* food / preparation
* utility / tools
* rescue / signal
* epic / tier 3 crafts
* support / stabilization

all finish in the same general score band

### Design rule

The best lane should be different, not strictly bigger.

## Step 5: Reduce point spikes

### Task
Lower the biggest one-time rewards that distort the endgame.

### Done when

* epic crafts feel powerful because of gameplay impact
* rescue contributions are incremental, not explosive
* recurring points are capped hard enough to prevent runaway leads
* endgame bonuses do not erase the rest of the match

### Design rule

Big moments should matter, but not decide the game alone.

## Step 6: Rebuild the scoring buckets

### Task
Assign clear values to the major scoring buckets.

### Done when

* craft points are modest and predictable
* use points are limited
* rescue contribution is incremental
* survival points reward stability without becoming a farm
* recurring engine points are the smallest and most controlled bucket

### Design rule

Every bucket should have a reason to exist.

## Step 7: Compare strategies against the new curve

### Task
Test score outcomes across the main viable routes.

### Done when

* no lane is far above the others in a normal game
* no lane is so weak that it feels like a trap
* skillful play produces tighter score bands

### Design rule

Different strategies should win through execution, not raw scoring ceiling.

## Step 8: Tune special cases last

### Task
Adjust special cards, outlier recipes, and edge-case bonuses after the core structure is stable.

### Done when

* special cards do not break the scoring curve
* one-off recipes are not hiding runaway value
* late-game bonuses remain meaningful but controlled

### Design rule

Do not tune exceptions before the base system is stable.

## Important Constraints

* Do not remove fun moments
* Do not flatten all point values into sameness
* Do not make every path identical
* Keep the survival identity of the game
* Keep risk/reward in the system
* Narrow the score window, but preserve excitement

## Final Objective

The end result should make players feel:

* different strategies are viable
* big moments still matter
* nobody wins from one broken scoring lane
* survival, preparation, and rescue all matter
* the score spread is tighter and more skillful

The scoring system should be **fairer, tighter, and still dramatic**.
