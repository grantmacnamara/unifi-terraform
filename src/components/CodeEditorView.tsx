import { Check, Copy, Download, Info } from "lucide-react";
import { ReactNode } from "react";
import { TerraformFiles } from "../types";

interface CodeEditorViewProps {
  tfFiles: TerraformFiles;
  selectedFile: keyof TerraformFiles;
  setSelectedFile: (name: keyof TerraformFiles) => void;
  copiedFile: string | null;
  copyToClipboard: (text: string, label: string) => void;
  downloadFile: (fileName: keyof TerraformFiles, content: string) => void;
  downloadAllFiles: () => void;
  renderHclLine: (line: string) => ReactNode;
}

export default function CodeEditorView({
  tfFiles,
  selectedFile,
  setSelectedFile,
  copiedFile,
  copyToClipboard,
  downloadFile,
  downloadAllFiles,
  renderHclLine,
}: CodeEditorViewProps) {
  return (
    <div className="bg-slate-950 rounded border border-slate-800 flex flex-col overflow-hidden" id="code-editor-view-container">
      {/* File Action Selectors bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between" id="editor-action-bar">
        <div className="flex flex-wrap gap-1" id="file-tabs-strip">
          {(Object.keys(tfFiles) as Array<keyof TerraformFiles>).map((name) => (
            <button
              key={name}
              id={`tab-select-${name.replace(".", "-")}`}
              onClick={() => setSelectedFile(name)}
              className={`text-xs font-mono px-3 py-1.5 rounded transition-all cursor-pointer ${
                selectedFile === name
                  ? "bg-slate-950 text-emerald-400 border border-slate-700 font-bold"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" id="editor-actions">
          <button
            id="btn-copy-tf-file"
            onClick={() => copyToClipboard(tfFiles[selectedFile], selectedFile)}
            className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase font-bold text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 rounded border border-slate-850 transition-all cursor-pointer"
          >
            {copiedFile === selectedFile ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedFile === selectedFile ? "Copied!" : "Copy"}
          </button>
          
          <button
            id="btn-download-tf-file"
            onClick={() => downloadFile(selectedFile, tfFiles[selectedFile])}
            className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase font-bold text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 rounded border border-slate-850 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>

          <button
            id="btn-download-all-zip"
            onClick={downloadAllFiles}
            className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-450 px-2.5 py-1 rounded transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download All
          </button>
        </div>
      </div>

      {/* Syntax Highlit Editor Area */}
      <div className="relative flex-1 bg-slate-950 font-mono text-[11.5px] leading-relaxed p-4 overflow-x-auto min-h-[440px] max-h-[700px] select-text border-b border-slate-900" id="hcl-lines-canvas">
        <div className="absolute right-4 top-4 select-none">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            HCL OUTPUT
          </span>
        </div>
        <pre className="text-slate-300">
          <code>
            {tfFiles[selectedFile] ? (
              tfFiles[selectedFile].split("\n").map((line, i) => (
                <div key={i} className="flex hover:bg-slate-900/40 px-2 rounded -mx-2">
                  <span className="w-8 shrink-0 text-slate-650 text-right pr-3 select-none text-[10px] font-mono border-r border-slate-900">
                    {i + 1}
                  </span>
                  <span className="pl-4">{renderHclLine(line)}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic p-4 text-center">No Terraform config generated for this section yet.</div>
            )}
          </code>
        </pre>
      </div>

      {/* Footnote instruction block */}
      <div className="bg-slate-900 p-4 flex items-start gap-3" id="editor-footnote">
        <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-450 font-mono">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Terraform Deploy Instructions:</h4>
          <p className="mt-1 leading-relaxed text-slate-400">
            Save these files locally inside an empty directory. Execute <code className="bg-slate-950 border border-slate-800 text-emerald-400 px-1 py-0.5 rounded font-mono font-semibold">terraform init</code> to load the latest UniFi provider, populate authentication secrets in <code className="bg-slate-950 border border-slate-800 text-emerald-400 px-1 py-0.5 rounded font-mono font-semibold">terraform.tfvars</code> or environment levels, and run <code className="bg-slate-950 border border-slate-800 text-emerald-400 px-1 py-0.5 rounded font-mono font-semibold">terraform plan</code> to check allocations.
          </p>
        </div>
      </div>
    </div>
  );
}
