import { useState, useEffect } from "react";
import {
  Network,
  Server,
  User,
  Check,
  Copy,
  Download,
  RefreshCw,
  Sliders,
  Database,
  UploadCloud,
  Sparkles,
  Code,
  AlertTriangle,
  CheckCircle,
  Eye,
  BookOpen,
  Terminal,
  Settings,
  Layers,
  Wifi,
  Cpu,
  ArrowRight,
  Info,
  X,
  FileCode,
  Globe,
  Lock,
  ChevronRight,
  Plus
} from "lucide-react";
import { UnifiNetwork, UnifiClient, UnifiPortForward, TerraformFiles, MappingOptions, ConnectionCredentials } from "./types";
import { mockNetworks, mockClients, mockPortForwards } from "./mockData";
import { generateTerraform } from "./tfGenerator";

// Modular UI views styled dynamically with geometric balance principles
import TopologyView from "./components/TopologyView";
import CodeEditorView from "./components/CodeEditorView";
import ConnectionView from "./components/ConnectionView";
import AiStudioView from "./components/AiStudioView";
import StatsSidebar from "./components/StatsSidebar";

// Highly immersive HCL live syntax highlighter for the Geometric Balance theme
const highlightStringsAndVars = (text: string) => {
  const regex = /(".*?"|true|false|\b\d+\b)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <span key={index} className="text-emerald-400">
          {part}
        </span>
      );
    } else if (part === "true" || part === "false" || /^\d+$/.test(part)) {
      return (
        <span key={index} className="text-amber-400 font-semibold font-mono">
          {part}
        </span>
      );
    } else {
      const matchEquals = part.split("=");
      if (matchEquals.length > 1) {
        return (
          <span key={index}>
            <span className="text-slate-300">{matchEquals[0]}</span>
            <span className="text-blue-400 font-semibold">=</span>
            <span className="text-slate-200">{matchEquals.slice(1).join("=")}</span>
          </span>
        );
      }
      return <span key={index} className="text-slate-300">{part}</span>;
    }
  });
};

const renderHclLine = (line: string) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return <span className="text-slate-500 italic font-mono">{line}</span>;
  }
  
  const resourceRegex = /^(resource|variable|provider|terraform|output|locals|data)\b/;
  if (resourceRegex.test(trimmed)) {
    const match = trimmed.match(/^(resource|variable|provider|terraform|output|locals|data)/);
    const keyword = match ? match[0] : "";
    const rest = line.substring(line.indexOf(keyword) + keyword.length);
    const prefix = line.substring(0, line.indexOf(keyword));
    return (
      <span className="font-mono">
        <span className="text-slate-300">{prefix}</span>
        <span className="text-blue-400 font-semibold">{keyword}</span>
        {highlightStringsAndVars(rest)}
      </span>
    );
  }
  return <span className="font-mono">{highlightStringsAndVars(line)}</span>;
};

export default function App() {
  // Loaded Config Data
  const [networks, setNetworks] = useState<UnifiNetwork[]>(mockNetworks);
  const [clients, setClients] = useState<UnifiClient[]>(mockClients);
  const [portForwards, setPortForwards] = useState<UnifiPortForward[]>(mockPortForwards);

  // Mapping configurations
  const [options, setOptions] = useState<MappingOptions>({
    prefix: "unifi",
    onlyFixedIps: true,
    parameterizeSubnets: true,
    includeClients: true,
    unresolvedNetworkFallback: "lan"
  });

  // Checklist states
  const [activeNetworkIds, setActiveNetworkIds] = useState<string[]>(
    mockNetworks.map((net) => net._id)
  );
  const [activeClientMacs, setActiveClientMacs] = useState<string[]>(
    mockClients.map((c) => c.mac)
  );
  const [activePortForwardIds, setActivePortForwardIds] = useState<string[]>(
    mockPortForwards.map((pf) => pf._id)
  );

  // Connection credentials for the API proxy
  const [credentials, setCredentials] = useState<ConnectionCredentials>({
    url: "https://192.168.1.1",
    username: "admin",
    password: "",
    siteName: "default"
  });

  // Code editor file selection
  const [selectedFile, setSelectedFile] = useState<keyof TerraformFiles>("networks.tf");

  // UI Tabs & settings panel
  const [activeTab, setActiveTab] = useState<"topology" | "editor" | "connection" | "ai">("topology");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Search/Filters in UI
  const [networkSearch, setNetworkSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>("all");

  // API query state feedback
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authCookie, setAuthCookie] = useState<string | null>(null);

  // Manual JSON raw paste fields
  const [networksPaste, setNetworksPaste] = useState("");
  const [clientsPaste, setClientsPaste] = useState("");
  const [portForwardsPaste, setPortForwardsPaste] = useState("");
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Generated code state
  const [tfFiles, setTfFiles] = useState<TerraformFiles>({
    "providers.tf": "",
    "variables.tf": "",
    "networks.tf": "",
    "clients.tf": "",
    "port_forwards.tf": ""
  });

  // AI chat states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // UI toast feedback
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Automatically recalculate HCL whenever networks, clients, options, or checked states change
  useEffect(() => {
    const generated = generateTerraform(
      networks,
      clients,
      portForwards,
      options,
      activeNetworkIds,
      activeClientMacs,
      activePortForwardIds,
      credentials.siteName
    );
    setTfFiles(generated);
  }, [networks, clients, portForwards, options, activeNetworkIds, activeClientMacs, activePortForwardIds, credentials.siteName]);

  // Handle direct authentication proxy login
  const handleApiConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    setConnectionSuccess(null);

    try {
      const loginRes = await fetch("/api/unifi/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: credentials.url,
          username: credentials.username,
          password: credentials.password
        })
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error || "Failed to log in to UniFi Controller host");
      }

      const cookie = loginData.cookie;
      setAuthCookie(cookie);

      // Successfully logged in, now grab networks and client dumps
      const networksPayload = await fetch("/api/unifi/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: credentials.url,
          cookie: cookie,
          siteName: credentials.siteName
        })
      });

      const networksData = await networksPayload.json();
      const loadedNetworks: UnifiNetwork[] = networksData.data || networksData || [];

      const clientsPayload = await fetch("/api/unifi/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: credentials.url,
          cookie: cookie,
          siteName: credentials.siteName
        })
      });

      const clientsData = await clientsPayload.json();
      const loadedClients: UnifiClient[] = clientsData.data || clientsData || [];

      const portForwardsPayload = await fetch("/api/unifi/portforward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: credentials.url,
          cookie: cookie,
          siteName: credentials.siteName
        })
      });

      const portForwardsData = await portForwardsPayload.json();
      const loadedPortForwards: UnifiPortForward[] = portForwardsData.data || portForwardsData || [];

      if (!Array.isArray(loadedNetworks)) {
        throw new Error("Invalid networks payload retrieved. Check API site profile settings.");
      }

      setNetworks(loadedNetworks);
      setActiveNetworkIds(loadedNetworks.map((n) => n._id));

      if (Array.isArray(loadedClients)) {
        setClients(loadedClients);
        setActiveClientMacs(loadedClients.map((c) => c.mac));
      }

      if (Array.isArray(loadedPortForwards)) {
        setPortForwards(loadedPortForwards);
        setActivePortForwardIds(loadedPortForwards.map((pf) => pf._id));
      }

      setConnectionSuccess(true);
      setActiveTab("topology");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || String(err));
      setConnectionSuccess(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Process pasted client & network JSON configurations directly
  const handleManualImport = () => {
    setImportStatus(null);
    try {
      let parsedNetworks: UnifiNetwork[] = [];
      let parsedClients: UnifiClient[] = [];
      let parsedPortForwards: UnifiPortForward[] = [];

      if (!networksPaste.trim()) {
        throw new Error("Networks JSON must be provided for initial configuration mappings.");
      }

      try {
        const parsed = JSON.parse(networksPaste);
        // Sometimes UniFi exports are wrapped in a { data: [...] } structure
        parsedNetworks = Array.isArray(parsed) ? parsed : parsed.data || [];
      } catch (e) {
        throw new Error("Failed to parse Networks JSON. Ensure it is a valid JSON array.");
      }

      if (clientsPaste.trim()) {
        try {
          const parsed = JSON.parse(clientsPaste);
          parsedClients = Array.isArray(parsed) ? parsed : parsed.data || [];
        } catch (e) {
          throw new Error("Failed to parse Client Devices JSON. Ensure it is a valid JSON array.");
        }
      }

      if (portForwardsPaste.trim()) {
        try {
          const parsed = JSON.parse(portForwardsPaste);
          parsedPortForwards = Array.isArray(parsed) ? parsed : parsed.data || [];
        } catch (e) {
          throw new Error("Failed to parse Port Forwards JSON. Ensure it is a valid JSON array.");
        }
      }

      if (!Array.isArray(parsedNetworks) || parsedNetworks.length === 0) {
        throw new Error("Networks JSON parses correctly but does not contain a list of networks objects.");
      }

      setNetworks(parsedNetworks);
      setActiveNetworkIds(parsedNetworks.map((n) => n._id));

      setClients(parsedClients);
      setActiveClientMacs(parsedClients.map((c) => c.mac));

      setPortForwards(parsedPortForwards);
      setActivePortForwardIds(parsedPortForwards.map((pf) => pf._id));

      setImportStatus({
        success: true,
        msg: `Successfully imported ${parsedNetworks.length} networks, ${parsedClients.length} client devices, and ${parsedPortForwards.length} port forwarding rules!`
      });
      setActiveTab("topology");
    } catch (err: any) {
      setImportStatus({
        success: false,
        msg: err.message || "Unknown schema mapping parsing error."
      });
    }
  };

  // Run AI HCL Refactor Optimization with Gemini
  const handleAiRefactor = async (customPrompt?: string) => {
    setIsOptimizing(true);
    setAiResponse(null);
    const chosenPrompt = customPrompt || aiPrompt;

    if (!chosenPrompt.trim()) {
      setIsOptimizing(false);
      return;
    }

    try {
      const response = await fetch("/api/gemini/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: tfFiles,
          prompt: chosenPrompt
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to make optimized synthesis request");
      }

      if (data.success && data.files) {
        setTfFiles(data.files);
        setAiResponse("Successfully optimized! The changes have been compiled directly into your Active Workspace files below.");
        setAiPrompt("");
      } else {
        throw new Error("Invalid file output returned from optimization model");
      }
    } catch (err: any) {
      console.error(err);
      setAiResponse(`Refactoring failed: ${err.message || err}. Ensure your API secret key is configured correctly.`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Download a single generated .tf file
  const downloadFile = (fileName: keyof TerraformFiles, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all files sequentially as individual downloads
  const downloadAllFiles = () => {
    Object.entries(tfFiles).forEach(([name, content]) => {
      downloadFile(name as keyof TerraformFiles, content as string);
    });
  };

  // Reset current config data to mock default demo values
  const loadDemoConfig = () => {
    setNetworks(mockNetworks);
    setClients(mockClients);
    setPortForwards(mockPortForwards);
    setActiveNetworkIds(mockNetworks.map((n) => n._id));
    setActiveClientMacs(mockClients.map((c) => c.mac));
    setActivePortForwardIds(mockPortForwards.map((pf) => pf._id));
    setImportStatus({
      success: true,
      msg: "Loaded pristine Demo Office network dataset representing UDM configuration."
    });
  };

  // Search filtered networks
  const filteredNetworks = networks.filter((net) => {
    const term = networkSearch.toLowerCase();
    return (
      net.name.toLowerCase().includes(term) ||
      (net.purpose || "").toLowerCase().includes(term) ||
      (net.ip_subnet || "").includes(term) ||
      (net.vlan?.toString() || "").includes(term)
    );
  });

  // Group clients by network for easier mapping visualization
  const getClientsForNetwork = (netId: string) => {
    return clients.filter((c) => c.network_id === netId);
  };

  // Compute stats
  const selectedNetworkCount = activeNetworkIds.filter(id => networks.some(n => n._id === id)).length;
  const selectedClientCount = activeClientMacs.filter(mac => clients.some(c => c.mac === mac)).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans antialiased flex flex-col selection:bg-emerald-500/20 selection:text-white" id="unifi2tf-root">
      {/* Top Banner Navigation styled with Geometric Balance */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 shrink-0" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between font-sans">
          <div className="flex items-center gap-3" id="brand-panel">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-bold font-mono tracking-tight text-sm select-none">
              UT
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-mono uppercase">
                UniFi<span className="text-emerald-500">2Terraform</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none font-mono mt-0.5">IAC COMPILER</p>
            </div>
          </div>

          <div className="flex items-center gap-4" id="header-status-panel">
            <span className="flex items-center gap-2 text-[10px] font-mono bg-slate-950 px-3 py-1.5 rounded border border-slate-800 select-none">
              <span className={`w-2 h-2 rounded-full ${networks === mockNetworks ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
              CONTROLLER: {credentials.url.replace(/^https?:\/\//, "") || "192.168.1.1"}
            </span>
            <button
              id="header-btn-toggle-options"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 hover:text-white text-slate-200 text-[11px] font-bold uppercase tracking-wider rounded transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Mapping Options</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 font-sans" id="workspace-layout">
        
        {/* Left Interactive panel / view selections */}
        <div className="flex-1 flex flex-col gap-6 lg:max-w-[65%]" id="interactive-workspace-pane">
          
          {/* Navigation/View Router Tabs */}
          <div className="bg-slate-950 p-1 rounded border border-slate-800 flex flex-wrap gap-1" id="workspace-view-tabs">
            <button
              id="tab-btn-topology"
              onClick={() => setActiveTab("topology")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "topology"
                  ? "bg-emerald-600 text-white font-extrabold shadow"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-250"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              VLAN Matrix ({selectedNetworkCount}/{networks.length})
            </button>
            <button
              id="tab-btn-editor"
              onClick={() => setActiveTab("editor")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "editor"
                  ? "bg-emerald-600 text-white font-extrabold shadow"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-255"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Terraform files
            </button>
            <button
              id="tab-btn-connection"
              onClick={() => setActiveTab("connection")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "connection"
                  ? "bg-emerald-600 text-white font-extrabold shadow"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-255"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Connection Links
            </button>
            <button
              id="tab-btn-ai"
              onClick={() => setActiveTab("ai")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-emerald-600 text-white font-extrabold shadow"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-255"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Optimizer
            </button>
          </div>

          {/* Tab Subviews */}
          {activeTab === "topology" && (
            <TopologyView
              networks={networks}
              activeNetworkIds={activeNetworkIds}
              setActiveNetworkIds={setActiveNetworkIds}
              activeClientMacs={activeClientMacs}
              setActiveClientMacs={setActiveClientMacs}
              portForwards={portForwards}
              activePortForwardIds={activePortForwardIds}
              setActivePortForwardIds={setActivePortForwardIds}
              networkSearch={networkSearch}
              setNetworkSearch={setNetworkSearch}
              filteredNetworks={filteredNetworks}
              getClientsForNetwork={getClientsForNetwork}
            />
          )}

          {activeTab === "editor" && (
            <CodeEditorView
              tfFiles={tfFiles}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              copiedFile={copiedFile}
              copyToClipboard={copyToClipboard}
              downloadFile={downloadFile}
              downloadAllFiles={downloadAllFiles}
              renderHclLine={renderHclLine}
            />
          )}

          {activeTab === "connection" && (
            <ConnectionView
              credentials={credentials}
              setCredentials={setCredentials}
              isConnecting={isConnecting}
              connectionSuccess={connectionSuccess}
              errorMessage={errorMessage}
              handleApiConnect={handleApiConnect}
              networksPaste={networksPaste}
              setNetworksPaste={setNetworksPaste}
              clientsPaste={clientsPaste}
              setClientsPaste={setClientsPaste}
              portForwardsPaste={portForwardsPaste}
              setPortForwardsPaste={setPortForwardsPaste}
              importStatus={importStatus}
              handleManualImport={handleManualImport}
              loadDemoConfig={loadDemoConfig}
              copyToClipboard={copyToClipboard}
            />
          )}

          {activeTab === "ai" && (
            <AiStudioView
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              isOptimizing={isOptimizing}
              aiResponse={aiResponse}
              handleAiRefactor={handleAiRefactor}
            />
          )}

        </div>

        {/* Right Sidebar: Active Configuration Statistics & Real-time Options Container */}
        <div className="lg:w-[35%] flex flex-col gap-6 shrink-0" id="sidebar-pane">
          <StatsSidebar
            selectedNetworkCount={selectedNetworkCount}
            networksCount={networks.length}
            selectedClientCount={selectedClientCount}
            clientsCount={clients.length}
            options={options}
            setOptions={setOptions}
            setSelectedFile={setSelectedFile}
            setActiveTab={setActiveTab}
            downloadAllFiles={downloadAllFiles}
            tfFiles={tfFiles}
          />
        </div>

      </main>

      {/* Slide-out Mapping Settings Panel primarily for Mobile/Responsive widths */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex justify-end animate-fade-in" id="mobile-sidebar-backdrop">
          <div className="bg-slate-950 text-slate-300 w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-800" id="mobile-sidebar-drawer">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-slate-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider font-mono text-sm">Scope Settings</h3>
                </div>
                <button
                  id="mobile-drawer-btn-close"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-500 hover:text-white p-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Duplicate settings inside simple container for mobile navigation */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Resource Prefix</label>
                  <input
                    id="inp-mobile-prefix"
                    type="text"
                    value={options.prefix}
                    onChange={(e) => setOptions({ ...options, prefix: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-emerald-450 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-slate-900">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Parameterize Subnets</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Extract subnets as variables</span>
                  </div>
                  <input
                    id="chk-mobile-param"
                    type="checkbox"
                    checked={options.parameterizeSubnets}
                    onChange={(e) => setOptions({ ...options, parameterizeSubnets: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-slate-900">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Map Client Devices</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Generate client HCL structures</span>
                  </div>
                  <input
                    id="chk-mobile-clients"
                    type="checkbox"
                    checked={options.includeClients}
                    onChange={(e) => setOptions({ ...options, includeClients: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </div>

                {options.includeClients && (
                  <div className="flex items-center justify-between py-3 pl-3 border-l text-slate-350 border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">Only Fixed IP allocations</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Omit generic client lists</span>
                    </div>
                    <input
                      id="chk-mobile-fixed"
                      type="checkbox"
                      checked={options.onlyFixedIps}
                      onChange={(e) => setOptions({ ...options, onlyFixedIps: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              id="mobile-drawer-btn-apply"
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 px-4 rounded text-xs uppercase font-mono tracking-wider transition cursor-pointer"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* Structured Dark Status Bar Footer styled strictly as "Geometric Balance" */}
      <footer className="h-8 border-t border-slate-800 bg-slate-950 px-6 flex items-center justify-between shrink-0 select-none" id="layout-footer">
        <div className="flex items-center gap-4 text-[9px] text-slate-500 font-mono font-bold tracking-wider">
          <span>STATUS: READY</span>
          <span>|</span>
          <span>SYNC: ACTIVE</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-slate-500 font-mono font-bold tracking-wider">
          <span>UNICONNECT v2.4.1</span>
          <span className="text-emerald-500">● SECURE SEAMLESS</span>
        </div>
      </footer>
    </div>
  );
}
