"""Interactive terminal chat loop for manually testing the LeadAgent agent.

Usage:
    python run.py

Requires FOUNDRY_PROJECT_ENDPOINT (and optionally MODEL_DEPLOYMENT_NAME) set
via agent/.env, and a local `az login` session for authentication.
"""

from __future__ import annotations

import asyncio

from agent import build_agent


async def main() -> None:
    print("LeadAgent SDR — interactive test console")
    print("Type a message and press Enter. Ctrl+C to quit.")
    print(
        "Try: 'Ingest the Building Permit Data feed, qualify the results, "
        "draft a pitch for the best one, and dispatch it.'\n"
    )

    agent = build_agent()
    session = agent.create_session()

    while True:
        try:
            user_input = input("you> ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            break

        result = await agent.run(user_input, session=session)
        print(f"\nagent> {result}\n")


if __name__ == "__main__":
    asyncio.run(main())
