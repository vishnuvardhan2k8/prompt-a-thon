import React, { useState } from 'react';
import { Database, Plus, Search, ShieldCheck, AlertTriangle, Bug, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { STORAGE_SCHEMES } from '../engine/types.js';

export default function ObjectsView({ engine }) {
  const { objects, nodes, storeObject, retrieveObject, corruptChunk } = engine;
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [payloadInput, setPayloadInput] = useState('');
  const [schemeInput, setSchemeInput] = useState(STORAGE_SCHEMES.REPLICATION);
  const [selectedObject, setSelectedObject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const payload = payloadInput.trim() || `PAYLOAD_DATA_CONTENT_BLOCK_${Date.now()}`;
    const success = storeObject(nameInput.trim(), payload, schemeInput);
    if (success) {
      setNameInput('');
      setPayloadInput('');
      setShowModal(false);
    }
  };

  const filteredObjects = objects.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Distributed Object Manager
          </h2>
          <p className="text-xs text-slate-400">
            Inspect data blocks, replication strategy, chunk hashes, and trigger Quorum reads or Bit-rot attacks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search objects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Store Object
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl animate-in">
            <h3 className="text-lg font-bold text-white">Store New Object in Vault</h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Object Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. database-dump-2026.sql"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Storage Scheme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSchemeInput(STORAGE_SCHEMES.REPLICATION)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      schemeInput === STORAGE_SCHEMES.REPLICATION
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">3x Replication</div>
                    <div className="text-[10px] text-slate-400 mt-1">Identical copies across 3 AZ nodes</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchemeInput(STORAGE_SCHEMES.ERASURE_CODING)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      schemeInput === STORAGE_SCHEMES.ERASURE_CODING
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold">Erasure Coding (4+2)</div>
                    <div className="text-[10px] text-slate-400 mt-1">4 Data + 2 Reed-Solomon Parity blocks</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payload Content (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Payload text data content..."
                  value={payloadInput}
                  onChange={e => setPayloadInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                >
                  Store Object Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objects Table */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Object Key</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-4">Blocks / Replicas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quorum Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredObjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-sans">
                    No objects stored yet. Click "Store Object" to write data into Vault.
                  </td>
                </tr>
              ) : (
                filteredObjects.map(obj => (
                  <tr key={obj.id} className="hover:bg-slate-900/60 transition-all">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{obj.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">ID: {obj.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        obj.scheme === STORAGE_SCHEMES.REPLICATION ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {obj.scheme.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        {obj.chunks.map((chunk, idx) => (
                          <span
                            key={chunk.chunkId}
                            className={`w-3 h-3 rounded-sm ${
                              chunk.isValid ? (chunk.type === 'parity' ? 'bg-cyan-400' : 'bg-emerald-400') : 'bg-rose-500 animate-pulse'
                            }`}
                            title={`Block ${chunk.chunkId} on ${chunk.nodeName}: ${chunk.isValid ? 'Valid' : 'Corrupted'}`}
                          />
                        ))}
                        <span className="text-[11px] text-slate-400 font-sans ml-1">
                          ({obj.chunks.filter(c => c.isValid).length}/{obj.chunks.length})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        obj.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-300' :
                        obj.status === 'under_replicated' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {obj.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                      <button
                        onClick={() => retrieveObject(obj.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all inline-flex items-center gap-1"
                        title="Execute Quorum Read with Read Repair"
                      >
                        <Eye className="w-3 h-3" /> Read
                      </button>

                      <button
                        onClick={() => corruptChunk(obj.id, obj.chunks[0].chunkId)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all inline-flex items-center gap-1"
                        title="Corrupt 1st block checksum"
                      >
                        <Bug className="w-3 h-3" /> Corrupt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
