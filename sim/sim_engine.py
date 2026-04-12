from __future__ import annotations

import copy
import json
import random
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from .policies import (
        ActionPlan,
        FOOD_TOOL_IDS,
        FIRE_IDS,
        RESCUE_IDS,
        SHELTER_IDS,
        WATER_IDS,
        all_policy_names,
        build_policy,
    )
    from .scenario_variants import ScenarioVariant
except ImportError:  # pragma: no cover
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from policies import (  # type: ignore
        ActionPlan,
        FOOD_TOOL_IDS,
        FIRE_IDS,
        RESCUE_IDS,
        SHELTER_IDS,
        WATER_IDS,
        all_policy_names,
        build_policy,
    )
    from scenario_variants import ScenarioVariant  # type: ignore


REPO_ROOT = Path(__file__).resolve().parent.parent
MAX_GAME_ROUNDS = 120


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


@dataclass
class Card:
    id: str
    name: str
    category: str
    value: int = 1
    description: str = ""
    zone_id: Optional[str] = None
    consume_effect: Dict[str, Any] = field(default_factory=dict)
    cook_bonus: Dict[str, Any] = field(default_factory=dict)
    raw_risk: bool = False
    unsafe: bool = False
    hazard_effect: Dict[str, Any] = field(default_factory=dict)
    protected_by: List[str] = field(default_factory=list)
    spoils: Optional[bool] = None
    type: Optional[str] = None
    hand_id: str = ""


@dataclass
class Recipe:
    id: str
    name: str
    category: str
    craft_type: str
    runtime_type: str
    profile: Optional[str]
    zone: Optional[str]
    requires: Dict[str, int]
    requires_recipes: List[str]
    craft_requirements: Dict[str, Any]
    use_requirements: Dict[str, Any]
    value_threshold: int
    tier: str
    effect: Dict[str, Any]
    points: int
    action_name: Optional[str]
    description: str


@dataclass
class Zone:
    id: str
    name: str
    draw_count: int
    cards: List[Card]


@dataclass
class PlayerState:
    name: str
    profile_id: str
    policy_name: str
    meters: Dict[str, int]
    is_ai: bool = True
    hand: List[Card] = field(default_factory=list)
    stockpile: List[Card] = field(default_factory=list)
    tableau: List[Dict[str, Any]] = field(default_factory=list)
    score: int = 0
    actions_left: int = 3
    pending_food_draw_bonus: int = 0
    pending_zone_hazard_cancel_zone: Optional[str] = None
    safe_water_ready: bool = False
    waterborne_illness: bool = False
    last_explored_zone: Optional[str] = None
    crafted_recipe_ids: set = field(default_factory=set)
    selected_cards: set = field(default_factory=set)
    searches_this_round: int = 0
    actions_spent: Counter = field(default_factory=Counter)
    zone_visits: Counter = field(default_factory=Counter)
    use_counts: Counter = field(default_factory=Counter)
    craft_counts: Counter = field(default_factory=Counter)
    consumed_raw_food: int = 0
    consumed_unsafe_water: int = 0
    death_cause: Optional[str] = None
    first_engine_rounds: Dict[str, Optional[int]] = field(
        default_factory=lambda: {
            "shelter": None,
            "fire": None,
            "water_treatment": None,
            "food_tool": None,
            "rescue_signal": None,
        }
    )


@dataclass
class GameState:
    round: int = 1
    current_player_index: int = 0
    shared_rescue: int = 0
    rescue_target: int = 20
    selected_zone: Optional[str] = None
    game_over: bool = False
    end_reason: Optional[str] = None
    winner_profile: Optional[str] = None
    winner_player: Optional[str] = None


@dataclass
class GameResult:
    variant_name: str
    seed: int
    game_index: int
    roster: List[str]
    rounds_played: int
    end_reason: str
    shared_rescue: int
    survivors: int
    winner_player: Optional[str]
    winner_profile: Optional[str]
    player_results: List[Dict[str, Any]]
    zone_visits: Counter
    recipe_crafts: Counter
    use_counts: Counter
    action_counts: Counter
    hazard_triggers: int
    hazard_prevented: int
    raw_food_consumption: int
    unsafe_water_consumption: int
    engine_firsts: Dict[str, Optional[int]]


@dataclass
class AggregateResults:
    variant_name: str
    games: int
    rescue_rate: float
    wipeout_rate: float
    average_rounds: float
    average_survivors: float
    average_final_scores: Dict[str, float]
    win_rate_by_profile: Dict[str, float]
    death_rate_by_cause: Dict[str, float]
    zone_visit_frequency: Dict[str, int]
    recipe_craft_frequency: Dict[str, int]
    first_engine_rounds: Dict[str, float]
    raw_food_consumption: int
    unsafe_water_consumption: int
    hazard_trigger_frequency: int
    hazard_prevented_frequency: int
    use_frequency_by_item: Dict[str, int]
    action_spend: Dict[str, float]
    games_detail: List[Dict[str, Any]]


class SimulationEngine:
    def __init__(self, repo_root: Path = REPO_ROOT):
        self.repo_root = Path(repo_root)
        self.materials_data = None
        self.zones_data = None
        self.recipes_data = None
        self.zones: Dict[str, Zone] = {}
        self.recipes: Dict[str, Recipe] = {}
        self.active_variant: Optional[ScenarioVariant] = None
        self.special_reward_cards = {
            "rabbit": Card(
                id="rabbit",
                name="Rabbit",
                category="food",
                value=1,
                description="A raw small-game catch. Better cooked before eating.",
                consume_effect={"hunger": 2},
                cook_bonus={"hunger": 2},
                raw_risk=True,
            ),
            "deer": Card(
                id="deer",
                name="Deer",
                category="food",
                value=3,
                description="A raw large-game catch. Strong payoff when cooked.",
                consume_effect={"hunger": 3},
                cook_bonus={"hunger": 3},
                raw_risk=True,
            ),
            "river_fish": Card(
                id="river_fish",
                name="Fish",
                category="food",
                value=2,
                description="Fresh fish catch. Better cooked or preserved.",
                consume_effect={"hunger": 3},
                cook_bonus={"hunger": 2},
                raw_risk=True,
            )
        }
        self.cooked_food_cards = {
            "rabbit": Card(
                id="cooked_rabbit",
                name="Cooked Rabbit",
                category="food",
                value=2,
                description="Cooked small-game meat ready to eat safely.",
                consume_effect={"hunger": 4},
                spoils=False,
            ),
            "deer": Card(
                id="cooked_deer",
                name="Cooked Deer",
                category="food",
                value=4,
                description="Cooked large-game meat ready to eat safely.",
                consume_effect={"hunger": 6},
                spoils=False,
            ),
            "river_fish": Card(
                id="cooked_fish",
                name="Cooked Fish",
                category="food",
                value=3,
                description="Cooked fish ready to eat safely.",
                consume_effect={"hunger": 5},
                spoils=False,
            ),
        }

    def load(self) -> None:
        self.materials_data = self._load_json("materials.json")
        self.zones_data = self._load_json("zones.json")
        self.recipes_data = self._load_json("recipes.json")
        self.zones = self._build_zones(self.materials_data, self.zones_data)
        self.recipes = self._build_recipes(self.recipes_data)

    def _load_json(self, relative_name: str) -> Any:
        path = self.repo_root / relative_name
        try:
            with path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"failed to load {relative_name}: {exc}") from exc

    def _expect(self, condition: bool, message: str) -> None:
        if not condition:
            raise ValueError(message)

    def _build_zones(self, materials_data: Dict[str, Any], zones_data: Dict[str, Any]) -> Dict[str, Zone]:
        self._expect(isinstance(materials_data, dict), "materials.json must be an object")
        self._expect(isinstance(zones_data, dict), "zones.json must be an object")
        zones_list = zones_data.get("zones")
        self._expect(isinstance(zones_list, list), "zones.json must contain a zones array")
        materials_zones = materials_data.get("zones", {})
        self._expect(isinstance(materials_zones, dict), "materials.json zones must be an object")

        zones: Dict[str, Zone] = {}
        for zone_entry in zones_list:
            self._expect(isinstance(zone_entry, dict), "zone entry must be an object")
            zone_id = zone_entry.get("id")
            self._expect(isinstance(zone_id, str), "zone missing id")
            zone_material = materials_zones.get(zone_id, {})
            self._expect(isinstance(zone_material, dict), f"materials for {zone_id} must be an object")
            cards = [self._material_card_from_json(card, zone_id) for card in zone_material.get("cards", [])]
            zones[zone_id] = Zone(
                id=zone_id,
                name=zone_entry.get("name", zone_id),
                draw_count=int(zone_entry.get("drawCount", 2)),
                cards=cards,
            )
        return zones

    def _material_card_from_json(self, raw: Dict[str, Any], zone_id: str) -> Card:
        self._expect(isinstance(raw, dict), "material card must be an object")
        self._expect(isinstance(raw.get("id"), str), "material card missing id")
        return Card(
            id=raw["id"],
            name=raw.get("name", raw["id"]),
            category=raw.get("category", "unknown"),
            value=int(raw.get("value", 1)),
            description=raw.get("description", ""),
            zone_id=zone_id,
            consume_effect=copy.deepcopy(raw.get("consumeEffect") or {}),
            cook_bonus=copy.deepcopy(raw.get("cookBonus") or {}),
            raw_risk=bool(raw.get("rawRisk", False)),
            unsafe=bool(raw.get("unsafe", False)),
            hazard_effect=copy.deepcopy(raw.get("hazardEffect") or {}),
            protected_by=list(raw.get("protectedBy") or []),
            spoils=raw.get("spoils"),
            type=raw.get("type"),
        )

    def _build_recipes(self, recipes_data: Dict[str, Any]) -> Dict[str, Recipe]:
        self._expect(isinstance(recipes_data, dict), "recipes.json must be an object")
        groups = recipes_data.get("recipes")
        self._expect(isinstance(groups, list), "recipes.json must contain a recipes array")
        recipes: Dict[str, Recipe] = {}
        for group in groups:
            self._expect(isinstance(group, dict), "recipe group must be an object")
            category = str(group.get("category", ""))
            items = group.get("items")
            self._expect(isinstance(items, list), f"recipe group {category} must contain an items array")
            for raw in items:
                self._expect(isinstance(raw, dict), "recipe entry must be an object")
                recipe_id = raw.get("id")
                self._expect(isinstance(recipe_id, str), "recipe missing id")
                value_threshold = int(raw.get("valueThreshold", 0))
                craft_type = str(raw.get("type", "camp"))
                runtime_type = "one-time" if craft_type == "recovery" else "persistent"
                recipes[recipe_id] = Recipe(
                    id=recipe_id,
                    name=raw.get("name", recipe_id),
                    category=category,
                    craft_type=craft_type,
                    runtime_type=runtime_type,
                    profile=raw.get("profile"),
                    zone=raw.get("zone"),
                    requires={str(k): int(v) for k, v in (raw.get("requires") or {}).items()},
                    requires_recipes=[str(r) for r in raw.get("requiresRecipes") or []],
                    craft_requirements=copy.deepcopy(raw.get("craftRequirements") or {}),
                    use_requirements=copy.deepcopy(raw.get("useRequirements") or {}),
                    value_threshold=value_threshold,
                    tier="expert" if value_threshold >= 8 else "improved" if value_threshold >= 5 else "basic",
                    effect=copy.deepcopy(raw.get("effect") or {}),
                    points=int(raw.get("points", 0)),
                    action_name=raw.get("actionName"),
                    description=raw.get("description", ""),
                )
        return recipes

    def run_batch(self, variant: ScenarioVariant, games: int, master_seed: int, player_count: int = 4, policy_mix: Optional[List[List[str]]] = None) -> AggregateResults:
        results = []
        started = time.perf_counter()
        progress_step = max(1, min(250, games // 10 or 1))
        for game_index in range(games):
            seed = self.scenario_seed(master_seed, variant.name, game_index)
            roster = policy_mix[game_index % len(policy_mix)] if policy_mix else None
            results.append(self.run_game(variant, seed, game_index, player_count=player_count, policy_names=roster))
            completed = game_index + 1
            if completed == games or completed % progress_step == 0:
                elapsed = time.perf_counter() - started
                rate = completed / elapsed if elapsed > 0 else 0.0
                remaining = games - completed
                eta = (remaining / rate) if rate > 0 else 0.0
                print(
                    f"[sim] {variant.name}: {completed}/{games} games "
                    f"({rate:.1f} games/s, eta {eta/60:.1f}m)",
                    flush=True,
                )
        return self.aggregate_results(variant.name, results)

    def scenario_seed(self, master_seed: int, variant_name: str, index: int) -> int:
        return (master_seed * 1000003 + index * 104729) & 0xFFFFFFFF

    def create_game(self, variant: ScenarioVariant, seed: int, game_index: int, player_count: int = 4, policy_names: Optional[List[str]] = None):
        rng = random.Random(seed)
        if policy_names is None:
            policy_names = self.sample_policy_roster(rng, player_count)
        profiles = ["firekeeper", "forager", "hunter", "pathfinder"][:player_count]
        players = [
            PlayerState(
                name=f"Player {i + 1}",
                profile_id=profiles[i],
                policy_name=policy_names[i],
                meters=dict(variant.starting_meters),
                actions_left=self.starting_actions(variant.starting_meters, variant),
            )
            for i in range(player_count)
        ]
        self.apply_starting_loadouts(players)
        game = GameState(rescue_target=variant.rescue_target)
        return game, players, rng

    def get_starting_loadouts(self) -> Dict[str, List[str]]:
        if isinstance(self.materials_data, dict):
            loadouts = self.materials_data.get("starting_loadouts") or self.materials_data.get("startingLoadouts")
            if isinstance(loadouts, dict):
                return {str(key): [str(card_id) for card_id in value] for key, value in loadouts.items() if isinstance(value, list)}
        return {
            "firekeeper": ["straight_sapling", "tinder_bundle", "hardwood_bough"],
            "forager": ["bark_fiber", "wild_onion", "coarse_reed"],
            "hunter": ["straight_sapling", "snare_bait", "bark_fiber"],
            "pathfinder": ["coarse_reed", "driftwood", "river_stone"],
        }

    def apply_starting_loadouts(self, players: List[PlayerState]) -> None:
        loadouts = self.get_starting_loadouts()
        for player in players:
            ids = loadouts.get(player.profile_id) or loadouts.get("default") or []
            for card_id in ids:
                template = next((card for card in self._all_materials() if card.id == card_id), None)
                if not template:
                    continue
                player.hand.append(self.clone_card(template))

    def sample_policy_roster(self, rng: random.Random, player_count: int) -> List[str]:
        names = all_policy_names()
        rng.shuffle(names)
        return names[:player_count]

    def run_game(self, variant: ScenarioVariant, seed: int, game_index: int, player_count: int = 4, policy_names: Optional[List[str]] = None) -> GameResult:
        game, players, rng = self.create_game(variant, seed, game_index, player_count=player_count, policy_names=policy_names)
        policies = [build_policy(player.policy_name, random.Random((seed << 1) + idx + 17)) for idx, player in enumerate(players)]
        stats = {
            "zone_visits": Counter(),
            "recipe_crafts": Counter(),
            "use_counts": Counter(),
            "action_counts": Counter(),
            "hazard_triggers": 0,
            "hazard_prevented": 0,
            "raw_food_consumption": 0,
            "unsafe_water_consumption": 0,
            "engine_firsts": {
                "shelter": None,
                "fire": None,
                "water_treatment": None,
                "food_tool": None,
                "rescue_signal": None,
            },
        }

        self.active_variant = variant
        try:
            while not game.game_over:
                if game.round > MAX_GAME_ROUNDS:
                    game.game_over = True
                    game.end_reason = "timeout"
                    break
                current = players[game.current_player_index]
                policy = policies[game.current_player_index]
                self.run_turn(game, players, current, policy, variant, rng, stats)
                if game.game_over:
                    break
                self.end_turn(game, players, variant, rng, stats)
                if game.round > MAX_GAME_ROUNDS:
                    game.game_over = True
                    game.end_reason = "timeout"
                    break
        finally:
            self.active_variant = None

        survivors = sum(1 for player in players if player.death_cause is None)
        winner_player = None
        winner_profile = None
        if game.end_reason == "rescue":
            winner = max(players, key=lambda player: player.score)
            winner_player = winner.name
            winner_profile = winner.profile_id
        player_results = [
            {
                "name": player.name,
                "profile": player.profile_id,
                "policy": player.policy_name,
                "score": player.score,
                "meters": dict(player.meters),
                "death_cause": player.death_cause,
                "first_engine_rounds": dict(player.first_engine_rounds),
                "actions_spent": dict(player.actions_spent),
                "zone_visits": dict(player.zone_visits),
                "craft_counts": dict(player.craft_counts),
                "use_counts": dict(player.use_counts),
                "raw_food_consumption": player.consumed_raw_food,
                "unsafe_water_consumption": player.consumed_unsafe_water,
            }
            for player in players
        ]
        return GameResult(
            variant_name=variant.name,
            seed=seed,
            game_index=game_index,
            roster=[player.policy_name for player in players],
            rounds_played=game.round,
            end_reason=game.end_reason or "unknown",
            shared_rescue=game.shared_rescue,
            survivors=survivors,
            winner_player=winner_player,
            winner_profile=winner_profile,
            player_results=player_results,
            zone_visits=stats["zone_visits"],
            recipe_crafts=stats["recipe_crafts"],
            use_counts=stats["use_counts"],
            action_counts=stats["action_counts"],
            hazard_triggers=stats["hazard_triggers"],
            hazard_prevented=stats["hazard_prevented"],
            raw_food_consumption=stats["raw_food_consumption"],
            unsafe_water_consumption=stats["unsafe_water_consumption"],
            engine_firsts=stats["engine_firsts"],
        )

    def run_turn(self, game: GameState, players: List[PlayerState], current: PlayerState, policy, variant: ScenarioVariant, rng: random.Random, stats: Dict[str, Any]) -> None:
        if current.death_cause is not None:
            return
        current.actions_left = self.starting_actions(current.meters, variant)
        current.searches_this_round = 0
        free_use_used = False
        free_cook_used = False
        while current.actions_left > 0 and not game.game_over:
            self.check_game_state(game, players, variant)
            if game.game_over:
                break
            if current.death_cause is not None:
                return
            free = policy.choose_free_consumption(current, game, self)
            if free:
                self.execute_free_consume(current, free, rng, stats)
                self.check_game_state(game, players, variant)
                if current.death_cause is not None:
                    return
                continue
            plan = policy.choose_action(current, game, self)
            if plan.kind == "consume":
                self.execute_free_consume(current, plan, rng, stats)
                self.check_game_state(game, players, variant)
                if current.death_cause is not None:
                    return
                continue
            # Zone-use and cook are free follow-through actions in this ruleset.
            # Cap them to once per turn each so the AI cannot loop forever.
            if plan.kind == "use":
                if free_use_used:
                    break
                executed = self.execute_plan(game, players, current, policy, variant, rng, plan, stats)
                if not executed:
                    break
                free_use_used = True
                self.check_game_state(game, players, variant)
                if current.death_cause is not None:
                    return
                continue
            if plan.kind == "cook":
                if free_cook_used:
                    break
                executed = self.execute_plan(game, players, current, policy, variant, rng, plan, stats)
                if not executed:
                    break
                free_cook_used = True
                self.check_game_state(game, players, variant)
                if current.death_cause is not None:
                    return
                continue
            if not self.execute_plan(game, players, current, policy, variant, rng, plan, stats):
                break
            self.check_game_state(game, players, variant)
            if current.death_cause is not None:
                return

    def execute_plan(self, game: GameState, players: List[PlayerState], current: PlayerState, policy, variant: ScenarioVariant, rng: random.Random, plan: ActionPlan, stats: Dict[str, Any]) -> bool:
        if plan.kind == "search":
            return self.search_zone(game, current, plan.zone_id or policy.choose_zone(current, game, self), variant, rng, stats)
        if plan.kind == "craft":
            recipe = self.recipes.get(plan.recipe_id or "")
            return bool(recipe and self.craft_recipe(game, current, recipe, variant, rng, stats))
        if plan.kind == "use":
            return self.use_zone_item(game, current, plan.recipe_id or "", plan.zone_id, variant, rng, stats)
        if plan.kind == "rest":
            return self.rest_at_shelter(current, stats)
        if plan.kind == "cook":
            return self.cook_food(current, plan.card_id, stats)
        if plan.kind == "sleep":
            return self.sleep_turn(current, stats)
        if plan.kind == "stoke":
            return self.stoke_fire(current, stats)
        if plan.kind == "end":
            current.actions_left = 0
            return True
        return False

    def execute_free_consume(self, player: PlayerState, plan: ActionPlan, rng: random.Random, stats: Dict[str, Any]) -> None:
        card = self.find_card(player, plan.card_id or "")
        if not card:
            return
        self.apply_consume_effect(player, card, cooked=plan.cooked, stats=stats)
        self.remove_card(player, card.hand_id)

    def search_zone(self, game: GameState, player: PlayerState, zone_id: str, variant: ScenarioVariant, rng: random.Random, stats: Dict[str, Any]) -> bool:
        zone = self.zones.get(zone_id)
        if not zone or player.actions_left <= 0:
            return False
        if variant.search_hunger_cost and (
            variant.search_hunger_cost_limit is None or player.searches_this_round < variant.search_hunger_cost_limit
        ):
            player.meters["hunger"] = clamp(player.meters["hunger"] - 1, 0, 10)
        room_left = max(0, self.get_hand_limit(player) - len(player.hand))
        actual_draw_count = min(self.get_explore_draw_count(player, zone_id), room_left)
        if actual_draw_count <= 0:
            return False
        stats["zone_visits"][zone_id] += 1
        player.zone_visits[zone_id] += 1
        player.last_explored_zone = zone_id
        game.selected_zone = None
        player.pending_food_draw_bonus = 0
        for _ in range(actual_draw_count):
            card, hazard_status = self.draw_from_zone(zone_id, player, rng)
            if hazard_status == "triggered":
                stats["hazard_triggers"] += 1
            elif hazard_status == "prevented":
                stats["hazard_prevented"] += 1
            if card:
                player.hand.append(card)
        player.pending_food_draw_bonus = 0
        player.actions_left -= 1
        player.actions_spent["search"] += 1
        stats["action_counts"]["search"] += 1
        player.searches_this_round += 1
        return True

    def draw_from_zone(self, zone_id: str, player: PlayerState, rng: random.Random) -> Tuple[Optional[Card], Optional[str]]:
        zone = self.zones[zone_id]
        pool = list(zone.cards)
        if not pool:
            return None, None
        roll = rng.random()
        if roll < 0.12:
            eligible = [card for card in pool if card.category == "hazard"]
        elif roll < 0.42:
            eligible = [card for card in pool if card.value == 2]
        else:
            eligible = [card for card in pool if card.value == 1]
        if not eligible:
            eligible = pool
        pick = rng.choice(eligible)
        if pick.category == "hazard":
            return None, "prevented" if self.resolve_hazard_card(pick, player, zone_id, rng) else "triggered"
        card = self.clone_card(pick)
        bonus_count = self.get_tableau_bonus(player, "bonusDraw")
        if zone_id == "river":
            bonus_count += self.get_tableau_bonus(player, "bonusWaterDraw")
        if player.meters["morale"] >= 8:
            bonus_count += 1
        if player.pending_food_draw_bonus:
            bonus_count += player.pending_food_draw_bonus
        for _ in range(bonus_count):
            bonus = self.draw_bonus_card(zone_id, card.category, rng)
            if bonus:
                player.hand.append(bonus)
        return card, None

    def draw_bonus_card(self, zone_id: str, category: str, rng: random.Random) -> Optional[Card]:
        zone = self.zones[zone_id]
        eligible = [card for card in zone.cards if card.category == category and card.category != "hazard"]
        if not eligible:
            return None
        return self.clone_card(rng.choice(eligible))

    def clone_card(self, template: Card) -> Card:
        return Card(
            id=template.id,
            name=template.name,
            category=template.category,
            value=template.value,
            description=template.description,
            zone_id=template.zone_id,
            consume_effect=copy.deepcopy(template.consume_effect),
            cook_bonus=copy.deepcopy(template.cook_bonus),
            raw_risk=template.raw_risk,
            unsafe=template.unsafe,
            hazard_effect=copy.deepcopy(template.hazard_effect),
            protected_by=list(template.protected_by),
            spoils=template.spoils,
            type=template.type,
            hand_id=self.next_hand_id(),
        )

    def make_cooked_food_card(self, raw_card: Card) -> Optional[Card]:
        if raw_card.category != "food":
            return None
        template_key = raw_card.id
        cooked_template = self.cooked_food_cards.get(template_key)
        if cooked_template:
            return self.clone_card(cooked_template)
        raw_hunger = raw_card.consume_effect.get("hunger") if isinstance(raw_card.consume_effect.get("hunger"), int) else 0
        raw_bonus = raw_card.cook_bonus.get("hunger") if isinstance(raw_card.cook_bonus.get("hunger"), int) else 0
        cooked_hunger = raw_hunger + raw_bonus
        if cooked_hunger <= 0:
            return None
        return Card(
            id=f"cooked_{raw_card.id}",
            name=f"Cooked {raw_card.name}",
            category="food",
            value=max(1, raw_card.value + 1),
            description=f"Cooked {raw_card.name.lower()} ready to eat safely.",
            consume_effect={"hunger": cooked_hunger},
            spoils=False,
            hand_id=self.next_hand_id(),
        )

    def next_hand_id(self) -> str:
        if not hasattr(self, "_hand_counter"):
            self._hand_counter = 1
        hand_id = f"h{self._hand_counter}"
        self._hand_counter += 1
        return hand_id

    def get_explore_draw_count(self, player: PlayerState, zone_id: str) -> int:
        morale_bonus = 1 if player.meters["morale"] >= 8 else 0
        zone_bonus = self.get_tableau_bonus(player, "bonusWaterDraw") if zone_id == "river" else 0
        return 2 + self.get_tableau_bonus(player, "bonusDraw") + zone_bonus + morale_bonus + player.pending_food_draw_bonus

    def get_hand_limit(self, player: PlayerState) -> int:
        limit = 7
        if player.meters["morale"] >= 8:
            limit += 1
        elif player.meters["morale"] <= 2:
            limit -= 2
        elif player.meters["morale"] <= 4:
            limit -= 1
        return limit

    def get_tableau_bonus(self, player: PlayerState, key: str) -> int:
        total = 0
        for item in player.tableau:
            effect = item.get("effect") or {}
            value = effect.get(key)
            if isinstance(value, int):
                total += value
        return total

    def allowed_recipe_ids(self, profile_id: str) -> set:
        shared = {
            "food_cache",
            "water_cache",
            "snare",
            "fishing_pole",
            "spear",
            "bow",
            "fish_trap",
            "drying_rack",
            "smoked_rations",
            "cutting_tool",
            "knife",
            "axe",
            "forage_kit",
            "climbing_staff",
            "smoke_tool",
            "torch",
        }
        profiles = {
            "firekeeper": {"lean_to", "sturdy_shelter", "debris_hut", "campfire", "sustained_fire", "signal_fire", "torch"},
            "forager": {"boiled_water", "clay_pot", "water_filter", "water_rig", "water_cache", "herb_kit", "medicine_kit", "strong_medicine", "camp_stew"},
            "hunter": {"snare", "fishing_pole", "spear", "bow", "fish_trap", "drying_rack", "smoked_rations", "food_cache"},
            "pathfinder": {"cutting_tool", "knife", "axe", "forage_kit", "climbing_staff", "smoke_tool", "signal_mirror", "signal_kit", "rescue_cache"},
        }
        return profiles.get(profile_id, set()) | shared

    def get_craftable_recipes(self, player: PlayerState) -> List[Recipe]:
        return [recipe for recipe in self.recipes.values() if self.can_craft(recipe, player)]

    def can_craft(self, recipe: Recipe, player: PlayerState) -> bool:
        if recipe.id not in self.allowed_recipe_ids(player.profile_id):
            return False
        if any(req_id not in player.crafted_recipe_ids for req_id in recipe.requires_recipes):
            return False
        if self.get_missing_stat_requirements(recipe.craft_requirements, player):
            return False
        chosen, total = self.select_cards_for_recipe(recipe, player)
        return bool(chosen) and total >= self.effective_threshold(recipe, player)

    def effective_threshold(self, recipe: Recipe, player: PlayerState) -> int:
        reduction = self.get_tableau_bonus(player, "craftCostReduction")
        threshold = recipe.value_threshold
        if self.active_variant and recipe.id in self.active_variant.recipe_threshold_overrides:
            threshold = int(self.active_variant.recipe_threshold_overrides[recipe.id])
        return max(0, threshold - reduction)

    def select_cards_for_recipe(self, recipe: Recipe, player: PlayerState) -> Tuple[List[Card], int]:
        inventory = self.get_inventory(player)
        used: set = set()
        chosen: List[Card] = []
        for category, count in recipe.requires.items():
            for _ in range(count):
                candidates = [card for card in inventory if card.hand_id not in used and self.card_matches_requirement(card, category)]
                if not candidates:
                    return [], 0
                candidates.sort(key=lambda card: (card.value, card.name), reverse=True)
                card = candidates[0]
                used.add(card.hand_id)
                chosen.append(card)
        total = sum(card.value for card in chosen)
        threshold = self.effective_threshold(recipe, player)
        while total < threshold:
            extras = [
                card
                for card in inventory
                if card.hand_id not in used and any(self.card_matches_requirement(card, category) for category in recipe.requires)
            ]
            if not extras:
                break
            extras.sort(key=lambda card: (card.value, card.name), reverse=True)
            card = extras[0]
            used.add(card.hand_id)
            chosen.append(card)
            total += card.value
        return chosen, total

    def card_matches_requirement(self, card: Card, category: str) -> bool:
        return card.category == category or (card.id == "dry_flower_bundle" and category == "plant")

    def get_missing_stat_requirements(self, reqs: Dict[str, Any], player: PlayerState) -> List[str]:
        if not reqs:
            return []
        missing = []
        if isinstance(reqs.get("hungerMin"), int) and player.meters["hunger"] < reqs["hungerMin"]:
            missing.append("hunger")
        if isinstance(reqs.get("warmthMin"), int) and player.meters["warmth"] < reqs["warmthMin"]:
            missing.append("warmth")
        if isinstance(reqs.get("warmthMax"), int) and player.meters["warmth"] > reqs["warmthMax"]:
            missing.append("warmth")
        if isinstance(reqs.get("hydrationMin"), int) and player.meters["hydration"] < reqs["hydrationMin"]:
            missing.append("hydration")
        if isinstance(reqs.get("moraleMin"), int) and player.meters["morale"] < reqs["moraleMin"]:
            missing.append("morale")
        if isinstance(reqs.get("actionsMin"), int) and player.actions_left < reqs["actionsMin"]:
            missing.append("actions")
        if reqs.get("needsComfort") and (player.meters["warmth"] < 3 or player.meters["warmth"] > 7):
            missing.append("comfort")
        return missing

    def get_use_requirement_failures(self, recipe: Recipe, player: PlayerState) -> List[str]:
        reqs = recipe.use_requirements or {}
        failures = self.get_missing_stat_requirements(reqs, player)
        if reqs.get("requiresCardId") and not any(card.id == reqs["requiresCardId"] for card in self.get_inventory(player)):
            failures.append(reqs.get("requiresCardLabel") or reqs["requiresCardId"])
        return failures

    def get_inventory(self, player: PlayerState) -> List[Card]:
        return list(player.hand) + list(player.stockpile)

    def find_card(self, player: PlayerState, hand_id: str) -> Optional[Card]:
        for card in self.get_inventory(player):
            if card.hand_id == hand_id:
                return card
        return None

    def remove_card(self, player: PlayerState, hand_id: str) -> None:
        player.hand = [card for card in player.hand if card.hand_id != hand_id]
        player.stockpile = [card for card in player.stockpile if card.hand_id != hand_id]

    def has_campfire(self, player: PlayerState) -> bool:
        return self.get_active_fire_item(player) is not None

    def has_shelter(self, player: PlayerState) -> bool:
        return any(item["id"] in SHELTER_IDS for item in player.tableau)

    def has_raw_food_safety(self, player: PlayerState) -> bool:
        return any((item.get("effect") or {}).get("rawFoodSafe") for item in player.tableau)

    def has_water_treatment(self, player: PlayerState) -> bool:
        return any((item.get("effect") or {}).get("treatsWater") for item in player.tableau)

    def player_has_protection(self, player: PlayerState, threat_id: str) -> bool:
        return any(threat_id in (item.get("protectsAgainst") or []) for item in player.tableau)

    def get_active_fire_item(self, player: PlayerState) -> Optional[Dict[str, Any]]:
        for item in player.tableau:
            if item["id"] in FIRE_IDS and (item.get("duration") is None or item.get("duration", 0) > 0):
                return item
        return None

    def get_fuel_cards(self, player: PlayerState) -> List[Card]:
        cards = [card for card in self.get_inventory(player) if card.category in {"wood", "stone", "plant", "fire_starter"}]
        cards.sort(key=lambda card: (card.category != "fire_starter", card.value), reverse=True)
        return cards

    def score_card_for_consumption(self, player: PlayerState, card: Card, policy, cooked: bool = False) -> float:
        score = 0.0
        if card.category == "food":
            if player.meters["hunger"] <= 6:
                score += (7 - player.meters["hunger"]) * 2 + card.value
            if cooked or self.has_campfire(player):
                score += 1.5
            if card.raw_risk and not cooked and not policy.prefers_cooked_food(player, card, None, self):
                score -= 2.0
        elif card.category == "water":
            if player.meters["hydration"] <= 6:
                score += (7 - player.meters["hydration"]) * 2 + card.value
            if card.unsafe and not player.safe_water_ready and not self.has_water_treatment(player):
                score -= 1.0
        return score

    def score_zone_use(self, player: PlayerState, item: Dict[str, Any], policy, player_state: PlayerState, game: GameState) -> float:
        recipe = self.recipes.get(item["id"])
        if not recipe:
            return 0.0
        effect = recipe.effect or {}
        score = 0.0
        score += effect.get("hungerOnActivate", 0) * 2
        score += effect.get("hungerOnSuccess", 0) * 2
        score += effect.get("fishBonus", 0) * 1.5
        score += effect.get("rescue", 0) * 2.5
        if item["id"] in FOOD_TOOL_IDS and player_state.meters["hunger"] <= 6:
            score += 3
        if item["id"] in RESCUE_IDS and game.shared_rescue < game.rescue_target:
            score += 5
        return score

    def get_usable_zone_tools(self, player: PlayerState) -> List[Dict[str, Any]]:
        tools = []
        for item in player.tableau:
            recipe = self.recipes.get(item["id"])
            if not recipe or recipe.craft_type != "zone_use":
                continue
            if self.get_use_requirement_failures(recipe, player):
                continue
            tools.append(
                {
                    "id": recipe.id,
                    "name": recipe.name,
                    "zone_id": recipe.zone,
                    "action_name": recipe.action_name,
                    "effect": recipe.effect,
                }
            )
        return tools

    def get_fire_duration(self, recipe: Recipe, chosen_cards: List[Card]) -> int:
        starter = max((self.fire_starter_strength(card) for card in chosen_cards), default=1) or 1
        fuel_count = sum(1 for card in chosen_cards if card.category != "fire_starter")
        base = recipe.effect.get("duration") if isinstance(recipe.effect.get("duration"), int) else 1 if recipe.id == "campfire" else 2
        return int(base) + starter + max(0, fuel_count // 2)

    def fire_starter_strength(self, card: Card) -> int:
        return card.value if card.category == "fire_starter" else 0

    def craft_recipe(self, game: GameState, player: PlayerState, recipe: Recipe, variant: ScenarioVariant, rng: random.Random, stats: Dict[str, Any]) -> bool:
        if player.actions_left <= 0:
            return False
        chosen, _ = self.select_cards_for_recipe(recipe, player)
        if not chosen:
            return False
        for card in chosen:
            self.remove_card(player, card.hand_id)
        player.crafted_recipe_ids.add(recipe.id)
        player.actions_left -= 1
        player.actions_spent["craft"] += 1
        stats["action_counts"]["craft"] += 1
        player.craft_counts[recipe.id] += 1
        stats["recipe_crafts"][recipe.id] += 1

        effect = recipe.effect or {}
        if isinstance(effect.get("hydration"), int):
            player.meters["hydration"] = clamp(player.meters["hydration"] + effect["hydration"], 0, 10)
        if isinstance(effect.get("hunger"), int):
            player.meters["hunger"] = clamp(player.meters["hunger"] + effect["hunger"], 0, 10)
        if isinstance(effect.get("rescue"), int):
            game.shared_rescue = clamp(game.shared_rescue + effect["rescue"], 0, variant.rescue_target)
        if isinstance(effect.get("anyMeter"), int):
            lowest = min(("hunger", "warmth", "hydration"), key=lambda key: player.meters[key])
            player.meters[lowest] = clamp(player.meters[lowest] + effect["anyMeter"], 0, 10)
        if effect.get("cleansesUnsafeWater") or effect.get("safe"):
            player.safe_water_ready = True
            player.waterborne_illness = False
        if isinstance(effect.get("morale"), int):
            player.meters["morale"] = clamp(player.meters["morale"] + effect["morale"], 0, 10)
        player.meters["morale"] = clamp(player.meters["morale"] + 1, 0, 10)
        if recipe.tier == "expert":
            player.meters["morale"] = clamp(player.meters["morale"] + 1, 0, 10)
        player.score += recipe.points
        if recipe.runtime_type == "persistent":
            tableau_item = {
                "id": recipe.id,
                "name": recipe.name,
                "effect": copy.deepcopy(effect),
                "duration": effect.get("duration"),
            }
            hazard_reduction = effect.get("hazardReduction")
            if isinstance(hazard_reduction, str):
                tableau_item["protectsAgainst"] = [hazard_reduction]
            elif isinstance(hazard_reduction, list):
                tableau_item["protectsAgainst"] = list(hazard_reduction)
            if recipe.id in FIRE_IDS:
                tableau_item["effect"]["fire"] = True
                tableau_item["duration"] = self.get_fire_duration(recipe, chosen)
            player.tableau.append(tableau_item)
        self.check_engine_firsts(player, recipe, game.round, stats["engine_firsts"])
        return True

    def use_zone_item(self, game: GameState, player: PlayerState, recipe_id: str, zone_id: Optional[str], variant: ScenarioVariant, rng: random.Random, stats: Dict[str, Any]) -> bool:
        recipe = self.recipes.get(recipe_id)
        if not recipe or recipe.craft_type != "zone_use":
            return False
        item = next((entry for entry in player.tableau if entry["id"] == recipe_id), None)
        if not item:
            return False
        if zone_id and zone_id != recipe.zone:
            return False
        if self.get_use_requirement_failures(recipe, player):
            return False
        if recipe.id == "snare":
            bait = next((card for card in self.get_inventory(player) if card.id == "snare_bait"), None)
            if not bait:
                return False
            self.remove_card(player, bait.hand_id)
        roll_die = int(recipe.effect.get("rollDie", 1))
        roll = 1 if roll_die <= 1 else rng.randint(1, roll_die)
        success_on = set(recipe.effect.get("successOn") or [])
        success = not success_on or roll in success_on
        outcome = copy.deepcopy(recipe.effect if success else recipe.effect.get("fail") or {})
        if success:
            if recipe.id in {"snare", "spear"}:
                outcome = {"grantHandCardId": "rabbit"}
            elif recipe.id == "bow":
                outcome = {"grantHandCardId": "deer"}
            elif recipe.id in {"fishing_pole", "fish_trap"}:
                outcome = {"grantHandCardId": "river_fish"}
        if player.profile_id == "hunter" and success and recipe.id in {"bow", "fishing_pole"} and isinstance(outcome.get("hunger"), int):
            outcome["hunger"] += 1
        self.apply_zone_use_outcome(player, recipe, outcome, game, variant)
        player.actions_spent["use"] += 1
        stats["action_counts"]["use"] += 1
        stats["use_counts"][recipe_id] += 1
        player.use_counts[recipe_id] += 1
        if recipe.action_name == "signal" or recipe.id in RESCUE_IDS:
            stats["action_counts"]["signal"] += 1
        self.check_engine_firsts(player, recipe, game.round, stats["engine_firsts"])
        return True

    def apply_zone_use_outcome(self, player: PlayerState, recipe: Recipe, outcome: Dict[str, Any], game: GameState, variant: ScenarioVariant) -> None:
        if isinstance(outcome.get("morale"), int):
            player.meters["morale"] = clamp(player.meters["morale"] + outcome["morale"], 0, 10)
        if isinstance(outcome.get("hunger"), int):
            player.meters["hunger"] = clamp(player.meters["hunger"] + outcome["hunger"], 0, 10)
        if isinstance(outcome.get("hydration"), int):
            player.meters["hydration"] = clamp(player.meters["hydration"] + outcome["hydration"], 0, 10)
        if isinstance(outcome.get("warmth"), int):
            player.meters["warmth"] = clamp(player.meters["warmth"] + outcome["warmth"], 0, 10)
        if isinstance(outcome.get("rescue"), int):
            game.shared_rescue = clamp(game.shared_rescue + outcome["rescue"], 0, variant.rescue_target)
            if recipe.id in RESCUE_IDS and variant.rescue_use_bonus:
                game.shared_rescue = clamp(game.shared_rescue + variant.rescue_use_bonus, 0, variant.rescue_target)
        if isinstance(outcome.get("bonusDraw"), int):
            player.pending_food_draw_bonus += outcome["bonusDraw"]
        if outcome.get("grantHandCardId"):
            template = self.special_reward_cards.get(outcome["grantHandCardId"])
            if template:
                player.hand.append(self.clone_card(template))
        if outcome.get("safeWater"):
            player.safe_water_ready = True
        if outcome.get("cancelHazard"):
            player.pending_zone_hazard_cancel_zone = recipe.zone
        if recipe.id in FOOD_TOOL_IDS and isinstance(outcome.get("hunger"), int) and variant.food_tool_hunger_bonus:
            player.meters["hunger"] = clamp(player.meters["hunger"] + variant.food_tool_hunger_bonus, 0, 10)

    def apply_consume_effect(self, player: PlayerState, card: Card, cooked: bool, stats: Dict[str, Any]) -> None:
        effect = card.consume_effect or {}
        if isinstance(effect.get("hunger"), int):
            player.meters["hunger"] = clamp(player.meters["hunger"] + effect["hunger"], 0, 10)
        if isinstance(effect.get("warmth"), int):
            player.meters["warmth"] = clamp(player.meters["warmth"] + effect["warmth"], 0, 10)
        if isinstance(effect.get("hydration"), int):
            player.meters["hydration"] = clamp(player.meters["hydration"] + effect["hydration"], 0, 10)
        if cooked:
            bonus = card.cook_bonus or {}
            if isinstance(bonus.get("hunger"), int):
                player.meters["hunger"] = clamp(player.meters["hunger"] + bonus["hunger"], 0, 10)
            if isinstance(bonus.get("hungerBonus"), int):
                player.meters["hunger"] = clamp(player.meters["hunger"] + bonus["hungerBonus"], 0, 10)
            if isinstance(bonus.get("hydration"), int):
                player.meters["hydration"] = clamp(player.meters["hydration"] + bonus["hydration"], 0, 10)
            if isinstance(bonus.get("warmth"), int):
                player.meters["warmth"] = clamp(player.meters["warmth"] + bonus["warmth"], 0, 10)
            if isinstance(bonus.get("morale"), int):
                player.meters["morale"] = clamp(player.meters["morale"] + bonus["morale"], 0, 10)
        unsafe_protected = card.unsafe and (player.safe_water_ready or self.has_water_treatment(player) or self.player_has_protection(player, "waterborne_illness"))
        if card.unsafe and not unsafe_protected:
            player.meters["hydration"] = clamp(player.meters["hydration"] - 1, 0, 10)
            player.meters["morale"] = clamp(player.meters["morale"] - 1, 0, 10)
            player.consumed_unsafe_water += 1
            stats["unsafe_water_consumption"] += 1
        if card.unsafe and player.safe_water_ready:
            player.safe_water_ready = False
        if card.category == "water" and player.waterborne_illness and not self.has_water_treatment(player):
            player.meters["hydration"] = clamp(player.meters["hydration"] - 3, 0, 10)
            player.meters["morale"] = clamp(player.meters["morale"] - 2, 0, 10)
            player.waterborne_illness = False
        if card.raw_risk and card.category == "food" and not cooked and not self.has_raw_food_safety(player):
            player.meters["morale"] = clamp(player.meters["morale"] - 1, 0, 10)
            player.consumed_raw_food += 1
            stats["raw_food_consumption"] += 1
        if effect.get("clearFlag"):
            player.waterborne_illness = False

    def cook_food(self, player: PlayerState, card_id: Optional[str], stats: Dict[str, Any]) -> bool:
        if not self.has_campfire(player):
            return False
        cards = [card for card in self.get_inventory(player) if card.category == "food" and (card.raw_risk or card.cook_bonus)]
        if card_id:
            cards = [card for card in cards if card.hand_id == card_id]
        if not cards:
            return False
        cooked_any = False
        for card in cards:
            cooked_card = self.make_cooked_food_card(card)
            if not cooked_card:
                continue
            self.remove_card(player, card.hand_id)
            player.stockpile.append(cooked_card)
            cooked_any = True
        return cooked_any

    def rest_at_shelter(self, player: PlayerState, stats: Dict[str, Any]) -> bool:
        if player.actions_left <= 0:
            return False
        player.meters["warmth"] = clamp(player.meters["warmth"] + self.get_rest_warmth_recovery(player), 0, 10)
        player.meters["morale"] = clamp(player.meters["morale"] + 1, 0, 10)
        player.actions_left -= 1
        player.actions_spent["rest"] += 1
        stats["action_counts"]["rest"] += 1
        return True

    def sleep_turn(self, player: PlayerState, stats: Dict[str, Any]) -> bool:
        player.meters["warmth"] = 5
        player.meters["morale"] = clamp(player.meters["morale"] + 2, 0, 10)
        player.actions_left = 0
        player.actions_spent["sleep"] += 1
        stats["action_counts"]["sleep"] += 1
        return True

    def stoke_fire(self, player: PlayerState, stats: Dict[str, Any]) -> bool:
        fire = self.get_active_fire_item(player)
        if not fire or player.actions_left <= 0:
            return False
        fuel_cards = self.get_fuel_cards(player)[:2]
        if not fuel_cards:
            return False
        gain = 0
        for card in fuel_cards:
            gain += self.fire_starter_strength(card) if card.category == "fire_starter" else 1
            self.remove_card(player, card.hand_id)
        fire["duration"] = (fire.get("duration") or 0) + gain
        player.actions_left -= 1
        player.actions_spent["stoke"] += 1
        stats["action_counts"]["stoke"] += 1
        return True

    def get_rest_warmth_recovery(self, player: PlayerState) -> int:
        if any(item["id"] == "debris_hut" for item in player.tableau):
            return 4
        if any(item["id"] == "sturdy_shelter" for item in player.tableau):
            return 3
        if any(item["id"] == "lean_to" for item in player.tableau):
            return 2
        return 1

    def get_warmth_pressure_reduction(self, player: PlayerState) -> int:
        total = 0
        for item in player.tableau:
            effect = item.get("effect") or {}
            duration = item.get("duration")
            if duration is not None and duration <= 0:
                continue
            reduction = effect.get("warmthPressureReduction")
            if isinstance(reduction, int):
                total += reduction
                if player.profile_id == "firekeeper" and item["id"] == "campfire":
                    total += 1
        return total

    def apply_tableau_effects(self, player: PlayerState, game: GameState, variant: ScenarioVariant, rng: random.Random) -> None:
        updated = []
        has_camp_infrastructure = any(item["id"] in SHELTER_IDS | FIRE_IDS | RESCUE_IDS for item in player.tableau)
        for item in player.tableau:
            effect = item.get("effect") or {}
            if isinstance(effect.get("warmthPerRound"), int):
                player.meters["warmth"] = clamp(player.meters["warmth"] + effect["warmthPerRound"], 0, 10)
            if isinstance(effect.get("hungerPerRound"), int):
                player.meters["hunger"] = clamp(player.meters["hunger"] + effect["hungerPerRound"], 0, 10)
            if isinstance(effect.get("rescuePerRound"), int):
                game.shared_rescue = clamp(game.shared_rescue + effect["rescuePerRound"], 0, variant.rescue_target)
            if isinstance(effect.get("pointsPerRound"), int):
                player.score += effect["pointsPerRound"]
            if isinstance(effect.get("passiveHydration"), int):
                player.meters["hydration"] = clamp(player.meters["hydration"] + effect["passiveHydration"], 0, 10)
            if isinstance(effect.get("foodPerRoundChance"), (int, float)):
                source_zone = effect.get("foodSourceZone")
                if (not source_zone or source_zone == player.last_explored_zone) and rng.random() < effect["foodPerRoundChance"]:
                    self.grant_food_card(player, source_zone or player.last_explored_zone or "forest", rng)
            duration = item.get("duration")
            if duration is not None:
                item["duration"] = duration - 1
                if item["duration"] > 0:
                    updated.append(item)
            else:
                updated.append(item)
        if variant.passive_rescue_per_round and has_camp_infrastructure:
            game.shared_rescue = clamp(game.shared_rescue + variant.passive_rescue_per_round, 0, variant.rescue_target)
        player.tableau = updated

    def grant_food_card(self, player: PlayerState, zone_id: str, rng: random.Random) -> None:
        zone = self.zones.get(zone_id)
        pool = [card for card in (zone.cards if zone else []) if card.category == "food"] or [card for card in self._all_materials() if card.category == "food"]
        if not pool:
            return
        candidate_pool = [card for card in pool if card.value == 1] or pool
        player.hand.append(self.clone_card(rng.choice(candidate_pool)))

    def _all_materials(self) -> List[Card]:
        cards = []
        for zone in self.zones.values():
            cards.extend(zone.cards)
        return cards

    def resolve_hazard_card(self, card: Card, player: PlayerState, zone_id: str, rng: random.Random) -> bool:
        if self.player_has_protection(player, card.id) or any(req in player.crafted_recipe_ids for req in card.protected_by):
            return True
        self.apply_hazard(card, player, zone_id, rng)
        return False

    def apply_hazard(self, card: Card, player: PlayerState, zone_id: str, rng: random.Random) -> None:
        effect = card.hazard_effect or {}
        if isinstance(effect.get("morale"), int):
            player.meters["morale"] = clamp(player.meters["morale"] + effect["morale"], 0, 10)
        if isinstance(effect.get("hunger"), int):
            player.meters["hunger"] = clamp(player.meters["hunger"] + effect["hunger"], 0, 10)
        if isinstance(effect.get("warmth"), int):
            player.meters["warmth"] = clamp(player.meters["warmth"] + effect["warmth"], 0, 10)
        if isinstance(effect.get("hydration"), int):
            player.meters["hydration"] = clamp(player.meters["hydration"] + effect["hydration"], 0, 10)
        if effect.get("setFlag") == "waterborne_illness":
            player.waterborne_illness = True
        if isinstance(effect.get("hungerIfNoShelter"), int) and not self.has_shelter(player):
            player.meters["hunger"] = clamp(player.meters["hunger"] + effect["hungerIfNoShelter"], 0, 10)
        if isinstance(effect.get("discardRandom"), int):
            for _ in range(effect["discardRandom"]):
                self.discard_random_hand_card(player, rng)

    def discard_random_hand_card(self, player: PlayerState, rng: random.Random) -> None:
        if not player.hand:
            return
        self.remove_card(player, rng.choice(player.hand).hand_id)

    def resolve_end_of_turn_inventory(self, player: PlayerState, variant: ScenarioVariant) -> None:
        preserve_food = any((item.get("effect") or {}).get("preserveFood") for item in player.tableau)
        durable = []
        for card in player.hand:
            if self.is_spoilable(card, preserve_food, variant):
                continue
            durable.append(card)
        for card in durable:
            if not any(existing.hand_id == card.hand_id for existing in player.stockpile):
                player.stockpile.append(card)
        player.hand = []
        if variant.spoilage_mode == "strict":
            player.stockpile = [card for card in player.stockpile if not self.is_spoilable(card, False, variant)]
        elif variant.spoilage_mode == "lenient":
            player.stockpile = [card for card in player.stockpile if card.category != "hazard"]
        else:
            player.stockpile = [card for card in player.stockpile if not self.is_spoilable(card, preserve_food, variant)]

    def is_spoilable(self, card: Card, preserve_food: bool, variant: ScenarioVariant) -> bool:
        if card.spoils is True:
            return True
        if card.spoils is False:
            return False
        if variant.spoilage_mode == "lenient":
            return False
        if card.category == "water":
            return False
        if card.category == "food" and preserve_food:
            return False
        if card.category != "food":
            return False
        utility_only = bool(card.consume_effect.get("foodDrawBonus")) or bool(card.consume_effect.get("bonusFlint")) or bool(card.consume_effect.get("grantLeanTo")) or ("rescue" in card.consume_effect and "hunger" not in card.consume_effect and "hydration" not in card.consume_effect)
        return not utility_only

    def apply_round_end(self, game: GameState, players: List[PlayerState], variant: ScenarioVariant, rng: random.Random, stats: Dict[str, Any]) -> None:
        for player in players:
            if player.death_cause is not None:
                continue
            self.apply_tableau_effects(player, game, variant, rng)
            warmth_shift = -1 + self.get_warmth_pressure_reduction(player)
            if warmth_shift > 0:
                warmth_shift = 0
            player.meters["warmth"] = clamp(player.meters["warmth"] + warmth_shift, 0, 10)
            hunger_decay = self.round_end_hunger_decay(player, game, variant)
            if hunger_decay:
                player.meters["hunger"] = clamp(player.meters["hunger"] - hunger_decay, 0, 10)
            hydration_decay = 2 if player.meters["warmth"] > 7 else 1
            player.meters["hydration"] = clamp(player.meters["hydration"] - hydration_decay, 0, 10)
            morale_loss = 0
            if player.meters["warmth"] < 3:
                morale_loss += 1
            if not self.has_shelter(player):
                morale_loss += 1
            critical_count = sum(1 for key in ("hunger", "warmth", "hydration") if player.meters[key] <= 2)
            if critical_count >= 2:
                morale_loss += 1
            if variant.morale_loss_cap_per_round is not None:
                morale_loss = min(morale_loss, variant.morale_loss_cap_per_round)
            if morale_loss:
                player.meters["morale"] = clamp(player.meters["morale"] - morale_loss, 0, 10)
            self.resolve_end_of_turn_inventory(player, variant)
            player.searches_this_round = 0
            player.pending_zone_hazard_cancel_zone = None
            player.safe_water_ready = False

    def round_end_hunger_decay(self, player: PlayerState, game: GameState, variant: ScenarioVariant) -> int:
        if variant.round_end_hunger_decay == "none":
            return 0
        if variant.round_end_hunger_decay == "always":
            return 1
        if variant.round_end_hunger_decay == "every_other_round":
            return 1 if game.round % 2 == 0 else 0
        if variant.round_end_hunger_decay == "after_searches":
            return 1 if player.searches_this_round >= variant.round_end_hunger_threshold else 0
        return 0

    def end_turn(self, game: GameState, players: List[PlayerState], variant: ScenarioVariant, rng: random.Random, stats: Dict[str, Any]) -> None:
        current = players[game.current_player_index]
        self.resolve_end_of_turn_inventory(current, variant)
        previous_index = game.current_player_index
        next_index = -1
        for offset in range(1, len(players) + 1):
            candidate = (previous_index + offset) % len(players)
            if players[candidate].death_cause is None:
                next_index = candidate
                break
        if next_index < 0:
            game.game_over = True
            game.end_reason = "wipeout"
            return
        wrapped = next_index <= previous_index
        game.current_player_index = next_index
        if wrapped:
            game.round += 1
            self.apply_round_end(game, players, variant, rng, stats)
        self.check_game_state(game, players, variant)
        if game.game_over:
            return

    def starting_actions(self, meters: Dict[str, int], variant: ScenarioVariant) -> int:
        if variant.morale_action_pool:
            bonus = 1 if meters["morale"] >= 8 else 0
            penalty = 1 if meters["morale"] <= 2 else 0
            return clamp(3 + bonus - penalty, 1, 4)
        return 3

    def check_engine_firsts(self, player: PlayerState, recipe: Recipe, round_num: int, engine_firsts: Dict[str, Optional[int]]) -> None:
        rid = recipe.id
        if engine_firsts["shelter"] is None and rid in SHELTER_IDS:
            engine_firsts["shelter"] = round_num
            player.first_engine_rounds["shelter"] = round_num
        if engine_firsts["fire"] is None and rid in FIRE_IDS:
            engine_firsts["fire"] = round_num
            player.first_engine_rounds["fire"] = round_num
        if engine_firsts["water_treatment"] is None and rid in WATER_IDS:
            engine_firsts["water_treatment"] = round_num
            player.first_engine_rounds["water_treatment"] = round_num
        if engine_firsts["food_tool"] is None and rid in FOOD_TOOL_IDS:
            engine_firsts["food_tool"] = round_num
            player.first_engine_rounds["food_tool"] = round_num
        if engine_firsts["rescue_signal"] is None and rid in RESCUE_IDS:
            engine_firsts["rescue_signal"] = round_num
            player.first_engine_rounds["rescue_signal"] = round_num

    def check_game_state(self, game: GameState, players: List[PlayerState], variant: ScenarioVariant) -> None:
        if game.game_over:
            return
        if game.shared_rescue >= game.rescue_target:
            game.game_over = True
            game.end_reason = "rescue"
            winner = max(players, key=lambda player: player.score)
            game.winner_player = winner.name
            game.winner_profile = winner.profile_id
            return
        for player in players:
            if player.death_cause is not None:
                continue
            if player.meters["hunger"] <= 0:
                player.death_cause = "hunger"
            elif player.meters["warmth"] <= 0:
                player.death_cause = "warmth"
            elif player.meters["hydration"] <= 0:
                player.death_cause = "hydration"
            elif player.meters["morale"] <= 0:
                player.death_cause = "morale"

        if not any(player.death_cause is None for player in players):
            game.game_over = True
            game.end_reason = "wipeout"

    def aggregate_results(self, variant_name: str, games: List[GameResult]) -> AggregateResults:
        if not games:
            raise ValueError("no games to aggregate")
        total = len(games)
        rescue = sum(1 for game in games if game.end_reason == "rescue")
        wipeout = sum(1 for game in games if game.end_reason == "wipeout")
        average_rounds = sum(game.rounds_played for game in games) / total
        average_survivors = sum(game.survivors for game in games) / total
        zone_visits = Counter()
        recipe_crafts = Counter()
        use_counts = Counter()
        action_counts = Counter()
        raw_food = 0
        unsafe_water = 0
        hazard_triggers = 0
        hazard_prevented = 0
        profile_scores = defaultdict(list)
        profile_wins = Counter()
        deaths = Counter()
        engine_rounds = defaultdict(list)
        total_players = 0
        for game in games:
            zone_visits.update(game.zone_visits)
            recipe_crafts.update(game.recipe_crafts)
            use_counts.update(game.use_counts)
            action_counts.update(game.action_counts)
            raw_food += game.raw_food_consumption
            unsafe_water += game.unsafe_water_consumption
            hazard_triggers += game.hazard_triggers
            hazard_prevented += game.hazard_prevented
            if game.winner_profile:
                profile_wins[game.winner_profile] += 1
            total_players += len(game.player_results)
            for player in game.player_results:
                profile_scores[player["profile"]].append(player["score"])
                if player["death_cause"]:
                    deaths[player["death_cause"]] += 1
                for key, value in player["first_engine_rounds"].items():
                    if value is not None:
                        engine_rounds[key].append(value)
        avg_scores = {profile: (sum(values) / len(values) if values else 0.0) for profile, values in profile_scores.items()}
        win_rates = {profile: profile_wins[profile] / total for profile in ["firekeeper", "forager", "hunter", "pathfinder"]}
        death_denominator = total_players or total
        death_rates = {cause: deaths[cause] / death_denominator for cause in ["hunger", "warmth", "hydration", "morale"]}
        first_rounds = {key: (sum(values) / len(values) if values else 0.0) for key, values in engine_rounds.items()}
        action_spend = {key: action_counts[key] / total for key in ["search", "craft", "use", "rest", "cook", "signal", "stoke", "sleep"]}
        detail = [self.game_to_dict(game) for game in games]
        return AggregateResults(
            variant_name=variant_name,
            games=total,
            rescue_rate=rescue / total,
            wipeout_rate=wipeout / total,
            average_rounds=average_rounds,
            average_survivors=average_survivors,
            average_final_scores=avg_scores,
            win_rate_by_profile=win_rates,
            death_rate_by_cause=death_rates,
            zone_visit_frequency=dict(zone_visits),
            recipe_craft_frequency=dict(recipe_crafts),
            first_engine_rounds=first_rounds,
            raw_food_consumption=raw_food,
            unsafe_water_consumption=unsafe_water,
            hazard_trigger_frequency=hazard_triggers,
            hazard_prevented_frequency=hazard_prevented,
            use_frequency_by_item=dict(use_counts),
            action_spend=action_spend,
            games_detail=detail,
        )

    def game_to_dict(self, game: GameResult) -> Dict[str, Any]:
        return {
            "variant_name": game.variant_name,
            "seed": game.seed,
            "game_index": game.game_index,
            "roster": list(game.roster),
            "rounds_played": game.rounds_played,
            "end_reason": game.end_reason,
            "shared_rescue": game.shared_rescue,
            "survivors": game.survivors,
            "winner_player": game.winner_player,
            "winner_profile": game.winner_profile,
            "player_results": copy.deepcopy(game.player_results),
            "zone_visits": dict(game.zone_visits),
            "recipe_crafts": dict(game.recipe_crafts),
            "use_counts": dict(game.use_counts),
            "action_counts": dict(game.action_counts),
            "hazard_triggers": game.hazard_triggers,
            "hazard_prevented": game.hazard_prevented,
            "raw_food_consumption": game.raw_food_consumption,
            "unsafe_water_consumption": game.unsafe_water_consumption,
            "engine_firsts": dict(game.engine_firsts),
        }
