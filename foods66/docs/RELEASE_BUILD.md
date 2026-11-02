# FOODS66 Mobile App - Release Build Guide

This document describes the necessary steps to build a production-ready version of the FOODS66 Flutter application for Android.

## 1. Prerequisites
- **Flutter SDK**: Ensure `flutter doctor` passes all checks.
- **Java Development Kit (JDK)**: JDK 21 is installed. Gradle 8.5+ is required.
- **Android SDK**: Configured at `D:\Android\sdk`.
- **Disk Space**: If your `C:\` drive is low on space, ensure `GRADLE_USER_HOME` is pointed to the `D:\` drive.

## 2. Setting up the Keystore (Android)
To release an Android application, you must sign it with a cryptographic key.

1. Generate a private signing key using `keytool` (comes with the JDK):
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias foods66
```
2. Store `release-key.jks` in the `android/app` folder securely (do NOT commit this file to public version control).

3. Create a file named `key.properties` in the `android/` folder containing the following:
```properties
storePassword=<password from previous step>
keyPassword=<password from previous step>
keyAlias=foods66
storeFile=release-key.jks
```

4. Update `android/app/build.gradle` to use the `key.properties`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias = keystoreProperties['keyAlias']
            keyPassword = keystoreProperties['keyPassword']
            storeFile = keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword = keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

## 3. Building the Release Artifacts

Navigate to the `foods66_mobile` directory and run the following command to generate an App Bundle (recommended for Google Play Store):
```bash
flutter build appbundle --release
```

Or, to generate an APK (for direct installation or testing):
```bash
flutter build apk --release
```

## 4. Output Locations
- **App Bundle**: `build/app/outputs/bundle/release/app-release.aab`
- **APK**: `build/app/outputs/flutter-apk/app-release.apk`
