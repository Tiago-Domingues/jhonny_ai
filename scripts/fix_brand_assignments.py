"""Reassign products that are filed under the wrong Odoo brand.

Product titles in this catalogue name their brand right after the product type
("BOARD SOCK DEFLOW ...", "LEASH DEVOTED ..."), so a product whose title states
one brand while x_studio_marcas points at another is a filing mistake. This
script moves each of those products to the brand its own title states.

Every row records the brand the product is expected to carry right now, so the
script refuses to touch anything that was corrected in the meantime, and it can
be re-run safely: products already on the target brand are reported as done.

Dry run (no writes):
    python3 scripts/fix_brand_assignments.py

Apply the corrections:
    python3 scripts/fix_brand_assignments.py --apply
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.odoo_client import OdooClient, OdooConfig, load_env

BRAND_MODEL = "x_marcas"
BRAND_FIELD = "x_studio_marcas"
ALL_RECORDS = {"active_test": False}

# (product template id, sku, brand it currently carries, brand its title states)
REASSIGNMENTS: tuple[tuple[int, str | None, str, str], ...] = (
    (47, "A00019", "DEVOTED", "DEFLOW"),
    (49, "A00047", "DEVOTED", "DEFLOW"),
    (51, "A00052", "DEVOTED", "DEFLOW"),
    (52, "A00021", "DEVOTED", "DEFLOW"),
    (55, "A00027", "DEVOTED", "DEFLOW"),
    (1643, "A00054", "DEVOTED", "DEFLOW"),
    (1644, "DEFLOW143", "DEVOTED", "DEFLOW"),
    (1349, "PADK-T-AA-BKGY", "SLATER DESIGNS", "FIREWIRE"),
    (2234, "BSUP000-506-CAMO", "SLATER DESIGNS", "FIREWIRE"),
    (2062, "42029291-60", "FARKING", "DAKINE"),
    (1631, None, "NMD", "VERSUS"),
    (1864, "AMMC22", "OCEAN & EARTH", "CREATURES"),
    (2148, None, "DAKINE", "FCS"),
    (2271, None, "CHANNEL ISLANDS", "FUTURES"),
    (2273, None, "CHANNEL ISLANDS", "FUTURES"),
    (2057, "FC0QI0715TWIN", "FCS", "FUTURES"),
    (2123, None, "VERSUS", "DEVOTED"),
    (418, "DEV480", "DEFLOW", "DEVOTED"),
    (422, "DEV520", "DEFLOW", "DEVOTED"),
    (2054, "FC0RK0004BLK", "FCS", "DEVOTED"),
)

# Flagged by the scanner but correct as filed: Channel Islands fins whose titles
# mention FUTURES because that is the fin base, not the maker.
CONFIRMED_CORRECT: tuple[tuple[int, str], ...] = (
    (251, "CHANNEL ISLANDS"),
    (253, "CHANNEL ISLANDS"),
    (254, "CHANNEL ISLANDS"),
    (255, "CHANNEL ISLANDS"),
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the reassignments (default is a read-only dry run)",
    )
    return parser.parse_args(argv)


def read_templates(client: OdooClient, ids: list[int]) -> dict[int, dict[str, Any]]:
    rows = client.execute_kw(
        "product.template",
        "search_read",
        [[["id", "in", ids]], ["name", "default_code", BRAND_FIELD]],
        {"context": ALL_RECORDS, "limit": len(ids)},
    )
    return {row["id"]: row for row in rows}


def brand_ids_by_name(client: OdooClient, names: set[str]) -> dict[str, list[int]]:
    rows = client.execute_kw(
        BRAND_MODEL,
        "search_read",
        [[["x_name", "in", sorted(names)]], ["x_name"]],
        {"context": ALL_RECORDS, "limit": 500},
    )
    found: dict[str, list[int]] = {}
    for row in rows:
        found.setdefault(row["x_name"], []).append(row["id"])
    return found


def brand_name(template: dict[str, Any]) -> str | None:
    brand = template[BRAND_FIELD]
    return brand[1] if brand else None


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    load_env(ROOT / ".env")

    client = OdooClient(OdooConfig.from_env())
    client.authenticate()

    templates = read_templates(client, [row[0] for row in REASSIGNMENTS])
    targets = brand_ids_by_name(client, {row[3] for row in REASSIGNMENTS})

    problems: list[str] = []
    pending: list[tuple[int, int]] = []

    print("== Reassignments ==")
    for template_id, sku, expected_brand, target_brand in REASSIGNMENTS:
        label = f"product {template_id} ({sku or 'no-sku'})"
        template = templates.get(template_id)
        if template is None:
            problems.append(f"{label} no longer exists")
            print(f"- SKIPPED {label}: no longer exists")
            continue

        current = brand_name(template)
        title = template["name"].strip()[:45]
        if current == target_brand:
            print(f"- already {target_brand!r}: {label} | {title}")
            continue
        if current != expected_brand:
            problems.append(f"{label} carries {current!r}, expected {expected_brand!r}")
            print(f"- SKIPPED {label}: carries {current!r}, expected {expected_brand!r}")
            continue

        ids = targets.get(target_brand, [])
        if len(ids) != 1:
            problems.append(f"brand {target_brand!r} matched {len(ids)} records")
            print(f"- SKIPPED {label}: brand {target_brand!r} matched {len(ids)} records")
            continue

        print(f"- {current!r} -> {target_brand!r}: {label} | {title}")
        pending.append((template_id, ids[0]))

    print("\n== Confirmed correct, left untouched ==")
    for template_id, expected_brand in CONFIRMED_CORRECT:
        rows = client.execute_kw(
            "product.template",
            "search_read",
            [[["id", "=", template_id]], ["name", BRAND_FIELD]],
            {"context": ALL_RECORDS, "limit": 1},
        )
        for row in rows:
            current = brand_name(row)
            state = "ok" if current == expected_brand else f"CHANGED to {current!r}"
            print(f"- product {template_id} stays {expected_brand!r} ({state}) | {row['name'].strip()[:45]}")

    if not args.apply:
        print(f"\nDry run: no changes written. Re-run with --apply to reassign {len(pending)} products.")
        return 1 if problems else 0

    for template_id, brand_id in pending:
        client.execute_kw("product.template", "write", [[template_id], {BRAND_FIELD: brand_id}])

    print("\n== Verification ==")
    templates = read_templates(client, [row[0] for row in REASSIGNMENTS])
    for template_id, sku, _, target_brand in REASSIGNMENTS:
        current = brand_name(templates.get(template_id, {BRAND_FIELD: False}))
        if current != target_brand:
            problems.append(f"product {template_id} is {current!r}, expected {target_brand!r}")
        print(f"- product {template_id} ({sku or 'no-sku'}): {current!r}")

    if problems:
        print("\nProblems:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print(f"\nAll {len(REASSIGNMENTS)} products carry the brand their title states.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
