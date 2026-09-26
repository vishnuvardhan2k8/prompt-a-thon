export class NetworkPartitionEngine {
  constructor() {
    this.activePartition = false;
    this.isolatedNodeIds = new Set();
    this.partitionGroups = {
      groupA: [], // e.g. Primary region
      groupB: []  // e.g. Partitioned minority region
    };
  }

  togglePartition(nodes, regionSplit = true) {
    this.activePartition = !this.activePartition;

    if (!this.activePartition) {
      this.isolatedNodeIds.clear();
      this.partitionGroups = { groupA: [], groupB: [] };
      return {
        active: false,
        message: 'Network partition resolved. Full cluster interconnectivity restored.'
      };
    }

    if (regionSplit) {
      // Split nodes by region: Group A (US regions), Group B (EU/AP regions)
      const groupANodes = nodes.filter(n => n.region.startsWith('us-'));
      const groupBNodes = nodes.filter(n => !n.region.startsWith('us-'));

      this.partitionGroups = {
        groupA: groupANodes.map(n => n.id),
        groupB: groupBNodes.map(n => n.id)
      };

      // Mark Group B as isolated from Group A
      groupBNodes.forEach(n => this.isolatedNodeIds.add(n.id));

      return {
        active: true,
        message: `Network Partition Created: Group A (${groupANodes.length} nodes in US) isolated from Group B (${groupBNodes.length} nodes in EU/AP)`,
        groups: this.partitionGroups
      };
    } else {
      // Isolate half of nodes randomly
      const half = Math.floor(nodes.length / 2);
      const groupANodes = nodes.slice(0, half);
      const groupBNodes = nodes.slice(half);

      this.partitionGroups = {
        groupA: groupANodes.map(n => n.id),
        groupB: groupBNodes.map(n => n.id)
      };

      groupBNodes.forEach(n => this.isolatedNodeIds.add(n.id));

      return {
        active: true,
        message: `Random Network Partition Created: ${groupANodes.length} vs ${groupBNodes.length} nodes`,
        groups: this.partitionGroups
      };
    }
  }

  canNodesCommunicate(nodeId1, nodeId2) {
    if (!this.activePartition) return true;
    const inA1 = this.partitionGroups.groupA.includes(nodeId1);
    const inA2 = this.partitionGroups.groupA.includes(nodeId2);
    const inB1 = this.partitionGroups.groupB.includes(nodeId1);
    const inB2 = this.partitionGroups.groupB.includes(nodeId2);

    if ((inA1 && inA2) || (inB1 && inB2)) return true;
    return false;
  }
}
