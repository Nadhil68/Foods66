# FOODS66 Architecture

## Overview
The FOODS66 system is composed of:
1. **Node.js (Express) Backend**: Handles API requests, business logic, authentication, and database connections.
2. **MongoDB**: Stores all user, restaurant, food, and order data.
3. **Web Application (React)**: The existing frontend dashboard.
4. **Mobile Application (Flutter)**: The native Android application for customers to browse and order food.

## Mobile Architecture
- **Framework**: Flutter (Dart)
- **State Management**: Provider (`ChangeNotifier`)
- **Networking**: Dio (HTTP Client)
- **Local Storage**: SharedPreferences (for JWT Tokens)

### Communication
The Flutter application communicates exclusively through REST API endpoints exposed by the Node.js backend. It does NOT directly connect to MongoDB. All data fetched (e.g. Foods, Orders, Restaurants) is serialized into Dart models before being fed into the UI.

## File Structure (Mobile)
```
foods66_mobile/
├── lib/
│   ├── core/
│   │   ├── constants/ (API endpoints, colors)
│   │   ├── network/   (Dio client, interceptors)
│   │   └── theme/     (Material Design theme configuration)
│   ├── models/        (Dart Data Classes e.g., FoodModel, OrderModel)
│   ├── providers/     (Auth, Cart logic)
│   ├── screens/       (UI Views like Login, Home, Checkout)
│   └── widgets/       (Reusable UI components)
```
