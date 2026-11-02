# FOODS66 — Mobile Setup Guide

## Prerequisites

### Required Software
1. **Flutter SDK** (3.24.1 or later)
   - Already installed at: `D:\flutter_sdk\flutter`
   - Add `D:\flutter_sdk\flutter\bin` to your system PATH

2. **Android SDK** (API 34)
   - Install location: `D:\Android\sdk`
   - Set environment variable: `ANDROID_HOME=D:\Android\sdk`
   - Required packages: `platform-tools`, `platforms;android-34`, `build-tools;34.0.0`

3. **JDK 21** (Eclipse Temurin)
   - Already installed at: `C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot`
   - Set environment variable: `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot`

4. **Node.js** (v20+) — for the backend server
5. **MongoDB** (v8+) — for the database

---

## Step-by-Step Setup

### 1. Clone / Open the Project
```bash
cd C:\Users\user\OneDrive\Documents\projects\foods66\foods66_mobile
```

### 2. Install Flutter Dependencies
```bash
flutter pub get
```

### 3. Add Android Platform (if missing)
If the `android/` directory does not exist:
```bash
flutter create . --platforms android
```

### 4. Configure API URL
The API configuration is in:
```
lib/core/constants/api_constants.dart
```

For Android Emulator, the app automatically uses `http://10.0.2.2:5000/api`.
For physical Android device, you may need to change to your LAN IP.

### 5. Start the Backend
Open a terminal in the project root:
```bash
# Terminal 1: Start MongoDB
mongod --dbpath db_data

# Terminal 2: Start Node.js backend
cd backend
npm run dev
```

### 6. Start an Android Emulator
```bash
flutter emulators --launch <emulator_name>
# OR use Android Studio to launch an AVD
```

### 7. Run the Flutter App
```bash
cd foods66_mobile
flutter run
```

---

## Building the APK

### Debug APK
```bash
flutter build apk --debug
```
Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Play Store Bundle (AAB)
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

> **Note:** Release builds require a signing key. See `RELEASE_BUILD.md` for details.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `flutter` not found | Add `D:\flutter_sdk\flutter\bin` to PATH |
| Android SDK not found | Set `ANDROID_HOME=D:\Android\sdk` |
| Cannot connect to API on emulator | Use `10.0.2.2` instead of `localhost` |
| Cannot connect to API on physical device | Use your computer's LAN IP (e.g., `192.168.x.x`) |
| MongoDB connection failed | Ensure `mongod --dbpath db_data` is running |
| Backend not responding | Ensure `npm run dev` is running in `backend/` |
