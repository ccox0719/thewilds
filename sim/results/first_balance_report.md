# The Wilds First Balance Report

- Games per scenario: 500
- Player count: 4
- Master seed: 1337

## Executive Summary
The current rules are still far below the requested balance band. Rescue is 20.6%, wipeout is 79.4%, and the main death cause is hydration.
Food engines appear at round 1.09, water stabilization at round 2.35, and zone-use happens 55.08 times per game.

## Notes
- The working tree already includes some live rule tweaks, so overlapping scenarios are possible.
- The simulator uses the browser code for mechanics that are not fully specified in JSON.

## What To Read First
- `rescue rate` tells you how often a run ends in rescue.
- `wipeout rate` tells you how often the table dies before rescue.
- `first engine rounds` tells you when the first meaningful craft engines appear.

## Scenario Summary
| Rank | Variant | Rescue Rate | Wipeout Rate | Avg Rounds | Avg Survivors |
|---:|---|---:|---:|---:|---:|
| 1 | B_current_rules | 0.206 | 0.794 | 20.79 | 0.87 |

## Target Gap
| Metric | Target | Current | Gap |
|---|---:|---:|---:|
| Rescue rate | 0.45-0.55 | 0.206 | 0.244 below |
| Wipeout rate | 0.05-0.10 | 0.794 | 0.694 above |
| Avg survivors | 2.0-3.2 | 0.87 | 1.132 below |
| Avg rounds | 7.0-9.0 | 20.79 | 11.792 above |
| Food engine | ~3.0 | 1.09 | 1.91 from target |
| Water engine | ~2.0 | 2.35 | 0.35 from target |

## Key Comparisons

## Pressure Read
- Main death cause in current rules: hydration
- Early food engine comes online at round 1.09 on average.
- Water stabilization comes online at round 2.35 on average.
- Zone use actions happen 55.08 times per game on average.

## Likely Diagnosis
- Overtuned: hunger pressure. Hunger is the main death cause at 17.9%.
- Overtuned: morale pressure. Morale is the second major death cause at 11.1%.
- Undertuned: rescue conversion. Rescue only lands at 20.6%, far below the 45% to 55% band.
- Probably undertuned: rescue payoff. Zone-use is happening 55.08 times per game, but it is not converting into enough wins.

## Top 3 Changes
1. Reduce passive hunger pressure first: keep the game from collapsing before the engine loop matters.
2. Ease morale collapse next: survival should fail less from attrition and more from bad decisions.
3. Increase rescue conversion: strengthen signal payoff or lower rescue target so stabilized runs finish instead of stalling.

## Recommended Changes
1. Keep B_current_rules as the working baseline for the next pass.
2. Do not restore the reconstructed pre-tweak baseline; the current rules are the stronger reference point.
3. Keep the combined hunger and food-tool rules consolidated in the current baseline.
4. Run a larger seed sweep before touching water or morale pressure.
5. Prefer targeted hunger relief over broad passive decay shifts.
