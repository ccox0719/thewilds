from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from .scenario_variants import first_balance_variants, scenario_variant_from_dict, scenario_variant_to_dict
    from .sim_engine import SimulationEngine
except ImportError:  # pragma: no cover
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from scenario_variants import first_balance_variants, scenario_variant_from_dict, scenario_variant_to_dict  # type: ignore
    from sim_engine import SimulationEngine  # type: ignore


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run The Wilds balance simulator")
    parser.add_argument("--games", type=int, default=2000, help="games per scenario")
    parser.add_argument("--players", type=int, default=4, choices=(3, 4), help="player count")
    parser.add_argument("--seed", type=int, default=1337, help="master seed")
    parser.add_argument("--output-dir", type=str, default=str(Path(__file__).resolve().parent / "results"))
    parser.add_argument("--first-pass", action="store_true", help="run the requested first-pass scenarios")
    parser.add_argument("--preset", type=str, help="path to a JSON preset exported from the Balance Lab")
    return parser.parse_args()


def summarize_variant(agg) -> dict:
    main_cause = max(agg.death_rate_by_cause.items(), key=lambda item: item[1])[0]
    return {
        "variant": agg.variant_name,
        "games": agg.games,
        "survival_rate": round(1.0 - agg.wipeout_rate, 4),
        "wipeout_rate": round(agg.wipeout_rate, 4),
        "main_cause_of_death": main_cause,
        "average_rounds": round(agg.average_rounds, 3),
    }


def write_survival_summary(output_dir: Path, meta: dict, aggregates: list) -> Path:
    rows = [summarize_variant(agg) for agg in aggregates]
    payload = {"meta": meta, "variants": rows}
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "survival_summary.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def main() -> None:
    args = parse_args()
    engine = SimulationEngine()
    engine.load()

    games = args.games
    player_count = args.players
    seed = args.seed
    variants = first_balance_variants()
    preset_meta = {}
    if args.first_pass and not args.preset and args.games == 2000:
        variants = [variant for variant in variants if variant.name == "B_current_rules"]
        games = 500
        print("[sim] first-pass default reduced to B_current_rules with 500 games; pass --games to override", flush=True)
    if args.preset:
        preset_path = Path(args.preset)
        if not preset_path.exists():
            raise FileNotFoundError(f"preset file not found: {preset_path}")
        preset = json.loads(preset_path.read_text(encoding="utf-8"))
        games = int(preset.get("games", games))
        player_count = int(preset.get("players", player_count))
        seed = int(preset.get("seed", seed))
        preset_meta = {k: v for k, v in preset.items() if k not in {"variant", "variants"}}
        if isinstance(preset.get("variants"), list) and preset["variants"]:
            variants = [scenario_variant_from_dict(item) for item in preset["variants"]]
        elif isinstance(preset.get("variant"), dict):
            variants = [scenario_variant_from_dict(preset["variant"])]
        else:
            raise ValueError("preset JSON must contain either a variant or variants array")
    aggregates = []
    for variant in variants:
        print(f"[sim] running {variant.name} ({games} games, {player_count} players)")
        agg = engine.run_batch(variant, games, seed, player_count=player_count)
        aggregates.append(agg)
        print(f"[sim] done {variant.name}: rescue={agg.rescue_rate:.3f}, wipeout={agg.wipeout_rate:.3f}")

    meta = {
        "games_per_scenario": games,
        "player_count": player_count,
        "master_seed": seed,
        "scenario_count": len(aggregates),
    }
    if preset_meta:
        meta["preset"] = preset_meta
        meta["variant_presets"] = [scenario_variant_to_dict(variant) for variant in variants]
    output_dir = Path(args.output_dir)
    summary_path = write_survival_summary(output_dir, meta, aggregates)
    print("")
    print("[sim] survival summary")
    for agg in aggregates:
        row = summarize_variant(agg)
        print(
            f"- {row['variant']}: survival={row['survival_rate']:.3f}, "
            f"main_death={row['main_cause_of_death']}, rounds={row['average_rounds']:.2f}"
        )
    print(f"[sim] wrote {summary_path}")


if __name__ == "__main__":
    main()
