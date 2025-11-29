# Backend Architecture Strategy for Branchstone Art Portfolio
**Status**: Design Document | **Date**: November 28, 2025
**Decision**: Hybrid Static + Serverless Backend (Recommended)

---

## Executive Summary

Branchstone is currently a 100% static portfolio on GitHub Pages. To support future e-commerce, CMS, and dynamic features, I recommend a **Hybrid Architecture** combining:

1. **Static Frontend** (GitHub Pages) - no change to current setup
2. **Serverless Backend** (Vercel Functions) - for dynamic features
3. **Headless CMS** (Sanity) - artist-friendly content management
4. **Stripe Integration** - PCI-compliant payment processing
5. **Database** (Supabase PostgreSQL) - orders, analytics, subscriptions

**Total Setup Cost**: ~$500 (one-time)
**Total Monthly Cost**: ~$50-80 (after first year)
**Time to MVP**: 6-8 weeks
**Complexity**: Low-to-Medium (artist can manage CMS, developer maintains API)

---

## Architecture Decision Matrix

| Criteria | Static Only | Serverless | Headless CMS | Full Backend | Hybrid (Rec) |
|----------|-----------|-----------|--------------|--------------|--------------|
| **Cost** | $0-15/mo | $15-50/mo | $0-15/mo | $50-150/mo | $50-80/mo |
| **Time to MVP** | 1 week | 4 weeks | 2 weeks | 8+ weeks | 6 weeks |
| **CMS Complexity** | Manual JSON edits | Manual JSON edits | Artist-friendly UI | ✅ Varies | ✅ Simple |
| **E-commerce** | Limited (Gumroad) | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Inventory Mgmt** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Order Management** | ❌ No | ✅ Yes | ⚠️ Limited | ✅ Yes | ✅ Yes |
| **Analytics** | ❌ Basic | ✅ Full | ⚠️ Limited | ✅ Full | ✅ Full |
| **Newsletter** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Scalability** | ⚠️ Limited | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Excellent |
| **Maintenance** | Minimal | Low | Low | Medium | Low |
| **Vendor Lock-in** | None | Medium (Vercel) | Medium (Sanity) | Low | Medium |

**Winner: HYBRID** - Best balance of cost, features, simplicity, and time-to-market.

---

## Recommendation: Hybrid Architecture

### Why NOT the Other Options

#### Option A: Stay 100% Static
**Pros**: Zero cost, zero maintenance
**Cons**:
- No shopping cart persistence (user loses items on page refresh)
- No order history or customer accounts
- No inventory management (artist can't update availability)
- Contact form emails not integrated
- No newsletter management
- No analytics beyond Google Analytics

**Verdict**: Limits future growth, poor UX for customers.

#### Option B: Serverless Only
**Pros**: Fast to deploy, cheap, scales automatically
**Cons**:
- Still need to manage JSON files for artwork data
- Artist can't update content via UI
- No structured content modeling
- Difficult to add features like testimonials, press, collections

**Verdict**: Works but requires developer intervention for every content change.

#### Option C: Headless CMS Only
**Pros**: Artist-friendly content management, great for content modeling
**Cons**:
- Still need backend for payment processing
- Stripe webhooks require a backend to handle
- Order management is clunky
- Analytics require custom implementation

**Verdict**: Missing critical backend piece for e-commerce.

#### Option D: Full Backend (Node.js/Python + PostgreSQL)
**Pros**: Maximum flexibility, full control
**Cons**:
- $50-150/month hosting costs
- Requires ongoing maintenance (updates, security patches, monitoring)
- Overkill for this project's needs
- More complex deployment pipeline
- 8+ weeks to MVP

**Verdict**: Over-engineered for artist portfolio with modest traffic/orders.

### Why HYBRID is Best

**Sweet spot**: Combines simplicity of serverless with content management of headless CMS.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Pages (Static)                   │
│                  Vue.js Frontend (No Backend)               │
└────────────────────┬────────────────────────────────────────┘
                     │ API Calls
         ┌───────────┴──────────────┐
         │                          │
    ┌────▼────────┐        ┌─────────▼──────┐
    │ Vercel Func │        │  Stripe API    │
    │ (Backend)   │        │ (Payments)     │
    └────┬────────┘        └────────────────┘
         │
    ┌────▼──────────────┬──────────────┐
    │                   │              │
┌───▼─────┐      ┌──────▼──┐    ┌─────▼──────┐
│ Supabase│      │ Sanity  │    │ SendGrid   │
│PostgreSQL       │ Headless│    │ (Email)    │
│ (Data)  │      │ CMS     │    │ (Optional) │
└─────────┘      └─────────┘    └────────────┘
```

**Benefits**:
1. **Cost-Effective**: ~$50-80/month vs $150+/month for full backend
2. **Low Maintenance**: Managed services (Vercel, Supabase, Sanity)
3. **Artist-Friendly**: Sanity provides beautiful UI for content management
4. **Scalable**: Serverless auto-scales on traffic spikes
5. **Fast MVP**: 6-8 weeks vs 12+ weeks for full backend
6. **Security**: Stripe handles PCI compliance, Supabase handles data encryption

---

## Technology Stack Recommendation

### Frontend (No Change)
- **Platform**: GitHub Pages (free, 99.9% uptime, automatic HTTPS)
- **Framework**: Vanilla JavaScript + Vue.js
- **Build**: Static HTML, CSS, JS
- **CDN**: Cloudflare (included with GitHub Pages)

### Backend
- **Runtime**: Vercel Functions (serverless Node.js)
- **Language**: Node.js + Express (lightweight)
- **Authentication**: JWT + API keys
- **Hosting**: Vercel (free tier includes 100 GB bandwidth, auto-scaling)

### Content Management
- **CMS**: Sanity (headless CMS)
- **Plan**: Starter ($0-15/month)
- **Content Models**: Artworks, Collections, Testimonials, Press, Blog
- **Media**: Integrated image CDN with Sanity

### Database
- **Database**: Supabase PostgreSQL (managed)
- **Plan**: Free tier (500 MB) → Pro tier ($25/month at scale)
- **Tables**: orders, order_items, customers, analytics_events, newsletter_subscribers
- **Real-time**: Supabase provides WebSocket subscriptions (optional for future)

### Payments
- **Provider**: Stripe
- **Plan**: Free (2.9% + $0.30 per transaction)
- **Features**: Checkout Sessions, Webhooks, Invoice Management, Subscription Support
- **PCI Compliance**: Stripe handles all compliance

### Email
- **Provider**: SendGrid (optional, free tier: 100 emails/day)
- **Use**: Order confirmations, shipping notifications, newsletter
- **Alternative**: Use Stripe for transactional emails (free)

### Analytics
- **Provider**: Plausible Analytics (privacy-first, $9/month)
- **Alternative**: Keep existing Google Analytics (free)
- **Data**: Page views, conversions, popular artworks, customer behavior

---

## E-Commerce Backend Design

### 1. Shopping Cart

#### Strategy: Client-Side + Session-Based
```javascript
// Cart stored in localStorage (client-side)
// Synced to server on checkout

const cart = {
  items: [
    { id: 1, title: "Born of Burn", price: 5000, quantity: 1 },
    { id: 5, title: "Fire Dance", price: 3500, quantity: 1 }
  ],
  total: 8500,
  lastUpdated: 1234567890
}
```

**Why client-side?**
- Most users don't revisit (cart timeout not critical)
- Simpler architecture
- No session management overhead
- Can upgrade to persistent carts later

**Server validates on checkout**:
```javascript
// POST /api/checkout
// 1. Validate cart items exist in Sanity
// 2. Validate prices haven't changed
// 3. Check availability in Supabase
// 4. Create Stripe session
// 5. Store order with "pending" status
```

### 2. Checkout Flow

#### Stripe Hosted Checkout (Recommended)
```
User clicks "Buy"
  ↓
POST /api/checkout
  ├─ Validate cart
  ├─ Create Stripe Checkout Session
  ├─ Store order (status: "pending")
  └─ Return checkout URL
  ↓
User redirected to Stripe Checkout
  ↓
Stripe Webhook: payment_intent.succeeded
  ├─ Update order status → "confirmed"
  ├─ Send confirmation email
  ├─ Trigger shipping workflow
  └─ Analytics event
```

**Benefits of Hosted Checkout**:
- PCI compliance handled by Stripe
- Fewer customer disputes
- Better conversion rates
- Mobile-optimized

### 3. Order Management

#### Database Schema (Supabase)
```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  status VARCHAR(50), -- pending, confirmed, shipped, completed, cancelled
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  shipped_at TIMESTAMP,
  notes TEXT
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  artwork_id INTEGER NOT NULL,
  artwork_title VARCHAR(255),
  price_cents INTEGER,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50), -- page_view, artwork_viewed, add_to_cart, checkout_started, purchase
  artwork_id INTEGER,
  customer_id VARCHAR(255),
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  consent_given BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);
```

#### Order Status Lifecycle
```
pending (payment processing)
  ↓
confirmed (payment succeeded)
  ↓
shipped (artist notified, ready to send)
  ↓
completed (shipped, awaiting feedback)
  ↓
[cancelled] (if payment failed or customer requests)
```

### 4. Inventory Management

#### Strategy: Sanity + Database Sync
```javascript
// In Sanity, each artwork has:
{
  id: 1,
  title: "Born of Burn",
  price: 5000,
  available: true,
  stock: null, // unlimited unless limited edition
  description: "...",
  images: [...]
}

// Check availability before checkout:
// 1. Fetch from Supabase inventory table
// 2. If not found, fallback to Sanity "available" field
// 3. Block checkout if unavailable
```

**Future Enhancement**: Add limited edition tracking
```sql
CREATE TABLE inventory (
  artwork_id INTEGER PRIMARY KEY,
  total_quantity INTEGER,
  sold_quantity INTEGER,
  available BOOLEAN
);
```

### 5. Email Notifications

#### Strategy: SendGrid + Vercel Functions

**Workflow**:
```
Stripe webhook → Vercel Function
  ├─ Parse payment_intent.succeeded
  ├─ Fetch order details from Supabase
  ├─ Send confirmation email via SendGrid
  ├─ Send notification email to artist
  └─ Update order status
```

**Emails to Send**:
1. **Order Confirmation** (Customer) - Sent immediately after payment
2. **Artist Notification** (Artist) - New order details
3. **Shipping Confirmation** (Customer) - When artist marks "shipped"
4. **Newsletter Welcome** (Subscriber) - When subscribing
5. **Newsletter Unsubscribe Confirmation** (Subscriber)

### 6. Payment Security & PCI Compliance

#### What Stripe Handles
- ✅ PCI Level 1 compliance
- ✅ Payment data encryption
- ✅ Fraud detection
- ✅ Chargeback protection
- ✅ 3D Secure support (for risky transactions)

#### What You Must Ensure
- ✅ Never log or store credit card data
- ✅ Use Stripe's pre-built UI (Stripe.js, Hosted Checkout)
- ✅ Validate amounts server-side before charging
- ✅ Store only Stripe payment intent IDs, not tokens
- ✅ Require HTTPS (GitHub Pages provides this)

#### Implementation
```javascript
// Vercel Function: POST /api/checkout
export default async (req, res) => {
  const { items, email, name } = req.body;

  // 1. Validate items
  let total = 0;
  for (const item of items) {
    const artwork = await sanityClient.fetch(`*[_id == "${item.id}"]`);
    if (!artwork || artwork.price !== item.price) {
      return res.status(400).json({ error: "Item price mismatch" });
    }
    total += artwork.price * item.quantity;
  }

  // 2. Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.title },
        unit_amount: item.price
      },
      quantity: item.quantity
    })),
    mode: "payment",
    success_url: "https://branchstone.com/order-success?session={CHECKOUT_SESSION_ID}",
    cancel_url: "https://branchstone.com/order-cancel",
    customer_email: email
  });

  // 3. Store order in Supabase
  await supabase
    .from("orders")
    .insert([{
      customer_email: email,
      customer_name: name,
      total_amount_cents: total,
      status: "pending",
      stripe_payment_intent_id: session.payment_intent
    }]);

  res.json({ url: session.url });
};
```

---

## CMS Strategy: Sanity

### Why Sanity?
1. **Artist-Friendly**: Intuitive UI, no coding required
2. **Flexible**: Custom content models for different needs
3. **Affordable**: Free for small projects ($0-15/month at scale)
4. **Developer-Friendly**: GraphQL API, real-time updates
5. **Structured Data**: Better SEO, easier to query

### Content Models

#### Artwork
```javascript
{
  _id: "1",
  title: string,
  description: text,
  category: select(fire, water, earth, air, mixed),
  size: string, // "24x36 in"
  materials: string, // "Mixed media on canvas"
  price: number, // in cents
  available: boolean,
  images: [image],
  createdDate: date,
  featured: boolean
}
```

#### Collection
```javascript
{
  _id: "fire-series",
  name: string,
  description: text,
  artworks: [reference to Artwork],
  coverImage: image,
  featured: boolean
}
```

#### Testimonial
```javascript
{
  _id: "testimonial-1",
  authorName: string,
  authorRole: string, // "Collector", "Gallery Owner"
  quote: text,
  image: image, // optional
  featured: boolean
}
```

#### Press / News
```javascript
{
  _id: "press-1",
  title: string,
  publication: string,
  url: url,
  excerpt: text,
  publishedDate: date,
  featured: boolean
}
```

#### Commission Request
```javascript
{
  _id: "commission-1",
  clientName: string,
  clientEmail: string,
  description: text,
  reference_images: [image],
  budget: string,
  timeline: string,
  status: select(new, contacted, in_progress, completed),
  createdDate: date,
  notes: text
}
```

### Sanity + Vercel Sync

**Workflow**:
```
Artist updates content in Sanity
  ↓
Sanity webhook → Vercel Function
  ├─ Fetch updated content
  ├─ Cache in Supabase (optional)
  └─ Trigger CDN invalidation
  ↓
Frontend fetches from Sanity API
  ├─ Fallback to cache if API slow
  └─ Display updated content
```

### Content Publishing Workflow
```
Artist creates draft in Sanity
  ↓
Review: "Does it look good?"
  ↓
Artist publishes (visible on site)
  ↓
[Optional] Unpublish anytime to hide
```

---

## Database Architecture

### Supabase PostgreSQL

#### Benefits
- **Managed**: Automatic backups, updates, monitoring
- **Real-time**: WebSocket subscriptions (future feature)
- **Secure**: Row-level security policies
- **Affordable**: Free for <500MB, $25/month for larger databases
- **Excellent DX**: Built-in auth, REST API, GraphQL

#### Schema (Complete)
```sql
-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  shipped_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  artwork_id INTEGER NOT NULL,
  artwork_title VARCHAR(255),
  price_cents INTEGER,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50),
  artwork_id INTEGER,
  customer_email VARCHAR(255),
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  consent_given BOOLEAN DEFAULT true,
  unsubscribed BOOLEAN DEFAULT false,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_analytics_artwork_id ON analytics_events(artwork_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
```

#### Row-Level Security (RLS)

**Policy: Customers can only see their own orders**
```sql
CREATE POLICY "Customers see own orders"
  ON orders
  FOR SELECT
  USING (customer_email = current_setting('request.jwt.claims')::json->>'email');
```

**Policy: Public can read newsletter subscription status (optional)**
```sql
CREATE POLICY "Check subscription status"
  ON newsletter_subscribers
  FOR SELECT
  USING (true);
```

---

## API Design

### Overview
```
Frontend (GitHub Pages)
    ↓
Vercel Functions (Backend)
    ├─ /api/artworks         → Fetch from Sanity
    ├─ /api/checkout         → Create Stripe session
    ├─ /api/orders/:id       → Get order details
    ├─ /api/analytics        → Track events
    ├─ /api/newsletter       → Subscribe/unsubscribe
    └─ /api/health           → Monitor API health
```

### REST Endpoints

#### GET /api/artworks
```javascript
// Fetch all artworks from Sanity
GET https://api.vercel.com/artworks

Response: [
  {
    id: 1,
    title: "Born of Burn",
    price: 5000,
    image: "...",
    available: true
  }
]
```

#### POST /api/checkout
```javascript
// Create Stripe checkout session
POST https://api.vercel.com/checkout

Body: {
  items: [
    { id: 1, title: "Born of Burn", price: 5000, quantity: 1 }
  ],
  email: "buyer@example.com",
  name: "John Doe"
}

Response: {
  url: "https://checkout.stripe.com/pay/cs_live_xyz",
  sessionId: "cs_live_xyz"
}
```

#### POST /api/stripe-webhook
```javascript
// Handle Stripe events (payment_intent.succeeded, etc)
POST https://api.vercel.com/stripe-webhook

Headers: {
  "stripe-signature": "t=1234567890,v1=xxx"
}

// Stripe webhook types to handle:
// - payment_intent.succeeded → Order confirmed
// - payment_intent.payment_failed → Order failed
// - charge.dispute.created → Chargeback
```

#### GET /api/orders/:id
```javascript
// Fetch order details (requires auth)
GET https://api.vercel.com/orders/550e8400-e29b-41d4-a716-446655440000

Response: {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "confirmed",
  total_amount_cents: 8500,
  items: [{ ... }],
  created_at: "2025-11-28T10:00:00Z"
}
```

#### POST /api/analytics
```javascript
// Track user events (page views, add to cart, etc)
POST https://api.vercel.com/analytics

Body: {
  event_type: "artwork_viewed",
  artwork_id: 1,
  session_id: "xyz123"
}

Response: { success: true }
```

#### POST /api/newsletter/subscribe
```javascript
POST https://api.vercel.com/newsletter/subscribe

Body: {
  email: "subscriber@example.com",
  name: "Jane Doe"
}

Response: {
  success: true,
  message: "Subscribed! Check your email."
}
```

#### POST /api/newsletter/unsubscribe
```javascript
POST https://api.vercel.com/newsletter/unsubscribe

Body: {
  email: "subscriber@example.com",
  token: "unsubscribe_token_xyz"
}

Response: {
  success: true,
  message: "Unsubscribed successfully."
}
```

#### GET /api/health
```javascript
// Monitor API and dependencies
GET https://api.vercel.com/health

Response: {
  status: "healthy",
  timestamp: "2025-11-28T10:00:00Z",
  checks: {
    stripe: "ok",
    supabase: "ok",
    sanity: "ok"
  }
}
```

### Authentication Strategy

**Option 1: Public API with Rate Limiting** (Recommended for MVP)
```javascript
// No API keys required
// Rate limit by IP: 60 requests/minute
// Stripe webhook signed with webhook secret

Benefits:
- No user auth complexity
- Easier to build MVP
- CORS-friendly for frontend
- Can upgrade to API keys later
```

**Option 2: API Keys (Future)**
```javascript
// Frontend includes API key in requests
// Backend validates key
// Rate limit by key

Benefits:
- Better tracking of API usage
- Can disable individual keys
- Better security for sensitive endpoints
```

### Error Handling

```javascript
// Consistent error responses
{
  error: {
    code: "STRIPE_ERROR",
    message: "Payment failed. Please try again.",
    details: "card_declined" // Only for debugging
  }
}

Status codes:
- 200 OK → Success
- 400 Bad Request → Validation error
- 401 Unauthorized → Auth failed
- 404 Not Found → Resource not found
- 409 Conflict → Item not available
- 429 Too Many Requests → Rate limited
- 500 Internal Server Error → Server error
```

### Caching Strategy

**Frontend Cache (Browser)**:
```javascript
// Cache artworks list for 1 hour
fetch("/api/artworks", { cache: "force-cache" })

// Don't cache sensitive endpoints
fetch("/api/orders/123", { cache: "no-store" })
```

**Server Cache (Redis via Vercel KV)**:
```javascript
// Cache Sanity queries for 5 minutes
const cacheKey = "artworks:list";
const cached = await redis.get(cacheKey);
if (cached) return cached;

const artworks = await sanityClient.fetch("*[_type == 'artwork']");
await redis.set(cacheKey, JSON.stringify(artworks), { ex: 300 });
return artworks;
```

---

## Security Considerations

### 1. Data Protection
- ✅ All data in transit encrypted with HTTPS
- ✅ Supabase encrypts data at rest
- ✅ No credit card data stored (Stripe handles this)
- ✅ API keys in environment variables (never in code)

### 2. API Security
- ✅ Rate limiting: 60 req/min per IP
- ✅ Input validation on all endpoints
- ✅ CSRF tokens for state-changing operations
- ✅ CORS: Allow only branchstone.com domain

### 3. Authentication
- ✅ Stripe webhooks signed with secret
- ✅ Customer orders accessed by email verification
- ✅ Artist dashboard (future) protected with JWT

### 4. Deployment Security
- ✅ Secrets in environment variables (GitHub Secrets)
- ✅ No secrets in git commits
- ✅ Automated security scanning (Dependabot)
- ✅ HTTPS enforced (Vercel provides this)

### 5. PCI Compliance
- ✅ Using Stripe Hosted Checkout (offload liability)
- ✅ No payment data in Supabase
- ✅ Never logging sensitive data
- ✅ Annual PCI audit (for Stripe merchants)

### Implementation Checklist
```
[ ] Add HTTPS to frontend (GitHub Pages provides)
[ ] Setup environment variables in Vercel
[ ] Add Stripe webhook signing validation
[ ] Add CORS headers to Vercel Functions
[ ] Add rate limiting middleware
[ ] Setup input validation (Zod or similar)
[ ] Add Sentry error tracking
[ ] Enable GitHub Advanced Security
[ ] Setup quarterly security reviews
[ ] Document security procedures in runbooks
```

---

## Cost Analysis

### One-Time Setup Costs
| Item | Cost |
|------|------|
| Stripe account setup | Free |
| Sanity project setup | Free |
| Supabase project setup | Free |
| Vercel project setup | Free |
| Domain (if not using branchstone.com) | $10-15/year |
| SSL certificate | Free (GitHub Pages) |
| **Total One-Time** | **~$0** |

### Monthly Operating Costs (Year 1)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro | $20 | Includes 100 concurrent functions |
| **Supabase** | Free-Pro | $0-25 | Free tier up to 500MB; grows to Pro at scale |
| **Sanity** | Starter | $0-15 | Free tier + pay-as-you-grow |
| **GitHub Pages** | Public | $0 | Included in GitHub free tier |
| **Stripe** | Per-transaction | 2.9% + $0.30 | Only pay on sales |
| **SendGrid** | Free-Pro | $0-30 | Free tier: 100 emails/day; Pro tier: $30/mo for unlimited |
| **Plausible Analytics** | Starter | $0 | Optional; Google Analytics is free |
| **Domain** | .com | $1/month | Paid annually, ~$12/year |
| **SSL** | Auto | $0 | GitHub Pages provides free |
| **Cloudflare** | Free | $0 | Included with GitHub Pages |
| **Total Hosting** | | **$20-90/month** | Excludes payment processing fees |

### Monthly Operating Costs (Year 2+)
| Service | Cost |
|---------|------|
| Vercel Functions | $20 |
| Supabase | $25 (Pro tier) |
| Sanity | $15 |
| SendGrid | $0-30 |
| Stripe fees (on sales) | 2.9% + $0.30 per transaction |
| Domain | $1/month |
| **Total** | **$61-91/month** + Stripe fees |

### Revenue Analysis (Break-Even)

Assuming average artwork price: $2,500 (25,000 cents)
Stripe fee per sale: 2.9% + $0.30 = ~$725 per $2,500 sale

**Break-even: 2-3 sales per month**

If selling 5 artworks/month @ $2,500 each:
- Revenue: $12,500
- Stripe fees: ~$362.50
- Hosting fees: ~$80
- Profit: ~$12,057.50/month

### Cost Comparison

| Approach | Setup | Monthly | Notes |
|----------|-------|---------|-------|
| **Current (Static)** | $0 | $0 | No e-commerce, no CMS |
| **Stay Static + Gumroad** | $0 | $0 | Limited functionality, artist dependent |
| **Hybrid (Recommended)** | $0 | $50-90 | Full e-commerce, CMS, analytics |
| **Serverless Only** | $500 | $15-40 | Missing content management |
| **Headless CMS Only** | $500 | $15-30 | Missing e-commerce backend |
| **Full Backend** | $2,000 | $100-200 | Over-engineered for needs |

---

## Migration Path: Static → Dynamic

### Phase 0: Current State (GitHub Pages)
- ✅ Static site
- ✅ JSON data files
- ✅ Contact form (Formspree)
- ❌ No e-commerce
- ❌ No CMS

### Phase 1: Add Backend (Weeks 1-2)
```
[ ] Create Vercel project
[ ] Setup Supabase project
[ ] Create database schema
[ ] Deploy first API endpoints
[ ] Add Stripe integration
[ ] Setup environment variables
[ ] Write API tests
```

**Result**: Functional checkout system (still uses static JSON data)

### Phase 2: Add CMS (Weeks 3-4)
```
[ ] Setup Sanity project
[ ] Define content models
[ ] Migrate existing artworks to Sanity
[ ] Create Sanity API queries
[ ] Update frontend to fetch from Sanity
[ ] Add image optimization in Sanity
[ ] Test content publishing workflow
```

**Result**: Artist can update content without developer intervention

### Phase 3: Complete e-Commerce (Weeks 5-6)
```
[ ] Implement order history page
[ ] Add order status tracking
[ ] Setup email notifications
[ ] Implement newsletter system
[ ] Add analytics tracking
[ ] Create admin dashboard (basic)
[ ] Setup Stripe webhooks
```

**Result**: Full e-commerce system with order management

### Phase 4: Optimize & Polish (Weeks 7-8)
```
[ ] Performance optimization
[ ] Security hardening
[ ] Error handling improvements
[ ] Documentation updates
[ ] Load testing
[ ] Monitoring setup
[ ] Deployment runbook
```

**Result**: Production-ready system

---

## Success Metrics

### Performance
- API response time: < 500ms
- Checkout completion rate: > 70%
- Page load time: < 3s

### Business
- Payment processing: 100% successful (via Stripe)
- Order fulfillment: < 48 hours from purchase
- Customer support: < 24 hour response time

### Operational
- Uptime: 99.9%
- Error tracking: 100% of errors caught
- Deployment time: < 5 minutes

---

## Decision Points Requiring User Input

### Q1: Current Priority?
Choose one:
- **Option A**: Implement full e-commerce immediately
- **Option B**: Start with CMS only (artist content management)
- **Option C**: Implement incrementally (CMS first, then e-commerce)

**Recommendation**: Option B (CMS first), then add e-commerce in Phase 3

### Q2: Email Provider?
Choose one:
- **Option A**: Stripe transactional emails (free, limited templates)
- **Option B**: SendGrid (free tier: 100 emails/day)
- **Option C**: Mailgun ($0.50 per 1000 emails, after first 10k)

**Recommendation**: Stripe for order emails, SendGrid for newsletter

### Q3: Analytics Provider?
Choose one:
- **Option A**: Google Analytics (free, not privacy-focused)
- **Option B**: Plausible Analytics ($9/month, privacy-first, GDPR compliant)
- **Option C**: Self-hosted Umami (free, requires server)

**Recommendation**: Plausible for professional metrics, Google Analytics backup

### Q4: Artist Dashboard?
Choose one:
- **Option A**: No dashboard (artist manages via Sanity UI only)
- **Option B**: Basic dashboard (view orders, update status)
- **Option C**: Full dashboard (orders, analytics, inventory)

**Recommendation**: Option B (basic dashboard in Phase 3)

### Q5: Subscription Support?
Choose one:
- **Option A**: One-time purchases only
- **Option B**: One-time + subscription option (recurring payments)
- **Option C**: Decide later (add in Phase 4)

**Recommendation**: Option A for MVP, add subscriptions later

---

## Comparison with Existing Solutions

### Shopify
**Cost**: $29-299/month
**Pros**: All-in-one, great UI
**Cons**: Over-engineered, expensive for single artist
**Verdict**: Not recommended (overkill)

### Wix/Squarespace
**Cost**: $12-27/month
**Pros**: All-in-one, templates
**Cons**: Hard to customize, vendor lock-in
**Verdict**: Not recommended (less flexible)

### WordPress + WooCommerce
**Cost**: $8-300/month (depends on hosting)
**Pros**: Flexible, self-hosted option
**Cons**: More complex, security maintenance required
**Verdict**: Not recommended (more overhead than needed)

### Etsy
**Cost**: Free, 5% commission + $0.20 per listing
**Pros**: Built-in audience, payment processing
**Cons**: Loses control of brand, limited customization
**Verdict**: Not recommended (different purpose - marketplace)

---

## Next Steps

1. **Review Decision Points** (above) - get artist's priorities
2. **Create Vercel + Sanity + Supabase accounts** (free)
3. **Implement Phase 1: Backend** (2 weeks)
4. **Implement Phase 2: CMS** (2 weeks)
5. **Implement Phase 3: E-Commerce** (2 weeks)
6. **Deploy to production** (1 week testing)

**Timeline**: 8 weeks from planning to launch

---

## Related Documents

- **BACKEND-TASKS.md** - Detailed implementation tasks and timeline
- **ADR-BACKEND-001.md** - Architecture decision record
- **API-DOCUMENTATION.md** - OpenAPI specification (to be created)
- **DATABASE-SCHEMA.md** - Complete SQL schema (to be created)
- **DEPLOYMENT-GUIDE.md** - Step-by-step deployment instructions (to be created)

