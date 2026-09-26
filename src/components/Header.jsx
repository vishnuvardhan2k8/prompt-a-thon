import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Play, 
  Pause, 
  Zap, 
  AlertTriangle, 
  Split, 
  Bug, 
  RefreshCw 
} from 'lucide-react';

export default function Header({ engine }) {
  const { metrics, isRunning, setIsRunning, triggerScenario, runBackgroundScrub } = engine;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-white tracking-wide">VAULT</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              v2.4-DISTRIBUTED
            </span>
          </div>
          <p className="text-xs text-slate-400">Fault-Tolerant Distributed Object Storage Engine</p>
        </div>
      </div>

      {/* Quick Scenarios Bar */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <span className="text-xs font-medium text-slate-400 px-2 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Scenarios:
        </span>
        
        <button
          onClick={() => triggerScenario('DUAL_NODE_FAILURE')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
          title="Simulate dual node failure"
        >
          <AlertTriangle className="w-3 h-3" /> Fail 2 Nodes
        </button>

        <button
          onClick={() => triggerScenario('PARTITION')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            metrics.isPartitionActive
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
          title="Simulate network partition"
        >
          <Split className="w-3 h-3" /> {metrics.isPartitionActive ? 'Heal Partition' : 'Network Split'}
        </button>

        <button
          onClick={() => triggerScenario('BIT_ROT')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
          title="Inject bit rot silent corruption into random chunk"
        >
          <Bug className="w-3 h-3" /> Bit-Rot Attack
        </button>

        <button
          onClick={() => triggerScenario('REBALANCE')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          title="Add new storage node and rebalance ring"
        >
          <RefreshCw className="w-3 h-3" /> Scale & Rebalance
        </button>
      </div>

      {/* Cluster Status & Simulation Toggle */}
      <div className="flex items-center space-x-4">
        {/* Status Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${
            metrics.activeNodesCount < 4 ? 'bg-rose-500 animate-pulse' :
            metrics.isPartitionActive ? 'bg-amber-500 animate-pulse' : 'bg-emerald-400 animate-pulse'
          }`} />
          <span className="font-medium text-slate-300">
            {metrics.activeNodesCount < 4 ? 'DEGRADED' : metrics.isPartitionActive ? 'PARTITIONED' : 'HEALTHY'}
          </span>
          <span className="text-slate-500 font-mono">({metrics.activeNodesCount}/{metrics.totalNodesCount} Nodes)</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-2 border transition-all ${
            isRunning
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? 'Running' : 'Paused'}</span>
        </button>
      </div>
    </header>
  );
}
