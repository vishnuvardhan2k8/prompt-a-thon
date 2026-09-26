import React from 'react';
import { 
  LayoutDashboard, 
  CircleDot, 
  Database, 
  GitBranch, 
  Sliders, 
  ScrollText,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, engine }) {
  const { metrics } = engine;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'topology', label: 'Ring & Topology', icon: CircleDot, badge: metrics.isPartitionActive ? 'SPLIT' : null },
    { id: 'objects', label: 'Object Manager', icon: Database, count: metrics.totalObjects },
    { id: 'merkle', label: 'Anti-Entropy & Merkle', icon: GitBranch },
    { id: 'quorum', label: 'Quorum & Policies', icon: Sliders },
    { id: 'logs', label: 'Audit Logs', icon: ScrollText, count: engine.logs.length }
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0">
      {/* Primary Navigation */}
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Consistency Mode Summary Card */}
        <div className="p-3.5 rounded-2xl glass-card space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Consistency Guarantee</span>
            <ShieldAlert className={`w-4 h-4 ${metrics.consistencyModel.isStrict ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <p className="text-xs font-mono text-purple-300 font-medium">
            {metrics.consistencyModel.type}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            W={engine.config.writeQuorum}, R={engine.config.readQuorum}, N={engine.config.replicationFactor}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Active Nodes:</span>
          <span className="font-mono text-slate-300">{metrics.activeNodesCount} / {metrics.totalNodesCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Durability:</span>
          <span className="font-mono text-emerald-400 font-semibold">{metrics.durabilityScore}%</span>
        </div>
      </div>
    </aside>
  );
}
