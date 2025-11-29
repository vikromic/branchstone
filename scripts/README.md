# Image Optimization Scripts

This directory contains scripts for optimizing images in the Branchstone gallery project.

## optimize-images.js

Generates responsive image variants and converts images to WebP format for improved performance.

### Features

- **Responsive Variants**: Generates 400w (mobile) and 800w (desktop) versions
- **WebP Conversion**: Creates WebP versions with 30-50% smaller file sizes
- **JPEG Fallback**: Maintains JPEG versions for browser compatibility
- **Smart Skipping**: Only processes images that haven't been optimized yet
- **Batch Processing**: Processes images in parallel batches of 5
- **JSON Update**: Automatically updates artworks.json with srcset data
- **Progress Tracking**: Detailed logging and statistics

### Installation

```bash
cd scripts
npm install
```

### Usage

```bash
# From scripts directory
npm run optimize

# Or directly
node optimize-images.js
```

### Output Structure

For each original image, the script generates:

```
img/artwork_folder/
├── original.jpeg           # Original file (unchanged)
├── original-400w.jpeg      # 400px width JPEG
├── original-800w.jpeg      # 800px width JPEG
├── original-400w.webp      # 400px width WebP
└── original-800w.webp      # 800px width WebP
```

### Configuration

Edit `CONFIG` object in `optimize-images.js`:

```javascript
const CONFIG = {
  widths: [400, 800],        // Responsive breakpoints
  quality: {
    webp: 80,                // WebP quality (0-100)
    jpeg: 85                 // JPEG quality (0-100)
  },
  batchSize: 5,              // Parallel processing batch size
  skipPatterns: [...]        // Files to skip
};
```

### What Gets Skipped

- Images already processed (contain `-400w` or `-800w` in filename)
- Logo files
- Cover images
- Gallery overview images

### artworks.json Structure

The script updates `artworks.json` with:

```json
{
  "id": 1,
  "title": "Artwork Title",
  "image": "img/folder/original.jpeg",
  "thumb": "img/folder/original-400w.webp",
  "srcset": {
    "webp": "img/folder/original-400w.webp 400w, img/folder/original-800w.webp 800w",
    "jpeg": "img/folder/original-400w.jpeg 400w, img/folder/original-800w.jpeg 800w"
  }
}
```

### Frontend Integration Example

```html
<picture>
  <source
    type="image/webp"
    srcset="img/artwork/image-400w.webp 400w,
            img/artwork/image-800w.webp 800w"
    sizes="(max-width: 768px) 400px, 800px"
  />
  <source
    type="image/jpeg"
    srcset="img/artwork/image-400w.jpeg 400w,
            img/artwork/image-800w.jpeg 800w"
    sizes="(max-width: 768px) 400px, 800px"
  />
  <img
    src="img/artwork/image.jpeg"
    alt="Artwork"
    loading="lazy"
  />
</picture>
```

### Performance Impact

Expected improvements:
- **Initial Page Load**: 50-70% reduction in image bytes
- **Gallery Thumbnails**: Load 400w instead of full 2.6MB images
- **Mobile Experience**: Serve appropriately sized images
- **WebP Support**: 30-50% smaller than equivalent JPEG

### Requirements

- Node.js 14+
- Sharp library (installed via npm)

### Technical Details

**Sharp Library**: Fast, production-quality image processing
- No external dependencies (pure Node.js)
- Hardware acceleration support
- Memory efficient streaming

**Quality Settings**:
- WebP 80: Good balance of quality/size
- JPEG 85: High quality fallback

**Aspect Ratio**: Always preserved
**Color Space**: Maintains original color profile
