"""Fill in the brand for Odoo products that have none, reading it from their title.

Titles in this catalogue state the brand right after the product type
("BOARDBAG DEVOTED LONGBOARD ..."), so a product with an empty x_studio_marcas
can usually be filed from its own name. The matching rules live in
list_product_brands.py and are shared with the reporting script: only the part
of the title before the dimensions is considered, so a board is never credited
to its fin system, and known title spellings map onto the real brand.

Only products whose brand is currently empty are written; an existing brand is
never overwritten. Products whose title names no known brand are left alone and
listed so someone can decide, which is what --unresolved-csv exports.

Dry run (no writes):
    python3 scripts/assign_missing_brands.py

Apply, then export what is left:
    python3 scripts/assign_missing_brands.py --apply
    python3 scripts/assign_missing_brands.py --unresolved-csv
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from list_product_brands import (  # noqa: E402  (sibling script, shared matching rules)
    ALL_RECORDS,
    BRAND_FIELD,
    BRAND_MODEL,
    brands_in_title,
)
from src.odoo_client import OdooClient, OdooConfig, load_env  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the brands (default is a read-only dry run)",
    )
    parser.add_argument(
        "--unresolved-csv",
        action="store_true",
        help="print a CSV of the products whose brand could not be determined",
    )
    return parser.parse_args(argv)


def read_brands(client: OdooClient) -> list[dict[str, Any]]:
    return client.execute_kw(
        BRAND_MODEL,
        "search_read",
        [[["id", "!=", 0]], ["x_name"]],
        {"context": ALL_RECORDS, "limit": 5000},
    )


def read_unbranded(client: OdooClient) -> list[dict[str, Any]]:
    return client.execute_kw(
        "product.template",
        "search_read",
        [
            [[BRAND_FIELD, "=", False], ["active", "in", [True, False]]],
            ["name", "default_code", "categ_id", "active"],
        ],
        {"context": ALL_RECORDS, "limit": 20000},
    )


def resolve(
    templates: list[dict[str, Any]], brands: list[dict[str, Any]]
) -> tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
    """Split products into those whose title names a known brand and those that do not."""
    matched: dict[str, list[dict[str, Any]]] = {}
    unresolved: list[dict[str, Any]] = []
    for template in templates:
        suggestion, _ = brands_in_title(template["name"], brands)
        if suggestion:
            matched.setdefault(suggestion, []).append(template)
        else:
            unresolved.append(template)
    return matched, unresolved


def print_unresolved_csv(unresolved: list[dict[str, Any]]) -> None:
    writer = csv.writer(sys.stdout)
    writer.writerow(["product_id", "sku", "product_name", "category", "active", "brand_to_use"])
    for template in sorted(unresolved, key=lambda item: item["name"].strip().upper()):
        writer.writerow(
            [
                template["id"],
                template.get("default_code") or "",
                template["name"].strip(),
                template["categ_id"][1] if template.get("categ_id") else "",
                "yes" if template["active"] else "no",
                "",
            ]
        )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    load_env(ROOT / ".env")

    client = OdooClient(OdooConfig.from_env())
    client.authenticate()

    brands = read_brands(client)
    brand_id_by_name = {brand["x_name"]: brand["id"] for brand in brands}
    templates = read_unbranded(client)
    matched, unresolved = resolve(templates, brands)

    if args.unresolved_csv:
        print_unresolved_csv(unresolved)
        return 0

    total = sum(len(items) for items in matched.values())
    print(f"Products with no brand: {len(templates)}")
    print(f"  brand readable from the title: {total}")
    print(f"  title names no known brand   : {len(unresolved)}")
    print()
    for name in sorted(matched, key=lambda key: (-len(matched[key]), key)):
        print(f"- {name}: {len(matched[name])} products")

    if not args.apply:
        print(f"\nDry run: no changes written. Re-run with --apply to fill {total} products.")
        return 0

    problems: list[str] = []
    print()
    for name, items in sorted(matched.items()):
        brand_id = brand_id_by_name.get(name)
        if brand_id is None:
            problems.append(f"brand {name!r} disappeared before it could be assigned")
            continue
        ids = [item["id"] for item in items]
        client.execute_kw("product.template", "write", [ids, {BRAND_FIELD: brand_id}])
        print(f"assigned {name}: {len(ids)} products")

    print("\n== Verification ==")
    still_empty = client.execute_kw(
        "product.template",
        "search_count",
        [[[BRAND_FIELD, "=", False], ["active", "in", [True, False]]]],
        {"context": ALL_RECORDS},
    )
    print(f"- products still without a brand: {still_empty} (expected {len(unresolved)})")
    if still_empty != len(unresolved):
        problems.append(f"expected {len(unresolved)} products left without a brand, found {still_empty}")

    for name, items in sorted(matched.items()):
        ids = [item["id"] for item in items]
        wrong = client.execute_kw(
            "product.template",
            "search_count",
            [[["id", "in", ids], [BRAND_FIELD, "!=", brand_id_by_name[name]]]],
            {"context": ALL_RECORDS},
        )
        if wrong:
            problems.append(f"{wrong} products meant to be {name!r} did not take the brand")

    if problems:
        print("\nProblems:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print(f"- every one of the {sum(len(v) for v in matched.values())} assignments verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
