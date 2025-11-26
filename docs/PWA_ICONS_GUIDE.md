# PWA Icons Setup Guide

## 🔍 What Are PWA Icons?

PWA (Progressive Web App) icons are displayed when users:
- Add your site to their phone's home screen
- Install it as a desktop app
- See it in their app drawer/launcher

## ✅ Current Status

**Temporarily disabled** to prevent 404 errors. The manifest is set to `"display": "browser"` which means:
- Site works normally in browsers ✅
- No install/add-to-home-screen functionality ❌
- No console errors ✅

## 📋 Required Icons

To enable full PWA features, you need:
- `img/icon-192.png` - 192×192 pixels
- `img/icon-512.png` - 512×512 pixels

Both should be:
- **PNG format** (supports transparency)
- **Square** (1:1 aspect ratio)
- **Clean/simple design** (visible at small sizes)
- **Representative** of your brand/logo

## 🎨 Option 1: Create From Existing Logo (Recommended)

You have three logo files available:
- `img/logo.jpeg` (151 KB)
- `img/logo_green.jpeg` (153 KB)
- `img/logo_white.jpeg` (13.5 KB)

### Using Online Tools (Easiest):

1. **Visit:** https://realfavicongenerator.net/
2. **Upload** one of your logo files
3. **Select "Web App Manifest" tab**
4. **Generate** icons
5. **Download** and extract
6. **Copy** `icon-192.png` and `icon-512.png` to `/img/` folder

### Using Photoshop/Figma/Canva:

1. Open your logo file
2. Create new artboard: 512×512 px
3. Center your logo with padding (don't fill edge-to-edge)
4. Export as PNG:
   - `icon-512.png` at 512×512
   - `icon-192.png` at 192×192
5. Save to `img/` folder

### Using ImageMagick (Command Line):

```bash
cd img/

# Create 512px icon with white background
convert logo.jpeg -resize 512x512 -gravity center -background white -extent 512x512 icon-512.png

# Create 192px icon
convert logo.jpeg -resize 192x192 -gravity center -background white -extent 192x192 icon-192.png
```

## 🔄 Re-Enable PWA After Creating Icons

Once you have the icon files, update `site.webmanifest`:

```json
{
  "name": "Viktoria Branchstone - Art",
  "short_name": "Branchstone",
  "description": "Mixed media artist inspired by natural textures and quiet resilience",
  "icons": [
    {
      "src": "img/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "img/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#8B785D",
  "background_color": "#F8F8F8",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

## ✨ Optional: Additional Icon Sizes

For maximum compatibility, you can also add:

```json
"icons": [
  {
    "src": "img/icon-72.png",
    "sizes": "72x72",
    "type": "image/png"
  },
  {
    "src": "img/icon-96.png",
    "sizes": "96x96",
    "type": "image/png"
  },
  {
    "src": "img/icon-128.png",
    "sizes": "128x128",
    "type": "image/png"
  },
  {
    "src": "img/icon-144.png",
    "sizes": "144x144",
    "type": "image/png"
  },
  {
    "src": "img/icon-152.png",
    "sizes": "152x152",
    "type": "image/png"
  },
  {
    "src": "img/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "img/icon-384.png",
    "sizes": "384x384",
    "type": "image/png"
  },
  {
    "src": "img/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

## 🎯 Design Tips

**Good PWA Icon:**
- Simple, recognizable mark or initials
- Works on both light and dark backgrounds
- Visible at tiny sizes (72px)
- Padding around edges (safe zone)

**Avoid:**
- Thin lines (hard to see)
- Complex details (get lost when small)
- Text-heavy logos (unreadable)
- Edge-to-edge designs (get cropped)

## 🧪 Testing

After adding icons:

1. **Clear browser cache** (hard refresh)
2. **Open DevTools** → Application → Manifest
3. **Verify icons** show up correctly
4. **Test install** (Chrome: three dots → Install app)
5. **Check home screen** icon appearance

## 📱 Platform-Specific Notes

### iOS Safari:
Also add to `<head>` in HTML:
```html
<link rel="apple-touch-icon" sizes="180x180" href="img/icon-192.png">
```

### Android Chrome:
The manifest icons are sufficient.

### Windows:
Can use the 512px icon for tiles.

## ❓ FAQ

**Q: Can I use JPEG instead of PNG?**
A: Not recommended. PNG supports transparency which looks better on various backgrounds.

**Q: What if my logo is rectangular?**
A: Add padding to make it square, or create a simplified square version of your logo.

**Q: Do I need all those sizes?**
A: No, just 192 and 512 are the minimum. More sizes = better quality at each display size.

**Q: What's "purpose": "maskable"?**
A: Allows adaptive icons on Android - the OS can apply different shapes.

## 🚀 Current Setup

```
✅ Manifest file exists
✅ Manifest linked in HTML
❌ Icons not created yet (currently disabled)
⏳ Waiting for icon files
```

Once you create the icons, just drop them in the `img/` folder and update the manifest!
