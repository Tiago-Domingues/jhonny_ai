from __future__ import annotations

import base64
import hashlib
import hmac
import os
import sys
from types import SimpleNamespace


from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi import HTTPException  # noqa: E402

from src.api import (  # noqa: E402
    WHATSAPP_RATE_LIMIT_STATE,
    is_allowed_sender,
    is_rate_limited,
    verify_meta_signature,
    verify_twilio_signature,
)


def fake_request(headers: dict[str, str], url: str = "https://example.com/webhooks/whatsapp", body: bytes = b""):
    return SimpleNamespace(headers=headers, url=url, state=SimpleNamespace(raw_body=body))


def assert_raises_http(func, label: str) -> None:
    try:
        func()
    except HTTPException:
        return
    raise AssertionError(f"{label}: expected HTTPException")


def main() -> None:
    os.environ["WHATSAPP_ALLOWED_NUMBERS"] = "351900000000,+351911111111"
    assert is_allowed_sender("351900000000")
    assert is_allowed_sender("351911111111")
    assert not is_allowed_sender("351922222222")

    os.environ["WHATSAPP_RATE_LIMIT_PER_MINUTE"] = "2"
    WHATSAPP_RATE_LIMIT_STATE.clear()
    assert not is_rate_limited("351900000000")
    assert not is_rate_limited("351900000000")
    assert is_rate_limited("351900000000")

    os.environ["TWILIO_AUTH_TOKEN"] = "twilio-secret"
    os.environ["PUBLIC_WHATSAPP_WEBHOOK_URL"] = "https://example.com/webhooks/whatsapp"
    payload = {"From": "whatsapp:+351900000000", "Body": "How much did we sell today?"}
    signed_data = os.environ["PUBLIC_WHATSAPP_WEBHOOK_URL"] + "".join(
        f"{key}{payload[key]}" for key in sorted(payload)
    )
    twilio_signature = base64.b64encode(
        hmac.new(b"twilio-secret", signed_data.encode("utf-8"), hashlib.sha1).digest()
    ).decode("utf-8")
    verify_twilio_signature(fake_request({"x-twilio-signature": twilio_signature}), payload)
    assert_raises_http(
        lambda: verify_twilio_signature(fake_request({"x-twilio-signature": "bad"}), payload),
        "twilio signature",
    )

    os.environ["WHATSAPP_APP_SECRET"] = "meta-secret"
    body = b'{"entry":[{"changes":[{"value":{"messages":[{"from":"351900000000","text":{"body":"Hi"}}]}}]}]}'
    meta_signature = "sha256=" + hmac.new(b"meta-secret", body, hashlib.sha256).hexdigest()
    verify_meta_signature(fake_request({"x-hub-signature-256": meta_signature}, body=body))
    assert_raises_http(
        lambda: verify_meta_signature(fake_request({"x-hub-signature-256": "sha256=bad"}, body=body)),
        "meta signature",
    )

    print("api security checks ok")


if __name__ == "__main__":
    main()
