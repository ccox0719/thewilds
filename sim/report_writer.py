from __future__ import annotations

import csv
import html
import json
import time
from pathlib import Path
from typing import Dict, List

try:
    from .sim_engine import AggregateResults
except ImportError:  # pragma: no cover
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from sim_engine import AggregateResults  # type: ignore


def write_outputs(output_dir: Path, aggregates: List[AggregateResults], summary_json: dict, report_md: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()
    (output_dir / "summary.json").write_text(json.dumps(summary_json, indent=2), encoding="utf-8")
    print(f"[sim] wrote summary.json in {time.perf_counter() - started:.1f}s", flush=True)
    (output_dir / "first_balance_report.md").write_text(report_md, encoding="utf-8")
    print(f"[sim] wrote first_balance_report.md in {time.perf_counter() - started:.1f}s", flush=True)
    (output_dir / "first_balance_report.html").write_text(build_html_report(aggregates, summary_json.get("meta", {}), summary_json), encoding="utf-8")
    print(f"[sim] wrote first_balance_report.html in {time.perf_counter() - started:.1f}s", flush=True)
    write_variant_csv(output_dir / "variants_summary.csv", aggregates)
    write_profile_csv(output_dir / "profile_summary.csv", aggregates)
    write_recipe_csv(output_dir / "recipe_frequency.csv", aggregates)
    write_zone_csv(output_dir / "zone_frequency.csv", aggregates)


def write_csv(path: Path, rows: List[dict], fieldnames: List[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_variant_csv(path: Path, aggregates: List[AggregateResults]) -> None:
    rows = [
        {
            "variant": agg.variant_name,
            "games": agg.games,
            "rescue_rate": round(agg.rescue_rate, 4),
            "wipeout_rate": round(agg.wipeout_rate, 4),
            "average_rounds": round(agg.average_rounds, 3),
            "average_survivors": round(agg.average_survivors, 3),
            "raw_food_consumption": agg.raw_food_consumption,
            "unsafe_water_consumption": agg.unsafe_water_consumption,
            "hazard_triggers": agg.hazard_trigger_frequency,
            "hazard_prevented": agg.hazard_prevented_frequency,
        }
        for agg in aggregates
    ]
    write_csv(path, rows, list(rows[0].keys()) if rows else [])


def write_profile_csv(path: Path, aggregates: List[AggregateResults]) -> None:
    rows = []
    for agg in aggregates:
        for profile, score in agg.average_final_scores.items():
            rows.append({
                "variant": agg.variant_name,
                "profile": profile,
                "average_final_score": round(score, 3),
                "win_rate": round(agg.win_rate_by_profile.get(profile, 0.0), 4),
            })
    write_csv(path, rows, list(rows[0].keys()) if rows else [])


def write_recipe_csv(path: Path, aggregates: List[AggregateResults]) -> None:
    rows = []
    for agg in aggregates:
        for recipe, count in sorted(agg.recipe_craft_frequency.items()):
            rows.append({"variant": agg.variant_name, "recipe": recipe, "count": count})
    write_csv(path, rows, list(rows[0].keys()) if rows else [])


def write_zone_csv(path: Path, aggregates: List[AggregateResults]) -> None:
    rows = []
    for agg in aggregates:
        for zone, count in sorted(agg.zone_visit_frequency.items()):
            rows.append({"variant": agg.variant_name, "zone": zone, "count": count})
    write_csv(path, rows, list(rows[0].keys()) if rows else [])


def build_summary_json(aggregates: List[AggregateResults], meta: dict) -> dict:
    return {"meta": meta, "variants": [aggregate_to_dict(agg) for agg in aggregates]}


def aggregate_to_dict(agg: AggregateResults) -> dict:
    return {
        "variant_name": agg.variant_name,
        "games": agg.games,
        "rescue_rate": agg.rescue_rate,
        "wipeout_rate": agg.wipeout_rate,
        "average_rounds": agg.average_rounds,
        "average_survivors": agg.average_survivors,
        "average_final_scores": agg.average_final_scores,
        "win_rate_by_profile": agg.win_rate_by_profile,
        "death_rate_by_cause": agg.death_rate_by_cause,
        "zone_visit_frequency": agg.zone_visit_frequency,
        "recipe_craft_frequency": agg.recipe_craft_frequency,
        "first_engine_rounds": agg.first_engine_rounds,
        "raw_food_consumption": agg.raw_food_consumption,
        "unsafe_water_consumption": agg.unsafe_water_consumption,
        "hazard_trigger_frequency": agg.hazard_trigger_frequency,
        "hazard_prevented_frequency": agg.hazard_prevented_frequency,
        "use_frequency_by_item": agg.use_frequency_by_item,
        "action_spend": agg.action_spend,
    }


def build_markdown_report(aggregates: List[AggregateResults], meta: dict, notes: List[str]) -> str:
    lines = []
    lines.append("# The Wilds First Balance Report")
    lines.append("")
    lines.append(f"- Games per scenario: {meta['games_per_scenario']}")
    lines.append(f"- Player count: {meta['player_count']}")
    lines.append(f"- Master seed: {meta['master_seed']}")
    lines.append("")
    current = next((agg for agg in aggregates if agg.variant_name == "B_current_rules"), aggregates[0])
    primary_cause = max(current.death_rate_by_cause.items(), key=lambda item: item[1])[0]
    zone_use_rate = current.action_spend.get("use", 0) + current.action_spend.get("signal", 0)
    lines.append("## Executive Summary")
    lines.append(
        f"The current rules are still far below the requested balance band. Rescue is {current.rescue_rate:.1%}, wipeout is {current.wipeout_rate:.1%}, and the main death cause is {primary_cause}."
    )
    lines.append(
        f"Food engines appear at round {current.first_engine_rounds.get('food_tool', 0):.2f}, water stabilization at round {current.first_engine_rounds.get('water_treatment', 0):.2f}, and zone-use happens {zone_use_rate:.2f} times per game."
    )
    lines.append("")
    if notes:
        lines.append("## Notes")
        for note in notes:
            lines.append(f"- {note}")
        lines.append("")
    lines.append("## What To Read First")
    lines.append("- `rescue rate` tells you how often a run ends in rescue.")
    lines.append("- `wipeout rate` tells you how often the table dies before rescue.")
    lines.append("- `first engine rounds` tells you when the first meaningful craft engines appear.")
    lines.append("")
    lines.append("## Scenario Summary")
    lines.append("| Rank | Variant | Rescue Rate | Wipeout Rate | Avg Rounds | Avg Survivors |")
    lines.append("|---:|---|---:|---:|---:|---:|")
    ranked = sorted(aggregates, key=lambda a: (a.rescue_rate, -a.wipeout_rate, a.average_rounds), reverse=True)
    for idx, agg in enumerate(ranked, 1):
        lines.append(
            f"| {idx} | {agg.variant_name} | {agg.rescue_rate:.3f} | {agg.wipeout_rate:.3f} | {agg.average_rounds:.2f} | {agg.average_survivors:.2f} |"
        )
    lines.append("")
    lines.append("## Target Gap")
    lines.append("| Metric | Target | Current | Gap |")
    lines.append("|---|---:|---:|---:|")
    gaps = [
        ("Rescue rate", "0.45-0.55", f"{current.rescue_rate:.3f}", goal_gap(current.rescue_rate, 0.45, 0.55)),
        ("Wipeout rate", "0.05-0.10", f"{current.wipeout_rate:.3f}", goal_gap(current.wipeout_rate, 0.05, 0.10)),
        ("Avg survivors", "2.0-3.2", f"{current.average_survivors:.2f}", goal_gap(current.average_survivors, 2.0, 3.2)),
        ("Avg rounds", "7.0-9.0", f"{current.average_rounds:.2f}", goal_gap(current.average_rounds, 7.0, 9.0)),
        ("Food engine", "~3.0", f"{current.first_engine_rounds.get('food_tool', 0):.2f}", goal_gap_point(current.first_engine_rounds.get('food_tool', 0), 3.0)),
        ("Water engine", "~2.0", f"{current.first_engine_rounds.get('water_treatment', 0):.2f}", goal_gap_point(current.first_engine_rounds.get('water_treatment', 0), 2.0)),
    ]
    for metric, target, current_value, gap in gaps:
        lines.append(f"| {metric} | {target} | {current_value} | {gap} |")
    lines.append("")
    lines.append("## Key Comparisons")
    base = aggregates[0]
    for agg in aggregates[1:]:
        lines.append(
            f"- {agg.variant_name}: rescue {agg.rescue_rate - base.rescue_rate:+.3f}, wipeout {agg.wipeout_rate - base.wipeout_rate:+.3f}, rounds {agg.average_rounds - base.average_rounds:+.2f}"
        )
    lines.append("")
    lines.append("## Pressure Read")
    primary_cause = max(current.death_rate_by_cause.items(), key=lambda item: item[1])[0]
    lines.append(f"- Main death cause in current rules: {primary_cause}")
    lines.append(f"- Early food engine comes online at round {current.first_engine_rounds.get('food_tool', 0):.2f} on average.")
    lines.append(f"- Water stabilization comes online at round {current.first_engine_rounds.get('water_treatment', 0):.2f} on average.")
    zone_use_rate = current.action_spend.get("use", 0) + current.action_spend.get("signal", 0)
    lines.append(f"- Zone use actions happen {zone_use_rate:.2f} times per game on average.")
    lines.append("")
    lines.append("## Likely Diagnosis")
    lines.append(f"- Overtuned: hunger pressure. Hunger is the main death cause at {current.death_rate_by_cause.get('hunger', 0.0):.1%}.")
    lines.append(f"- Overtuned: morale pressure. Morale is the second major death cause at {current.death_rate_by_cause.get('morale', 0.0):.1%}.")
    lines.append(f"- Undertuned: rescue conversion. Rescue only lands at {current.rescue_rate:.1%}, far below the {45}% to {55}% band.")
    lines.append(f"- Probably undertuned: rescue payoff. Zone-use is happening {zone_use_rate:.2f} times per game, but it is not converting into enough wins.")
    lines.append("")
    lines.append("## Top 3 Changes")
    lines.append("1. Reduce passive hunger pressure first: keep the game from collapsing before the engine loop matters.")
    lines.append("2. Ease morale collapse next: survival should fail less from attrition and more from bad decisions.")
    lines.append("3. Increase rescue conversion: strengthen signal payoff or lower rescue target so stabilized runs finish instead of stalling.")
    lines.append("")
    lines.append("## Recommended Changes")
    for idx, rec in enumerate(recommendations_from_results(aggregates), 1):
        lines.append(f"{idx}. {rec}")
    lines.append("")
    return "\n".join(lines)


def goal_gap(value: float, low: float, high: float) -> str:
    if low <= value <= high:
        return "within"
    if value < low:
        return f"{low - value:.3f} below"
    return f"{value - high:.3f} above"


def goal_gap_point(value: float, target: float) -> str:
    if value == 0:
        return "n/a"
    if abs(value - target) < 0.25:
        return "close"
    return f"{abs(value - target):.2f} from target"


def build_html_report(aggregates: List[AggregateResults], meta: dict, summary_json: dict) -> str:
    def esc(value) -> str:
        return html.escape(str(value))

    def gap_class(text: str) -> str:
        if text == "within" or text == "close":
            return "ok"
        if text == "n/a":
            return "neutral"
        return "bad" if "above" in text or "below" in text else "warn"

    notes = [
        "Generated from the simulator batch output.",
        "Use this file for quick inspection; JSON remains the detailed source of truth.",
    ]
    ranked = sorted(aggregates, key=lambda a: (a.rescue_rate, -a.wipeout_rate, a.average_rounds), reverse=True)
    current = next((agg for agg in aggregates if agg.variant_name == "B_current_rules"), ranked[0])
    base = aggregates[0]
    primary_cause = max(current.death_rate_by_cause.items(), key=lambda item: item[1])[0]
    engine_actions = current.action_spend.get("use", 0) + current.action_spend.get("signal", 0)
    board = [
        ("Rescue rate", f"{current.rescue_rate:.1%}", "Target 45% to 55%"),
        ("Wipeout rate", f"{current.wipeout_rate:.1%}", "Target 5% to 10%"),
        ("Avg rounds", f"{current.average_rounds:.2f}", "Target 7 to 9"),
        ("Engine timing", f"{current.first_engine_rounds.get('food_tool', 0):.2f}", "Food engine target ~3"),
    ]
    verdict = (
        f"Current rules are not yet in the target band. Rescue is {current.rescue_rate:.1%}, "
        f"wipeout is {current.wipeout_rate:.1%}, and {primary_cause} remains the main failure mode."
    )

    rows = []
    for idx, agg in enumerate(ranked, 1):
        profiles = ", ".join(sorted(profile for profile, win_rate in agg.win_rate_by_profile.items() if win_rate > 0))
        rows.append(
            "<tr>"
            f"<td>{idx}</td>"
            f"<td>{esc(agg.variant_name)}</td>"
            f"<td>{agg.rescue_rate:.3f}</td>"
            f"<td>{agg.wipeout_rate:.3f}</td>"
            f"<td>{agg.average_rounds:.2f}</td>"
            f"<td>{agg.average_survivors:.2f}</td>"
            f"<td>{esc(profiles)}</td>"
            "</tr>"
        )

    comparison_rows = []
    for agg in aggregates[1:]:
        comparison_rows.append(
            "<tr>"
            f"<td>{esc(agg.variant_name)}</td>"
            f"<td>{agg.rescue_rate - base.rescue_rate:+.3f}</td>"
            f"<td>{agg.wipeout_rate - base.wipeout_rate:+.3f}</td>"
            f"<td>{agg.average_rounds - base.average_rounds:+.2f}</td>"
            "</tr>"
        )

    recs = "".join(f"<li>{esc(rec)}</li>" for rec in recommendations_from_results(aggregates))
    goal_rows = [
        ("Rescue rate", "45% to 55%", f"{current.rescue_rate:.3f}", goal_gap(current.rescue_rate, 0.45, 0.55)),
        ("Wipeout rate", "5% to 10%", f"{current.wipeout_rate:.3f}", goal_gap(current.wipeout_rate, 0.05, 0.10)),
        ("Avg survivors", "2.0 to 3.2", f"{current.average_survivors:.2f}", goal_gap(current.average_survivors, 2.0, 3.2)),
        ("Avg rounds", "7.0 to 9.0", f"{current.average_rounds:.2f}", goal_gap(current.average_rounds, 7.0, 9.0)),
        ("Food engine round", "~3.0", f"{current.first_engine_rounds.get('food_tool', 0):.2f}", goal_gap_point(current.first_engine_rounds.get('food_tool', 0), 3.0)),
        ("Water engine round", "~2.0", f"{current.first_engine_rounds.get('water_treatment', 0):.2f}", goal_gap_point(current.first_engine_rounds.get('water_treatment', 0), 2.0)),
    ]
    details = []
    for agg in aggregates:
        slim = {
            "variant_name": agg.variant_name,
            "games": agg.games,
            "rescue_rate": agg.rescue_rate,
            "wipeout_rate": agg.wipeout_rate,
            "average_rounds": agg.average_rounds,
            "average_survivors": agg.average_survivors,
            "first_engine_rounds": agg.first_engine_rounds,
            "raw_food_consumption": agg.raw_food_consumption,
            "unsafe_water_consumption": agg.unsafe_water_consumption,
            "hazard_trigger_frequency": agg.hazard_trigger_frequency,
            "hazard_prevented_frequency": agg.hazard_prevented_frequency,
        }
        details.append(
            f"""
            <details class="variant-detail">
              <summary>{esc(agg.variant_name)} <span class="variant-meta">rescue {agg.rescue_rate:.3f} | wipeout {agg.wipeout_rate:.3f}</span></summary>
              <pre>{esc(json.dumps(slim, indent=2))}</pre>
            </details>
            """
        )
    max_rescue = max((agg.rescue_rate for agg in aggregates), default=1.0) or 1.0
    max_wipeout = max((agg.wipeout_rate for agg in aggregates), default=1.0) or 1.0
    chart_rows = []
    for agg in ranked:
        chart_rows.append(
            f"""
            <div class="chart-row">
              <div class="chart-label">{esc(agg.variant_name)}</div>
              <div class="bar-track" title="Rescue {agg.rescue_rate:.1%} / Wipeout {agg.wipeout_rate:.1%}">
                <div class="bar rescue" style="width: {agg.rescue_rate / max_rescue * 100:.1f}%"></div>
                <div class="bar wipeout" style="width: {agg.wipeout_rate / max_wipeout * 100:.1f}%"></div>
              </div>
              <div class="chart-values">{agg.rescue_rate:.1%} rescue | {agg.wipeout_rate:.1%} wipeout</div>
            </div>
            """
        )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The Wilds Balance Report</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f4f7fb;
      --panel: #ffffff;
      --text: #17202a;
      --muted: #5d6a79;
      --accent: #2158d6;
      --accent-soft: #ecf2ff;
      --border: #dbe2ec;
      --shadow: rgba(24, 38, 57, 0.08);
    }}
    body {{
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(33, 88, 214, 0.10), transparent 34%),
        linear-gradient(180deg, #fbfcfe 0%, var(--bg) 100%);
      color: var(--text);
    }}
    main {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 20px 56px;
    }}
    h1, h2 {{
      font-family: inherit;
      letter-spacing: -0.02em;
    }}
    .hero {{
      background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 26px;
      box-shadow: 0 14px 34px var(--shadow);
      margin-bottom: 22px;
    }}
    .hero h1 {{
      margin: 0;
      font-size: 2rem;
      letter-spacing: -0.03em;
    }}
    .hero p {{
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.55;
    }}
    .meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 16px 0 0;
      color: var(--muted);
    }}
    .meta span {{
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--accent-soft);
      border: 1px solid var(--border);
    }}
    .verdict {{
      margin: 18px 0 0;
      padding: 16px 18px;
      border-radius: 16px;
      background: linear-gradient(135deg, #f7faff 0%, #edf3ff 100%);
      border: 1px solid #d5def1;
      color: #20304a;
      font-weight: 600;
      line-height: 1.5;
    }}
    .board {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
      margin: 0 0 20px;
    }}
    .board-card {{
      background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 10px 24px var(--shadow);
    }}
    .board-card .label {{
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }}
    .board-card .value {{
      margin-top: 8px;
      font-size: 1.7rem;
      font-weight: 750;
      letter-spacing: -0.02em;
      color: var(--accent-strong);
    }}
    .board-card .note {{
      margin-top: 4px;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.4;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 22px;
    }}
    .card {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 12px 28px var(--shadow);
    }}
    .card h2 {{
      margin: 6px 0 0;
      font-size: 1.9rem;
    }}
    .card .small {{
      color: var(--muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 28px var(--shadow);
      margin-bottom: 24px;
    }}
    th, td {{
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      font-size: 0.95rem;
    }}
    th {{
      text-align: left;
      background: #f0f5ff;
      color: #20304a;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }}
    tr:last-child td {{
      border-bottom: none;
    }}
    details.variant-detail {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 14px;
      margin: 10px 0;
      box-shadow: 0 8px 20px var(--shadow);
    }}
    summary {{
      cursor: pointer;
      font-weight: 700;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }}
    pre {{
      overflow: auto;
      background: #0f172a;
      color: #e8eefc;
      padding: 12px;
      border-radius: 12px;
      margin: 12px 0 0;
    }}
    ul {{
      line-height: 1.6;
    }}
    .variant-meta {{
      color: var(--muted);
      font-size: 0.86rem;
      font-weight: 600;
    }}
    .status {{
      display: inline-block;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }}
    .status.ok {{
      background: #edf9ef;
      color: #1f7a35;
      border-color: #c9e9cf;
    }}
    .status.warn {{
      background: #fff7e6;
      color: #9a6700;
      border-color: #f0ddb2;
    }}
    .status.bad {{
      background: #fff0f0;
      color: #a23d3d;
      border-color: #f0c2c2;
    }}
    .status.neutral {{
      background: #eef3f8;
      color: #4c5d70;
      border-color: #d7e0ea;
    }}
    .gap-pill {{
      display: inline-block;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }}
    .gap-pill.ok {{
      background: #edf9ef;
      color: #1f7a35;
    }}
    .gap-pill.warn {{
      background: #fff7e6;
      color: #9a6700;
    }}
    .gap-pill.bad {{
      background: #fff0f0;
      color: #a23d3d;
    }}
    .gap-pill.neutral {{
      background: #eef3f8;
      color: #4c5d70;
    }}
    .section-title {{
      margin: 10px 0 14px;
      font-size: 1.1rem;
      color: #20304a;
      letter-spacing: -0.01em;
    }}
    .section-subtitle {{
      margin: -6px 0 14px;
      color: var(--muted);
      font-size: 0.94rem;
    }}
    .small {{
      color: var(--muted);
      font-size: 0.95rem;
    }}
    .chart {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 12px 28px var(--shadow);
      padding: 16px;
      margin-bottom: 24px;
    }}
    .chart-row {{
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr) 180px;
      gap: 12px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }}
    .chart-row:last-child {{
      border-bottom: none;
    }}
    .chart-label {{
      font-weight: 650;
      color: #20304a;
    }}
    .bar-track {{
      position: relative;
      height: 12px;
      border-radius: 999px;
      overflow: hidden;
      background: #edf2f8;
      display: flex;
    }}
    .bar {{
      height: 100%;
    }}
    .bar.rescue {{
      background: linear-gradient(90deg, #4d78f2, #2158d6);
    }}
    .bar.wipeout {{
      background: linear-gradient(90deg, #f59d71, #d66435);
    }}
    .chart-values {{
      text-align: right;
      color: var(--muted);
      font-size: 0.9rem;
    }}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>The Wilds Balance Report</h1>
      <p>Static viewer for the simulator batch output. The JSON file remains the detailed source of truth, while this page is meant for fast executive review.</p>
      <div class="meta">
        <span>Games per scenario: {esc(meta.get("games_per_scenario", ""))}</span>
        <span>Player count: {esc(meta.get("player_count", ""))}</span>
        <span>Master seed: {esc(meta.get("master_seed", ""))}</span>
        <span>Scenarios: {esc(meta.get("scenario_count", ""))}</span>
      </div>
      <div class="verdict">{esc(verdict)}</div>
    </section>
    <section class="board">
      {"".join(
        f'<div class="board-card"><div class="label">{esc(label)}</div><div class="value">{esc(value)}</div><div class="note">{esc(note)}</div></div>'
        for label, value, note in board
      )}
    </section>
    <section class="grid">
      <div class="card"><div class="small">Current rescue</div><h2>{current.rescue_rate:.3f}</h2></div>
      <div class="card"><div class="small">Current wipeout</div><h2>{current.wipeout_rate:.3f}</h2></div>
      <div class="card"><div class="small">Main death cause</div><h2>{esc(primary_cause)}</h2></div>
      <div class="card"><div class="small">Engine actions / game</div><h2>{engine_actions:.2f}</h2></div>
    </section>
    <section class="card">
      <h2 class="section-title">Notes</h2>
      <ul>
        {''.join(f'<li>{esc(note)}</li>' for note in notes)}
      </ul>
    </section>
    <h2 class="section-title">Target Gap</h2>
    <p class="section-subtitle">Green means the metric sits inside the target band. Amber means close. Red means the current rules are still outside the band.</p>
    <table>
      <thead>
        <tr><th>Metric</th><th>Target</th><th>Current</th><th>Gap</th></tr>
      </thead>
      <tbody>
        {''.join(f'<tr><td>{esc(metric)}</td><td>{esc(target)}</td><td>{esc(current_value)}</td><td><span class="gap-pill {gap_class(gap)}">{esc(gap)}</span></td></tr>' for metric, target, current_value, gap in goal_rows)}
      </tbody>
    </table>
    <h2 class="section-title">Scenario Summary</h2>
    <table>
      <thead>
        <tr><th>Rank</th><th>Variant</th><th>Rescue</th><th>Wipeout</th><th>Avg Rounds</th><th>Avg Survivors</th><th>Profiles Present</th></tr>
      </thead>
      <tbody>
        {''.join(rows)}
      </tbody>
    </table>
    <h2 class="section-title">Comparisons vs Baseline</h2>
    <table>
      <thead>
        <tr><th>Variant</th><th>Rescue Delta</th><th>Wipeout Delta</th><th>Rounds Delta</th></tr>
      </thead>
      <tbody>
        {''.join(comparison_rows)}
      </tbody>
    </table>
    <section class="chart">
      <h2 class="section-title">Variant Trend View</h2>
      <p class="section-subtitle">Blue bars show rescue rate. Orange bars show wipeout rate. Longer bars are better only for rescue.</p>
      {''.join(chart_rows)}
    </section>
    <h2 class="section-title">Recommended Changes</h2>
    <div class="card">
      <ol>
        {recs}
      </ol>
    </div>
    <section class="card">
      <h2 class="section-title">Read This First</h2>
      <ul>
        <li>The game is still far below the requested rescue band.</li>
        <li>Hunger is not the only pressure; the main death cause in the current rules is {esc(primary_cause)}.</li>
        <li>Food and water engines are coming online well before the target round band.</li>
        <li>Zone-use is happening often enough to matter, but it is not converting into enough rescue.</li>
      </ul>
    </section>
    <section class="card">
      <h2 class="section-title">Likely Diagnosis</h2>
      <ul>
        <li>Overtuned: hunger pressure.</li>
        <li>Overtuned: morale pressure.</li>
        <li>Undertuned: rescue conversion.</li>
        <li>Undertuned: the payoff from stable engines.</li>
      </ul>
    </section>
    <section class="card">
      <h2 class="section-title">Top 3 Changes</h2>
      <ol>
        <li>Reduce passive hunger pressure first.</li>
        <li>Ease morale collapse next.</li>
        <li>Increase rescue conversion by strengthening signals or lowering the rescue target.</li>
      </ol>
    </section>
    <details class="variant-detail">
      <summary>Variant Details <span class="variant-meta">click to expand raw metrics</span></summary>
      <div>{''.join(details)}</div>
    </details>
  </main>
</body>
</html>"""


def recommendations_from_results(aggregates: List[AggregateResults]) -> List[str]:
    lookup = {agg.variant_name: agg for agg in aggregates}
    recs = []
    add = lambda text: recs.append(text) if text not in recs else None
    ranked = sorted(aggregates, key=lambda a: (a.rescue_rate, -a.wipeout_rate, a.average_rounds), reverse=True)
    best = ranked[0]
    baseline = lookup.get("A_pre_tweak_baseline", aggregates[0])
    current = lookup.get("B_current_rules", aggregates[0])
    add(f"Keep {best.variant_name} as the working baseline for the next pass.")
    if current.rescue_rate >= baseline.rescue_rate and current.wipeout_rate <= baseline.wipeout_rate:
        add("Do not restore the reconstructed pre-tweak baseline; the current rules are the stronger reference point.")
    add("Keep the combined hunger and food-tool rules consolidated in the current baseline.")
    add("Run a larger seed sweep before touching water or morale pressure.")
    add("Prefer targeted hunger relief over broad passive decay shifts.")
    add("Keep food tool power concentrated in crafted engines instead of raw deck density.")
    add("Use the current rules as the comparison baseline until a larger batch says otherwise.")
    return recs[:5]
