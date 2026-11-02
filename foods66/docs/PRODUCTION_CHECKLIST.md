# FOODS66 PRODUCTION DEPLOYMENT CHECKLIST

## Infrastructure
- [ ] Production VPS / Cloud Server provisioned
- [ ] Node.js (v18+) installed and configured
- [ ] Production Domain registered and DNS pointing to server
- [ ] SSL Certificates configured for web and API domains (HTTPS forced)

## Database (MongoDB)
- [ ] Production MongoDB Cluster created
- [ ] MongoDB restricted user created with secure password
- [ ] IP Whitelisting enabled (allowing only backend server IP)
- [ ] Automated database backup schedule configured

## Backend (Node.js/Express)
- [ ] `.env.production` created on server (NOT in version control)
- [ ] `JWT_SECRET` generated securely
- [ ] `MONGODB_URI` securely connected
- [ ] Backend code compiled to `/dist` using `npm run build`
- [ ] PM2 (or equivalent process manager) configured to keep API running
- [ ] Debug mode disabled (stack traces hidden via `isProduction`)
- [ ] CORS configured to allow strictly the production Web URL
- [ ] `npm run test` executes successfully locally prior to push

## Website (React)
- [ ] `.env.production` created with `VITE_API_URL`
- [ ] `npm run build` completes without errors
- [ ] `/dist` folder deployed to static hosting / web server
- [ ] React Router configured to redirect correctly (fallback routing configured on server)
- [ ] Website successfully loads over HTTPS

## Mobile (Flutter)
- [ ] `key.properties` configured in `android/` with valid keystore
- [ ] Keystore and signing keys safely backed up offline
- [ ] `flutter analyze` passes with zero critical errors
- [ ] `flutter test` passes
- [ ] Release APK built successfully using `--dart-define=API_URL=...`
- [ ] Release AppBundle (AAB) built successfully
- [ ] Tested release APK on physical device against production API

## Security & Verification
- [ ] No secrets (keys, passwords) committed to repository
- [ ] User authentication working in production
- [ ] Database credentials not embedded anywhere in Flutter or React code
- [ ] Image paths correctly resolving via API URL

## Documentation
- [ ] `PRODUCTION_DEPLOYMENT.md` read and understood
- [ ] `DEPLOYMENT_REPORT.md` filled out after successful launch
