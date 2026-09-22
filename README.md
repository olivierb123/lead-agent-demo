# LeadAgent.ai — Autonomous SDR Console Demo

An interactive, high-fidelity console demonstrating an end-to-end autonomous B2B lead identification, qualification, and appointment-setting agent tailored for vertical SaaS (construction, remodelers, and general contractors).

The UI is a **Vite + React + Tailwind CSS v4** frontend. It's backed by a **real agent** — built on Microsoft Agent Framework, hosted as a **Foundry Hosted Agent** on Microsoft Foundry — that ingests mock permit feeds, qualifies leads, drafts pitch emails, and dispatches outreach sequences via genuine tool calls, streamed live into the UI.

---

<img width="1901" height="950" alt="lead-agent-ss" src="https://github.com/user-attachments/assets/e4b639a5-e0c9-41a0-8d31-206ce298d225" />

## Key Features

- **3-Pane Command Architecture:**
  - **Pane 1 (Strategy & Feeds):** Natural-language agent directives, live municipal permit and registry ingestion toggles, and real-time funnel throughput.
  - **Pane 2 (Runtime & Trace):** Multi-stage filtering (`Discover` → `Qualify` → `Dispatched`), real-time agent execution terminal, and lead stream cards.
  - **Pane 3 (Lead Dossier & Pitch):** Enriched decision-maker contact details, AI-tailored contextual hooks based on recent permit filings, inline copy editing, and one-click sequence dispatch.
- **Real Agent Runtime:** Every "running" toggle, dispatch, and pitch regeneration drives an actual agent turn (Microsoft Agent Framework, `gpt-4o` on Microsoft Foundry) with 4 tools — `ingest_permits`, `qualify_lead`, `generate_pitch_email`, `dispatch_sequence` — streamed token-by-token into the terminal pane over the Foundry Responses protocol.

---

## Architecture

```text
Browser
  │  same-origin fetch("/api/responses")
  ▼
Azure Static Web App (frontend: dist/, backend: api/)
  │  Function proxy acquires an Entra token (service principal)
  │  and forwards the request, streaming the response back through
  ▼
Microsoft Foundry Hosted Agent  (agent/, Responses protocol on /responses)
  │  Microsoft Agent Framework Agent + 4 tools
  ▼
Foundry gpt-4o model deployment
```

- **Frontend** (`src/`) — the React console. Talks only to its own origin (`/api/responses`); it never calls Foundry directly.
- **`api/`** — an Azure Function (Node.js v4 model) deployed alongside the frontend as SWA "managed functions." Reverse-proxies `POST /api/responses` to the Foundry Hosted Agent's `/responses` endpoint, forwarding an Entra access token acquired via a service principal (`ClientSecretCredential`). This exists because Foundry's `ResponsesHostServer` has no CORS support — the proxy makes the browser's call same-origin, and keeps the real Foundry URL and credentials server-side only.
- **`agent/`** — the agent itself: a Microsoft Agent Framework `Agent` (instructions + 4 tools in `tools.py`), wrapped in `server.py`'s `ResponsesHostServer` and deployed to Foundry as a **Hosted Agent** via `azd` (no Dockerfile, Container App, or Bicep authored by hand — `azd` owns all of that). Foundry manages the runtime, scaling, session/conversation state, and the agent's own managed identity.

---

## Tech Stack

**Frontend**
- React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons

**Agent** (`agent/`)
- Python, [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) (`agent-framework[azure-ai]`, `agent-framework-foundry`, `agent-framework-foundry-hosting`)
- Deployed as a Microsoft Foundry Hosted Agent via `azd`

**API proxy** (`api/`)
- Azure Functions v4 programming model (Node.js), `@azure/identity` for token acquisition

---

## Getting Started (local dev)

Local dev runs all three pieces side by side: the agent server, the Function proxy (optional locally — see below), and the Vite dev server.

### Prerequisites

- Node.js v18+ and npm
- Python 3.11+ and a Foundry project you have access to (or reuse an existing one)
- [`azd`](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd) with the `azure.ai.agents` extension, for deploying/running the agent

### 1. Run the agent

```bash
cd agent
cp .env.example .env   # fill in FOUNDRY_PROJECT_ENDPOINT and AZURE_AI_MODEL_DEPLOYMENT_NAME
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
az login   # DefaultAzureCredential picks this up locally
python server.py
```

This serves the Responses protocol on `http://localhost:8088/responses`. Smoke test it directly:

```bash
curl -X POST http://localhost:8088/responses -d '{"input":"say hello"}'
```

### 2. Run the frontend

```bash
cp .env.example .env   # VITE_AGENT_URL=/responses is correct for local dev
npm install
npm run dev
```

`vite.config.js` proxies `/responses` straight to the locally running agent (port 8088), so no Function proxy is needed for local development. Open `http://localhost:5173`, toggle "running," and watch real tool calls stream into the terminal pane.

### 3. (Optional) Run the Function proxy locally

Only needed if you want to test the same-origin proxy path itself (e.g. before deploying):

```bash
cd api
cp local.settings.json.example local.settings.json   # fill in AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET and FOUNDRY_AGENT_URL
npm install
func start
```

---

## Deployment

The app deploys as two independent pieces:

1. **Agent → Microsoft Foundry Hosted Agent**, via `azd` from `agent/`:
   ```bash
   azd auth login
   azd provision   # reuses an existing Foundry project if one is configured, else provisions one
   azd deploy
   ```
   `azd deploy` prints the hosted agent's `/responses` endpoint — this becomes `FOUNDRY_AGENT_URL` for the Function proxy below.

2. **Frontend + Function proxy → Azure Static Web Apps**, via the GitHub Actions workflow at `.github/workflows/azure-static-web-apps.yml` (triggers on push to `main`). One combined workflow builds `dist/` and the `api/` Function together (SWA "managed functions").

   Required GitHub Actions secret:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` — the SWA deployment token (`az staticwebapp secrets list`)

   Required Static Web App application settings (`az staticwebapp appsettings set`), since the proxy authenticates to Foundry as a service principal rather than via managed identity — SWA's managed-functions sandbox doesn't expose the `IDENTITY_HEADER`/`MSI_SECRET` a system-assigned managed identity needs:
   - `FOUNDRY_AGENT_URL` — the deployed agent's `/responses` endpoint
   - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — a service principal scoped to the **Cognitive Services User** role on the Foundry resource (`az ad sp create-for-rbac --role "Cognitive Services User" --scopes <foundry-resource-id>`)

---

## Project Structure

```text
lead-agent-demo/
├── src/
│   ├── App.jsx           # Core 3-pane command dashboard, wired to the real agent
│   ├── agentClient.js    # Responses-protocol client: SSE parsing, previous_response_id chaining
│   ├── index.css         # Tailwind CSS entrypoint (@import "tailwindcss")
│   └── main.jsx          # React root mount
├── agent/
│   ├── agent.py           # Agent construction: instructions, tools, Foundry chat client
│   ├── tools.py            # 4 tool functions: ingest_permits, qualify_lead, generate_pitch_email, dispatch_sequence
│   ├── server.py           # ResponsesHostServer entrypoint (Foundry Hosted Agent)
│   ├── run.py               # Standalone CLI chat loop (local-only, bypasses hosting)
│   ├── azure.yaml           # azd manifest
│   └── requirements.txt
├── api/
│   ├── src/functions/responsesProxy.js  # Same-origin reverse proxy → Foundry /responses
│   ├── host.json
│   └── package.json
├── staticwebapp.config.json   # SPA fallback + API routing for Azure Static Web Apps
├── .github/workflows/azure-static-web-apps.yml  # Combined build+deploy workflow
├── index.html
├── package.json
├── vite.config.js         # Vite + Tailwind v4 plugin config; proxies /responses in local dev
└── README.md
```

## License

MIT
