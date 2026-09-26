import { generateChecksum } from './types.js';

export class ScrubberEngine {
  /**
   * Run checksum verification scan across all objects and chunks
   */
  static runIntegrityScan(objects, nodes) {
    const scanResults = {
      scannedObjectsCount: objects.length,
      scannedChunksCount: 0,
      corruptedChunkCount: 0,
      healedChunkCount: 0,
      corruptedObjects: [],
      timestamp: Date.now()
    };

    let totalChunks = 0;
    let corrupted = 0;

    objects.forEach(obj => {
      let objectHasCorruption = false;
      const chunks = obj.chunks || [];
      totalChunks += chunks.length;

      chunks.forEach(chunk => {
        if (!chunk.isValid) {
          corrupted++;
          objectHasCorruption = true;
        }
      });

      if (objectHasCorruption) {
        scanResults.corruptedObjects.push(obj);
      }
    });

    scanResults.scannedChunksCount = totalChunks;
    scanResults.corruptedChunkCount = corrupted;

    return scanResults;
  }

  /**
   * Calculate 9s Durability Score (e.g. 99.999999999% eleven 9s)
   */
  static calculateDurabilityScore(objects) {
    if (!objects || objects.length === 0) return 99.999999999;
    const total = objects.length;
    const lost = objects.filter(o => o.status === 'lost' || o.status === 'corrupted').length;

    if (lost === 0) return 99.999999999;
    const ratio = (total - lost) / total;
    return Math.max(0, parseFloat((ratio * 100).toFixed(6)));
  }
}
