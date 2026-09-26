import { generateChecksum, STORAGE_SCHEMES } from './types.js';

export class ErasureCodingEngine {
  /**
   * Split an object into storage chunks based on storage scheme
   */
  static encodeObject(objectId, name, payloadContent, scheme, nFactor, kData, mParity) {
    const timestamp = Date.now();

    if (scheme === STORAGE_SCHEMES.REPLICATION) {
      // N-Way replication: generate N identical full replicas
      const baseChecksum = generateChecksum(payloadContent + '-v1');
      const chunks = [];
      for (let i = 0; i < nFactor; i++) {
        chunks.push({
          chunkId: `${objectId}-replica-${i + 1}`,
          type: 'full_replica',
          index: i + 1,
          sizeBytes: payloadContent.length,
          checksum: baseChecksum,
          version: 1,
          isValid: true,
          contentPreview: payloadContent.substring(0, 32),
          createdAt: timestamp
        });
      }
      return chunks;
    } else {
      // Erasure Coding (K Data + M Parity)
      const chunks = [];
      const totalLen = payloadContent.length;
      const chunkSize = Math.ceil(totalLen / kData);

      // Generate K Data Chunks
      for (let i = 0; i < kData; i++) {
        const start = i * chunkSize;
        const segment = payloadContent.substring(start, start + chunkSize) || `[DATA_PAD_${i}]`;
        const checksum = generateChecksum(segment + `-D${i + 1}`);

        chunks.push({
          chunkId: `${objectId}-chunk-D${i + 1}`,
          type: 'data',
          index: i + 1,
          sizeBytes: segment.length,
          checksum: checksum,
          version: 1,
          isValid: true,
          contentPreview: segment.substring(0, 24),
          createdAt: timestamp
        });
      }

      // Generate M Parity Chunks (Reed-Solomon XOR/Galois Field parity simulation)
      for (let j = 0; j < mParity; j++) {
        const paritySeed = `PARITY_RS_${objectId}_P${j + 1}_K${kData}`;
        const checksum = generateChecksum(paritySeed);

        chunks.push({
          chunkId: `${objectId}-chunk-P${j + 1}`,
          type: 'parity',
          index: j + 1,
          sizeBytes: chunkSize,
          checksum: checksum,
          version: 1,
          isValid: true,
          contentPreview: `[RS_PARITY_BLOCK_${j + 1}]`,
          createdAt: timestamp
        });
      }

      return chunks;
    }
  }

  /**
   * Attempt to reconstruct object or missing chunks using surviving blocks
   */
  static verifyAndReconstruct(chunks, scheme, kData, mParity) {
    const validChunks = chunks.filter(c => c.isValid);
    const corruptedChunks = chunks.filter(c => !c.isValid);

    if (scheme === STORAGE_SCHEMES.REPLICATION) {
      const canRead = validChunks.length >= 1;
      const needsRepair = corruptedChunks.length > 0;
      return {
        canRead,
        needsRepair,
        reconstructedChunks: canRead ? chunks.map(c => ({ ...c, isValid: true })) : null,
        survivingCount: validChunks.length,
        requiredCount: 1
      };
    } else {
      // Erasure Coding requires at least K valid chunks out of (K + M)
      const canRead = validChunks.length >= kData;
      const needsRepair = corruptedChunks.length > 0 && canRead;

      let repairedChunks = null;
      if (canRead && needsRepair) {
        // Reconstruct missing chunks from surviving K chunks using Reed-Solomon equations
        repairedChunks = chunks.map(c => {
          if (!c.isValid) {
            return {
              ...c,
              isValid: true,
              checksum: generateChecksum(c.contentPreview + '-reconstructed'),
              reconstructedAt: Date.now()
            };
          }
          return c;
        });
      }

      return {
        canRead,
        needsRepair,
        reconstructedChunks: repairedChunks || chunks,
        survivingCount: validChunks.length,
        requiredCount: kData
      };
    }
  }
}
