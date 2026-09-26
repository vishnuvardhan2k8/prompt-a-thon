import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import TopologyRingView from './components/TopologyRingView';
import ObjectsView from './components/ObjectsView';
import AntiEntropyView from './components/AntiEntropyView';
import QuorumSettingsView from './components/QuorumSettingsView';
import LogsView from './components/LogsView';
import { useVaultEngine } from './engine/storageEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const engine = useVaultEngine();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-300">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/15 via-slate-950 to-slate-950 pointer-events-none z-0" />

      {/* Top Header */}
      <Header engine={engine} />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} engine={engine} />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView engine={engine} setActiveTab={setActiveTab} />}
          {activeTab === 'topology' && <TopologyRingView engine={engine} />}
          {activeTab === 'objects' && <ObjectsView engine={engine} />}
          {activeTab === 'merkle' && <AntiEntropyView engine={engine} />}
          {activeTab === 'quorum' && <QuorumSettingsView engine={engine} />}
          {activeTab === 'logs' && <LogsView logs={engine.logs} />}
        </main>
      </div>
    </div>
  );
}
