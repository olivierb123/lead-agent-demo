import React, { useState, useEffect } from 'react';
import { 
  Bot, Play, Pause, Database, Search, CheckCircle2, 
  Send, Sparkles, Building2, User, Phone, Mail, 
  RefreshCw, Check, Clock, AlertCircle, Edit3, X, Filter
} from 'lucide-react';

const initialLeads = [
  {
    id: 1,
    company: "Apex Design & Build",
    location: "Austin, TX",
    size: "18 Employees",
    revenue: "$4.2M",
    stage: "Qualify",
    owner: "Marcus Vance",
    role: "Managing Principal",
    email: "marcus@apexbuilds.com",
    phone: "+1 (512) 555-0193",
    status: "Ready to Dispatch",
    trigger: "Pulled commercial permit for 4th St remodel (3 days ago)",
    techStack: ["Excel", "QuickBooks Desktop"],
    pitchAngle: "Eliminating unapproved change orders on active multi-unit jobs",
    emailDraft: {
      subject: "Quick question regarding 4th St permit & change orders",
      body: "Marcus,\n\nNoticed the recent commercial permit filing for the 4th St project. Most remodelers running 10+ crew jobs tell us paper change orders cost them 3-5% margin per job.\n\nBuildFlow-Pro lets your field managers get digital sign-offs from clients on mobile before work begins.\n\nOpen to a 10-minute workflow walkthrough this Thursday?"
    }
  },
  {
    id: 2,
    company: "Blueline Custom Builders",
    location: "Denver, CO",
    size: "12 Employees",
    revenue: "$2.8M",
    stage: "Dispatched",
    owner: "Sarah Jenkins",
    role: "Founder & GC",
    email: "s.jenkins@bluebuilders.io",
    phone: "+1 (303) 555-0144",
    status: "Sequence Active",
    trigger: "Hiring for Project Coordinator on LinkedIn",
    techStack: ["Buildertrend", "Procore"],
    pitchAngle: "Reducing admin load so you don't need another back-office hire",
    emailDraft: {
      subject: "Streamlining site-to-office sync for Blueline",
      body: "Sarah,\n\nSaw you're scaling the project team in Denver. If you're looking to cut down administrative back-and-forth between job sites and QuickBooks without adding overhead, BuildFlow-Pro automates the bridge.\n\nWorth a quick 10-minute preview next week?"
    }
  },
  {
    id: 3,
    company: "Crestview Renovations",
    location: "Phoenix, AZ",
    size: "24 Employees",
    revenue: "$5.6M",
    stage: "Discover",
    owner: "David Ross",
    role: "President",
    email: "dross@crestviewreno.com",
    phone: "+1 (602) 555-0182",
    status: "Permit Ingested",
    trigger: "3 residential additions permitted in Maricopa County",
    techStack: ["Spreadsheets", "Manual Bidding"],
    pitchAngle: "Real-time crew labor tracking against initial estimate",
    emailDraft: {
      subject: "Labor cost tracking across your 3 Maricopa jobs",
      body: "David,\n\nCongrats on the 3 recent permits in Maricopa. When scaling multiple simultaneous residential additions, labor overruns usually hide until final billing.\n\nBuildFlow-Pro gives you daily labor burn tracking directly synced to your project estimates.\n\nOpen to seeing a quick preview?"
    }
  }
];

export default function App() {
  const [isRunning, setIsRunning] = useState(true);
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(1);
  const [filterStage, setFilterStage] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [dispatchedCount, setDispatchedCount] = useState(89);
  const [demosBooked, setDemosBooked] = useState(14);
  const [feeds, setFeeds] = useState([
    { id: 1, name: "Building Permit Data", count: "342 permits/wk", active: true },
    { id: 2, name: "State Contractor Licensing", count: "1.2k firms", active: true },
    { id: 3, name: "Google Maps & Places", count: "98% verified", active: true },
    { id: 4, name: "LinkedIn / Apollo Graph", count: "Synced", active: false }
  ]);

  const [logs, setLogs] = useState([
    { id: 1, time: "10:04:12", text: "Connected to Municipal Building Permit feed (Austin, TX)", type: "info" },
    { id: 2, time: "10:05:30", text: "Scraped apexbuilds.com/portfolio -> Identified 3 active sites", type: "info" },
    { id: 3, time: "10:06:02", text: "Enriched Owner profile -> Marcus Vance via Apollo API", type: "success" },
    { id: 4, time: "10:06:45", text: "LLM synthesis complete: Change-order friction hook generated", type: "ai" }
  ]);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const toggleFeed = (id) => {
    setFeeds(feeds.map(f => f.id === id ? { ...f, active: !f.active } : f));
    const feed = feeds.find(f => f.id === id);
    addLog(`Feed [${feed.name}] ${feed.active ? 'disabled' : 'enabled'} by operator`, "info");
  };

  const addLog = (text, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-8), { id: Date.now(), time, text, type }]);
  };

  const handleDispatch = () => {
    if (selectedLead.stage === "Dispatched") return;
    
    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, stage: "Dispatched", status: "Sequence Active" } : l));
    setDispatchedCount(prev => prev + 1);
    addLog(`Dispatched multi-channel sequence to ${selectedLead.owner} (${selectedLead.company})`, "success");
  };

  const handleAiRewrite = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setLeads(leads.map(l => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            emailDraft: {
              ...l.emailDraft,
              body: `${selectedLead.owner.split(' ')[0]},\n\nSaw your crew's recent project launch in ${selectedLead.location}. When managing ${selectedLead.size} across multiple job sites, unapproved change orders quickly eat into your 15% net margin.\n\nBuildFlow-Pro automates digital approvals in 30 seconds on mobile.\n\nWould 10 minutes on Thursday work for a quick look?`
            }
          };
        }
        return l;
      }));
      setIsRegenerating(false);
      addLog(`AI regenerated high-urgency hook for ${selectedLead.company}`, "ai");
    }, 700);
  };

  const filteredLeads = filterStage === 'All' 
    ? leads 
    : leads.filter(l => l.stage.toLowerCase() === filterStage.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white">LeadAgent.ai</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">AutoSDR v2</span>
            </div>
            <p className="text-xs text-slate-400">Campaign: BuildFlow-Pro (General Contractors & Remodelers)</p>
          </div>
        </div>

        {/* Global Agent Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-medium text-slate-300">
              {isRunning ? 'Autonomous Engine Active' : 'Pipeline Paused'}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsRunning(!isRunning);
              addLog(isRunning ? "Agent execution loop paused." : "Agent execution loop resumed.", "info");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              isRunning ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause Loop' : 'Resume Engine'}
          </button>
        </div>
      </header>

      {/* Main 3-Pane Interface */}
      <div className="flex-1 grid grid-cols-12 divide-x divide-slate-800 overflow-hidden">
        
        {/* PANE 1: Directive & Active Ingestion Feeds */}
        <div className="col-span-3 p-5 flex flex-col gap-5 overflow-y-auto bg-slate-900/20">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Autonomous Directive
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
              Target commercial/residential remodelers ($1M-$10M rev) with active municipal permit filings. Filter out single-trade subcontractors.
            </div>
          </div>

          {/* Clickable Feeds */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Ingestion Feeds
              </h3>
              <span className="text-[10px] text-slate-500">Toggle active</span>
            </div>
            <div className="space-y-2">
              {feeds.map((feed) => (
                <div 
                  key={feed.id}
                  onClick={() => toggleFeed(feed.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs border cursor-pointer transition-all ${
                    feed.active 
                      ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-slate-600' 
                      : 'bg-slate-950/40 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${feed.active ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className="font-medium">{feed.name}</span>
                  </div>
                  <span className="text-[11px] font-mono">{feed.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Funnel Stats */}
          <div className="mt-auto bg-gradient-to-b from-slate-900 to-indigo-950/30 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Live Throughput</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-xl font-bold text-white font-mono">{dispatchedCount}</div>
                <div className="text-[10px] text-slate-400">Outbound Sent</div>
              </div>
              <div 
                onClick={() => setDemosBooked(prev => prev + 1)}
                className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all"
                title="Click to simulate booked demo"
              >
                <div className="text-xl font-bold text-emerald-400 font-mono">{demosBooked}</div>
                <div className="text-[10px] text-slate-400">Demos Booked (+1)</div>
              </div>
            </div>
          </div>
        </div>

        {/* PANE 2: Live Activity, Filtering & Pipeline */}
        <div className="col-span-5 p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Interactive Pipeline Stage Filters */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Discover", count: leads.filter(l => l.stage === 'Discover').length, icon: Search },
              { label: "Qualify", count: leads.filter(l => l.stage === 'Qualify').length, icon: Sparkles },
              { label: "Dispatched", count: leads.filter(l => l.stage === 'Dispatched').length, icon: Send }
            ].map((step, i) => (
              <button
                key={i}
                onClick={() => setFilterStage(filterStage === step.label ? 'All' : step.label)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  filterStage === step.label 
                    ? 'bg-indigo-950/60 border-indigo-500' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <step.icon className={`w-4 h-4 mx-auto mb-1 ${filterStage === step.label ? 'text-indigo-300' : 'text-slate-400'}`} />
                <div className="text-xs font-semibold text-slate-200">{step.label}</div>
                <div className="text-[10px] text-slate-400 font-mono">{step.count} Accounts</div>
              </button>
            ))}
          </div>

          {/* Account Stream Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Discovered GCs ({filteredLeads.length})
            </h3>
            {filterStage !== 'All' && (
              <button 
                onClick={() => setFilterStage('All')}
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                Clear filter <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Lead List */}
          <div className="space-y-2.5">
            {filteredLeads.map(lead => (
              <div 
                key={lead.id} 
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedLead.id === lead.id 
                    ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="font-semibold text-sm text-white">{lead.company}</div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    lead.stage === 'Dispatched' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> {lead.location} • {lead.size} • {lead.revenue}
                </p>
                <div className="text-[11px] bg-slate-950/70 p-2 rounded text-slate-300 flex items-center gap-2 border border-slate-800/80">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{lead.trigger}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Agent Activity Terminal */}
          <div className="mt-auto bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px]">
            <div className="text-slate-500 pb-2 mb-2 border-b border-slate-900 flex items-center justify-between">
              <span>REASONING & EXECUTION LOG</span>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`} />
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={
                    log.type === 'ai' ? 'text-indigo-300 font-semibold' : 
                    log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANE 3: Lead Dossier, Dynamic Pitch & Actions */}
        <div className="col-span-4 p-5 flex flex-col gap-4 overflow-y-auto bg-slate-900/10">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Target Account Dossier</h3>
              <p className="text-xs text-slate-400">Contextual triggers extracted via Agent</p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              ID: {selectedLead.id}048
            </span>
          </div>

          {/* Owner Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                {selectedLead.owner.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{selectedLead.owner}</div>
                <div className="text-xs text-slate-400">{selectedLead.role} • {selectedLead.company}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{selectedLead.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedLead.phone}</span>
              </div>
            </div>
          </div>

          {/* AI Email Generation Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Touch 1 (AI Generated)
              </span>
              <button 
                onClick={handleAiRewrite}
                disabled={isRegenerating}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate Angle
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono mb-2 pb-2 border-b border-slate-800">
              Subject: {selectedLead.emailDraft.subject}
            </div>

            <textarea 
              value={selectedLead.emailDraft.body}
              onChange={(e) => {
                const updated = e.target.value;
                setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, emailDraft: { ...l.emailDraft, body: updated } } : l));
              }}
              rows={8}
              className="w-full text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-sans focus:outline-none focus:border-indigo-500 resize-none"
            />

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button 
                onClick={handleDispatch}
                disabled={selectedLead.stage === 'Dispatched'}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedLead.stage === 'Dispatched'
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                {selectedLead.stage === 'Dispatched' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Sequence Active
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Approve & Dispatch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}