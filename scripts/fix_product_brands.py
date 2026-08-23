"""Correct misspelled product brands in Odoo and merge duplicate brand records.

Brands live in the Studio model x_marcas, linked from product templates through
x_studio_marcas. Names were entered by hand over time, so the table accumulated
misspellings ("BLUNSTONE") and several records for one real brand ("O'NEILL",
"O´NEILL", "ONEILL"). This script renames the wrong names and folds duplicates
into one record, moving every product across first so nothing loses its brand.

Every entry below records the name the record is expected to have right now, so
the script refuses to touch a brand somebody has already edited.

Dry run (no writes):
    python3 scripts/fix_product_brands.py

Apply the corrections:
    python3 scripts/fix_product_brands.py --apply
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

# (brand id, name it must currently have, corrected name, why)
RENAMES: tuple[tuple[int, str, str, str], ...] = (
    (68, "BLUNSTONE", "BLUNDSTONE", "products read 'BOOTS BLUNDSTONE'"),
    (89, "BULL MAX", "BULL WAX", "its only product is named 'BULL WAX'"),
    (17, "CHANNEL ISLAND", "CHANNEL ISLANDS", "products read 'CHANNEL ISLANDS'"),
    (109, "HAYDEN SHAPES", "HAYDENSHAPES", "products read 'HAYDENSHAPES', one word"),
    (28, "MACK´S", "MACK'S", "acute accent typed instead of an apostrophe"),
    (93, "WAR HAED", "DING ALL", "its only product is 'NOSE CONE DING ALL' in DING REPAIRS"),
    (1, "Billabong", "BILLABONG", "match the uppercase style used by every other brand"),
    (33, "SEXWAX", "MR. ZOGS SEX WAX", "full real brand name, matches both product namings"),
)

# (duplicate brand id, name it must currently have, brand id to keep)
MERGES: tuple[tuple[int, str, int], ...] = (
    (80, "BILLABONG", 1),
    (43, "D_B_", 58),
    (31, "O´NEILL", 12),
    (54, "ONEILL", 12),
    (15, "FCS", 16),
    (27, "NMD", 44),
    (73, "MR. ZOGS", 33),
    (2, "Quicksilver", 79),
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the corrections (default is a read-only dry run)",
    )
    return parser.parse_args(argv)


def read_brands(client: OdooClient, ids: list[int]) -> dict[int, dict[str, Any]]:
    rows = client.execute_kw(
        BRAND_MODEL,
        "search_read",
        [[["id", "in", ids]], ["x_name", "x_active"]],
        {"context": ALL_RECORDS, "limit": len(ids)},
    )
    return {row["id"]: row for row in rows}


def products_of(client: OdooClient, brand_id: int) -> list[int]:
    rows = client.execute_kw(
        "product.template",
        "search_read",
        [[[BRAND_FIELD, "=", brand_id], ["active", "in", [True, False]]], ["id"]],
        {"context": ALL_RECORDS, "limit": 5000},
    )
    return [row["id"] for row in rows]


def check_expected(brands: dict[int, dict[str, Any]], brand_id: int, expected: str) -> str | None:
    """Return a reason to skip, or None when the record is what we expect."""
    brand = brands.get(brand_id)
    if brand is None:
        return f"brand id {brand_id} no longer exists"
    if brand["x_name"] != expected:
        return f"brand id {brand_id} is now {brand['x_name']!r}, expected {expected!r}"
    return None


def rename_brand(client: OdooClient, brand_id: int, new_name: str) -> None:
    client.execute_kw(BRAND_MODEL, "write", [[brand_id], {"x_name": new_name}])


def move_products(client: OdooClient, product_ids: list[int], keeper_id: int) -> None:
    client.execute_kw("product.template", "write", [product_ids, {BRAND_FIELD: keeper_id}])


def remove_brand(client: OdooClient, brand_id: int) -> str:
    """Delete the emptied brand record, falling back to archiving it."""
    try:
        client.execute_kw(BRAND_MODEL, "unlink", [[brand_id]])
        return "deleted"
    except Exception:
        client.execute_kw(BRAND_MODEL, "write", [[brand_id], {"x_active": False}])
        return "archived"


def run_renames(client: OdooClient, brands: dict[int, dict[str, Any]], apply: bool) -> list[str]:
    problems = []
    print("== Renames ==")
    for brand_id, expected, new_name, reason in RENAMES:
        skip = check_expected(brands, brand_id, expected)
        if skip:
            print(f"- SKIPPED {expected!r}: {skip}")
            problems.append(skip)
            continue
        count = len(products_of(client, brand_id))
        print(f"- {expected!r} -> {new_name!r} (id {brand_id}, {count} products) | {reason}")
        if apply:
            rename_brand(client, brand_id, new_name)
        # Keep the cache current so the merge report names the renamed keepers.
        brands[brand_id]["x_name"] = new_name
    return problems


def run_merges(client: OdooClient, brands: dict[int, dict[str, Any]], apply: bool) -> list[str]:
    problems = []
    print("\n== Merges ==")
    for duplicate_id, expected, keeper_id in MERGES:
        skip = check_expected(brands, duplicate_id, expected)
        if skip:
            print(f"- SKIPPED {expected!r}: {skip}")
            problems.append(skip)
            continue
        keeper = brands.get(keeper_id)
        if keeper is None:
            problems.append(f"keeper brand id {keeper_id} does not exist")
            print(f"- SKIPPED {expected!r}: keeper brand id {keeper_id} does not exist")
            continue

        product_ids = products_of(client, duplicate_id)
        print(
            f"- {expected!r} (id {duplicate_id}, {len(product_ids)} products) "
            f"-> {keeper['x_name']!r} (id {keeper_id})"
        )
        if not apply:
            continue
        if product_ids:
            move_products(client, product_ids, keeper_id)
        outcome = remove_brand(client, duplicate_id)
        print(f"    moved {len(product_ids)} products, duplicate record {outcome}")
    return problems


def verify(client: OdooClient) -> list[str]:
    """Confirm the corrected names exist, the duplicates are gone, and no product was orphaned."""
    problems = []
    expected_names = {new_name for _, _, new_name, _ in RENAMES}
    rows = client.execute_kw(
        BRAND_MODEL,
        "search_read",
        [[["id", "!=", 0]], ["x_name", "x_active"]],
        {"context": ALL_RECORDS, "limit": 5000},
    )
    live = {row["id"]: row for row in rows}

    print("\n== Verification ==")
    for name in sorted(expected_names):
        matches = [row for row in rows if row["x_name"] == name]
        if len(matches) != 1:
            problems.append(f"expected exactly one brand named {name!r}, found {len(matches)}")
        brand = matches[0] if matches else None
        count = len(products_of(client, brand["id"])) if brand else 0
        print(f"- {name!r}: {len(matches)} record(s), {count} products")

    for duplicate_id, expected, keeper_id in MERGES:
        brand = live.get(duplicate_id)
        left = products_of(client, duplicate_id)
        state = "gone" if brand is None else ("archived" if not brand["x_active"] else "STILL ACTIVE")
        if left:
            problems.append(f"{expected!r} (id {duplicate_id}) still has {len(left)} products")
        if brand is not None and brand["x_active"]:
            problems.append(f"{expected!r} (id {duplicate_id}) is still an active brand")
        keeper = live.get(keeper_id)
        keeper_count = len(products_of(client, keeper_id)) if keeper else 0
        keeper_name = keeper["x_name"] if keeper else "?"
        print(
            f"- duplicate {expected!r} (id {duplicate_id}): {state}, {len(left)} products left "
            f"| keeper {keeper_name!r} now has {keeper_count}"
        )

    names = [row["x_name"] for row in rows]
    duplicated = sorted({name for name in names if names.count(name) > 1})
    print(f"- brand records: {len(rows)} | names still duplicated: {duplicated or 'none'}")
    if duplicated:
        problems.append(f"names still duplicated: {duplicated}")
    return problems


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    load_env(ROOT / ".env")

    client = OdooClient(OdooConfig.from_env())
    client.authenticate()

    ids = [brand_id for brand_id, _, _, _ in RENAMES]
    ids += [brand_id for brand_id, _, _ in MERGES]
    ids += [keeper_id for _, _, keeper_id in MERGES]
    brands = read_brands(client, sorted(set(ids)))

    problems = run_renames(client, brands, args.apply)
    problems += run_merges(client, brands, args.apply)

    if not args.apply:
        print(
            f"\nDry run: no changes written. Re-run with --apply to rename "
            f"{len(RENAMES)} brands and merge {len(MERGES)} duplicates."
        )
        return 1 if problems else 0

    problems += verify(client)
    if problems:
        print("\nProblems:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print("\nAll brand corrections applied and verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
