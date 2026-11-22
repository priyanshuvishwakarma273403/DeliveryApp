# FoodIQ Mobile – Production Flutter Food Delivery Application

FoodIQ is the official, production-ready cross-platform mobile application for the **FoodIQ Food Delivery Platform**, built using **Flutter stable**, **Dart 3.x**, and **Material 3**.

This application directly integrates with the FoodIQ Spring Boot REST API backend, dual MySQL & MongoDB databases, and high-frequency STOMP WebSocket broker. It provides a native mobile experience for all 4 user roles: **Customer**, **Delivery Partner**, **Restaurant Owner / Branch Manager**, and **Platform Administrator**.

---

## 1. Architectural Highlights

- **Framework:** Flutter stable with Dart 3.x
- **Architecture:** Feature-First Clean Architecture (`presentation/`, `domain/`, `data/`)
- **State Management:** Riverpod 2.x (`StateNotifierProvider`, `AsyncNotifierProvider`, `FutureProvider`)
- **Navigation & Routing:** GoRouter with reactive authentication state redirection and role-based access guards (RBAC)
- **Networking:** Centralized `ApiClient` via Dio with `AuthInterceptor` (automatic JWT Bearer injection & 401 unauth session purge) and `SafeLoggingInterceptor` (passwords & secrets redacted)
- **Real-Time Telemetry:** Persistent STOMP WebSocket client (`wss://.../api/ws/websocket`) for real-time order status updates (`/topic/order/{id}`) and live rider GPS location streams (`/topic/location/{orderId}`)
- **Geodesic Engine:** Accurate Haversine great-circle calculation for real-time distance and minute-by-minute dynamic ETA countdown
- **Security:** OS hardware-backed token encryption via `FlutterSecureStorage` (Android KeyStore / iOS Keychain)
- **Design System:** Custom Material 3 theme with FoodIQ Brand Red (`#E23744`), Saffron Orange (`#FC8019`), and Veg/Non-Veg indicators

---

## 2. Directory Layout & Feature Organization

The project follows a scalable, feature-first Clean Architecture structure:

```
foodiq_mobile/
├── android/                          # Native Android build configurations & manifest
│   ├── app/
│   │   ├── build.gradle              # compileSdk 34, minSdk 24, multiDex enabled
│   │   ├── proguard-rules.pro        # Proguard / R8 optimization rules for release
│   │   └── src/main/AndroidManifest.xml # Permissions (Location, Internet, Notifications)
├── ios/                              # Native iOS Runner & Info.plist
│   └── Runner/Info.plist             # Location & Network privacy usage strings
├── lib/
│   ├── app/                          # App-level entrypoints, config, routing & theme
│   │   ├── app.dart                  # Root MaterialApp.router with Riverpod
│   │   ├── config/                   # EnvConfig, AppConstants (.env reader)
│   │   ├── router/                   # AppRouter, RoutePaths, RouterRefreshNotifier
│   │   └── theme/                    # AppColors, AppTypography, AppTheme
│   ├── core/                         # Cross-cutting foundational infrastructure
│   │   ├── api/                      # ApiClient, ApiEndpoints, ApiResponse
│   │   ├── errors/                   # AppException, Failure, ErrorHandler
│   │   ├── network/                  # AuthInterceptor, LoggingInterceptor
│   │   ├── storage/                  # SecureStorageService, LocalStorageService
│   │   ├── utils/                    # CurrencyFormatter, DateFormatter, Haversine
│   │   ├── websocket/                # StompService, WebSocketState
│   │   └── widgets/                  # AppButton, AppCard, AppTextField, EmptyState
│   ├── features/                     # Feature-First Modules
│   │   ├── admin/                    # Platform Ops Hub & live order oversight
│   │   ├── authentication/           # Login, Register, OTP verification, Forgot PW
│   │   ├── cart/                     # Server-synced Cart, Combos, Allergy Guardian
│   │   ├── checkout/                 # Authoritative pricing engine, Tip selector
│   │   ├── customer/                 # Customer dashboard shell with bottom navigation
│   │   ├── delivery/                 # Rider Console, duty toggle, GPS broadcaster
│   │   ├── home/                     # Dynamic home feed, hero carousel, stories
│   │   ├── location/                 # Address models, picker sheet, GPS coords
│   │   ├── notifications/            # Inbox notifications, unread count badge
│   │   ├── onboarding/               # Splash screen, welcome carousel
│   │   ├── orders/                   # Live tracking map, Order Brain twin, receipts
│   │   ├── payments/                 # Payment selector (UPI/Card/COD), ScratchCard
│   │   ├── profile/                  # 12-tab profile hub, Taste DNA, Wallet & Coins
│   │   ├── restaurant/               # Kitchen Display System (KDS), order queues
│   │   ├── restaurants/              # Directory filters, dish cards, category tabs
│   │   ├── role_selection/           # Unified role portal switcher
│   │   └── search/                   # Universal search with instant debouncing
│   ├── shared/                       # Shared models (User, Order, Restaurant, Cart)
│   ├── bootstrap.dart                # Production initialization ceremony
│   └── main.dart                     # Main entrypoint
├── test/
│   ├── unit/                         # 16 unit test suites covering domain & state
│   └── widget/                       # 2 widget test suites covering UI controls
├── .env.example                      # Template environment configuration
└── pubspec.yaml                      # Dependencies & asset manifests
```

---

## 3. Four Dedicated Multi-Role Portals

### 1. Customer Experience
- **Discovery:** Mood search bar, auto-scrolling promo carousel, category pills, Instagram-style food stories, and curated recommendations.
- **Restaurant Catalogue:** Multi-dimensional sorting and filtering (Rating, Delivery Time, Veg-only, Cuisine, City) and categorized menus (*Starters*, *Main Course*, *Breads*, *Desserts*, *Beverages*).
- **Server Cart & Safety:** Local offline cart with backend sync, cross-restaurant replacement prompt, AI Smart Combos upselling, and **Allergy Guardian** allergen warning banners.
- **Authoritative Checkout:** Grand total, GST taxes (5%), packaging fees (₹20), and platform fee (₹5) computed strictly by backend `/finance/checkout`.
- **Payment & Rewards:** Support for UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, FoodIQ Wallet, and Cash on Delivery with RFC-4122 `Idempotency-Key` headers and post-order **ScratchCard** rewards.
- **Live STOMP Tracking:** Real-time delivery map with moving rider pin, geodesic Haversine ETA countdown, and **Order Brain Digital Twin** kitchen cooking progress telemetry.
- **Personalized Profile:** 12 modular tabs including **Taste DNA** (flavor matrix & allergy exclusions), **FoodIQ Gold** VIP membership, **Wallet & Gift Cards**, dispute support tickets, and conversational **AI Food Concierge**.

### 2. Delivery Partner Console
- **Duty Toggle:** Seamless Online / Offline duty status switch.
- **Gig Scanner:** Scans and accepts nearby delivery runs (`GET /api/delivery/partner/available`).
- **Two-Stage Fulfillment:** Order lifecycle progression ("Mark Picked Up" -> "Mark Delivered").
- **GPS Telemetry Broadcaster:** Automatic 5-second periodic GPS coordinate broadcasting over WebSocket (`/app/location/{orderId}`).

### 3. Restaurant Operations & KDS
- **Tri-State Order Pipeline:** Tabbed kitchen queue (*NEW*, *IN KITCHEN / COOKING*, *FOOD READY*).
- **One-Tap Transitions:** "Start Cooking" (`PREPARING`) and "Mark Food Ready" (`FOOD_READY`).
- **Store Controls:** Real-time restaurant open/closed status toggle.

### 4. Administrator Platform Ops
- **Executive KPI Dashboard:** Real-time Platform Revenue, Live Orders count, Active Riders count, and System Health percentage.
- **Order Oversight:** Platform-wide order list with search and emergency status overrides.

---

## 4. Environment Configuration

Create a `.env` file in `foodiq_mobile/` based on `.env.example`:

```properties
FOODIQ_API_BASE_URL=https://deliveryapp-wwx8.onrender.com/api
FOODIQ_WS_URL=wss://deliveryapp-wwx8.onrender.com/api/ws/websocket
FOODIQ_CONNECT_TIMEOUT=15000
FOODIQ_RECEIVE_TIMEOUT=15000
FOODIQ_ENVIRONMENT=production
```

---

## 5. Running the Application

### Prerequisites
- Flutter SDK (3.22.x or higher)
- Android SDK (API 34) & Java 17 LTS
- Visual Studio Code or Android Studio with Flutter/Dart plugins

### Run in Debug Mode
```powershell
cd D:\food_delivery\foodiq_mobile
flutter pub get
flutter run
```

### Run on Specific Target
```powershell
# Run on connected Android device/emulator
flutter run -d android

# Run on Chrome for quick UI verification
flutter run -d chrome
```

---

## 6. Automated Testing

The project includes **24 automated test suites** covering models, state notifiers, network contracts, and UI components:

```powershell
cd D:\food_delivery\foodiq_mobile
flutter test
```

### Test Coverage Highlights
- `test/unit/api_response_test.dart` – Generic API payload parsing
- `test/unit/haversine_test.dart` – Geodesic distance & ETA calculations
- `test/unit/cart_state_test.dart` – Cart math, item counters, subtotal validation
- `test/unit/checkout_pricing_model_test.dart` – Authoritative server pricing & taxes
- `test/unit/payment_method_test.dart` – Payment gateway mapping & transactions
- `test/unit/rider_location_model_test.dart` – High-frequency GPS telemetry
- `test/unit/order_digital_twin_model_test.dart` – Order Brain telemetry & SLA risks
- `test/unit/user_taste_dna_model_test.dart` – Flavor matrix & allergy exclusions
- `test/unit/rider_console_state_test.dart` – Delivery partner duty & active runs
- `test/unit/kds_state_test.dart` – Kitchen display system queue transitions
- `test/unit/admin_ops_state_test.dart` – Admin KPI analytics & status overrides
- `test/widget/app_button_test.dart` – Core UI button interactions & loading states
- `test/widget/foodiq_logo_test.dart` – Branding widget validation

---

## 7. Production Release Build

Refer to `docs/PRODUCTION_RELEASE_GUIDE.md` for full instructions.

### Build Android Release App Bundle (AAB for Google Play Store)
```powershell
cd D:\food_delivery\foodiq_mobile
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### Build Universal Release APK
```powershell
flutter build apk --release --split-per-abi
```
Output: `build/app/outputs/flutter-apk/app-arm64-v8a-release.apk`
