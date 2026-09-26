import { REGIONS } from './types.js';

export class ConsistentHashRing {
  constructor(vnodeCountPerNode = 3) {
    this.vnodeCount = vnodeCountPerNode;
    this.ring = []; // Array of { hashPosition, nodeId }
  }

  // Simple string to hash integer 0-359 for ring degree placement
  hashKey(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % 360;
    }
    return Math.abs(hash);
  }

  buildRing(nodes) {
    this.ring = [];
    nodes.forEach(node => {
      // Create vnodes for uniform distribution
      for (let i = 0; i < this.vnodeCount; i++) {
        const vnodeKey = `${node.id}-vnode-${i}`;
        const pos = this.hashKey(vnodeKey);
        this.ring.push({
          pos,
          nodeId: node.id,
          vnodeId: vnodeKey
        });
      }
    });
    // Sort ring by hash position clockwise
    this.ring.sort((a, b) => a.pos - b.pos);
  }

  // Find N distinct target nodes starting from key hash position clockwise
  getNodesForKey(key, nodes, requiredCount) {
    if (!nodes || nodes.length === 0) return [];
    if (this.ring.length === 0) this.buildRing(nodes);

    const startPos = this.hashKey(key);
    const selectedNodeIds = new Set();
    const resultNodes = [];

    // Filter available (online/degraded) nodes
    const activeNodesMap = new Map(nodes.map(n => [n.id, n]));

    // Find starting vnode index in ring
    let idx = this.ring.findIndex(entry => entry.pos >= startPos);
    if (idx === -1) idx = 0;

    let checkedCount = 0;
    const totalVnodes = this.ring.length;

    // Prioritize distinct regions first for rack/region fault tolerance
    const selectedRegions = new Set();

    // First pass: select across different regions
    while (resultNodes.length < requiredCount && checkedCount < totalVnodes * 2) {
      const entry = this.ring[(idx + checkedCount) % totalVnodes];
      const node = activeNodesMap.get(entry.nodeId);

      if (node && node.status !== 'offline' && !selectedNodeIds.has(node.id)) {
        if (!selectedRegions.has(node.region) || selectedNodeIds.size >= REGIONS.length) {
          selectedNodeIds.add(node.id);
          selectedRegions.add(node.region);
          resultNodes.push(node);
        }
      }
      checkedCount++;
    }

    // Second pass: fill remaining if distinct region nodes weren't enough
    checkedCount = 0;
    while (resultNodes.length < requiredCount && checkedCount < totalVnodes * 2) {
      const entry = this.ring[(idx + checkedCount) % totalVnodes];
      const node = activeNodesMap.get(entry.nodeId);

      if (node && node.status !== 'offline' && !selectedNodeIds.has(node.id)) {
        selectedNodeIds.add(node.id);
        resultNodes.push(node);
      }
      checkedCount++;
    }

    return resultNodes;
  }
}
