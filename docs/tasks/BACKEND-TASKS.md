# Backend Implementation Tasks & Timeline
**Status**: Ready for Implementation | **Date**: November 28, 2025
**Total Effort**: 8 weeks (160 hours) | **Team Size**: 1-2 developers

---

## Overview

Phased implementation plan to migrate Branchstone from static portfolio to dynamic e-commerce platform with CMS.

**Phases**:
1. **Phase 1** (Weeks 1-2): Backend Infrastructure & API Foundation
2. **Phase 2** (Weeks 3-4): Headless CMS Setup & Content Migration
3. **Phase 3** (Weeks 5-6): E-Commerce Implementation & Order Management
4. **Phase 4** (Weeks 7-8): Testing, Optimization & Production Launch

---

## Phase 1: Backend Infrastructure (Weeks 1-2)

### Goal
Establish serverless backend, database, and basic API infrastructure. Validate Stripe integration.

### Effort: 40 hours

### 1.1 - Setup Vercel Project
**Status**: Pending | **Effort**: 2 hours | **Owner**: Backend Developer

**Tasks**:
```
[ ] Fork/clone repo on Vercel
[ ] Connect GitHub repo to Vercel
[ ] Setup preview deployments
[ ] Configure environment variables
    - STRIPE_SECRET_KEY
    - SANITY_PROJECT_ID
    - SUPABASE_URL
    - SUPABASE_KEY
[ ] Test deployment pipeline
[ ] Create staging environment
```

**Acceptance Criteria**:
- Vercel project created and linked to GitHub
- Environment variables configured
- Preview deployments working
- `GET /api/health` returns 200

**Resources**:
- Vercel docs: https://vercel.com/docs/functions/quickstart
- GitHub integration: https://vercel.com/docs/git/vercel-for-github

---

### 1.2 - Setup Supabase PostgreSQL
**Status**: Pending | **Effort**: 4 hours | **Owner**: Database Architect

**Tasks**:
```
[ ] Create Supabase project
[ ] Configure database:
    - Region: nearest to users
    - Backups: daily
    - PITR: 7 days
[ ] Create schema:
    - orders table
    - order_items table
    - customers table
    - analytics_events table
    - newsletter_subscribers table
[ ] Add indexes for performance
[ ] Setup Row-Level Security (RLS) policies
[ ] Create service role for API access
[ ] Test database queries
[ ] Setup backup strategy
[ ] Document connection string (keep secret)
```

**Acceptance Criteria**:
- All tables created with correct schema
- Indexes added and verified
- RLS policies working
- Connection from Vercel Functions successful
- Backup enabled

**Resources**:
- Supabase docs: https://supabase.com/docs
- RLS guide: https://supabase.com/docs/guides/auth/row-level-security

**Database Schema**:
```sql
-- See BACKEND-ARCHITECTURE-001-strategy.md for full schema
-- Key tables:
-- - orders (id, customer_email, total, status, stripe_id)
-- - order_items (id, order_id, artwork_id, price, quantity)
-- - analytics_events (id, event_type, artwork_id, created_at)
-- - newsletter_subscribers (id, email, consent, subscribed_at)
```

---

### 1.3 - Setup Stripe Account & Webhooks
**Status**: Pending | **Effort**: 3 hours | **Owner**: Backend Developer

**Tasks**:
```
[ ] Create Stripe account (free)
[ ] Get API keys:
    - Publishable key (safe to expose)
    - Secret key (keep in environment)
[ ] Configure webhook signing secret
[ ] Setup webhook endpoint in Vercel:
    POST /api/stripe-webhook
[ ] Register webhook events:
    - payment_intent.succeeded
    - payment_intent.payment_failed
    - charge.dispute.created
[ ] Test webhook delivery with Stripe CLI
[ ] Add webhook signing validation
[ ] Document webhook secret location
```

**Acceptance Criteria**:
- Stripe account created with API keys
- Webhook endpoint accessible from Stripe
- Webhook events received and logged
- Signature validation working

**Resources**:
- Stripe docs: https://stripe.com/docs
- Webhooks: https://stripe.com/docs/webhooks
- Stripe CLI: https://stripe.com/docs/stripe-cli

---

### 1.4 - Implement Core API Endpoints (Vercel Functions)
**Status**: Pending | **Effort**: 15 hours | **Owner**: Backend Developer

**Creates**:
- `/vercel/functions/api/health.ts`
- `/vercel/functions/api/artworks.ts`
- `/vercel/functions/api/checkout.ts`
- `/vercel/functions/api/stripe-webhook.ts`
- `/vercel/functions/middleware/rate-limit.ts`
- `/vercel/functions/middleware/error-handler.ts`

**4.1 - GET /api/health**
```typescript
// Returns health status of all dependencies
Response:
{
  status: "healthy",
  timestamp: "2025-11-28T10:00:00Z",
  checks: {
    stripe: "ok",
    supabase: "ok",
    sanity: "ok"
  }
}

Tests:
[ ] Returns 200 on success
[ ] Returns 500 if dependency down
[ ] Check response time < 500ms
```

**4.2 - GET /api/artworks**
```typescript
// Temporary: fetch from static JSON (will migrate to Sanity in Phase 2)
// Eventually: fetch from Sanity
Request: /api/artworks

Query params:
- limit: 10 (default)
- offset: 0 (default)
- category: "fire" (optional)

Response:
{
  data: [
    {
      id: 1,
      title: "Born of Burn",
      price: 5000,
      image: "...",
      available: true
    }
  ],
  total: 15,
  page: 1,
  limit: 10
}

Tests:
[ ] Returns all artworks
[ ] Pagination works
[ ] Category filter works
[ ] Caching for 5 minutes
[ ] Response time < 300ms
```

**4.3 - POST /api/checkout**
```typescript
// Create Stripe checkout session
Request:
{
  items: [
    { id: 1, price: 5000, quantity: 1 }
  ],
  email: "buyer@example.com",
  name: "John Doe"
}

Validations:
[ ] Email format valid
[ ] Items not empty
[ ] Price > 0
[ ] Price matches current artwork price (prevent fraud)
[ ] Item availability verified
[ ] Quantity ≤ stock (if limited edition)

Response:
{
  sessionId: "cs_live_xyz",
  url: "https://checkout.stripe.com/pay/cs_live_xyz"
}

Steps:
1. Validate input
2. Fetch current prices from Sanity (or JSON)
3. Verify prices match request (prevent price manipulation)
4. Create Stripe Checkout Session
5. Store order in Supabase with status="pending"
6. Return checkout URL to frontend
7. Log event to analytics

Tests:
[ ] Valid request returns checkout URL
[ ] Invalid email rejected
[ ] Price mismatch detected
[ ] Item not available returns 409
[ ] Order stored in database
[ ] Response time < 500ms
[ ] Stripe session created successfully
```

**4.4 - POST /api/stripe-webhook**
```typescript
// Handle Stripe events
Headers:
{
  "stripe-signature": "t=1234567890,v1=xxx"
}

Body:
{
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_xyz",
      amount_received: 8500,
      customer_email: "buyer@example.com"
    }
  }
}

Events to handle:
1. payment_intent.succeeded
   - Update order status → "confirmed"
   - Send confirmation email to customer
   - Send notification to artist
   - Track analytics event

2. payment_intent.payment_failed
   - Update order status → "failed"
   - Send error notification to customer
   - Log payment failure

3. charge.dispute.created
   - Update order status → "disputed"
   - Alert artist
   - Log chargeback

Validations:
[ ] Webhook signature verified (prevent spoofing)
[ ] Event data not null
[ ] Order exists in database
[ ] Idempotency: same event processed only once

Tests:
[ ] Signature validation fails for invalid signature
[ ] payment_intent.succeeded updates order status
[ ] Email sent on success
[ ] Response returns 200 quickly (< 1 second)
[ ] Duplicate webhooks handled gracefully
```

**4.5 - Middleware: Rate Limiting**
```typescript
// Limit requests: 60 per minute per IP
// Exceptions: Stripe webhooks (whitelist Stripe IPs)

Implementation:
[ ] Track requests per IP in memory
[ ] Return 429 when limit exceeded
[ ] Include "Retry-After" header
[ ] Exempt Stripe webhook IPs

Tests:
[ ] Requests under limit succeed
[ ] Requests over limit rejected with 429
[ ] Header "Retry-After" present
```

**4.6 - Middleware: Error Handler**
```typescript
// Catch all errors and return consistent response

Format:
{
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    statusCode: 400
  }
}

Implementation:
[ ] Try-catch all endpoints
[ ] Log errors to Sentry
[ ] Return consistent error format
[ ] Never expose stack traces to client
[ ] Log request ID for tracing

Tests:
[ ] Validation errors return 400
[ ] Not found errors return 404
[ ] Server errors return 500
[ ] Errors logged to Sentry
```

**Acceptance Criteria**:
- All 6 endpoints deployed and functional
- Middleware working correctly
- All tests passing
- Error handling comprehensive
- Response times acceptable

---

### 1.5 - Setup Error Tracking (Sentry)
**Status**: Pending | **Effort**: 2 hours | **Owner**: Backend Developer

**Tasks**:
```
[ ] Create Sentry account (free tier)
[ ] Create project for Branchstone backend
[ ] Install Sentry SDK in Vercel Functions
[ ] Configure error reporting:
    - Don't report 4xx errors
    - Report all 5xx errors
    - Report warnings (optional)
[ ] Integrate with Slack (optional)
[ ] Create dashboard for errors
[ ] Test error reporting
[ ] Document Sentry process
```

**Acceptance Criteria**:
- Sentry project created
- SDK integrated and reporting errors
- Dashboard accessible
- Alerts configured

**Resources**:
- Sentry docs: https://docs.sentry.io

---

### 1.6 - Setup CI/CD Pipeline
**Status**: Pending | **Effort**: 4 hours | **Owner**: Backend Developer

**Create** GitHub Actions workflow:
- `.github/workflows/test.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/security.yml`

**test.yml**:
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test
      - run: npm run lint
```

**deploy.yml**:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
```

**security.yml**:
```yaml
name: Security
on: [push]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: npm run security-check
```

**Acceptance Criteria**:
- Tests run on every push
- Deployments automated on merge to main
- Security checks in place

---

### 1.7 - Documentation: Backend Setup Guide
**Status**: Pending | **Effort**: 4 hours | **Owner**: Technical Writer

**Creates**:
- `/docs/backend/SETUP.md` - Local development setup
- `/docs/backend/API.md` - API endpoint reference
- `/docs/backend/DATABASE.md` - Database schema
- `/docs/backend/ENVIRONMENT.md` - Environment variables

**Covers**:
```
[ ] Prerequisites (Node, npm, accounts)
[ ] Local development setup
[ ] Running tests locally
[ ] Database setup
[ ] Environment configuration
[ ] Deploying to Vercel
[ ] Monitoring and debugging
```

---

## Phase 2: Headless CMS (Weeks 3-4)

### Goal
Implement Sanity CMS with content models, migrate existing artworks, setup API queries.

### Effort: 40 hours

### 2.1 - Setup Sanity CMS
**Status**: Pending | **Effort**: 3 hours | **Owner**: CMS Architect

**Tasks**:
```
[ ] Create Sanity account (free)
[ ] Create project in Sanity Studio
[ ] Initialize Sanity CLI
[ ] Setup CORS for Vercel domain
[ ] Configure deployment settings
[ ] Get API credentials:
    - Dataset (default: production)
    - Project ID
    - API token (read-only for frontend)
[ ] Create deployment token (for CI/CD)
[ ] Test API access from Vercel
```

**Acceptance Criteria**:
- Sanity project accessible
- API credentials working
- CORS configured correctly
- Can query data via API

---

### 2.2 - Define Content Models (Sanity Studio)
**Status**: Pending | **Effort**: 6 hours | **Owner**: CMS Architect

**Creates**:
- `schemas/artwork.js`
- `schemas/collection.js`
- `schemas/testimonial.js`
- `schemas/press.js`
- `schemas/commission.js`

**2.2.1 - Artwork Schema**
```javascript
{
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', required: true },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'category', title: 'Category', type: 'select',
      options: [
        { title: 'Fire', value: 'fire' },
        { title: 'Water', value: 'water' },
        { title: 'Earth', value: 'earth' },
        { title: 'Air', value: 'air' }
      ]
    },
    { name: 'size', title: 'Size', type: 'string' }, // "24x36 in"
    { name: 'materials', title: 'Materials', type: 'string' },
    { name: 'price', title: 'Price (cents)', type: 'number', required: true },
    { name: 'mainImage', title: 'Main Image', type: 'image' },
    { name: 'gallery', title: 'Gallery Images', type: 'array',
      of: [{ type: 'image' }] },
    { name: 'available', title: 'Available for Sale', type: 'boolean' },
    { name: 'sold', title: 'Sold', type: 'boolean' },
    { name: 'featured', title: 'Featured', type: 'boolean' },
    { name: 'createdDate', title: 'Created Date', type: 'date' },
    { name: 'year', title: 'Year', type: 'number' }
  ]
}

Tests:
[ ] Can create artwork
[ ] Title is required
[ ] Price is number
[ ] Images upload and crop
[ ] Categories selectable
```

**2.2.2 - Collection Schema**
```javascript
{
  name: 'collection',
  title: 'Collection',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', required: true },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'artworks', title: 'Artworks', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'artwork' }] }] },
    { name: 'coverImage', title: 'Cover Image', type: 'image' },
    { name: 'featured', title: 'Featured', type: 'boolean' }
  ]
}
```

**2.2.3 - Testimonial Schema**
```javascript
{
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    { name: 'quote', title: 'Quote', type: 'text', required: true },
    { name: 'authorName', title: 'Author Name', type: 'string', required: true },
    { name: 'authorRole', title: 'Role', type: 'string' }, // "Collector"
    { name: 'authorImage', title: 'Author Image', type: 'image' },
    { name: 'featured', title: 'Featured', type: 'boolean' }
  ]
}
```

**2.2.4 - Press Schema**
```javascript
{
  name: 'press',
  title: 'Press & News',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', required: true },
    { name: 'publication', title: 'Publication', type: 'string', required: true },
    { name: 'url', title: 'URL', type: 'url' },
    { name: 'excerpt', title: 'Excerpt', type: 'text' },
    { name: 'publishedDate', title: 'Published Date', type: 'date' },
    { name: 'featured', title: 'Featured', type: 'boolean' }
  ]
}
```

**2.2.5 - Commission Schema**
```javascript
{
  name: 'commission',
  title: 'Commission Request',
  type: 'document',
  fields: [
    { name: 'clientName', title: 'Client Name', type: 'string', required: true },
    { name: 'clientEmail', title: 'Client Email', type: 'string', required: true },
    { name: 'description', title: 'Project Description', type: 'text', required: true },
    { name: 'referenceImages', title: 'Reference Images', type: 'array',
      of: [{ type: 'image' }] },
    { name: 'budget', title: 'Budget', type: 'string' },
    { name: 'timeline', title: 'Desired Timeline', type: 'string' },
    { name: 'status', title: 'Status', type: 'select',
      options: [
        { title: 'New', value: 'new' },
        { title: 'Contacted', value: 'contacted' },
        { title: 'In Progress', value: 'in_progress' },
        { title: 'Completed', value: 'completed' }
      ]
    },
    { name: 'createdDate', title: 'Submitted Date', type: 'date' },
    { name: 'notes', title: 'Artist Notes', type: 'text' }
  ]
}
```

**Acceptance Criteria**:
- All schemas created and published
- Can create documents in each schema
- Images upload correctly
- References work (artwork in collection)

---

### 2.3 - Migrate Artworks to Sanity
**Status**: Pending | **Effort**: 8 hours | **Owner**: CMS Architect

**Process**:
```
[ ] Export current artworks.json
[ ] Create Sanity import script (Node.js)
[ ] Script loads JSON and creates Sanity documents
[ ] Upload images to Sanity CDN
[ ] Verify all artworks imported
[ ] Test image delivery
[ ] Remove/archive old JSON file
[ ] Document migration process
```

**Script**:
```javascript
// scripts/migrate-artworks.js
import sanityClient from '@sanity/client';
import fs from 'fs';

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  token: process.env.SANITY_DEPLOY_TOKEN
});

const artworks = JSON.parse(fs.readFileSync('artworks.json'));

for (const artwork of artworks) {
  await client.create({
    _type: 'artwork',
    title: artwork.title,
    description: artwork.description,
    category: artwork.category,
    size: artwork.size,
    materials: artwork.materials,
    price: artwork.price,
    available: artwork.available,
    // Images uploaded separately
  });
}
```

**Image Upload**:
```
[ ] Download images from existing site
[ ] Upload to Sanity Media asset
[ ] Create references in artwork documents
[ ] Test image CDN URLs
[ ] Verify image optimization (WebP, AVIF)
[ ] Test responsive images
```

**Acceptance Criteria**:
- All artworks migrated to Sanity
- Images uploaded and optimized
- Data verified (prices, descriptions, categories)
- Old JSON still available as backup

---

### 2.4 - Setup Sanity API Queries
**Status**: Pending | **Effort**: 6 hours | **Owner**: Backend Developer

**Creates**:
- `/lib/sanity.js` - Sanity client configuration
- `/lib/queries/artworks.js` - GROQ queries for artworks
- `/vercel/functions/api/artworks.ts` - Updated endpoint using Sanity

**2.4.1 - Sanity Client Setup**
```javascript
// lib/sanity.js
import sanityClient from '@sanity/client';

export const client = sanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: true
});

export const previewClient = sanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false
});
```

**2.4.2 - GROQ Queries**
```javascript
// lib/queries/artworks.js

export const GET_ALL_ARTWORKS = `
  *[_type == "artwork"] | order(_createdAt desc) {
    _id,
    title,
    description,
    category,
    size,
    materials,
    price,
    available,
    "mainImage": mainImage.asset->url,
    "gallery": gallery[].asset->url,
    featured,
    year
  }
`;

export const GET_ARTWORK_BY_CATEGORY = `
  *[_type == "artwork" && category == $category] | order(_createdAt desc) {
    _id,
    title,
    price,
    "mainImage": mainImage.asset->url,
    available
  }
`;

export const GET_FEATURED_ARTWORKS = `
  *[_type == "artwork" && featured == true] | order(_createdAt desc)[0...6] {
    _id,
    title,
    price,
    "mainImage": mainImage.asset->url
  }
`;

export const GET_COLLECTIONS = `
  *[_type == "collection"] {
    _id,
    title,
    description,
    "artworks": artworks[]->{
      _id,
      title,
      price
    },
    "coverImage": coverImage.asset->url
  }
`;
```

**2.4.3 - Updated API Endpoint**
```typescript
// vercel/functions/api/artworks.ts
import { client } from '@/lib/sanity';
import { GET_ALL_ARTWORKS } from '@/lib/queries/artworks';

export default async (req, res) => {
  try {
    const category = req.query.category;
    let query = GET_ALL_ARTWORKS;
    let params = {};

    if (category) {
      query = `*[_type == "artwork" && category == $category]`;
      params = { category };
    }

    const artworks = await client.fetch(query, params);

    res.json({
      data: artworks,
      total: artworks.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Acceptance Criteria**:
- Sanity API queries work
- Updated endpoint fetches from Sanity
- Caching enabled (CDN)
- Query performance < 500ms
- Fallback to static JSON if Sanity down

---

### 2.5 - Update Frontend to Use Sanity
**Status**: Pending | **Effort**: 8 hours | **Owner**: Frontend Developer

**Changes**:
- Remove hardcoded `artworks.json` imports
- Update gallery.js to fetch from `/api/artworks`
- Update index.js (featured artworks)
- Update category filters
- Add error handling for API failures
- Test responsive image delivery

**gallery.js changes**:
```javascript
// Before
import artworks from '/data/artworks.json';

// After
async function loadArtworks() {
  try {
    const response = await fetch('/api/artworks');
    const { data } = await response.json();
    renderGallery(data);
  } catch (error) {
    console.error('Failed to load artworks:', error);
    // Fallback to cached data
  }
}
```

**Acceptance Criteria**:
- Gallery loads from Sanity API
- Filters work correctly
- Images display and optimize
- Fallback works if API unavailable
- Performance: gallery loads < 2 seconds
- Mobile-responsive

---

### 2.6 - Setup Image Optimization in Sanity
**Status**: Pending | **Effort**: 3 hours | **Owner**: Backend Developer

**Tasks**:
```
[ ] Configure Sanity image pipeline
[ ] Setup image URL generation with optimization
[ ] Create image helper function:
    - Responsive images (srcset)
    - WebP/AVIF formats
    - Lazy loading
    - Placeholder blur
[ ] Test image delivery across browsers
[ ] Verify CDN caching headers
[ ] Monitor image loading performance
```

**Implementation**:
```javascript
// lib/image.js
export function getImageUrl(source) {
  const { asset } = source;
  if (!asset) return null;

  return {
    original: asset.url,
    responsive: {
      mobile: `${asset.url}?w=600&h=800&fit=crop`,
      tablet: `${asset.url}?w=900&h=1200&fit=crop`,
      desktop: `${asset.url}?w=1200&h=1600&fit=crop`
    },
    webp: `${asset.url}?w=1200&fm=webp`,
    avif: `${asset.url}?w=1200&fm=avif`,
    blur: `${asset.url}?w=30&blur=30`
  };
}
```

---

### 2.7 - Setup Sanity Webhooks (Optional)
**Status**: Pending | **Effort**: 2 hours | **Owner**: Backend Developer

**Purpose**: Automatically update frontend when content changes in Sanity

**Webhook Event**:
```
POST /api/sanity-webhook
Body: {
  ids: ["artwork-123"],
  mutations: ["create", "update", "delete"]
}

Action:
1. Fetch updated artworks from Sanity
2. Clear cache
3. Trigger CDN invalidation
4. Log event
```

**Acceptance Criteria**:
- Webhooks configured in Sanity
- Endpoint receives events
- Cache invalidated on update
- Frontend sees changes within 1 minute

---

## Phase 3: E-Commerce Implementation (Weeks 5-6)

### Goal
Implement complete e-commerce system: shopping cart, checkout, order management, email notifications.

### Effort: 40 hours

### 3.1 - Implement Shopping Cart (Frontend)
**Status**: Pending | **Effort**: 6 hours | **Owner**: Frontend Developer

**Creates**:
- `/docs/js/cart.js` - Cart management
- `/docs/html/cart.html` - Cart page UI
- `/docs/css/cart.css` - Cart styling

**Features**:
```
[ ] Add to cart button on artwork detail
[ ] Cart stored in localStorage
[ ] Cart summary in header
[ ] View cart page
[ ] Update quantities
[ ] Remove items
[ ] Apply (future) coupon codes
[ ] Calculate total including taxes
[ ] Persist cart across sessions
[ ] Clear cart after successful purchase
```

**Implementation**:
```javascript
// docs/js/cart.js
class Cart {
  constructor() {
    this.items = this.load();
  }

  add(artwork, quantity = 1) {
    const existing = this.items.find(i => i.id === artwork.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ ...artwork, quantity });
    }
    this.save();
    this.notify('item-added');
  }

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.notify('item-removed');
  }

  updateQuantity(id, quantity) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.save();
    }
  }

  clear() {
    this.items = [];
    this.save();
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  save() {
    localStorage.setItem('branchstone-cart', JSON.stringify(this.items));
  }

  load() {
    const data = localStorage.getItem('branchstone-cart');
    return data ? JSON.parse(data) : [];
  }

  notify(event) {
    window.dispatchEvent(new CustomEvent('cart-changed', { detail: { event } }));
  }
}

export const cart = new Cart();
```

**Tests**:
```
[ ] Add item increases quantity
[ ] Remove item deletes from cart
[ ] Clear cart empties
[ ] Total calculated correctly
[ ] Cart persists on page reload
[ ] Cart cleared after purchase
```

---

### 3.2 - Checkout Flow (Frontend)
**Status**: Pending | **Effort**: 5 hours | **Owner**: Frontend Developer

**Creates**:
- `/docs/html/checkout.html` - Checkout page
- `/docs/js/checkout.js` - Checkout logic

**Flow**:
```
1. User clicks "Checkout"
2. Verify cart not empty
3. Collect customer info:
   - Email
   - Name
   - (Optional) Shipping address
4. Call POST /api/checkout
5. Redirect to Stripe Checkout
6. User completes payment on Stripe
7. Redirect to success page
```

**Implementation**:
```html
<!-- docs/html/checkout.html -->
<form id="checkout-form">
  <h2>Checkout</h2>

  <fieldset>
    <legend>Your Information</legend>
    <input type="email" name="email" required placeholder="Email" />
    <input type="text" name="name" required placeholder="Full Name" />
  </fieldset>

  <div id="cart-summary">
    <!-- Cart items from cart.js -->
  </div>

  <button type="submit">Continue to Payment</button>
</form>
```

```javascript
// docs/js/checkout.js
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target.email.value;
  const name = e.target.name.value;
  const items = cart.items;

  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, items })
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
});
```

**Tests**:
```
[ ] Form validation works
[ ] POST /api/checkout succeeds
[ ] Stripe URL returned
[ ] Redirect to Stripe works
```

---

### 3.3 - Order Management (Backend)
**Status**: Pending | **Effort**: 8 hours | **Owner**: Backend Developer

**Creates**:
- `/vercel/functions/api/orders/[id].ts` - Get order details
- `/vercel/functions/api/orders/index.ts` - List customer orders

**GET /api/orders/:id**:
```typescript
// Fetch single order (requires email verification)
Request:
GET /api/orders/550e8400-e29b-41d4-a716-446655440000?email=buyer@example.com

Response:
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "confirmed",
  email: "buyer@example.com",
  name: "John Doe",
  total_amount_cents: 8500,
  items: [
    {
      artwork_id: 1,
      artwork_title: "Born of Burn",
      price_cents: 5000,
      quantity: 1
    }
  ],
  created_at: "2025-11-28T10:00:00Z",
  shipped_at: null
}

Validations:
[ ] Email parameter provided
[ ] Order belongs to email
[ ] Order exists
[ ] No sensitive payment data exposed
```

**GET /api/orders** (List orders):
```typescript
Request:
GET /api/orders?email=buyer@example.com

Response:
{
  data: [
    {
      id: "uuid-1",
      status: "confirmed",
      total: 8500,
      created_at: "2025-11-28T10:00:00Z"
    }
  ]
}
```

**POST /api/orders/:id/status** (Update order status - artist only):
```typescript
Request:
POST /api/orders/550e8400-e29b-41d4-a716-446655440000/status
Authorization: Bearer <artist-token>

Body:
{
  status: "shipped",
  tracking_number: "FEDEX123456"
}

Actions:
[ ] Validate artist token
[ ] Update order status in database
[ ] Send email to customer with tracking
[ ] Log event
```

---

### 3.4 - Email Notifications
**Status**: Pending | **Effort**: 6 hours | **Owner**: Backend Developer

**Creates**:
- `/lib/email/templates/order-confirmation.html`
- `/lib/email/templates/order-shipped.html`
- `/lib/email/send.js` - SendGrid integration

**Emails**:

**1. Order Confirmation** (Sent immediately after payment)
```html
Subject: Order Confirmation - Branchstone Art

Dear [Customer Name],

Thank you for your purchase! Here's your order summary:

Order ID: [ORDER_ID]
Date: [DATE]
Total: $[AMOUNT]

Items:
- [ARTWORK_TITLE] x [QTY] @ $[PRICE]

Your order is being prepared by the artist and will be shipped within 2 business days.

You can track your order here: [ORDER_TRACKING_URL]

Thank you for supporting Branchstone Art!
```

**2. Shipping Notification** (Sent when marked shipped)
```html
Subject: Your Branchstone Art order has shipped!

Dear [Customer Name],

Your artwork is on its way!

Tracking: [TRACKING_NUMBER]
Carrier: [FEDEX/UPS/USPS]

Track your package: [CARRIER_TRACKING_URL]

Expected delivery: [DATE]
```

**Implementation**:
```javascript
// lib/email/send.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOrderConfirmation(order) {
  const msg = {
    to: order.customer_email,
    from: 'orders@branchstone.com',
    subject: 'Order Confirmation - Branchstone Art',
    html: renderTemplate('order-confirmation', { order })
  };

  await sgMail.send(msg);
}

export async function sendShippingNotification(order) {
  const msg = {
    to: order.customer_email,
    from: 'orders@branchstone.com',
    subject: 'Your Branchstone Art order has shipped!',
    html: renderTemplate('order-shipped', { order })
  };

  await sgMail.send(msg);
}
```

**Webhook Integration**:
```javascript
// In stripe-webhook.ts, after payment_intent.succeeded:
if (webhookEvent.type === 'payment_intent.succeeded') {
  const order = await fetchOrder(webhookEvent.data.object.id);
  await sendOrderConfirmation(order);
  await notifyArtist(order);
}
```

---

### 3.5 - Newsletter Subscription
**Status**: Pending | **Effort**: 4 hours | **Owner**: Backend Developer

**Creates**:
- `/vercel/functions/api/newsletter/subscribe.ts`
- `/vercel/functions/api/newsletter/unsubscribe.ts`
- `/docs/html/newsletter.html` - Newsletter signup section

**POST /api/newsletter/subscribe**:
```typescript
Request:
{
  email: "subscriber@example.com",
  name: "Jane Doe"
}

Response:
{
  success: true,
  message: "Check your email to confirm subscription"
}

Actions:
[ ] Validate email format
[ ] Check not already subscribed
[ ] Add to Supabase newsletter table
[ ] Send confirmation email with unsubscribe link
[ ] Log event
```

**POST /api/newsletter/unsubscribe**:
```typescript
Request:
{
  email: "subscriber@example.com"
}

Response:
{
  success: true,
  message: "Unsubscribed successfully"
}

Actions:
[ ] Mark as unsubscribed (don't delete)
[ ] Send unsubscribe confirmation
```

**Frontend**:
```html
<form id="newsletter-form">
  <input type="email" placeholder="Enter your email" required />
  <button type="submit">Subscribe</button>
</form>
```

```javascript
document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: e.target.email.value })
  });

  if (response.ok) {
    alert('Check your email to confirm subscription!');
    e.target.reset();
  }
});
```

---

### 3.6 - Analytics Tracking
**Status**: Pending | **Effort**: 5 hours | **Owner**: Backend Developer

**Events to Track**:
```
[ ] page_view - User visits page
[ ] artwork_viewed - User views artwork detail
[ ] add_to_cart - User adds item to cart
[ ] checkout_started - User starts checkout
[ ] purchase_completed - Payment successful
[ ] purchase_failed - Payment failed
[ ] newsletter_subscribed - User subscribes
```

**Frontend Integration**:
```javascript
// docs/js/analytics.js
export function trackEvent(eventType, metadata = {}) {
  const sessionId = getOrCreateSessionId();

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      session_id: sessionId,
      metadata,
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.error('Analytics error:', err));
}

// Usage:
trackEvent('page_view', { page: '/gallery' });
trackEvent('artwork_viewed', { artwork_id: 1 });
trackEvent('add_to_cart', { artwork_id: 1, price: 5000 });
```

**Backend Storage**:
```javascript
// POST /api/analytics
export default async (req, res) => {
  const { event_type, session_id, metadata } = req.body;

  await supabase
    .from('analytics_events')
    .insert([{
      event_type,
      session_id,
      metadata,
      created_at: new Date().toISOString()
    }]);

  res.json({ success: true });
};
```

**Reporting** (Later):
```sql
-- Top viewed artworks
SELECT artwork_id, COUNT(*) as views
FROM analytics_events
WHERE event_type = 'artwork_viewed'
GROUP BY artwork_id
ORDER BY views DESC;

-- Conversion rate
SELECT
  (COUNT(CASE WHEN event_type = 'purchase_completed' THEN 1 END)::float /
   COUNT(CASE WHEN event_type = 'checkout_started' THEN 1 END)) as conversion_rate
FROM analytics_events;
```

---

## Phase 4: Testing, Optimization & Launch (Weeks 7-8)

### Goal
Comprehensive testing, performance optimization, security review, production launch.

### Effort: 40 hours

### 4.1 - Automated Testing
**Status**: Pending | **Effort**: 8 hours | **Owner**: QA Automation

**Test Coverage**:
```
[ ] Unit tests (functions, utilities)
[ ] Integration tests (API endpoints with database)
[ ] E2E tests (checkout flow, payment)
[ ] Security tests (SQL injection, CSRF, XSS)
[ ] Load tests (simulate 100 concurrent users)
```

**Test Structure**:
```
/tests
├── unit/
│   ├── cart.test.js
│   ├── email.test.js
│   └── analytics.test.js
├── integration/
│   ├── api.artworks.test.js
│   ├── api.checkout.test.js
│   └── api.stripe.test.js
├── e2e/
│   ├── checkout.flow.test.js
│   └── payment.flow.test.js
└── security/
    ├── injection.test.js
    └── auth.test.js
```

**Example: Checkout API Test**
```javascript
// tests/integration/api.checkout.test.js
describe('POST /api/checkout', () => {
  it('creates checkout session with valid cart', async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: 1, price: 5000 }],
        email: 'test@example.com',
        name: 'Test User'
      })
    });

    expect(response.status).toBe(200);
    expect(response.json.url).toContain('checkout.stripe.com');
  });

  it('rejects invalid email', async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        items: []
      })
    });

    expect(response.status).toBe(400);
  });

  it('detects price mismatch', async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: 1, price: 1000 }], // Actual price is 5000
        email: 'test@example.com'
      })
    });

    expect(response.status).toBe(409);
  });
});
```

---

### 4.2 - Performance Testing & Optimization
**Status**: Pending | **Effort**: 6 hours | **Owner**: Backend Developer

**Benchmarks** (Target):
```
API Response Times:
[ ] /api/artworks: < 300ms (cached)
[ ] /api/checkout: < 500ms
[ ] /api/health: < 200ms

Frontend:
[ ] First Contentful Paint: < 2s
[ ] Largest Contentful Paint: < 3s
[ ] Cumulative Layout Shift: < 0.1

Database:
[ ] Query response: < 50ms (indexed)
[ ] Stripe webhook: < 1s
```

**Optimization Checklist**:
```
Backend:
[ ] Database indexes verified
[ ] API responses gzipped
[ ] Caching strategy implemented (Redis)
[ ] Unused dependencies removed
[ ] Code bundled and minified

Frontend:
[ ] Images optimized (WebP, AVIF)
[ ] CSS minified and split
[ ] JavaScript code-split
[ ] Unused CSS removed (PurgeCSS)
[ ] Fonts subset to used characters
[ ] Service Worker caching

Infrastructure:
[ ] CDN caching headers set
[ ] Vercel auto-scaling configured
[ ] Database connections pooled
[ ] Monitoring and alerting enabled
```

**Testing Tools**:
```
[ ] Lighthouse CI (automated performance testing)
[ ] WebPageTest (detailed performance analysis)
[ ] k6 (load testing)
[ ] New Relic (APM monitoring)
```

---

### 4.3 - Security Hardening & Review
**Status**: Pending | **Effort**: 8 hours | **Owner**: Security Engineer

**Security Checklist**:
```
Authentication:
[ ] API keys never logged
[ ] JWT secrets in environment variables
[ ] Rate limiting working
[ ] CORS properly configured

Data Protection:
[ ] No credit card data stored
[ ] Passwords hashed (Argon2)
[ ] PII encrypted at rest (Supabase)
[ ] Database backups encrypted
[ ] HTTPS enforced everywhere

Dependency Security:
[ ] npm audit passes
[ ] OWASP Top 10 reviewed
[ ] Dependabot enabled
[ ] Supply chain attacks assessed
[ ] Vulnerabilities patched immediately

API Security:
[ ] Input validation on all endpoints
[ ] SQL injection prevented (parameterized queries)
[ ] XSS prevented (output encoding)
[ ] CSRF tokens on state-changing operations
[ ] Webhook signatures validated

Infrastructure:
[ ] Security headers set (CSP, HSTS, X-Frame-Options)
[ ] DDoS protection (Cloudflare)
[ ] WAF rules configured
[ ] Secrets not in GitHub history
[ ] .env.local in .gitignore
```

**Security Audit**:
```bash
[ ] npm audit
[ ] OWASP ZAP scan
[ ] Snyk vulnerability scan
[ ] Manual code review (security focus)
[ ] Penetration testing (payment flow)
[ ] Compliance check (PCI, GDPR)
```

---

### 4.4 - Documentation & Runbooks
**Status**: Pending | **Effort**: 6 hours | **Owner**: Technical Writer

**Creates**:
- `/docs/DEPLOYMENT.md` - Production deployment guide
- `/docs/RUNBOOKS.md` - Operational procedures
- `/docs/INCIDENTS.md` - Incident response procedures
- `/docs/API.md` - API documentation (OpenAPI)

**DEPLOYMENT.md**:
```
Contents:
[ ] Prerequisites
[ ] Environment setup
[ ] Database migrations
[ ] Deployment process
[ ] Verification checklist
[ ] Rollback procedure
[ ] Monitoring setup
```

**RUNBOOKS.md**:
```
Common Operational Tasks:
[ ] Add new artwork to CMS
[ ] Update artwork price
[ ] Process failed payment
[ ] Check order status
[ ] View analytics
[ ] Scale infrastructure
[ ] Clear cache
[ ] Update security settings
```

**INCIDENTS.md**:
```
Incident Response:
[ ] Payment processing down
[ ] Database connection lost
[ ] Stripe API errors
[ ] Email delivery failed
[ ] DDoS attack
[ ] Data breach suspicion
```

---

### 4.5 - User Acceptance Testing (UAT)
**Status**: Pending | **Effort**: 4 hours | **Owner**: QA

**Test Cases**:
```
1. Browse Gallery
   [ ] View all artworks
   [ ] Filter by category
   [ ] View artwork detail
   [ ] See high-quality images
   [ ] Mobile responsive

2. Shopping Cart
   [ ] Add item to cart
   [ ] Update quantity
   [ ] Remove item
   [ ] View cart total
   [ ] Cart persists on refresh

3. Checkout
   [ ] Enter customer info
   [ ] Proceed to Stripe
   [ ] Complete payment (test card)
   [ ] Receive confirmation email
   [ ] Order appears in order history

4. Email Notifications
   [ ] Order confirmation received
   [ ] Email formatting correct
   [ ] Links work properly
   [ ] Unsubscribe works

5. Newsletter
   [ ] Subscribe with email
   [ ] Receive confirmation
   [ ] Unsubscribe works

6. Admin Features (Artist)
   [ ] Update artwork in Sanity
   [ ] Changes appear on site
   [ ] View orders
   [ ] Mark orders shipped
   [ ] Generate reports
```

---

### 4.6 - Production Deployment Checklist
**Status**: Pending | **Effort**: 2 hours | **Owner**: DevOps

**Pre-Launch**:
```
[ ] All tests passing (unit, integration, e2e)
[ ] Security audit complete
[ ] Performance benchmarks met
[ ] Documentation complete
[ ] Monitoring and alerts configured
[ ] Backup strategy verified
[ ] Rollback plan documented
[ ] Team trained on procedures
[ ] Incident response plan ready
```

**Deployment**:
```
[ ] Environment variables in Vercel
[ ] Database migrations applied
[ ] Cache cleared
[ ] CDN cache invalidated
[ ] SSL certificate verified
[ ] DNS records updated (if applicable)
[ ] Stripe live keys configured
[ ] Email templates tested
[ ] Webhooks tested
```

**Post-Launch**:
```
[ ] Monitor error rates (24 hours)
[ ] Check payment processing
[ ] Verify email delivery
[ ] Monitor performance metrics
[ ] Check database performance
[ ] Verify backups working
[ ] Confirm alerts firing correctly
```

---

### 4.7 - Training & Documentation
**Status**: Pending | **Effort**: 4 hours | **Owner**: Technical Writer

**Artist Training**:
```
[ ] How to add new artwork in Sanity
[ ] How to update prices
[ ] How to view orders
[ ] How to mark orders shipped
[ ] How to view analytics
[ ] How to manage newsletter subscribers
[ ] Support contacts and procedures
```

**Support Documents**:
```
[ ] FAQ for common issues
[ ] Troubleshooting guide
[ ] Contact form for technical support
[ ] Regular check-in schedule
[ ] Update procedures
```

---

## Success Metrics (Post-Launch)

### Functional
- All API endpoints operational
- Database queries < 50ms (p95)
- Email delivery > 95%
- Stripe integration 100% functional
- No data loss

### Performance
- API response time: < 500ms (p95)
- Frontend load time: < 3s (LCP)
- Database connections: < 10ms (p99)
- CDN cache hit rate: > 80%

### Business
- Checkout completion rate: > 70%
- Payment success rate: > 99%
- Order fulfillment: < 48 hours
- Customer satisfaction: > 4.5/5

### Operational
- Uptime: 99.9%+
- Error rate: < 0.1%
- Mean time to recovery: < 15 minutes
- Deployment frequency: 1-2 per week

---

## Timeline Summary

```
Week 1-2: Phase 1 (Backend Infrastructure)
├─ Setup Vercel, Supabase, Stripe
├─ Implement core API endpoints
├─ Setup error tracking & CI/CD
└─ Deliverable: Functional payment processing

Week 3-4: Phase 2 (CMS & Content)
├─ Setup Sanity CMS
├─ Define content models
├─ Migrate artworks
├─ Update frontend
└─ Deliverable: Artist-friendly CMS

Week 5-6: Phase 3 (E-Commerce)
├─ Shopping cart system
├─ Order management
├─ Email notifications
├─ Newsletter & analytics
└─ Deliverable: Complete e-commerce system

Week 7-8: Phase 4 (Testing & Launch)
├─ Automated testing
├─ Security hardening
├─ Performance optimization
├─ UAT & documentation
├─ Production deployment
└─ Deliverable: Production-ready system

Total: 8 weeks (160 hours for 1 developer)
Teams: 2-3 developers can parallelize to 6 weeks
```

---

## Cost Timeline

```
Week 1-2: $20 (Vercel) + $0 (Supabase free) = $20
Week 3-4: $20 + $0-15 (Sanity) = $35
Week 5-6: $20 + $15 + Stripe fees on sales = $35+
Week 7-8: $20 + $15 + SendGrid ($0-30) = $65+

Ongoing Monthly: $55-100 + Stripe fees (2.9% + $0.30)
```

---

## Next Steps

1. Review decision points in architecture document
2. Create required cloud accounts (Vercel, Sanity, Supabase)
3. Start Phase 1 implementation
4. Hold weekly progress meetings
5. Monitor KPIs and performance

---

## Related Documents

- **BACKEND-ARCHITECTURE-001-strategy.md** - Architecture strategy and design
- **ADR-BACKEND-001.md** - Architecture decision record
- **API-DOCUMENTATION.md** - OpenAPI specification (in progress)
- **DATABASE-SCHEMA.md** - Complete SQL schema (in progress)

