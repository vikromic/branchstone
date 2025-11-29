import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createThemeMatchingLogos() {
    console.log('Creating theme-matching logos...');

    const logoPath = path.join(__dirname, '../docs/img/logo.png');

    // Dark theme background color from CSS
    const darkBg = { r: 42, g: 38, b: 34 }; // #2A2622
    const lightBg = { r: 248, g: 248, b: 248 }; // #F8F8F8

    // For dark theme: replace black with dark background color
    const { data: lightData, info } = await sharp(logoPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    console.log(`Processing ${info.width}x${info.height} logo for dark theme...`);

    // Create dark theme version
    const darkData = Buffer.from(lightData);

    for (let i = 0; i < darkData.length; i += 4) {
        const a = darkData[i + 3]; // Alpha channel

        if (a > 0) { // Only process non-transparent pixels
            const r = darkData[i];
            const g = darkData[i + 1];
            const b = darkData[i + 2];

            // Invert the colors
            let newR = 255 - r;
            let newG = 255 - g;
            let newB = 255 - b;

            // If the inverted color is very dark (near black), replace with dark theme bg color
            // This makes dark areas blend with the background
            if (newR < 50 && newG < 50 && newB < 50) {
                newR = darkBg.r;
                newG = darkBg.g;
                newB = darkBg.b;
            }

            darkData[i] = newR;
            darkData[i + 1] = newG;
            darkData[i + 2] = newB;
        }
    }

    await sharp(darkData, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, '../docs/img/logo-dark-themed.png'));

    console.log('✓ Created logo-dark-themed.png (dark areas match #2A2622)');

    // Also create a light theme version where light areas match light background
    const lightDataCopy = Buffer.from(lightData);

    for (let i = 0; i < lightDataCopy.length; i += 4) {
        const a = lightDataCopy[i + 3];

        if (a > 0) {
            const r = lightDataCopy[i];
            const g = lightDataCopy[i + 1];
            const b = lightDataCopy[i + 2];

            // If pixel is very light (near white), replace with light theme bg
            if (r > 200 && g > 200 && b > 200) {
                lightDataCopy[i] = lightBg.r;
                lightDataCopy[i + 1] = lightBg.g;
                lightDataCopy[i + 2] = lightBg.b;
            }
        }
    }

    await sharp(lightDataCopy, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, '../docs/img/logo-light-themed.png'));

    console.log('✓ Created logo-light-themed.png (light areas match #F8F8F8)');
    console.log('\nDone! Theme-matching logos created.');
}

createThemeMatchingLogos().catch(console.error);
