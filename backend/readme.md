---

## Table of Contents

1. [Purpose & Scope](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#1-purpose--scope)
2. [Architecture Overview](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#2-architecture-overview)
3. [Core Modules & Endpoints](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#3-core-modules--endpoints)
    - 3.1 [Authentication & Authorization](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#31-authentication--authorization)
    - 3.2 [Storefront Services](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#32-storefront-services)
    - 3.3 [Cart & Order Services](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#33-cart--order-services)
    - 3.4 [User Profile Services](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#34-user-profile-services)
    - 3.5 [Admin Services](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#35-admin-services)
    - 3.6 [CMS & Static Content](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#36-cms--static-content)
4. [Data Models & Schemas](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#4-data-models--schemas)
5. [Background Jobs](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#5-background-jobs)
6. [Integrations & External Services](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#6-integrations--external-services)
7. [Non-Functional Requirements](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#7-non-functional-requirements)
8. [Security & Compliance](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#8-security--compliance)
9. [CI/CD & Deployment](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#9-ci-cd--deployment)
10. [Monitoring & Logging](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#10-monitoring--logging)

---

## 1. Purpose & Scope

**Purpose:**

Provide a robust, scalable backend to support the Beeget Fashion frontend, covering all user and admin-facing functionality.

**Scope:**

- Authentication & role-based access
- Product, category, collection, promotion data
- Cart and order processing
- User profiles and order history
- Admin CRUD and reporting
- CMS-driven pages and contact submissions
- Background tasks for emails, reports, cleanups

---

## 2. Architecture Overview

```
Clients (React Frontend)
     ↓ REST/JSON
API Gateway (Express)
 ├─ auth.routes.js          # login, register, password reset
 ├─ products.routes.js      # public catalog APIs
 ├─ cart.routes.js
 ├─ orders.routes.js
 ├─ users.routes.js         # profile, addresses
 ├─ admin/                  # protected admin APIs
 │    ├─ products.routes.js
 │    ├─ categories.routes.js
 │    ├─ promotions.routes.js
 │    ├─ orders.routes.js
 │    ├─ users.routes.js
 │    └─ reports.routes.js
 └─ cms.routes.js           # static pages, contact form

MongoDB (Mongoose)
Redis (session store, BullMQ)
Email Worker (BullMQ) → Nodemailer/SendGrid

```

---

## 3. Core Modules & Endpoints

### 3.1 Authentication & Authorization

- **JWT tokens** (access 15m, refresh 7d)
- **Endpoints:**
    - `POST /auth/register` → create user, send verification email
    - `POST /auth/login` → return access & refresh tokens
    - `POST /auth/refresh` → issue new access token
    - `POST /auth/logout` → invalidate refresh token
    - `POST /auth/forgot-password` → enqueue reset email job
    - `POST /auth/reset-password` → set new password

### 3.2 Storefront Services

### Products

- `GET /products` → filters (category, collection, price, search), pagination
- `GET /products/:slug` → product detail

### Categories & Collections

- `GET /categories` → tree structure
- `GET /collections` → list
- `GET /categories/:slug/collections/:slug/products`

### Promotions

- `GET /promotions` → active sitewide offers

### 3.3 Cart & Order Services

### Cart

- `GET /cart` → current user’s cart
- `POST /cart` → add item `{ productId, qty }`
- `PATCH /cart/:itemId` → update qty
- `DELETE /cart/:itemId` → remove item

### Orders

- `POST /orders` → place order (incl. payment processing)
- `GET /orders` → list user’s orders
- `GET /orders/:id` → detail and tracking status
- `PATCH /orders/:id/status` (admin) → update status

### 3.4 User Profile Services

- `GET /users/me` → profile
- `PATCH /users/me` → update name/password
- **Addresses**:
    - `GET /users/me/addresses`
    - `POST /users/me/addresses`
    - `PATCH /users/me/addresses/:id`
    - `DELETE /users/me/addresses/:id`

### 3.5 Admin Services

Protected via `isAdmin` middleware.

- **Products, Categories, Collections, Promotions:** full CRUD
- **Users:** `GET /admin/users`, `PATCH /admin/users/:id/role`
- **Orders:** `GET /admin/orders`, `PATCH /admin/orders/:id/status`
- **Reports:**
    - `GET /admin/reports/sales?start=&end=` → sales data
    - `GET /admin/reports/inventory` → low stock alerts

### 3.6 CMS & Static Content

- **Pages:** `GET /cms/pages/:slug` → fetch content blocks
- **Contact:** `POST /cms/contact` → enqueue email to support

---

## 4. Data Models & Schemas

### User

```
{ name, email, passwordHash, role: ['user','admin'],
  addresses: [{ label, line1, city, state, zip, country }],
  refreshToken, createdAt, updatedAt }

```

### Product

```
{ title, slug, description, images: [], price, salePrice,
  categories: [ObjectId], collections: [ObjectId], tags: [],
  inventoryCount, createdAt, updatedAt }

```

### Category / Collection / Promotion

- Common: `{ name, slug, description, image, active, order }`
- Promotion: also `{ discountType, discountValue, startDate, endDate }`

### Cart

```
{ userId, items: [{ productId, qty }], updatedAt }

```

### Order

```
{ userId, items: [{ productId, qty, priceAtPurchase }],
  shippingAddress, paymentStatus, orderStatus,
  totalAmount, createdAt, updatedAt }

```

### CMS Page

```
{ slug, title, contentBlocks: [{ type, data }], updatedAt }

```

---

## 5. Background Jobs

- **Email Jobs** (BullMQ + Redis)
    - `sendVerificationEmail(userId)`
    - `sendPasswordResetEmail(userId)`
    - `sendOrderConfirmation(orderId)`
- **Report Jobs**
    - `dailySalesReport` → generate CSV & email admin
- **Cleanup Jobs**
    - `cleanupAbandonedCarts` → carts >30d

---

## 6. Integrations & External Services

- **Email:** Nodemailer (SMTP) or SendGrid API
- **Payments:** Stripe SDK + webhooks
- **File Storage:** AWS S3 for product images
- **Caching/Queue:** Redis for session store & BullMQ
- **Logging/Error Tracking:** Winston + Sentry

---

## 7. Non-Functional Requirements

- **Performance:** 95th percentile <200ms
- **Scalability:** horizontally scalable stateless APIs
- **Availability:** 99.9% uptime, health checks
- **Maintainability:** modular code, 80% test coverage
- **Compliance:** GDPR data deletion endpoint

---

## 8. Security & Compliance

- **Authentication:** JWT with rotation
- **Input Validation:** Joi/Zod schemas
- **Rate Limiting:** 100 requests/min per IP
- **CSP & Headers:** Helmet middleware
- **Data Encryption:** TLS in transit, AES-256 at rest

---

## 9. CI/CD & Deployment

- **CI:** GitHub Actions for lint, test, build Docker images
- **CD:** Deploy to Kubernetes (EKS) or Heroku
- **Infrastructure as Code:** Terraform for AWS resources

---

## 10. Monitoring & Logging

- **Metrics:** Prometheus + Grafana dashboards
- **Logs:** Structured logs to ELK stack
- **Alerts:** PagerDuty on error rates >1% or job failures

---

*End of Beeget Fashion Backend PRD.*