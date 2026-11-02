# FOODS66 — Complete Project Analysis

**Date**: 2026-09-10  
**Analyst**: Automated Full-Stack Audit

---

## 1. Current Architecture

```
┌──────────────┐    HTTP     ┌──────────────────┐    Mongoose    ┌──────────┐
│   React Web  │────────────▶│  Express API     │──────────────▶│ MongoDB  │
│   (Vite)     │◀────────────│  (TypeScript)    │◀──────────────│          │
│   Port 3000  │  Socket.IO  │  Port 5000       │               │ Port 27017│
└──────────────┘             └──────────────────┘               └──────────┘
                                     │
                              ┌──────┴──────┐
                              │   Stripe    │
                              │   Gemini AI │
                              │   BullMQ    │
                              └─────────────┘
```

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19.2.0 |
| Build Tool | Vite | 6.2.0 |
| Language | TypeScript | ~5.8.2 |
| CSS | TailwindCSS | 3.4.19 |
| State Management | Zustand | 5.0.14 |
| HTTP Client | Axios | 1.18.1 |
| Routing | React Router DOM | 7.9.6 |
| Backend | Express | 4.18.2 |
| Database | MongoDB (Mongoose) | 8.0.0 |
| Auth | JWT + bcryptjs | 9.0.0 / 2.4.3 |
| Payments | Stripe | 22.5.0 |
| Real-time | Socket.IO | 4.8.3 |
| AI | Google Gemini | 2.12.0 |
| Validation | Zod | 4.5.4 |
| Security | Helmet + Rate Limit + Mongo Sanitize | Latest |
| Image Processing | Sharp | 0.35.3 |
| Job Queue | BullMQ + IORedis | 5.80.8 |

## 3. Folder Structure

See `PROJECT_BACKUP_INFO.md` for full structure.

## 4. Database Structure

### Users Collection
| Field | Type | Required | Notes |
|---|---|---|---|
| name | String | ✅ | Max 100 chars |
| email | String | ✅ | Unique, lowercase |
| password | String | ✅ | bcrypt hashed |
| role | Enum | ✅ | customer/restaurant/driver/admin |
| phone | String | ❌ | Default '' |
| address | String | ❌ | Default '' |
| rewardPoints | Number | ❌ | Default 0, earned on delivery |
| healthProfile | Object | ❌ | AI dietary analysis |
| vehicle | Enum | ❌ | Bike/Scooter/Electric Bike/Car (drivers) |
| availability | Boolean | ❌ | Default true (drivers) |
| currentLocation | GeoJSON Point | ❌ | [lng, lat] |
| isSuspended | Boolean | ❌ | Admin can suspend |

### Foods Collection
| Field | Type | Required | Notes |
|---|---|---|---|
| name | String | ✅ | Text indexed |
| description | String | ✅ | Text indexed |
| price | Number | ✅ | In ₹ |
| category | String | ✅ | Indexed |
| image | String | ✅ | Path to webp image |
| available | Boolean | ❌ | Default true |
| stock | Number | ❌ | Default 100 |

### Orders Collection
| Field | Type | Required | Notes |
|---|---|---|---|
| userId | String | ✅ | Indexed |
| items[] | Array | ✅ | {foodId, name, price, quantity, image} |
| subtotal | Number | ✅ | Server-calculated |
| deliveryFee | Number | ❌ | Default ₹40 |
| tax | Number | ❌ | 5% GST |
| discountAmount | Number | ❌ | From coupon |
| totalPrice | Number | ✅ | Server-calculated |
| status | Enum | ✅ | 13 statuses with state machine |
| paymentStatus | Enum | ✅ | PENDING/PROCESSING/PAID/FAILED/CANCELLED/REFUNDED |
| paymentMethod | Enum | ✅ | CARD/COD/UPI |
| deliveryAddress | Object | ✅ | {doorNo, landmark, district, city, state, pincode, fullAddress, lat, lng} |
| timeline[] | Array | ❌ | {status, timestamp, note, actor} |
| idempotencyKey | String | ❌ | Unique, prevents duplicate orders |
| sessionId | String | ❌ | Stripe session ID |

### Restaurants Collection
| Field | Type | Required | Notes |
|---|---|---|---|
| userId | String | ✅ | Owner reference |
| name | String | ✅ | Text indexed |
| description | String | ❌ | |
| address | String | ✅ | |
| phone | String | ✅ | |
| rating | Number | ❌ | AI sentiment-based |
| verificationStatus | Enum | ❌ | pending/verified/rejected |
| liveStatus | Enum | ❌ | open/closed |
| reviews[] | Array | ❌ | {text, sentimentScore, date} |

## 5. Existing Backend API Endpoints

### Authentication & Users (`/api/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /register | Public | Register new customer |
| POST | /login | Public | Login, returns JWT |
| GET | /me | Protected | Get current user |
| PUT | /profile | Protected | Update name/phone/address |
| GET | / | Admin | List all users |
| GET | /:id | Admin | Get user by ID |
| PUT | /:id | Admin | Update user |
| DELETE | /:id | Admin | Delete user |
| POST | /reverse-geocode | Public | Lat/lng to address |
| POST | /validate-health | Public | AI health profile validation |

### Foods (`/api/foods`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | List all (with ?category, ?search filters) |
| GET | /search/aggregate | Public | Advanced filter/sort |
| GET | /:id | Public | Food by ID |
| POST | / | Admin/Restaurant | Create food |
| PUT | /:id | Admin/Restaurant | Update food |
| DELETE | /:id | Admin/Restaurant | Delete food |

### Restaurants (`/api/restaurants`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | List verified restaurants |
| GET | /me | Restaurant | Own restaurant profile |
| POST | / | Restaurant | Create restaurant profile |
| PUT | /me/status | Restaurant | Toggle open/closed |
| PUT | /:id/verify | Admin | Verify restaurant |
| POST | /:id/reviews | Protected | Add review (AI sentiment) |

### Orders (`/api/orders`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Protected | List orders (role-scoped) |
| GET | /:id | Protected | Order by ID (ownership check) |
| POST | / | Protected | Create order (server-side pricing) |
| PUT | /:id/status | Protected | Update status (state machine) |
| DELETE | /:id | Admin | Delete order |

### Payments (`/api/payments`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /create-session | Protected | Create Stripe session |
| POST | /checkout | Protected | Alias for create-session |
| GET | /status/:id | Protected | Payment status |
| POST | /verify/:id | Protected | Verify/confirm payment |

### Other Routes
| Route | Description |
|---|---|
| `/api/search` | AI-powered food search (Gemini) |
| `/api/coupons` | Coupon CRUD + validation |
| `/api/deliveries` | Delivery management |
| `/api/analytics` | Admin analytics dashboard |
| `/api/ai` | AI chat assistant |
| `/api/upload` | Image upload (Sharp processing) |
| `/api/feedback` | Order feedback/ratings |
| `/api/webhooks` | Stripe webhook handler |

## 6. Existing Authentication

- **Method**: JWT Bearer tokens
- **Hashing**: bcrypt with 10 salt rounds
- **Token Expiry**: 30 days
- **Storage**: Client-side (localStorage on web, SharedPreferences on mobile)
- **Middleware**: `protect` (verify JWT) + `authorize` (RBAC)
- **Rate Limiting**: 20 auth attempts per hour per IP
- **Role checks**: Server-side role verification on every protected endpoint

## 7. Feature Inventory

| Feature | Web Status | Mobile Status |
|---|---|---|
| Registration | ✅ AVAILABLE | ✅ Provider ready, no UI |
| Login | ✅ AVAILABLE | ✅ AVAILABLE |
| Food Listing | ✅ AVAILABLE | ✅ AVAILABLE (basic) |
| Food Details | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Search | ✅ AVAILABLE (AI) | ❌ NOT AVAILABLE |
| Categories | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Restaurant Listing | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Cart | ✅ AVAILABLE | 🟡 PARTIAL (local only) |
| Checkout | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Payments (Stripe) | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Payments (COD) | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Order History | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Order Tracking | ✅ AVAILABLE (live map) | ❌ NOT AVAILABLE |
| Profile | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Admin Dashboard | ✅ AVAILABLE | N/A (web only) |
| Restaurant Dashboard | ✅ AVAILABLE | N/A (web only) |
| Delivery Dashboard | ✅ AVAILABLE | N/A (web only) |
| AI Chat | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| AI Recommendations | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Coupons | ✅ AVAILABLE | ❌ NOT AVAILABLE |
| Favorites | ❌ NOT AVAILABLE | ❌ NOT AVAILABLE |
| Notifications | 🟡 Socket.IO only | ❌ NOT AVAILABLE |
| Health Profile | ✅ AVAILABLE | ❌ NOT AVAILABLE |

## 8. Problems Found

1. **No favorites feature** — Neither web nor mobile implements favorites
2. **No password change endpoint** — Users cannot change passwords via API
3. **Mobile cart is local-only** — Cart state lost on app restart
4. **No register screen in mobile** — Only login exists
5. **Mobile uses SharedPreferences for JWT** — Should use flutter_secure_storage
6. **Empty cart/profile/orders screens** — Placeholder text only
7. **No error boundary in mobile** — Unhandled exceptions crash the app
8. **No offline handling** — No connectivity checks in mobile

## 9. Security Analysis

### ✅ Good Practices (Already Implemented)
- bcrypt password hashing (10 rounds)
- JWT with environment-variable secret (fail-fast if missing)
- RBAC middleware (`authorize`)
- Zod input validation on all mutating endpoints
- Helmet security headers
- Rate limiting (global + auth-specific)
- MongoDB injection prevention (express-mongo-sanitize)
- Server-side price calculation (never trusts client)
- Idempotency keys for order creation
- Order ownership verification
- State machine for order status transitions

### ⚠️ Concerns
- JWT stored in localStorage (web) — vulnerable to XSS
- JWT stored in SharedPreferences (mobile) — should use flutter_secure_storage
- No CSRF protection (mitigated by JWT Bearer auth)
- No request signing for mobile API calls
- Stripe keys are test/mock values

## 10. Required Changes for Mobile

### Backend
1. Add `favorites` route + model
2. Add `change-password` endpoint
3. Update CORS to accept mobile app origins

### Database
1. Add `favorites` collection

### Flutter
1. Complete all 15+ missing screens
2. Add proper models, providers, widgets
3. Use flutter_secure_storage for tokens
4. Add connectivity handling
5. Add proper error/loading/empty states
