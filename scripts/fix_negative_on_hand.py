"""Set every negative Odoo on-hand ("Em mão") quantity to zero.

Dry run (no writes, prints what would change):
    python3 scripts/fix_negative_on_hand.py

Apply the fix:
    python3 scripts/fix_negative_on_hand.py --apply

Needs real ODOO_URL / ODOO_DB / ODOO_USERNAME / ODOO_API_KEY in .env or the
environment. The Odoo user needs Inventory access (stock.group_stock_user, i.e.
Inventory > User or Administrator); without it Odoo ignores counted quantities
and the run reports every line as failed rather than pretending to succeed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.odoo_client import OdooClient, OdooConfig, load_env  # noqa: E402
from src.stock_maintenance import NegativeOnHandFixer  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the changes to Odoo (without this flag nothing is modified)",
    )
    parser.add_argument(
        "--only-negative-products",
        action="store_true",
        help="only fix products whose total on-hand is negative, leaving negative "
        "single-location quants on products that already total zero or more",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="cap how many quants are touched (0 means no cap)",
    )
    parser.add_argument("--json", action="store_true", help="print the raw report as JSON")
    return parser.parse_args()


def print_report(report: dict[str, Any]) -> None:
    print(f"Mode: {report['mode']}")
    for field, label in report["labels"].items():
        print(f"On-hand field {field} is labelled {label!r}")

    before = report["negative_products_before"]
    print(f"\nProducts with negative on-hand: {len(before)}")
    for product in before[:50]:
        suffix = "" if product["active"] else " (archived)"
        print(f"- {product['label']}{suffix}: {product['on_hand']}")
    if len(before) > 50:
        print(f"... and {len(before) - 50} more")

    quants = report["quants_to_zero"]
    print(f"\nNegative stock lines to set to zero: {len(quants)} ({report['units_to_add']} units added)")
    for quant in quants[:50]:
        lot = f" lot {quant['lot']}" if quant["lot"] else ""
        print(f"- {quant['product']} @ {quant['location']}{lot}: {quant['quantity']} -> 0")
    if len(quants) > 50:
        print(f"... and {len(quants) - 50} more")

    blocked = report["products_without_adjustable_quant"]
    if blocked:
        print(f"\nNegative products with no adjustable stock line: {len(blocked)}")
        for product in blocked:
            print(f"- {product['label']}: {product['on_hand']}")

    if report["mode"] == "dry_run":
        print("\nNothing was changed. Re-run with --apply to write these adjustments.")
        return

    print(f"\nStock lines adjusted: {report['quants_applied']} ({report['units_added']} units added)")
    for failure in report["failures"]:
        print(f"- FAILED {failure['product']} @ {failure['location']}: {failure['error']}")

    remaining = report["negative_products_after"]
    if report["all_products_non_negative"]:
        print("Verified: every product now has on-hand of zero or more.")
    else:
        print(f"Still negative after the run: {len(remaining)}")
        for product in remaining[:50]:
            print(f"- {product['label']}: {product['on_hand']}")


def main() -> int:
    args = parse_args()
    load_env(ROOT / ".env")

    client = OdooClient(OdooConfig.from_env())
    client.authenticate()

    fixer = NegativeOnHandFixer(client)
    report = fixer.run(
        apply_changes=args.apply,
        only_negative_products=args.only_negative_products,
        limit=args.limit,
    )

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print_report(report)

    if report["mode"] == "apply" and (report["failures"] or not report["all_products_non_negative"]):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
