# FoodIQ – Website-to-Mobile Feature Parity Matrix

**Audit Baseline:** Existing FoodIQ React Website (`frontend/src`) & Spring Boot Backend (`foodDelivery`)  
**Target:** FoodIQ Production Flutter Application  
**Status Legend:**
- **Complete:** Fully integrated with real backend API contracts.
- **Pending Implementation:** Designed and ready for Flutter implementation.
- **Backend Ready:** Backend endpoint exists, verified, and ready for mobile consumption.
- **Requires Extension:** Backend requires minor addition (documented in `MISSING_BACKEND_CAPABILITIES.md`).

---

| # | Website Feature | Existing Implementation Location | Existing API Endpoint | Flutter Screen / Component | Backend Integration Status | Implementation Status | Missing Dependencies / Notes |
|---|---|---|---|---|---|---|---|
| **1** | Splash & App Initialization | `frontend/src/App.jsx` | `/api/health/ping` | `SplashScreen` | Backend Ready | Planned (Phase 2) | Initializes theme, restores token, checks health. |
| **2** | Onboarding Carousel | `frontend/src/pages/Home.jsx` (Hero) | None (Local config) | `OnboardingScreen` | Local State | Planned (Phase 2) | Introduction to FoodIQ features, location/push permissions. |
| **3** | Email / Password Login | `frontend/src/pages/Login.jsx` | `POST /api/auth/login` | `LoginScreen` | Backend Ready | Planned (Phase 2) | Returns JWT accessToken, refreshToken, UserResponse. |
| **4** | User Registration | `frontend/src/pages/Register.jsx` | `POST /api/auth/register` | `RegisterScreen` | Backend Ready | Planned (Phase 2) | Requires 6-digit OTP verification. |
| **5** | Email OTP Verification | `frontend/src/components/common/OtpVerification.jsx` | `POST /api/auth/send-otp` | `OtpVerificationDialog` | Backend Ready | Planned (Phase 2) | Sends 6-digit verification code. |
| **6** | Google OAuth Login | `frontend/src/pages/Login.jsx` (`@react-oauth/google`) | `POST /api/auth/google` | `SocialLoginButtons` | Backend Ready | Planned (Phase 2) | Passes Google idToken to backend verification. |
| **7** | JWT Refresh & Session Expiry | `frontend/src/api/axios.js` (401 interceptor) | Spring Security EntryPoint | `AuthInterceptor` (Dio) | Backend Ready | Planned (Phase 2) | Auto logout and redirect to login on token expiration. |
| **8** | Device Location Detection | `frontend/src/store/locationStore.js` | Browser Geolocation API | `LocationService` (geolocator) | Native Sensor | Planned (Phase 3) | Requests device GPS permission; gets lat/lng. |
| **9** | Delivery Location Selector | `frontend/src/components/layout/LocationModal.jsx` | `/api/restaurants/city/{city}` | `LocationPickerBottomSheet` | Backend Ready | Planned (Phase 3) | Allows manual city/address selection and serviceability check. |
| **10** | Promotional Hero Banners | `frontend/src/pages/Home.jsx` (`HERO_THEMES`) | `/api/recommendations/home` | `HeroThemeCarousel` | Backend Ready | Planned (Phase 3) | Category-specific dynamic banner images and themes. |
| **11** | Food Cuisine Categories | `frontend/src/components/home/CategoryTabs.jsx` | `/api/menu/all`, `/api/restaurants` | `CuisineCategoriesBar` | Backend Ready | Planned (Phase 3) | Pizza, Burger, Biryani, North Indian, Healthy, etc. |
| **12** | Offer Slider & Campaigns | `frontend/src/components/home/OfferSlider.jsx` | `/api/recommendations/campaigns` | `OfferSliderWidget` | Backend Ready | Planned (Phase 3) | Discount banners (e.g. 50% OFF, Free Delivery). |
| **13** | Food Showcase Stories | `frontend/src/components/home/Stories.jsx` | Static / Media API | `StoriesBarWidget` | Backend Ready | Planned (Phase 3) | Instagram-style story viewer for dishes & restaurants. |
| **14** | Top-Rated Restaurants Feed | `frontend/src/pages/Home.jsx` | `GET /api/restaurants` | `RestaurantListWidget` | Backend Ready | Planned (Phase 3) | Paginated list with rating, delivery time, image, price. |
| **15** | AI Personalized Recommendations | `frontend/src/components/home/HomeRecommendations.jsx` | `GET /api/v1/recommendations/home` | `RecommendationsCarousel` | Backend Ready | Planned (Phase 3) | Sections for Frequent Reorders, Trending, Weather Meals. |
| **16** | AI Mood-Based Search | `frontend/src/components/ai/MoodSearch.jsx` | `POST /api/v1/discovery/query` | `MoodSearchSection` | Backend Ready | Planned (Phase 3) | Filters menu by emotional context (Late night, Detox, Party). |
| **17** | Universal Search & Autocomplete | `frontend/src/pages/UniversalSearch.jsx` | `GET /api/search/universal`, `/api/search/autocomplete` | `UniversalSearchScreen` | Backend Ready | Planned (Phase 3) | Debounced search across dishes, restaurants, and cuisines. |
| **18** | Search Query History | `frontend/src/pages/UniversalSearch.jsx` | `GET/POST/DELETE /api/search/history` | `SearchHistoryWidget` | Backend Ready | Planned (Phase 3) | User recent search term persistence. |
| **19** | Voice Search | `frontend/src/components/layout/Header.jsx` | `POST /api/search/voice` | `VoiceSearchButton` | Backend Ready | Planned (Phase 3) | Audio recording transcribed by Whisper Groq API. |
| **20** | Restaurant Profile & Metadata | `frontend/src/pages/RestaurantDetail.jsx` | `GET /api/restaurants/{id}` | `RestaurantDetailScreen` | Backend Ready | Planned (Phase 3) | Address, ratings, phone, opening hours, delivery charges. |
| **21** | Restaurant Menu Categorized | `frontend/src/pages/RestaurantDetail.jsx` | `GET /api/menu/restaurant/{id}` | `MenuCategorySection` | Backend Ready | Planned (Phase 3) | Sticky category tabs and grouped menu items. |
| **22** | Dish Item Card & Veg/Non-Veg Tag | `frontend/src/pages/RestaurantDetail.jsx` | `MenuItemResponse` | `FoodItemCard` | Backend Ready | Planned (Phase 3) | Green Veg square vs. Red Non-Veg triangle, price, image. |
| **23** | Dish Detail & Customization Modal | `frontend/src/components/restaurant/FoodDetailModal.jsx` | `MenuItemResponse` | `FoodDetailBottomSheet` | Backend Ready | Planned (Phase 3) | Full image, description, allergen tags, add-ons. |
| **24** | Real-Time Stock Availability | `frontend/src/components/restaurant/StockIndicator.jsx` | `MenuItemResponse.available` | `StockIndicator` | Backend Ready | Planned (Phase 3) | Disables Add button when `available == false`. |
| **25** | Customer Reviews & Ratings | `frontend/src/components/restaurant/ReviewSection.jsx` | `GET/POST /api/reviews` | `ReviewsBottomSheet` | Backend Ready | Planned (Phase 6) | Read reviews, submit star ratings and comments. |
| **26** | Server-Synchronized Cart | `frontend/src/pages/Cart.jsx`, `useCartStore` | `GET/POST/PUT/DELETE /api/cart/**` | `CartScreen` | Backend Ready | Planned (Phase 4) | Adds items, changes quantity, clears cart on server. |
| **27** | Single Restaurant Validation | `frontend/src/pages/Cart.jsx` | `CartController.java` | `CartValidationService` | Backend Ready | Planned (Phase 4) | Prompts user before replacing cart from another restaurant. |
| **28** | Dynamic Combos Suggestion | `frontend/src/pages/Cart.jsx` | `GET /api/recommendations/combos` | `CombosCarousel` | Backend Ready | Planned (Phase 4) | Suggests beverages and desserts matching active cart. |
| **29** | Allergy Guardian Risk Checker | `frontend/src/pages/Cart.jsx` | User Allergens vs. Item keywords | `AllergyWarningBanner` | Client + Backend Ready | Planned (Phase 4) | Warns when peanut, dairy, gluten, meat items are in cart. |
| **30** | Authoritative Checkout Calculation | `frontend/src/pages/Checkout.jsx` | `GET /api/finance/checkout` | `CheckoutPriceSummary` | Backend Ready | Planned (Phase 4) | Server provides subtotal, CGST, SGST, delivery fee, platform fee. |
| **31** | Idempotent Order Placement | `frontend/src/pages/Checkout.jsx` | `POST /api/orders` | `CheckoutController` | Backend Ready | Planned (Phase 4) | Converts cart into placed order; generates order ID. |
| **32** | Payment Transaction Routing | `frontend/src/pages/Checkout.jsx` | `POST /api/finance/pay` | `PaymentScreen` | Backend Ready | Planned (Phase 4) | Supports UPI, Cards, Net Banking, COD with Idempotency-Key. |
| **33** | Scratch Cards & Coin Rewards | `frontend/src/components/rewards/ScratchCard.jsx` | `/api/wallets/user/{id}` | `ScratchCardModal` | Backend Ready | Planned (Phase 4) | Gamified rewards granting FoodIQ Coins after order. |
| **34** | Live Order Tracking Screen | `frontend/src/pages/OrderDetail.jsx` | `GET /api/orders/{id}` | `OrderTrackingScreen` | Backend Ready | Planned (Phase 5) | Displays order status progress bar and delivery milestones. |
| **35** | Real-Time Status via STOMP | `frontend/src/providers/WebSocketProvider.jsx` | `/topic/order/{customerId}` | `OrderTrackingNotifier` | Backend Ready | Planned (Phase 5) | Live status transition push (`CONFIRMED`, `PREPARING`, `OUT`). |
| **36** | Real-Time Rider GPS Stream | `frontend/src/pages/OrderDetail.jsx` | `/topic/location/{orderId}` | `TrackingMapWidget` | Backend Ready | Planned (Phase 5) | Live location markers for Restaurant, Rider, Customer. |
| **37** | Dynamic ETA Calculation | `frontend/src/pages/OrderDetail.jsx` | Haversine + `/api/v1/orders/{id}/twin` | `EtaCountdownWidget` | Backend Ready | Planned (Phase 5) | Real-time countdown to arrival time. |
| **38** | Order Brain Health & Risk | `frontend/src/pages/OrderDetail.jsx` | `GET /api/v1/orders/{id}/health`, `/risks` | `OrderBrainStatusCard` | Backend Ready | Planned (Phase 5) | Shows congestion, weather delays, and recovery options. |
| **39** | Customer Order History | `frontend/src/pages/Orders.jsx` | `GET /api/orders/my` | `OrderHistoryScreen` | Backend Ready | Planned (Phase 5) | List of active and past orders with reorder button. |
| **40** | Order Cancellation | `frontend/src/pages/OrderDetail.jsx` | `DELETE /api/orders/{id}/cancel` | `CancelOrderDialog` | Backend Ready | Planned (Phase 5) | Cancels order if permitted by backend status rules. |
| **41** | Customer Profile Management | `frontend/src/pages/Profile.jsx` | `/api/users/me` (needs extension) | `ProfileScreen` | Requires Extension | Planned (Phase 6) | View and update customer name, phone, email. |
| **42** | Saved Addresses Manager | `frontend/src/store/locationStore.js` | `/api/users/me/addresses` (needs extension) | `AddressesScreen` | Requires Extension | Planned (Phase 6) | Multi-address CRUD (Home, Work, Other). |
| **43** | AI Taste DNA Visualization | `frontend/src/components/profile/TasteDNA.jsx` | `GET/PUT /api/v1/profile/taste` | `TasteDnaScreen` | Backend Ready | Planned (Phase 6) | Spider chart / sliders for Spice, Sweet, Crunch, Healthy. |
| **44** | FoodIQ Wallet & Coins | `frontend/src/pages/WalletDashboard.jsx` | `GET /api/wallets/user/{userId}` | `WalletScreen` | Backend Ready | Planned (Phase 6) | Balance, coin redemption, and ledger transactions. |
| **45** | FoodIQ Gold VIP Membership | `frontend/src/pages/FoodIQGold.jsx` | `POST /api/finance/subscriptions` | `GoldMembershipScreen` | Backend Ready | Planned (Phase 6) | Free delivery subscription tier. |
| **46** | Customer Support Disputes | `frontend/src/pages/Support.jsx` | `GET/POST /api/support/tickets` | `SupportScreen` | Backend Ready | Planned (Phase 6) | Issue submission, dispute tickets, and message threads. |
| **47** | In-App Notification Center | `frontend/src/pages/Notifications.jsx` | `GET /api/notifications/inbox` | `NotificationsScreen` | Backend Ready | Planned (Phase 6) | Filter by All, Orders, Offers with read/unread flags. |
| **48** | Food Concierge AI Chat | `frontend/src/components/common/AiChat.jsx` | `POST /v1/ai/food-concierge/message` | `AiFoodConciergeScreen` | Backend Ready | Planned (Phase 6) | Multi-turn AI assistant with dietary advice & dish search. |
| **49** | Social Foodie Feed | `frontend/src/pages/FoodieFeed.jsx` | `GET /api/social/feed`, `POST /api/social/post` | `FoodieFeedScreen` | Backend Ready | Planned (Phase 6) | Community posts, reviews, and food photography. |
| **50** | Delivery Partner Console | `frontend/src/pages/DeliveryDashboard.jsx` | `/api/delivery/partner/**` | `RiderConsoleScreen` | Backend Ready | Planned (Phase 7) | Dedicated rider dashboard: online radar, self-accept, GPS stream. |
