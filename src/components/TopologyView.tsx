import { User, Eye, ArrowRight, ShieldAlert, Network } from "lucide-react";
import { UnifiNetwork, UnifiClient, UnifiPortForward } from "../types";

interface TopologyViewProps {
  networks: UnifiNetwork[];
  activeNetworkIds: string[];
  setActiveNetworkIds: (ids: string[]) => void;
  activeClientMacs: string[];
  setActiveClientMacs: (macs: string[]) => void;
  portForwards: UnifiPortForward[];
  activePortForwardIds: string[];
  setActivePortForwardIds: (ids: string[]) => void;
  networkSearch: string;
  setNetworkSearch: (s: string) => void;
  filteredNetworks: UnifiNetwork[];
  getClientsForNetwork: (netId: string) => UnifiClient[];
}

export default function TopologyView({
  networks,
  activeNetworkIds,
  setActiveNetworkIds,
  activeClientMacs,
  setActiveClientMacs,
  portForwards,
  activePortForwardIds,
  setActivePortForwardIds,
  networkSearch,
  setNetworkSearch,
  filteredNetworks,
  getClientsForNetwork,
}: TopologyViewProps) {
  const selectedNetworkCount = activeNetworkIds.filter(id => networks.some(n => n._id === id)).length;

  return (
    <div className="flex flex-col gap-6" id="topology-view-container">
      {/* Filter Controls with Geometric Balance styles */}
      <div className="bg-slate-950/55 p-4 rounded border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between" id="topology-filters">
        <div className="w-full md:w-auto flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <Eye className="w-4 h-4" />
          </span>
          <input
            id="topology-search-input"
            type="text"
            placeholder="Search VLANs, CIDRs, subnets..."
            value={networkSearch}
            onChange={(e) => setNetworkSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-mono transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto" id="topology-actions-panel">
          <button
            id="btn-select-all-vlans"
            onClick={() => setActiveNetworkIds(networks.map((n) => n._id))}
            className="flex-1 md:flex-none text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white py-1.5 px-3 rounded transition-all border border-slate-700 font-mono uppercase tracking-wider"
          >
            Select All
          </button>
          <button
            id="btn-deselect-all-vlans"
            onClick={() => setActiveNetworkIds([])}
            className="flex-1 md:flex-none text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white py-1.5 px-3 rounded transition-all border border-slate-700 font-mono uppercase tracking-wider"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Dynamic Networks & Clients List Grid */}
      <div className="flex flex-col gap-4" id="vlan-matrix-grid">
        {filteredNetworks.length === 0 ? (
          <div className="bg-slate-950/40 p-12 text-center rounded border border-slate-800 flex flex-col items-center justify-center" id="empty-state">
            <div className="w-8 h-8 rounded bg-slate-900 text-slate-400 flex items-center justify-center font-bold text-sm mb-3">!</div>
            <h3 className="font-bold text-slate-300 text-sm">No Networks Found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">No networks matched your filter keyword. Try checking another parameter or loading the demo environment profile.</p>
          </div>
        ) : (
          filteredNetworks.map((net) => {
            const isChecked = activeNetworkIds.includes(net._id);
            const netClients = getClientsForNetwork(net._id);
            const activeNetClients = netClients.filter((c) => activeClientMacs.includes(c.mac));

            return (
              <div
                key={net._id}
                id={`network-card-${net._id}`}
                className={`bg-slate-950/30 rounded border transition-all overflow-hidden ${
                  isChecked 
                    ? "border-emerald-500/20 bg-slate-950/60 shadow-xs" 
                    : "border-slate-850 opacity-60 hover:opacity-80"
                }`}
              >
                {/* Network Row Header */}
                <div className="p-4 flex items-start sm:items-center justify-between gap-4 bg-slate-900/40 border-b border-slate-850" id={`net-header-${net._id}`}>
                  <div className="flex items-start sm:items-center gap-3.5">
                    <input
                      id={`chk-net-${net._id}`}
                      type="checkbox"
                      checked={isChecked}
                      aria-label={`Select network ${net.name}`}
                      onChange={() => {
                        if (isChecked) {
                          setActiveNetworkIds(activeNetworkIds.filter((id) => id !== net._id));
                        } else {
                          setActiveNetworkIds([...activeNetworkIds, net._id]);
                        }
                      }}
                      className="w-4 h-4 accent-emerald-500 rounded border-slate-850 cursor-pointer"
                    />
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-sm tracking-tight">{net.name}</h3>
                        {net.vlan_enabled !== false && net.vlan !== undefined && (
                          <span className="bg-slate-900 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800 uppercase tracking-wider block">
                            VLAN {net.vlan}
                          </span>
                        )}
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          net.purpose === "corporate" 
                            ? "bg-emerald-950/20 border border-emerald-900/30 text-emerald-400" 
                            : net.purpose === "guest"
                            ? "bg-amber-950/20 border border-amber-900/30 text-amber-405 text-amber-400"
                            : "bg-blue-950/20 border border-blue-900/30 text-blue-400"
                        }`}>
                          {net.purpose || "VLAN-Only"}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 font-mono mt-0.5">
                        {net.ip_subnet ? `Subnet: ${net.ip_subnet}` : "Layer 2 Bridge Only"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                      {activeNetClients.length} / {netClients.length} clients mapped
                    </span>
                  </div>
                </div>

                {/* Mapped Clients List Block (only visible if network is checked) */}
                {isChecked && (
                  <div className="p-4 bg-slate-950/50 border-t border-slate-900" id={`net-clients-${net._id}`}>
                    {netClients.length === 0 ? (
                      <p className="text-[11px] font-medium text-slate-500 italic">No static IP allocations or clients found in this network block.</p>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-mono">
                            <User className="w-3 h-3 text-slate-500" />
                            IP reservations / bindings ({activeNetClients.length} active)
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {netClients.map((client) => {
                            const isClientChecked = activeClientMacs.includes(client.mac);
                            
                            return (
                              <div
                                key={client.mac}
                                id={`client-row-${client.mac}`}
                                onClick={() => {
                                  if (isClientChecked) {
                                    setActiveClientMacs(activeClientMacs.filter((m) => m !== client.mac));
                                  } else {
                                    setActiveClientMacs([...activeClientMacs, client.mac]);
                                  }
                                }}
                                className={`p-2.5 rounded border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                  isClientChecked
                                    ? "bg-slate-900/80 border-slate-700 shadow-2xs"
                                    : "bg-slate-950/40 border-slate-900 hover:border-slate-800 opacity-60"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                    isClientChecked 
                                      ? "bg-emerald-500 text-slate-950 font-bold" 
                                      : "bg-slate-900 text-slate-400 border border-slate-800"
                                  }`}>
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-xs text-slate-200 truncate">
                                      {client.name || client.hostname || "Device"}
                                    </h5>
                                    <p className="text-[9px] text-slate-500 font-mono uppercase truncate mt-0.5">
                                      {client.mac}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  {client.use_fixedip && client.fixed_ip ? (
                                    <span className="bg-slate-950 text-emerald-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-950 block">
                                      {client.fixed_ip}
                                    </span>
                                  ) : (
                                    <span className="bg-slate-950/60 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded block">
                                      {client.ip || "DHCP"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Port Forwarding Rule Grid block */}
      <div className="bg-slate-950/40 p-5 rounded border border-slate-800 flex flex-col gap-4 mt-2" id="port-forward-matrix-pane">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-850 gap-2">
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              PORT FORWARDING RULES ({activePortForwardIds.length} ACTIVE / {portForwards.length} TOTAL)
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">NAT Traversal mappings, Security and WAN Firewall rules</p>
          </div>
          <div className="flex gap-2 shrink-0 select-none">
            <button
              id="pf-all-btn"
              onClick={() => setActivePortForwardIds(portForwards.map(pf => pf._id))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-350 text-[9px] font-bold font-mono tracking-wider uppercase border border-slate-800 rounded transition"
            >
              Select All
            </button>
            <button
              id="pf-none-btn"
              onClick={() => setActivePortForwardIds([])}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-350 text-[9px] font-bold font-mono tracking-wider uppercase border border-slate-800 rounded transition"
            >
              Deselect All
            </button>
          </div>
        </div>

        {portForwards.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic font-mono py-2">No port forward rules active/detected in UniFi configuration data dumps.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {portForwards.map((pf) => {
              const isChecked = activePortForwardIds.includes(pf._id);
              return (
                <div
                  key={pf._id}
                  id={`pf-card-${pf._id}`}
                  onClick={() => {
                    if (isChecked) {
                      setActivePortForwardIds(activePortForwardIds.filter(id => id !== pf._id));
                    } else {
                      setActivePortForwardIds([...activePortForwardIds, pf._id]);
                    }
                  }}
                  className={`p-3 rounded border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isChecked
                      ? "bg-slate-900/80 border-blue-500/35 shadow-xs"
                      : "bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      id={`chk-pf-${pf._id}`}
                      type="checkbox"
                      checked={isChecked}
                      aria-label={`Select port forward ${pf.name}`}
                      onChange={() => {}} // Controlled by card click
                      className="w-3.5 h-3.5 accent-blue-500 rounded border-slate-800 pointer-events-none shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-200 truncate block max-w-[170px]">{pf.name}</span>
                        <span className="bg-slate-950 text-blue-400 border border-slate-850 text-[8px] font-mono font-bold px-1 rounded uppercase">
                          {pf.proto || "TCP"}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 font-mono mt-1 leading-none shrink-0">
                        WAN:{pf.dst_port} <span className="text-slate-700 mx-1">➔</span> {pf.fwd}:{pf.fwd_port || pf.dst_port}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 select-none">
                    <span className={`text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      pf.enabled !== false
                        ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"
                        : "bg-slate-950/80 border-slate-850 text-slate-600"
                    }`}>
                      {pf.enabled !== false ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
