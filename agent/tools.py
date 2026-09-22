"""Mock tools for the LeadAgent SDR agent.

Each function is a plain, type-hinted Python function with a docstring —
Microsoft Agent Framework introspects these to build tool-call schemas
automatically, no manual JSON schema needed.

Data is entirely simulated in this phase. Nothing here calls a real
permit registry, enrichment API, or email provider. The shapes returned
mirror the `initialLeads` objects in src/App.jsx so a later phase can
wire real tool output straight into the UI's state.
"""

from __future__ import annotations

import random

_MOCK_PERMIT_FEED = [
    {
        "company": "Apex Design & Build",
        "location": "Austin, TX",
        "size": "18 Employees",
        "revenue": "$4.2M",
        "trigger": "Pulled commercial permit for 4th St remodel (3 days ago)",
        "tech_stack": ["Excel", "QuickBooks Desktop"],
        "owner": "Marcus Vance",
        "role": "Managing Principal",
        "email": "marcus@apexbuilds.com",
        "phone": "+1 (512) 555-0193",
    },
    {
        "company": "Crestview Renovations",
        "location": "Phoenix, AZ",
        "size": "24 Employees",
        "revenue": "$5.6M",
        "trigger": "3 residential additions permitted in Maricopa County",
        "tech_stack": ["Spreadsheets", "Manual Bidding"],
        "owner": "David Ross",
        "role": "President",
        "email": "dross@crestviewreno.com",
        "phone": "+1 (602) 555-0182",
    },
    {
        "company": "Blueline Custom Builders",
        "location": "Denver, CO",
        "size": "12 Employees",
        "revenue": "$2.8M",
        "trigger": "Hiring for Project Coordinator on LinkedIn",
        "tech_stack": ["Buildertrend", "Procore"],
        "owner": "Sarah Jenkins",
        "role": "Founder & GC",
        "email": "s.jenkins@bluebuilders.io",
        "phone": "+1 (303) 555-0144",
    },
]


def ingest_permits(feed_name: str) -> list[dict]:
    """Pull the latest hits from a named ingestion feed (e.g. 'Building Permit Data').

    Args:
        feed_name: Name of the ingestion feed to pull from.

    Returns:
        A list of raw account hits with company, location, size, revenue,
        trigger event, and known tech stack. This is mocked/simulated data
        standing in for a real municipal permit or licensing API.
    """
    count = random.randint(1, len(_MOCK_PERMIT_FEED))
    hits = random.sample(_MOCK_PERMIT_FEED, count)
    return [{"feed": feed_name, **hit} for hit in hits]


def qualify_lead(company: str, trigger: str, tech_stack: list[str]) -> dict:
    """Assess whether an account matches the target ICP and suggest a pitch angle.

    Target ICP: commercial/residential remodelers and general contractors
    with $1M-$10M revenue, active municipal permit filings, and legacy/manual
    tooling (i.e. NOT already on a modern field-management platform).

    Args:
        company: Company name.
        trigger: The recent signal that surfaced this account (e.g. a permit filing).
        tech_stack: Known tools/software currently in use at the company.

    Returns:
        A dict with `qualified` (bool), `reason` (str), and `pitch_angle` (str).
    """
    legacy_signals = {"Excel", "Spreadsheets", "QuickBooks Desktop", "Manual Bidding"}
    is_legacy_stack = any(tool in legacy_signals for tool in tech_stack)

    if is_legacy_stack:
        return {
            "qualified": True,
            "reason": f"{company} shows an active trigger ('{trigger}') and relies on "
            "legacy/manual tooling, indicating high friction FieldForge can solve.",
            "pitch_angle": "Eliminating unapproved change orders and manual admin overhead "
            "on active multi-unit jobs",
        }
    return {
        "qualified": False,
        "reason": f"{company} already uses modern field-management tooling "
        f"({', '.join(tech_stack)}), lowering urgency for a new platform.",
        "pitch_angle": "",
    }


def generate_pitch_email(lead: dict) -> dict:
    """Draft a short, personalized first-touch outbound email for a qualified lead.

    Args:
        lead: A dict describing the lead — expected keys include `company`,
            `owner` (decision-maker name), `location`, `size`, `trigger`,
            and `pitch_angle`.

    Returns:
        A dict with `subject` and `body` for the drafted email.
    """
    owner_first = lead.get("owner", "there").split(" ")[0]
    company = lead.get("company", "your company")
    location = lead.get("location", "")
    size = lead.get("size", "")
    trigger = lead.get("trigger", "recent activity")
    pitch_angle = lead.get("pitch_angle", "reducing manual admin overhead")

    subject = f"Quick question regarding {company}'s recent project activity"
    body = (
        f"{owner_first},\n\n"
        f"Noticed: {trigger}. Teams running {size or 'a growing crew'} in {location} "
        f"tell us this is exactly when margin starts leaking to manual processes.\n\n"
        f"FieldForge focuses on {pitch_angle.lower()}.\n\n"
        f"Open to a 10-minute walkthrough this week?"
    )
    return {"subject": subject, "body": body}


def dispatch_sequence(lead_id: str) -> dict:
    """Mark a lead as dispatched into the outbound sequence.

    This does not send a real email — it simulates handing the lead off to
    an outbound sequencer and returns a confirmation for logging/UI purposes.

    Args:
        lead_id: Identifier of the lead to dispatch.

    Returns:
        A dict with `status` and a human-readable `message`.
    """
    return {
        "status": "Sequence Active",
        "message": f"Lead {lead_id} handed off to outbound sequence (simulated — no real send).",
    }
