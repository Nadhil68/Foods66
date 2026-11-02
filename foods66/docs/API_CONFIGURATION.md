# FOODS66 — API Configuration Guide

## Backend Technology
- **Runtime**: Node.js + Express (TypeScript)
- **Database**: MongoDB (Mongoose ODM)
- **Server Port**: 5000

## API Base URL

### Development (Android Emulator)
```
http://10.0.2.2:5000/api
```
The Android emulator maps `10.0.2.2` to the host machine's `localhost`.

### Development (Physical Android Device)
```
http://<YOUR_LAN_IP>:5000/api
```
Replace `<YOUR_LAN_IP>` with your computer's local network IP (e.g., `192.168.1.100`).
Both the phone and computer must be on the same Wi-Fi network.

To find your LAN IP:
```bash
ipconfig
```
Look for the `IPv4 Address` under your active network adapter.

### Development (Web / iOS Simulator)
```
http://localhost:5000/api
```

### Production
```
https://<YOUR_PRODUCTION_DOMAIN>/api
```
> **Note:** No production backend is currently deployed. This must be configured before a production release.

## Configuration File
The API base URL is configured in the Flutter project at:
```
lib/core/constants/api_constants.dart
```

The configuration is **platform-aware** — it automatically selects the correct URL based on the runtime platform:
- `kIsWeb` → uses `localhost`
- `Platform.isAndroid` → uses `10.0.2.2`
- Otherwise → uses `localhost`

## Image Base URL
Food images are served by the backend at:
```
http://10.0.2.2:5000  (emulator)
http://localhost:5000   (web)
```

## Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/login` | POST | User login |
| `/api/users/register` | POST | User registration |
| `/api/users/me` | GET | Get current user profile |
| `/api/users/profile` | PUT | Update profile |
| `/api/users/change-password` | PUT | Change password |
| `/api/foods` | GET | List all foods |
| `/api/foods/:id` | GET | Get food by ID |
| `/api/restaurants` | GET | List all restaurants |
| `/api/restaurants/:id` | GET | Get restaurant by ID |
| `/api/search` | GET | Search foods/restaurants |
| `/api/orders` | GET | List user's orders |
| `/api/orders/:id` | GET | Get order details |
| `/api/orders/:id/status` | PUT | Update order status |
| `/api/payments/create-session` | POST | Create payment/order |
| `/api/favorites` | GET/POST | List/add favorites |
| `/api/favorites/:foodId` | DELETE | Remove favorite |
| `/api/coupons` | GET | List coupons |
| `/api/feedback` | POST | Submit feedback |
| `/api/health` | GET | Health check |

## Authentication
- JWT token-based authentication
- Token stored securely via `FlutterSecureStorage`
- Token sent as `Authorization: Bearer <token>` header
- Token auto-attached by the Dio interceptor in `ApiClient`

## Security Notes
- No API keys or secrets are embedded in the Flutter code
- No database credentials exist in the mobile app
- Authentication is handled entirely via JWT tokens from the backend
- All sensitive operations go through the backend API
