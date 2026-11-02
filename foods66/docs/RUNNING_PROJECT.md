# FOODS66 - Running Project Guide

## Project Type
**Node.js (Backend) + React (Frontend) + MongoDB (Database)**
*(MERN Stack)*

The initial assumptions of PHP, MySQL, XAMPP, or Laravel are incorrect. The project uses a modern JavaScript/TypeScript ecosystem.

## Required Software
* **Node.js** (v20+ recommended)
* **npm** (Node Package Manager)
* **MongoDB** (Local `mongod` server)
* **Flutter** (For the upcoming mobile app build, though currently a React Native stub exists)

## Installation
1. Open a terminal.
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Database Setup
The project uses MongoDB. The database files are stored locally in the `db_data` directory.

1. Start MongoDB locally pointing to the `db_data` folder:
   ```bash
   mongod --dbpath db_data
   ```
2. Open a new terminal, navigate to the `backend` folder and seed the initial data:
   ```bash
   cd backend
   npm run seed
   ```

## Backend Startup
With MongoDB running, start the Node.js API server:
```bash
cd backend
npm run dev
```
The server will start at `http://localhost:5000`.

## Website URL
Start the React frontend application:
```bash
cd frontend
npm run dev
```
The web application will be accessible at:
**http://localhost:3000**

## Mobile Startup
Currently, the `mobile` folder contains a React Native (Expo) placeholder, and `foods66_mobile` contains an uninitialized/broken Flutter setup.
We will initialize the Flutter app in the next phase as requested.

## API URL
The development REST API runs at:
**http://localhost:5000/api/**
*(For Android Emulator, use `http://10.0.2.2:5000/api/` instead of `localhost`)*

## Test Accounts
The `npm run seed` command provisions the following test accounts:
* **Admin**: `admin@foods66.com` / `admin123`
* **Customer**: `customer@foods66.com` / `password123`
* **Driver**: `driver@foods66.com` / `password123`
* **Restaurant**: `restaurant@foods66.com` / `password123`

## Troubleshooting
* **MongoDB Connection Failed**: Ensure `mongod --dbpath db_data` is running in a separate terminal.
* **Port Conflicts**: If port 3000 or 5000 are in use, you can adjust them in `frontend/.env.local` and `backend/.env` respectively.
* **Flutter Missing**: `flutter` is currently not recognized on your path. Before we start the mobile project, ensure the Flutter SDK is downloaded and added to your system's PATH.

---
*Ready to proceed to the mobile application conversion when you are.*
