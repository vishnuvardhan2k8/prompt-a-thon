// Distributed System Constants & Type Definitions

export const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', color: '#3b82f6' },
  { id: 'us-west-2', name: 'US West (Oregon)', color: '#10b981' },
  { id: 'eu-west-1', name: 'EU West (Ireland)', color: '#8b5cf6' },
  { id: 'ap-southeast-1', name: 'AP Southeast (Singapore)', color: '#f59e0b' }
];

export const STORAGE_SCHEMES = {
  REPLICATION: 'replication',
  ERASURE_CODING: 'erasure_coding'
};

export const DEFAULT_CONFIG = {
  storageScheme: STORAGE_SCHEMES.REPLICATION,
  replicationFactor: 3, // N
  writeQuorum: 2,        // W
  readQuorum: 2,         // R
  erasureK: 4,           // Data chunks (K)
  erasureM: 2,           // Parity chunks (M)
  heartbeatIntervalMs: 2000,
  scrubIntervalMs: 8000,
  autoRepairEnabled: true,
  strictConsistency: true,
  maxSimulatedNodeLatencyMs: 30
};

export function generateUUID() {
  return 'x' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

export function generateChecksum(dataString) {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

export function calculateStorageEfficiency(scheme, n, k, m) {
  if (scheme === STORAGE_SCHEMES.REPLICATION) {
    return Math.round((1 / n) * 100);
  } else {
    return Math.round((k / (k + m)) * 100);
  }
}
