# The Wilds Master Priority List

This is the consolidated implementation queue from:

- `playerboardupdate.md`
- `scoring_update.md`
- `clarity_update_report.md`

Use this as the working task board.

## Checklist

| # | Step | Status | Dependency | Owner | Done When |
|---|---|---|---|---|---|
| 1 | Canonical rules lock | pending | none | design | All docs/UI use one survival model and one vocabulary. |
| 2 | Shared icon vocabulary | pending | 1 | design + UI | Same symbols mean the same thing in print and digital. |
| 3 | Player board redesign | pending | 1, 2 | design + UI | Each survival axis reads differently at a glance. |
| 4 | Print-side quick reference rewrite | pending | 1, 2, 3 | print | Cards/tree are icon-first and scannable. |
| 5 | Digital UI parity | pending | 1, 2, 3, 4 | UI | Digital mirrors print language instead of inventing new terms. |
| 6 | Action clarity pass | pending | 2, 4, 5 | design + UI | Every craft action is obvious from its icon and placement. |
| 7 | Zone identity and zone-use structure | pending | 2, 4, 5, 6 | design | Zone-use is first-class and not text-only. |
| 8 | Scoring philosophy lock | pending | 1 | design | Clear rules for what should and should not score heavily. |
| 9 | Scoring source audit | pending | 8 | design + balance | Every point source is mapped, named, and classified. |
| 10 | Score ceiling normalization | pending | 8, 9 | balance | No main lane has a runaway scoring ceiling. |
| 11 | Scenario identity sharpening | pending | 1, 2, 3, 4 | design | Each environment changes priorities in a visible way. |
| 12 | Special cards and outlier tuning | pending | 8, 9, 10 | balance | Exceptions support the game without distorting it. |
| 13 | Validation pass | pending | 3, 4, 5, 8, 10, 11, 12 | design + UI + balance | The game is readable, balanced, and consistent across formats. |

## Working Rules

- Do not start a later step until its dependency above is stable.
- Do not add content before the language is stable.
- Do not rebalance scoring before the scoring philosophy is locked.
- Do not tune exceptions before the base system is coherent.

## Notes

- `design` means rules, component language, and player-facing structure.
- `UI` means digital layout, display behavior, and screen language.
- `print` means cards, reference sheets, and physical board materials.
- `balance` means scoring, curves, and lane ceilings.
