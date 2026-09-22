"""Foundry Hosted Agent entrypoint, exposing the LeadAgent SDR agent over the
Responses protocol (POST /responses, OpenAI-compatible SSE streaming).

Run locally with:
    python server.py
(binds to localhost:8088 by default, or the PORT env var)

The frontend talks to this via a hand-rolled fetch/SSE client
(src/agentClient.js), tracking conversation continuity via
previous_response_id rather than an AG-UI threadId.
"""

from __future__ import annotations

from agent_framework_foundry_hosting import ResponsesHostServer
from dotenv import load_dotenv

from agent import build_agent

load_dotenv()


def main() -> None:
    agent = build_agent()
    server = ResponsesHostServer(agent)
    server.run()


if __name__ == "__main__":
    main()
