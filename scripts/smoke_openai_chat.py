from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.app_factory import create_agent  # noqa: E402


def main() -> None:
    question = " ".join(sys.argv[1:]) or "How much did we sell today?"
    agent = create_agent(ROOT)
    if agent.llm is None or agent.llm.provider != "openai":
        provider = agent.llm.provider if agent.llm else "not_configured"
        raise RuntimeError(
            "OpenAI is not active. Set OPENAI_API_KEY and optionally OPENAI_MODEL in .env "
            f"or the hosting environment. Current provider: {provider}."
        )

    response = agent.answer(question, channel="app")
    if response.get("llm_provider") != "openai":
        raise RuntimeError(f"Expected OpenAI response path, got: {response.get('llm_provider')}")

    print(
        json.dumps(
            {
                "status": "ok",
                "provider": response.get("llm_provider"),
                "tool": response.get("tool"),
                "question": question,
                "answer": response.get("answer"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
