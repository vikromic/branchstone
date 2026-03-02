import assert from 'node:assert/strict';
import fs from 'node:fs';

const TOKENS_PATH = new URL('./docs/css/tokens.css', import.meta.url);
const tokensCss = fs.readFileSync(TOKENS_PATH, 'utf8');

const getToken = (tokenName) => {
  const tokenRegex = new RegExp(`--${tokenName}:\\s*([^;]+);`);
  const match = tokensCss.match(tokenRegex);
  if (!match) {
    throw new Error(`Missing token: --${tokenName}`);
  }
  return match[1].trim();
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const raw = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const value = Number.parseInt(raw, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
};

const contrastRatio = (foregroundHex, backgroundHex) => {
  const fg = luminance(foregroundHex);
  const bg = luminance(backgroundHex);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
};

const assertMinContrast = (name, foregroundHex, backgroundHex, minRatio) => {
  const ratio = contrastRatio(foregroundHex, backgroundHex);
  assert.ok(
    ratio >= minRatio,
    `${name} contrast ${ratio.toFixed(2)} is below ${minRatio}`
  );
};

const run = () => {
  const bgPrimary = getToken('bg-primary');
  const textPrimary = getToken('text-primary');
  const textSecondary = getToken('text-secondary');
  const textTertiary = getToken('text-tertiary');
  const accentPrimary = getToken('accent-primary');
  const copper400 = getToken('copper-400');
  const copper500 = getToken('copper-500');
  const copper600 = getToken('copper-600');

  // Happy path: light-theme text and CTA colors satisfy accessibility targets.
  assertMinContrast('text-primary on bg-primary', textPrimary, bgPrimary, 7);
  assertMinContrast('text-secondary on bg-primary', textSecondary, bgPrimary, 4.5);
  assertMinContrast('text-tertiary on bg-primary', textTertiary, bgPrimary, 4.5);
  assertMinContrast('white on accent-primary', '#FFFFFF', accentPrimary, 4.5);
  assertMinContrast('white on copper-400', '#FFFFFF', copper400, 4.5);
  assertMinContrast('white on copper-500', '#FFFFFF', copper500, 4.5);
  assertMinContrast('white on copper-600', '#FFFFFF', copper600, 4.5);

  // Happy path: legacy compatibility tokens required by existing components exist.
  assert.ok(getToken('surface-primary').length > 0);
  assert.ok(getToken('surface-secondary').length > 0);
  assert.ok(getToken('surface-tertiary').length > 0);
  assert.ok(getToken('font-heading').length > 0);
  assert.ok(getToken('border-color').length > 0);
  assert.ok(getToken('border-light').length > 0);
  assert.ok(getToken('text-muted').length > 0);
  assert.ok(getToken('overlay-scrim').length > 0);

  // Error path: missing token should fail fast with actionable error text.
  assert.throws(
    () => getToken('definitely-missing-token'),
    /Missing token: --definitely-missing-token/
  );
};

run();
console.log('theme contrast tests passed');
