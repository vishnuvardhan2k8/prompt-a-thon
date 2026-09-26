import { useState, useEffect, useRef, useCallback } from 'react';
import {
  REGIONS,
  STORAGE_SCHEMES,
  DEFAULT_CONFIG,
  generateUUID,
  generateChecksum,
  calculateStorageEfficiency
} from './types.js';
import { ConsistentHashRing } from './hashRing.js';
import { ErasureCodingEngine } from './erasureCoding.js';
import { QuorumEngine } from './quorumEngine.js';
import { NetworkPartitionEngine } from './networkPartition.js';
import { MerkleTreeEngine } from './merkleTree.js';
import { ScrubberEngine } from './scrubber.js';

function createInitialClusterNodes() {
  const nodeNames = [
    'vault-node-alpha', 'vault-node-beta', 'vault-node-gamma', 'vault-node-delta',
    'vault-node-epsilon', 'vault-node-zeta', 'vault-node-eta', 'vault-node-theta'
  ];

  return nodeNames.map((name, i) => {
    const region = REGIONS[i % REGIONS.length];
    return {
      id: `node-${i + 1}`,
      name,
      status: 'online', // 'online' | 'offline' | 'degraded' | 'rebalancing'
      capacityMb: 100000,
      usedMb: 5000 + Math.floor(Math.random() * 8000),
      region: region.id,
      regionName: region.name,
      regionColor: region.color,
      latencyMs: 8 + Math.floor(Math.random() * 15),
      lastHeartbeat: Date.now(),
      failureCount: 0,
      storedChunkIds: []
    };
  });
}

export function useVaultEngine() {
  const [nodes, setNodes] = useState(() => createInitialClusterNodes());
  const [objects, setObjects] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [activePacketFlow, setActivePacketFlow] = useState(null); // Visual animation packet

  const ringRef = useRef(new ConsistentHashRing(3));
  const partitionRef = useRef(new NetworkPartitionEngine());
  const intervalRef = useRef(null);
  const scrubIntervalRef = useRef(null);

  const nodesRef = useRef(nodes);
  const objectsRef = useRef(objects);
  const configRef = useRef(config);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { objectsRef.current = objects; }, [objects]);
  useEffect(() => { configRef.current = config; }, [config]);

  // Add structured log entry
  const addLog = useCallback((type, title, details = '', metadata = {}) => {
    setLogs(prev => [{
      id: generateUUID(),
      timestamp: Date.now(),
      type, // 'quorum' | 'repair' | 'partition' | 'scrubber' | 'rebalance' | 'error' | 'info' | 'success'
      title,
      details,
      ...metadata
    }, ...prev].slice(0, 300));
  }, []);

  // Initialize ring on nodes change
  useEffect(() => {
    ringRef.current.buildRing(nodes);
  }, [nodes]);

  // Store new object in cluster
  const storeObject = useCallback((name, payload, customScheme = null) => {
    const currentNodes = nodesRef.current;
    const currentConfig = configRef.current;
    const objectId = generateUUID();
    const scheme = customScheme || currentConfig.storageScheme;

    const nFactor = currentConfig.replicationFactor;
    const kData = currentConfig.erasureK;
    const mParity = currentConfig.erasureM;
    const requiredNodeCount = scheme === STORAGE_SCHEMES.REPLICATION ? nFactor : (kData + mParity);

    // Get placement nodes via Consistent Hash Ring
    const targetNodes = ringRef.current.getNodesForKey(name + objectId, currentNodes, requiredNodeCount);

    if (targetNodes.length < requiredNodeCount) {
      addLog('error', `Write Failed for "${name}"`, `Insufficient online nodes. Needed ${requiredNodeCount}, available ${targetNodes.length}.`);
      return false;
    }

    // Execute Quorum Write
    const writeResult = QuorumEngine.executeWrite(
      targetNodes,
      partitionRef.current,
      currentConfig.writeQuorum,
      payload,
      []
    );

    if (!writeResult.success && currentConfig.strictConsistency) {
      addLog('error', `Quorum Write Failed for "${name}"`, writeResult.statusMessage);
      return false;
    }

    // Encode payload into chunks (Replication vs Erasure Coding)
    const generatedChunks = ErasureCodingEngine.encodeObject(
      objectId,
      name,
      payload,
      scheme,
      nFactor,
      kData,
      mParity
    );

    // Assign chunks to target nodes
    const finalChunks = generatedChunks.map((chunk, idx) => {
      const assignedNode = targetNodes[idx % targetNodes.length];
      return {
        ...chunk,
        nodeId: assignedNode.id,
        nodeName: assignedNode.name
      };
    });

    const newObject = {
      id: objectId,
      name,
      sizeBytes: payload.length,
      scheme,
      chunks: finalChunks,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      version: 1,
      status: 'healthy' // 'healthy' | 'under_replicated' | 'corrupted' | 'lost'
    };

    // Update state
    setObjects(prev => [newObject, ...prev]);

    setNodes(prev => prev.map(node => {
      const nodeChunks = finalChunks.filter(c => c.nodeId === node.id);
      if (nodeChunks.length > 0) {
        const addedBytes = nodeChunks.reduce((sum, c) => sum + c.sizeBytes, 0);
        return {
          ...node,
          usedMb: node.usedMb + (addedBytes / (1024 * 1024)),
          storedChunkIds: [...node.storedChunkIds, ...nodeChunks.map(c => c.chunkId)]
        };
      }
      return node;
    }));

    // Trigger visual packet flow
    setActivePacketFlow({
      id: generateUUID(),
      type: 'WRITE',
      source: 'CLIENT',
      targets: targetNodes.map(n => n.id),
      timestamp: Date.now()
    });

    addLog(
      'quorum',
      `Object "${name}" Stored (${scheme.toUpperCase()})`,
      `${writeResult.statusMessage}. Distributed ${finalChunks.length} block(s) across ${targetNodes.length} nodes.`,
      { objectId }
    );

    return true;
  }, [addLog]);

  // Read object with Read Repair
  const retrieveObject = useCallback((objectId) => {
    const currentObjects = objectsRef.current;
    const currentNodes = nodesRef.current;
    const currentConfig = configRef.current;

    const object = currentObjects.find(o => o.id === objectId);
    if (!object) return null;

    const readResult = QuorumEngine.executeRead(
      currentNodes,
      object,
      partitionRef.current,
      currentConfig.readQuorum
    );

    // Trigger visual packet flow
    setActivePacketFlow({
      id: generateUUID(),
      type: 'READ',
      source: 'CLIENT',
      targets: object.chunks.map(c => c.nodeId),
      timestamp: Date.now()
    });

    if (!readResult.success) {
      addLog('error', `Read Failed for "${object.name}"`, readResult.statusMessage, { objectId });
      return null;
    }

    // Verify and reconstruct data if needed (Read Repair)
    const verification = ErasureCodingEngine.verifyAndReconstruct(
      object.chunks,
      object.scheme,
      currentConfig.erasureK,
      currentConfig.erasureM
    );

    if (readResult.needsReadRepair || verification.needsRepair) {
      // Execute Read Repair in background
      setObjects(prev => prev.map(o => {
        if (o.id === objectId) {
          return {
            ...o,
            chunks: verification.reconstructedChunks || o.chunks.map(c => ({ ...c, isValid: true })),
            status: 'healthy',
            lastAccessedAt: Date.now()
          };
        }
        return o;
      }));

      addLog(
        'repair',
        `Read Repair Executed for "${object.name}"`,
        `Detected corrupted/stale replicas during read. On-the-fly reconstruction restored all ${object.chunks.length} blocks to valid state!`,
        { objectId }
      );
    } else {
      addLog('info', `Read Successful for "${object.name}"`, readResult.statusMessage, { objectId });
    }

    return object;
  }, [addLog]);

  // Corrupt a random chunk to test bit rot / repair
  const corruptChunk = useCallback((objectId, chunkId) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === objectId) {
        const updatedChunks = obj.chunks.map(c => {
          if (c.chunkId === chunkId) {
            return {
              ...c,
              isValid: false,
              checksum: 'BAD_HASH_CORRUPT'
            };
          }
          return c;
        });

        const validCount = updatedChunks.filter(c => c.isValid).length;
        const required = obj.scheme === STORAGE_SCHEMES.REPLICATION ? 1 : configRef.current.erasureK;
        const newStatus = validCount < required ? 'corrupted' : 'under_replicated';

        return {
          ...obj,
          chunks: updatedChunks,
          status: newStatus
        };
      }
      return obj;
    }));

    addLog('error', `Bit-Rot Injection`, `Corrupted checksum for block ${chunkId} on object ID ${objectId}.`, { objectId });
  }, [addLog]);

  // Fail / Recover node
  const toggleNodeFailure = useCallback((nodeId) => {
    const currentNode = nodesRef.current.find(n => n.id === nodeId);
    if (!currentNode) return;

    const newStatus = currentNode.status === 'online' ? 'offline' : 'online';

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: newStatus,
          failureCount: newStatus === 'offline' ? n.failureCount + 1 : n.failureCount,
          lastHeartbeat: Date.now()
        };
      }
      return n;
    }));

    addLog(
      newStatus === 'offline' ? 'error' : 'success',
      `Node ${currentNode.name} is now ${newStatus.toUpperCase()}`,
      newStatus === 'offline'
        ? `Node unreachable. Triggers potential under-replication check.`
        : `Node recovered. Heartbeat active. Initiating anti-entropy sync.`,
      { nodeId }
    );

    // Update object health status based on offline nodes
    setObjects(prev => prev.map(obj => {
      const validChunks = obj.chunks.filter(c => {
        const node = nodesRef.current.find(n => n.id === c.nodeId);
        return c.isValid && node && (n.id === nodeId ? newStatus === 'online' : node.status === 'online');
      });

      const minRequired = obj.scheme === STORAGE_SCHEMES.REPLICATION ? configRef.current.minReplicas || 2 : configRef.current.erasureK;
      const status = validChunks.length >= obj.chunks.length ? 'healthy' :
                     validChunks.length >= minRequired ? 'under_replicated' : 'corrupted';

      return { ...obj, status };
    }));
  }, [addLog]);

  // Toggle Network Partition
  const togglePartition = useCallback(() => {
    const result = partitionRef.current.togglePartition(nodesRef.current);
    addLog('partition', result.message, result.active ? 'Split-Brain scenario active. Quorum writes across partition walls will fail.' : 'Partition healed.');
  }, [addLog]);

  // Run Auto Scrubber and Repair
  const runBackgroundScrub = useCallback(() => {
    const currentObjects = objectsRef.current;
    const currentNodes = nodesRef.current;
    const currentConfig = configRef.current;

    const scan = ScrubberEngine.runIntegrityScan(currentObjects, currentNodes);

    if (scan.corruptedChunkCount > 0 && currentConfig.autoRepairEnabled) {
      // Heal corrupted/under-replicated objects
      setObjects(prev => prev.map(obj => {
        if (obj.status === 'under_replicated' || obj.status === 'corrupted') {
          const verification = ErasureCodingEngine.verifyAndReconstruct(
            obj.chunks,
            obj.scheme,
            currentConfig.erasureK,
            currentConfig.erasureM
          );

          if (verification.canRead) {
            return {
              ...obj,
              chunks: verification.reconstructedChunks || obj.chunks.map(c => ({ ...c, isValid: true })),
              status: 'healthy'
            };
          }
        }
        return obj;
      }));

      addLog('repair', `Auto-Healer Process Complete`, `Scrubber repaired ${scan.corruptedChunkCount} damaged chunk(s) across cluster objects.`);
    }
  }, [addLog]);

  // Run Anti-Entropy Merkle Tree Sync between 2 nodes
  const runAntiEntropySync = useCallback((nodeId1, nodeId2) => {
    const currentObjects = objectsRef.current;

    const chunks1 = currentObjects.flatMap(o => o.chunks.filter(c => c.nodeId === nodeId1));
    const chunks2 = currentObjects.flatMap(o => o.chunks.filter(c => c.nodeId === nodeId2));

    const tree1 = MerkleTreeEngine.buildMerkleTree(chunks1);
    const tree2 = MerkleTreeEngine.buildMerkleTree(chunks2);

    const result = MerkleTreeEngine.compareMerkleTrees(tree1, tree2);

    addLog('rebalance', `Anti-Entropy Merkle Sync (${nodeId1} <-> ${nodeId2})`, result.message);
    return result;
  }, [addLog]);

  // Scenario Presets
  const triggerScenario = useCallback((scenarioType) => {
    if (scenarioType === 'DUAL_NODE_FAILURE') {
      const activeNodes = nodesRef.current.filter(n => n.status === 'online');
      if (activeNodes.length >= 2) {
        toggleNodeFailure(activeNodes[0].id);
        toggleNodeFailure(activeNodes[1].id);
        addLog('error', `Scenario: Catastrophic Dual Node Failure Triggered`, `Took down ${activeNodes[0].name} & ${activeNodes[1].name} simultaneously.`);
      }
    } else if (scenarioType === 'BIT_ROT') {
      const allObjects = objectsRef.current;
      if (allObjects.length > 0) {
        const randomObj = allObjects[Math.floor(Math.random() * allObjects.length)];
        const randomChunk = randomObj.chunks[Math.floor(Math.random() * randomObj.chunks.length)];
        corruptChunk(randomObj.id, randomChunk.chunkId);
      }
    } else if (scenarioType === 'PARTITION') {
      togglePartition();
    } else if (scenarioType === 'REBALANCE') {
      // Add a new node to ring and trigger rebalancing
      const newNodeId = `node-${nodesRef.current.length + 1}`;
      const newRegion = REGIONS[nodesRef.current.length % REGIONS.length];
      const newNode = {
        id: newNodeId,
        name: `vault-node-new-${nodesRef.current.length + 1}`,
        status: 'rebalancing',
        capacityMb: 100000,
        usedMb: 0,
        region: newRegion.id,
        regionName: newRegion.name,
        regionColor: newRegion.color,
        latencyMs: 12,
        lastHeartbeat: Date.now(),
        failureCount: 0,
        storedChunkIds: []
      };

      setNodes(prev => [...prev, newNode]);
      addLog('rebalance', `Cluster Expansion & Rebalance Initiated`, `Added ${newNode.name}. Consistent Hash Ring re-assigning key ranges...`);

      setTimeout(() => {
        setNodes(prev => prev.map(n => n.id === newNodeId ? { ...n, status: 'online' } : n));
        addLog('success', `Rebalance Completed`, `${newNode.name} fully joined active cluster hash ring.`);
      }, 3000);
    }
  }, [toggleNodeFailure, corruptChunk, togglePartition, addLog]);

  // Heartbeat loop
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setNodes(prev => prev.map(node => {
        if (node.status === 'online') {
          return {
            ...node,
            lastHeartbeat: Date.now(),
            latencyMs: Math.max(5, Math.floor(node.latencyMs + (Math.random() * 4 - 2)))
          };
        }
        return node;
      }));
    }, config.heartbeatIntervalMs);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, config.heartbeatIntervalMs]);

  // Scrubber loop
  useEffect(() => {
    if (!isRunning) return;

    scrubIntervalRef.current = setInterval(() => {
      runBackgroundScrub();
    }, config.scrubIntervalMs);

    return () => clearInterval(scrubIntervalRef.current);
  }, [isRunning, config.scrubIntervalMs, runBackgroundScrub]);

  // Seed sample initial dataset if empty
  useEffect(() => {
    if (objects.length === 0 && nodes.length > 0) {
      storeObject('financial-report-2026.pdf', 'CONFIDENTIAL_FINANCIAL_VAULT_PAYLOAD_DATA_2026_Q3_AUDIT');
      storeObject('user-backups-archive.tar.gz', 'SYSTEM_USER_DATABASE_BACKUP_CONTAINING_CUSTOMER_KEYS');
      storeObject('satellite-telemetry.bin', 'RAW_SATELLITE_IMAGE_STREAM_BLOCK_AX_99201148812');
    }
  }, []);

  // Compute calculated metrics
  const activeNodesCount = nodes.filter(n => n.status === 'online').length;
  const metrics = {
    totalObjects: objects.length,
    healthyObjects: objects.filter(o => o.status === 'healthy').length,
    underReplicated: objects.filter(o => o.status === 'under_replicated').length,
    corrupted: objects.filter(o => o.status === 'corrupted').length,
    activeNodesCount,
    totalNodesCount: nodes.length,
    totalCapacityMb: nodes.reduce((sum, n) => sum + n.capacityMb, 0),
    totalUsedMb: nodes.reduce((sum, n) => sum + n.usedMb, 0),
    durabilityScore: ScrubberEngine.calculateDurabilityScore(objects),
    storageEfficiencyPercent: calculateStorageEfficiency(config.storageScheme, config.replicationFactor, config.erasureK, config.erasureM),
    isPartitionActive: partitionRef.current.activePartition,
    consistencyModel: QuorumEngine.evaluateConsistencyModel(config.writeQuorum, config.readQuorum, config.replicationFactor)
  };

  return {
    nodes,
    objects,
    config,
    setConfig,
    logs,
    metrics,
    isRunning,
    setIsRunning,
    activePacketFlow,
    storeObject,
    retrieveObject,
    corruptChunk,
    toggleNodeFailure,
    togglePartition,
    runBackgroundScrub,
    runAntiEntropySync,
    triggerScenario
  };
}
