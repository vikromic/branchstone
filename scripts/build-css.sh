#!/bin/bash
# Build CSS bundle with cache-busting version

cd "$(dirname "$0")/../docs/css"

# Concatenate CSS files
cat 01-tokens.css 02-base.css 03-header.css 04-gallery.css 05-buttons.css 06-footer.css 07-utilities.css 08-hero.css 09-featured.css 10-about.css 11-contact.css 12-sections.css > bundle.css

# Generate version from timestamp
VERSION=$(date +%s)

# Update version in all HTML files
cd ..
for file in *.html; do
  sed -i '' "s/bundle\.css?v=[0-9]*/bundle.css?v=$VERSION/g" "$file"
done

echo "✅ CSS bundle built with version: $VERSION"
