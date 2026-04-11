# The Wilds Simulation Harness

This folder contains a standalone balance-testing simulator for The Wilds.

## Files

- `sim_engine.py`: core rules engine and JSON loader
- `policies.py`: heuristic player policies
- `scenario_variants.py`: scenario definitions and rule sweeps
- `balance_runner.py`: batch runner and CLI entry point
- `report_writer.py`: JSON, CSV, and Markdown output helpers
- `SIM_ASSUMPTIONS.md`: documented assumptions and mismatches
- `results/`: generated summaries, including the static HTML viewer

## Usage

Run the first balance pass from the repository root:

```bash
python sim/balance_runner.py --first-pass
```

Optional flags:

- `--games N` sets games per scenario
- `--players 3|4` sets the player count
- `--seed N` sets the master seed
- `--output-dir PATH` writes results elsewhere

## Output

The runner writes to `sim/results/` by default:

- `first_balance_report.html`
- `first_balance_report.md`
- `summary.json`
- `variants_summary.csv`
- `profile_summary.csv`
- `recipe_frequency.csv`
- `zone_frequency.csv`

The HTML file is a lightweight static viewer. Use `summary.json` for downstream
analysis and any custom slicing.

## Presets

- Use the Balance Lab in `index.html` to export a preset JSON file.
- Run it with `python sim/balance_runner.py --preset path/to/preset.json`.
- `sim/balance_preset.example.json` shows the expected structure.
