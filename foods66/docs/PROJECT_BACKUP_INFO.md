# FOODS66 — Project Backup Information

**Date**: 2026-09-10  
**Purpose**: Document the existing project state before Flutter mobile app implementation.

## Original Project State

### Technology Stack
- **Frontend**: React 19 + Vite 6 + TypeScript + TailwindCSS 3
- **Backend**: Node.js + Express 4 + TypeScript + MongoDB (Mongoose 8)
- **Authentication**: JWT (jsonwebtoken 9) + bcryptjs
- **Payments**: Stripe SDK
- **Real-time**: Socket.IO 4
- **AI**: Google Gemini (@google/genai)
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize, Zod validation
- **State Management (Web)**: Zustand
- **State Management (Mobile)**: Provider

### Original Folder Structure
```
FOODS66/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── config/         # database.ts, envConfig.ts, roles.ts
│   │   ├── middlewares/    # auth.ts, security.ts, upload.ts, validation.ts
│   │   ├── models/         # User, Food, Restaurant, Order, Delivery, Coupon, Feedback
│   │   ├── routes/         # 13 route files
│   │   ├── services/       # cacheService, healthValidation, pricingService, queueService
│   │   ├── types/
│   │   ├── utils/
│   │   └── server.ts
│   ├── .env
│   └── package.json
├── frontend/               # React Vite web app
│   ├── components/         # 8 component files
│   ├── pages/              # 16 page files
│   ├── services/           # apiClient, apiService, authService, geminiService, socketService
│   ├── context/            # AuthContext
│   ├── store/              # Zustand stores
│   ├── index.html
│   └── package.json
├── foods66_mobile/          # Flutter (partial) — THIS IS WHAT WE'RE BUILDING
│   ├── lib/
│   │   ├── core/           # theme, network, constants
│   │   ├── models/         # food_model.dart
│   │   ├── providers/      # auth_provider.dart, cart_provider.dart
│   │   ├── screens/        # splash, auth/login, home/main+home_fragment
│   │   ├── widgets/        # (empty)
│   │   └── main.dart
│   └── pubspec.yaml
├── mobile/                  # Expo/React Native (abandoned)
├── uploads/                 # User-uploaded food images
├── db_data/                 # MongoDB data files
├── docs/                    # Existing documentation
├── start.bat               # Dev startup script
└── README.md
```

### Existing Database Collections
| Collection | Model File | Fields |
|---|---|---|
| users | User.ts | name, email, password, role, phone, address, rewardPoints, healthProfile, vehicle, availability, currentLocation |
| foods | Food.ts | name, description, price, category, image, available, stock |
| restaurants | Restaurant.ts | userId, name, description, address, phone, rating, verificationStatus, liveStatus, earnings, reviews |
| orders | Order.ts | userId, items[], subtotal, deliveryFee, tax, discountAmount, totalPrice, status, paymentStatus, paymentMethod, deliveryAddress, timeline[], sessionId |
| deliveries | Delivery.ts | orderId, deliveryPartnerId, status, pickupLocation, dropLocation, currentLocation, timeline[] |
| coupons | Coupon.ts | code, discountType, discountValue, minimumOrderAmount, expiryDate, usageLimit, perUserLimit |
| feedbacks | Feedback.ts | orderId, userId, rating, deliveryRating, comment |

### Changes Made
All changes are documented in `docs/PROJECT_ANALYSIS.md` and the implementation plan.

### How to Restore
The existing website and backend were NOT modified destructively. All changes are additive:
- New Flutter screens/models/providers
- New backend route (`favorites.ts`) + model (`Favorite.ts`)
- Minor CORS update in `server.ts`
- No existing files were deleted
