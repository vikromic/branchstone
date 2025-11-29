#!/usr/bin/env node

/**
 * Update artworks.json with srcset data for all images that have responsive variants
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  widths: [400, 800],
};

CONFIG.artworksJsonPath = path.join(CONFIG.projectRoot, 'docs', 'js', 'artworks.json');

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get base name without extension
 */
function getBaseName(filename) {
  return filename.replace(/\.(jpeg|jpg|png)$/i, '');
}

/**
 * Generate srcset data for an image path
 */
async function addSrcsetToImage(imagePath) {
  const fullPath = path.join(CONFIG.projectRoot, 'docs', imagePath);
  const dir = path.dirname(fullPath);
  const filename = path.basename(fullPath);
  const baseName = getBaseName(filename);
  const relativeDir = path.dirname(imagePath);

  // Build srcset strings
  const webpSrcset = [];
  const jpegSrcset = [];
  let hasVariants = false;

  for (const width of CONFIG.widths) {
    const webpFile = `${baseName}-${width}w.webp`;
    const jpegFile = `${baseName}-${width}w.jpeg`;

    const webpPath = path.join(dir, webpFile);
    const jpegPath = path.join(dir, jpegFile);

    if (await fileExists(webpPath)) {
      webpSrcset.push(`${relativeDir}/${webpFile} ${width}w`);
      hasVariants = true;
    }

    if (await fileExists(jpegPath)) {
      jpegSrcset.push(`${relativeDir}/${jpegFile} ${width}w`);
      hasVariants = true;
    }
  }

  if (!hasVariants) {
    return null;
  }

  return {
    thumb: webpSrcset.length > 0 ? `${relativeDir}/${baseName}-400w.webp` : null,
    srcset: {
      webp: webpSrcset.join(', '),
      jpeg: jpegSrcset.join(', ')
    }
  };
}

/**
 * Update artworks.json with srcset data
 */
async function updateArtworksJson() {
  console.log('📝 Updating artworks.json with srcset data...\n');

  try {
    const jsonContent = await fs.readFile(CONFIG.artworksJsonPath, 'utf-8');
    const artworks = JSON.parse(jsonContent);

    let updatedCount = 0;
    let imagesWithVariants = 0;

    for (const artwork of artworks) {
      let artworkUpdated = false;

      // Process main image
      if (artwork.image) {
        const updated = await addSrcsetToImage(artwork.image);
        if (updated) {
          if (updated.thumb) artwork.thumb = updated.thumb;
          artwork.srcset = updated.srcset;
          artworkUpdated = true;
          imagesWithVariants++;
          console.log(`✅ ${artwork.title}: Updated main image srcset`);
        }
      }

      // Process images array if exists
      if (artwork.images && Array.isArray(artwork.images)) {
        for (let i = 0; i < artwork.images.length; i++) {
          const updated = await addSrcsetToImage(artwork.images[i]);
          if (updated) {
            if (!artwork.imagesSrcset) {
              artwork.imagesSrcset = [];
            }
            artwork.imagesSrcset[i] = updated.srcset;
            artworkUpdated = true;
            imagesWithVariants++;
          }
        }
        if (artworkUpdated && artwork.imagesSrcset) {
          console.log(`   └─ Updated ${artwork.imagesSrcset.filter(x => x).length} gallery images`);
        }
      }

      if (artworkUpdated) {
        updatedCount++;
      }
    }

    // Write updated JSON with proper formatting
    await fs.writeFile(
      CONFIG.artworksJsonPath,
      JSON.stringify(artworks, null, 4) + '\n',
      'utf-8'
    );

    console.log(`\n✅ Successfully updated ${updatedCount} artworks with srcset data`);
    console.log(`📊 Total images with responsive variants: ${imagesWithVariants}`);
  } catch (error) {
    console.error('❌ Error updating artworks.json:', error.message);
    process.exit(1);
  }
}

// Run the update
updateArtworksJson().catch(console.error);
