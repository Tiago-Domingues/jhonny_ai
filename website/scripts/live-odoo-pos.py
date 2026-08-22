#!/usr/bin/env python3
"""Live Loja Carcavelos POS diagnose / optional register. Never prints secrets."""

from __future__ import annotations

import json
import os
import sys
import xmlrpc.client
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_env() -> None:
    for name in (".env.local", ".env"):
        path = ROOT / name
        if not path.exists():
            continue
        for raw in path.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def require_odoo() -> tuple[str, str, str, str]:
    url = os.environ.get("ODOO_URL", "").rstrip("/")
    db = os.environ.get("ODOO_DB", "")
    user = os.environ.get("ODOO_USERNAME", "")
    key = os.environ.get("ODOO_API_KEY", "")
    placeholder = (not key) or "replace" in key.lower()
    if not url or not db or not user or placeholder:
        print("odoo_not_configured")
        sys.exit(2)
    return url, db, user, key


def main() -> int:
    load_env()
    url, db, user, key = require_odoo()
    common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
    uid = common.authenticate(db, user, key, {})
    if not uid:
        print("odoo_auth_failed")
        return 3
    models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")

    def kw(model: str, method: str, args, kwargs=None):
        return models.execute_kw(db, uid, key, model, method, args, kwargs or {})

    wanted = (os.environ.get("ODOO_POS_CONFIG_NAME") or "Loja Carcavelos").strip()
    configs = kw("pos.config", "search_read", [[]], {"fields": ["id", "name", "payment_method_ids", "invoice_journal_id"], "limit": 20})
    config = next((row for row in configs if wanted.lower() in str(row.get("name") or "").lower()), configs[0] if configs else None)
    if not config:
        print(json.dumps({"ok": False, "error": "no_pos_config"}))
        return 4
    config_id = config["id"]
    sessions = kw(
        "pos.session",
        "search_read",
        [[["config_id", "=", config_id]]],
        {"fields": ["id", "name", "state"], "limit": 8, "order": "id desc"},
    )
    method_ids = config.get("payment_method_ids") or []
    methods = (
        kw("pos.payment.method", "search_read", [[["id", "in", method_ids]]], {"fields": ["id", "name", "type"], "limit": 30})
        if method_ids
        else []
    )
    recent = kw(
        "pos.order",
        "search_read",
        [[["config_id", "=", config_id]]],
        {"fields": ["id", "name", "pos_reference", "state", "account_move", "amount_total"], "limit": 8, "order": "id desc"},
    )
    invoice_ids = [row["account_move"][0] if isinstance(row.get("account_move"), list) else row.get("account_move") for row in recent]
    invoice_ids = [int(value) for value in invoice_ids if value]
    invoices = (
        kw("account.move", "search_read", [[["id", "in", invoice_ids]]], {"fields": ["id", "name", "state", "move_type", "amount_total"], "limit": 8})
        if invoice_ids
        else []
    )
    print(
        json.dumps(
            {
                "ok": True,
                "uid": uid,
                "config": {"id": config_id, "name": config.get("name")},
                "sessions": [{"id": row["id"], "name": row.get("name"), "state": row.get("state")} for row in sessions],
                "paymentMethods": [{"id": row["id"], "name": row.get("name"), "type": row.get("type")} for row in methods],
                "recentOrders": [
                    {
                        "id": row["id"],
                        "name": row.get("name"),
                        "reference": row.get("pos_reference"),
                        "state": row.get("state"),
                        "invoiceId": row["account_move"][0] if isinstance(row.get("account_move"), list) else row.get("account_move"),
                        "total": row.get("amount_total"),
                    }
                    for row in recent
                ],
                "invoices": invoices,
            },
            default=str,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
