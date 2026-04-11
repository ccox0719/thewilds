from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple


ZONE_ORDER = ("forest", "river", "meadow", "highground")
FOOD_TOOL_IDS = {"snare", "fishing_pole", "spear", "bow", "fish_trap"}
SHELTER_IDS = {"lean_to", "sturdy_shelter", "debris_hut"}
FIRE_IDS = {"campfire", "sustained_fire", "signal_fire"}
WATER_IDS = {"boiled_water", "clay_pot", "water_filter", "water_rig", "water_cache"}
RESCUE_IDS = {"signal_mirror", "signal_kit", "rescue_cache"}
RECOVERY_IDS = {"herb_kit", "medicine_kit", "strong_medicine", "camp_stew", "boiled_water", "smoked_rations", "rescue_cache"}


@dataclass(frozen=True)
class ActionPlan:
    kind: str
    zone_id: Optional[str] = None
    recipe_id: Optional[str] = None
    card_id: Optional[str] = None
    cooked: bool = False
    note: str = ""


class BasePolicy:
    name = "base"

    def __init__(self, rng):
        self.rng = rng

    def choose_action(self, player, game, engine) -> ActionPlan:
        free = self.choose_free_consumption(player, game, engine)
        if free:
            return free
        stoke = self.choose_stoke_fire(player, game, engine)
        if stoke:
            return stoke
        if self.should_sleep(player, game, engine):
            return ActionPlan("sleep")
        if self.should_rest(player, game, engine):
            return ActionPlan("rest")
        signal = self.choose_signal_action(player, game, engine)
        if signal:
            return signal
        use_plan = self.choose_zone_use(player, game, engine)
        if use_plan:
            return use_plan
        craft = self.choose_craft(player, game, engine)
        if craft:
            return craft
        if self.should_cook(player, game, engine):
            return ActionPlan("cook")
        return ActionPlan("search", zone_id=self.choose_zone(player, game, engine))

    def choose_zone(self, player, game, engine) -> str:
        deficits = self._deficits(player)
        if deficits["hydration"] >= deficits["hunger"] and deficits["hydration"] >= deficits["warmth"]:
            return "river"
        if deficits["hunger"] >= deficits["warmth"]:
            return "forest"
        if deficits["morale"] > 2:
            return "meadow"
        return "forest"

    def choose_free_consumption(self, player, game, engine) -> Optional[ActionPlan]:
        target = self.choose_consumption_target(player, game, engine)
        if not target:
            return None
        card_id, cooked = target
        return ActionPlan("consume", card_id=card_id, cooked=cooked)

    def choose_consumption_target(self, player, game, engine) -> Optional[Tuple[str, bool]]:
        candidates = engine.get_inventory(player)
        best_score = 0
        best = None
        for card in candidates:
            score = engine.score_card_for_consumption(player, card, self, cooked=False)
            cooked = False
            if score > best_score:
                best_score = score
                best = (card.hand_id, cooked)
        return best

    def choose_stoke_fire(self, player, game, engine) -> Optional[ActionPlan]:
        fire = engine.get_active_fire_item(player)
        if not fire or fire.get("duration") is None or fire.get("duration", 0) > 1:
            return None
        fuel = engine.get_fuel_cards(player)
        if not fuel:
            return None
        return ActionPlan("stoke")

    def choose_zone_use(self, player, game, engine) -> Optional[ActionPlan]:
        candidates = []
        for item in engine.get_usable_zone_tools(player):
            score = engine.score_zone_use(player, item, self, player, game)
            if score > 0:
                candidates.append((score, item))
        if not candidates:
            return None
        candidates.sort(key=lambda pair: pair[0], reverse=True)
        item = candidates[0][1]
        return ActionPlan("use", zone_id=item["zone_id"], recipe_id=item["id"])

    def choose_signal_action(self, player, game, engine) -> Optional[ActionPlan]:
        candidates = []
        for item in engine.get_usable_zone_tools(player):
            if item["id"] not in RESCUE_IDS:
                continue
            score = engine.score_zone_use(player, item, self, player, game) + 8
            candidates.append((score, item))
        if not candidates:
            return None
        candidates.sort(key=lambda pair: pair[0], reverse=True)
        item = candidates[0][1]
        return ActionPlan("use", zone_id="highground", recipe_id=item["id"])

    def choose_craft(self, player, game, engine) -> Optional[ActionPlan]:
        candidates = []
        for recipe in engine.get_craftable_recipes(player):
            score = self.score_recipe(player, recipe, game, engine)
            if score > 0:
                candidates.append((score, recipe))
        if not candidates:
            return None
        candidates.sort(key=lambda pair: pair[0], reverse=True)
        return ActionPlan("craft", recipe_id=candidates[0][1].id)

    def should_cook(self, player, game, engine) -> bool:
        return any(card.category == "food" and (card.raw_risk or card.cook_bonus) for card in engine.get_inventory(player))

    def should_rest(self, player, game, engine) -> bool:
        return player.meters["warmth"] <= 3 and engine.has_shelter(player)

    def should_sleep(self, player, game, engine) -> bool:
        return min(player.meters.values()) <= 1 and player.actions_left <= 1

    def prefers_cooked_food(self, player, card, game, engine) -> bool:
        return bool(card.cook_bonus)

    def score_recipe(self, player, recipe, game, engine) -> float:
        rid = recipe.id
        score = recipe.points * 0.2
        if rid in SHELTER_IDS:
            score += max(0, 8 - player.meters["warmth"]) * 1.5
        if rid in FIRE_IDS:
            score += max(0, 8 - player.meters["warmth"]) * 1.2
        if rid in WATER_IDS:
            score += max(0, 8 - player.meters["hydration"]) * 1.5
        if rid in FOOD_TOOL_IDS:
            score += max(0, 8 - player.meters["hunger"]) * 1.5
        if rid in RESCUE_IDS:
            score += max(0, game.rescue_target - game.shared_rescue) * 0.8
        if rid in RECOVERY_IDS:
            score += max(0, 8 - player.meters["morale"]) * 1.2
        return score

    def _deficits(self, player):
        return {
            "hunger": max(0, 6 - player.meters["hunger"]),
            "warmth": max(0, 6 - player.meters["warmth"]),
            "hydration": max(0, 6 - player.meters["hydration"]),
            "morale": max(0, 6 - player.meters["morale"]),
        }


class StabilizerPolicy(BasePolicy):
    name = "stabilizer"

    def choose_zone(self, player, game, engine) -> str:
        deficits = self._deficits(player)
        if deficits["hydration"] > deficits["hunger"] and deficits["hydration"] > deficits["warmth"]:
            return "river"
        if deficits["hunger"] > deficits["warmth"]:
            return "forest"
        if deficits["morale"] > 1:
            return "meadow"
        return super().choose_zone(player, game, engine)

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in SHELTER_IDS | FIRE_IDS | WATER_IDS:
            score += 5
        return score


class HunterFirstPolicy(BasePolicy):
    name = "hunter_first"

    def choose_zone(self, player, game, engine) -> str:
        return "forest" if player.meters["hunger"] <= 6 else "river"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in FOOD_TOOL_IDS:
            score += 10
        if recipe.id in {"drying_rack", "smoked_rations", "food_cache"}:
            score += 4
        return score

    def should_cook(self, player, game, engine) -> bool:
        return engine.has_campfire(player) and any(card.category == "food" and (card.raw_risk or card.cook_bonus) for card in engine.get_inventory(player))

    def prefers_cooked_food(self, player, card, game, engine) -> bool:
        return True


class ForagerFirstPolicy(BasePolicy):
    name = "forager_first"

    def choose_zone(self, player, game, engine) -> str:
        if player.meters["hydration"] <= 5:
            return "river"
        return "meadow" if player.meters["morale"] <= 5 else "forest"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in WATER_IDS:
            score += 10
        if recipe.id in {"herb_kit", "medicine_kit", "strong_medicine", "camp_stew"}:
            score += 6
        return score

    def should_cook(self, player, game, engine) -> bool:
        return engine.has_campfire(player) and any(card.category == "food" and (card.raw_risk or card.cook_bonus) for card in engine.get_inventory(player))


class FirekeeperFirstPolicy(BasePolicy):
    name = "firekeeper_first"

    def choose_zone(self, player, game, engine) -> str:
        return "forest"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in SHELTER_IDS | FIRE_IDS:
            score += 10
        if recipe.id == "torch":
            score += 4
        return score

    def should_rest(self, player, game, engine) -> bool:
        return player.meters["warmth"] <= 4


class RescuerPolicy(BasePolicy):
    name = "rescuer"

    def choose_zone(self, player, game, engine) -> str:
        return "highground" if player.meters["warmth"] >= 3 else "forest"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in RESCUE_IDS:
            score += 12
        return score


class AdaptivePolicy(BasePolicy):
    name = "adaptive"

    def choose_zone(self, player, game, engine) -> str:
        deficits = self._deficits(player)
        scores = {
            "forest": deficits["hunger"] * 1.5 + deficits["warmth"] * 1.1,
            "river": deficits["hydration"] * 1.6,
            "meadow": deficits["morale"] * 1.3 + deficits["hunger"] * 0.5,
            "highground": max(0, game.shared_rescue - 6) * 1.0,
        }
        return max(scores.items(), key=lambda pair: pair[1])[0]

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in FOOD_TOOL_IDS and player.meters["hunger"] <= 6:
            score += 4
        if recipe.id in WATER_IDS and player.meters["hydration"] <= 6:
            score += 4
        if recipe.id in FIRE_IDS and player.meters["warmth"] <= 6:
            score += 4
        if recipe.id in RESCUE_IDS and game.shared_rescue >= game.rescue_target // 2:
            score += 4
        return score


class RiskTakerPolicy(BasePolicy):
    name = "risk_taker"

    def choose_zone(self, player, game, engine) -> str:
        return self.rng.choice(list(ZONE_ORDER))

    def prefers_cooked_food(self, player, card, game, engine) -> bool:
        return False

    def should_rest(self, player, game, engine) -> bool:
        return player.meters["warmth"] <= 2


class ConservativePolicy(BasePolicy):
    name = "conservative"

    def choose_zone(self, player, game, engine) -> str:
        if player.meters["hydration"] <= 5:
            return "river"
        if player.meters["warmth"] <= 5:
            return "forest"
        if player.meters["morale"] <= 5:
            return "meadow"
        return "forest"

    def should_sleep(self, player, game, engine) -> bool:
        return min(player.meters.values()) <= 2 and player.actions_left <= 2

    def prefers_cooked_food(self, player, card, game, engine) -> bool:
        return True


class RescueRushPolicy(BasePolicy):
    name = "rescue_rush"

    def choose_zone(self, player, game, engine) -> str:
        if game.shared_rescue >= max(6, game.rescue_target // 2):
            return "highground"
        if player.meters["warmth"] <= 4:
            return "forest"
        return "highground"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in RESCUE_IDS:
            score += 18
        if recipe.id in FIRE_IDS:
            score += 3
        if recipe.id in WATER_IDS:
            score += 2
        return score

    def choose_signal_action(self, player, game, engine) -> Optional[ActionPlan]:
        return super().choose_signal_action(player, game, engine) or None

    def should_rest(self, player, game, engine) -> bool:
        return player.meters["warmth"] <= 3


class SurvivalistPolicy(BasePolicy):
    name = "survivalist"

    def choose_zone(self, player, game, engine) -> str:
        deficits = self._deficits(player)
        if deficits["hunger"] >= deficits["hydration"]:
            return "forest"
        if deficits["hydration"] >= deficits["warmth"]:
            return "river"
        return "meadow"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in FOOD_TOOL_IDS:
            score += 7
        if recipe.id in WATER_IDS:
            score += 7
        if recipe.id in {"drying_rack", "smoked_rations", "food_cache", "water_cache"}:
            score += 5
        return score

    def should_cook(self, player, game, engine) -> bool:
        return engine.has_campfire(player) and any(card.category == "food" and (card.raw_risk or card.cook_bonus) for card in engine.get_inventory(player))

    def prefers_cooked_food(self, player, card, game, engine) -> bool:
        return True


class EngineRushPolicy(BasePolicy):
    name = "engine_rush"

    def choose_zone(self, player, game, engine) -> str:
        deficits = self._deficits(player)
        if deficits["warmth"] >= deficits["hydration"]:
            return "forest"
        return "river" if player.meters["hydration"] <= 6 else "meadow"

    def score_recipe(self, player, recipe, game, engine) -> float:
        score = super().score_recipe(player, recipe, game, engine)
        if recipe.id in SHELTER_IDS | FIRE_IDS | WATER_IDS:
            score += 8
        if recipe.id in RESCUE_IDS and game.shared_rescue >= game.rescue_target // 3:
            score += 6
        return score

    def should_rest(self, player, game, engine) -> bool:
        return player.meters["warmth"] <= 4 and not engine.has_shelter(player)


def build_policy(name: str, rng) -> BasePolicy:
    mapping = {
        "stabilizer": StabilizerPolicy,
        "hunter_first": HunterFirstPolicy,
        "forager_first": ForagerFirstPolicy,
        "firekeeper_first": FirekeeperFirstPolicy,
        "rescuer": RescuerPolicy,
        "adaptive": AdaptivePolicy,
        "risk_taker": RiskTakerPolicy,
        "conservative": ConservativePolicy,
        "rescue_rush": RescueRushPolicy,
        "survivalist": SurvivalistPolicy,
        "engine_rush": EngineRushPolicy,
    }
    cls = mapping.get(name, BasePolicy)
    policy = cls(rng)
    policy.name = name
    return policy


def all_policy_names() -> List[str]:
    return [
        "stabilizer",
        "hunter_first",
        "forager_first",
        "firekeeper_first",
        "rescuer",
        "adaptive",
        "risk_taker",
        "conservative",
        "rescue_rush",
        "survivalist",
        "engine_rush",
    ]
