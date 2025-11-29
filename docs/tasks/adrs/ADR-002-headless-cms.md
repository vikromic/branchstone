# ADR-002: Headless CMS Selection

**Status**: Proposed
**Date**: 2025-11-28
**Decision Makers**: Engineering Lead, User (pending input)

---

## Context

The artist currently manages content by editing JSON files and HTML directly. This requires technical knowledge and is error-prone. A Content Management System (CMS) would enable:

- Adding new artworks with images
- Editing descriptions and metadata
- Managing translations
- Publishing blog posts/stories
- Updating "about" content

### Requirements
- **Ease of Use**: Non-technical artist can manage content
- **Image Handling**: Upload, crop, optimize images
- **Preview**: See changes before publishing
- **Multi-language**: Support EN/UA (and future languages)
- **Cost**: Minimize ongoing expenses
- **Integration**: Work with GitHub Pages static hosting
- **Version Control**: Ability to revert changes

---

## Decision

**Recommended: Decap CMS (formerly Netlify CMS)**

Pending user input on priorities and budget.

---

## Options Evaluated

### Option A: Decap CMS (Recommended)
**Type**: Git-based, open-source
**Cost**: Free (self-hosted admin panel)
**Hosting**: Works with GitHub Pages

**Pros**:
- Free and open-source
- Content stored in Git (versioned, backed up)
- Works with any static host
- No vendor lock-in
- Editorial workflow with drafts
- Image uploads to repository
- Customizable admin UI

**Cons**:
- Limited to ~100MB images per repo (GitHub limit)
- No real-time collaboration
- Admin UI can be slow with many entries
- Requires initial setup

**Best For**: Projects wanting full control and zero cost

---

### Option B: Sanity.io
**Type**: API-based, hosted
**Cost**: Free tier (500K API calls, 10GB bandwidth), then $99/month
**Hosting**: Any (API-based)

**Pros**:
- Excellent UI and developer experience
- Real-time collaboration
- Powerful schema customization
- Built-in image CDN (Sanity CDN)
- Portable text for rich content
- Generous free tier

**Cons**:
- Vendor lock-in (proprietary)
- Costs scale with traffic
- Requires build step to fetch content
- Learning curve for schema

**Best For**: Projects needing advanced content modeling

---

### Option C: Contentful
**Type**: API-based, enterprise
**Cost**: Free tier (5 users, 25K records), then $300/month
**Hosting**: Any (API-based)

**Pros**:
- Industry standard, very reliable
- Excellent documentation
- Strong localization support
- Enterprise features

**Cons**:
- Expensive paid tiers
- Complex for simple use cases
- Free tier has limitations

**Best For**: Enterprise projects with budget

---

### Option D: Strapi (Self-hosted)
**Type**: Headless CMS, self-hosted
**Cost**: Free (open-source), hosting costs vary
**Hosting**: Requires Node.js server

**Pros**:
- Full control, customizable
- No API limits
- Plugin ecosystem
- Good admin UI

**Cons**:
- Requires server hosting ($5-20/month)
- Maintenance burden
- Breaks static-only architecture

**Best For**: Projects needing custom backend

---

### Option E: No CMS (Keep Current)
**Type**: File-based editing
**Cost**: Free
**Hosting**: N/A

**Pros**:
- Zero setup
- No dependencies
- Maximum performance

**Cons**:
- Requires technical knowledge
- Error-prone
- No preview

**Best For**: Technical users or minimal update frequency

---

## Comparison Matrix

| Feature | Decap CMS | Sanity | Contentful | Strapi |
|---------|-----------|--------|------------|--------|
| Cost (starter) | Free | Free | Free | ~$10/mo hosting |
| Cost (growth) | Free | $99/mo | $300/mo | ~$20/mo hosting |
| Ease of setup | Medium | Easy | Easy | Hard |
| Git integration | Native | No | No | No |
| Image CDN | No (needs CDN) | Yes | Yes | No (needs CDN) |
| Multi-language | Plugin | Native | Native | Plugin |
| Offline editing | Yes | No | No | No |
| Vendor lock-in | None | Medium | High | None |

---

## Recommendation

### For Branchstone Art (Artist Portfolio)

**Primary Recommendation: Decap CMS**

Reasons:
1. **Zero cost** aligns with budget constraints
2. **Git-based** means content is versioned and backed up
3. **Works with GitHub Pages** (current hosting)
4. **Simple enough** for ~50-100 artworks
5. **No vendor lock-in** - can migrate anytime

### If Budget Allows ($99/month)

**Consider: Sanity.io**

Reasons:
1. **Image CDN included** - solves image optimization
2. **Better UX** for non-technical users
3. **Real-time preview** is excellent
4. **Scales well** if portfolio grows

---

## Implementation Plan (Decap CMS)

### Phase 1: Basic Setup
1. Add Decap CMS config file (`admin/config.yml`)
2. Create admin page (`admin/index.html`)
3. Configure GitHub OAuth backend
4. Define collection for artworks

### Phase 2: Content Migration
1. Convert artworks.json to individual markdown files
2. Set up media folder structure
3. Migrate translations

### Phase 3: Workflow Setup
1. Configure editorial workflow (draft/review/publish)
2. Set up preview deploys
3. Train artist on usage

### Estimated Effort: 2-3 days

---

## Open Questions for User

1. How often do you expect to update content?
2. Is real-time collaboration with others needed?
3. What is the monthly budget for tools/services?
4. Do you prefer web UI or would markdown files work?
5. Is built-in image optimization worth $99/month?

---

## References

- [Decap CMS](https://decapcms.org/)
- [Sanity.io](https://www.sanity.io/)
- [Contentful](https://www.contentful.com/)
- [CMS Comparison](https://jamstack.org/headless-cms/)
