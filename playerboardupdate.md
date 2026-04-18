You are redesigning the **player board and quick-reference systems** for **The Wilds** so the game is easier to read and smoother to play at the table and in the digital prototype.

## Main Goal

Make the survival systems more intuitive by giving each one a different physical/visual logic instead of treating them all like similar bars.

The current issue is that Hunger, Hydration, Warmth, and Morale do not all want to behave the same way. The board should teach the game more clearly.

## New Direction

Redesign the player board around these concepts:

### Hunger

Hunger should remain a more traditional survival need track or damage/need meter.
It represents food pressure over time.

### Hydration

Hydration should **not** just be a simple refill bar.
Instead, consumed water should be placed onto the player board as visible protection.

#### Desired Hydration behavior

* when a player drinks water, they place one or more blue cubes/tokens into hydration spaces on the player board
* those cubes show that the player is protected from hydration loss / dehydration damage
* when the game would cause hydration damage, remove a cube instead
* if no cube is present in the required space, the player takes the printed hydration penalty
* this should make safe/purified water feel more valuable than unsafe water

#### Important design intent

Hydration should feel like a short-term protection buffer, not just another number bar.

### Warmth

Warmth should behave more like the **military marker in 7 Wonders Duel** than like a normal resource bar.

#### Desired Warmth behavior

* use a horizontal left/right track
* center = comfort band
* left side = cold danger
* right side = heat danger
* scenario/environment pushes the marker left or right
* fire, shelter, rest, sleep, weather, and actions can push it back toward center or farther outward
* players should immediately understand “too cold / comfortable / too hot” from the track position

#### Important design intent

Warmth is a positional state, not a stored resource like food or water.

### Morale

Morale can remain a simpler meter or compact stability track, but it should visually feel different enough from Hunger to avoid confusion.

### Rescue

Rescue should remain a shared progress track, but its relationship to the player board and action icons should be made clearer.

---

# PHASE 1  AUDIT THE CURRENT PLAYER BOARD

Review the current print-side and digital-side player board.

Identify:

1. what is confusing about the current Hunger / Hydration / Warmth presentation
2. which systems currently feel too similar
3. where the board is failing to teach the game state clearly
4. where recipe cards and player board symbols do not line up
5. what information is missing for smooth play

Output a structured board audit.

---

# PHASE 2  REDESIGN THE PLAYER BOARD SYSTEMS

Create a new player board model using these principles:

## Hunger

* traditional track or meter
* clear depletion logic
* visually tied to food icons and food-restoration effects

## Hydration

* visible cube/token spaces
* each filled space prevents or absorbs hydration damage
* empty spaces show the printed dehydration consequence
* purified water should fill more spaces and/or grant better protection than unsafe water

## Warmth

* left/right positional track
* clearly marked comfort band in center
* left side labeled cold danger
* right side labeled heat danger
* scenario, fire, shelter, and actions should move the marker

## Morale

* compact track or meter
* should visually differ from Hunger and Hydration
* should communicate efficiency / stability

## Rescue

* still shared, but tied clearly to signal icons and rescue actions

Output a recommended board layout and system logic.

---

# PHASE 3  MAKE PRINT-SIDE QUICK REFERENCES MATCH THE NEW BOARD

Update the print-side system so that recipe cards and quick-reference materials clearly reflect the new board behavior.

## For hydration-related recipes

They should clearly show:

* how many hydration cubes they fill
* whether the water is safe or unsafe
* whether they treat, store, or protect

## For warmth-related recipes

They should clearly show:

* how they move the warmth marker
* whether they stabilize the comfort band
* whether they reduce cold or heat pressure
* whether they help rest or sleep

## For hunger-related recipes

They should clearly show:

* how much Hunger they restore
* whether they are weak, cooked, preserved, or long-term food support

Create shorthand systems and symbols for all of these.

---

# PHASE 4  MAKE DIGITAL UI MATCH THE SAME LOGIC

Update the digital-side board and interface to match the print-side design.

## Digital hydration

* show hydration protection slots or filled spaces
* consuming water should visibly place cubes/tokens/filled pips into the spaces
* dehydration loss should visibly consume those spaces

## Digital warmth

* replace or redesign the warmth bar into a left/right comfort track
* center comfort band should be visible
* player should see drift toward cold or hot clearly

## Digital recipe / effect display

* recipe effects should visually reference the same board systems
* hydration effects should show “fill hydration slots”
* warmth effects should show “move warmth marker”
* hunger effects should show “restore hunger”
* morale effects should show “raise/lower morale”

Output a prioritized digital UI change list.

---

# PHASE 5  DIFFERENTIATE THE SURVIVAL SYSTEMS VISUALLY

Make sure each survival axis feels unique:

* Hunger = depletion / nutrition track
* Hydration = protection slots / water buffer
* Warmth = positional comfort track
* Morale = stability / efficiency track

The player should never feel like all of these are just the same bar with different labels.

Create a visual identity and rules identity for each.

---

# PHASE 6  DEFINE WATER VALUE BETTER

Since hydration will now use board slots, revise the value of water types:

## Unsafe Water

Should be weaker and riskier.
Possible behavior:

* fills fewer hydration spaces
* may carry a penalty or risk
* may not last as long

## Purified / Boiled / Filtered Water

Should feel clearly better.
Possible behavior:

* fills more hydration spaces
* safe
* may be storable
* may provide extra morale or efficiency benefit

Define how this should work on both print and digital sides.

---

# PHASE 7  FINAL OUTPUT

Provide:

## 1. A player board redesign proposal

Including layout and component logic.

## 2. A print-side reference redesign

How cards and quick-reference sheets should show Hunger, Hydration, Warmth, Morale, and Rescue effects.

## 3. A digital UI redesign plan

How the prototype should visually represent the new systems.

## 4. A symbol system

For:

* hydration fill
* hydration loss
* warmth movement
* comfort band
* hunger restore
* morale gain/loss
* rescue progress

## 5. Implementation priorities

Break changes into:

* easiest/highest-impact
* medium refactors
* larger board/UI changes

---

# PRODUCTION ORDER

Use this as the build sequence for the next revision pass. Do not move to the next step until the current one is consistent in both print and digital language.

## Step 1: Canonical rules lock

### Task
Decide the final survival model and make it consistent everywhere.

### Done when

* Hunger, Hydration, Warmth, Morale, and Rescue all have one agreed meaning
* `playerboardupdate.md`, print references, and digital UI use the same terms
* no document still implies a different core survival model

### Why this comes first

If the survival model is still split across documents, every later clarity change will be partly wasted.

## Step 2: Redefine the meter identities

### Task
Make each survival axis visibly and mechanically different.

### Done when

* Hunger is a depletion track
* Hydration is a buffer or slot system
* Warmth is a left/right positional track
* Morale is a compact stability track
* Rescue is clearly shared progress

### Design rule

No two meters should feel like the same bar with different labels.

## Step 3: Build the shared icon language

### Task
Create one symbol set for meters, costs, hazards, zones, and actions.

### Done when

* every meter has one reusable icon
* every recipe cost uses the same material symbols
* every action has one icon
* every zone has one icon
* every hazard/protection pair is visually matched

### Design rule

If a player sees an icon on a card, they should be able to find the same icon on the board or reference sheet.

## Step 4: Redesign the player board

### Task
Rebuild the player board around the new meter identities.

### Done when

* Hydration has visible slots or cubes
* Warmth uses a center comfort band with cold/heat sides
* Hunger remains an easy-to-read loss track
* Morale is visually separate from Hunger
* Rescue is clearly linked to the shared progress system

### Design rule

The board should teach the rule without needing repeated explanation.

## Step 5: Rewrite print-side recipe shorthand

### Task
Update recipe cards, the crafting tree, and quick-reference sheets to use the same symbols as the board.

### Done when

* costs are icon-based, not sentence-based
* meter effects are shown with meter symbols
* zone-use recipes show zone + action + payoff in the same order every time
* persistence and one-time effects are visually distinct

### Design rule

Print materials should be readable from across the table.

## Step 6: Match the digital UI to the print language

### Task
Make the prototype use the same visual grammar as the print side.

### Done when

* the UI meter presentation matches the player board
* recipes show icon costs instead of text strings where possible
* zone-use and action unlocks are obvious at a glance
* logs and summaries use compact symbols instead of repeated prose

### Design rule

Digital should not invent a second language.

## Step 7: Rebalance scoring ceilings

### Task
Tighten the score spread before adding more content.

### Done when

* rescue no longer produces runaway score spikes
* utility lanes do not also become the best scoring lanes
* tier 3 cards feel strong but not mandatory
* multiple strategies finish in a similar score band

### Design rule

If one lane stabilizes the camp and also dominates scoring, it is too strong.

## Step 8: Sharpen scenario identity

### Task
Make each environment change player priorities in a readable way.

### Done when

* each scenario pushes at least one survival axis in a distinct way
* the player can tell the difference between environments quickly
* events feel like part of the map identity, not generic modifiers

### Design rule

Scenario differences should be felt in the first few rounds, not only learned after a full play.

## Step 9: Add only signature moments

### Task
Add a small number of memorable hooks that make the game feel ownable.

### Done when

* one or two systems create “this is The Wilds” moments
* those moments are not just bigger numbers
* the new features improve clarity or tension instead of adding clutter

### Design rule

Do not add breadth unless it sharpens identity.

---

# IMPORTANT CONSTRAINTS

* Do not redesign the entire game balance
* Do not flatten all systems into the same visual treatment
* Keep the game teachable
* Keep the game quick to parse during play
* Make the player board itself explain the systems better
* Ensure print and digital use the same core language

## Final Design Goal

A player should be able to look at the board and instantly understand:

* water protects me by filling spaces
* warmth moves on a comfort track
* hunger is restored by food
* morale affects stability
* rescue is shared progress

without needing repeated text explanation.
