import React from 'react';
import { 
  ShieldCheck, 
  HardDrive, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Globe
} from 'lucide-react';

export default function DashboardView({ engine, setActiveTab }) {
  const { metrics, nodes, objects, runBackgroundScrub, triggerScenario } = engine;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-6 border border-purple-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                FAUL-TOLERANT ARCHITECTURE
              </span>
              {metrics.durabilityScore > 99.9 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ELEVEN 9s DURABILITY
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Vault Cluster Health Dashboard
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitoring active node quorum, consistent hashing topology, automatic background scrubber, bit-rot detection, and active Anti-Entropy synchronization across 4 geographic regions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('objects')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center gap-2"
            >
              <Database className="w-4 h-4" /> Store New Object
            </button>

            <button
              onClick={runBackgroundScrub}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" /> Run Scrubber
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Durability */}
        <div className="p-5 rounded-2xl glass-panel space-y-3 relative overflow-hidden group border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Durability Score</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.durabilityScore}%</div>
            <p className="text-xs text-slate-400 mt-1">Target: 99.999999999% (11 9s)</p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, metrics.durabilityScore)}%` }} />
          </div>
        </div>

        {/* Metric 2: Active Quorum */}
        <div className="p-5 rounded-2xl glass-panel space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Node Quorum</span>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.activeNodesCount} / {metrics.totalNodesCount}</div>
            <p className="text-xs text-slate-400 mt-1">Required Min Quorum: {engine.config.writeQuorum}</p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${(metrics.activeNodesCount / metrics.totalNodesCount) * 100}%` }} />
          </div>
        </div>

        {/* Metric 3: Storage Overhead */}
        <div className="p-5 rounded-2xl glass-panel space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Storage Efficiency</span>
            <HardDrive className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.storageEfficiencyPercent}%</div>
            <p className="text-xs text-slate-400 mt-1">
              {engine.config.storageScheme === 'replication' ? '3x Replication (300% Overhead)' : `RS (${engine.config.erasureK}+${engine.config.erasureM}) Erasure Coding`}
            </p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${metrics.storageEfficiencyPercent}%` }} />
          </div>
        </div>

        {/* Metric 4: Object Health */}
        <div className="p-5 rounded-2xl glass-panel space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Object Status</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono">{metrics.healthyObjects} / {metrics.totalObjects}</div>
            <p className="text-xs text-slate-400 mt-1">
              {metrics.corrupted > 0 ? `${metrics.corrupted} Corrupted` : `${metrics.underReplicated} Under-replicated`}
            </p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${metrics.totalObjects ? (metrics.healthyObjects / metrics.totalObjects) * 100 : 100}%` }} />
          </div>
        </div>
      </div>

      {/* Storage Node Grid */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Storage Node Status & Geographic Regions</h3>
            <p className="text-xs text-slate-400">Click any node to simulate offline status or inspect ring VNodes</p>
          </div>
          <button
            onClick={() => setActiveTab('topology')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1"
          >
            View Hash Ring Topology &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map(node => (
            <div
              key={node.id}
              onClick={() => engine.toggleNodeFailure(node.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-3 ${
                node.status === 'online'
                  ? 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50 hover:bg-slate-900'
                  : node.status === 'rebalancing'
                  ? 'bg-cyan-950/20 border-cyan-500/40'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm font-semibold text-white">{node.name}</div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">{node.regionName}</span>
                  </div>
                </div>

                <span className={`w-2.5 h-2.5 rounded-full ${
                  node.status === 'online' ? 'bg-emerald-400 animate-pulse' :
                  node.status === 'rebalancing' ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'
                }`} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="font-mono font-medium text-slate-200">{node.latencyMs}ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Chunks</span>
                  <span className="font-mono font-medium text-purple-300">{node.storedChunkIds.length} blocks</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Click to toggle state:</span>
                <span className={`font-semibold ${node.status === 'online' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {node.status === 'online' ? 'Simulate Crash' : 'Recover Node'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
