#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  imgDir: path.resolve(__dirname, '../docs/img'),
  artworksJsonPath: path.resolve(__dirname, '../docs/js/artworks.json'),
  widths: [400, 800],
  quality: {
    webp: 80,
    jpeg: 85
  },
  batchSize: 5,
  skipPatterns: [
    /-\d+w\./, // Already processed (e.g., image-400w.jpeg)
    /logo/, // Skip logos
    /cover\.jpeg$/, // Skip cover
    /galleries.*\.jpeg$/, // Skip gallery overview images
  ]
};

// Statistics tracking
const stats = {
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
  processedCount: 0,
  skippedCount: 0,
  errors: []
};

/**
 * Get all JPEG files recursively
 */
async function getAllJpegFiles(dir) {
  const files = [];

  async function traverse(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile() && /\.jpe?g$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  await traverse(dir);
  return files;
}

/**
 * Check if file should be skipped
 */
function shouldSkip(filePath) {
  return CONFIG.skipPatterns.some(pattern => pattern.test(filePath));
}

/**
 * Get base name without extension and size suffix
 */
function getBaseName(filename) {
  return filename.replace(/\.(jpe?g)$/i, '');
}

/**
 * Check if variants already exist for this image
 */
async function hasVariants(imagePath) {
  const dir = path.dirname(imagePath);
  const baseName = getBaseName(path.basename(imagePath));

  try {
    const files = await fs.readdir(dir);
    const has400w = files.some(f => f === `${baseName}-400w.webp`);
    const has800w = files.some(f => f === `${baseName}-800w.webp`);
    return has400w && has800w;
  } catch (error) {
    return false;
  }
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate responsive variants for a single image
 */
async function generateVariants(imagePath) {
  const dir = path.dirname(imagePath);
  const filename = path.basename(imagePath);
  const baseName = getBaseName(filename);

  const originalSize = await getFileSize(imagePath);
  stats.totalOriginalSize += originalSize;

  let totalOptimizedSize = 0;
  const variants = [];

  console.log(`  Processing: ${path.relative(CONFIG.imgDir, imagePath)}`);
  console.log(`    Original size: ${formatBytes(originalSize)}`);

  // Load image once
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Generate variants for each width
  for (const width of CONFIG.widths) {
    // Skip if original is smaller than target width
    if (metadata.width && metadata.width < width) {
      console.log(`    Skipping ${width}w (original is ${metadata.width}px)`);
      continue;
    }

    const resizedImage = sharp(imagePath).resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });

    // Generate WebP
    const webpPath = path.join(dir, `${baseName}-${width}w.webp`);
    await resizedImage
      .clone()
      .webp({ quality: CONFIG.quality.webp })
      .toFile(webpPath);

    const webpSize = await getFileSize(webpPath);
    totalOptimizedSize += webpSize;
    variants.push({ width, format: 'webp', path: webpPath, size: webpSize });

    // Generate JPEG
    const jpegPath = path.join(dir, `${baseName}-${width}w.jpeg`);
    await resizedImage
      .clone()
      .jpeg({ quality: CONFIG.quality.jpeg })
      .toFile(jpegPath);

    const jpegSize = await getFileSize(jpegPath);
    totalOptimizedSize += jpegSize;
    variants.push({ width, format: 'jpeg', path: jpegPath, size: jpegSize });
  }

  stats.totalOptimizedSize += totalOptimizedSize;
  stats.processedCount++;

  const savings = originalSize - totalOptimizedSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

  console.log(`    Generated ${variants.length} variants: ${formatBytes(totalOptimizedSize)}`);
  console.log(`    Savings: ${formatBytes(savings)} (${savingsPercent}%)`);

  return variants;
}

/**
 * Process images in batches
 */
async function processImages(images) {
  const toProcess = [];

  // Filter images that need processing
  for (const imagePath of images) {
    if (shouldSkip(imagePath)) {
      stats.skippedCount++;
      continue;
    }

    if (await hasVariants(imagePath)) {
      console.log(`⏭️  Skipping (already processed): ${path.relative(CONFIG.imgDir, imagePath)}`);
      stats.skippedCount++;
      continue;
    }

    toProcess.push(imagePath);
  }

  console.log(`\n📊 Found ${toProcess.length} images to process (${stats.skippedCount} skipped)\n`);

  // Process in batches
  for (let i = 0; i < toProcess.length; i += CONFIG.batchSize) {
    const batch = toProcess.slice(i, i + CONFIG.batchSize);
    const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
    const totalBatches = Math.ceil(toProcess.length / CONFIG.batchSize);

    console.log(`\n🔄 Batch ${batchNum}/${totalBatches}:`);

    await Promise.all(
      batch.map(async (imagePath) => {
        try {
          await generateVariants(imagePath);
        } catch (error) {
          console.error(`  ❌ Error processing ${imagePath}:`, error.message);
          stats.errors.push({ path: imagePath, error: error.message });
        }
      })
    );
  }
}

/**
 * Update artworks.json with srcset data
 */
async function updateArtworksJson() {
  console.log('\n📝 Updating artworks.json...');

  try {
    const jsonContent = await fs.readFile(CONFIG.artworksJsonPath, 'utf-8');
    const artworks = JSON.parse(jsonContent);

    let updatedCount = 0;

    for (const artwork of artworks) {
      // Process main image
      if (artwork.image) {
        const updated = await addSrcsetToImage(artwork.image);
        if (updated) {
          artwork.thumb = updated.thumb;
          artwork.srcset = updated.srcset;
          updatedCount++;
        }
      }

      // Process images array if exists
      if (artwork.images && Array.isArray(artwork.images)) {
        for (let i = 0; i < artwork.images.length; i++) {
          const updated = await addSrcsetToImage(artwork.images[i]);
          if (updated) {
            // Store srcset in parallel array or extend structure
            if (!artwork.imagesSrcset) {
              artwork.imagesSrcset = [];
            }
            artwork.imagesSrcset[i] = updated.srcset;
          }
        }
      }
    }

    // Write updated JSON with proper formatting
    await fs.writeFile(
      CONFIG.artworksJsonPath,
      JSON.stringify(artworks, null, 4) + '\n',
      'utf-8'
    );

    console.log(`  ✅ Updated ${updatedCount} artworks with srcset data`);
  } catch (error) {
    console.error('  ❌ Error updating artworks.json:', error.message);
    stats.errors.push({ path: CONFIG.artworksJsonPath, error: error.message });
  }
}

/**
 * Generate srcset data for an image path
 */
async function addSrcsetToImage(imagePath) {
  const fullPath = path.join(CONFIG.projectRoot, 'docs', imagePath);
  const dir = path.dirname(fullPath);
  const filename = path.basename(fullPath);
  const baseName = getBaseName(filename);

  // Check if variants exist
  if (!await hasVariants(fullPath)) {
    return null;
  }

  const relativeDir = path.dirname(imagePath);

  // Build srcset strings
  const webpSrcset = [];
  const jpegSrcset = [];

  for (const width of CONFIG.widths) {
    const webpFile = `${baseName}-${width}w.webp`;
    const jpegFile = `${baseName}-${width}w.jpeg`;

    const webpPath = path.join(dir, webpFile);
    const jpegPath = path.join(dir, jpegFile);

    if (await fileExists(webpPath)) {
      webpSrcset.push(`${relativeDir}/${webpFile} ${width}w`);
    }

    if (await fileExists(jpegPath)) {
      jpegSrcset.push(`${relativeDir}/${jpegFile} ${width}w`);
    }
  }

  return {
    thumb: `${relativeDir}/${baseName}-400w.webp`,
    srcset: {
      webp: webpSrcset.join(', '),
      jpeg: jpegSrcset.join(', ')
    }
  };
}

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
 * Print final statistics
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Processed: ${stats.processedCount} images`);
  console.log(`⏭️  Skipped: ${stats.skippedCount} images`);
  console.log(`📦 Original size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`📦 Optimized size: ${formatBytes(stats.totalOptimizedSize)}`);

  const totalSavings = stats.totalOriginalSize - stats.totalOptimizedSize;
  const savingsPercent = stats.totalOriginalSize > 0
    ? ((totalSavings / stats.totalOriginalSize) * 100).toFixed(1)
    : 0;

  console.log(`💾 Total savings: ${formatBytes(totalSavings)} (${savingsPercent}%)`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors: ${stats.errors.length}`);
    stats.errors.forEach(err => {
      console.log(`  - ${err.path}: ${err.error}`);
    });
  }
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Branchstone Image Optimizer');
  console.log('='.repeat(60));
  console.log(`📁 Image directory: ${CONFIG.imgDir}`);
  console.log(`📄 Artworks JSON: ${CONFIG.artworksJsonPath}`);
  console.log(`🎯 Target widths: ${CONFIG.widths.join(', ')}px`);
  console.log(`🎨 Quality: WebP ${CONFIG.quality.webp}, JPEG ${CONFIG.quality.jpeg}`);
  console.log('='.repeat(60));

  try {
    // Get all JPEG files
    console.log('\n🔍 Scanning for images...');
    const images = await getAllJpegFiles(CONFIG.imgDir);
    console.log(`   Found ${images.length} JPEG images`);

    // Process images
    await processImages(images);

    // Update artworks.json
    await updateArtworksJson();

    // Print statistics
    printStats();

    console.log('\n✅ Optimization complete!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateVariants, updateArtworksJson };
