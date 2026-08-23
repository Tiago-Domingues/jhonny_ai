"""Offline checks for the negative on-hand ("Em mão") fixer.

Runs against a fake Odoo XML-RPC layer that mimics the parts of the real ORM
this fix depends on: qty_available computed from stock.quant, inventory-mode
writes, and action_apply_inventory. No Odoo or OpenAI credentials needed.

    python3 scripts/evaluate_stock_maintenance.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.stock_maintenance import NegativeOnHandFixer  # noqa: E402


ON_HAND_USAGES = ("internal", "transit")


class FakeOdooError(RuntimeError):
    pass


class FakeOdoo:
    """Minimal stand-in for the Odoo models endpoint used by the fixer."""

    def __init__(
        self,
        products: dict[int, dict[str, Any]],
        locations: dict[int, dict[str, Any]],
        quants: list[dict[str, Any]],
        locked_quant_ids: tuple[int, ...] = (),
        auto_apply_supported: bool = True,
        inventory_mode_honored: bool = True,
        has_stock_rights: bool = True,
        delete_zero_quants: bool = False,
    ) -> None:
        self.products = products
        self.locations = locations
        self.quants = {quant["id"]: dict(quant) for quant in quants}
        self.locked_quant_ids = set(locked_quant_ids)
        self.auto_apply_supported = auto_apply_supported
        self.inventory_mode_honored = inventory_mode_honored
        self.has_stock_rights = has_stock_rights
        self.delete_zero_quants = delete_zero_quants
        self.calls: list[tuple[str, str, int]] = []
        self.applied_moves: list[dict[str, Any]] = []

    # --- helpers -----------------------------------------------------------
    def qty_available(self, product_id: int) -> float:
        total = 0.0
        for quant in self.quants.values():
            if quant["product_id"] != product_id:
                continue
            if self.locations[quant["location_id"]]["usage"] not in ON_HAND_USAGES:
                continue
            total += quant["quantity"]
        return round(total, 2)

    def is_outdated(self, quant: dict[str, Any]) -> bool:
        """Mirrors stock.quant._compute_is_outdated: stock moved since the count."""
        if not quant.get("inventory_quantity_set"):
            return False
        counted = quant.get("inventory_quantity", 0.0)
        diff = quant.get("inventory_diff_quantity", 0.0)
        return round(counted - diff, 2) != round(quant["quantity"], 2)

    def _apply_quant(self, quant: dict[str, Any]) -> None:
        counted = quant.get("inventory_quantity", 0.0)
        self.applied_moves.append({"quant_id": quant["id"], "delta": round(counted - quant["quantity"], 2)})
        quant["quantity"] = counted
        quant["inventory_quantity"] = 0.0
        quant["inventory_quantity_set"] = False
        quant["inventory_diff_quantity"] = 0.0
        if self.delete_zero_quants and quant["quantity"] == 0:
            self.quants.pop(quant["id"], None)

    def _quant_record(self, quant: dict[str, Any]) -> dict[str, Any]:
        location = self.locations[quant["location_id"]]
        product = self.products[quant["product_id"]]
        lot_id = quant.get("lot_id")
        return {
            "id": quant["id"],
            "quantity": quant["quantity"],
            "product_id": [quant["product_id"], product["name"]],
            "location_id": [quant["location_id"], location["name"]],
            "lot_id": [lot_id, f"LOT{lot_id}"] if lot_id else False,
            "location_id.usage": location["usage"],
        }

    def _product_record(self, product_id: int) -> dict[str, Any]:
        product = self.products[product_id]
        return {
            "id": product_id,
            "default_code": product.get("default_code") or False,
            "name": product["name"],
            "active": product.get("active", True),
            "qty_available": self.qty_available(product_id),
        }

    @staticmethod
    def _matches(record: dict[str, Any], domain: list[Any]) -> bool:
        for field, operator, value in domain:
            actual = record.get(field)
            if isinstance(actual, list) and actual:
                # Odoo compares many2one fields by id, not by (id, name).
                actual = actual[0]
            if operator == "<" and not (actual < value):
                return False
            if operator == "=" and actual != value:
                return False
            if operator == "in" and actual not in value:
                return False
        return True

    # --- XML-RPC surface ---------------------------------------------------
    def execute_kw(
        self,
        model: str,
        method: str,
        args: list[Any] | None = None,
        kwargs: dict[str, Any] | None = None,
    ) -> Any:
        args = args or []
        kwargs = kwargs or {}
        self.calls.append((model, method, len(args[0]) if args and isinstance(args[0], list) else 0))

        if method == "fields_get":
            labels = {
                "product.product": {"qty_available": {"string": "Em mão"}},
                "stock.quant": {"quantity": {"string": "Em mão"}},
            }
            return labels[model]

        if method == "search_read":
            domain = args[0]
            if model == "product.product":
                records = [self._product_record(pid) for pid in sorted(self.products)]
            else:
                records = [self._quant_record(quant) for quant in self.quants.values()]
            matched = [record for record in records if self._matches(record, domain)]
            limit = kwargs.get("limit")
            if limit:
                matched = matched[:limit]
            fields = kwargs.get("fields") or []
            return [
                {key: value for key, value in record.items() if key in {*fields, "id"}}
                for record in matched
            ]

        if model == "stock.quant" and method == "write":
            quant_ids, values = args[0], args[1]
            context = kwargs.get("context") or {}
            if not self.has_stock_rights:
                raise FakeOdooError("AccessError: not allowed to modify stock.quant")
            if "inventory_quantity_auto_apply" in values and not self.auto_apply_supported:
                raise FakeOdooError("inventory_quantity_auto_apply is not writable here")

            for quant_id in quant_ids:
                quant = self.quants[quant_id]
                usage = self.locations[quant["location_id"]]["usage"]
                if usage in {"inventory", "view"}:
                    raise FakeOdooError(f"cannot adjust a {usage} location")
                if quant_id in self.locked_quant_ids:
                    raise FakeOdooError("quant is locked by another user")

                if "inventory_quantity_auto_apply" in values:
                    # stock.quant._set_inventory_quantity returns without doing
                    # anything when the user is not in inventory mode.
                    if not (context.get("inventory_mode") and self.inventory_mode_honored):
                        continue
                    quant["inventory_quantity"] = values["inventory_quantity_auto_apply"]
                    quant["inventory_quantity_set"] = True
                    quant["inventory_diff_quantity"] = round(
                        quant["inventory_quantity"] - quant["quantity"], 2
                    )
                    self._apply_quant(quant)
                    continue

                previous_count = quant.get("inventory_quantity", 0.0)
                quant.update(values)
                # inventory_diff_quantity is a stored compute on inventory_quantity,
                # so re-writing the same counted value leaves a stale difference.
                if values.get("inventory_quantity", previous_count) != previous_count:
                    quant["inventory_diff_quantity"] = round(
                        quant["inventory_quantity"] - quant["quantity"], 2
                    )
            return True

        if model == "stock.quant" and method == "action_apply_inventory":
            context = kwargs.get("context") or {}
            quants = [self.quants[quant_id] for quant_id in args[0]]
            if not context.get("set_inventory_quantity_auto_apply"):
                # Odoo returns a wizard action and applies nothing at all.
                if any(self.is_outdated(quant) for quant in quants):
                    return {"res_model": "stock.inventory.conflict", "type": "ir.actions.act_window"}
            for quant in quants:
                if not quant.get("inventory_quantity_set"):
                    raise FakeOdooError("no counted quantity set")
                self._apply_quant(quant)
            return True

        raise AssertionError(f"unexpected call {model}.{method}")

    def write_calls(self) -> int:
        return len([call for call in self.calls if call[1] == "write"])

    def apply_calls(self) -> int:
        return len([call for call in self.calls if call[1] == "action_apply_inventory"])


LOCATIONS = {
    1: {"name": "WH/Stock", "usage": "internal"},
    2: {"name": "WH/Shop", "usage": "internal"},
    3: {"name": "WH/Transit", "usage": "transit"},
    4: {"name": "Virtual/Customers", "usage": "customer"},
}

PRODUCTS = {
    10: {"default_code": "WET-01", "name": "Wetsuit 3/2"},
    11: {"default_code": "BRD-01", "name": "Shortboard 6'0"},
    12: {"default_code": "LSH-01", "name": "Leash 6ft"},
    13: {"default_code": "WAX-01", "name": "Surf Wax"},
    14: {"default_code": "FIN-01", "name": "Fins", "active": False},
}


def sample_quants() -> list[dict[str, Any]]:
    return [
        # Negative single-location product.
        {"id": 100, "product_id": 10, "location_id": 1, "quantity": -5.0},
        # Positive overall, but one negative location line.
        {"id": 101, "product_id": 11, "location_id": 1, "quantity": 8.0},
        {"id": 102, "product_id": 11, "location_id": 2, "quantity": -3.0},
        # Negative overall, spread across two locations.
        {"id": 103, "product_id": 12, "location_id": 1, "quantity": -4.0},
        {"id": 104, "product_id": 12, "location_id": 2, "quantity": 1.0},
        # Healthy product that must not be touched.
        {"id": 105, "product_id": 13, "location_id": 1, "quantity": 12.0},
        # Archived product with negative stock, and a lot-tracked negative line.
        {"id": 106, "product_id": 14, "location_id": 1, "quantity": -2.0, "lot_id": 7},
        # Sold-to-customer line: negative but never an on-hand value.
        {"id": 107, "product_id": 13, "location_id": 4, "quantity": -30.0},
    ]


def assert_equal(actual: Any, expected: Any, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def negative_products(fake: FakeOdoo) -> dict[str, float]:
    return {
        fake.products[pid]["name"]: fake.qty_available(pid)
        for pid in sorted(fake.products)
        if fake.qty_available(pid) < 0
    }


def check_dry_run() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants())
    report = NegativeOnHandFixer(fake).run(apply_changes=False)

    assert_equal(report["mode"], "dry_run", "dry run mode")
    assert_equal(report["labels"]["product.product.qty_available"], "Em mão", "product label")
    assert_equal(report["labels"]["stock.quant.quantity"], "Em mão", "quant label")
    assert_equal(
        {product["label"] for product in report["negative_products_before"]},
        {"[WET-01] Wetsuit 3/2", "[LSH-01] Leash 6ft", "[FIN-01] Fins"},
        "negative products found",
    )
    assert_equal(report["negative_quants_found"], 4, "negative quants found")
    assert_equal(report["units_to_add"], 14.0, "units to add")
    assert_equal(
        {quant["id"] for quant in report["quants_to_zero"]},
        {100, 102, 103, 106},
        "quant ids planned",
    )
    assert_equal(report["products_without_adjustable_quant"], [], "no blocked products")
    assert_equal(fake.write_calls(), 0, "dry run writes")
    assert_equal(fake.apply_calls(), 0, "dry run applies")
    assert_equal(negative_products(fake), {"Wetsuit 3/2": -5.0, "Leash 6ft": -3.0, "Fins": -2.0}, "data untouched")
    print("dry run: 4 negative stock lines detected, nothing written")


def check_apply() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants())
    report = NegativeOnHandFixer(fake).run(apply_changes=True)

    assert_equal(report["quants_applied"], 4, "quants applied")
    assert_equal(report["units_added"], 14.0, "units added")
    assert_equal(report["failures"], [], "failures")
    assert_equal(report["all_products_non_negative"], True, "all products non negative")
    assert_equal(report["negative_products_after"], [], "no negative products left")
    assert_equal(report["negative_quants_after"], [], "no negative quants left")

    assert_equal(negative_products(fake), {}, "stored on-hand values")
    assert_equal(fake.quants[100]["quantity"], 0.0, "wetsuit quant")
    assert_equal(fake.quants[102]["quantity"], 0.0, "board negative line")
    assert_equal(fake.quants[101]["quantity"], 8.0, "board positive line untouched")
    assert_equal(fake.quants[105]["quantity"], 12.0, "healthy product untouched")
    assert_equal(fake.quants[107]["quantity"], -30.0, "customer location untouched")
    assert_equal(fake.qty_available(11), 8.0, "board total")
    assert_equal(fake.qty_available(12), 1.0, "leash total")
    assert_equal(
        sorted(move["delta"] for move in fake.applied_moves),
        [2.0, 3.0, 4.0, 5.0],
        "inventory adjustment moves",
    )
    print("apply: 4 lines zeroed, +14 units, every product now >= 0")


def check_idempotent() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants())
    fixer = NegativeOnHandFixer(fake)
    fixer.run(apply_changes=True)
    second = fixer.run(apply_changes=True)

    assert_equal(second["negative_quants_found"], 0, "second pass quants")
    assert_equal(second["negative_products_before"], [], "second pass products")
    assert_equal(second["all_products_non_negative"], True, "second pass verified")
    print("idempotent: a second run finds nothing to change")


def check_only_negative_products() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants())
    report = NegativeOnHandFixer(fake).run(apply_changes=True, only_negative_products=True)

    assert_equal(report["quants_applied"], 3, "quants applied")
    assert_equal({quant["id"] for quant in report["quants_to_zero"]}, {100, 103, 106}, "quant ids")
    assert_equal(fake.quants[102]["quantity"], -3.0, "positive-total product keeps its negative line")
    assert_equal(report["all_products_non_negative"], True, "all products non negative")
    print("only-negative-products: 3 lines zeroed, product-level totals all >= 0")


def check_unadjustable_location() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, [{"id": 200, "product_id": 10, "location_id": 3, "quantity": -6.0}])
    fixer = NegativeOnHandFixer(fake, location_usages=("internal",))
    report = fixer.run(apply_changes=True)

    assert_equal(report["quants_applied"], 0, "nothing applied")
    assert_equal(
        [product["label"] for product in report["products_without_adjustable_quant"]],
        ["[WET-01] Wetsuit 3/2"],
        "blocked product reported",
    )
    assert_equal(report["all_products_non_negative"], False, "still negative")
    print("unreachable stock: negative product reported instead of silently skipped")


def check_failure_isolation() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants(), locked_quant_ids=(103,))
    report = NegativeOnHandFixer(fake).run(apply_changes=True)

    assert_equal(report["quants_applied"], 3, "quants applied around the failure")
    assert_equal([failure["quant_id"] for failure in report["failures"]], [103], "failure recorded")
    assert_equal(fake.quants[100]["quantity"], 0.0, "other lines still fixed")
    assert_equal(report["all_products_non_negative"], False, "locked product still negative")
    print("failure isolation: one locked line fails, the other 3 still get fixed")


def check_silent_no_op_is_caught() -> None:
    # A user without inventory rights makes Odoo skip counted quantities without
    # raising, so the one-shot write reports success while nothing changes.
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants(), inventory_mode_honored=False)
    report = NegativeOnHandFixer(fake).run(apply_changes=True)

    assert_equal(report["quants_applied"], 4, "quants applied via the fallback")
    assert_equal(report["failures"], [], "no failures")
    assert_equal(report["all_products_non_negative"], True, "all products non negative")
    assert_equal(fake.apply_calls(), 1, "fallback applied the adjustment explicitly")
    print("silent no-op: ignored write is detected and fixed by the explicit fallback")


def check_conflict_wizard_bypass() -> None:
    # A count entered earlier, with stock moved since: Odoo treats the line as
    # outdated and action_apply_inventory returns a wizard instead of applying.
    stale = [
        {
            "id": 400,
            "product_id": 10,
            "location_id": 1,
            "quantity": -5.0,
            "inventory_quantity": 0.0,
            "inventory_quantity_set": True,
            "inventory_diff_quantity": 0.0,
        }
    ]

    trap = FakeOdoo(PRODUCTS, LOCATIONS, stale)
    assert trap.is_outdated(trap.quants[400]), "the stale line should read as outdated"
    wizard = trap.execute_kw("stock.quant", "action_apply_inventory", [[400]], {"context": {"inventory_mode": True}})
    assert_equal(wizard.get("res_model"), "stock.inventory.conflict", "unguarded apply returns a wizard")
    assert_equal(trap.quants[400]["quantity"], -5.0, "unguarded apply changes nothing")

    fake = FakeOdoo(PRODUCTS, LOCATIONS, stale, auto_apply_supported=False)
    report = NegativeOnHandFixer(fake).run(apply_changes=True)
    assert_equal(report["quants_applied"], 1, "stale line applied")
    assert_equal(fake.quants[400]["quantity"], 0.0, "stale line is now zero")
    assert_equal(report["all_products_non_negative"], True, "all products non negative")
    print("conflict wizard: outdated line is applied instead of silently skipped")


def check_missing_stock_rights() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants(), has_stock_rights=False)
    report = NegativeOnHandFixer(fake).run(apply_changes=True)

    assert_equal(report["quants_applied"], 0, "nothing applied")
    assert_equal(len(report["failures"]), 4, "every line reported as failed")
    assert "AccessError" in report["failures"][0]["error"], report["failures"][0]["error"]
    assert_equal(report["all_products_non_negative"], False, "still negative")
    print("no rights: all 4 lines reported as failures instead of a false success")


def check_zero_quants_deleted() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants(), delete_zero_quants=True)
    report = NegativeOnHandFixer(fake).run(apply_changes=True)

    assert_equal(report["quants_applied"], 4, "quants applied")
    assert_equal(report["failures"], [], "no failures")
    assert_equal(100 in fake.quants, False, "zeroed line was cleaned up by Odoo")
    assert_equal(report["all_products_non_negative"], True, "all products non negative")
    print("cleanup: lines Odoo deletes at zero count as fixed, not as failures")


def check_batching() -> None:
    quants = [
        {"id": 300 + index, "product_id": 10, "location_id": 1, "quantity": -1.0}
        for index in range(250)
    ]
    fake = FakeOdoo(PRODUCTS, LOCATIONS, quants)
    report = NegativeOnHandFixer(fake, batch_size=100).run(apply_changes=True)

    assert_equal(report["quants_applied"], 250, "all quants applied")
    assert_equal(fake.write_calls(), 3, "write batches")
    assert_equal(fake.apply_calls(), 0, "no fallback needed")
    assert_equal(report["all_products_non_negative"], True, "all products non negative")
    print("batching: 250 lines fixed in 3 batched writes")


def check_limit() -> None:
    fake = FakeOdoo(PRODUCTS, LOCATIONS, sample_quants())
    report = NegativeOnHandFixer(fake).run(apply_changes=True, limit=2)

    assert_equal(report["quants_applied"], 2, "limited apply")
    assert_equal(report["all_products_non_negative"], False, "limit leaves work behind")
    print("limit: only the first 2 lines are touched")


def main() -> None:
    check_dry_run()
    check_apply()
    check_idempotent()
    check_only_negative_products()
    check_unadjustable_location()
    check_failure_isolation()
    check_silent_no_op_is_caught()
    check_conflict_wizard_bypass()
    check_missing_stock_rights()
    check_zero_quants_deleted()
    check_batching()
    check_limit()
    print("\nstock maintenance checks ok")


if __name__ == "__main__":
    main()
