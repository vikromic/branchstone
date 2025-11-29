#!/usr/bin/env node
/**
 * Convert ALL JPEG images to WebP (same size)
 * This provides 25-35% size reduction for images too small for resizing
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMG_DIR = path.join(__dirname, '../docs/img');
const QUALITY = 80;

async function findJpegImages(dir) {
  const images = [];

  async function scan(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && /\.(jpg|jpeg)$/i.test(entry.name)) {
        // Skip already processed variants
        if (/-\d+w\./.test(entry.name)) continue;

        // Check if WebP already exists
        const webpPath = fullPath.replace(/\.(jpg|jpeg)$/i, '.webp');
        try {
          await stat(webpPath);
          // WebP exists, skip
        } catch {
          images.push(fullPath);
        }
      }
    }
  }

  await scan(dir);
  return images;
}

async function convertToWebP(jpegPath) {
  const webpPath = jpegPath.replace(/\.(jpg|jpeg)$/i, '.webp');
  const relativePath = path.relative(IMG_DIR, jpegPath);

  try {
    const originalStat = await stat(jpegPath);

    await sharp(jpegPath)
      .webp({ quality: QUALITY })
      .toFile(webpPath);

    const webpStat = await stat(webpPath);
    const savings = ((1 - webpStat.size / originalStat.size) * 100).toFixed(1);

    console.log(`✓ ${relativePath}: ${(originalStat.size/1024).toFixed(0)}KB → ${(webpStat.size/1024).toFixed(0)}KB (${savings}% smaller)`);

    return {
      original: originalStat.size,
      webp: webpStat.size,
      savings: originalStat.size - webpStat.size
    };
  } catch (err) {
    console.error(`✗ ${relativePath}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Finding JPEG images without WebP versions...\n');

  const images = await findJpegImages(IMG_DIR);
  console.log(`Found ${images.length} images to convert\n`);

  if (images.length === 0) {
    console.log('All images already have WebP versions!');
    return;
  }

  let totalOriginal = 0;
  let totalWebP = 0;
  let converted = 0;

  // Process in batches of 5
  for (let i = 0; i < images.length; i += 5) {
    const batch = images.slice(i, i + 5);
    const results = await Promise.all(batch.map(convertToWebP));

    for (const result of results) {
      if (result) {
        totalOriginal += result.original;
        totalWebP += result.webp;
        converted++;
      }
    }
  }

  const totalSavings = totalOriginal - totalWebP;
  const savingsPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);

  console.log('\n============================================================');
  console.log(`✅ Converted ${converted} images`);
  console.log(`📦 Original: ${(totalOriginal/1024/1024).toFixed(2)} MB`);
  console.log(`📦 WebP: ${(totalWebP/1024/1024).toFixed(2)} MB`);
  console.log(`💾 Savings: ${(totalSavings/1024/1024).toFixed(2)} MB (${savingsPercent}%)`);
  console.log('============================================================');
}

main().catch(console.error);
