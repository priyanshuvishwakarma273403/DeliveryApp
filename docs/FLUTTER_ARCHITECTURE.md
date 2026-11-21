# FoodIQ – Production-Grade Flutter Mobile Architecture

**Project:** FoodIQ Mobile Application  
**Target Platforms:** Android (minSdkVersion 24, targetSdkVersion 34) & iOS (iOS 14+)  
**Framework:** Flutter (Stable) with Dart 3.x  
**Design Language:** Material 3 with Custom FoodIQ Design System  
**Architecture Pattern:** Clean Architecture with Feature-First Modular Organization

---

## 1. Architectural Philosophy & Layering

The FoodIQ Flutter application is structured according to Clean Architecture principles, ensuring strict separation of concerns, testability, maintainability, and loose coupling between layers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                                │
│   Screens (Widgets) ──► Controllers / Notifiers (Riverpod)             │
│   ViewStates (AsyncValue, Freezed UI States)                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Watches / Calls
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                                    │
│   Use Cases / Interactors                                              │
│   Domain Entities (Immutable Models)                                   │
│   Repository Interfaces (Contracts)                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Implements
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                     │
│   Repository Implementations                                           │
│   Data Sources:                                                        │
│     - Remote: Dio HTTP Client, STOMP WebSocket Client                  │
│     - Local: Flutter Secure Storage (Tokens), Shared Preferences       │
│   DTOs / Data Models (json_serializable / freezed)                     │
│   Mappers (DTO ◄► Domain Entity)                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer Rules:
1. **Domain Layer:** Pure Dart code. No Flutter UI dependencies, no Dio, no Riverpod. Contains business logic, entity models, and abstract repository contracts.
2. **Data Layer:** Handles data retrieval and serialization. Implements repository interfaces, consumes remote APIs via Dio and WebSockets, and caches data locally.
3. **Presentation Layer:** Contains Flutter widgets, page views, and Riverpod StateNotifiers / AsyncNotifiers. UI observes state reactively and delegates user intents to controllers.

---

## 2. Feature-First Directory Structure

```
lib/
├── main.dart                          # App entry point, bootstrap, error zone
├── app/
│   ├── app.dart                       # Root MaterialApp.router widget
│   ├── router/
│   │   ├── app_router.dart            # GoRouter configuration & route definitions
│   │   ├── route_names.dart           # Constants for route paths & names
│   │   └── router_refresh_notifier.dart # Listenable for auth state transitions
│   ├── theme/
│   │   ├── app_colors.dart            # Signature red, accent orange, neutrals
│   │   ├── app_typography.dart        # Outfit for headers, Inter for body
│   │   ├── app_theme.dart             # Light & Dark Material 3 ThemeData
│   │   └── glass_decoration.dart      # Glassmorphic card styling & blur
│   └── config/
│       ├── env.dart                   # Environment variables (Base URL, WS URL)
│       └── app_constants.dart         # Timeouts, limits, pagination defaults
│
├── core/
│   ├── api/
│   │   ├── api_client.dart            # Dio singleton configuration
│   │   ├── api_endpoints.dart         # Path constants matching backend
│   │   ├── api_response.dart          # Generic ApiResponse<T> deserializer
│   │   └── interceptors/
│   │       ├── auth_interceptor.dart  # Injects Bearer token; handles 401
│   │       ├── logging_interceptor.dart # Sanitized HTTP request/response logger
│   │       └── retry_interceptor.dart # Exponential backoff retry on network drops
│   ├── errors/
│   │   ├── exceptions.dart            # ServerException, NetworkException, etc.
│   │   ├── failures.dart              # Failure classes for domain layer
│   │   └── error_handler.dart         # User-friendly error message resolution
│   ├── storage/
│   │   ├── secure_storage_service.dart# Encrypted token storage
│   │   └── local_storage_service.dart # SharedPreferences preferences storage
│   ├── websocket/
│   │   ├── stomp_service.dart         # STOMP over SockJS client lifecycle
│   │   ├── websocket_state.dart       # Connected, Disconnected, Reconnecting
│   │   └── websocket_events.dart      # OrderUpdateEvent, LocationUpdateEvent
│   ├── utils/
│   │   ├── currency_formatter.dart    # ₹ currency formatting
│   │   ├── date_time_utils.dart       # Relative timestamps, ETA calculation
│   │   ├── haversine_calculator.dart  # Client distance calculation
│   │   └── debounce.dart              # Search debounce helper
│   └── widgets/
│       ├── app_button.dart            # Primary/Secondary animated buttons
│       ├── app_text_field.dart        # Custom outlined input with floating label
│       ├── restaurant_card.dart       # Premium restaurant card with rating & tags
│       ├── food_item_card.dart        # Veg/Non-veg dish card with add stepper
│       ├── glass_card.dart            # Translucent frosted container
│       ├── loading_skeleton.dart      # Shimmer placeholder skeleton
│       ├── empty_state_view.dart      # Clean empty state with action button
│       ├── error_view.dart            # Retryable error card
│       └── live_status_badge.dart     # Order status chip (Preparing, On the way)
│
└── features/
    ├── onboarding/                    # Splash, welcome slides, permissions
    ├── auth/                          # Login, Register, OTP verify, Forgot password
    ├── location/                      # Location detection, address picker, saved addresses
    ├── home/                          # Home feed, banners, stories, cuisine categories
    ├── restaurants/                   # Restaurant directory, search, filters, details
    ├── menu/                          # Menu catalog, categories, dish detail modal
    ├── search/                        # Universal search, autocomplete, voice search
    ├── cart/                          # Persistent server cart, quantity, combos, allergies
    ├── checkout/                      # Address select, pricing breakdown, idempotency
    ├── payments/                      # Payment selection, transaction routing, success/failure
    ├── orders/                        # My orders list, cancellation, reorder
    ├── tracking/                      # Live STOMP order tracking, GPS map, ETA countdown
    ├── profile/                       # User profile, 12 account tabs, allergy guardian
    ├── taste_dna/                     # AI Taste DNA visualization and editing
    ├── wallet/                        # FoodIQ Coins balance, scratch cards, rewards
    ├── ai_concierge/                  # Conversational AI assistant & food chat
    ├── reviews/                       # Star ratings and written review submission
    ├── support/                       # Support tickets, dispute reporting, live thread
    └── notifications/                 # In-app notification inbox & preferences
```

---

## 3. State Management with Riverpod 2.x

FoodIQ utilizes `flutter_riverpod` (v2.x) with code-generation and `AsyncNotifier` patterns:

1. **Global Authentication State (`auth_provider.dart`):**
   - Stores authenticated user profile (`UserEntity`) and JWT tokens.
   - Listens to token expiration and provides reactive `isAuthenticated` state to GoRouter.
2. **Server Cart State (`cart_provider.dart`):**
   - Automatically synchronizes cart modifications with `/api/cart`.
   - Recalculates optimistic client totals while verifying against `/api/finance/checkout`.
3. **Live Order Tracking State (`order_tracking_provider.dart`):**
   - Subscribes to STOMP destination `/topic/order/{customerId}` and `/topic/location/{orderId}`.
   - Merges real-time GPS stream (`LocationMessage`) with Order Brain Digital Twin REST state.
4. **Restaurant & Menu Feeds:**
   - Managed via `AsyncNotifierProvider` with auto-dispose and family caching for optimal memory footprint.

---

## 4. Navigation & Routing (GoRouter)

GoRouter is configured with deep-linking support, declarative URL structures, and redirection guards:

- `/splash` – Splash screen, token restoration, permission verification.
- `/onboarding` – Carousel of FoodIQ highlights.
- `/login` & `/register` & `/verify-otp` – Authentication flow.
- `/home` – Core consumer landing screen.
- `/restaurants` – Restaurant discovery directory with query filter support (`?cuisine=...&search=...`).
- `/restaurants/:id` – Restaurant detail and menu.
- `/search` – Universal search screen with instant autocomplete.
- `/cart` – Cart review screen.
- `/checkout` – Multi-step checkout (Guarded: `ROLE_CUSTOMER`).
- `/orders` – Customer order history.
- `/orders/:id` – Real-time tracking screen with live GPS map.
- `/profile` – Profile & account dashboard.
- `/profile/taste` – AI Taste DNA visualizer.
- `/wallet` – Coins balance & scratch cards.
- `/support` – Support dispute tickets.
- `/ai-chat` – Dedicated Food Concierge conversational screen.
- `/notifications` – Notification inbox.
- `/delivery/dashboard` – Rider console (Guarded: `ROLE_DELIVERY_PARTNER`).

---

## 5. Network & Security Architecture

### 5.1 HTTP Client (Dio) Configuration
- **Base URL:** Dynamic configuration defaulting to `http://10.0.2.2:8080/api` for Android Emulator, `http://localhost:8080/api` for iOS, and `https://deliveryapp-wwx8.onrender.com/api` for production.
- **Timeouts:** Connect Timeout: 15 seconds; Receive Timeout: 25 seconds.
- **Interceptors:**
  - `AuthInterceptor`: Injects `Authorization: Bearer <accessToken>`. On receiving `401 Unauthorized`, clears local tokens and triggers auth state redirection to `/login`.
  - `LoggingInterceptor`: Safely logs requests and response codes, redacting passwords, tokens, and payment secrets.
  - `RetryInterceptor`: Implements retry with exponential backoff on network connectivity interruptions.

### 5.2 Secure Token Storage
- Access tokens, refresh tokens, and sensitive authentication headers are stored exclusively in hardware-backed storage via `flutter_secure_storage` (Android Keystore / iOS Keychain).
- Plain `SharedPreferences` is reserved strictly for non-sensitive data (theme preference, onboarding viewed flag, cached city name).

---

## 6. Real-Time STOMP WebSocket Client

### Protocol Implementation
- Integrated using `stomp_dart_client` with SockJS URL formatting (`/api/ws`).
- **Connection Lifecycle:**
  - Connects upon user authentication.
  - Passes JWT token in STOMP `CONNECT` headers: `{'Authorization': 'Bearer $token'}`.
  - Auto-reconnects with exponential backoff (2s, 4s, 8s up to 30s) on network disconnect.
  - Automatically re-subscribes to active order tracking channels on connection restoration.
  - Background/Foreground handling: Pauses high-frequency location rendering when the app is in the background to save battery; requests immediate state sync via REST upon resuming foreground.

---

## 7. Design System & Theming

- **Material 3 Theme:** `useMaterial3: true`.
- **Primary Color:** `#E23744` (FoodIQ Red).
- **Secondary Color:** `#FC8019` (Accent Orange).
- **Surface & Elevation:** Card surfaces with rounded corners (`16dp` and `24dp`), subtle borders (`1dp` of `#E8E8E8`), and soft elevation shadows.
- **Typography:**
  - Headlines: `Outfit` (Bold, ExtraBold, Black).
  - Body & Captions: `Inter` (Regular, Medium, SemiBold).
- **Components:** Custom reusable widgets ensuring pixel-perfect parity with the React web application while adhering to native iOS and Android touch ergonomics.
