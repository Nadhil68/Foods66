# Foods66 Platform

Foods66 is an enterprise food delivery platform featuring an AI-powered recommendation engine, real-time live map tracking, and secure payment processing.

## 📁 Project Structure

The project is strictly organized into two distinct environments:

```
Foods66
│
├── frontend/             # React (Vite) + TypeScript
├── backend/              # Node.js + Express + MongoDB
├── uploads/              # User-uploaded assets
├── check-mongo.js        # Diagnostic script for database connectivity
├── start.bat             # Windows startup script
└── README.md
```

## 🚀 Running Locally

1. **Install Dependencies:**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Start Servers:**
   Double-click the `start.bat` file in the root directory. This will open two terminal windows:
   - **Frontend:** http://localhost:3000
   - **Backend:** http://localhost:5000

## 🔧 Environment Variables

**Frontend (`frontend/.env.local`)**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (`backend/.env`)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foods66
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

## 🧪 Testing Tools
We have provided diagnostic scripts in the root directory to verify system health:
- `node check-mongo.js`: Verifies MongoDB connectivity.
- `node test-health-profile.js`: Tests the `/api/users/validate-health` endpoint.
- `node test-login.js`: Tests user authentication (Set `TEST_EMAIL` and `TEST_PASSWORD` env vars first).
- `node test-payment-webhook-invalid-order.js`: Tests webhook resilience against fake order IDs.
