import assert from 'node:assert/strict';
import fs from 'node:fs';

const TYPOGRAPHY_PATH = new URL('./docs/css/typography.css', import.meta.url);
const COMPONENTS_PATH = new URL('./docs/css/components.css', import.meta.url);
const typographyCss = fs.readFileSync(TYPOGRAPHY_PATH, 'utf8');
const componentsCss = fs.readFileSync(COMPONENTS_PATH, 'utf8');

const getRuleBlock = (css, selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ruleRegex = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(ruleRegex);
  if (!match) {
    throw new Error(`Missing CSS rule for selector: ${selector}`);
  }
  return match[1];
};

const run = () => {
  // Happy path: text-link hover color should not apply to button links.
  assert.ok(
    typographyCss.includes('a:hover:not(.btn)'),
    'expected typography hover rule to exclude .btn links'
  );

  // Happy path: primary button base style still defines inverse text color.
  const primaryRule = getRuleBlock(componentsCss, '.btn--primary');
  assert.ok(
    /color:\s*var\(--text-inverse\)/.test(primaryRule),
    'expected .btn--primary to preserve inverse text color'
  );

  // Happy path: primary button hover style must keep inverse text for readability.
  const primaryHoverRule = getRuleBlock(componentsCss, '.btn--primary:hover');
  assert.ok(
    /color:\s*var\(--text-inverse\)/.test(primaryHoverRule),
    'expected .btn--primary:hover to preserve inverse text color'
  );

  // Error path: missing selector lookup must fail fast with actionable details.
  assert.throws(
    () => getRuleBlock(componentsCss, '.definitely-missing-selector'),
    /Missing CSS rule for selector: \.definitely-missing-selector/
  );
};

run();
console.log('button hover visibility tests passed');
