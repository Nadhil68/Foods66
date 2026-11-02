# PRODUCTION DEPLOYMENT GUIDE: FOODS66

## 1. System Requirements

The system consists of three main components:
- **Backend API**: Node.js, Express, TypeScript
- **Web Application**: React 19, Vite, Tailwind CSS
- **Mobile Application**: Flutter (Android)

### Server Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (Atlas or self-hosted instance)
- A registered domain (e.g., `foods66.com`)
- Nginx (for reverse proxy and SSL)
- SSL Certificate (Let's Encrypt / Certbot)

---

## 2. Database Preparation (MongoDB)

1. **Create the Production Database:** Use MongoDB Atlas or your own hosted MongoDB. Create a new database cluster.
2. **Database User:** Create a specific database user with `readWrite` access strictly to the `foods66_prod` database.
3. **Whitelist IP:** Configure the network access in MongoDB to only allow connections from your production server's IP.

---

## 3. Backend Deployment

1. **Upload Source:** Clone or upload the `backend/` directory to the server.
2. **Install Dependencies:**
   ```bash
   cd backend
   npm ci
   ```
3. **Configuration:** 
   - Rename `.env.production.example` to `.env.production` (or just `.env`).
   - Fill in the actual `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`.
4. **Build & Start:**
   ```bash
   npm run build
   # Use PM2 for production process management
   npm install -g pm2
   pm2 start dist/server.js --name "foods66-backend"
   pm2 save
   ```
5. **Nginx Reverse Proxy:** Configure Nginx to forward traffic from `api.foods66.com` to `localhost:5000`. Secure it with SSL.

---

## 4. Web Application Deployment

1. **Upload Source:** Navigate to the `frontend/` directory.
2. **Install & Build:**
   ```bash
   cd frontend
   npm ci
   ```
3. **Configuration:** Set the production API URL in `.env.production`:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   ```
4. **Compile:**
   ```bash
   npm run build
   ```
5. **Hosting:** Upload the contents of the `dist/` folder to a static hosting provider (e.g., Vercel, AWS S3, or Nginx on your VPS serving static files).

---

## 5. Mobile Application Deployment (Flutter)

1. **Keystore Generation:** Follow standard Android documentation to generate a release keystore. Place it in `foods66_mobile/android/app/`.
2. **Configuration:** Update `foods66_mobile/android/key.properties` with the keystore passwords and alias.
3. **Build Commands:**
   ```bash
   cd foods66_mobile
   flutter clean
   flutter pub get
   flutter build apk --release --dart-define=API_URL=https://api.yourdomain.com/api
   flutter build appbundle --release --dart-define=API_URL=https://api.yourdomain.com/api
   ```
4. **Validation:** Install the generated APK on a physical device. Test the login, menu fetching, and order placement to verify the production API connection.
5. **Play Store:** Upload the `app-release.aab` from `build/app/outputs/bundle/release/` to the Google Play Console.
