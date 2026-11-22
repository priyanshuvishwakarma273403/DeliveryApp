# FoodIQ – Production Release & Deployment Guide

**Project:** FoodIQ Mobile Application (`foodiq_mobile`)  
**Target Platforms:** Android & iOS  
**Architecture:** Feature-First Clean Architecture (Riverpod 2.x, GoRouter, Dio, STOMP WebSockets)  
**Version:** 1.0.0+1  

---

## 1. Environment & Configuration

The application uses `flutter_dotenv` to separate environment configs between Local Development, Staging, and Production.

### Release `.env` Configuration
Ensure the release `.env` contains the production backend URLs:
```properties
FOODIQ_API_BASE_URL=https://deliveryapp-wwx8.onrender.com/api
FOODIQ_WS_URL=wss://deliveryapp-wwx8.onrender.com/api/ws/websocket
FOODIQ_CONNECT_TIMEOUT=15000
FOODIQ_RECEIVE_TIMEOUT=15000
FOODIQ_ENVIRONMENT=production
```

---

## 2. Android Release Signing & Build

### Step 2.1: Generate Production Keystore
Open a PowerShell terminal and generate a 2048-bit RSA keystore:
```powershell
keytool -genkey -v -keystore D:\food_delivery\foodiq-release.keystore `
  -alias foodiq-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

### Step 2.2: Configure `key.properties`
Create `foodiq_mobile/android/key.properties` (never commit this file to git):
```properties
storePassword=<YOUR_KEYSTORE_PASSWORD>
keyPassword=<YOUR_KEY_PASSWORD>
keyAlias=foodiq-key
storeFile=D:/food_delivery/foodiq-release.keystore
```

### Step 2.3: Build Signed Android App Bundle (AAB for Google Play)
```powershell
cd D:\food_delivery\foodiq_mobile
flutter clean
flutter pub get
flutter build appbundle --release
```
Artifact Output:
`foodiq_mobile/build/app/outputs/bundle/release/app-release.aab`

### Step 2.4: Build Signed Universal APK (For Direct Testing / Sideloading)
```powershell
flutter build apk --release --split-per-abi
```
Artifact Outputs:
- `build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk`
- `build/app/outputs/flutter-apk/app-arm64-v8a-release.apk`
- `build/app/outputs/flutter-apk/app-x86_64-release.apk`

---

## 3. iOS Release Configuration & Build

### Step 3.1: CocoaPods & Signing Setup
On a macOS host or CI/CD runner:
```bash
cd ios
pod install --repo-update
cd ..
```
In Xcode (`ios/Runner.xcworkspace`):
1. Select the **Runner** target -> **Signing & Capabilities**.
2. Select your Apple Developer Team.
3. Verify Bundle Identifier: `com.foodiq.app`.

### Step 3.2: Build Signed IPA for TestFlight
```bash
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist
```

---

## 4. Continuous Integration & Deployment (GitHub Actions)

Create `.github/workflows/mobile_ci_cd.yml`:
```yaml
name: FoodIQ Mobile CI/CD

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Run Analysis & 24 Unit Test Suites
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'
          cache: true
      - name: Install Dependencies
        run: |
          cd foodiq_mobile
          flutter pub get
      - name: Verify Code Formatting & Lints
        run: |
          cd foodiq_mobile
          flutter analyze
      - name: Run Test Suites
        run: |
          cd foodiq_mobile
          flutter test --coverage

  build-android:
    name: Build Android Release AAB
    needs: test
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.x'
          channel: 'stable'
      - name: Build AAB
        run: |
          cd foodiq_mobile
          flutter build appbundle --release
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-release-aab
          path: foodiq_mobile/build/app/outputs/bundle/release/app-release.aab
```

---

## 5. Security & QA Verification Checklist

| Category | Verification Item | Status |
|---|---|:---:|
| **Authentication** | JWT tokens stored exclusively in `FlutterSecureStorage` | **VERIFIED** |
| **Interceptors** | Automatic Bearer header injection & 401 unauth session purge | **VERIFIED** |
| **Logging** | Safe logging interceptor with passwords, pins & secrets redacted | **VERIFIED** |
| **Idempotency** | UUIDv4 `Idempotency-Key` header on all `/finance/pay` operations | **VERIFIED** |
| **Pricing Authority** | Grand total & taxes derived strictly from backend `/finance/checkout` | **VERIFIED** |
| **Conflict Handling** | Multi-restaurant cart replacement confirmation dialog | **VERIFIED** |
| **Telemetry** | Live STOMP listener with Haversine dynamic ETA countdown | **VERIFIED** |
| **Health & Twin** | Order Brain digital twin telemetry integrated | **VERIFIED** |
| **Multi-Persona** | Customer, Rider, Restaurant KDS, and Admin dashboards separated by RBAC | **VERIFIED** |
| **Code Minification** | Proguard rules configured in `android/app/proguard-rules.pro` | **VERIFIED** |
