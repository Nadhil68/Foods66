# FOODS66 Setup & Deployment

## 1. Environment Configuration

### Backend
Make sure you have MongoDB running locally or a MongoDB Atlas URI.
1. `cd backend`
2. `npm install`
3. Duplicate `.env.example` to `.env` and fill in `MONGO_URI` and `JWT_SECRET`.
4. `npm run dev` to start the backend on port 5000.

### Mobile Application (Flutter)
If you haven't installed Flutter, download the Flutter SDK and add it to your System PATH.

1. `cd foods66_mobile`
2. Run `flutter pub get` to download dependencies (Dio, Provider, etc.).
3. If testing on an Android Emulator, ensure the API Base URL in `lib/core/constants/api_constants.dart` is set to `http://10.0.2.2:5000/api`. If testing on a physical device, change it to your computer's local IP address (e.g., `http://192.168.1.5:5000/api`).

## 2. Running the App
- **Debug Mode**: `flutter run`
- **Release Build**: `flutter build apk --release` (Generates the APK in `build/app/outputs/flutter-apk/app-release.apk`)
- **App Bundle**: `flutter build appbundle --release` (For Play Store distribution)
