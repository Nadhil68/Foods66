# PROJECT ANALYSIS: FOODS66

## 1. Executive Summary

This report documents the findings from inspecting the existing `FOODS66` project directory. Contrary to the initial assumption that the stack might be PHP/MySQL, the existing platform is a modern, JavaScript/TypeScript-based stack using the MERN (MongoDB, Express, React, Node.js) ecosystem.

## 2. Current Stack & Technologies

### Backend
- **Framework**: Node.js with Express (written in TypeScript)
- **Database**: MongoDB (using Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs`
- **File Uploads**: `multer` and `sharp`
- **Payments**: Stripe (`stripe`)
- **Other Technologies**: Socket.io (for real-time updates), Redis & BullMQ (for job queues/workers), Zod (for validation)

### Frontend (Web Application)
- **Framework**: React 19 + Vite (written in TypeScript)
- **Styling**: Tailwind CSS, Framer Motion (for animations)
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Other**: Leaflet (maps), Recharts, Capacitor (currently configured for cross-platform packaging)

### Mobile (Existing Draft)
- There is currently a folder named `mobile` containing a skeleton **React Native / Expo** application.

## 3. Folder Structure
```text
FOODS66/
│
├── backend/            # Express.js REST API server
│   ├── src/
│   │   ├── config/     # DB, Redis, Stripe configuration
│   │   ├── middlewares/# Auth, Role validation
│   │   ├── models/     # Mongoose Schemas (User, Food, Restaurant, Order, etc.)
│   │   ├── routes/     # Express route handlers
│   │   ├── services/   # Business logic
│   │   └── utils/      # Helpers
│
├── frontend/           # React web application
│   ├── components/
│   ├── pages/
│   ├── store/          # Zustand stores
│   └── services/       # API integration
│
├── mobile/             # React Native (Expo) placeholder project
└── uploads/            # Local storage for images (likely handled via backend)
```

## 4. Database Structure (MongoDB Collections)
1. **User**: Authentication, profile info, saved addresses, roles.
2. **Restaurant**: Details, location, ratings, availability.
3. **Food**: Items linked to restaurants, pricing, descriptions, categories.
4. **Order**: Order details, status tracking, payment linkage.
5. **Coupon**: Discount logic.
6. **Delivery**: Tracking deliveries and drivers.
7. **Feedback**: User reviews.

## 5. Existing APIs
The backend already provides a well-structured REST API (under `backend/src/routes`):
- `/auth/*` (Login, Register, Logout)
- `/users/*` (Profile management)
- `/restaurants/*` (List, details)
- `/foods/*` (List, details)
- `/orders/*` (Create, history, updates)
- `/search/*` (Search functionality)
- `/payments/*` (Stripe integration)
- `/coupons/*`, `/deliveries/*`, `/feedback/*`, `/ai/*`

## 6. User Roles
Based on the file structure (e.g., `Delivery.ts`, `Restaurant.ts`), the system appears to support:
- **Customers**: Standard users placing orders.
- **Admins**: Platform administrators.
- **Delivery Drivers**: Users managing deliveries.
- **Restaurant Owners/Managers**: Managing restaurant items and orders.

## 7. Current Problems / Observations
- **Mobile Stack Discrepancy**: You requested a **Flutter (Dart)** application, but the current `mobile` directory contains a React Native (Expo) shell. We will need to remove or ignore this and build the Flutter app from scratch.
- **Frontend App Wrapper**: The `frontend` package.json includes `@capacitor/core` suggesting the web app was meant to be packaged as a mobile app directly. We will be replacing this strategy with a native Flutter application.

## 8. Recommended Architecture for Mobile Integration
The existing backend is perfectly suited for mobile integration. It already serves REST APIs using JSON, which Flutter can easily consume. 

### Proposed Flow
```text
[ Flutter Android App ] 
         │ (HTTP REST / JSON)
         ▼
[ Node.js + Express Backend ]
         │ (Mongoose)
         ▼
[ MongoDB Database ]
```

### Action Plan
1. **Retain Backend & Database**: We will completely reuse the existing `backend` and `MongoDB` database. The REST APIs are already present and feature-rich.
2. **Flutter Initialization**: We will create a new Flutter project (e.g., `foods66_mobile`) and safely deprecate the existing React Native `mobile` folder.
3. **Integration**: Connect the Flutter app to the existing Node.js APIs (handling auth via JWT).

---
*Ready to proceed with Phase 2 (Backup) and Phase 3 (Reviewing specific API endpoints before starting the Flutter project).*
