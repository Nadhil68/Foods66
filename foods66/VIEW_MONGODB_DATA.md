# How to View MongoDB Data

## 🎯 Quick Start - 3 Ways to View Your Data

### **Option 1: Browser (Easiest)**
Simply open your browser and navigate to these URLs:

```
All Foods:     http://localhost:5000/api/foods
All Users:     http://localhost:5000/api/users
All Orders:    http://localhost:5000/api/orders
Server Status: http://localhost:5000/api/health
```

The data will display as JSON in your browser.

---

### **Option 2: REST Client Extension (VS Code)**

1. Install **REST Client** extension in VS Code
   - Open Extensions: `Ctrl+Shift+X`
   - Search "REST Client" by Huachao Mao
   - Install it

2. Open [API_REQUESTS.rest](./API_REQUESTS.rest) file in your workspace

3. Click "Send Request" above any request to see data

---

### **Option 3: MongoDB Compass (Most Professional)**

**What is MongoDB Compass?**
- Official MongoDB GUI tool
- Visual database explorer
- Create, read, update, delete data easily

**Installation:**
1. Download from: https://www.mongodb.com/products/tools/compass
2. Install and open
3. Click "Create New Connection"
4. Connection String: `mongodb://localhost:27017`
5. Click "Connect"

**Then:**
- Left sidebar → `foods66` database
- Click `foods`, `orders`, or `users` collections
- See all your data in a table view

---

## 📋 Example API Calls (Copy-Paste in Browser)

### View all foods:
```
http://localhost:5000/api/foods
```

### View foods in pizza category:
```
http://localhost:5000/api/foods?category=pizza
```

### View all orders:
```
http://localhost:5000/api/orders
```

### View orders by specific user:
```
http://localhost:5000/api/orders?userId=user123
```

### View all users:
```
http://localhost:5000/api/users
```

---

## 🧪 Add Sample Data

### Using REST Client in VS Code:
1. Open [API_REQUESTS.rest](./API_REQUESTS.rest)
2. Scroll to "Create a new food" section
3. Click "Send Request"
4. Update the JSON with your data
5. See response with created food ID

### Using Browser (POST requests):
Use Postman: https://www.postman.com/
1. Create new POST request to: `http://localhost:5000/api/foods`
2. Set body as JSON:
```json
{
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato and mozzarella",
  "price": 12.99,
  "category": "pizza",
  "image": "pizza.jpg",
  "available": true
}
```

---

## 💾 Current Database Status

**Database Name:** `foods66`

**Collections:**
1. **foods** - Food menu items
   - Fields: name, description, price, category, image, available

2. **orders** - Customer orders
   - Fields: userId, items, totalPrice, status, deliveryAddress, createdAt

3. **users** - Customer accounts
   - Fields: name, email, password, phone, address, createdAt

---

## ✅ Verification

**Backend Server Status:**
- Open: http://localhost:5000/api/health
- You should see: `{ "status": "Server is running" }`

**MongoDB Connection Status:**
- Check terminal where backend is running
- Should show: `✅ MongoDB connected successfully`

---

## 🔧 Troubleshooting

### "Cannot connect to localhost:5000"
- Make sure backend server is running
- In terminal at `d:\Downloads\foods66\server`, run: `npm run dev`

### "Cannot connect to MongoDB"
- Ensure MongoDB is running locally: `mongod`
- Or update `.env` with MongoDB Atlas URI

### "No data showing"
- Database is empty - add sample data using POST requests
- Check the example requests in this guide

---

## 🚀 Frontend Integration

Use the API service in your React components:

```typescript
import { foodsAPI, ordersAPI, usersAPI } from './services/apiService';

// Get foods
const foods = await foodsAPI.getAll();

// Get foods by category
const pizzas = await foodsAPI.getAll('pizza');

// Create order
await ordersAPI.create({
  userId: 'user123',
  items: [{ foodId: '...', quantity: 2, price: 12.99 }],
  totalPrice: 25.98,
  deliveryAddress: '123 Main St',
  status: 'pending'
});
```
