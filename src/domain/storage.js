export const storageKeys = Object.freeze({
  theme: "branchstone-theme",
  language: "branchstone.language",
  favorites: "branchstone_favorites",
  pendingInquiry: "pendingInquiry",
  commissionDraft: "branchstone_commission_draft",
});

const HOUR_IN_MS = 60 * 60 * 1000;

export const storageTtls = Object.freeze({
  pendingInquiry: HOUR_IN_MS,
  commissionDraft: 24 * HOUR_IN_MS,
});

export const envelopeTtlByKey = Object.freeze({
  [storageKeys.pendingInquiry]: storageTtls.pendingInquiry,
  [storageKeys.commissionDraft]: storageTtls.commissionDraft,
});

// Decodes a stored `{ value, timestamp }` envelope. `discard` tells the caller
// to remove the stored string because it is expired or unreadable.
export function decodeEnvelope(raw, ttl, now) {
  if (!raw) return { value: null, discard: false };
  try {
    const envelope = JSON.parse(raw);
    if (!envelope || typeof envelope.timestamp !== "number") throw new Error("invalid envelope");
    if (!Number.isFinite(ttl) || now - envelope.timestamp >= ttl) return { value: null, discard: true };
    return { value: envelope.value ?? envelope, discard: false };
  } catch {
    return { value: null, discard: true };
  }
}

export function encodeEnvelope(value, timestamp) {
  return JSON.stringify({ value, timestamp });
}
