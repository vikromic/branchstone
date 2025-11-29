import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPerfectCircle() {
    console.log('Creating perfect circular logo with zero background...');

    const logoPath = path.join(__dirname, '../docs/img/logo-original.jpeg');
    const size = 96;

    // Create a circular SVG that will be our logo
    // This ensures perfect circular shape with no corners
    const circleSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="circle">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}"/>
        </clipPath>
      </defs>
      <image
        href="data:image/jpeg;base64,${(await sharp(logoPath).resize(size, size, {fit: 'cover'}).jpeg().toBuffer()).toString('base64')}"
        width="${size}"
        height="${size}"
        clip-path="url(#circle)"
      />
    </svg>`;

    // Render the SVG to PNG with transparency
    await sharp(Buffer.from(circleSvg))
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(path.join(__dirname, '../docs/img/logo-perfect.png'));

    console.log('✓ Created logo-perfect.png (perfect circle)');

    // For dark theme, we need to invert
    // Load the perfect circle and invert non-transparent pixels
    const { data, info } = await sharp(path.join(__dirname, '../docs/img/logo-perfect.png'))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Invert colors for all non-transparent pixels
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If pixel is not transparent
            data[i] = 255 - data[i];       // Invert R
            data[i + 1] = 255 - data[i + 1]; // Invert G
            data[i + 2] = 255 - data[i + 2]; // Invert B
        }
    }

    await sharp(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(__dirname, '../docs/img/logo-dark-perfect.png'));

    console.log('✓ Created logo-dark-perfect.png (inverted circle)');
    console.log('\nDone! Perfect circles created.');
}

createPerfectCircle().catch(console.error);
