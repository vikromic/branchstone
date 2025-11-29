# ADR-003: Image Delivery Strategy

**Status**: Proposed
**Date**: 2025-11-28
**Decision Makers**: Engineering Lead

---

## Context

Image delivery is the **critical performance bottleneck** for Branchstone Art:

### Current State
- 21MB total image assets (100 JPEG files)
- Largest image: 2.6MB (about-me.jpeg)
- No modern formats (WebP, AVIF)
- No responsive sizes (srcset prepared but not implemented)
- No CDN (served directly from GitHub Pages)
- LCP impact: 3-5 seconds (critical issue)

### Requirements
- Reduce LCP to under 2.5s (Phase 1), under 1.5s (Phase 3)
- Support responsive images across device sizes
- Maintain high visual quality for artwork presentation
- Minimize ongoing costs
- Enable artist to upload new images easily

---

## Decision

**Recommended: Hybrid Approach (Build-Time + CDN)**

1. **Build-Time Optimization**: Generate optimized variants during CI/CD
2. **Image CDN**: Use Cloudinary for on-demand transformations and global delivery

This hybrid approach provides:
- Optimal performance (pre-optimized + CDN edge delivery)
- Low cost (optimize once, cache forever)
- Flexibility (CDN handles edge cases)
- Easy artist workflow (upload originals, optimization is automatic)

---

## Options Evaluated

### Option A: Build-Time Only (Sharp.js)
**Description**: Generate all image variants during build

**Implementation**:
```bash
# Generate during CI/CD:
- originals/art.jpg -> art-400w.webp, art-800w.webp, art-1200w.webp
                    -> art-400w.avif, art-800w.avif, art-1200w.avif
                    -> art-400w.jpg, art-800w.jpg, art-1200w.jpg
```

**Pros**:
- Zero runtime cost
- No external dependencies
- Full control over quality
- Works with GitHub Pages

**Cons**:
- Build time increases (~2-5 min for 100 images)
- Repository size grows (~3x images)
- New formats require rebuild
- No global CDN (GitHub Pages CDN is limited)

**Cost**: Free (CI/CD minutes only)

---

### Option B: Image CDN (Cloudinary)
**Description**: Store originals, CDN generates variants on-demand

**Implementation**:
```html
<img src="https://res.cloudinary.com/branchstone/image/upload/w_800,f_auto,q_auto/art.jpg">
```

**Pros**:
- On-demand format conversion (WebP, AVIF auto-detected)
- Automatic responsive sizing
- Global CDN edge delivery
- No build time for images
- Advanced features (face detection, art detection, lazy placeholders)

**Cons**:
- External dependency
- Costs scale with bandwidth
- Vendor lock-in (image URLs tied to CDN)
- Free tier limits (25GB bandwidth/month)

**Cost**:
- Free: 25GB bandwidth, 25K transformations/month
- Plus: $89/month for 225GB bandwidth

---

### Option C: Cloudflare Images
**Description**: Cloudflare's image optimization service

**Pros**:
- Integrated with Cloudflare CDN
- Flat pricing ($5/100K images stored)
- Fast global delivery
- Simple URL-based transformations

**Cons**:
- Requires Cloudflare DNS
- Less flexible than Cloudinary
- No free tier for images

**Cost**: $5/month for 100K images, $1 per 100K deliveries

---

### Option D: Self-Hosted (S3 + CloudFront + Lambda@Edge)
**Description**: AWS-based image pipeline

**Pros**:
- Full control
- Pay-per-use pricing
- No vendor lock-in

**Cons**:
- Complex setup
- Ongoing maintenance
- AWS expertise required

**Cost**: ~$10-30/month depending on traffic

---

### Option E: Imgix
**Description**: Premium image CDN

**Pros**:
- Excellent quality
- Advanced rendering options
- Face/object detection

**Cons**:
- Expensive ($100+ /month minimum)
- Overkill for small portfolio

**Cost**: Starting at $100/month

---

## Comparison Matrix

| Feature | Build-Time | Cloudinary | CF Images | S3+Lambda |
|---------|------------|------------|-----------|-----------|
| Setup Complexity | Low | Low | Medium | High |
| Cost (current traffic) | Free | Free | $5/mo | ~$15/mo |
| Cost (10x traffic) | Free | ~$89/mo | ~$15/mo | ~$50/mo |
| Format Support | WebP, AVIF | WebP, AVIF, auto | WebP, AVIF | WebP, AVIF |
| Global CDN | Limited | Yes | Yes | Yes |
| On-Demand Resize | No | Yes | Yes | Yes |
| Lazy Placeholders | Manual | Built-in | No | Manual |
| Build Impact | High | None | None | None |
| Vendor Lock-in | None | Medium | Low | None |

---

## Recommended Approach: Hybrid

### Phase 1: Build-Time Optimization
Use Sharp.js to generate variants during CI/CD:

```
/img/artworks/born_of_burn/
  - original.jpg (preserved, not served)
  - main-400w.webp
  - main-800w.webp
  - main-1200w.webp
  - main-400w.jpg (fallback)
  - main-800w.jpg
  - main-1200w.jpg
```

**Benefits**:
- Immediate performance improvement
- Zero cost
- Works with GitHub Pages
- Existing scripts/optimize-images.js can be enhanced

### Phase 2: Add CDN for Edge Delivery (If Needed)
If traffic grows or GitHub Pages becomes limiting:

1. **Option A**: Cloudinary free tier (25GB/month)
   - Good for ~10K monthly visitors

2. **Option B**: Cloudflare R2 + Images ($5/month)
   - Good for cost-conscious growth

### Implementation Details

**Build Script Enhancement (scripts/optimize-images.js)**:
```javascript
// For each image:
// 1. Generate WebP at 400w, 800w, 1200w, 1920w
// 2. Generate AVIF at same sizes
// 3. Generate JPEG fallback at same sizes
// 4. Generate 20px blur placeholder (base64)
// 5. Update artworks.json with srcset paths
```

**Gallery.js Integration**:
```html
<picture>
  <source type="image/avif" srcset="art-400w.avif 400w, art-800w.avif 800w...">
  <source type="image/webp" srcset="art-400w.webp 400w, art-800w.webp 800w...">
  <img src="art-800w.jpg" srcset="art-400w.jpg 400w, art-800w.jpg 800w..."
       sizes="(max-width: 768px) 100vw, 50vw"
       loading="lazy"
       decoding="async">
</picture>
```

---

## Quality Guidelines

### For Artwork Images (Gallery)
- **WebP**: Quality 80 (good balance)
- **AVIF**: Quality 65 (better compression)
- **JPEG**: Quality 85 (fallback)
- **Sharpening**: Light unsharp mask for crisp edges
- **Color Profile**: sRGB (web standard)

### For Hero Images (LCP Critical)
- **Priority**: Use `loading="eager"` and `fetchpriority="high"`
- **Size**: Serve exact viewport-matched size
- **Format**: WebP with AVIF support

### Sizes to Generate
| Size | Use Case |
|------|----------|
| 400w | Mobile thumbnails |
| 800w | Mobile full, tablet thumbnails |
| 1200w | Tablet full, desktop grid |
| 1920w | Desktop lightbox, hero |

---

## Estimated Impact

| Metric | Current | After Optimization |
|--------|---------|-------------------|
| Total Image Size | 21MB | ~7MB (WebP) |
| Hero Image (LCP) | 151KB | ~40KB |
| Gallery Thumbnail | ~300KB avg | ~50KB |
| LCP | 3-5s | 1.5-2.5s |
| Time to Optimize | N/A | ~3 min (CI) |

---

## References

- [web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Sharp.js](https://sharp.pixelplumbing.com/)
- [AVIF Support](https://caniuse.com/avif)
