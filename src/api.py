from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from src.app_factory import create_agent


ROOT = Path(__file__).resolve().parents[1]


class ChatRequest(BaseModel):
    question: str
    channel: str = "app"


class ToolRequest(BaseModel):
    arguments: dict[str, Any] = {}


app = FastAPI(title="Retail Agent POC API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "APP_CORS_ORIGINS",
            "http://127.0.0.1:3000,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

WHATSAPP_RATE_LIMIT_STATE: dict[str, list[float]] = {}


def get_agent():
    if not hasattr(app.state, "agent"):
        app.state.agent = create_agent(ROOT)
    return app.state.agent


def require_app_token(x_app_token: str | None) -> None:
    expected = os.getenv("APP_AUTH_TOKEN", "").strip()
    if expected and x_app_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def log_event(event: dict[str, Any]) -> None:
    event["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(json.dumps(event, ensure_ascii=False))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/dashboard")
def dashboard(x_app_token: str | None = Header(default=None)) -> dict[str, Any]:
    require_app_token(x_app_token)
    return get_agent().tools.dashboard()


@app.post("/chat")
def chat(payload: ChatRequest, x_app_token: str | None = Header(default=None)) -> dict[str, Any]:
    require_app_token(x_app_token)
    request_id = str(uuid.uuid4())
    started = time.perf_counter()
    try:
        response = get_agent().answer(payload.question, channel=payload.channel)
        response["request_id"] = request_id
        log_event(
            {
                "event": "chat",
                "request_id": request_id,
                "channel": payload.channel,
                "question": payload.question,
                "tool": response.get("tool"),
                "intent": response.get("intent"),
                "llm_provider": response.get("llm_provider"),
                "tool_trace": response.get("tool_trace"),
                "success": True,
                "latency_ms": round((time.perf_counter() - started) * 1000),
            }
        )
        return response
    except Exception as exc:
        log_event(
            {
                "event": "chat",
                "request_id": request_id,
                "channel": payload.channel,
                "question": payload.question,
                "success": False,
                "error": str(exc),
                "latency_ms": round((time.perf_counter() - started) * 1000),
            }
        )
        raise


@app.post("/tools/{tool_name}")
def call_tool(
    tool_name: str,
    payload: ToolRequest,
    x_app_token: str | None = Header(default=None),
) -> dict[str, Any]:
    require_app_token(x_app_token)
    result = get_agent().registry.call(tool_name, payload.arguments)
    return {"tool": tool_name, "data": result}


@app.post("/webhooks/whatsapp")
async def whatsapp(request: Request) -> Response:
    payload = await parse_whatsapp_payload(request)
    verify_whatsapp_signature(request, payload)

    sender = extract_sender(payload)
    if not is_allowed_sender(sender):
        return JSONResponse({"error": "sender is not authorized"}, status_code=403)
    if is_rate_limited(sender):
        return JSONResponse({"error": "rate limit exceeded"}, status_code=429)

    question = extract_message(payload)
    if not question.strip():
        return JSONResponse({"error": "message body is required"}, status_code=400)

    response = get_agent().answer(question, channel="whatsapp")
    log_event(
        {
            "event": "whatsapp",
            "sender": sender,
            "tool": response.get("tool"),
            "success": True,
        }
    )

    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        answer = escape_xml(response["answer"])
        return Response(
            f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{answer}</Message></Response>',
            media_type="application/xml",
        )
    return JSONResponse({"answer": response["answer"], "tool": response.get("tool")})


async def parse_whatsapp_payload(request: Request) -> dict[str, Any]:
    body = await request.body()
    request.state.raw_body = body
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        return json.loads(body.decode("utf-8") or "{}")
    parsed = parse_qs(body.decode("utf-8"))
    return {key: values[0] if values else "" for key, values in parsed.items()}


def extract_sender(payload: dict[str, Any]) -> str:
    if "From" in payload:
        return str(payload["From"]).replace("whatsapp:", "").replace("+", "")
    try:
        return str(payload["entry"][0]["changes"][0]["value"]["messages"][0]["from"])
    except (KeyError, IndexError, TypeError):
        return ""


def extract_message(payload: dict[str, Any]) -> str:
    if "Body" in payload:
        return str(payload["Body"])
    try:
        return str(payload["entry"][0]["changes"][0]["value"]["messages"][0]["text"]["body"])
    except (KeyError, IndexError, TypeError):
        return ""


def is_allowed_sender(sender: str) -> bool:
    allowed = {
        value.strip().replace("+", "")
        for value in os.getenv("WHATSAPP_ALLOWED_NUMBERS", "").split(",")
        if value.strip()
    }
    return not allowed or sender in allowed


def is_rate_limited(sender: str) -> bool:
    limit = int(os.getenv("WHATSAPP_RATE_LIMIT_PER_MINUTE", "20") or "20")
    if limit <= 0:
        return False

    now = time.time()
    window_start = now - 60
    key = sender or "unknown"
    recent = [timestamp for timestamp in WHATSAPP_RATE_LIMIT_STATE.get(key, []) if timestamp >= window_start]
    if len(recent) >= limit:
        WHATSAPP_RATE_LIMIT_STATE[key] = recent
        return True

    recent.append(now)
    WHATSAPP_RATE_LIMIT_STATE[key] = recent
    return False


def verify_whatsapp_signature(request: Request, payload: dict[str, Any]) -> None:
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        verify_twilio_signature(request, payload)
        return
    if "application/json" in content_type:
        verify_meta_signature(request)


def verify_twilio_signature(request: Request, payload: dict[str, Any]) -> None:
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    if not auth_token:
        return

    provided = request.headers.get("x-twilio-signature", "")
    public_url = os.getenv("PUBLIC_WHATSAPP_WEBHOOK_URL", "").strip() or str(request.url)
    signed_data = public_url + "".join(f"{key}{payload[key]}" for key in sorted(payload))
    digest = hmac.new(auth_token.encode("utf-8"), signed_data.encode("utf-8"), hashlib.sha1).digest()
    expected = base64.b64encode(digest).decode("utf-8")
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")


def verify_meta_signature(request: Request) -> None:
    app_secret = os.getenv("WHATSAPP_APP_SECRET", "").strip()
    if not app_secret:
        return

    provided = request.headers.get("x-hub-signature-256", "")
    if not provided.startswith("sha256="):
        raise HTTPException(status_code=403, detail="Missing Meta WhatsApp signature")

    body = getattr(request.state, "raw_body", b"")
    expected = "sha256=" + hmac.new(app_secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=403, detail="Invalid Meta WhatsApp signature")


def escape_xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
