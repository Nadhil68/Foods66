# MongoDB Setup Guide

## ✅ Expected Local Status

### Backend Server (Node.js + Express + MongoDB)
- **Location**: `backend/` directory
- **Expected URL**: `http://localhost:5000`
- **Database**: MongoDB (Local or Atlas)

### API Endpoints Available

#### Users & Authentication
- `POST /api/users/login` - Authenticate user
- `POST /api/users/register` - Register user
- `POST /api/users/validate-health` - Validate user health profile restrictions
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

#### System Health
- `GET /api/health` - Check backend server and DB connectivity status

#### Foods
- `GET /api/foods` - Get all foods (with optional category filter)
- `GET /api/foods/:id` - Get food by ID
- `POST /api/foods` - Create food

#### Orders & Payments
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `POST /api/webhooks/payment` - Payment provider webhook endpoint

## 🚀 Running Both Servers

### Terminal 1: Start Frontend (Vite Dev Server)
```bash
cd frontend
npm run dev
```
Runs on: `http://localhost:3000`

### Terminal 2: Start Backend (Node.js Server)
```bash
cd backend
npm run dev
```
Runs on: `http://localhost:5000`

## 🗄️ MongoDB Connection

### Local MongoDB
The server is configured to connect to: `mongodb://localhost:27017/foods66`

To start MongoDB locally:
```bash
mongod
```

### MongoDB Atlas (Cloud)
To use MongoDB Atlas instead:
1. Create a cluster at https://www.mongodb.com/cloud/atlas
2. Update `.env` file in `backend/` directory:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foods66
```

## 📚 Database Models

### User Schema
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required)
- `healthProfile` (Object)

### Food Schema
- `name` (String, required)
- `price` (Number, required)
- `category` (String, required)

### Order Schema
- `userId` (String, required)
- `items` (Array)
- `totalPrice` (Number, required)
- `status` (String)

## 🎯 Next Steps

1. **Update Frontend Components** to use the API service
2. **Add Authentication** (Login/Register with JWT)
3. **Add Payment Integration** (Stripe/PayPal)
4. **Add Real-time Updates** (WebSockets for order tracking)
5. **Deploy** to production (Vercel for frontend, Heroku/AWS for backend)
