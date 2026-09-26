import React from 'react';
import { Sliders, ShieldCheck, AlertTriangle, Layers, Activity } from 'lucide-react';
import { QuorumEngine } from '../engine/quorumEngine.js';
import { STORAGE_SCHEMES } from '../engine/types.js';

export default function QuorumSettingsView({ engine }) {
  const { config, setConfig, metrics } = engine;

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const consistencyEval = QuorumEngine.evaluateConsistencyModel(
    config.writeQuorum,
    config.readQuorum,
    config.replicationFactor
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-400" />
          Quorum & Durability Policy Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Tune strict consistency quorums (W + R &gt; N), Reed-Solomon Erasure Coding, and automatic background healing policies.
        </p>
      </div>

      {/* Consistency Guarantee Banner */}
      <div className={`p-6 rounded-3xl border space-y-3 ${
        consistencyEval.isStrict
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
          : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            {consistencyEval.type}
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 border border-slate-700">
            W={config.writeQuorum}, R={config.readQuorum}, N={config.replicationFactor}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          {consistencyEval.explanation}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Quorum Math Slider Panel */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Quorum Parameters (W, R, N)
          </h3>

          {/* N Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Replication Factor (N):</span>
              <span className="font-mono text-purple-300">{config.replicationFactor} nodes</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={config.replicationFactor}
              onChange={e => handleConfigChange('replicationFactor', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* W Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Write Quorum (W):</span>
              <span className="font-mono text-purple-300">{config.writeQuorum} ACKs required</span>
            </div>
            <input
              type="range"
              min="1"
              max={config.replicationFactor}
              value={config.writeQuorum}
              onChange={e => handleConfigChange('writeQuorum', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* R Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Read Quorum (R):</span>
              <span className="font-mono text-purple-300">{config.readQuorum} ACKs required</span>
            </div>
            <input
              type="range"
              min="1"
              max={config.replicationFactor}
              value={config.readQuorum}
              onChange={e => handleConfigChange('readQuorum', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Card 2: Erasure Coding & Scrubber Settings */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Background Scrubber & Healing
          </h3>

          {/* Storage Scheme Select */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Default Cluster Storage Scheme</label>
            <select
              value={config.storageScheme}
              onChange={e => handleConfigChange('storageScheme', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none font-mono"
            >
              <option value={STORAGE_SCHEMES.REPLICATION}>N-Way Multi-DC Replication (300% Overhead)</option>
              <option value={STORAGE_SCHEMES.ERASURE_CODING}>Reed-Solomon Erasure Coding (4+2, 150% Overhead)</option>
            </select>
          </div>

          {/* Auto Healing Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Automatic Background Healing</span>
              <span className="text-[11px] text-slate-400">Scrubber automatically repairs corrupt blocks</span>
            </div>
            <input
              type="checkbox"
              checked={config.autoRepairEnabled}
              onChange={e => handleConfigChange('autoRepairEnabled', e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
