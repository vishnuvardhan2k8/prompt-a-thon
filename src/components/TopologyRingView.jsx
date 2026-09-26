import React, { useState } from 'react';
import { CircleDot, Globe, Shield, Split, Info, Cpu } from 'lucide-react';

export default function TopologyRingView({ engine }) {
  const { nodes, objects, metrics, activePacketFlow, togglePartition } = engine;
  const [selectedNode, setSelectedNode] = useState(null);

  const radius = 180;
  const centerX = 240;
  const centerY = 240;

  // Calculate node positions around ring (360 degrees)
  const nodePositions = nodes.map((node, idx) => {
    const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...node, x, y, angle };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-purple-400" />
            Consistent Hash Ring & Cluster Topology
          </h2>
          <p className="text-xs text-slate-400">
            Dynamically hashes object keys to virtual nodes on a 360° ring topology with cross-datacenter placement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={togglePartition}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              metrics.isPartitionActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Split className="w-4 h-4" />
            {metrics.isPartitionActive ? 'Heal Network Split' : 'Simulate Network Partition'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ring Diagram (Canvas/SVG Graphic) */}
        <div className="lg:col-span-7 p-6 rounded-3xl glass-panel border border-slate-800 flex flex-col items-center justify-center relative min-h-[520px]">
          <svg width="480" height="480" viewBox="0 0 480 480" className="w-full max-w-[480px]">
            {/* Outer Hash Ring track */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="6"
              strokeDasharray="4 4"
            />

            {/* Inner Glow Ring */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius - 20}
              fill="none"
              stroke="rgba(139, 92, 246, 0.15)"
              strokeWidth="2"
            />

            {/* Network Partition Divider Line */}
            {metrics.isPartitionActive && (
              <line
                x1={centerX - radius - 30}
                y1={centerY}
                x2={centerX + radius + 30}
                y2={centerY}
                stroke="#f59e0b"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="animate-pulse"
              />
            )}

            {/* Connection Lines between nodes */}
            {nodePositions.map((node, i) => {
              const nextNode = nodePositions[(i + 1) % nodePositions.length];
              return (
                <line
                  key={`edge-${node.id}-${nextNode.id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={nextNode.x}
                  y2={nextNode.y}
                  stroke={node.status === 'online' && nextNode.status === 'online' ? '#334155' : '#475569'}
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />
              );
            })}

            {/* Center Cluster Core */}
            <circle cx={centerX} cy={centerY} r="50" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <text x={centerX} y={centerY - 8} textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold" fontFamily="monospace">
              VAULT CORE
            </text>
            <text x={centerX} y={centerY + 12} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              {metrics.activeNodesCount} Nodes Ring
            </text>

            {/* Render Node Rings & Badges */}
            {nodePositions.map(node => {
              const isSelected = selectedNode && selectedNode.id === node.id;
              const isOnline = node.status === 'online';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Glowing Node Circle */}
                  <circle
                    r="22"
                    fill={isOnline ? '#0f172a' : '#1f1924'}
                    stroke={isSelected ? '#8b5cf6' : node.regionColor}
                    strokeWidth={isSelected ? '3' : '2.5'}
                    className="transition-all duration-300"
                  />

                  {/* Inner Status Indicator */}
                  <circle
                    r="6"
                    fill={isOnline ? '#10b981' : '#f43f5e'}
                    className={isOnline ? 'animate-pulse' : ''}
                  />

                  {/* Node Name Label */}
                  <text
                    y="36"
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {node.name.replace('vault-node-', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Partition Warning Label */}
          {metrics.isPartitionActive && (
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Split className="w-4 h-4" /> PARTITION WALL ACTIVE: Group A (US) isolated from Group B (EU/AP)
              </span>
              <button onClick={togglePartition} className="underline font-bold">Heal</button>
            </div>
          )}
        </div>

        {/* Node Inspector Side Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Node Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-base font-bold text-white">{selectedNode.name}</div>
                      <div className="text-xs text-slate-400">{selectedNode.regionName}</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedNode.status === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Region Zone:</span>
                      <span className="font-mono text-purple-300">{selectedNode.region}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Network Latency:</span>
                      <span className="font-mono text-slate-200">{selectedNode.latencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Stored Chunks:</span>
                      <span className="font-mono text-cyan-400">{selectedNode.storedChunkIds.length} blocks</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Failure Count:</span>
                      <span className="font-mono text-slate-300">{selectedNode.failureCount} crashes</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">Actions:</span>
                  <button
                    onClick={() => engine.toggleNodeFailure(selectedNode.id)}
                    className="w-full py-2.5 rounded-xl font-medium text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                  >
                    {selectedNode.status === 'online' ? 'Crash Storage Node' : 'Recover Storage Node'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Click any node on the Hash Ring diagram to inspect virtual nodes, region placement, and stored chunk details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
