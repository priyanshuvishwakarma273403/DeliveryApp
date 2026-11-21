# FoodIQ – Website & Existing Codebase Comprehensive Audit

**Project:** FoodIQ (Tomato Food Delivery Platform)  
**Live Website:** https://delivery-app-one-psi.vercel.app/  
**Source Codebases:**
- Frontend: `D:\food_delivery\frontend` (React 19, Vite, Tailwind CSS 4, Zustand, Framer Motion)
- Backend: `D:\food_delivery\foodDelivery\foodDelivery` (Spring Boot 3.2, Java 17, MySQL, MongoDB, Kafka, STOMP WebSockets)
**Audit Date:** November 2026  
**Auditor:** Senior Flutter Architect, Senior Backend Engineer, UI/UX Designer & QA Lead

---

## 1. Executive Summary

FoodIQ (internally codenamed *Tomato*) is a production-grade, multi-tier food delivery ecosystem modeled after tier-1 platforms such as Zomato and Swiggy. The platform features an end-to-end customer journey—from location-based restaurant discovery and AI-powered recommendations to server-calculated checkout, transaction-safe order placement, and live GPS rider tracking via WebSockets. In addition, the platform includes dedicated portals for Delivery Partners, Restaurant Managers, and System Administrators.

The mobile application must achieve 100% functional and visual fidelity with this existing ecosystem, interfacing directly with the existing Spring Boot REST and WebSocket backend without mocking, hardcoding, or altering backend data structures.

---

## 2. Brand Identity & Design System

### 2.1 Color Palette & Theme Tokens
The visual language incorporates a modern, glassmorphic food-tech aesthetic with the following core color tokens defined in `frontend/src/index.css`:

| Token | Hex Value | Semantic Role |
|---|---|---|
| `--color-primary` | `#E23744` | Signature Brand Red (Primary actions, active tabs, error badges) |
| `--color-primary-dark` | `#C12E3A` | Button hover and pressed states |
| `--color-primary-light` | `#EE5B68` | Subtle accents, light tints |
| `--color-secondary` | `#FC8019` | Accent Orange (Swiggy orange, ratings, delivery highlights, warnings) |
| `--color-secondary-dark` | `#E67316` | Orange pressed state |
| `--color-secondary-light` | `#FD9947` | Subtle orange highlights |
| `--color-background` | `#F5F5F5` / `#FFFFFF` | Page canvas (Light mode) / `#0A0A0C` (Dark mode) |
| `--color-card` | `#FFFFFF` / `#16161A` | Elevated surface / Card background |
| `--color-text-primary` | `#1C1C1C` / `#F3F4F6` | Primary headlines, dish names |
| `--color-text-secondary` | `#686B78` / `#9CA3AF` | Supporting descriptions, timestamps, ratings count |
| `--color-status-success` | `#26A541` | Order confirmed, Delivered, Pure Veg badge |
| `--color-status-warning` | `#FC8019` | Pending orders, Rider arriving |
| `--color-status-error` | `#E23744` | Cancelled, Non-Veg badge, Payment failure |
| `--color-status-info` | `#2563EB` | In-transit notifications, Order Brain hints |

### 2.2 Typography
- **Headings & Display:** `Outfit`, sans-serif (800 / 900 font weight, letter-spacing: -0.02em)
- **Body & Controls:** `Inter`, sans-serif (300, 400, 500, 600, 700 font weight)

### 2.3 Surface & Elevation
- **Rounded Corners:** Cards use `border-radius: 16px` (`rounded-2xl`) or `24px` (`rounded-3xl`); pills and buttons use full rounding (`rounded-full` or `rounded-xl`).
- **Shadows:** Subtle ambient elevation (`0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`).
- **Glassmorphism:** Frosted translucent overlays (`backdrop-blur-md`, `bg-white/80` or `bg-black/60`).

---

## 3. Detailed Website Module & Screen Audit

### 3.1 Customer Experience Modules

#### A. Global Navigation & Layout (`Header.jsx`, `Footer.jsx`, `Layout.jsx`)
- **Top Header:** 
  - Brand Logo & Name: FoodIQ with live pulsing indicator.
  - Location Selector: Displays current active address/city with one-click modal opening (`LocationModal.jsx`) and browser GPS trigger (`navigator.geolocation`).
  - Search Input: Interactive search bar triggering live debounced autocomplete (`/api/search/autocomplete?q=...`) and voice search using Web Speech API.
  - Language Selector: Multilingual support (English, Hindi, Spanish).
  - Theme Switcher: Dark / Light toggle.
  - Wallet Badge: Live FoodIQ Coins count (`useWalletStore`).
  - Cart Floating Action / Icon: Live badge showing item count, opening the slide-over `CartDrawer.jsx`.
  - Notification Bell: Live unread count (`/api/notifications/unread-count`), STOMP real-time listener (`/topic/notifications/{userId}`).
  - User Profile Menu: Dropdown with quick links to Profile, Orders, Gold, Wallet, Support, and Logout.
- **Announcement Bar:** Global promotional banner for sales and festival greetings.
- **Floating AI Assistant (`AiChat.jsx`):** Persistent floating chat drawer powered by Groq/Gemini for conversational ordering, diet advice, and order tracking inquiries.
- **Social Proof Toast (`SocialProof.jsx`):** Dynamic real-time toast popups ("Rahul from Noida just ordered Butter Chicken").

#### B. Home Screen (`Home.jsx`)
- **Hero Banner:** Dynamic thematic background based on active category (All, Fresh, Summer, Sweets, Drinks, Bakery, Healthy) with high-res photography, animated badges, and headline "Discover 10,000+ dishes from top-rated kitchens. Freshness delivered in 30 mins."
- **Search & Delivery Location Bar:** Direct inputs for quick address verification and cuisine search.
- **Offer Slider (`OfferSlider.jsx`):** Carousel of promotional discount banners (e.g., 50% OFF up to ₹100, Free Delivery with Gold).
- **Trending Stories (`Stories.jsx`, `StoryViewer.jsx`):** Instagram-style video/image story bubbles showing food showcases and restaurant features.
- **Live Stats Bar:** Displaying total live restaurants (2000+), dishes (10,000+), average delivery time (30 min), and average rating (4.5★).
- **Cuisine Discovery ("What's on your mind?"):** Horizontal scrollable circular category items (Biryani, Pizza, Burger, North Indian, Chinese, Desserts, Rolls, South Indian, Healthy, Thali).
- **Category Tabs (`CategoryTabs.jsx`):** Filter by Delivery, Dining Out, Nightlife, and Quick Orders.
- **AI Mood Search (`MoodSearch.jsx`):** Mood-based selector (e.g., "Late night craving", "Healthy detox", "Party mood", "Comfort food") mapping to dynamic taste tags.
- **Personalized Recommendations (`HomeRecommendations.jsx`):** Fetches personalized carousels from `/api/v1/recommendations/home` (Reorder favorites, Trending in your city, Weather-based comfort foods).
- **Top-Rated Restaurants Listing:** Grid of restaurant cards with image, discount tag, average delivery time, rating badge, cuisine types, minimum order, and location.
- **Empty / Error States:** Graceful handling of backend cold-start delays (Render free-tier 30s warmup notice) with skeleton loaders.

#### C. Restaurant Discovery & Listing (`Restaurants.jsx`)
- **Filter Bar:**
  - Pure Veg toggle (`isVeg=true`)
  - Rating filter (4.0+ stars)
  - Delivery time (< 30 mins)
  - Cost for two (Low to High, High to Low)
  - Cuisine multi-select
  - Sorting: Relevance, Delivery Time, Rating, Cost.
- **Grid / List Views:** Responsive layout showing operational status (Open/Closed), delivery estimate, and distance.

#### D. Restaurant Details & Menu (`RestaurantDetail.jsx`)
- **Restaurant Header:** Cover image banner, restaurant name, verified badge, full address, phone number, operating hours, average delivery duration, and minimum order threshold.
- **Digital Twin & Kitchen Vision Integration:** Displays real-time kitchen load status and predicted preparation time.
- **Category Menu Navigation:** Sticky category tabs (Appetizers, Main Course, Breads, Beverages, Desserts).
- **Menu Item Cards:**
  - Dish name, price, detailed description.
  - Pure Veg (green square with dot) vs. Non-Veg (red triangle/square) indicator.
  - Image thumbnail with Cloudinary optimization.
  - Stock indicator (`StockIndicator.jsx`): Real-time out-of-stock badge when `available == false`.
  - Add to Cart button with increment/decrement steppers when already in cart.
  - Food Detail Modal (`FoodDetailModal.jsx`): Detailed dish view with allergen tags, nutritional breakdown, and customization options.
- **Customer Reviews Section (`ReviewSection.jsx`):** Real-time reviews fetched from `/api/reviews/restaurant/{id}`, rating breakdown, and review submission form.

#### E. Search Experience (`UniversalSearch.jsx`)
- **Universal Multi-Entity Search:** Unified query input supporting Restaurants, Dishes, Cuisines, and Categories.
- **Backend Endpoints:**
  - `/api/search/universal?q={query}&types=RESTAURANT,MENU_ITEM&sortBy=relevance&lat={lat}&lon={lon}`
  - `/api/search/autocomplete?q={prefix}`
- **Search History:** Synced with `/api/search/history` with delete and clear options.
- **Voice Search & Image Search:** Audio transcription search via Groq Whisper and visual food recognition.

#### F. Cart Management (`Cart.jsx`, `CartDrawer.jsx`)
- **Cart Contents:** List of selected items with restaurant validation (ensuring items belong to a single restaurant, with prompt to clear cart if adding from a new restaurant).
- **Quantity Controls:** Real-time increment, decrement, and item removal.
- **Dynamic Combo Recommendations (`/api/recommendations/combos`):** Suggests matching beverages or desserts based on cart contents.
- **Allergy Guardian:** Real-time client & backend inspection matching user's allergens (Peanuts, Dairy, Gluten, Shellfish, Soy, Vegetarian, Vegan) against selected items with high-risk warning banners.
- **Green Delivery & No Cutlery Toggles:** Options for eco-friendly packaging and zero-plastic delivery.
- **Price Breakdown:**
  - Subtotal
  - Delivery fee (dynamic based on threshold and Gold status)
  - Taxes (5% GST)
  - Eco/Green courier fee (₹5)
  - Coin redemption discount (`CoinRedeemer.jsx`)
  - Final payable amount.

#### G. Checkout & Payment Flow (`Checkout.jsx`)
- **Multi-Step Checkout Stepper:**
  1. *Step 1: Delivery Address* – Select saved address (Home, Work, Other), add new address, or enter custom delivery instructions.
  2. *Step 2: Payment Method* – UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, FoodIQ Wallet, and Cash on Delivery.
  3. *Step 3: Review & Schedule* – Order breakdown review, schedule for later (ASAP vs. specific time), coin deduction toggle.
- **Backend Price Verification:** Calls `/api/finance/checkout` to obtain the authoritative, tamper-proof bill breakdown (CGST, SGST, packaging fee, delivery fee, platform fee).
- **Idempotent Order Placement:**
  - Syncs cart items to backend `/api/cart`.
  - Places order via `POST /api/orders` with `OrderRequest`.
  - Initiates payment via `POST /api/finance/pay` with HTTP header `Idempotency-Key: PAY-{orderId}-{timestamp}`.
- **Gamified Rewards (`ScratchCard.jsx`, `CoinRewardPopup.jsx`):** On successful order completion, generates a scratch card awarding FoodIQ coins.

#### H. Real-Time Order Tracking & Order Detail (`OrderDetail.jsx`)
- **Order State Machine:**
  - `PLACED` → `CONFIRMED` → `PREPARING` (`FOOD_READY` / `READY_FOR_PICKUP`) → `OUT_FOR_DELIVERY` → `DELIVERED` (or `CANCELLED`).
- **Real-Time WebSocket Integration:**
  - Connects to `/api/ws` with SockJS and STOMP.
  - Subscribes to `/topic/order/{customerId}` for live status state changes.
  - Subscribes to `/topic/location/{orderId}` for continuous rider GPS updates (`{ latitude, longitude, status }`).
- **Interactive Map (`LiveMap.jsx` / `GoogleLiveMap.jsx`):** Displays restaurant pin, customer delivery pin, and moving rider icon with dynamic route polyline.
- **Dynamic ETA Countdown:** Computes remaining arrival time using Haversine distance and Order Brain ETA predictions (`/api/v1/orders/{id}/twin`).
- **Order Brain Digital Twin (`/api/v1/orders/{id}/health`, `/timeline`, `/risks`, `/recovery`):** Shows health snapshot, weather/traffic delay risks, and active recovery options (item substitution if out of stock, delay compensation).
- **AI Delivery Assistant Chat:** Embedded conversational widget to query rider ETA and delivery status.

#### I. Customer Profile & Account Management (`Profile.jsx`)
Features a 12-section tabbed portal:
1. *My Profile:* View and edit name, email, phone number, and avatar.
2. *Orders:* Complete active and past order history with one-click reorder and status inspection.
3. *Favorites:* Saved restaurants and dishes.
4. *Addresses:* Multi-address manager (Home, Office, Other) with edit and delete capabilities.
5. *Allergy Guardian:* Toggle personal dietary restrictions (Vegetarian, Vegan) and allergens (Peanuts, Dairy, Gluten, Shellfish, Soy) to automatically warn against conflicting cart items.
6. *AI Taste DNA (`TasteDNA.jsx`):* Personalized taste profile visualization (Spice tolerance, Sweet tooth, Crunch factor, Health focus) syncing with `/api/v1/profile/taste`.
7. *Wallet & Cashback (`WalletTab.jsx`, `WalletDashboard.jsx`):* Balance display, coins history, coin redemption, and transaction log.
8. *Table Bookings (`TableBookingTab.jsx`):* Dine-in table reservations.
9. *Bulk & Catering (`CateringTab.jsx`):* Event and bulk food ordering requests.
10. *Help & Disputes (`HelpSupportTab.jsx`, `Support.jsx`):* Live dispute submission, ticket tracking, and chat history (`/api/support/tickets`).
11. *Security & Sessions:* Active device sessions, login history, and password change.
12. *Settings:* Push notification preferences, language, and theme.

#### J. FoodIQ Gold VIP Membership (`FoodIQGold.jsx`)
- VIP membership landing page outlining benefits: Unlimited free delivery on orders above ₹199, up to 30% extra discounts, VIP priority customer support, and exclusive partner dining perks.
- Subscriptions managed through `/api/finance/subscriptions`.

#### K. Foodie Feed (`FoodieFeed.jsx`) & Social Features (`SocialController.java`)
- Community feed displaying food photos, restaurant reviews, and user posts.
- Interacts with `/api/social/feed` and `POST /api/social/post`.

---

### 3.2 Role-Based Portals

#### A. Delivery Partner Console (`DeliveryDashboard.jsx`)
- **Duty Toggle:** Online / Offline switch with sound chime and pulse radar.
- **Available Orders Radar:** Real-time polling and listing of pending orders ready for pickup (`/api/delivery/partner/available`).
- **Order Acceptance:** One-click order accept (`POST /api/delivery/partner/order/{id}/accept`).
- **Delivery Lifecycle Actions:**
  - Arrived at Restaurant
  - Pickup Order (`POST /api/delivery/partner/order/{id}/pickup`)
  - Out for Delivery
  - Complete Delivery (`POST /api/delivery/partner/order/{id}/deliver`)
- **GPS Location Broadcaster:** Periodically sends live coordinates to backend `/app/location/{orderId}` via STOMP or `POST /api/delivery/partner/order/{orderId}/location`.
- **Rider Earnings & Payouts:** Weekly earnings breakdown, tips, and instant payout triggers.

#### B. Restaurant Management Suite
- **Owner Dashboard (`OwnerDashboard.jsx`) & Restaurant Portal (`RestaurantPortal.jsx`):** Restaurant profile management, operating hours, menu CRUD operations, and live revenue analytics.
- **Branch Manager Dashboard (`BranchManagerDashboard.jsx`) & Multi-Branch Portal:** Multi-outlet oversight.
- **Kitchen Display System (`KitchenDisplaySystem.jsx`):** Kitchen station task management, prep orders, and mark order ready (`/api/v1/kitchen/{restaurantId}/orders/{orderId}/ready`).
- **Cashier Dashboard (`CashierDashboard.jsx`):** Dine-in bill generation and offline payments.

#### C. Administrator & Intelligence Control Center
- **Admin Dashboard (`AdminDashboard.jsx`):** Platform overview, live orders, total revenue, active riders, and active users.
- **Restaurant Management (`AdminRestaurants.jsx`):** Approve, create, edit, or toggle restaurant status.
- **Order Management (`AdminOrders.jsx`):** Master order table with force-status update and cancellation controls.
- **User & IAM Management (`AdminUsers.jsx`, `AdminSecurityDashboard.jsx`):** Role assignment (`ROLE_CUSTOMER`, `ROLE_DELIVERY_PARTNER`, `ROLE_ADMIN`, `ROLE_SUPPORT_EXECUTIVE`, `ROLE_BRANCH_MANAGER`, `ROLE_KITCHEN_STAFF`).
- **AI & Operations Suites:**
  - *Digital Twin (`AdminDigitalTwin.jsx`)*
  - *Kitchen Vision (`AdminKitchenVision.jsx`)*
  - *Business Forecast & Demand Intelligence (`AdminBusinessForecast.jsx`)*
  - *Trust & Fraud Center (`AdminTrustFraud.jsx`)*
  - *Finance & Settlement Engine (`AdminFinance.jsx`)*
  - *Campaigns & Notifications (`AdminNotifications.jsx`)*

---

## 4. State Management & Data Flow Architecture (Web)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Frontend Tier                             │
├────────────────────────────────────────────────────────────────────────┤
│  Zustand Stores:                                                       │
│  - useAuthStore       (User DTO, JWT Token, Role, Permissions)         │
│  - useCartStore       (Cart items, quantities, restaurant ID, total)   │
│  - useLocationStore   (Current address, coordinates, saved list)       │
│  - useWalletStore     (Coin balance, scratch cards, deductions)        │
│                                                                        │
│  HTTP Client: Axios Instance (`apiClient`)                             │
│  - Base URL: http://localhost:8080/api (or Render production URL)      │
│  - Request Interceptor: Injects `Authorization: Bearer <JWT>`          │
│  - Response Interceptor: Catches 401 Unauthorized -> Clears session    │
│                                                                        │
│  WebSocket Client: SockJS + Stompjs (`WebSocketProvider`)              │
│  - Endpoint: `/api/ws`                                                 │
│  - Topics: `/topic/order/{userId}`, `/topic/location/{orderId}`        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / STOMP WS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Spring Boot 3.2 Monolith API                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Translation Targets for Flutter

To reproduce the web application as a native, high-performance mobile app, the following technology mapping is established:

| Website Component (React) | Flutter Production Equivalent | Justification |
|---|---|---|
| Zustand Stores | **Riverpod (NotifierProvider / AsyncNotifier)** | Compile-time safe, testable, reactive state management |
| React Router DOM (v7) | **GoRouter** | Declarative routing, deep-linking, redirect guards based on auth & role |
| Axios + Interceptors | **Dio + Interceptors** | Robust HTTP client with custom interceptors for Bearer tokens and retry |
| Stompjs + SockJS | **stomp_dart_client** / **web_socket_channel** | Native STOMP over WebSocket supporting SockJS fallback |
| Tailwind CSS 4 | **Material 3 Custom ThemeData** | Standardized ColorScheme, TextTheme (Outfit/Inter), Component themes |
| Lucide React Icons | **lucide_icons** / **Iconsax** / **Material Icons** | Consistent visual icon language matching the website |
| Leaflet / React-Leaflet | **flutter_map** (OpenStreetMap) / **google_maps_flutter** | Performant native map rendering for real-time tracking |
| Framer Motion Animations | **Flutter Implicit & Explicit Animations** | 60/120fps fluid transitions, Hero widgets, Shimmer skeletons |
| LocalStorage / Zustand Persist | **flutter_secure_storage** + **shared_preferences** | Hardware-backed keystore/keychain for tokens; encrypted local cache |
| React Hot Toast | **fluttertoast** / Custom Top SnackBar Overlay | Non-intrusive floating toasts matching web design |
