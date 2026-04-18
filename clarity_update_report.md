# The Wilds Clarity Update Report

This report follows `update.md` methodically and turns the current codebase into a concrete clarity plan.

## Phase 1: Audit

### Print Side

#### Crafting tree page
- Too text-heavy: `crafting_tree_v2.html` still presents most recipes as sentence fragments for cost, effect, and prerequisites.
- Easy to forget: what a craft unlocks after resolution, which meter it affects, and whether it is persistent or one-time.
- Should be visual: cost cubes/icons, craft-type badge, zone-use badge, protection badge, and meter badge.
- Inconsistent with digital: digital recipe cards already have type chips and material pills, but the print tree uses plain text cost lines and prose effects.
- Slows decisions: players must read full effect sentences to identify lane, payoff, and prerequisite chain.

#### Craft cards / recipe cards
- Too text-heavy: lines like `Cost: 1 Wood + 1 Fiber` and `Gain 5 Rescue. Gain SignalEngine. Future signal recipes gain 9 Rescue.`
- Easy to forget: whether the card is camp, field, zone-use, recovery, or engine.
- Should be visual: icon-based costs, corner badges for lane and persistence, and compact payoff symbols.
- Inconsistent with digital: digital cards use chips and material icons, but the print tree still relies on prose.
- Slows decisions: tier 2 and tier 3 cards are readable only after scanning several lines.

#### Player board
- Too text-heavy: the player board section is mostly labeled slots with no shared symbol language.
- Easy to forget: how bars map to craft effects and which board regions correspond to which meters.
- Should be visual: matched bar icons for Hunger, Warmth, Hydration, Morale, Vitality, and Rescue.
- Inconsistent with digital: digital has bars, but the print board does not mirror them closely enough.
- Slows decisions: players must translate between board labels and effect text every time a card references a meter.

#### Quick reference sheets
- Too text-heavy: rules pages are comprehensive, but most of the value is in paragraphs and multi-step bullets.
- Easy to forget: survival sequence, rescue threshold behavior, and the difference between persistent and one-time effects.
- Should be visual: icon keys, step strips, and condensed rule chunks.
- Inconsistent with digital: the digital prototype uses tooltips and panels, while print uses full prose.
- Slows decisions: the reference pages are good as a rulebook, not as a fast table aid.

#### Icon key / legend
- Missing or incomplete: the current print legend is color-based by tier, not a reusable system-wide icon key.
- Easy to forget: what each icon means across the print tree, player aid, and digital UI.
- Should be visual: a single legend for materials, meters, craft types, zones, hazards, and persistence.
- Inconsistent with digital: digital has emoji-style material pills but no shared legend.
- Slows decisions: players do not get a single glanceable decoding system.

#### Zone reference
- Missing as a first-class reference: zone-use is described in text, not visually keyed.
- Easy to forget: where a recipe is used and what action it enables.
- Should be visual: zone icons plus an action icon and payoff icon.
- Inconsistent with digital: the current digital model does not expose zone as structured UI either.
- Slows decisions: zone-use crafts are read like normal crafts.

#### Hazard reference
- Missing as a compact reference: hazards are expressed through survival prose.
- Easy to forget: which hazard is blocked by which protection.
- Should be visual: hazard icons paired with shield icons.
- Inconsistent with digital: hazard messaging exists in logs and status rows, but not as a shared icon system.
- Slows decisions: players have to mentally map danger to prevention every round.

#### Turn sequence reference
- Too text-heavy: round flow is explanatory rather than symbolic.
- Easy to forget: the exact order of draft, income, maintenance, craft, survival, and end-of-round checks.
- Should be visual: a fixed step strip with icons and short labels.
- Inconsistent with digital: the play screen has phase labels, but no matching visual sequence reference.
- Slows decisions: new players need repeated reminders during play.

#### Recipe category labeling
- Too text-heavy: family names are shown as text chips or section headings rather than a visual lane system.
- Easy to forget: how `signal-rescue`, `food-engine`, `processing`, `shelter-climate`, `survival`, and `recovery` differ.
- Should be visual: lane color plus lane icon.
- Inconsistent with digital: digital recipe cards already use chip labels, but those are textual.
- Slows decisions: players cannot identify a lane from shape alone.

#### Costs and requirements
- Too text-heavy: costs are written as strings in print and partly as text in digital requirement rows.
- Easy to forget: prerequisites that matter for unlock chains.
- Should be visual: cost icons, prereq icon, and build-chain arrows.
- Inconsistent with digital: digital has material pills, but the print version has only prose.
- Slows decisions: players scan words instead of recognizing symbols.

#### Rewards and effects
- Too text-heavy: many effects are sentences that mix meter gains, tags, and future bonuses.
- Easy to forget: whether a reward is immediate, persistent, or future-facing.
- Should be visual: effect icons, persistent loop badge, and one-time burst badge.
- Inconsistent with digital: digital cards summarize effects, but still text-first.
- Slows decisions: future bonus effects are especially hard to parse quickly.

#### Action unlocks
- Too text-heavy: action names are embedded inside prose.
- Easy to forget: what a craft enables after it is built.
- Should be visual: action icon badges aligned with the craft card footer.
- Inconsistent with digital: there is no shared action icon layer yet.
- Slows decisions: players need to read the full card to know what new move is available.

### Digital Side

#### Player board UI
- Too text-heavy: player cards still use textual section labels and many name-based chips.
- Easy to forget: how built cards, tags, and blueprints relate to the current board state.
- Should be visual: meter badges, action icons, and compact board-state tiles.
- Inconsistent with print: print player boards are simple slot layouts without a shared meter symbol system.
- Slows decisions: the user has to parse a lot of labels before understanding board state.

#### Meter bars
- Too text-heavy: bars show labels and numbers, but the symbols are not yet a shared visual language.
- Easy to forget: which craft effects correspond to which meter.
- Should be visual: matching meter badges on cards and the board.
- Inconsistent with print: the board frame does not yet mirror the same bar language.
- Slows decisions: users have to translate `Vitality`, `Rescue`, and survival status across screens.

#### Recipe panel
- Too text-heavy: recipe effects remain sentence-based.
- Easy to forget: unlocks, persistence, and action gates.
- Should be visual: lane badge, cost row, result row, and a compact footer for actions or protection.
- Inconsistent with print: print recipes are even more text-heavy.
- Slows decisions: the craft decision is information-dense and slow to compare.

#### Card display
- Too text-heavy: special cards and built tiles are mostly textual tooltips/chips.
- Easy to forget: whether an effect is ongoing, conditional, or one-time.
- Should be visual: persistent loop symbols, special-card family badges, and icon-only payload summaries.
- Inconsistent with print: print special cards already fit in a card grid, but still use prose.
- Slows decisions: the system hides the strongest differentiator inside text.

#### Tableau display
- Too text-heavy: built recipes are shown as text tiles rather than stateful icons.
- Easy to forget: what each built item contributes to the engine.
- Should be visual: built-item icons with small effect markers.
- Inconsistent with print: no dedicated tableau language exists in either surface.
- Slows decisions: engine state is hard to read at a glance.

#### Stockpile display
- Too text-heavy: material pills help, but there is no broader stockpile legend.
- Easy to forget: which materials are common, refined, or utility-only.
- Should be visual: standardized material icons plus category tint.
- Inconsistent with print: print costs use raw text while digital uses pills.
- Slows decisions: players must infer material role from the card list.

#### Zone buttons
- Too text-heavy: zone-use is not a dedicated UI concept yet.
- Easy to forget: which zone an action belongs to and what it consumes or yields.
- Should be visual: zone icon paired with the action icon.
- Inconsistent with print: print currently lacks a zone icon system too.
- Slows decisions: players cannot instantly distinguish zone-use crafts.

#### Action buttons
- Too text-heavy: buttons are labeled in plain language only.
- Easy to forget: whether an action is a craft, a move, a zone-use, or a recovery.
- Should be visual: button icon + action badge + short label.
- Inconsistent with print: print has no equivalent action badge system yet.
- Slows decisions: the same action family is not consistently encoded.

#### Tool-use buttons
- Too text-heavy: tool use is implied through card text and logs.
- Easy to forget: which built tool unlocks which action.
- Should be visual: tool icon linked to the enabled action icon.
- Inconsistent with print: print cards do not expose this linkage clearly.
- Slows decisions: users cannot see the action-to-tool relationship quickly.

#### Rule reminder text
- Too text-heavy: rule text repeats around the play screen and help views.
- Easy to forget: survival order, rescue threshold behavior, and lane distinctions.
- Should be visual: compressed reminder tiles and icon-led snippets.
- Inconsistent with print: print has full rule paragraphs, but no compact helper strip.
- Slows decisions: repeated prose adds load without adding clarity.

#### Tooltip opportunities
- Good candidate for expansion: many labels could become hover/tap explanations instead of inline text.
- Easy to forget: tag meanings, card families, and action unlocks.
- Should be visual first, tooltip second.
- Inconsistent with print: print needs a fixed legend, not tooltips.
- Slows decisions: missing tooltips force verbose labels everywhere.

#### End-of-round summary
- Too text-heavy: current logs are chronological, not decision-oriented.
- Easy to forget: what actually changed during the round.
- Should be visual: summary chips for meters moved, hazards resolved, and actions taken.
- Inconsistent with print: print only has rule text, not end-of-round recap.
- Slows decisions: players cannot see the round outcome pattern at a glance.

#### Hazard resolution messaging
- Too text-heavy: hazards are narrated in the log and status rows.
- Easy to forget: which hazard caused which consequence.
- Should be visual: hazard icon, shield icon, and damage arrow.
- Inconsistent with print: print uses survival paragraphs rather than hazard badges.
- Slows decisions: hazard resolution is difficult to skim.

#### Print/export page
- Too text-heavy: the export page is functional but not visually aligned with the play UI.
- Easy to forget: which export corresponds to which play aid.
- Should be visual: template cards with icons and a short purpose line.
- Inconsistent with print: this page currently acts like a file picker, not a print dashboard.
- Slows decisions: users have to read each export description.

## Phase 2: Unified Visual Language

### Materials
- Wood: log icon, warm brown tint.
- Fiber: leaf or thread icon, green tint.
- Plant: sprout icon, muted green tint.
- Stone: rock icon, slate tint.
- Food: meat or bowl icon, amber-red tint.
- Water: droplet icon, blue tint.
- Fuel / Fire / Hearth: flame icon, orange tint.
- Shelter: roof or tent icon, neutral tan tint.
- Tool: wrench or knife icon, steel tint.
- Signal / Rescue: flag or beacon icon, gold tint.

### Meters
- Warmth, Hunger, Hydration, Morale, Rescue, Vitality should each have a bar badge that visually matches the player-board meter.
- Bars should share shape language across print and digital, with only color and icon changing.

### Craft Types
- Camp craft: solid frame with camp icon.
- Field tool: compact tool badge.
- Zone-use craft: zone icon plus a second icon for the action it enables.
- Recovery craft: medical or restore badge.

### Zones
- Each zone needs a distinct icon and a short label.
- Zone-use crafts should show `where`, `what action`, and `what payoff` in a fixed row order.

### Hazards
- Each danger type should have a shieldable hazard icon.
- Protection effects should show a shield layered against the exact hazard icon.

### Persistence
- Persistent effect: loop or infinity icon.
- One-time effect: burst or spark icon.
- Future bonus: small forward arrow badge.

## Phase 3: Print-Side Quick Reference

### Recommended layout structure
1. Top strip: title, quick legend, turn sequence strip, and meter key.
2. Center: crafting tree grouped by lane and tier, with each card using icon costs and icon effects.
3. Right or bottom rail: hazard key, zone key, action key, and protection key.
4. Footer: compressed glossary and page index.

### Per-card shorthand
- Name.
- Craft type badge.
- Cost icons.
- Prereq icon or chain arrow.
- Immediate payoff icons.
- Meter icons.
- Protection icons.
- Zone icon if relevant.

## Phase 4: Digital-Side Quick Reference

### Priority changes
1. Add a shared icon registry for materials, meters, hazards, zones, and actions.
2. Replace recipe prose with icon cost rows and compact payoff rows.
3. Update `StatBar` and player cards so meter badges match the print key.
4. Add action badges to craft buttons and tool-use actions.
5. Convert logs and end-of-round summary into icon-led summaries.
6. Add tooltip expansion for tags, lane names, and action unlocks.
7. Separate materials, tools, persistent camp infrastructure, recovery items, and zone-use enablers in the UI.

## Phase 5: Player-Board and Meter Reference

### Meter designs
- Hunger: empty bowl or stomach-like bar badge.
- Warmth: sun/snowflake toggle badge.
- Hydration: droplet badge.
- Morale: face/star badge.
- Rescue: flag badge.
- Vitality: heart badge.

### Reuse rules
- The same badge should appear on the player board, recipe effects, print aids, and tooltips.
- Craft effects should never refer to a meter with plain text only when a meter badge exists.

## Phase 6: Action Clarity

### Action icon system
- Search: magnifier.
- Rest: bed or moon.
- Cook: pot.
- Boil: steam pot.
- Filter: funnel or strainer.
- Fish: hook.
- Hunt: spear.
- Trap: snare.
- Signal: flag or beacon.
- Stoke Fire: flame with up-arrow.
- Preserve Food: jar or preserved bowl.
- Treat Water: drop with shield.

### Action layout
- Put the action icon near the craft title, not buried in effect text.
- If a craft grants multiple actions, show the primary action first and secondary actions as small badges.

## Phase 7: Rules Compression

### Replace with icons
- `Gain Rescue` -> Rescue badge.
- `Gain Vitality` -> Heart badge.
- `Future ... recipes gain ...` -> forward bonus badge.
- `Persistent recipe` -> loop badge.
- `One-time recipe` -> burst badge.
- `Requires HearthActive` -> hearth badge.
- `Requires Shelter` -> shelter badge.
- `Use in ...` -> zone icon + action icon.

### Keep as text
- Final scoring formula.
- Edge-case timing notes.
- Rare rules exceptions.

## Phase 8: Priority Implementation Order

### Immediate wins
1. Standardize the shared icon key for materials and meters.
2. Replace text-heavy recipe cost lines with icon rows in both print and digital.
3. Add craft type badges that are visually consistent across surfaces.
4. Clean up the print legend so it explains the actual shorthand used on the cards.

### Medium improvements
1. Add zone/action badges to zone-use and tool-granting crafts.
2. Convert special cards and built-tile summaries to icon-first layouts.
3. Rework player cards to show meter badges and compact state chips.
4. Add tooltip-backed expansion for tags and lane names.

### Larger refactors
1. Add structured fields for zone, action unlock, protection, and persistence in recipe data.
2. Build a single icon registry shared by print and digital renderers.
3. Redesign the print crafting tree into a true quick-reference board.
4. Refactor logs and end-of-round summaries into icon-led status summaries.

## Current-State Notes

- `src/data/config.ts` already drives rescue thresholds centrally, so threshold changes are easy to keep consistent.
- `src/components/RecipeCard.tsx` is the clearest place to reduce text because it already has typed cost and effect data.
- `src/components/PlayerCard.tsx` and `src/components/StatBar.tsx` are the best shared starting point for meter symbol consistency.
- `src/print/RulesPrintView.tsx`, `src/print/ReferenceSheetsPrintView.tsx`, and `crafting_tree_v2.html` are the main print-side clarity bottlenecks.
- `src/views/PlayView.tsx` and `src/views/SimView.tsx` still lean on prose and plain labels for the most important decision surfaces.

---

# PRODUCTION ORDER

Use this as the build sequence for the clarity pass. Keep the visual language consistent across print and digital from the first step onward.

## Step 1: Lock the shared icon vocabulary

### Task
Define one icon set for materials, meters, actions, zones, hazards, and persistence.

### Done when

* the same symbol means the same thing in print and digital
* no important symbol exists only on one surface
* every recurring game concept has a reusable icon

### Why this comes first

If the icon vocabulary is not stable, every later UI or print change will conflict with it.

## Step 2: Standardize meter language

### Task
Make each meter look and behave differently enough that players can identify it instantly.

### Done when

* Hunger looks unlike Hydration
* Warmth looks unlike a stockpile
* Morale does not visually blur into Hunger
* Rescue is clearly distinct from personal meters

### Design rule

Meters should teach themselves by shape, not just color.

## Step 3: Rebuild the player board reference

### Task
Update the player board so it explains the survival system at a glance.

### Done when

* hydration uses visible slots or buffers
* warmth uses a comfort-band track
* hunger remains a clean depletion track
* rescue is clearly shared and not confused with personal survival

### Design rule

The player board should answer the question “what is happening to me right now?” without a rules lookup.

## Step 4: Rewrite print-side card shorthand

### Task
Convert print crafting and reference materials from prose-first to icon-first.

### Done when

* costs use icons instead of sentences
* meter effects use meter badges
* zone-use shows zone + action + payoff in a fixed order
* persistence and one-time effects are visually distinct

### Design rule

Print materials should be scannable from across the table.

## Step 5: Align digital UI with the same grammar

### Task
Make the digital prototype speak the same visual language as the print side.

### Done when

* player cards use the same meter symbols
* recipe cards use the same cost and effect shorthand
* tooltips expand meaning instead of replacing it
* logs and summaries are reduced to compact status chips where possible

### Design rule

Digital should clarify the print language, not invent a parallel one.

## Step 6: Separate actions from effects

### Task
Make each action easy to identify and each payoff easy to parse.

### Done when

* Search, Rest, Cook, Boil, Filter, Fish, Hunt, Trap, Signal, Stoke Fire, Preserve Food, and Treat Water each have a clear icon
* the action icon sits near the craft title or button label
* multi-action items show the primary action first

### Design rule

If an item grants an action, the action should be visible before the paragraph text.

## Step 7: Compress rules text

### Task
Replace repeated phrases with shorthand symbols or very short labels.

### Done when

* common phrases are iconized
* edge-case timing stays in text
* the print page stops repeating the same explanation in multiple places

### Design rule

Text should handle exceptions, not the common case.

## Step 8: Refactor the biggest UI bottlenecks

### Task
Update the surfaces that currently force the most reading.

### Done when

* `RecipeCard.tsx` is easier to skim
* `PlayerCard.tsx` is easier to read at a glance
* `StatBar.tsx` matches the meter identity work
* print rules and reference sheets no longer act like full rulebook pages

### Design rule

Fix the surfaces that players see most often before polishing edge screens.

## Step 9: Add tooltips and detail layers last

### Task
Use hover or tap details to support, not replace, the core visual language.

### Done when

* tooltips explain meaning without being required for basic play
* long-form text moves off the main play surface
* icon-first layouts remain understandable without hovering

### Design rule

Tooltips are support, not the primary interface.
