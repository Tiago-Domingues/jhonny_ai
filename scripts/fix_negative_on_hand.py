"""Report and clear negative on-hand stock in Odoo.

Negative on-hand quantities are a data problem: a stockable location can never
hold less than zero units. They build up when sales (POS, deliveries) are
registered for products that were never received. This script lists every
negative quant in stockable locations and, with --apply, raises each one back to
the target quantity (0 by default) through a regular Odoo inventory adjustment,
so the correction is traceable as a stock move.

Dry run (no writes):
    python3 scripts/fix_negative_on_hand.py

Apply the correction:
    python3 scripts/fix_negative_on_hand.py --apply
"""

from __future__ import annotations

import argparse
import sys
import xmlrpc.client
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.odoo_client import OdooClient, OdooConfig, load_env

STOCKABLE_USAGES = ["internal", "transit"]
QUANT_FIELDS = [
    "product_id",
    "location_id",
    "lot_id",
    "quantity",
    "reserved_quantity",
    "available_quantity",
    "company_id",
]
DEFAULT_INVENTORY_NAME = "Negative on-hand cleanup"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the inventory adjustments (default is a read-only dry run)",
    )
    parser.add_argument(
        "--target",
        type=float,
        default=0.0,
        help="quantity each negative quant is raised to (default: 0)",
    )
    parser.add_argument(
        "--location",
        help="only touch locations whose complete name contains this text (e.g. CAR/Stock)",
    )
    parser.add_argument(
        "--product",
        help="only touch products whose name or internal reference contains this text",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1000,
        help="maximum number of quants to read and adjust (default: 1000)",
    )
    parser.add_argument(
        "--max-units",
        type=float,
        default=1000.0,
        help="refuse to apply when the total correction exceeds this many units (default: 1000)",
    )
    parser.add_argument(
        "--inventory-name",
        default=DEFAULT_INVENTORY_NAME,
        help=f"reference recorded on the adjustment moves (default: {DEFAULT_INVENTORY_NAME!r})",
    )
    return parser.parse_args(argv)


def build_domain(args: argparse.Namespace) -> list[Any]:
    domain: list[Any] = [
        ["location_id.usage", "in", STOCKABLE_USAGES],
        ["quantity", "<", args.target],
    ]
    if args.location:
        domain.append(["location_id.complete_name", "ilike", args.location])
    if args.product:
        domain.append(["product_id", "ilike", args.product])
    return domain


def label(value: Any, fallback: str = "-") -> str:
    if isinstance(value, list) and len(value) > 1:
        return str(value[1])
    return fallback


def read_negative_quants(client: OdooClient, args: argparse.Namespace) -> list[dict[str, Any]]:
    return client.search_read(
        "stock.quant",
        domain=build_domain(args),
        fields=QUANT_FIELDS,
        limit=args.limit,
        order="quantity asc, id asc",
    )


def print_report(quants: list[dict[str, Any]], target: float) -> None:
    print(f"Negative on-hand quants in stockable locations: {len(quants)}")
    if not quants:
        return

    units = sum(float(quant["quantity"]) for quant in quants)
    print(f"Total negative units: {units:.2f} (correction to {target:g}: {target * len(quants) - units:+.2f})")

    by_location: dict[str, list[float]] = {}
    for quant in quants:
        bucket = by_location.setdefault(label(quant["location_id"]), [0.0, 0.0])
        bucket[0] += 1
        bucket[1] += float(quant["quantity"])
    print("\nBy location:")
    for location, (count, total) in sorted(by_location.items(), key=lambda item: item[1][1]):
        print(f"- {location}: {int(count)} quants, {total:.2f} units")

    reserved = [quant for quant in quants if float(quant["reserved_quantity"])]
    print("\nQuants (worst first):")
    for quant in quants:
        print(
            f"- quant {quant['id']} | {label(quant['product_id'])} | "
            f"{label(quant['location_id'])} | qty={float(quant['quantity']):.2f} | "
            f"reserved={float(quant['reserved_quantity']):.2f} | lot={label(quant['lot_id'], 'none')}"
        )
    if reserved:
        print(f"\nWarning: {len(reserved)} negative quants carry reservations; review them manually.")


def call_void(client: OdooClient, method: str, quant_id: int, context: dict[str, Any]) -> None:
    """Call a stock.quant action that returns nothing.

    Odoo's XML-RPC layer cannot serialise None, so these actions raise a Fault
    on the way back even when they succeeded. Only that response-encoding fault
    is swallowed; the caller still verifies the resulting quantities.
    """
    try:
        client.execute_kw("stock.quant", method, [[quant_id]], {"context": context})
    except xmlrpc.client.Fault as fault:
        if "cannot marshal None" not in str(fault):
            raise


def apply_target(client: OdooClient, quant: dict[str, Any], args: argparse.Namespace) -> None:
    """Raise one quant to the target quantity via an Odoo inventory adjustment.

    Counting then applying (rather than writing inventory_quantity_auto_apply)
    is what lets --inventory-name land on the generated stock move, so the
    correction is identifiable in Odoo's move history.
    """
    context = {"inventory_mode": True, "inventory_name": args.inventory_name}
    try:
        client.execute_kw(
            "stock.quant",
            "write",
            [[quant["id"]], {"inventory_quantity": args.target}],
            {"context": context},
        )
        call_void(client, "action_apply_inventory", quant["id"], context)
    except Exception:
        # Leave no half-counted quant behind for the next person opening Odoo.
        try:
            call_void(client, "action_clear_inventory_quantity", quant["id"], context)
        except Exception:
            pass
        raise


def verify(client: OdooClient, quants: list[dict[str, Any]], target: float) -> list[dict[str, Any]]:
    ids = [quant["id"] for quant in quants]
    rows = client.execute_kw(
        "stock.quant",
        "read",
        [ids, ["product_id", "location_id", "quantity"]],
    )
    return [row for row in rows if float(row["quantity"]) < target]


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    load_env(ROOT / ".env")

    client = OdooClient(OdooConfig.from_env())
    client.authenticate()

    quants = read_negative_quants(client, args)
    print_report(quants, args.target)
    if not quants:
        print("\nNothing to fix.")
        return 0

    correction = args.target * len(quants) - sum(float(quant["quantity"]) for quant in quants)
    if not args.apply:
        print(f"\nDry run: no changes written. Re-run with --apply to adjust {len(quants)} quants.")
        return 0

    if correction > args.max_units:
        print(
            f"\nAborted: the correction of {correction:.2f} units exceeds --max-units "
            f"({args.max_units:g}). Raise the cap or narrow the selection with "
            "--location/--product/--limit."
        )
        return 1

    print(f"\nApplying inventory adjustments to {len(quants)} quants ({args.inventory_name!r})...")
    failures: list[tuple[int, str]] = []
    for index, quant in enumerate(quants, start=1):
        try:
            apply_target(client, quant, args)
        except Exception as exc:  # keep going so one bad product cannot stall the cleanup
            failures.append((quant["id"], f"{exc.__class__.__name__}: {exc}"))
            print(f"[{index}/{len(quants)}] quant {quant['id']} FAILED: {exc.__class__.__name__}")
            continue
        print(
            f"[{index}/{len(quants)}] {label(quant['product_id'])} @ {label(quant['location_id'])}: "
            f"{float(quant['quantity']):.2f} -> {args.target:g}"
        )

    remaining = verify(client, quants, args.target)
    print(f"\nAdjusted: {len(quants) - len(failures)} | failed: {len(failures)} | still negative: {len(remaining)}")
    for quant_id, message in failures:
        print(f"- quant {quant_id}: {message}")
    for row in remaining:
        print(
            f"- still negative: quant {row['id']} | {label(row['product_id'])} | "
            f"{label(row['location_id'])} | qty={float(row['quantity']):.2f}"
        )

    left = client.search_count("stock.quant", build_domain(args))
    print(f"Negative on-hand quants left matching this selection: {left}")
    return 1 if failures or remaining else 0


if __name__ == "__main__":
    raise SystemExit(main())
