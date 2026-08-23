"""List every product brand in Odoo and flag names that look wrong.

Brands live in the Studio model x_marcas and are linked from product templates
through x_studio_marcas. This script scans every product template (archived
ones included), counts how many use each brand, and reports the names that look
like data-entry mistakes: duplicates that differ only in case or punctuation,
stray whitespace, near-identical spellings, and brands nothing points at.

Full report:
    python3 scripts/list_product_brands.py

Spreadsheet-friendly list:
    python3 scripts/list_product_brands.py --csv
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.odoo_client import OdooClient, OdooConfig, load_env

BRAND_MODEL = "x_marcas"
BRAND_FIELD = "x_studio_marcas"
NEAR_DUPLICATE_RATIO = 0.85
ALL_RECORDS = {"active_test": False}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--csv",
        action="store_true",
        help="print the brand list as CSV instead of the full report",
    )
    parser.add_argument(
        "--similarity",
        type=float,
        default=NEAR_DUPLICATE_RATIO,
        help=f"how alike two names must be to be flagged (0-1, default: {NEAR_DUPLICATE_RATIO})",
    )
    return parser.parse_args(argv)


def normalise(name: str) -> str:
    """Reduce a brand name to what a human would consider the same name."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def read_brands(client: OdooClient) -> list[dict[str, Any]]:
    return client.execute_kw(
        BRAND_MODEL,
        "search_read",
        [[["id", "!=", 0]], ["x_name", "x_active"]],
        {"context": ALL_RECORDS, "order": "x_name asc", "limit": 5000},
    )


def read_templates(client: OdooClient) -> list[dict[str, Any]]:
    return client.execute_kw(
        "product.template",
        "search_read",
        [[["active", "in", [True, False]]], ["name", "default_code", BRAND_FIELD, "active"]],
        {"context": ALL_RECORDS, "limit": 20000},
    )


def count_usage(templates: list[dict[str, Any]]) -> tuple[dict[int, int], dict[int, int], int]:
    """Return products per brand, archived products per brand, and the unbranded count."""
    total: dict[int, int] = {}
    archived: dict[int, int] = {}
    unbranded = 0
    for template in templates:
        brand = template[BRAND_FIELD]
        if not brand:
            unbranded += 1
            continue
        brand_id = brand[0]
        total[brand_id] = total.get(brand_id, 0) + 1
        if not template["active"]:
            archived[brand_id] = archived.get(brand_id, 0) + 1
    return total, archived, unbranded


def products_by_brand(templates: list[dict[str, Any]]) -> dict[int, list[dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = {}
    for template in templates:
        brand = template[BRAND_FIELD]
        if brand:
            grouped.setdefault(brand[0], []).append(template)
    return grouped


def group_by(brands: list[dict[str, Any]], key) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for brand in brands:
        groups.setdefault(key(brand["x_name"]), []).append(brand)
    return groups


def near_duplicate_pairs(brands: list[dict[str, Any]], threshold: float) -> list[tuple[dict, dict, float]]:
    """Pair up brands whose normalised names are similar but not identical."""
    unique: dict[str, dict[str, Any]] = {}
    for brand in brands:
        unique.setdefault(normalise(brand["x_name"]), brand)

    pairs = []
    keys = sorted(unique)
    for index, left in enumerate(keys):
        for right in keys[index + 1 :]:
            ratio = SequenceMatcher(None, left, right).ratio()
            if ratio >= threshold:
                pairs.append((unique[left], unique[right], ratio))
    return sorted(pairs, key=lambda item: -item[2])


def print_csv(brands: list[dict[str, Any]], total: dict[int, int], archived: dict[int, int]) -> None:
    writer = csv.writer(sys.stdout)
    writer.writerow(["brand_id", "brand_name", "brand_active", "products", "archived_products"])
    for brand in brands:
        writer.writerow(
            [
                brand["id"],
                brand["x_name"],
                brand["x_active"],
                total.get(brand["id"], 0),
                archived.get(brand["id"], 0),
            ]
        )


def print_list(brands: list[dict[str, Any]], total: dict[int, int], archived: dict[int, int]) -> None:
    print(f"{'id':>5} {'products':>8} {'archived':>8} {'active':>6}  brand")
    for brand in brands:
        print(
            f"{brand['id']:>5} {total.get(brand['id'], 0):>8} {archived.get(brand['id'], 0):>8} "
            f"{str(brand['x_active']):>6}  {brand['x_name']!r}"
        )


def print_issues(
    brands: list[dict[str, Any]],
    total: dict[int, int],
    grouped: dict[int, list[dict[str, Any]]],
    args: argparse.Namespace,
) -> None:
    def usage(brand: dict[str, Any]) -> str:
        return f"id {brand['id']}, {total.get(brand['id'], 0)} products"

    print("\n== Duplicate records sharing one identical name ==")
    exact = {
        key: group
        for key, group in group_by(brands, lambda name: name).items()
        if len(group) > 1
    }
    if not exact:
        print("none")
    for name, group in exact.items():
        ids = ", ".join(f"id {brand['id']} ({total.get(brand['id'], 0)} products)" for brand in group)
        print(f"- {name!r}: {ids}")

    print("\n== Names that differ only in case or punctuation ==")
    collisions = {
        key: group
        for key, group in group_by(brands, normalise).items()
        if len({brand["x_name"] for brand in group}) > 1
    }
    if not collisions:
        print("none")
    for group in collisions.values():
        ranked = sorted(group, key=lambda brand: -total.get(brand["id"], 0))
        variants = " | ".join(f"{brand['x_name']!r} ({usage(brand)})" for brand in ranked)
        print(f"- {variants}")

    print("\n== Names with stray whitespace ==")
    messy = [
        brand
        for brand in brands
        if brand["x_name"] != brand["x_name"].strip() or "  " in brand["x_name"]
    ]
    if not messy:
        print("none")
    for brand in messy:
        print(f"- {brand['x_name']!r} ({usage(brand)}) -> {brand['x_name'].strip()!r}")

    print("\n== Near-identical spellings ==")
    pairs = [
        (left, right, ratio)
        for left, right, ratio in near_duplicate_pairs(brands, args.similarity)
        if normalise(left["x_name"]) != normalise(right["x_name"])
    ]
    if not pairs:
        print("none")
    for left, right, ratio in pairs:
        print(
            f"- {left['x_name']!r} ({usage(left)}) vs {right['x_name']!r} ({usage(right)}) "
            f"| {ratio:.0%} alike"
        )

    print("\n== Names with unusual punctuation ==")
    print("(an acute accent or backtick typed where an apostrophe belongs, or stray underscores)")
    odd_punct = [brand for brand in brands if re.search(r"[´`’_]", brand["x_name"])]
    if not odd_punct:
        print("none")
    for brand in odd_punct:
        suggestion = re.sub(r"[´`’]", "'", brand["x_name"]).replace("_", " ").strip()
        print(f"- {brand['x_name']!r} ({usage(brand)}) -> {suggestion!r}")

    print("\n== Names that look like a truncated version of another brand ==")
    truncated = []
    tokens = {brand["id"]: brand["x_name"].lower().split() for brand in brands}
    for short in brands:
        for long in brands:
            short_tokens, long_tokens = tokens[short["id"]], tokens[long["id"]]
            if len(short_tokens) < len(long_tokens) and long_tokens[: len(short_tokens)] == short_tokens:
                truncated.append((short, long))
    if not truncated:
        print("none")
    for short, long in truncated:
        print(f"- {short['x_name']!r} ({usage(short)}) may be {long['x_name']!r} ({usage(long)})")

    print("\n== Brands no product uses ==")
    unused = [brand for brand in brands if not total.get(brand["id"], 0)]
    print(", ".join(f"{brand['x_name']!r} (id {brand['id']})" for brand in unused) or "none")

    print("\n== Archived brands still assigned to products ==")
    stale = [brand for brand in brands if not brand["x_active"] and total.get(brand["id"], 0)]
    if not stale:
        print("none")
    for brand in stale:
        print(f"- {brand['x_name']!r} ({usage(brand)})")

    print("\n== Names not in the dominant UPPERCASE style ==")
    odd_case = [brand for brand in brands if brand["x_name"] != brand["x_name"].upper()]
    if not odd_case:
        print("none")
    for brand in odd_case:
        print(f"- {brand['x_name']!r} ({usage(brand)})")

    print("\n== Brands no product of theirs mentions in its own name ==")
    print("(product names normally carry the brand, so these are the likeliest wrong names)")
    suspects = []
    for brand in brands:
        products = grouped.get(brand["id"], [])
        if not products:
            continue
        needle = normalise(brand["x_name"])
        if not any(needle in normalise(product["name"]) for product in products):
            suspects.append((brand, products))
    if not suspects:
        print("none")
    for brand, products in suspects:
        examples = "; ".join(product["name"].strip()[:60] for product in products[:3])
        print(f"- {brand['x_name']!r} ({usage(brand)}) -> {examples}")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    load_env(ROOT / ".env")

    client = OdooClient(OdooConfig.from_env())
    client.authenticate()

    brands = read_brands(client)
    templates = read_templates(client)
    total, archived, unbranded = count_usage(templates)

    if args.csv:
        print_csv(brands, total, archived)
        return 0

    print(f"Brand records in {BRAND_MODEL}: {len(brands)}")
    print(f"Product templates scanned (archived included): {len(templates)}")
    print(f"Product templates with no brand set: {unbranded}")
    print(f"Brands actually used by at least one product: {len(total)}")
    print()
    print_list(brands, total, archived)
    print_issues(brands, total, products_by_brand(templates), args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
