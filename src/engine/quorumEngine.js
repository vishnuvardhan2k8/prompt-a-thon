export class QuorumEngine {
  /**
   * Check if current W, R, N satisfy strict consistency (W + R > N)
   */
  static evaluateConsistencyModel(w, r, n) {
    const isStrict = (w + r) > n;
    return {
      isStrict,
      type: isStrict ? 'Strong Consistency (W + R > N)' : 'Eventual Consistency (W + R <= N)',
      explanation: isStrict
        ? `Write Quorum (${w}) + Read Quorum (${r}) > N (${n}). Read and Write quorums guaranteed to overlap at least 1 node.`
        : `Write Quorum (${w}) + Read Quorum (${r}) <= N (${n}). Reads may temporarily return stale or under-replicated data.`
    };
  }

  /**
   * Execute Quorum Write across target nodes
   */
  static executeWrite(nodes, partitionMatrix, writeQuorum, objectData, chunks) {
    // Determine reachable target nodes
    const reachableNodes = nodes.filter(node => {
      if (node.status === 'offline') return false;
      if (partitionMatrix && partitionMatrix.isolatedNodeIds.has(node.id)) return false;
      return true;
    });

    const successCount = reachableNodes.length;
    const isQuorumMet = successCount >= writeQuorum;

    return {
      success: isQuorumMet,
      writtenNodes: reachableNodes.map(n => n.id),
      unreachableNodes: nodes.filter(n => !reachableNodes.includes(n)).map(n => n.id),
      successCount,
      requiredQuorum: writeQuorum,
      statusMessage: isQuorumMet
        ? `Write Quorum MET: Successfully wrote to ${successCount}/${nodes.length} nodes (Required W=${writeQuorum})`
        : `Write Quorum FAILED: Only reached ${successCount}/${nodes.length} nodes (Required W=${writeQuorum})`
    };
  }

  /**
   * Execute Quorum Read with automatic Read Repair
   */
  static executeRead(nodes, object, partitionMatrix, readQuorum) {
    const objectChunks = object.chunks || [];
    
    // Query reachable nodes hosting object chunks
    const responses = [];
    objectChunks.forEach(chunk => {
      const node = nodes.find(n => n.id === chunk.nodeId);
      const isReachable = node && node.status !== 'offline' && 
        (!partitionMatrix || !partitionMatrix.isolatedNodeIds.has(node.id));

      if (isReachable) {
        responses.push({
          nodeId: node.id,
          chunk: chunk,
          isValid: chunk.isValid,
          version: chunk.version || 1
        });
      }
    });

    const validResponses = responses.filter(r => r.isValid);
    const isQuorumMet = validResponses.length >= readQuorum;

    // Detect stale or corrupted replicas needing Read Repair
    const corruptedOrStaleChunks = responses.filter(r => !r.isValid);
    const needsReadRepair = corruptedOrStaleChunks.length > 0 && isQuorumMet;

    return {
      success: isQuorumMet,
      validResponses,
      totalReachable: responses.length,
      requiredQuorum: readQuorum,
      needsReadRepair,
      staleChunksToRepair: corruptedOrStaleChunks.map(r => r.chunk),
      statusMessage: isQuorumMet
        ? `Read Quorum MET: Verified ${validResponses.length} valid replica responses (Required R=${readQuorum})${needsReadRepair ? ' — Read Repair triggered!' : ''}`
        : `Read Quorum FAILED: Only ${validResponses.length} valid responses (Required R=${readQuorum})`
    };
  }
}
