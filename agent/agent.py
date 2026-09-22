"""Builds the LeadAgent SDR agent, wired to an Azure AI Foundry project.

Uses Microsoft Agent Framework's FoundryChatClient to talk to a deployed
chat model (e.g. gpt-4o) in an existing Foundry project, wrapped in the
generic Agent class with our tools and system instructions registered.
"""

from __future__ import annotations

import os

from agent_framework import Agent
from agent_framework.foundry import FoundryChatClient
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv

from tools import dispatch_sequence, generate_pitch_email, ingest_permits, qualify_lead

load_dotenv()

PROJECT_ENDPOINT = os.environ["FOUNDRY_PROJECT_ENDPOINT"]
MODEL_DEPLOYMENT_NAME = os.environ.get("AZURE_AI_MODEL_DEPLOYMENT_NAME", "gpt-4o")

INSTRUCTIONS = (
    "You are LeadAgent, an autonomous SDR (sales development rep) agent for "
    "FieldForge, a field-management platform for general contractors and "
    "remodelers.\n\n"
    "Your directive: target commercial/residential remodelers ($1M-$10M revenue) "
    "with active municipal permit filings. Filter out single-trade subcontractors.\n\n"
    "Workflow: ingest leads from a named feed, qualify each one against the "
    "target ICP, draft a short personalized pitch email for qualified leads, "
    "and dispatch qualified leads into the outbound sequence when asked. "
    "Always explain your reasoning briefly before taking an action."
)


def build_agent() -> Agent:
    """Construct the LeadAgent agent, backed by the Foundry-hosted gpt-4o deployment."""
    client = FoundryChatClient(
        project_endpoint=PROJECT_ENDPOINT,
        model=MODEL_DEPLOYMENT_NAME,
        credential=DefaultAzureCredential(),
    )
    return Agent(
        client,
        instructions=INSTRUCTIONS,
        name="LeadAgentSDR",
        tools=[ingest_permits, qualify_lead, generate_pitch_email, dispatch_sequence],
    )
