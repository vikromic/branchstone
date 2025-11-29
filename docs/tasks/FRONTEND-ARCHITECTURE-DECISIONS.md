# Architecture Decision Records (ADRs) - Branchstone Art Portfolio

**Last Updated:** 2025-11-28

---

## ADR-001: Framework vs. Vanilla JavaScript

**Date:** 2025-11-28
**Status:** Accepted
**Deciders:** Engineering Team
**Supersedes:** None

### Context

The Branchstone Art portfolio needs a frontend architecture that balances:
- **Performance** - Fast loading for image-heavy content
- **Maintainability** - Easy to update artwork and content
- **Developer Experience** - Productive development workflow
- **Bundle Size** - Minimal JavaScript overhead

Options considered:
1. **Vanilla JavaScript ES6 modules** (current approach)
2. **React** - Industry standard, large ecosystem
3. **Vue** - Progressive framework, smaller than React
4. **Svelte** - Compile-time framework, no runtime
5. **Astro** - Static Site Generator with component islands

### Decision

**Continue with Vanilla JavaScript ES6 modules** with targeted enhancements (TypeScript, build tooling, testing).

### Rationale

**Advantages of Current Approach:**
1. **Zero framework overhead** - No runtime library (React: 40KB, Vue: 33KB)
2. **Already well-architected** - Clean components, services, utils separation
3. **Performance** - 8.5KB initial JS bundle vs 40KB+ with frameworks
4. **Learning curve** - Standard Web APIs, no framework-specific patterns
5. **Flexibility** - No framework lock-in or migration costs

**Trade-offs Accepted:**
1. **Manual state management** - No built-in reactivity (mitigated by custom store in ADR-003)
2. **DOM manipulation** - More verbose than JSX (mitigated by helper functions in utils/dom.js)
3. **Component reuse** - No template language (mitigated by class-based components)
4. **Tooling** - Less out-of-the-box tooling (mitigated by Vite in ADR-002)

**When to Reconsider:**
- Application grows to >10,000 lines of code
- Need for complex state synchronization across many components
- Hiring developers who strongly prefer framework experience
- Community components/libraries become critical dependency

### Consequences

**Positive:**
- Maintain ultra-fast load times (current LCP: 2.5s)
- Keep bundle size minimal (4.5KB JS, 8KB CSS)
- Avoid framework churn (React 18 → 19, breaking changes)
- Educational value for developers learning Web APIs

**Negative:**
- Manual implementation of patterns (state management, routing)
- Steeper learning curve for new contributors
- Limited ecosystem of third-party components

**Mitigation Strategies:**
1. Add TypeScript for type safety (ADR-002)
2. Implement lightweight state management (ADR-003)
3. Comprehensive documentation and Storybook
4. Testing framework to prevent regressions

---

## ADR-002: Build Tooling Adoption (Vite + TypeScript)

**Date:** 2025-11-28
**Status:** Proposed
**Deciders:** Engineering Team
**Supersedes:** None

### Context

Current state:
- No build pipeline (raw ES6 modules served)
- No type checking (vanilla JavaScript)
- No minification or bundling
- No dev server with HMR

**Problems:**
1. No type safety leads to runtime errors
2. No bundling means larger network transfers (separate file per module)
3. No minification increases bundle size
4. No dev server requires manual browser refresh

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| **Vite + TypeScript** | Fast HMR, built-in TypeScript, Rollup bundling | Learning curve, build step |
| **Webpack + Babel** | Mature, extensive plugins | Slow, complex config |
| **esbuild** | Fastest build, simple | Less mature ecosystem |
| **No build tools** | Simplicity, zero config | Missing type safety, no optimization |

### Decision

**Adopt Vite + TypeScript** for development and production builds.

### Rationale

**Vite Benefits:**
1. **Lightning-fast HMR** - 50-100ms updates vs 3-5s with Webpack
2. **Zero config** - Works out-of-box for ES modules
3. **TypeScript support** - Built-in, no plugins needed
4. **Optimized builds** - Rollup-based code splitting
5. **Modern defaults** - ES2020, native ESM

**TypeScript Benefits:**
1. **Catch 80% of bugs at compile time** - Type errors, null checks, typos
2. **Better IDE support** - IntelliSense, autocomplete, refactoring
3. **Self-documenting code** - Types replace many JSDoc comments
4. **Gradual adoption** - Can use `allowJs: true` for incremental migration

**Expected Metrics:**
- **Development:** Hot reload in <100ms (currently manual refresh)
- **Build time:** <5 seconds (currently N/A)
- **Bundle size:** 65KB → 45KB (30% reduction with tree-shaking)
- **Type errors caught:** 15-20 bugs prevented per month

### Implementation Plan

**Phase 1: Vite Setup (Week 1)**
```bash
npm install --save-dev vite @vitejs/plugin-basic-ssl
```

```javascript
// vite.config.js
export default {
  root: 'docs',
  build: {
    outDir: '../dist',
    minify: 'terser',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
};
```

**Phase 2: TypeScript Migration (Weeks 2-3)**
```bash
npm install --save-dev typescript @types/node
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "strict": true,
    "allowJs": true,
    "checkJs": true
  }
}
```

Incremental migration:
- Week 2: Utilities (dom.ts, storage.ts)
- Week 3: Services (api.ts, errorTracking.ts)
- Week 4: Components (Gallery.ts, Lightbox.ts, etc.)

### Consequences

**Positive:**
- Type safety prevents 80% of runtime errors
- Faster development with HMR
- Smaller production bundles (30% reduction)
- Better developer experience

**Negative:**
- Build step adds complexity (CI/CD must run `npm run build`)
- TypeScript learning curve for contributors
- Migration effort (3-4 weeks)

**Rollback Plan:**
If Vite/TypeScript causes issues:
1. Keep source files in `/docs/js/` as vanilla JS
2. Build to `/dist/` as separate deployment
3. Can revert to vanilla JS deployment if needed

---

## ADR-003: State Management Strategy

**Date:** 2025-11-28
**Status:** Proposed
**Deciders:** Engineering Team
**Supersedes:** None

### Context

Current state is scattered across components:
- **Theme:** `ThemeManager.currentTheme` (Theme.js)
- **Language:** `I18n.currentLang` (i18n.js)
- **Gallery Filters:** `GalleryFilter.activeCategory` (GalleryFilter.js)
- **Lightbox State:** `Lightbox.state` (Lightbox.js)

**Problems:**
1. No single source of truth
2. Components can't react to external state changes
3. Debugging is difficult (state scattered everywhere)
4. Testing requires mocking multiple components

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| **Redux** | Mature, DevTools, time-travel debugging | Large bundle (15KB), boilerplate |
| **MobX** | Simple, reactive | OOP-heavy, decorators needed |
| **Zustand** | Tiny (1KB), simple API | Less mature ecosystem |
| **Custom Store** | Zero dependencies, tailored to needs | Must implement ourselves |
| **No state mgmt** | Simplicity | Current problems persist |

### Decision

**Implement custom lightweight store** inspired by Zustand pattern.

### Rationale

**Why Custom Store:**
1. **Tiny footprint** - ~50 lines of code vs 15KB Redux
2. **Tailored to needs** - Only features we use
3. **Educational value** - Team understands implementation
4. **Framework-agnostic** - Works with vanilla JS or future frameworks
5. **Easy testing** - Simple subscribe/setState API

**Store API Design:**
```typescript
// Zustand-inspired API
const store = new Store<AppState>({
  theme: 'light',
  language: 'en',
  artworks: [],
  filters: { category: 'all' },
});

// Get current state
const theme = store.getState().theme;

// Update state (reactive)
store.setState({ theme: 'dark' });

// Subscribe to changes
const unsubscribe = store.subscribe((state, prevState) => {
  if (state.theme !== prevState.theme) {
    applyTheme(state.theme);
  }
});

// Memoized selectors
const unsubscribe = store.select(
  state => state.filters.category, // selector
  (category, prevCategory) => {
    filterGallery(category);
  }
);
```

**Store Implementation:**
```typescript
type Listener<T> = (state: T, prevState: T) => void;
type Selector<T, U> = (state: T) => U;

class Store<T extends object> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(partial: Partial<T> | ((state: T) => Partial<T>)): void {
    const prevState = this.state;
    const updates = typeof partial === 'function' ? partial(this.state) : partial;
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state, prevState));
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  select<U>(selector: Selector<T, U>, listener: (value: U, prevValue: U) => void): () => void {
    let currentValue = selector(this.state);
    return this.subscribe((state) => {
      const nextValue = selector(state);
      if (nextValue !== currentValue) {
        const prevValue = currentValue;
        currentValue = nextValue;
        listener(nextValue, prevValue);
      }
    });
  }
}
```

**Comparison with Alternatives:**

| Feature | Custom Store | Redux | Zustand |
|---------|--------------|-------|---------|
| **Bundle Size** | <1KB | 15KB | 1KB |
| **API Simplicity** | ★★★★★ | ★★☆☆☆ | ★★★★★ |
| **DevTools** | Custom | ✅ Excellent | ✅ Good |
| **Middleware** | DIY | ✅ Rich | ✅ Good |
| **TypeScript** | ✅ | ✅ | ✅ |
| **Learning Curve** | Low | High | Low |

### Implementation Plan

**Week 1: Core Store**
- Implement `Store` class with subscribe/setState
- Add memoized selectors
- Add DevTools integration

**Week 2: Migration**
- Migrate `theme` state from Theme.js
- Migrate `language` state from i18n.js
- Update components to subscribe to store

**Week 3: Advanced Features**
- Add persistence layer (localStorage sync)
- Add computed values (derived state)
- Add middleware support (logging, analytics)

### Consequences

**Positive:**
- Single source of truth for app state
- Reactive updates (no manual DOM sync)
- Easier debugging (state history, time-travel)
- Better testability (mock store state)
- DevTools for state inspection

**Negative:**
- Additional abstraction layer
- Migration effort (2-3 weeks)
- Team must learn store patterns

**Rollback Plan:**
If store causes issues, can revert to component-level state with minimal changes (store.getState() → component.state).

---

## ADR-004: Image Delivery Architecture

**Date:** 2025-11-28
**Status:** Proposed
**Deciders:** Engineering Team
**Supersedes:** None

### Context

Current image delivery:
- Served from GitHub Pages (static hosting)
- Full-resolution images (1920px+) for all devices
- JPEG format only (some WebP)
- No responsive srcsets
- Manual optimization with Sharp script

**Problems:**
1. **Poor LCP** - 2.5s on mobile (target: <1.5s)
2. **Wasted bandwidth** - Serving 1920px to 375px mobile screens
3. **Manual process** - Developer must run optimization script
4. **Limited formats** - Missing AVIF (60% smaller than JPEG)
5. **No transformations** - Can't crop/resize on-demand

**Options Considered:**

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **GitHub Pages (current)** | Free, simple | No transformations, manual optimization | $0 |
| **Cloudinary** | Auto-optimization, transformations, CDN | Vendor lock-in | $0-25/mo |
| **Imgix** | Best-in-class, real-time transforms | Expensive | $40-100/mo |
| **Cloudflare Images** | Cheap, fast, Cloudflare CDN | Limited features | $5-10/mo |
| **Self-hosted + Nginx** | Full control | DevOps overhead, no auto-optimization | $5-20/mo |

### Decision

**Adopt Cloudinary Free Tier** with fallback to self-generated srcsets.

### Rationale

**Cloudinary Benefits:**
1. **Automatic format selection** - AVIF → WebP → JPEG based on browser support
2. **On-the-fly resizing** - No manual Sharp script, resize via URL
3. **Free tier** - 25GB storage, 25GB bandwidth (enough for portfolio)
4. **CDN delivery** - Fast global distribution
5. **Transformations** - Crop, blur, watermark via URL parameters
6. **LQIP generation** - Low-quality placeholders for blur-up effect

**URL-based Transformations:**
```javascript
// Original image
https://res.cloudinary.com/branchstone/image/upload/v1/artworks/forest-whisper.jpg

// Optimized (auto format, auto quality, 800px width)
https://res.cloudinary.com/branchstone/image/upload/f_auto,q_auto,w_800/artworks/forest-whisper.jpg

// LQIP (20px width, blur, low quality)
https://res.cloudinary.com/branchstone/image/upload/f_auto,q_30,w_20,e_blur:1000/artworks/forest-whisper.jpg
```

**Helper Function:**
```typescript
const CLOUDINARY_CLOUD_NAME = 'branchstone';

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'avif' | 'webp' | 'jpg';
    crop?: 'fill' | 'fit' | 'scale';
  } = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
  } = options;

  const transformations = [
    'f_' + format,
    'q_' + quality,
    width && 'w_' + width,
    height && 'h_' + height,
    'c_' + crop,
    'dpr_auto',
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}
```

**Fallback Strategy:**
If Cloudinary quota exceeded or service down:
1. Serve pre-generated srcsets from GitHub Pages
2. Monitor Cloudinary usage in production
3. Upgrade to paid tier if needed ($25/mo for 75GB bandwidth)

**Cost Projection:**

| Month | Visitors | Images Viewed | Bandwidth | Cloudinary Tier |
|-------|----------|---------------|-----------|-----------------|
| **Launch** | 100 | 1,000 | 2GB | Free |
| **Month 3** | 500 | 5,000 | 10GB | Free |
| **Month 6** | 1,000 | 10,000 | 20GB | Free |
| **Month 12** | 2,000 | 20,000 | 40GB | Plus ($25/mo) |

### Implementation Plan

**Week 1: Setup**
- Create Cloudinary account
- Upload existing images
- Configure cloud name and API keys

**Week 2: Integration**
- Implement `imageOptimizer.ts` helper
- Update `artworks.json` with Cloudinary public IDs
- Update Gallery component to use optimized URLs

**Week 3: Testing**
- Verify AVIF/WebP delivery
- Test fallback to JPEG for older browsers
- Measure LCP improvement (target: <1.5s)

### Expected Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **LCP (Mobile)** | 2.5s | 1.2s | 52% faster |
| **Image Size (Mobile)** | 800KB | 200KB | 75% smaller |
| **Format Support** | JPEG only | AVIF/WebP/JPEG | Modern formats |
| **Manual Work** | Sharp script | Zero (auto) | 100% automated |

### Consequences

**Positive:**
- 52% faster LCP (2.5s → 1.2s)
- 75% bandwidth savings (AVIF compression)
- Zero manual optimization (automatic)
- On-demand transformations (crop, resize, filters)

**Negative:**
- Vendor lock-in (Cloudinary-specific URLs)
- Free tier limits (25GB bandwidth/month)
- Requires migration effort (update all image URLs)

**Rollback Plan:**
If Cloudinary becomes unavailable:
1. Serve pre-generated images from `/docs/img/`
2. Fallback URLs in `artworks.json`:
   ```json
   {
     "cloudinary_id": "artworks/forest-whisper",
     "fallback_url": "img/forest-whisper.jpg"
   }
   ```
3. Update `imageOptimizer.ts` to check Cloudinary availability

---

## ADR-005: 3D/WebGL Integration Approach

**Date:** 2025-11-28
**Status:** Proposed
**Deciders:** Engineering Team
**Supersedes:** None

### Context

Artist feedback: "Flat photos don't showcase the texture and dimensionality of my mixed-media art."

**Goal:** Allow users to explore artwork texture with 3D lighting controls.

**Requirements:**
- Showcase texture depth (wood grain, moss, bark)
- Interactive lighting controls
- Mobile-friendly touch gestures
- Lazy-loaded (large bundle)
- Fallback to 2D images for older browsers

**Options Considered:**

| Option | Pros | Cons | Bundle Size |
|--------|------|------|-------------|
| **Three.js** | Mature, full-featured, WebGL 1/2 | Large bundle (570KB) | 570KB min |
| **Babylon.js** | Game engine features, PBR materials | Huge bundle (1.2MB) | 1.2MB |
| **A-Frame** | Declarative, VR-ready | Heavy, opinionated | 800KB |
| **Custom WebGL** | Minimal, full control | High complexity | ~50KB |
| **Model Viewer (Google)** | Simple API, AR support | Less control | 300KB |

### Decision

**Use Three.js with dynamic import** for selected artworks.

### Rationale

**Three.js Benefits:**
1. **Industry standard** - Mature, well-documented
2. **Displacement mapping** - Perfect for texture depth
3. **OrbitControls** - Touch-friendly camera
4. **GLTF support** - 3D models if needed later
5. **Active ecosystem** - Frequent updates, security patches

**Bundle Size Mitigation:**
```javascript
// Lazy load only when user clicks "View in 3D"
const viewer3D = document.querySelector('.view-3d-btn');
viewer3D.addEventListener('click', async () => {
  const { Artwork3DViewer } = await import('./components/Artwork3DViewer.js');
  // Three.js loaded only now (570KB)
  const viewer = new Artwork3DViewer(/* ... */);
});
```

**Implementation:**

```typescript
// docs/js/components/Artwork3DViewer.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Artwork3DViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private lights: THREE.DirectionalLight[] = [];

  constructor(container: HTMLElement, textures: {
    color: string;
    height: string;
    normal?: string;
  }) {
    this.initScene(container);
    this.loadTextures(textures);
    this.addLightingControls(container);
    this.animate();
  }

  private initScene(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.renderer.setSize(800, 1000); // Artwork aspect ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Max 2x for performance

    container.appendChild(this.renderer.domElement);

    // Camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2; // Prevent flipping

    this.camera.position.z = 5;
  }

  private async loadTextures(textures: { color: string; height: string; normal?: string }) {
    const loader = new THREE.TextureLoader();

    const [colorMap, heightMap, normalMap] = await Promise.all([
      loader.loadAsync(textures.color),
      loader.loadAsync(textures.height),
      textures.normal ? loader.loadAsync(textures.normal) : null,
    ]);

    // Create plane with displacement for depth
    const geometry = new THREE.PlaneGeometry(4, 5, 256, 256);
    const material = new THREE.MeshStandardMaterial({
      map: colorMap,
      displacementMap: heightMap,
      displacementScale: 0.3, // Adjustable depth
      normalMap,
      roughness: 0.8,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    this.scene.add(directionalLight1);
    this.lights.push(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-1, -1, 0.5);
    this.scene.add(directionalLight2);
    this.lights.push(directionalLight2);
  }

  private addLightingControls(container: HTMLElement) {
    const controls = document.createElement('div');
    controls.className = 'lighting-controls';
    controls.innerHTML = `
      <label>
        Light Intensity:
        <input type="range" min="0" max="2" step="0.1" value="0.8" class="light-intensity" />
      </label>
      <label>
        Texture Depth:
        <input type="range" min="0" max="1" step="0.05" value="0.3" class="texture-depth" />
      </label>
    `;

    container.appendChild(controls);

    controls.querySelector('.light-intensity')!.addEventListener('input', (e) => {
      const intensity = parseFloat((e.target as HTMLInputElement).value);
      this.lights.forEach(light => (light.intensity = intensity));
    });

    controls.querySelector('.texture-depth')!.addEventListener('input', (e) => {
      const depth = parseFloat((e.target as HTMLInputElement).value);
      const mesh = this.scene.children.find(child => child instanceof THREE.Mesh);
      if (mesh) {
        (mesh.material as THREE.MeshStandardMaterial).displacementScale = depth;
      }
    });
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.dispose();
    this.controls.dispose();
  }
}
```

**Usage:**
```html
<!-- Add "View in 3D" button to lightbox -->
<button class="view-3d-btn">Explore Texture in 3D</button>

<div id="viewer-3d-container" style="display: none;">
  <!-- Three.js canvas rendered here -->
</div>
```

### Expected User Experience

1. User opens artwork in lightbox (2D image)
2. Sees "Explore Texture in 3D" button
3. Clicks button → Three.js dynamically loads (1-2s delay)
4. 3D viewer appears with interactive controls:
   - **Touch/mouse drag** - Rotate artwork
   - **Pinch/scroll** - Zoom in/out
   - **Light intensity slider** - Adjust lighting
   - **Texture depth slider** - Adjust displacement

### Performance Considerations

| Consideration | Solution |
|---------------|----------|
| **Large bundle** | Dynamic import (loaded only when clicked) |
| **Mobile performance** | Max 2x pixel ratio, reduce geometry on mobile |
| **Older browsers** | Feature detection, fallback to 2D |
| **Loading time** | Show spinner while Three.js loads |

### Consequences

**Positive:**
- Unique selling point (showcase texture depth)
- Engaging user experience
- Educational (users understand mixed-media art better)
- SEO benefit (longer time on site)

**Negative:**
- Large bundle size (570KB Three.js)
- Requires height maps for each artwork (manual work)
- Mobile performance concerns (GPU intensive)
- Browser compatibility (WebGL required)

**Mitigation:**
- Lazy load (only when user requests 3D view)
- Opt-in per artwork (not all artworks need 3D)
- Graceful degradation (fallback to 2D)
- Performance budget (limit to 5 artworks initially)

---

## ADR-006: Headless CMS Selection

**Date:** 2025-11-28
**Status:** Proposed
**Deciders:** Engineering Team, Artist
**Supersedes:** None

### Context

Current content management:
- **Artworks:** Manual JSON editing (`artworks.json`)
- **Translations:** Manual JSON editing (`translations.json`)
- **Images:** Manual upload to `/docs/img/`, run Sharp script

**Artist Feedback:**
"I want to update my portfolio without asking a developer to edit JSON files."

**Requirements:**
1. **Easy artwork updates** - Add/edit/delete artworks via UI
2. **Image upload** - Drag-and-drop with automatic optimization
3. **No developer needed** - Artist manages content independently
4. **Low cost** - Free or <$20/month
5. **Fast deployment** - Changes go live in <5 minutes

**Options Considered:**

| CMS | Pros | Cons | Cost | Complexity |
|-----|------|------|------|------------|
| **Sanity** | Free tier, great DX, real-time preview | Steep learning curve | $0-99/mo | Medium |
| **Contentful** | Enterprise features, GraphQL | Expensive, complex | $0-489/mo | High |
| **Strapi** | Self-hosted, full control | DevOps overhead, no free hosting | $5-20/mo VPS | High |
| **Decap CMS (Netlify)** | Git-based, simple | Limited features, Git workflow | $0 | Low |
| **Payload CMS** | Modern, TypeScript | New, small community | $0 (self-host) | Medium |
| **Manual JSON (current)** | Zero cost, simple | No UI, developer-dependent | $0 | Low |

### Decision

**Adopt Sanity CMS Free Tier** with GitHub Actions deployment.

### Rationale

**Sanity Benefits:**
1. **Generous free tier** - 3 users, 500K API requests/month
2. **Real-time preview** - See changes before publishing
3. **Structured content** - Define artwork schema with validation
4. **Asset pipeline** - Automatic image optimization (similar to Cloudinary)
5. **GraphQL/GROQ** - Flexible queries
6. **Portable** - Can migrate data out easily (JSON export)

**Artist Workflow:**
```
1. Login to studio.sanity.io
2. Click "New Artwork"
3. Fill form:
   - Title
   - Description (rich text with translations)
   - Upload images (drag & drop)
   - Select category (dropdown)
   - Set availability (toggle)
   - Add price (optional)
4. Click "Publish"
5. GitHub Actions deploys site automatically (3 min)
```

**Schema Definition:**
```typescript
// sanity/schemas/artwork.ts
export default {
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'localeText', // Custom type for EN/UA translations
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true, // Enable focal point selection
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        },
      ],
    },
    {
      name: 'images',
      title: 'Additional Images',
      type: 'array',
      of: [{ type: 'image' }],
    },
    {
      name: 'size',
      title: 'Size',
      type: 'string',
      placeholder: 'e.g., 24" x 30"',
    },
    {
      name: 'materials',
      title: 'Materials',
      type: 'string',
      placeholder: 'e.g., Wood, moss, resin',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Nature', value: 'nature' },
          { title: 'Blue Tones', value: 'blue' },
          { title: 'Fire & Transformation', value: 'fire' },
          { title: 'Ethereal', value: 'ethereal' },
          { title: 'Seasonal', value: 'seasonal' },
        ],
      },
    },
    {
      name: 'available',
      title: 'Available for Purchase',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Leave empty for "Price on Request"',
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      category: 'category',
    },
    prepare({ title, media, category }) {
      return {
        title,
        media,
        subtitle: category,
      };
    },
  },
};
```

**Deployment Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy Sanity + Frontend

on:
  push:
    branches: [main]
  workflow_dispatch: # Manual trigger
  repository_dispatch: # Triggered by Sanity webhook
    types: [sanity-deploy]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Fetch Sanity data
        run: |
          curl -X POST \
            https://YOUR_PROJECT_ID.api.sanity.io/v2021-10-21/data/query/production \
            -H "Authorization: Bearer ${{ secrets.SANITY_TOKEN }}" \
            -d '{"query": "*[_type == \"artwork\"]"}' \
            > docs/js/artworks.json

      - name: Build site
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Cost Projection:**

| Month | Artworks | API Calls | Sanity Tier | Cost |
|-------|----------|-----------|-------------|------|
| **Launch** | 20 | 10K | Free | $0 |
| **Month 6** | 50 | 50K | Free | $0 |
| **Month 12** | 100 | 200K | Free | $0 |
| **Year 2** | 200 | 600K | Growth ($99/mo) | $99/mo |

Free tier should last 1-2 years based on projected traffic.

### Comparison with Alternatives

| Feature | Sanity | Decap CMS | Strapi | Manual JSON |
|---------|--------|-----------|--------|-------------|
| **Ease of Use** | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★☆☆☆☆ |
| **Image Optimization** | ✅ Auto | ❌ Manual | ✅ Plugin | ❌ Sharp script |
| **Real-time Preview** | ✅ | ❌ | ✅ | ❌ |
| **Translations** | ✅ Native | ❌ DIY | ✅ Plugin | ✅ Manual |
| **Free Tier** | ✅ Generous | ✅ Unlimited | ❌ Self-host only | ✅ Free |
| **Complexity** | Medium | Low | High | Low |

### Implementation Plan

**Week 1: Sanity Setup**
- Create Sanity project
- Define artwork schema
- Setup Sanity Studio (CMS UI)

**Week 2: Data Migration**
- Migrate `artworks.json` to Sanity
- Upload images to Sanity CDN
- Configure translations

**Week 3: Frontend Integration**
- Update `api.js` to fetch from Sanity
- Update image URLs to use Sanity CDN
- Test deployment workflow

**Week 4: Artist Training**
- Create video tutorial for artist
- Document common workflows
- Handoff CMS access

### Consequences

**Positive:**
- Artist can manage content independently
- Automatic image optimization
- Real-time preview before publishing
- Version history and rollback
- GraphQL queries for flexibility

**Negative:**
- New dependency (Sanity)
- API rate limits on free tier (500K/month)
- Deployment takes 3-5 minutes (GitHub Actions)
- Learning curve for artist

**Rollback Plan:**
If Sanity doesn't work out:
1. Export all data to JSON (Sanity provides export tool)
2. Move images to GitHub repo or Cloudinary
3. Revert to manual JSON editing
4. Keep all frontend code unchanged (API layer abstracts CMS)

---

## Summary of Decisions

| ADR | Decision | Status | Priority | Effort |
|-----|----------|--------|----------|--------|
| **ADR-001** | Stay with Vanilla JS | ✅ Accepted | N/A | N/A |
| **ADR-002** | Adopt Vite + TypeScript | 🔶 Proposed | P0 | L (2-3 weeks) |
| **ADR-003** | Custom State Store | 🔶 Proposed | P1 | M (1 week) |
| **ADR-004** | Cloudinary for Images | 🔶 Proposed | P0 | M (1 week) |
| **ADR-005** | Three.js for 3D Viewer | 🔶 Proposed | P3 | XL (3-4 weeks) |
| **ADR-006** | Sanity CMS | 🔶 Proposed | P2 | M (3-4 weeks) |

### Next Steps

**Immediate (Next Sprint):**
1. Get stakeholder approval on ADR-002 (Vite + TypeScript)
2. Get stakeholder approval on ADR-004 (Cloudinary)
3. Begin implementation of approved ADRs

**Short-term (Next Quarter):**
4. Implement ADR-003 (State Management)
5. Evaluate ADR-006 (Sanity CMS) with artist

**Long-term (6-12 months):**
6. Explore ADR-005 (3D Viewer) as premium feature

### Decision Tracking

All ADRs will be tracked in this document. When an ADR status changes:
- **Proposed** → **Accepted** (after team review)
- **Accepted** → **Implemented** (after code merge)
- **Proposed** → **Rejected** (document rationale)
- **Accepted** → **Superseded** (replaced by newer ADR)
