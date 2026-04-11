from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass(frozen=True)
class ScenarioVariant:
    name: str
    description: str
    search_hunger_cost: bool = True
    search_hunger_cost_limit: int | None = None
    round_end_hunger_decay: str = "none"
    round_end_hunger_threshold: int = 2
    morale_action_pool: bool = False
    morale_loss_cap_per_round: int | None = None
    rescue_target: int = 20
    rescue_use_bonus: int = 0
    passive_rescue_per_round: int = 0
    food_tool_hunger_bonus: int = 0
    starting_meters: Dict[str, int] = field(default_factory=lambda: {
        "hunger": 9,
        "warmth": 5,
        "hydration": 9,
        "morale": 9,
    })
    spoilage_mode: str = "standard"
    recipe_threshold_overrides: Dict[str, int] = field(default_factory=dict)


def first_balance_variants() -> List[ScenarioVariant]:
    return [
        ScenarioVariant(
            name="A_pre_tweak_baseline",
            description="Reconstructed pre-tweak baseline with round-end hunger decay and the older craft thresholds.",
            round_end_hunger_decay="always",
            recipe_threshold_overrides={"snare": 4, "fishing_pole": 5, "camp_stew": 5},
        ),
        ScenarioVariant(
            name="B_current_rules",
            description="Current repository rules with stronger starting kits, no round-end hunger decay, easier Snare/Fishing Pole thresholds, and capped morale loss.",
            round_end_hunger_decay="none",
            rescue_target=10,
            morale_loss_cap_per_round=1,
            recipe_threshold_overrides={"snare": 2, "fishing_pole": 3, "camp_stew": 2},
        ),
    ]


def scenario_variant_from_dict(data: Dict[str, Any]) -> ScenarioVariant:
    starting_meters = data.get("starting_meters") or data.get("startingMeters") or {}
    overrides = data.get("recipe_threshold_overrides") or data.get("recipeThresholdOverrides") or {}
    search_hunger_cost_limit = data.get("search_hunger_cost_limit", data.get("searchHungerCostLimit"))
    morale_loss_cap_per_round = data.get("morale_loss_cap_per_round", data.get("moraleLossCapPerRound"))
    return ScenarioVariant(
        name=str(data.get("name", "custom_balance_variant")),
        description=str(data.get("description", "")),
        search_hunger_cost=bool(data.get("search_hunger_cost", data.get("searchHungerCost", True))),
        search_hunger_cost_limit=int(search_hunger_cost_limit) if search_hunger_cost_limit is not None else None,
        round_end_hunger_decay=str(data.get("round_end_hunger_decay", data.get("roundEndHungerDecay", "none"))),
        round_end_hunger_threshold=int(data.get("round_end_hunger_threshold", data.get("roundEndHungerThreshold", 2))),
        morale_action_pool=bool(data.get("morale_action_pool", data.get("moraleActionPool", False))),
        morale_loss_cap_per_round=int(morale_loss_cap_per_round) if morale_loss_cap_per_round is not None else None,
        rescue_target=int(data.get("rescue_target", data.get("rescueTarget", 20))),
        rescue_use_bonus=int(data.get("rescue_use_bonus", data.get("rescueUseBonus", 0))),
        passive_rescue_per_round=int(data.get("passive_rescue_per_round", data.get("passiveRescuePerRound", 0))),
        food_tool_hunger_bonus=int(data.get("food_tool_hunger_bonus", data.get("foodToolHungerBonus", 0))),
        starting_meters={
            "hunger": int(starting_meters.get("hunger", 9)),
            "warmth": int(starting_meters.get("warmth", 5)),
            "hydration": int(starting_meters.get("hydration", 9)),
            "morale": int(starting_meters.get("morale", 9)),
        },
        spoilage_mode=str(data.get("spoilage_mode", data.get("spoilageMode", "standard"))),
        recipe_threshold_overrides={str(key): int(value) for key, value in overrides.items()},
    )


def scenario_variant_to_dict(variant: ScenarioVariant) -> Dict[str, Any]:
    return {
        "name": variant.name,
        "description": variant.description,
        "search_hunger_cost": variant.search_hunger_cost,
        "search_hunger_cost_limit": variant.search_hunger_cost_limit,
        "round_end_hunger_decay": variant.round_end_hunger_decay,
        "round_end_hunger_threshold": variant.round_end_hunger_threshold,
        "morale_action_pool": variant.morale_action_pool,
        "morale_loss_cap_per_round": variant.morale_loss_cap_per_round,
        "rescue_target": variant.rescue_target,
        "rescue_use_bonus": variant.rescue_use_bonus,
        "passive_rescue_per_round": variant.passive_rescue_per_round,
        "food_tool_hunger_bonus": variant.food_tool_hunger_bonus,
        "starting_meters": dict(variant.starting_meters),
        "spoilage_mode": variant.spoilage_mode,
        "recipe_threshold_overrides": dict(variant.recipe_threshold_overrides),
    }
