import { generateChecksum } from './types.js';

export class MerkleTreeEngine {
  /**
   * Build Merkle Tree from list of object chunks stored on a node
   */
  static buildMerkleTree(chunks) {
    if (!chunks || chunks.length === 0) {
      return {
        rootHash: 'EMPTY_TREE_HASH',
        tree: [],
        leafCount: 0
      };
    }

    // Sort chunks deterministically by chunkId
    const sortedChunks = [...chunks].sort((a, b) => a.chunkId.localeCompare(b.chunkId));

    // 1. Build Leaf Nodes
    let currentLevel = sortedChunks.map(c => ({
      hash: generateChecksum(`${c.chunkId}:${c.checksum}:${c.isValid ? 'VALID' : 'CORRUPT'}`),
      chunkId: c.chunkId,
      isValid: c.isValid
    }));

    const levels = [currentLevel];

    // 2. Build internal tree levels up to Root
    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const parentHash = generateChecksum(left.hash + right.hash);
        nextLevel.push({
          hash: parentHash,
          leftChild: left,
          rightChild: right
        });
      }
      levels.push(nextLevel);
      currentLevel = nextLevel;
    }

    const rootHash = currentLevel[0] ? currentLevel[0].hash : 'EMPTY_TREE_HASH';

    return {
      rootHash,
      levels,
      leafCount: sortedChunks.length,
      chunks: sortedChunks
    };
  }

  /**
   * Compare Merkle Trees between Node A and Node B to find mismatching chunks
   */
  static compareMerkleTrees(treeA, treeB) {
    if (treeA.rootHash === treeB.rootHash) {
      return {
        inSync: true,
        mismatchedChunkIds: [],
        message: 'Merkle root hashes match! Storage buckets are 100% consistent.'
      };
    }

    // Traverse leaf nodes to find mismatches
    const mapA = new Map(treeA.chunks.map(c => [c.chunkId, c]));
    const mapB = new Map(treeB.chunks.map(c => [c.chunkId, c]));
    const mismatchedChunkIds = new Set();

    treeA.chunks.forEach(cA => {
      const cB = mapB.get(cA.chunkId);
      if (!cB || cA.checksum !== cB.checksum || cA.isValid !== cB.isValid) {
        mismatchedChunkIds.add(cA.chunkId);
      }
    });

    treeB.chunks.forEach(cB => {
      if (!mapA.has(cB.chunkId)) {
        mismatchedChunkIds.add(cB.chunkId);
      }
    });

    return {
      inSync: false,
      mismatchedChunkIds: Array.from(mismatchedChunkIds),
      message: `Anti-Entropy Diff Detected: Found ${mismatchedChunkIds.size} mismatched/corrupted chunk(s) via Merkle Tree sync.`
    };
  }
}
