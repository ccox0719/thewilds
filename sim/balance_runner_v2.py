from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

try:
    from .scenario_variants import first_balance_variants, scenario_variant_from_dict
    from .sim_engine import AggregateResults, SimulationEngine
except ImportError:  # pragma: no cover
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from scenario_variants import first_balance_variants, scenario_variant_from_dict  # type: ignore
    from sim_engine import AggregateResults, SimulationEngine  # type: ignore


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run The Wilds balance simulator (v2)")
    parser.add_argument("--games", type=int, default=2000, help="games per scenario")
    parser.add_argument("--players", type=int, default=4, choices=(3, 4), help="player count")
    parser.add_argument("--seed", type=int, default=1337, help="master seed")
    parser.add_argument("--output-dir", type=str, default=str(Path(__file__).resolve().parent / "results"))
    parser.add_argument("--first-pass", action="store_true", help="run the requested first-pass scenarios")
    parser.add_argument("--preset", type=str, help="path to a JSON preset exported from the Balance Lab")
    return parser.parse_args()


def main_death_cause(agg: AggregateResults) -> str:
    items = list((agg.death_rate_by_cause or {}).items())
    if not items:
        return "unknown"
    top_cause, top_rate = max(items, key=lambda item: item[1])
    if top_rate <= 0:
        return "none"
    return top_cause


def summarize_variant(agg: AggregateResults) -> Dict[str, Any]:
    return {
        "variant": agg.variant_name,
        "games": agg.games,
        "survival_rate": round(1.0 - agg.wipeout_rate, 4),
        "wipeout_rate": round(agg.wipeout_rate, 4),
        "rescue_rate": round(agg.rescue_rate, 4),
        "main_cause_of_death": main_death_cause(agg),
        "average_rounds": round(agg.average_rounds, 3),
    }


def write_v2_summary(output_dir: Path, payload: Dict[str, Any]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / "sim_v2_summary.json"
    target.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return target


def load_variants_from_preset(preset_path: Path) -> tuple[int, int, int, Dict[str, Any], List[Any]]:
    preset = json.loads(preset_path.read_text(encoding="utf-8"))
    games = int(preset.get("games", 2000))
    player_count = int(preset.get("players", 4))
    seed = int(preset.get("seed", 1337))
    preset_meta = {k: v for k, v in preset.items() if k not in {"variant", "variants"}}
    if isinstance(preset.get("variants"), list) and preset["variants"]:
        variants = [scenario_variant_from_dict(item) for item in preset["variants"]]
    elif isinstance(preset.get("variant"), dict):
        variants = [scenario_variant_from_dict(preset["variant"])]
    else:
        raise ValueError("preset JSON must contain either a variant or variants array")
    return games, player_count, seed, preset_meta, variants


def run() -> None:
    args = parse_args()
    engine = SimulationEngine()
    engine.load()

    games = args.games
    player_count = args.players
    seed = args.seed
    preset_meta: Dict[str, Any] = {}
    variants = first_balance_variants()

    if args.first_pass and not args.preset and args.games == 2000:
        variants = [variant for variant in variants if variant.name == "B_current_rules"]
        games = 500
        print("[sim-v2] first-pass default: B_current_rules, 500 games (use --games to override)", flush=True)

    if args.preset:
        preset_path = Path(args.preset)
        if not preset_path.exists():
            raise FileNotFoundError(f"preset file not found: {preset_path}")
        games, player_count, seed, preset_meta, variants = load_variants_from_preset(preset_path)

    aggregates: List[AggregateResults] = []
    for variant in variants:
        print(f"[sim-v2] running {variant.name} ({games} games, {player_count} players)", flush=True)
        aggregates.append(engine.run_batch(variant, games, seed, player_count=player_count))

    meta: Dict[str, Any] = {
        "version": "v2",
        "games_per_scenario": games,
        "player_count": player_count,
        "master_seed": seed,
        "scenario_count": len(aggregates),
    }
    if preset_meta:
        meta["preset"] = preset_meta

    rows = [summarize_variant(agg) for agg in aggregates]
    payload = {"meta": meta, "variants": rows}
    output_path = write_v2_summary(Path(args.output_dir), payload)

    print("")
    print("[sim-v2] summary")
    for row in rows:
        print(
            f"- {row['variant']}: survival={row['survival_rate']:.3f}, "
            f"main_death={row['main_cause_of_death']}, rounds={row['average_rounds']:.2f}",
            flush=True,
        )
    print(f"[sim-v2] wrote {output_path}", flush=True)


if __name__ == "__main__":
    run()
