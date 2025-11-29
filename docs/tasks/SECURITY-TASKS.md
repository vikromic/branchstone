# Security Hardening Tasks - Branchstone Art

**Status**: Ready for Implementation
**Priority**: P0 (Critical), P1 (High), P2 (Medium)
**Estimated Effort**: 8-12 hours

---

## P0 - CRITICAL (Must Fix Immediately)

### P0-1: Fix DOM-Based XSS in i18n Module

**Title**: Eliminate innerHTML usage in translation system
**Status**: PENDING
**Effort**: 1 hour
**Files**: `/docs/js/i18n.js`

**Description**:
Replace all `innerHTML` assignments with safe DOM methods (`textContent`, `appendChild`, `createTextNode`).

**Acceptance Criteria**:
- [ ] No `innerHTML` in i18n.js
- [ ] All translation text safely rendered
- [ ] Line breaks preserved without HTML injection
- [ ] No console errors
- [ ] All pages load correctly
- [ ] Multi-line translations (home.title) still display properly

**Implementation**:

```javascript
// FILE: /docs/js/i18n.js - REPLACE applyTranslations method (lines 58-99)

/**
 * Apply translations to all elements with data-translate attribute
 * @private
 */
applyTranslations() {
  const elements = $$('[data-translate]');

  elements.forEach(element => {
    const key = element.getAttribute('data-translate');
    const translation = this.get(key);

    if (!translation) return;

    // Handle different element types - ALL use safe methods
    if (key === 'home.title') {
      // Multi-line title - split and create elements safely
      const lines = translation.split('\n');
      element.textContent = ''; // Clear safely
      lines.forEach((line, index) => {
        if (index > 0) element.appendChild(document.createElement('br'));
        element.appendChild(document.createTextNode(line.trim()));
      });
    } else if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = translation;
    } else if (element.tagName === 'BUTTON' && !element.querySelector('svg')) {
      element.textContent = translation;
    } else if (element.hasAttribute('placeholder')) {
      element.placeholder = translation;
    } else {
      // Check for line breaks
      if (translation.includes('\n')) {
        const paragraphs = translation.split('\n').filter(p => p.trim());
        const existingParagraphs = element.querySelectorAll('p');

        if (existingParagraphs.length > 0) {
          // Update existing paragraphs safely
          paragraphs.forEach((text, index) => {
            if (existingParagraphs[index]) {
              existingParagraphs[index].textContent = text.trim();
            }
          });
        } else {
          // Create new structure safely
          element.textContent = ''; // Clear safely
          paragraphs.forEach((text, index) => {
            if (index > 0) element.appendChild(document.createElement('br'));
            element.appendChild(document.createTextNode(text.trim()));
          });
        }
      } else {
        element.textContent = translation;
      }
    }
  });

  // Handle placeholder translations separately
  const placeholderElements = $$('[data-translate-placeholder]');
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    const translation = this.get(key);
    if (translation) {
      element.placeholder = translation;
    }
  });

  // Update HTML lang attribute
  document.documentElement.lang = this.currentLang;
}
```

**Testing**:
```bash
# Verify no innerHTML in file
grep -n "\.innerHTML" /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/js/i18n.js
# Should return no results

# Test in browser console
# Visit index.html, gallery.html, about.html, contact.html
# Verify all text renders correctly with proper formatting
# Check home.title displays on two lines correctly
```

**Definition of Done**:
- Code reviewed for safety
- All pages tested in Chrome, Firefox, Safari
- No JavaScript errors in console
- Translations display correctly
- Git commit pushed

---

## P1 - HIGH (Fix This Sprint)

### P1-1: Add Meta CSP Headers to All Pages

**Title**: Implement Content Security Policy
**Status**: PENDING
**Effort**: 2 hours
**Files**: `index.html`, `gallery.html`, `about.html`, `contact.html`, `404.html`, `offline.html`

**Description**:
Add CSP meta tags and security headers to prevent XSS and injection attacks.

**Acceptance Criteria**:
- [ ] All HTML files have CSP meta tags in <head>
- [ ] CSP allows only same-origin scripts
- [ ] CSP allows only same-origin styles
- [ ] CSP allows Google Fonts (with future SRI)
- [ ] CSP allows Formspree endpoint
- [ ] No inline event handlers in HTML
- [ ] No console CSP warnings
- [ ] X-Content-Type-Options set
- [ ] X-XSS-Protection set
- [ ] Referrer-Policy set

**Implementation**:

Add to `<head>` of ALL HTML files:
```html
<!-- FILE: /docs/index.html, gallery.html, about.html, contact.html, 404.html, offline.html -->
<!-- Add after line 25 (after theme-color meta tags) -->

<!-- Security Headers -->
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta name="referrer" content="strict-origin-when-cross-origin">

<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://formspree.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self' https://formspree.io;
  upgrade-insecure-requests;
">

<!-- XSS Protection (legacy browsers) -->
<meta http-equiv="X-XSS-Protection" content="1; mode=block">

<!-- Clickjacking Prevention -->
<script nonce="runtime-generated">
  // Prevent framing
  if (self !== top) {
    top.location = self.location;
  }
</script>
```

**Migration Script**:
```bash
#!/bin/bash
# FILE: scripts/add-security-headers.sh

FILES=("index.html" "gallery.html" "about.html" "contact.html" "404.html" "offline.html")
CSP_TAG='<meta http-equiv="Content-Security-Policy" content="default-src '"'"'self'"'"'; script-src '"'"'self'"'"'; style-src '"'"'self'"'"' https://fonts.googleapis.com; font-src '"'"'self'"'"' https://fonts.gstatic.com; img-src '"'"'self'"'"' data: https:; connect-src '"'"'self'"'"' https://formspree.io; frame-ancestors '"'"'none'"'"'; base-uri '"'"'self'"'"'; form-action '"'"'self'"'"' https://formspree.io; upgrade-insecure-requests;">'

for file in "${FILES[@]}"; do
  if grep -q "Content-Security-Policy" "/Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/$file"; then
    echo "CSP already in $file"
  else
    echo "Adding CSP to $file"
    # Insert after theme-color meta tag
    sed -i '' '/<meta name="theme-color"/a\
    '"$CSP_TAG"'
    ' "/Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/$file"
  fi
done
```

**Testing**:
```bash
# Check CSP is present in all files
for file in index.html gallery.html about.html contact.html 404.html offline.html; do
  echo "Checking $file..."
  grep -c "Content-Security-Policy" /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/$file
done

# Test in browser (F12 Console)
# No CSP violation errors should appear
# All assets should load normally

# Use Mozilla Observatory to validate
# https://observatory.mozilla.org/analyze/branchstone.art
```

**Definition of Done**:
- All HTML files updated
- No console CSP warnings
- All pages load and function normally
- Git commit with message: "security: add CSP and security headers to all pages"

---

### P1-2: Migrate Contact Form to Privacy-Respecting Service

**Title**: Replace Formspree with GDPR-compliant service
**Status**: PENDING
**Effort**: 3 hours
**Files**: `/docs/contact.html`, `/docs/js/config.js`, `/docs/js/services/api.js`

**Description**:
Move away from Formspree to a service with better privacy guarantees and GDPR compliance.

**Acceptance Criteria**:
- [ ] New contact form service selected (Brevo, Basin, Getform)
- [ ] Contact form still submits successfully
- [ ] Form validation still works
- [ ] Success/error messages display correctly
- [ ] No PII exposed to third parties
- [ ] Service is GDPR-compliant
- [ ] Data retention policy is clear (<90 days)
- [ ] No tracking pixels or analytics

**Options**:

**Option A: Brevo (Formerly Sendinblue)** - Recommended
- GDPR-compliant (European company)
- Email forwarding to your inbox
- No tracking
- Free tier available
- Setup: 15 minutes

**Option B: Basin**
- Privacy-focused
- Simple API
- GDPR-compliant
- Free tier

**Option C: Keep Formspree + Add Privacy Policy**
- If staying with Formspree, verify their GDPR compliance
- Add to privacy policy
- Configure data retention to minimum

**Implementation** (using Brevo):

1. Sign up at https://www.brevo.com (free)
2. Create new API endpoint in Brevo CRM
3. Get form endpoint ID

4. Update config:
```javascript
// FILE: /docs/js/config.js - REPLACE line 12

export const CONFIG = {
  api: {
    artworks: 'js/artworks.json',
    translations: 'js/translations.json',
    // Brevo contact form endpoint
    contactForm: 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation',
    // Or Getform endpoint
    // contactForm: 'https://getform.io/f/{YOUR_ID}',
  },
  // ... rest of config
};
```

5. Update HTML form:
```html
<!-- FILE: /docs/contact.html - REPLACE form action (line 96) -->

<form action="https://getform.io/f/YOUR_ENDPOINT_ID"
      method="POST"
      id="contact-form"
      novalidate
      enctype="application/x-www-form-urlencoded">
```

6. Update API service:
```javascript
// FILE: /docs/js/services/api.js - REPLACE contactAPI

export const contactAPI = {
  async submit(data) {
    try {
      // Create FormData for URL-encoded submission
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('message', data.message);

      const response = await fetch(CONFIG.api.contactForm, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Contact form error:', error);
      throw error;
    }
  },
};
```

**Testing**:
```bash
# Test contact form submission
# Visit branchstone.art/contact.html
# Submit test form
# Verify email received in your inbox
# Check no tracking cookies set (DevTools Application tab)

# Run curl test
curl -X POST https://getform.io/f/ENDPOINT_ID \
  -d "name=Test&email=test@example.com&message=Test%20message"
```

**Definition of Done**:
- New service account created
- Form endpoint configured
- Test submission successful
- Email received in inbox
- Privacy policy updated
- Old Formspree endpoint removed
- Git commit: "refactor: migrate contact form to privacy-respecting service"

---

### P1-3: Add SRI Hashes to Google Fonts

**Title**: Implement Subresource Integrity for external CDN
**Status**: PENDING
**Effort**: 1 hour
**Files**: `index.html`, `gallery.html`, `about.html`, `contact.html`, `404.html`

**Description**:
Add SRI hashes to Google Fonts links to prevent CDN compromise.

**Acceptance Criteria**:
- [ ] SRI hashes added to Google Fonts link
- [ ] crossorigin="anonymous" attribute present
- [ ] Fonts still load correctly
- [ ] No console warnings
- [ ] Fallback fonts configured
- [ ] All pages use consistent hash

**Implementation**:

1. Get SRI hash:
```bash
# Download Google Fonts CSS
curl -s "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Cormorant+Garamond:wght@600&display=swap" > /tmp/fonts.css

# Generate SHA384 hash
openssl dgst -sha384 -binary /tmp/fonts.css | openssl base64

# Output: sha384-abc123... (save this)
```

2. Update all HTML files:
```html
<!-- FILE: /docs/index.html, gallery.html, about.html, contact.html, 404.html - REPLACE lines 36-38 -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Cormorant+Garamond:wght@600&display=swap"
      rel="stylesheet"
      media="print"
      onload="this.media='all'"
      integrity="sha384-YOUR_HASH_HERE"
      crossorigin="anonymous">

<!-- Fallback for system fonts if CDN fails -->
<style>
  @font-face {
    font-family: 'Inter Fallback';
    src: system-ui;
  }
  @supports not (font-display: auto) {
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
  }
</style>
```

**Testing**:
```bash
# Verify SRI hash in all files
grep -r "integrity=" /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/*.html | grep fonts

# Test in browser
# Open DevTools Network tab
# Verify fonts load with 200 status
# Check no SRI integrity errors in console

# Test with modified CSS (verify hash validation works)
# Temporarily modify fonts URL to return different CSS
# Should see SRI violation in console
```

**Definition of Done**:
- SRI hashes added to all HTML files
- Fonts load correctly
- Fallback fonts configured
- No console errors
- Git commit: "security: add SRI hashes to Google Fonts"

---

### P1-4: Fix Service Worker Cache Validation

**Title**: Implement integrity checking in SW cache
**Status**: PENDING
**Effort**: 2 hours
**Files**: `/docs/sw.js`

**Description**:
Add hash verification to service worker to prevent cache poisoning attacks.

**Acceptance Criteria**:
- [ ] Critical assets have SHA256 hashes
- [ ] SW validates cached assets before serving
- [ ] Poisoned cache detected and removed
- [ ] Service worker updates correctly
- [ ] All assets serve properly offline
- [ ] Performance not degraded significantly

**Implementation**:

```javascript
// FILE: /docs/sw.js - REPLACE entire file

const CACHE_NAME = 'branchstone-v2';

// Asset integrity hashes (SHA-256)
const CRITICAL_ASSETS = {
  './': 'sha256-hash-of-index-html',
  './index.html': 'sha256-hash-of-index-html',
  './gallery.html': 'sha256-hash-of-gallery-html',
  './about.html': 'sha256-hash-of-about-html',
  './contact.html': 'sha256-hash-of-contact-html',
  './offline.html': 'sha256-hash-of-offline-html',
  './js/app.js': 'sha256-hash-of-app-js',
  './js/config.js': 'sha256-hash-of-config-js',
  './js/i18n.js': 'sha256-hash-of-i18n-js',
  './css/bundle.css': 'sha256-hash-of-bundle-css',
};

const STATIC_ASSETS = Object.keys(CRITICAL_ASSETS);

const IMAGE_CACHE = 'branchstone-images-v2';
const API_CACHE = 'branchstone-api-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('branchstone-') &&
                   cacheName !== CACHE_NAME &&
                   cacheName !== IMAGE_CACHE &&
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Compute SHA-256 hash of content
async function computeHash(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256-' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate asset integrity
async function validateAssetIntegrity(url, response) {
  // Non-critical assets skip validation
  if (!CRITICAL_ASSETS[url]) return true;

  try {
    const buffer = await response.clone().arrayBuffer();
    const computedHash = await computeHash(buffer);
    const expectedHash = CRITICAL_ASSETS[url];

    if (computedHash !== expectedHash) {
      console.warn(`[SW] Integrity check failed for ${url}`);
      console.warn(`[SW] Expected: ${expectedHash}`);
      console.warn(`[SW] Got: ${computedHash}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[SW] Error validating ${url}:`, error);
    // Fail open - if validation fails, serve cached version
    return true;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin === location.origin) {
    if (request.destination === 'image') {
      event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    } else if (url.pathname.endsWith('.json')) {
      event.respondWith(networkFirstWithCache(request, API_CACHE));
    } else if (
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname === '/'
    ) {
      event.respondWith(cacheFirstWithIntegrityCheck(request, CACHE_NAME));
    }
  }
});

async function cacheFirstWithIntegrityCheck(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Validate cached response
    const isValid = await validateAssetIntegrity(request.url, cachedResponse.clone());
    if (isValid) {
      return cachedResponse;
    } else {
      // Cache poisoned - remove and fetch fresh
      const cache = await caches.open(cacheName);
      await cache.delete(request);
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Validate before caching
      const isValid = await validateAssetIntegrity(request.url, networkResponse.clone());
      if (isValid) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    if (request.destination === 'document') {
      const offlinePage = await caches.match('./offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline - Data not available' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    });
  }
}
```

**Generating Asset Hashes**:
```bash
#!/bin/bash
# FILE: scripts/generate-sw-hashes.sh

cd /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs

echo "// Asset integrity hashes (update in sw.js)"
echo "const CRITICAL_ASSETS = {"

for file in index.html gallery.html about.html contact.html offline.html \
            js/app.js js/config.js js/i18n.js \
            css/bundle.css; do
  if [ -f "$file" ]; then
    hash=$(openssl dgst -sha256 -binary "$file" | openssl base64 | sed 's/^/sha256-/' | sed 's/=$//')
    echo "  './$file': '$hash',"
  fi
done

echo "};"
```

Run to get hashes:
```bash
bash /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/scripts/generate-sw-hashes.sh
```

**Testing**:
```bash
# Test SW still caches correctly
# Visit branchstone.art offline (disconnect internet)
# Verify pages still load from cache

# Test integrity validation
# DevTools → Application → Service Workers
# Check "Update on reload" is enabled during development

# Verify no errors in console
# Test with manually corrupted cache (advanced)
```

**Definition of Done**:
- Asset hashes computed and added
- SW validates cached assets
- Corrupted cache detected and removed
- Service worker updates work correctly
- All pages serve offline
- Git commit: "security: implement SW cache integrity validation"

---

### P1-5: Obfuscate Email Address

**Title**: Hide email from email harvesting bots
**Status**: PENDING
**Effort**: 30 minutes
**Files**: `/docs/contact.html`

**Description**:
Encode email address in contact page to prevent automated harvesting.

**Acceptance Criteria**:
- [ ] Email not visible as plaintext in HTML
- [ ] Email clickable for legitimate users
- [ ] JavaScript-free fallback provided
- [ ] No console errors
- [ ] Accessible to screen readers

**Implementation**:

```html
<!-- FILE: /docs/contact.html - REPLACE lines 88-89 -->

<li>
  <span aria-hidden="true">📧</span>
  <span data-translate="contact.email">Email:</span>
  <!-- Obfuscated email with JS fallback -->
  <a id="email-link" href="#" onclick="return false;">Click to reveal email</a>
  <noscript>
    <span>Email address is hidden. Please use the contact form below.</span>
  </noscript>
</li>

<script>
// Decode and display email when user clicks
document.getElementById('email-link').addEventListener('click', function(e) {
  e.preventDefault();
  // Base64 encoded: thebranchstone@gmail.com
  const email = atob('dGhlYnJhbmNoc3RvbmVAZ21haWwuY29t');
  this.href = 'mailto:' + email;
  this.textContent = email;
  this.onclick = null; // Allow normal click
});
</script>
```

**Alternative** (Recommended - Remove email entirely):
```html
<!-- FILE: /docs/contact.html - REPLACE lines 88-89 -->

<li>
  <span aria-hidden="true">📧</span>
  <span data-translate="contact.email">Email:</span>
  <span>Use the contact form below to get in touch</span>
</li>
```

**Testing**:
```bash
# Check HTML doesn't contain plaintext email
grep -n "thebranchstone@gmail.com" /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/contact.html
# Should show 0 results or only in script

# Test email harvesting doesn't work
curl -s https://branchstone.art/contact.html | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+'
# Should return nothing
```

**Definition of Done**:
- Email not in plaintext HTML
- Email revealed only on user action
- No bot can harvest email from page source
- Git commit: "security: obfuscate email address in contact page"

---

## P2 - MEDIUM (Next Sprint)

### P2-1: Create Privacy Policy

**Title**: Document data collection and third-party usage
**Status**: PENDING
**Effort**: 2 hours
**Files**: `/docs/PRIVACY.md`, `/docs/privacy.html` (new)

**Description**:
Create comprehensive privacy policy documenting:
- Data collection (contact form)
- Third-party services (Formspree, Google Fonts)
- Data retention
- User rights (GDPR, CCPA)
- Cookies (theme preference)

**Acceptance Criteria**:
- [ ] Privacy policy exists and is detailed
- [ ] GDPR compliance documented
- [ ] CCPA compliance mentioned
- [ ] Third-party services listed
- [ ] Data retention period specified
- [ ] Link in footer of all pages
- [ ] Easy to understand language

**Template**:
```markdown
# FILE: /docs/PRIVACY.md

# Privacy Policy

**Last Updated**: November 28, 2025

## Overview

The Branchstone Art website respects your privacy. This policy explains what information we collect and how we use it.

## Information We Collect

### Contact Form
When you submit the contact form, we collect:
- Your name
- Your email address
- Your message

This information is sent to [SERVICE_PROVIDER] for fulfillment.

### Cookies
We store one cookie locally in your browser:
- `theme`: Your light/dark mode preference (no tracking)

This cookie never leaves your device.

### Analytics
We do NOT use Google Analytics, Facebook Pixel, or any tracking services.

## Third-Party Services

### [Formspree/Brevo/Getform]
Contact form submissions are sent to [SERVICE_PROVIDER].
- Privacy Policy: [URL]
- Data Processing: [GDPR/CCPA compliant]
- Retention: [X days]

### Google Fonts
We load fonts from Google Fonts.
- Privacy Policy: https://policies.google.com/privacy
- Data: Google receives your IP address (standard CDN behavior)

### Instagram
We link to Instagram (@branchstone.art).
- Instagram's privacy policy applies: https://help.instagram.com/519522125107947

## Your Rights

### Under GDPR (EU)
- Right to access your data
- Right to delete your data
- Right to data portability
- Right to withdraw consent

Contact us to exercise these rights.

### Under CCPA (California)
- Right to know what data is collected
- Right to delete personal information
- Right to opt-out of sale (we don't sell data)

## Contact

For privacy questions, contact: [CONTACT_METHOD]

## Updates

We may update this policy. The "Last Updated" date above reflects our most recent revision.
```

**Definition of Done**:
- Privacy policy created
- Covers GDPR and CCPA requirements
- Links to all pages in footer
- Legal review (optional but recommended)
- Git commit: "docs: add comprehensive privacy policy"

---

### P2-2: Create SECURITY.md with Vulnerability Disclosure

**Title**: Document security reporting process
**Status**: PENDING
**Effort**: 1 hour
**Files**: `/docs/SECURITY.md` (new)

**Description**:
Create security.md with responsible disclosure policy.

**Acceptance Criteria**:
- [ ] File exists in repo root
- [ ] Security contact provided
- [ ] Reporting process documented
- [ ] Response time expectations set
- [ ] Bug bounty info (if applicable)

**Template**:
```markdown
# FILE: /docs/SECURITY.md

# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Branchstone Art, please report it responsibly.

### How to Report

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: security@branchstone.art (or your preferred contact method)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information (optional)

### Response Timeline

- **Initial response**: Within 24 hours
- **Fix timeline**: 30 days (for critical issues)
- **Public disclosure**: After patch is released

## Supported Versions

| Version | Status | End of Life |
|---------|--------|-------------|
| Current | Supported | N/A |
| Previous | Community | N/A (static site) |

## Security Measures

- No user authentication required (static site)
- All form submissions encrypted (HTTPS)
- Subresource Integrity (SRI) on external resources
- Content Security Policy (CSP) implemented
- Security headers configured

## Known Limitations

- Third-party service (Formspree/Brevo) dependency for contact form
- Google Fonts loaded from external CDN
- Service Worker for offline support

## Future Security Improvements

- See `/docs/tasks/SECURITY-TASKS.md` for planned improvements
```

**Definition of Done**:
- SECURITY.md created
- Clear reporting instructions
- Git commit: "docs: add security vulnerability disclosure policy"

---

### P2-3: Add Rate Limiting to Contact Form

**Title**: Prevent contact form abuse and spam
**Status**: PENDING
**Effort**: 1 hour
**Files**: `/docs/js/components/FormValidator.js`

**Description**:
Implement client-side rate limiting to prevent rapid form submissions (abuse prevention).

**Acceptance Criteria**:
- [ ] Form can't be submitted more than once per 5 seconds
- [ ] User sees clear message when rate limited
- [ ] Rate limit resets after timeout
- [ ] Doesn't affect legitimate users
- [ ] Works with contact form service

**Implementation**:

```javascript
// FILE: /docs/js/components/FormValidator.js - ADD to class

export class FormValidator {
  constructor(options = {}) {
    this.form = $(options.formSelector || '#contact-form');
    this.rules = options.rules || this.getDefaultRules();

    // Rate limiting
    this.submissionCooldown = 5000; // 5 seconds
    this.lastSubmissionTime = 0;

    if (!this.form) return;

    this.fields = new Map();
    this.init();
  }

  attachEventListeners() {
    // Form submission with rate limiting
    on(this.form, 'submit', (e) => {
      // Rate limiting check
      const now = Date.now();
      if (now - this.lastSubmissionTime < this.submissionCooldown) {
        e.preventDefault();
        this.showRateLimitMessage();
        return;
      }
      this.lastSubmissionTime = now;

      if (!this.validateAll()) {
        e.preventDefault();
        this.focusFirstInvalid();
      }
    });

    // Real-time validation
    this.fields.forEach(({ field }, fieldName) => {
      on(field, 'blur', () => this.validateField(fieldName));
      on(field, 'input', () => {
        if (field.value.trim()) {
          this.clearFieldError(fieldName);
        }
      });
    });
  }

  /**
   * Show rate limit message
   * @private
   */
  showRateLimitMessage() {
    const messageEl = document.getElementById('form-message');
    if (!messageEl) return;

    messageEl.textContent = 'Please wait a few seconds before submitting again.';
    messageEl.className = 'form-message error';

    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'form-message';
    }, 3000);
  }

  // ... rest of class unchanged
}
```

Add CSS for rate limit message:
```css
/* FILE: /docs/css/contact.css (or bundle.css) */

.form-message.error {
  color: #d32f2f;
  padding: 12px;
  margin-top: 8px;
  background: #ffebee;
  border-radius: 4px;
  font-size: 14px;
}
```

**Testing**:
```bash
# Test rate limiting in browser
# Visit /contact.html
# Submit form twice within 5 seconds
# Should see rate limit message on second attempt
# Wait 5 seconds and try again - should work
```

**Definition of Done**:
- Rate limiting implemented
- User sees clear message
- Doesn't block legitimate users
- Git commit: "security: add rate limiting to contact form"

---

## P3 - LOW (Nice to Have)

### P3-1: Set Up Security Monitoring

**Title**: Automated vulnerability scanning
**Status**: PENDING
**Effort**: 2 hours

**Recommendations**:
1. Enable GitHub Dependabot alerts
2. Set up Mozilla Observatory monitoring
3. Monthly manual security review
4. Subscribe to npm security advisories

### P3-2: Migrate from GitHub Pages to Netlify/Vercel

**Title**: Better security header control
**Status**: FUTURE
**Effort**: 4 hours

### P3-3: Implement HSTS Preloading

**Title**: Force HTTPS for all future connections
**Status**: FUTURE
**Effort**: 1 hour

---

## Implementation Checklist

### Week 1
- [ ] P0-1: Fix i18n XSS
- [ ] P1-1: Add CSP headers
- [ ] P1-3: Add SRI hashes
- [ ] P1-5: Obfuscate email

### Week 2
- [ ] P1-2: Migrate contact form
- [ ] P1-4: Fix SW cache validation
- [ ] P2-1: Create privacy policy
- [ ] P2-2: Create SECURITY.md

### Week 3
- [ ] P2-3: Add rate limiting
- [ ] Security testing and validation
- [ ] Penetration testing (recommended)
- [ ] Security audit review

---

## Testing Strategy

### Automated Tests
```bash
# Check for vulnerable patterns
grep -r "innerHTML" /docs/js --include="*.js" | wc -l
grep -r "eval" /docs/js --include="*.js" | wc -l

# Dependency audit
npm audit --production

# Security headers validation
curl -I https://branchstone.art | grep -i "content-security-policy"
```

### Manual Testing
1. **XSS Testing**: Try to inject `<img src=x onerror="alert(1)">` in contact form
2. **CSP Testing**: Try to inject inline scripts (should be blocked)
3. **Form Testing**: Submit contact form, verify email received
4. **Offline Testing**: Disable internet, verify site still loads
5. **Performance**: Run Lighthouse audit to ensure no regression

### Browser Testing
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile (iOS Safari, Chrome Mobile)

---

## Rollback Plan

If issues occur:
1. Revert last commit: `git revert HEAD`
2. Push immediately: `git push origin main`
3. Rollback should be automatic on GitHub Pages (immediate)
4. Document issue in GitHub Issues
5. Create patch branch to fix properly

---

## Success Metrics

**After all fixes implemented**:
- [ ] No XSS vulnerabilities
- [ ] CSP headers present
- [ ] SRI hashes validated
- [ ] Service Worker cache validated
- [ ] Contact form privacy-respecting
- [ ] No exposed PII
- [ ] GDPR-compliant
- [ ] Security score: 8.5+/10
- [ ] Zero security warnings in Observatory
- [ ] A+ rating on SSL Labs

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [GDPR Compliance](https://gdpr.eu/)
- [CCPA Privacy Rights](https://oag.ca.gov/privacy/ccpa)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
