import { Server, Globe, ArrowRight, Lock, Download, Settings, BookOpen } from "lucide-react";
import { MappingOptions, TerraformFiles } from "../types";

interface StatsSidebarProps {
  selectedNetworkCount: number;
  networksCount: number;
  selectedClientCount: number;
  clientsCount: number;
  options: MappingOptions;
  setOptions: (opts: MappingOptions) => void;
  setSelectedFile: (file: keyof TerraformFiles) => void;
  setActiveTab: (tab: "topology" | "editor" | "connection" | "ai") => void;
  downloadAllFiles: () => void;
}

export default function StatsSidebar({
  selectedNetworkCount,
  networksCount,
  selectedClientCount,
  clientsCount,
  options,
  setOptions,
  setSelectedFile,
  setActiveTab,
  downloadAllFiles,
}: StatsSidebarProps) {
  // Calculate dynamic percentages for geometric meters
  const netPercent = Math.min(100, Math.round((selectedNetworkCount / (networksCount || 1)) * 100));
  const clientPercent = Math.min(100, Math.round((selectedClientCount / (clientsCount || 1)) * 100));

  return (
    <div className="flex flex-col gap-6" id="stats-sidebar-container">
      
      {/* Immersive Analysis Results & Meters styled strictly after the Design HTML */}
      <div className="bg-slate-950/60 text-slate-300 rounded border border-slate-800 p-6 flex flex-col" id="analysis-results">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 font-mono">Analysis Results</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-1" id="meter-networks">
            <div className="flex justify-between items-baseline select-none">
              <span className="text-2xl font-light text-white font-mono">{selectedNetworkCount}</span>
              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase">out of {networksCount} total</span>
            </div>
            <span className="text-[9px] text-slate-450 font-mono tracking-wider font-bold">NETWORKS OPT-IN</span>
            <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-slate-900">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${netPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-1" id="meter-clients">
            <div className="flex justify-between items-baseline select-none">
              <span className="text-2xl font-light text-white font-mono">{selectedClientCount}</span>
              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase">out of {clientsCount} listed</span>
            </div>
            <span className="text-[9px] text-slate-450 font-mono tracking-wider font-bold">CLIENTS ALLOCATED</span>
            <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-slate-900">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${clientPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-1" id="meter-fixed-ips">
            <div className="flex justify-between items-baseline select-none">
              <span className="text-2xl font-light text-white font-mono">
                {options.includeClients ? (options.onlyFixedIps ? "FIXED" : "ALL") : "OFF"}
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-600 uppercase">IP RESERVATIONS</span>
            </div>
            <span className="text-[9px] text-slate-450 font-mono tracking-wider font-bold">DISCOVERY SCOPING</span>
            <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden border border-slate-900">
              <div 
                className={`h-full transition-all duration-500 ease-out ${options.includeClients ? "bg-emerald-500 w-full" : "bg-slate-800 w-0"}`}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-900 space-y-2.5" id="stats-quick-actions">
          <button
            id="btn-sidebar-view-networks"
            onClick={() => {
              setSelectedFile("networks.tf");
              setActiveTab("editor");
            }}
            className="w-full flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 hover:text-white p-2 rounded bg-slate-900/40 border border-slate-900 hover:border-slate-805 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-emerald-450" /> View Networks</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            id="btn-sidebar-view-clients"
            onClick={() => {
              setSelectedFile("clients.tf");
              setActiveTab("editor");
            }}
            className="w-full flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 hover:text-white p-2 rounded bg-slate-900/40 border border-slate-900 hover:border-slate-805 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-450" /> View Client IPs</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            id="btn-sidebar-export-all"
            onClick={downloadAllFiles}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-2.5 rounded font-bold text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-950 font-extrabold" /> 
            Download ZIP
          </button>
        </div>
      </div>

      {/* Generator Options Setting Block */}
      <div className="bg-slate-950/60 rounded border border-slate-800 p-6 flex flex-col gap-4" id="generator-options-card">
        <h3 className="font-bold text-white text-[10px] uppercase font-mono tracking-widest flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          Mapping Scope
        </h3>

        <div className="flex flex-col gap-4" id="options-form">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-405 text-slate-450 font-mono">Resource Prefix</label>
            <input
              id="inp-sidebar-prefix"
              type="text"
              placeholder="unifi"
              value={options.prefix}
              onChange={(e) => setOptions({ ...options, prefix: e.target.value })}
              className="p-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-emerald-450 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="border-t border-slate-905 pt-3 flex flex-col gap-3.5" id="options-switches">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="chk-side-param" className="text-xs font-bold text-slate-200 block cursor-pointer">Parameterize Subnets</label>
                <span className="text-[10px] text-slate-500 block leading-tight font-medium">Extract subnets dynamically</span>
              </div>
              <input
                id="chk-side-param"
                type="checkbox"
                checked={options.parameterizeSubnets}
                onChange={(e) => setOptions({ ...options, parameterizeSubnets: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-900 pt-3">
              <div>
                <label htmlFor="chk-side-clients" className="text-xs font-bold text-slate-200 block cursor-pointer">Map Static Client Devices</label>
                <span className="text-[10px] text-slate-500 block leading-tight font-medium">Map static IP allocations</span>
              </div>
              <input
                id="chk-side-clients"
                type="checkbox"
                checked={options.includeClients}
                onChange={(e) => setOptions({ ...options, includeClients: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {options.includeClients && (
              <div className="flex items-center justify-between border-t border-slate-900 pt-3 pl-3 border-l border-slate-800">
                <div>
                  <label htmlFor="chk-side-fixed" className="text-xs font-bold text-slate-300 block cursor-pointer">Only Fixed IPs</label>
                  <span className="text-[10px] text-slate-500 block leading-tight font-medium">Omit generic user list</span>
                </div>
                <input
                  id="chk-side-fixed"
                  type="checkbox"
                  checked={options.onlyFixedIps}
                  onChange={(e) => setOptions({ ...options, onlyFixedIps: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick-Help Reference block */}
      <div className="bg-slate-950/30 rounded border border-slate-850 p-4 flex flex-col gap-2.5" id="help-highlight-card">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          Provider Version
        </h4>
        <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
          Generated file configurations automatically import the <code className="bg-slate-950 text-emerald-450 border border-slate-800/80 text-[10px] font-bold px-1 py-0.5 rounded font-semibold">paultyng/unifi</code> provider workspace version <code className="text-emerald-450 font-semibold font-bold">~&gt; 0.41.0</code>.
        </p>
      </div>

    </div>
  );
}
