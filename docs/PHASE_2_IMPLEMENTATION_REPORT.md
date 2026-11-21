# FoodIQ – Phase 2 Implementation Report

**Milestone:** Phase 2 – Complete Automated Flutter Architecture & Foundation Implementation  
**Completion Date:** November 2026  
**Lead Engineers:** Senior Flutter Architect, Senior Dart Developer, Windows Environment Engineer, Android Build Engineer  
**Status:** **PHASE 2 COMPLETED SUCCESSFULLY**

---

## 1. Executive Summary

Phase 2 establishes the complete production-grade foundation of the FoodIQ mobile application in `d:\food_delivery\foodiq_mobile`. The mobile codebase is built upon Clean Architecture with a strict feature-first organization, Riverpod 2.x reactive state management, declarative GoRouter routing with RBAC guards, centralized Dio networking with JWT authentication interceptors, real-time STOMP WebSocket capabilities, and dedicated dashboard shells for all four supported platform roles: **Customer**, **Delivery Partner**, **Restaurant Manager**, and **Platform Administrator**.

No mock or hardcoded production data has been created. The network layer directly interfaces with the authoritative Spring Boot backend endpoints identified in Phase 1.

---

## 2. Directory Layout & Implemented File Hierarchy

```
foodiq_mobile/
├── .env                              # Active runtime environment configuration
├── .env.example                      # Template without private secrets
├── analysis_options.yaml             # Strict Flutter & Dart linter rules
├── pubspec.yaml                      # Production dependencies & asset declarations
├── README.md                         # Project documentation
│
├── android/                          # Native Android host configuration
│   ├── app/
│   │   ├── build.gradle              # compileSdk 34, minSdk 24, multiDex, Proguard
│   │   └── src/main/AndroidManifest.xml # Permissions (Internet, Fine/Coarse Location, Notifications)
│   ├── build.gradle                  # Root Gradle build configuration
│   ├── settings.gradle               # Flutter plugin loader
│   └── gradle/wrapper/gradle-wrapper.properties # Gradle 8.3 distribution
│
├── ios/
│   └── Runner/Info.plist             # iOS bundle ID, location permission strings
│
├── lib/
│   ├── main.dart                     # App entry point
│   ├── bootstrap.dart                # System UI styling, .env loading, storage singletons, error zone
│   │
│   ├── app/
│   │   ├── app.dart                  # Root MaterialApp.router widget
│   │   ├── config/
│   │   │   ├── app_constants.dart    # Storage keys, UI dimensions, default coordinates
│   │   │   └── env_config.dart       # Typed environment variable accessors
│   │   ├── router/
│   │   │   ├── app_router.dart       # GoRouter declarative routes & role-based redirects
│   │   │   ├── route_paths.dart      # URL path constants
│   │   │   └── router_refresh_notifier.dart # Reactive auth change listener
│   │   └── theme/
│   │       ├── app_colors.dart       # FoodIQ signature red (#E23744), orange (#FC8019), tokens
│   │       ├── app_typography.dart   # Outfit (Headings) + Inter (Body text)
│   │       ├── app_theme.dart        # Light & Dark Material 3 ThemeData
│   │       └── glass_decoration.dart # Frosted glassmorphic card container
│   │
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart       # Centralized Dio wrapper (GET, POST, PUT, PATCH, DELETE)
│   │   │   ├── api_endpoints.dart    # Exact REST endpoints matching Spring Boot inventory
│   │   │   └── api_response.dart     # Generic ApiResponse<T> deserializer
│   │   ├── errors/
│   │   │   ├── app_exception.dart    # Typed domain exceptions
│   │   │   ├── failure.dart          # Failure objects for domain logic
│   │   │   └── error_handler.dart    # Centralized Dio error parser and user message mapper
│   │   ├── network/
│   │   │   ├── network_info.dart     # ConnectivityPlus connectivity checker
│   │   │   └── interceptors/
│   │   │       ├── auth_interceptor.dart # Injects Bearer token; handles 401 session expiry
│   │   │       └── logging_interceptor.dart # Sanitized console logging (passwords/tokens redacted)
│   │   ├── storage/
│   │   │   ├── secure_storage_service.dart # FlutterSecureStorage (Keystore/Keychain)
│   │   │   └── local_storage_service.dart  # SharedPreferences for non-sensitive cache
│   │   ├── utils/
│   │   │   ├── currency_formatter.dart # Indian Rupee (₹) formatting
│   │   │   ├── date_formatter.dart     # Relative and absolute timestamps
│   │   │   ├── debouncer.dart          # Debounce timer for autocomplete search
│   │   │   └── haversine.dart          # Client-side Haversine distance & ETA calculation
│   │   ├── websocket/
│   │   │   ├── stomp_service.dart      # STOMP over WebSocket client with auto-reconnect
│   │   │   └── websocket_state.dart    # Connected, Disconnected, Reconnecting states
│   │   └── widgets/
│   │       ├── app_button.dart         # Primary, secondary, outline, loading buttons
│   │       ├── app_card.dart           # Elevated rounded container with border
│   │       ├── app_text_field.dart     # Outlined text field with floating label
│   │       ├── empty_state_view.dart   # Reusable empty state with call-to-action
│   │       ├── error_view.dart         # Retryable error card
│   │       ├── foodiq_logo.dart        # Gradient brand logo with Outfit typography
│   │       ├── loading_skeleton.dart   # Smooth pulse shimmer placeholder
│   │       └── status_badge.dart       # Order status badge & pure veg/non-veg indicator
│   │
│   ├── features/
│   │   ├── onboarding/presentation/
│   │   │   ├── splash_screen.dart      # Branding animation, session restore, role redirect
│   │   │   └── onboarding_screen.dart  # Interactive feature slides with skip/continue
│   │   ├── authentication/
│   │   │   ├── data/
│   │   │   │   ├── datasources/auth_remote_datasource.dart # Calls /auth/login, /auth/register
│   │   │   │   └── repositories/auth_repository_impl.dart  # Token & session persistence
│   │   │   ├── domain/
│   │   │   │   ├── models/auth_tokens.dart # Access & refresh token model
│   │   │   │   ├── models/user_model.dart  # User entity with role parsing
│   │   │   │   └── repositories/auth_repository.dart # Abstract contract
│   │   │   └── presentation/
│   │   │       ├── controllers/auth_controller.dart # Riverpod StateNotifier
│   │   │       ├── controllers/auth_state.dart      # Immutable AuthState
│   │   │       └── screens/
│   │   │           ├── login_screen.dart            # Form, validation, demo role chips
│   │   │           ├── register_screen.dart         # Registration with OTP dispatch
│   │   │           ├── otp_verification_screen.dart # 6-digit OTP entry and resend
│   │   │           └── forgot_password_screen.dart  # Password reset request
│   │   ├── role_selection/presentation/screens/
│   │   │   └── role_portal_screen.dart # Authorized workspace switcher
│   │   ├── customer/presentation/screens/
│   │   │   └── customer_dashboard_shell.dart   # Customer home, bottom nav, categories
│   │   ├── delivery/presentation/screens/
│   │   │   └── delivery_dashboard_shell.dart   # Rider duty toggle, radar orders, run accept
│   │   ├── restaurant/presentation/screens/
│   │   │   └── restaurant_dashboard_shell.dart # Menu stock, KDS tasks, orders, prep plans
│   │   └── admin/presentation/screens/
│   │       └── admin_dashboard_shell.dart      # Live Ops, IAM, Fraud Radar, Finance
│   │
│   └── shared/models/
│       ├── cart_item_model.dart      # Cart item with subtotal calculation
│       ├── menu_item_model.dart      # Dish model with veg/non-veg detection
│       ├── order_model.dart          # Order model matching OrderResponse DTO
│       └── restaurant_model.dart     # Restaurant profile, ratings, delivery time
│
└── test/
    ├── unit/
    │   ├── api_response_test.dart       # Deserialization tests
    │   ├── auth_state_test.dart         # Riverpod state transition tests
    │   ├── currency_formatter_test.dart # ₹ currency format verification
    │   ├── haversine_test.dart          # GPS distance & ETA calculation tests
    │   └── user_model_test.dart         # Role parsing & serialization tests
    └── widget/
        ├── app_button_test.dart         # Widget click & loading indicator tests
        └── foodiq_logo_test.dart        # Branding component rendering tests
```

---

## 3. Key Architecture Modules Detail

### 3.1 Network Layer (`ApiClient` & `AuthInterceptor`)
- **Base Client:** Dio instance configured with connection timeout (20s) and receive timeout (25s).
- **Security:** `AuthInterceptor` automatically retrieves the hardware-encrypted JWT access token from `SecureStorageService` and attaches `Authorization: Bearer <token>`.
- **Session Expiry:** Intercepts `401 Unauthorized` responses from Spring Boot, wipes stale tokens, and automatically redirects the user to the login screen.
- **Data Protection:** `SafeLoggingInterceptor` redacts passwords, payment tokens, and sensitive headers from all console logs.

### 3.2 Authentication & Role-Based Navigation
- **State Management:** Riverpod `StateNotifier<AuthState>` manages `initial`, `loading`, `authenticated`, `unauthenticated`, and `error` states.
- **Role Enforcement:** Supported roles parsed from the backend:
  - `CUSTOMER`
  - `DELIVERY_PARTNER`
  - `RESTAURANT_OWNER` / `BRANCH_MANAGER` / `CASHIER` / `KITCHEN_STAFF`
  - `ADMIN` / `SUPER_ADMIN` / `SUPPORT_EXECUTIVE` / `MODERATOR`
- **GoRouter Guard:** Unauthenticated users attempting to access dashboard routes are redirected to `/login`. Upon authentication, users are automatically routed to their authorized role dashboard shell.

### 3.3 Four Dedicated Role Dashboard Shells
1. **Customer Shell (`CustomerDashboardShell`):**
   - Active delivery location bar.
   - Five-destination bottom navigation: Home, Search, Orders, Cart, Profile.
   - Interactive search bar, cuisine category carousel, and dynamic greetings.
2. **Delivery Partner Console (`DeliveryDashboardShell`):**
   - Live Online/Offline radar toggle.
   - Available delivery run cards with pickup restaurant, customer dropoff location, distance, and payout.
   - One-click run acceptance.
3. **Restaurant Operations Hub (`RestaurantDashboardShell`):**
   - Fast access to Menu Stock toggles, Kitchen Display System (KDS), and Demand Intelligence.
4. **Administrator Ops Center (`AdminDashboardShell`):**
   - System command center for platform metrics, IAM permissions, restaurant approvals, and fraud review.

---

## 4. Test Suite Summary

A comprehensive test suite of 7 test files (5 unit test suites and 2 widget test suites) has been authored:
1. `api_response_test.dart`: Validates successful and error `ApiResponse` deserialization.
2. `currency_formatter_test.dart`: Validates integer and fractional Rupee formatting (`₹150`, `₹149.50`).
3. `haversine_test.dart`: Validates geometric distance calculations and transit ETA formulas.
4. `user_model_test.dart`: Verifies role mapping (`ROLE_CUSTOMER`, `DELIVERY_PARTNER`, `RESTAURANT_OWNER`, `ROLE_ADMIN`).
5. `auth_state_test.dart`: Tests immutable state transitions.
6. `app_button_test.dart`: Verifies button taps, callbacks, and loading spinners.
7. `foodiq_logo_test.dart`: Verifies logo rendering and typography.
