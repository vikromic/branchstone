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

const envelopeTtlByKey = Object.freeze({
  [storageKeys.pendingInquiry]: storageTtls.pendingInquiry,
  [storageKeys.commissionDraft]: storageTtls.commissionDraft,
});

export function safeRead(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable; the UI remains usable for this session.
  }
}

export function readEnvelope(key, ttl = envelopeTtlByKey[key], now = Date.now()) {
  const raw = safeRead(key);
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw);
    if (!envelope || typeof envelope.timestamp !== "number") throw new Error("invalid envelope");
    if (!Number.isFinite(ttl) || now - envelope.timestamp >= ttl) {
      safeRemove(key);
      return null;
    }
    return envelope.value ?? envelope;
  } catch {
    safeRemove(key);
    return null;
  }
}

export function writeEnvelope(key, value, timestamp = Date.now()) {
  return safeWrite(key, JSON.stringify({ value, timestamp }));
}

export function purgeExpiredEnvelopes(now = Date.now()) {
  Object.entries(envelopeTtlByKey).forEach(([key, ttl]) => {
    readEnvelope(key, ttl, now);
  });
}
