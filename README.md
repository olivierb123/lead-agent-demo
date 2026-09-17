# LeadAgent.ai — Autonomous SDR Console Demo

An interactive, high-fidelity UI prototype demonstrating an end-to-end autonomous B2B lead identification, qualification, and appointment-setting agent tailored for vertical SaaS (construction, remodelers, and general contractors).

Built using **Vite**, **React**, and **Tailwind CSS v4**.

---

## Key Features

- **3-Pane Command Architecture:**
  - **Pane 1 (Strategy & Feeds):** Natural-language agent directives, live municipal permit and registry ingestion toggles, and real-time funnel throughput.
  - **Pane 2 (Runtime & Trace):** Multi-stage filtering (`Discover` → `Qualify` → `Dispatched`), real-time agent execution terminal, and lead stream cards.
  - **Pane 3 (Lead Dossier & Pitch):** Enriched decision-maker contact details, AI-tailored contextual hooks based on recent permit filings, inline copy editing, and one-click sequence dispatch.
- **Simulated Agent Runtime:** Client-side event loop simulating background crawling, intent detection, and waterfall verification without requiring an active backend or API keys.

---

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`
- **Icons:** Lucide React (`lucide-react`)

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or later recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/](https://github.com/)<your-username>/lead-agent-demo.git
   cd lead-agent-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## Project Structure

```text
lead-agent-demo/
├── src/
│   ├── App.jsx         # Core 3-pane command dashboard & state simulation
│   ├── index.css       # Tailwind CSS entrypoint (@import "tailwindcss")
│   └── main.jsx        # React root mount
├── index.html          # HTML entry shell
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite + Tailwind v4 plugin configuration
├── .gitignore          # Standard repository exclusions
└── README.md           # Documentation
```

## License

MIT