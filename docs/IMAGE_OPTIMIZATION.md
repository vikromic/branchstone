# Image Optimization Guide

## Current Status

The site has been updated with responsive image patterns using `srcset` and `sizes` attributes. However, **multiple image size variants do not yet exist**. This document explains the current implementation and provides a roadmap for complete optimization.

## What's Implemented

### 1. Responsive Image Attributes

All images now include:
- `sizes` attribute: Tells the browser what size the image will be displayed at different viewports
- `loading` attribute: Controls lazy loading behavior
- TODO comments: Indicate where `srcset` should be added once image variants are generated

### 2. Image Categories & Current Implementation

#### Hero Images (Above the fold)
- **Location**: `/docs/index.html` - Hero section
- **Current**: Single size (~150KB, 1240x1092px)
- **Loading**: `eager` (for LCP optimization)
- **Sizes**: `100vw` (full viewport width)
- **TODO**: Generate 800w, 1200w, 1920w variants

#### About/Static Images (Below the fold)
- **Location**: `/docs/index.html`, `/docs/about.html`
- **Current**: Single size (2.6MB, 1920x1080px)
- **Loading**: `lazy`
- **Sizes**: `(max-width: 768px) 100vw, 50vw` or `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw`
- **TODO**: Generate 600w, 1200w, 1920w variants

#### Gallery Images (Dynamically loaded)
- **Location**: `/docs/js/components/Gallery.js`
- **Current**: Single size (varies, ~100KB-400KB)
- **Loading**: `lazy` for gallery items, smart loading for carousel
- **Sizes**: `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw`
- **TODO**: Generate 400w, 800w, 1200w variants
- **Implementation**: Supports `srcset` in artworks.json, falls back gracefully

#### Lightbox Images (Full screen)
- **Location**: `/docs/js/components/Lightbox.js`
- **Current**: Full size originals (optimal for zoom/quality)
- **Loading**: Dynamic
- **TODO**: Consider 800w, 1200w, 1920w for mobile optimization

## Image Generation Roadmap

### Step 1: Analyze Current Images

```bash
# Check image dimensions
find docs/img -name "*.jpeg" -exec file {} \;

# Check image sizes
find docs/img -name "*.jpeg" -exec ls -lh {} \;
```

### Step 2: Generate Responsive Variants

Use ImageMagick, Sharp (Node.js), or similar tools:

```bash
# Example with ImageMagick
for img in docs/img/*.jpeg; do
  # Generate 400w variant
  convert "$img" -resize 400x "$img-400w.jpeg"

  # Generate 800w variant
  convert "$img" -resize 800x "$img-800w.jpeg"

  # Generate 1200w variant
  convert "$img" -resize 1200x "$img-1200w.jpeg"
done
```

**Recommended sizes per category:**

1. **Gallery thumbnails**: 400w, 800w, 1200w
2. **Hero images**: 800w, 1200w, 1920w
3. **About images**: 600w, 1200w, 1920w
4. **Artwork detail images**: 800w, 1200w, 1920w

### Step 3: Convert to WebP (Optional but Recommended)

WebP provides 25-35% better compression than JPEG:

```bash
# Generate WebP versions
for img in docs/img/*.jpeg; do
  cwebp -q 85 "$img" -o "${img%.jpeg}.webp"
done
```

### Step 4: Update Code with Actual srcset

#### For Static HTML Images

Replace TODO comments with:

```html
<!-- Hero image example -->
<img
  src="img/artist.jpeg"
  srcset="img/artist-800.jpeg 800w,
          img/artist-1200.jpeg 1200w,
          img/artist-1920.jpeg 1920w"
  sizes="100vw"
  alt="Viktoria Branchstone"
  loading="eager">

<!-- With WebP support -->
<picture>
  <source
    srcset="img/artist-800.webp 800w,
            img/artist-1200.webp 1200w,
            img/artist-1920.webp 1920w"
    sizes="100vw"
    type="image/webp">
  <img
    src="img/artist.jpeg"
    srcset="img/artist-800.jpeg 800w,
            img/artist-1200.jpeg 1200w,
            img/artist-1920.jpeg 1920w"
    sizes="100vw"
    alt="Viktoria Branchstone"
    loading="eager">
</picture>
```

#### For Gallery Images (artworks.json)

Update `/docs/js/artworks.json`:

```json
{
  "id": 1,
  "title": "Born of Burn",
  "image": "img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c.jpeg",
  "srcset": "img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-400.jpeg 400w, img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-800.jpeg 800w, img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c.jpeg 1200w",
  "sizes": "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
}
```

The Gallery.js component already supports this format and will automatically use srcset when available.

## Current Image Inventory

### Root Level Images
- `about-me.jpeg` - 2.6MB (1920x1080) - **NEEDS OPTIMIZATION**
- `artist.jpeg` - 151KB (1240x1092)
- `artist_statement.jpeg` - 110KB
- `cover.jpeg` - 22KB
- `galleries.jpeg` - 604KB
- `galleries_2.jpeg` - 397KB
- `logo.jpeg` - 148KB
- `logo_white.jpeg` - 13KB
- `logo_green.jpeg` - 150KB

### Gallery Subdirectories
Multiple subdirectories with artwork images:
- `born_of_burn/` - 7 images
- `by_marks_and_fire/` - 6 images
- `christmass_joy/` - 3 images
- `core/` - 4 images
- `july_pines/` - 3 images
- `moonglow/` - 11 images
- `navy_of_the_dreamland/` - 5 images
- `of_ash_and_flowers/` - 4 images
- `prolisok/` - 6 images
- `rise_in_blue/` - 10 images
- `spectral/` - 4 images
- `whales/` - 8 images
- `winds/` - 5 images

**Total**: ~90 artwork images that need responsive variants

## Performance Benefits (When Implemented)

### Before Optimization
- Mobile (3G): Downloads full 2.6MB image on 375px screen
- Desktop: Downloads same 1200px image whether viewing thumbnail or full size
- **Estimated page weight**: 5-8MB

### After Optimization
- Mobile (3G): Downloads 400w variant (~80KB) for thumbnails
- Tablet: Downloads 800w variant (~200KB)
- Desktop: Downloads 1200w variant (~400KB)
- **Estimated page weight reduction**: 60-70% (2-3MB)

### Additional Benefits
- Faster LCP (Largest Contentful Paint)
- Lower data usage for mobile users
- Better Core Web Vitals scores
- Improved SEO rankings

## Browser Support

- `srcset` and `sizes`: 98%+ browser support
- `loading="lazy"`: 95%+ browser support
- `<picture>` element: 97%+ browser support

All implementations include fallbacks to ensure compatibility.

## Implementation Checklist

- [x] Add `sizes` attribute to all images
- [x] Add `loading` attribute (eager for hero, lazy for below-fold)
- [x] Update Gallery.js to support srcset from JSON
- [x] Add TODO comments for srcset generation
- [ ] Generate 400w variants for gallery images
- [ ] Generate 800w variants for gallery images
- [ ] Generate 1200w variants for gallery images
- [ ] Generate 1920w variants for hero/full images
- [ ] Convert images to WebP format
- [ ] Update HTML files with actual srcset
- [ ] Update artworks.json with srcset data
- [ ] Test on various devices and network speeds
- [ ] Measure performance improvements with Lighthouse

## Tools & Resources

### Image Optimization Tools
- **ImageMagick**: CLI tool for batch processing
- **Sharp**: Node.js library for programmatic image processing
- **Squoosh**: Web-based image optimizer (https://squoosh.app)
- **ImageOptim**: Mac app for lossless compression

### Performance Testing
- **Lighthouse**: Chrome DevTools
- **WebPageTest**: https://www.webpagetest.org
- **GTmetrix**: https://gtmetrix.com

### Useful Scripts

Create a Node.js script for batch optimization:

```javascript
// optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [400, 800, 1200];
const inputDir = './docs/img';

// Process all images recursively
function processImages(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processImages(filePath);
    } else if (file.match(/\.(jpeg|jpg)$/i)) {
      sizes.forEach(size => {
        const outputPath = filePath.replace(/\.(jpeg|jpg)$/i, `-${size}.$1`);
        sharp(filePath)
          .resize(size)
          .jpeg({ quality: 85 })
          .toFile(outputPath)
          .then(() => console.log(`Generated ${outputPath}`))
          .catch(err => console.error(err));
      });
    }
  });
}

processImages(inputDir);
```

## Notes

- The site is currently **ready for responsive images** but requires the actual image variants to be generated
- All code changes have been implemented to support srcset when image variants are available
- The implementation gracefully falls back to single images until variants are created
- Priority should be given to optimizing `about-me.jpeg` (2.6MB) and other large images first
