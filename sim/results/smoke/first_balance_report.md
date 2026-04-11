# The Wilds First Balance Report

- Games per scenario: 3
- Player count: 4
- Master seed: 1

## Notes
- The working tree already includes some live rule tweaks, so overlapping scenarios are possible.
- The simulator uses the browser code for mechanics that are not fully specified in JSON.

## Scenario Summary
| Variant | Rescue Rate | Wipeout Rate | Avg Rounds | Avg Survivors |
|---|---:|---:|---:|---:|
| A_current_rules | 0.667 | 0.333 | 2.33 | 3.67 |
| B_no_round_end_hunger_decay | 0.000 | 1.000 | 4.00 | 3.00 |
| C_hunger_decay_after_2_searches | 0.000 | 1.000 | 2.67 | 3.00 |
| D_easier_snare | 0.000 | 1.000 | 2.67 | 3.00 |
| E_easier_fishing_pole | 0.000 | 1.000 | 2.33 | 3.00 |
| F_current_hunger_plus_easier_camp_stew | 0.000 | 1.000 | 3.00 | 3.00 |

## Key Comparisons
- B_no_round_end_hunger_decay: rescue -0.667, wipeout +0.667, rounds +1.67
- C_hunger_decay_after_2_searches: rescue -0.667, wipeout +0.667, rounds +0.33
- D_easier_snare: rescue -0.667, wipeout +0.667, rounds +0.33
- E_easier_fishing_pole: rescue -0.667, wipeout +0.667, rounds +0.00
- F_current_hunger_plus_easier_camp_stew: rescue -0.667, wipeout +0.667, rounds +0.67

## Recommended Changes
1. Adopt the best-performing scenario: A_current_rules.
2. Keep testing adjacent hunger and food-engine thresholds before changing other systems.
3. Keep testing adjacent hunger and food-engine thresholds before changing other systems.
4. Keep testing adjacent hunger and food-engine thresholds before changing other systems.
5. Keep testing adjacent hunger and food-engine thresholds before changing other systems.
