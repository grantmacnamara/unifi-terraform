import { Sparkles, ChevronRight, RefreshCw, CheckCircle2 } from "lucide-react";

interface AiStudioViewProps {
  aiPrompt: string;
  setAiPrompt: (s: string) => void;
  isOptimizing: boolean;
  aiResponse: string | null;
  handleAiRefactor: (customPrompt?: string) => void;
}

export default function AiStudioView({
  aiPrompt,
  setAiPrompt,
  isOptimizing,
  aiResponse,
  handleAiRefactor,
}: AiStudioViewProps) {
  return (
    <div className="bg-slate-950/50 p-5 rounded border border-slate-800 flex flex-col gap-5" id="ai-workspace-container">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-900" id="ai-header">
        <div className="bg-emerald-950/40 text-emerald-450 p-2 rounded border border-emerald-900/30">
          <Sparkles className="w-4.5 h-4.5 text-emerald-450 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">AI Configuration Generator</h3>
          <p className="text-[11px] text-slate-500 font-medium">Refactor, parameterize variables, or inject standard Firewall security rules using Gemini 3.5-flash</p>
        </div>
      </div>

      {/* Recommended dynamic recipes list */}
      <div className="flex flex-col gap-3" id="ai-recipes">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Quick Synthesis Recipes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2" id="ai-recipes-grid">
          <button
            id="recipe-extract-ips"
            onClick={() => handleAiRefactor("Extract static client allocations into clear structured tf variables in variables.tf and link them back inside clients.tf")}
            disabled={isOptimizing}
            className="p-3 text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 rounded text-xs font-mono text-slate-350 hover:text-white transition flex items-center justify-between cursor-pointer"
          >
            <span>Extract client IPs as variables</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-550 shrink-0" />
          </button>
          
          <button
            id="recipe-firewall-rules"
            onClick={() => handleAiRefactor("Structure standard stateful UniFi security profiles and custom placeholder firewall rules inside networks.tf")}
            disabled={isOptimizing}
            className="p-3 text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 rounded text-xs font-mono text-slate-350 hover:text-white transition flex items-center justify-between cursor-pointer"
          >
            <span>Inject standard firewall templates</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-550 shrink-0" />
          </button>

          <button
            id="recipe-polish"
            onClick={() => handleAiRefactor("Add beautiful professional HCL comments for every resource block and variables declarations explaining inputs types")}
            disabled={isOptimizing}
            className="p-3 text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 rounded text-xs font-mono text-slate-350 hover:text-white transition flex items-center justify-between cursor-pointer"
          >
            <span>Document variables descriptions</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-550 shrink-0" />
          </button>

          <button
            id="recipe-prefixes"
            onClick={() => handleAiRefactor("Change the prefix naming style of all unifi resources to 'prod_enterprise_core_' replacing default prefixes")}
            disabled={isOptimizing}
            className="p-3 text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 rounded text-xs font-mono text-slate-350 hover:text-white transition flex items-center justify-between cursor-pointer"
          >
            <span>Namespace network resource blocks</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-550 shrink-0" />
          </button>
        </div>
      </div>

      {/* Manual Prompt Input Box */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-900" id="manual-prompt-wrapper">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Custom Workspace Prompt</label>
        <div className="flex gap-2.5" id="prompt-input-row">
          <input
            id="ai-prompt-textbox"
            type="text"
            placeholder="e.g., set default gateway fallback values, rename corporate subnets with core_ prefixes"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono placeholder-slate-600"
          />
          <button
            id="btn-trigger-ai-optimize"
            onClick={() => handleAiRefactor()}
            disabled={isOptimizing || !aiPrompt.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Optimize
          </button>
        </div>
      </div>

      {/* Live Response Panel */}
      {aiResponse && (
        <div className="bg-slate-900/50 p-4 border border-slate-850 rounded" id="ai-notice-card">
          <div className="flex items-center gap-2 mb-1.5 text-emerald-450" id="ai-notice-header">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <h5 className="font-bold font-mono text-[10px] uppercase tracking-wider">AI Optimizer Status Report</h5>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed font-mono font-medium">{aiResponse}</p>
        </div>
      )}
    </div>
  );
}
