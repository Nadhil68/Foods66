# FOODS66 API Documentation

The mobile application relies on the following REST API endpoints provided by the Node.js Backend.

## Authentication (`/api/users`)
- `POST /register`: Register a new user. Body: `{ name, email, password }`
- `POST /login`: Authenticate user. Body: `{ email, password }`. Returns JWT token.
- `GET /me`: Fetch authenticated user profile. Requires `Authorization: Bearer <token>`.

## Foods (`/api/foods`)
- `GET /`: List all available foods.
- `GET /search/aggregate`: Search foods by category or price range.
- `GET /:id`: Fetch detailed information about a specific food item.

## Restaurants (`/api/restaurants`)
- `GET /`: List all verified restaurants on the platform.

## Orders (`/api/orders`)
- `POST /`: Create a new order. Requires items, delivery address, and payment method (e.g., COD).
- `GET /`: Get order history for the authenticated user.
- `GET /:id`: Fetch detailed order status and tracking information.
