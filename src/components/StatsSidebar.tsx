import { useState, useEffect } from "react";
import { Server, Globe, ArrowRight, Lock, Download, Settings, BookOpen, GitBranch, Github, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
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
  tfFiles: TerraformFiles;
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
  tfFiles,
}: StatsSidebarProps) {
  // Persistence for GitHub coordinates in state with local storage defaults
  const [gitRepo, setGitRepo] = useState(() => localStorage.getItem("ut_git_repo") || "grantmacnamara/unifi-terraform");
  const [gitBranch, setGitBranch] = useState(() => localStorage.getItem("ut_git_branch") || "main");
  const [gitToken, setGitToken] = useState(() => localStorage.getItem("ut_git_token") || "");
  const [commitMsg, setCommitMsg] = useState("feat: sync UniFi vlan & client configurations");
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; msg?: string; url?: string } | null>(null);

  // Sync state modifications to local storage
  useEffect(() => {
    localStorage.setItem("ut_git_repo", gitRepo);
  }, [gitRepo]);

  useEffect(() => {
    localStorage.setItem("ut_git_branch", gitBranch);
  }, [gitBranch]);

  useEffect(() => {
    localStorage.setItem("ut_git_token", gitToken);
  }, [gitToken]);

  const handleGitSync = async () => {
    if (!gitRepo.includes("/")) {
      setSyncStatus({ success: false, msg: "Repository must be in format 'owner/repo' (e.g. grantmacnamara/unifi-terraform)." });
      return;
    }
    if (!gitToken.trim()) {
      setSyncStatus({ success: false, msg: "GitHub Personal Access Token is required to authorize the commit." });
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    const [owner, repo] = gitRepo.split("/").map(s => s.trim());

    try {
      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: gitToken,
          owner,
          repo,
          branch: gitBranch,
          commitMessage: commitMsg,
          files: tfFiles
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "GitHub commit sync failed");
      }

      setSyncStatus({
        success: true,
        msg: "Successfully synchronized IaC configurations directly to repository!",
        url: data.commitUrl
      });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        success: false,
        msg: err.message || "Unknown error occurred syncing with GitHub."
      });
    } finally {
      setIsSyncing(false);
    }
  };
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

      {/* GitHub Repository Sync Section */}
      <div className="bg-slate-950/60 rounded border border-slate-800 p-6 flex flex-col gap-4" id="github-sync-card">
        <h3 className="font-bold text-white text-[10px] uppercase font-mono tracking-widest flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <Github className="w-4 h-4 text-slate-400" />
          Git Version Control
        </h3>

        <div className="flex flex-col gap-3.5" id="github-sync-form">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">Target Repository</label>
              <span className="text-[9px] text-slate-500 font-mono">owner/repo</span>
            </div>
            <input
              id="inp-github-repo"
              type="text"
              placeholder="grantmacnamara/unifi-terraform"
              value={gitRepo}
              onChange={(e) => setGitRepo(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-850 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono font-medium">Branch</label>
              <input
                id="inp-github-branch"
                type="text"
                placeholder="main"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                className="p-2 bg-slate-900 border border-slate-850 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono font-medium">Authorization</label>
                <a 
                  href="https://github.com/settings/tokens/new?scopes=repo&description=UniFi-to-Terraform-Exporter" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[8px] text-emerald-500 hover:underline font-mono"
                >
                  Get Token
                </a>
              </div>
              <input
                id="inp-github-token"
                type="password"
                placeholder="GitHub PAT (ghp_...)"
                value={gitToken}
                onChange={(e) => setGitToken(e.target.value)}
                className="p-2 bg-slate-900 border border-slate-850 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">Commit Message</label>
            <input
              id="inp-github-commit-msg"
              type="text"
              placeholder="feat: sync UniFi vlan & client configurations"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-850 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {syncStatus && (
            <div 
              id="git-sync-status-indicator"
              className={`p-3 rounded border flex flex-col gap-1 text-[11px] font-mono leading-normal shadow-xs ${
                syncStatus.success 
                  ? "bg-emerald-950/25 border-emerald-900/40 text-emerald-400" 
                  : "bg-rose-950/25 border-rose-900/40 text-rose-400"
              }`}
            >
              <div className="flex items-start gap-2">
                {syncStatus.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold uppercase text-[10px] tracking-wider mb-1">
                    {syncStatus.success ? "Sync Complete" : "Sync Failed"}
                  </p>
                  <p className="text-[10.5px] leading-relaxed text-slate-300">{syncStatus.msg}</p>
                  
                  {syncStatus.url && (
                    <a
                      id="lnk-commit-link"
                      href={syncStatus.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-350 font-bold hover:underline py-1 px-2 bg-slate-900/80 border border-slate-800 rounded select-none text-[9.5px]"
                    >
                      <Github className="w-3.5 h-3.5" /> View Commit on GitHub ➔
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            id="btn-github-sync-action"
            disabled={isSyncing}
            onClick={handleGitSync}
            className={`w-full py-2.5 rounded font-bold text-xs font-mono uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              isSyncing 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-slate-100 hover:bg-white text-slate-950"
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                Pushing Commit...
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4 text-slate-950" />
                Backup to Repo
              </>
            )}
          </button>
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
