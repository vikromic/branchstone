# ADR-001: Static vs. Dynamic Architecture

**Status**: Accepted
**Date**: 2025-11-28
**Decision Makers**: Engineering Lead

---

## Context

The Branchstone Art portfolio is currently a static website hosted on GitHub Pages. As we plan next-generation improvements including CMS integration, e-commerce, and advanced features, we must decide whether to:

1. **Keep Static Architecture** - Enhance current approach with build-time generation
2. **Migrate to SSR/SSG Framework** - Use Next.js, Astro, or similar
3. **Go Full Dynamic** - Backend API with frontend SPA

### Current Architecture
- Pure static HTML, CSS, ES6 modules
- JSON files for data (artworks.json, translations.json)
- GitHub Pages hosting (free, reliable)
- No build process (direct file editing)

### Requirements Driving Decision
- Artist needs to update content without code changes
- Performance must remain excellent (sub-2s LCP)
- SEO is critical for artwork discovery
- Budget should remain minimal ($0-50/month)
- E-commerce capability desired (future)

---

## Decision

**Keep Static-First Architecture with Build-Time Enhancement**

We will:
1. Maintain static HTML output as the final deliverable
2. Add a build step for optimization (bundling, image processing)
3. Integrate a Git-based CMS (Decap CMS) for content editing
4. Generate pages at build time (static site generation)
5. Keep GitHub Pages hosting initially, with option to migrate

---

## Consequences

### Positive
- **Performance**: Static files served from CDN = fastest possible delivery
- **Security**: No server to attack, no database vulnerabilities
- **Cost**: GitHub Pages is free, CDN costs minimal
- **Simplicity**: No server maintenance, scaling is automatic
- **Reliability**: Static hosting has near-100% uptime
- **SEO**: Full HTML delivered on first request (best for crawlers)
- **Offline**: PWA caching works perfectly with static assets

### Negative
- **Build Step Required**: Changes require rebuild (adds ~30-60s delay)
- **No Real-Time Features**: Comments, live updates need external services
- **E-commerce Complexity**: Payment processing needs third-party (Stripe Checkout)
- **Dynamic Content**: Features like search must be client-side

### Mitigations
- Automate builds via GitHub Actions (trigger on content change)
- Use third-party services for dynamic features (Formspree, Stripe)
- Client-side search is performant for ~100 artworks

---

## Alternatives Considered

### Option A: Next.js with SSG
**Pros**: Modern framework, great DX, hybrid SSG/SSR
**Cons**: Overkill for portfolio, larger bundle, Vercel lock-in
**Why Rejected**: Added complexity without clear benefit for this use case

### Option B: Astro
**Pros**: Modern, islands architecture, zero-JS by default
**Cons**: Learning curve, smaller ecosystem
**Why Rejected**: Good option, but current vanilla JS is working well

### Option C: Full Backend (Node.js + Database)
**Pros**: Maximum flexibility, real-time features
**Cons**: Server costs, maintenance, security burden, overkill
**Why Rejected**: Portfolio doesn't need dynamic server capabilities

### Option D: WordPress
**Pros**: Easy CMS, huge ecosystem
**Cons**: PHP hosting costs, security updates, performance overhead
**Why Rejected**: Static is simpler, faster, cheaper

---

## Implementation Notes

1. **Phase 1**: Add build script using Vite or esbuild
   - CSS/JS bundling and minification
   - Image optimization pipeline

2. **Phase 2**: Integrate Decap CMS
   - Git-based content management
   - Editorial workflow with preview

3. **Phase 3**: Consider Netlify/Vercel migration
   - If build times or features require
   - Maintain static output

---

## References

- [JAMstack Architecture](https://jamstack.org/)
- [Decap CMS Documentation](https://decapcms.org/)
- [GitHub Pages Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#limits-on-use-of-github-pages)
