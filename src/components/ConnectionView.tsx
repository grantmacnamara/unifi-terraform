import { Wifi, AlertTriangle, CheckCircle, Terminal, UploadCloud, BookOpen, Copy } from "lucide-react";
import { ConnectionCredentials } from "../types";

interface ConnectionViewProps {
  credentials: ConnectionCredentials;
  setCredentials: (creds: ConnectionCredentials) => void;
  isConnecting: boolean;
  connectionSuccess: boolean | null;
  errorMessage: string | null;
  handleApiConnect: () => void;
  networksPaste: string;
  setNetworksPaste: (s: string) => void;
  clientsPaste: string;
  setClientsPaste: (s: string) => void;
  portForwardsPaste: string;
  setPortForwardsPaste: (s: string) => void;
  importStatus: { success?: boolean; msg?: string } | null;
  handleManualImport: () => void;
  loadDemoConfig: () => void;
  copyToClipboard: (text: string, label: string) => void;
}

export default function ConnectionView({
  credentials,
  setCredentials,
  isConnecting,
  connectionSuccess,
  errorMessage,
  handleApiConnect,
  networksPaste,
  setNetworksPaste,
  clientsPaste,
  setClientsPaste,
  portForwardsPaste,
  setPortForwardsPaste,
  importStatus,
  handleManualImport,
  loadDemoConfig,
  copyToClipboard,
}: ConnectionViewProps) {
  return (
    <div className="flex flex-col gap-6" id="connection-view-container">
      
      {/* Dynamic API Proxy Connection Block */}
      <div className="bg-slate-950/50 p-5 rounded border border-slate-800 flex flex-col gap-4" id="api-proxy-card">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900">
          <div className="bg-emerald-950/40 text-emerald-400 p-2 rounded border border-emerald-900/40">
            <Wifi className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Direct Controller Connection</h3>
            <p className="text-[11px] text-slate-500 font-medium">Link with static live settings to synchronize UniFi controller profiles instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="credentials-form">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Controller Host URL</label>
            <input
              id="inp-controller-url"
              type="text"
              placeholder="e.g. https://192.168.1.1:8443"
              value={credentials.url}
              onChange={(e) => setCredentials({ ...credentials, url: e.target.value })}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Site Name</label>
            <input
              id="inp-site-name"
              type="text"
              placeholder="default"
              value={credentials.siteName}
              onChange={(e) => setCredentials({ ...credentials, siteName: e.target.value })}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Admin Username</label>
            <input
              id="inp-admin-username"
              type="text"
              placeholder="Username / Email"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Admin Password</label>
            <input
              id="inp-admin-password"
              type="password"
              placeholder="Password token"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 rounded flex items-start gap-3" id="connection-error">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-red-400">Connection Failed</h4>
              <p className="text-red-300 mt-1 font-mono leading-relaxed">{errorMessage}</p>
              <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Why this happens:</h5>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Because UniFi controllers operate behind secure private LAN configurations (NAT), cloud web clients cannot establish connections to private IP routes. Simply run the step-by-step commands on your local device below, then paste the exported files!
              </p>
            </div>
          </div>
        )}

        {connectionSuccess && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded flex items-center gap-2" id="connection-ok">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
            <span className="text-xs font-bold text-emerald-400 font-mono">Credentials mapped successfully! Syncing VLAN allocations...</span>
          </div>
        )}

        <button
          id="btn-trigger-api-connect"
          onClick={handleApiConnect}
          disabled={isConnecting}
          className="mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-white font-bold py-2.5 px-4 rounded border border-slate-755 transition-all cursor-pointer font-mono text-xs uppercase tracking-wider"
        >
          {isConnecting ? "Scanning Client Pools..." : "Run Active Discovery Sync"}
        </button>
      </div>

      {/* CLI commands copy widget */}
      <div className="bg-slate-950/50 p-5 rounded border border-slate-800 flex flex-col gap-4" id="cli-exports-card">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900">
          <div className="bg-slate-905 border border-slate-800 text-slate-400 p-2 rounded">
            <Terminal className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Direct CLI Data Export (Guaranteed)</h3>
            <p className="text-[11px] text-slate-550 font-mono">Execute these lookup queries inside your local terminal to access configuration templates</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded font-mono text-[11px] leading-relaxed text-slate-400 flex flex-col gap-4 border border-slate-900" id="curl-steps-panel">
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
              <span>Step 1: Authenticate against local controller API</span>
              <button
                id="btn-copy-curl-1"
                onClick={() => copyToClipboard(`curl -k -c cookies.txt -X POST ${credentials.url || "https://127.0.0.1"}/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"username": "${credentials.username || "admin"}", "password": "your_password"}'`, "curl_1")}
                className="text-slate-500 hover:text-white flex items-center gap-1 transition-all cursor-pointer font-bold"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <code className="text-emerald-450 block text-left break-all bg-slate-950/40 p-1">
              {`curl -k -c cookies.txt -X POST ${credentials.url || "https://127.0.0.1"}/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"username": "${credentials.username || "admin"}", "password": "your_password"}'`}
            </code>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
              <span>Step 2: Pull VLANs mapping schema</span>
              <button
                id="btn-copy-curl-2"
                onClick={() => copyToClipboard(`curl -k -b cookies.txt -X GET ${credentials.url || "https://127.0.0.1"}/proxy/network/api/s/${credentials.siteName || "default"}/rest/networkconf > unifi_networks.json`, "curl_2")}
                className="text-slate-500 hover:text-white flex items-center gap-1 transition-all cursor-pointer font-bold"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <code className="text-emerald-450 block break-all bg-slate-950/40 p-1">
              {`curl -k -b cookies.txt -X GET ${credentials.url || "https://127.0.0.1"}/proxy/network/api/s/${credentials.siteName || "default"}/rest/networkconf > unifi_networks.json`}
            </code>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
              <span>Step 3: Extract client IP allocations (Optional)</span>
              <button
                id="btn-copy-curl-3"
                onClick={() => copyToClipboard(`curl -k -b cookies.txt -X GET ${credentials.url || "https://127.0.0.1"}/proxy/network/api/s/${credentials.siteName || "default"}/stat/sta > unifi_clients.json`, "curl_3")}
                className="text-slate-500 hover:text-white flex items-center gap-1 transition-all cursor-pointer font-bold"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <code className="text-emerald-450 block break-all bg-slate-950/40 p-1">
              {`curl -k -b cookies.txt -X GET ${credentials.url || "https://127.0.0.1"}/proxy/network/api/s/${credentials.siteName || "default"}/stat/sta > unifi_clients.json`}
            </code>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
              <span>Step 4: Extract port forwarding rules (Optional)</span>
              <button
                id="btn-copy-curl-4"
                onClick={() => copyToClipboard(`curl -k -b cookies.txt -X GET ${credentials.url || "https://127.0.0.1"}/proxy/network/api/s/${credentials.siteName || "default"}/rest/portforward > unifi_portforward.json`, "curl_4")}
                className="text-slate-500 hover:text-white flex items-center gap-1 transition-all cursor-pointer font-bold"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <code className="text-emerald-450 block break-all bg-slate-950/40 p-1">
              {`curl -k -b cookies.txt -X GET ${credentials.url || "https://127.0.0.1"}/proxy/network/api/s/${credentials.siteName || "default"}/rest/portforward > unifi_portforward.json`}
            </code>
          </div>
        </div>

        {/* Text Area upload controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="paste-textareas-container">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">VLAN Networks JSON (unifi_networks.json)</label>
            <textarea
              id="raw-networks-paste"
              rows={5}
              placeholder="Paste contents of unifi_networks.json here..."
              value={networksPaste}
              onChange={(e) => setNetworksPaste(e.target.value)}
              className="p-3 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-650"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">Client Devices JSON (unifi_clients.json) - Optional</label>
            <textarea
              id="raw-clients-paste"
              rows={5}
              placeholder="Paste contents of unifi_clients.json here..."
              value={clientsPaste}
              onChange={(e) => setClientsPaste(e.target.value)}
              className="p-3 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-650"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">Port Forwards JSON (unifi_portforward.json) - Optional</label>
            <textarea
              id="raw-portforwards-paste"
              rows={5}
              placeholder="Paste contents of unifi_portforward.json here..."
              value={portForwardsPaste}
              onChange={(e) => setPortForwardsPaste(e.target.value)}
              className="p-3 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-650"
            />
          </div>
        </div>

        {importStatus && (
          <div className={`p-3 border rounded text-xs font-mono ${
            importStatus.success ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" : "bg-red-950/10 border-red-900/30 text-red-400"
          }`} id="import-report-alert">
            <span className="font-bold">{importStatus.msg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-1" id="import-controls-footer">
          <button
            id="btn-trigger-manual-import"
            onClick={handleManualImport}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Parse and Map Pastebin
          </button>

          <button
            id="btn-load-demo-environment"
            onClick={loadDemoConfig}
            className="flex-1 sm:flex-none border border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-850 py-2.5 px-5 rounded font-mono text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Load Pristine Demo Site
          </button>
        </div>
      </div>
    </div>
  );
}
