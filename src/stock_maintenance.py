from __future__ import annotations

from typing import Any, Iterable, Iterator

from src.odoo_client import OdooClient


ON_HAND_FIELD = "qty_available"
QUANT_QUANTITY_FIELD = "quantity"

# Only internal and transit stock feeds the on-hand quantity, and those are the
# usages Odoo lets an inventory adjustment touch.
ADJUSTABLE_LOCATION_USAGES = ("internal", "transit")

# Odoo ignores counted quantities unless the caller opts into inventory mode,
# the same context the Physical Inventory screen uses.
INVENTORY_CONTEXT = {"inventory_mode": True}

# action_apply_inventory() otherwise returns a conflict/tracking wizard instead
# of applying anything, which would leave the stock untouched with no error.
APPLY_CONTEXT = {**INVENTORY_CONTEXT, "set_inventory_quantity_auto_apply": True}

DEFAULT_BATCH_SIZE = 200


def _batched(values: list[int], size: int) -> Iterator[list[int]]:
    step = max(1, size)
    for start in range(0, len(values), step):
        yield values[start : start + step]


def _many2one_id(value: Any) -> int | None:
    if isinstance(value, list) and value:
        return int(value[0])
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return int(value)
    return None


def _many2one_name(value: Any, fallback: str = "Unknown") -> str:
    if isinstance(value, list) and len(value) > 1:
        return str(value[1])
    return fallback


def _product_label(row: dict[str, Any]) -> str:
    sku = row.get("default_code")
    name = str(row.get("name") or "").strip()
    if sku and sku is not True:
        return f"[{sku}] {name}".strip()
    return name


class NegativeOnHandFixer:
    """Zero out negative on-hand ("Em mão") stock in Odoo via inventory adjustments.

    `qty_available` is computed from `stock.quant`, so it cannot be written
    directly. The only supported way to raise a negative on-hand value is to
    count the quant at 0 and apply the adjustment, which is what the Physical
    Inventory screen does and which leaves an auditable stock move behind.
    """

    def __init__(
        self,
        client: OdooClient,
        batch_size: int = DEFAULT_BATCH_SIZE,
        location_usages: Iterable[str] = ADJUSTABLE_LOCATION_USAGES,
    ) -> None:
        self.client = client
        self.batch_size = batch_size
        self.location_usages = list(location_usages)

    def _search_read(
        self,
        model: str,
        domain: list[Any],
        fields: list[str],
        limit: int = 0,
        context: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        kwargs: dict[str, Any] = {"fields": fields}
        if limit and limit > 0:
            kwargs["limit"] = limit
        if context:
            kwargs["context"] = context
        return self.client.execute_kw(model, "search_read", [domain], kwargs) or []

    def on_hand_labels(self) -> dict[str, str]:
        """Read the translated field labels, to confirm we target the right column."""
        labels: dict[str, str] = {}
        for model, field in (("product.product", ON_HAND_FIELD), ("stock.quant", QUANT_QUANTITY_FIELD)):
            try:
                described = self.client.execute_kw(
                    model, "fields_get", [[field]], {"attributes": ["string"]}
                )
                labels[f"{model}.{field}"] = str((described or {}).get(field, {}).get("string") or "")
            except Exception as exc:  # label check must never block the fix
                labels[f"{model}.{field}"] = f"unavailable ({exc.__class__.__name__})"
        return labels

    def negative_products(self, limit: int = 0) -> list[dict[str, Any]]:
        rows = self._search_read(
            "product.product",
            [[ON_HAND_FIELD, "<", 0]],
            ["default_code", "name", ON_HAND_FIELD, "active"],
            limit=limit,
            context={"active_test": False},
        )
        return [
            {
                "id": int(row["id"]),
                "label": _product_label(row),
                "on_hand": float(row.get(ON_HAND_FIELD) or 0),
                "active": bool(row.get("active", True)),
            }
            for row in rows
        ]

    def negative_quants(
        self, product_ids: list[int] | None = None, limit: int = 0
    ) -> list[dict[str, Any]]:
        domain: list[Any] = [
            [QUANT_QUANTITY_FIELD, "<", 0],
            ["location_id.usage", "in", self.location_usages],
        ]
        if product_ids is not None:
            domain.append(["product_id", "in", product_ids])

        rows = self._search_read(
            "stock.quant",
            domain,
            ["product_id", "location_id", "lot_id", QUANT_QUANTITY_FIELD],
            limit=limit,
            context={"active_test": False},
        )
        return [
            {
                "id": int(row["id"]),
                "product_id": _many2one_id(row.get("product_id")),
                "product": _many2one_name(row.get("product_id")),
                "location": _many2one_name(row.get("location_id")),
                "lot": _many2one_name(row.get("lot_id"), fallback=""),
                "quantity": float(row.get(QUANT_QUANTITY_FIELD) or 0),
            }
            for row in rows
        ]

    def build_plan(self, only_negative_products: bool = False, limit: int = 0) -> dict[str, Any]:
        products = self.negative_products()

        if only_negative_products:
            product_ids = [product["id"] for product in products]
            quants = self.negative_quants(product_ids=product_ids, limit=limit) if product_ids else []
        else:
            quants = self.negative_quants(limit=limit)

        covered_products = {quant["product_id"] for quant in quants}
        blocked = [product for product in products if product["id"] not in covered_products]

        return {
            "labels": self.on_hand_labels(),
            "negative_products_before": products,
            "quants_to_zero": quants,
            "units_to_add": round(sum(-quant["quantity"] for quant in quants), 2),
            "products_without_adjustable_quant": blocked,
        }

    def _count_at_zero(self, quant_ids: list[int]) -> None:
        """Count the stock at zero and let Odoo apply the adjustment in one write."""
        self.client.execute_kw(
            "stock.quant",
            "write",
            [quant_ids, {"inventory_quantity_auto_apply": 0.0}],
            {"context": INVENTORY_CONTEXT},
        )

    def _count_then_apply(self, quant_ids: list[int]) -> None:
        """Two-step form of the same adjustment, for anything the one-shot write misses."""
        self.client.execute_kw(
            "stock.quant",
            "write",
            [quant_ids, {"inventory_quantity": 0.0, "inventory_quantity_set": True}],
            {"context": INVENTORY_CONTEXT},
        )
        self.client.execute_kw(
            "stock.quant",
            "action_apply_inventory",
            [quant_ids],
            {"context": APPLY_CONTEXT},
        )

    def _quantities(self, quant_ids: list[int]) -> dict[int, float]:
        rows = self._search_read(
            "stock.quant",
            [["id", "in", quant_ids]],
            [QUANT_QUANTITY_FIELD],
            context={"active_test": False},
        )
        return {int(row["id"]): float(row.get(QUANT_QUANTITY_FIELD) or 0) for row in rows}

    def _still_negative(self, quant_ids: list[int]) -> list[int]:
        # Odoo deletes quants once they reach zero, so a missing row means success.
        quantities = self._quantities(quant_ids)
        return [quant_id for quant_id in quant_ids if quantities.get(quant_id, 0.0) < 0]

    def _fix_batch(self, quant_ids: list[int]) -> tuple[list[int], dict[int, str]]:
        errors: dict[int, str] = {}
        remaining = list(quant_ids)

        for strategy in (self._count_at_zero, self._count_then_apply):
            if not remaining:
                break
            try:
                strategy(remaining)
            except Exception as exc:
                # A single rejected quant must not discard the rest of the batch.
                for quant_id in remaining:
                    errors[quant_id] = f"{exc.__class__.__name__}: {exc}"
                    try:
                        strategy([quant_id])
                        errors.pop(quant_id, None)
                    except Exception as single_exc:
                        errors[quant_id] = f"{single_exc.__class__.__name__}: {single_exc}"
            # Never trust the write: Odoo silently skips counted quantities when
            # the user lacks inventory rights.
            remaining = self._still_negative(remaining)

        fixed = [quant_id for quant_id in quant_ids if quant_id not in set(remaining)]
        return fixed, {quant_id: errors.get(quant_id, "still negative after the adjustment") for quant_id in remaining}

    def apply(self, plan: dict[str, Any]) -> dict[str, Any]:
        by_id = {quant["id"]: quant for quant in plan["quants_to_zero"]}
        applied: list[int] = []
        failures: list[dict[str, Any]] = []

        for batch in _batched(list(by_id), self.batch_size):
            fixed, errors = self._fix_batch(batch)
            applied.extend(fixed)
            for quant_id, error in errors.items():
                quant = by_id[quant_id]
                failures.append(
                    {
                        "quant_id": quant_id,
                        "product": quant["product"],
                        "location": quant["location"],
                        "quantity": quant["quantity"],
                        "error": error,
                    }
                )

        return {
            "quants_applied": len(applied),
            "units_added": round(sum(-by_id[quant_id]["quantity"] for quant_id in applied), 2),
            "failures": failures,
        }

    def verify(self) -> dict[str, Any]:
        products = self.negative_products()
        quants = self.negative_quants()
        return {
            "negative_products_after": products,
            "negative_quants_after": quants,
            "all_products_non_negative": not products,
        }

    def run(self, apply_changes: bool, only_negative_products: bool = False, limit: int = 0) -> dict[str, Any]:
        plan = self.build_plan(only_negative_products=only_negative_products, limit=limit)
        report: dict[str, Any] = {
            "mode": "apply" if apply_changes else "dry_run",
            "labels": plan["labels"],
            "negative_products_before": plan["negative_products_before"],
            "negative_quants_found": len(plan["quants_to_zero"]),
            "quants_to_zero": plan["quants_to_zero"],
            "units_to_add": plan["units_to_add"],
            "products_without_adjustable_quant": plan["products_without_adjustable_quant"],
        }

        if not apply_changes:
            return report

        report.update(self.apply(plan))
        report.update(self.verify())
        return report
