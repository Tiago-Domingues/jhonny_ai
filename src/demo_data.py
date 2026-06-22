from __future__ import annotations

import hashlib
import os
import random
from typing import Any


NAME_PREFIXES = {
    "brand": "Demo Brand",
    "category": "Demo Category",
    "customer": "Demo Customer",
    "location": "Demo Location",
    "order": "Demo Order",
    "partner": "Demo Partner",
    "product": "Demo Product",
    "supplier": "Demo Supplier",
    "vendor": "Demo Vendor",
}

NON_SENSITIVE_NUMBER_KEYS = {
    "day",
    "days",
    "end_day",
    "end_month",
    "end_year",
    "hour",
    "id",
    "limit",
    "month",
    "period_days",
    "start_day",
    "start_month",
    "start_year",
    "threshold",
    "year",
}

PERCENT_KEYS = ("margin", "pct", "percent", "rate", "ratio")
MONEY_KEYS = (
    "amount",
    "bill",
    "capital",
    "cost",
    "margin_value",
    "payable",
    "price",
    "profit",
    "purchase",
    "receivable",
    "revenue",
    "sales",
    "spend",
    "total",
    "valuation",
    "value",
)
QUANTITY_KEYS = ("available", "count", "line", "order", "quantity", "qty", "sold", "unit")
MONEY_OVERRIDE_KEYS = ("amount", "cost", "payable", "price", "profit", "purchase", "receivable", "revenue", "spend", "value")


class AnonymizedRetailBusinessTools:
    """Proxy that keeps live Odoo freshness while hiding private business values."""

    def __init__(self, tools: Any, salt: str | None = None) -> None:
        self._tools = tools
        self._salt = salt or os.getenv("DEMO_DATA_SALT", "jhonny-share-demo-v1")
        self._money_scale = self._scale("money", 0.72, 1.38)
        self._quantity_scale = self._scale("quantity", 0.7, 1.3)

    def __getattr__(self, name: str) -> Any:
        attr = getattr(self._tools, name)
        if not callable(attr):
            return attr

        def anonymized_call(*args: Any, **kwargs: Any) -> Any:
            return self.anonymize(attr(*args, **kwargs))

        return anonymized_call

    def dashboard(self) -> dict[str, Any]:
        result = self._tools.dashboard()
        anonymized = self.anonymize(result)
        if isinstance(anonymized, dict):
            anonymized["data_mode"] = "demo_anonymized"
            anonymized["data_notice"] = "Demo share mode: live Odoo structure with anonymized, realistic values."
        return anonymized

    def anonymize(self, value: Any, path: tuple[str, ...] = ()) -> Any:
        if isinstance(value, dict):
            return {
                str(key): self.anonymize(item, (*path, str(key)))
                for key, item in value.items()
            }
        if isinstance(value, list):
            return [self.anonymize(item, (*path, str(index))) for index, item in enumerate(value)]
        if isinstance(value, bool) or value is None:
            return value
        if isinstance(value, int | float):
            return self._anonymize_number(value, path)
        if isinstance(value, str):
            return self._anonymize_string(value, path)
        return value

    def _scale(self, label: str, minimum: float, maximum: float) -> float:
        rng = random.Random(self._seed(label))
        return rng.uniform(minimum, maximum)

    def _seed(self, label: str) -> int:
        digest = hashlib.sha256(f"{self._salt}:{label}".encode("utf-8")).hexdigest()
        return int(digest[:16], 16)

    def _anonymize_number(self, value: int | float, path: tuple[str, ...]) -> int | float:
        key = path[-1].lower() if path else ""
        if key in NON_SENSITIVE_NUMBER_KEYS or value == 0:
            return value

        key_path = ".".join(part.lower() for part in path)
        if any(token in key_path for token in PERCENT_KEYS):
            return self._round_number(self._clamp(float(value) + self._jitter(key_path, -3.5, 3.5), 0, 100), value)
        if self._is_quantity_key(key) and not self._is_money_key(key):
            scaled = float(value) * self._quantity_scale
            if isinstance(value, int):
                return max(1, int(round(scaled))) if value > 0 else 0
            return round(max(0.01, scaled), 2)
        if self._is_money_key(key) or any(token in key_path for token in MONEY_KEYS):
            return self._round_number(float(value) * self._money_scale, value)

        if abs(float(value)) >= 10:
            return self._round_number(float(value) * self._scale(key_path, 0.85, 1.15), value)
        return value

    def _is_money_key(self, key: str) -> bool:
        return any(token in key for token in MONEY_OVERRIDE_KEYS)

    def _is_quantity_key(self, key: str) -> bool:
        return any(token in key for token in QUANTITY_KEYS)

    def _round_number(self, value: float, original: int | float) -> int | float:
        if isinstance(original, int):
            return max(1, int(round(value))) if original > 0 else 0
        return round(value, 2)

    def _jitter(self, label: str, minimum: float, maximum: float) -> float:
        rng = random.Random(self._seed(label))
        return rng.uniform(minimum, maximum)

    def _clamp(self, value: float, minimum: float, maximum: float) -> float:
        return max(minimum, min(maximum, value))

    def _anonymize_string(self, value: str, path: tuple[str, ...]) -> str:
        if not value.strip():
            return value
        key_path = ".".join(part.lower() for part in path)
        for token, prefix in NAME_PREFIXES.items():
            if token in key_path:
                return f"{prefix} {self._label_number(value, key_path)}"
        if "default_code" in key_path or "reference" in key_path or key_path.endswith(".ref"):
            return f"DEMO-{self._label_number(value, key_path):04d}"
        return value

    def _label_number(self, value: str, key_path: str) -> int:
        digest = hashlib.sha256(f"{self._salt}:{key_path}:{value}".encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % 900 + 100
