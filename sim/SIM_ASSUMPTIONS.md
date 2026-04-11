# SIM Assumptions

This simulator mirrors the current browser logic in `index.html` where the code
defines the mechanic, and the JSON files where they define content.

## Confirmed runtime rules

- Search draws from a zone with weighted sampling and hazards can resolve immediately.
- Zone sampling is effectively with replacement for each search.
- End of turn moves durable cards from hand to stockpile and discards spoilable cards.
- Water is treated as stockpile-able rather than spoilable at end of turn.
- Consume actions are free in the browser.
- Search, craft, zone-use, rest, cook, sleep, and stoke fire all spend actions.
- Current browser turn count is fixed at 3 actions per turn.
- Morale does not affect action count in the current browser code.
- Search still costs 1 Hunger in the browser.
- The working tree currently has no automatic round-end hunger decay.
- The working tree currently has `Snare` at value threshold 3.

## Simulator choices for ambiguous mechanics

- Selected-card UI is not simulated; the engine chooses the best legal cards from inventory.
- Crafting can happen more than once if the recipe remains legal.
- Fire duration follows the browser logic for campfire, sustained fire, and signal fire.
- Spoilage has explicit scenario variants so we can test standard, strict, and lenient modes.
- A `morale_action_pool` switch exists even though the browser does not currently use it.

## Mismatches and notes

- The repository currently carries some earlier balance tweaks, so some requested
  comparison cases may overlap unless a scenario explicitly overrides them.
- The simulator now includes a reconstructed pre-tweak baseline so comparisons can
  be made against the older hunger-decay and craft-threshold values even when the
  working tree already reflects later balance changes.
- The policy mix now includes more extreme rescue-first and survival-first heuristics
  so the batch better exposes whether the game is failing under greedy play or under
  conservative play.
- Placeholder emoji strings in the JSON are cosmetic and do not affect gameplay.
- `getRecipeMinRarity()` returns `null` in the browser and appears unused.
- Any mechanic not explicitly defined in the browser code is documented here
  and modeled conservatively in the simulator.
