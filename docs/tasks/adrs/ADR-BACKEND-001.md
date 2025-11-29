# ADR-BACKEND-001: Hybrid Serverless Architecture for Branchstone

**Status**: Proposed | **Date**: November 28, 2025 | **Decision Maker**: Team

---

## Context

Branchstone Art Portfolio is currently a 100% static site (GitHub Pages) with no backend infrastructure. Future requirements include:

- E-commerce functionality (shopping cart, checkout, payment processing)
- Content management system (artist-friendly UI for managing artworks and content)
- Dynamic features (order management, newsletter, analytics)
- Order fulfillment workflow
- Email notifications

**Key Constraints**:
- Artist is non-technical (needs UI-based CMS)
- Limited budget (~$50-100/month recurring)
- Small audience and sales volume (5-20 orders/month estimated)
- Fast time-to-market (6-8 weeks ideal)
- Low maintenance overhead

---

## Decision

**Adopt a Hybrid Architecture combining:**

1. **Static Frontend** - Continue using GitHub Pages (no change)
2. **Serverless Backend** - Vercel Functions (Node.js) for API endpoints
3. **Headless CMS** - Sanity for content management
4. **Database** - Supabase PostgreSQL for orders, analytics, subscriptions
5. **Payment Processing** - Stripe for checkout and payment handling
6. **Email** - SendGrid for transactional emails and newsletter
7. **Image CDN** - Sanity's built-in CDN for image delivery

### Architecture Diagram

```
┌──────────────────────────────────────────┐
│        GitHub Pages (Frontend)           │
│    Static HTML, CSS, JavaScript          │
│      Vanilla JS + Vue.js (client)        │
└─────────────────┬──────────────────────┘
                  │ HTTPS API calls
      ┌───────────┼───────────────┐
      │           │               │
      ▼           ▼               ▼
┌──────────┐  ┌────────┐  ┌─────────────┐
│ Vercel   │  │Stripe  │  │Sanity CDN   │
│Functions │  │Checkout│  │(Images)     │
│(Backend) │  │(Hosted)│  │             │
└────┬─────┘  └────────┘  └─────────────┘
     │
     ├─ Sanity API (content)
     ├─ Supabase API (database)
     └─ SendGrid API (email)

┌──────────┐  ┌──────────┐  ┌──────────┐
│ Sanity   │  │Supabase  │  │SendGrid  │
│  CMS     │  │PostgreSQL│  │  Email   │
└──────────┘  └──────────┘  └──────────┘
```

---

## Rationale

### Why Hybrid Over Other Options

#### Option A: Stay 100% Static
**Rejected** because:
- No shopping cart persistence (customer loses items on refresh)
- No order management
- No inventory tracking
- No customer email notifications
- Difficult to add future features

#### Option B: Serverless Only (No CMS)
**Rejected** because:
- Artist can't update content via UI (requires developer)
- Content stored in JSON files (hard to manage at scale)
- No content versioning or publishing workflow
- Difficult to add testimonials, press, collections, etc.

#### Option C: Headless CMS Only
**Rejected** because:
- Missing backend for payment webhooks
- Order management clunky (email-based)
- Analytics difficult to implement
- Stripe webhook handling still requires backend

#### Option D: Full Backend (Node/Python + PostgreSQL)
**Rejected** because:
- Expensive: $50-150/month vs $20-50/month for serverless
- More complex to deploy and maintain
- Overkill for current traffic/sales volume
- Longer time-to-market (8+ weeks vs 6 weeks)
- Requires ongoing security patches and monitoring

### Why HYBRID is Best

**Hybrid combines the best of both worlds**:

| Aspect | Benefit |
|--------|---------|
| **Cost** | Only $50-80/month (vs $150+ for full backend) |
| **Time** | 6-8 weeks to MVP (vs 12+ for full backend) |
| **Simplicity** | Managed services mean less maintenance |
| **CMS** | Artist-friendly Sanity UI (no developer needed) |
| **Scalability** | Vercel auto-scales on traffic spikes |
| **Security** | Stripe handles PCI compliance |
| **Flexibility** | Can upgrade individual components as needed |
| **Developer Experience** | Simple monolithic API, easy to test |

---

## Technology Stack Selection

### Frontend: GitHub Pages (No Change)

**Why GitHub Pages**:
- Free ($0/month)
- 99.9%+ uptime SLA
- Automatic HTTPS/TLS
- CDN included (Cloudflare)
- No maintenance required
- Direct integration with repository

**Alternative Considered**: Vercel, Netlify
- Would add $20/month with similar benefits
- GitHub Pages is sufficient for static content

### Backend: Vercel Functions

**Why Vercel Functions**:
- Free tier: 100 concurrent functions, 100GB/month bandwidth
- Auto-scales on traffic spikes
- Built-in environment variables
- Integrated preview deployments
- Low cold-start latency (~50-100ms)
- Easy local development

**Alternatives Considered**:
- AWS Lambda: More complex, requires API Gateway setup
- Google Cloud Functions: Similar cost, less straightforward pricing
- DigitalOcean App Platform: Better for containers, overkill for this use case

**Why Node.js**:
- Fastest time-to-market
- Rich ecosystem (Express, Stripe SDK, etc.)
- Developer already familiar with Node
- Excellent for I/O-bound operations (API calls to Stripe, Sanity, database)

### Database: Supabase PostgreSQL

**Why Supabase**:
- Free tier: 500MB storage, sufficient for years of order data
- Managed PostgreSQL (no devops overhead)
- Built-in row-level security
- Real-time subscriptions (future feature)
- Excellent developer experience
- Automatic backups and PITR (Point-In-Time Recovery)

**Alternatives Considered**:
- MongoDB/Firebase: Not ideal for relational data (orders, items)
- AWS RDS: More expensive ($20+/month), more complex
- PlanetScale MySQL: Good but overkill, PostgreSQL superior for this use case

### CMS: Sanity

**Why Sanity**:
- Free tier for small projects
- Beautiful, intuitive editor UI
- Structured content with GROQ query language
- Built-in asset management and CDN
- Real-time preview in Vercel
- Webhook support for content changes

**Alternatives Considered**:
- Contentful: More expensive ($289/month min), similar features
- Strapi: Self-hosted, requires server management
- WordPress: Overkill, harder to keep artist-friendly
- Payload CMS: Self-hosted, requires infrastructure

### Payment Processing: Stripe

**Why Stripe**:
- Industry standard, trusted
- Handles PCI DSS Level 1 compliance
- Multiple payment methods (card, Apple Pay, Google Pay)
- Excellent webhook reliability (99.99%+)
- Comprehensive API and documentation
- Built-in dispute management

**Alternatives Considered**:
- PayPal: Simpler but fewer features
- Square: Good for physical locations, less suitable for online only
- Gumroad: Simpler but takes larger commission (3.5% + $0.30)

### Email: SendGrid + Stripe

**Email Strategy**:
1. **Transactional emails** (order confirmation): Use Stripe (free, reliable)
2. **Newsletter**: Use SendGrid free tier initially (100 emails/day)

**Why SendGrid**:
- Free tier: 100 emails/day (enough for MVP)
- Paid tier: $30/month for unlimited volume
- Excellent email deliverability
- Easy integration with Vercel Functions

**Alternatives Considered**:
- Mailgun: Similar pricing, slightly more complex
- Sendgrid vs building email system: SendGrid better for reliability

### Image CDN: Sanity + Cloudinary

**Strategy**:
- Primary: Sanity's built-in image CDN (included with CMS)
- Optional Future: Cloudinary for advanced optimization

**Why Not Separate CDN**:
- Sanity includes image delivery CDN
- Adds cost ($30+/month) without major benefit for current needs
- Can migrate to Cloudinary later if needed

---

## Database Design

### Schema Rationale

**Orders Table**: Tracks customer purchases
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_email VARCHAR(255),
  total_amount_cents INTEGER,
  status VARCHAR(50), -- pending, confirmed, shipped, completed
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  shipped_at TIMESTAMP
);
```

**Rationale**:
- UUID for security (not sequential, harder to guess)
- Store amounts in cents to avoid floating-point math
- Track all status changes for fulfillment workflow
- Stripe payment intent ID for idempotency

**Order Items Table**: Line-item level details
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  artwork_id INTEGER,
  price_cents INTEGER,
  quantity INTEGER,
  created_at TIMESTAMP
);
```

**Rationale**:
- Denormalize price at order time (prevent price changes retroactively)
- Track quantity for future bulk orders or variations

**Analytics Events Table**: User behavior tracking
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50),
  artwork_id INTEGER,
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP
);
```

**Rationale**:
- Track user behavior for insights
- JSONB for flexible metadata (custom fields per event type)
- Session ID for user journey analysis

**Newsletter Table**: Email subscription management
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  consent_given BOOLEAN,
  unsubscribed BOOLEAN,
  subscribed_at TIMESTAMP
);
```

**Rationale**:
- GDPR compliance (track consent, allow unsubscribe)
- Unique constraint prevents duplicate subscriptions

---

## API Design Rationale

### REST Over GraphQL

**Decision**: Use REST API (not GraphQL)

**Rationale**:
- REST simpler for MVP (less tooling complexity)
- Vercel Functions naturally serve REST endpoints
- Easier to cache and CDN (standard HTTP semantics)
- Fewer security considerations (GraphQL has its own attack surface)
- GraphQL can be added later if needed

**Example Endpoints**:
```
GET /api/artworks         - List all artworks (from Sanity)
POST /api/checkout        - Initiate Stripe checkout
POST /api/stripe-webhook  - Handle Stripe events
GET /api/orders/:id       - Fetch order details
POST /api/newsletter/subscribe - Subscribe to newsletter
```

### Authentication Strategy

**Decision**: Public API with rate limiting (MVP) → API Keys (future)

**Rationale**:
- MVP: Simple public API, rate limit by IP
- No user auth complexity blocking MVP launch
- Stripe webhook signing for authenticity
- Easy to upgrade to API keys later

**Security**:
- Rate limiting: 60 requests/minute per IP
- Stripe webhook signature validation
- Input validation on all endpoints
- Never expose payment data

---

## Security & Compliance

### PCI Compliance

**Strategy**: Use Stripe Hosted Checkout (offload PCI liability)

**Decision**:
- Never build custom payment forms
- Use Stripe Checkout (hosted on Stripe's servers)
- Store only Stripe payment intent IDs (not card data)
- Stripe handles PCI Level 1 compliance

**Benefit**: Artist doesn't need to maintain PCI compliance independently

### Data Protection

**In Transit**:
- ✅ HTTPS/TLS enforced (GitHub Pages provides)
- ✅ All API calls HTTPS only

**At Rest**:
- ✅ Supabase encrypts database at rest
- ✅ Stripe encrypts payment data
- ✅ Environment variables in Vercel (not in code)

**Access Control**:
- ✅ Supabase Row-Level Security for sensitive data
- ✅ API rate limiting to prevent brute force
- ✅ JWT tokens for future artist dashboard

### Vulnerability Prevention

- ✅ Parameterized SQL queries (Supabase ORM)
- ✅ Input validation on all endpoints
- ✅ Output encoding to prevent XSS
- ✅ CORS configured for frontend domain only
- ✅ Security headers (CSP, HSTS) via GitHub Pages default

---

## Cost Breakdown

### First Year

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** | $20/month | Pro plan for better reliability |
| **Supabase** | Free-$25 | Free tier up to 500MB; $25/month at scale |
| **Sanity** | $0-15 | Free tier + pay-as-you-grow |
| **SendGrid** | $0-30 | Free: 100 emails/day; $30 for unlimited |
| **GitHub Pages** | $0 | Included in GitHub free tier |
| **Domain** | ~$12/year | Renewed annually |
| **Stripe** | 2.9% + $0.30 | Only on sales (no monthly fee) |

**Monthly Average**: $45-90/month
**Year 1 Total**: ~$540-1,080

### Year 2+

**Monthly**: $50-100/month (once setup costs amortized)
**Key Assumption**: Stripe fees only apply on actual sales

**Revenue Analysis**:
- If selling 3 artworks/month @ $2,500 each:
  - Revenue: $7,500
  - Stripe fees: ~$218
  - Hosting fees: ~$80
  - Profit: ~$7,202

---

## Migration Path

### Phase 0 → Phase 1 (Weeks 1-2): Add Backend
- Setup Vercel, Supabase, Stripe
- Implement core API endpoints
- Frontend still uses static JSON data
- **Result**: Functional payment processing

### Phase 1 → Phase 2 (Weeks 3-4): Add CMS
- Setup Sanity
- Migrate artworks to Sanity
- Update frontend to fetch from Sanity API
- **Result**: Artist can update content via Sanity UI

### Phase 2 → Phase 3 (Weeks 5-6): Complete E-Commerce
- Implement shopping cart and order management
- Add email notifications and newsletter
- Add analytics tracking
- **Result**: Fully functional e-commerce system

### Phase 3 → Phase 4 (Weeks 7-8): Launch
- Security review and hardening
- Performance optimization
- Documentation and training
- Production deployment
- **Result**: Production-ready system

---

## Future Considerations

### Potential Upgrades (Not in MVP)

1. **Artist Dashboard**: Custom interface for managing orders and inventory
2. **Subscription Support**: Recurring payments for commissioned work
3. **Advanced Analytics**: Dashboards for sales trends, customer insights
4. **Automated Fulfillment**: Integration with shipping carriers
5. **Mobile App**: Native iOS/Android app (future)
6. **Multi-Artist Platform**: Support for multiple artists (major architectural change)

### Scalability Path

**Current capacity**: ~100 orders/day (10x baseline)
**Cost to scale**: Minimal (Vercel and Supabase auto-scale)
**When to upgrade**: Only when hitting limits

### Technology Debt Mitigation

1. **API Versioning**: Plan for `/api/v2` routes in future
2. **Database Migrations**: Keep migration scripts versioned
3. **Code Organization**: Monolithic API OK for now, split into services only if needed
4. **Testing Coverage**: Add tests incrementally

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Stripe API down | Low (0.01%) | High (can't process) | Fallback queue, notify artist |
| Sanity CMS down | Low (0.01%) | Medium (can't update content) | Cache content on frontend |
| Database corruption | Very Low | High | Daily backups, RLS policies |
| Performance degradation | Medium | Medium | CDN caching, database indexes |
| Cost overruns | Low | Low | Monitor usage, set alerts |
| Payment fraud | Medium | High | Stripe fraud detection, CVV verification |

---

## Rollout Plan

### Before Launch (Week 8)
- [ ] Team reviews and approves architecture
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit complete
- [ ] Artist trained on CMS
- [ ] Documentation complete

### Launch Week
- [ ] Deploy to production
- [ ] Monitor error rates (24/7 for first week)
- [ ] Monitor payment processing
- [ ] Quick response team on standby

### Post-Launch (Weeks 1-4)
- [ ] Weekly check-ins with artist
- [ ] Monitor performance metrics
- [ ] Gather feedback for improvements
- [ ] Plan Phase 5 enhancements

---

## Decision Approval

- **Status**: Proposed (awaiting team review)
- **Decision Maker**: Project Lead / Artist
- **Date Approved**: ___________
- **Approved By**: ___________

---

## Related Documents

- **BACKEND-ARCHITECTURE-001-strategy.md** - Detailed technical architecture
- **BACKEND-TASKS.md** - Implementation tasks and timeline
- **API-DOCUMENTATION.md** - OpenAPI specification (to be created)
- **DATABASE-SCHEMA.md** - Complete SQL schema (to be created)

---

## Questions & Discussion

**Q: Can we use Shopify instead?**
A: Shopify is $29+/month with limited customization. Hybrid architecture is more flexible and cheaper.

**Q: What if we need to scale to millions of users?**
A: Vercel and Supabase scale automatically. If needed, we can migrate to dedicated infrastructure later.

**Q: Can the artist manage everything without a developer?**
A: Yes, after initial setup. Artist manages content in Sanity, views orders in Supabase, processes payments via Stripe dashboard. Future admin dashboard can improve this further.

**Q: What about GDPR and data privacy?**
A: Supabase complies with GDPR. Stripe is PCI DSS certified. Newsletter includes unsubscribe link per GDPR. We'll add privacy policy before launch.

**Q: Can we migrate to a different payment provider later?**
A: Yes, Stripe integration is isolated. We can swap for PayPal, Square, etc. with changes only in checkout flow and webhook handlers.

