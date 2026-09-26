import React, { useState } from 'react';
import { ScrollText, Search, ShieldCheck, AlertTriangle, Bug, RefreshCw, Split } from 'lucide-react';

export default function LogsView({ logs }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'ALL' || log.type === filterType.toLowerCase();
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'quorum': return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'repair': return <RefreshCw className="w-4 h-4 text-emerald-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'partition': return <Split className="w-4 h-4 text-amber-400" />;
      case 'scrubber': return <Bug className="w-4 h-4 text-cyan-400" />;
      default: return <ScrollText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-purple-400" />
            Cluster Audit & Event Logs
          </h2>
          <p className="text-xs text-slate-400">
            Real-time audit log of Quorum reads/writes, node heartbeats, read repairs, partition splits, and background scrubbers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'QUORUM', 'REPAIR', 'PARTITION', 'ERROR'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === type
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Log Feed List */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3">
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No log events match your query.</p>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-3 hover:border-slate-700 transition-all"
            >
              <div className="mt-0.5 shrink-0">{getLogIcon(log.type)}</div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white font-mono">{log.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.details}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
