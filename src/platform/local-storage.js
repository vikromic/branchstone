import { decodeEnvelope, encodeEnvelope, envelopeTtlByKey } from "../domain/storage.js";

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
  const { value, discard } = decodeEnvelope(safeRead(key), ttl, now);
  if (discard) safeRemove(key);
  return value;
}

export function writeEnvelope(key, value, timestamp = Date.now()) {
  return safeWrite(key, encodeEnvelope(value, timestamp));
}

export function purgeExpiredEnvelopes(now = Date.now()) {
  Object.entries(envelopeTtlByKey).forEach(([key, ttl]) => {
    readEnvelope(key, ttl, now);
  });
}
