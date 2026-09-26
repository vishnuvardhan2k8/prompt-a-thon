import React, { useState } from 'react';
import { GitBranch, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { MerkleTreeEngine } from '../engine/merkleTree.js';

export default function AntiEntropyView({ engine }) {
  const { nodes, objects, runAntiEntropySync, runBackgroundScrub } = engine;
  const [node1Id, setNode1Id] = useState(nodes[0]?.id || 'node-1');
  const [node2Id, setNode2Id] = useState(nodes[1]?.id || 'node-2');
  const [syncResult, setSyncResult] = useState(null);

  // Compute Merkle Tree for node 1
  const chunksNode1 = objects.flatMap(o => o.chunks.filter(c => c.nodeId === node1Id));
  const treeNode1 = MerkleTreeEngine.buildMerkleTree(chunksNode1);

  // Compute Merkle Tree for node 2
  const chunksNode2 = objects.flatMap(o => o.chunks.filter(c => c.nodeId === node2Id));
  const treeNode2 = MerkleTreeEngine.buildMerkleTree(chunksNode2);

  const handleSyncClick = () => {
    const res = runAntiEntropySync(node1Id, node2Id);
    setSyncResult(res);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            Active Anti-Entropy & Merkle Trees
          </h2>
          <p className="text-xs text-slate-400">
            Background anti-entropy process uses Merkle Trees per storage bucket to pinpoint missing or corrupted blocks in O(log N) time.
          </p>
        </div>

        <button
          onClick={runBackgroundScrub}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Run Full Scrubber Scan
        </button>
      </div>

      {/* Merkle Tree Synchronizer Card */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          Interactive Anti-Entropy Node Sync
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Node 1 Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-400">Target Storage Node A</label>
            <select
              value={node1Id}
              onChange={e => setNode1Id(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.region})</option>
              ))}
            </select>

            <div className="pt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Merkle Root Hash:</span>
                <span className="font-mono text-purple-300 font-bold">{treeNode1.rootHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bucket Block Count:</span>
                <span className="font-mono text-slate-200">{treeNode1.leafCount} blocks</span>
              </div>
            </div>
          </div>

          {/* Node 2 Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-400">Target Storage Node B</label>
            <select
              value={node2Id}
              onChange={e => setNode2Id(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.region})</option>
              ))}
            </select>

            <div className="pt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Merkle Root Hash:</span>
                <span className="font-mono text-purple-300 font-bold">{treeNode2.rootHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bucket Block Count:</span>
                <span className="font-mono text-slate-200">{treeNode2.leafCount} blocks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={handleSyncClick}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Compare Merkle Trees & Sync Differences
          </button>
        </div>

        {/* Sync Result Box */}
        {syncResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in ${
            syncResult.inSync
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
          }`}>
            <div className="font-bold flex items-center gap-2 text-sm">
              {syncResult.inSync ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {syncResult.inSync ? 'Merkle Roots Match' : 'Anti-Entropy Mismatch Detected'}
            </div>
            <p>{syncResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
