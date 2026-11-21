# FoodIQ – Complete Backend API & Contract Inventory

**Backend Framework:** Spring Boot 3.2.x (Java 17)  
**Base Context Path:** `/api`  
**Security Model:** Spring Security 6, Stateless JWT (Bearer Authorization Header)  
**Persistence:** MySQL 8 (Transactional entities) + MongoDB Atlas (Catalogs, Menus, Analytics, Logs)  
**Messaging & Real-Time:** Spring STOMP over SockJS (`/api/ws`), Apache Kafka (`email-service-group`, `location-stream`)

---

## 1. Authentication & Identity Management (`/api/auth`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data (`ApiResponse<T>`) | Description |
|---|---|---|---|---|---|
| `POST` | `/api/auth/send-otp` | Public | Query param: `email` (string) | `ApiResponse<Void>` | Dispatches a 6-digit verification code via email. |
| `POST` | `/api/auth/register` | Public | JSON `RegisterRequest`: `{ name, email, password, phone, address, role, otp }` | `ApiResponse<AuthResponse>` (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `user`) | Registers new user account verified by OTP. |
| `POST` | `/api/auth/login` | Public | JSON `LoginRequest`: `{ email, password }` | `ApiResponse<AuthResponse>` (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `user`) | Authenticates email/password and issues JWT tokens. |
| `POST` | `/api/auth/google` | Public | Raw Body string: Google `idToken` | `ApiResponse<AuthResponse>` | Verifies Google OAuth token, creates/logs in user. |

---

## 2. Restaurant Discovery & Catalog (`/api/restaurants`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/restaurants` | Public | `page` (int, default 0), `size` (int, default 20), `city` (string), `search` (string), `cuisine` (string), `minRating` (double) | `ApiResponse<Page<RestaurantResponse>>` | Returns paginated restaurant directory with filtering. |
| `GET` | `/api/restaurants/{id}` | Public | Path param: `id` (string / UUID) | `ApiResponse<RestaurantResponse>` | Returns single restaurant profile, operating status, rating, delivery charge. |
| `GET` | `/api/restaurants/search` | Public | `query` (string) | `ApiResponse<List<RestaurantResponse>>` | Fast query search by restaurant name. |
| `GET` | `/api/restaurants/city/{city}` | Public | Path param: `city` (string) | `ApiResponse<List<RestaurantResponse>>` | Filter restaurants operating in a given city. |
| `POST` | `/api/restaurants` | `ROLE_ADMIN` | JSON `RestaurantRequest` | `ApiResponse<RestaurantResponse>` | Registers a new restaurant profile. |
| `PUT` | `/api/restaurants/{id}` | `ROLE_ADMIN` | Path `id`, JSON `RestaurantRequest` | `ApiResponse<RestaurantResponse>` | Updates restaurant metadata, contact, address. |
| `DELETE` | `/api/restaurants/{id}` | `ROLE_ADMIN` | Path `id` | `ApiResponse<Void>` | Removes restaurant from catalog. |
| `PATCH` | `/api/restaurants/{id}/toggle` | `ROLE_ADMIN` | Path `id` | `ApiResponse<RestaurantResponse>` | Toggles open / closed operating status. |

---

## 3. Menu Items & Catalog Management (`/api/menu`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/menu/restaurant/{restaurantId}` | Public | Path `restaurantId` | `ApiResponse<List<MenuItemResponse>>` | Returns all menu dishes, categories, prices, availability for a restaurant. |
| `GET` | `/api/menu/all` | Public | None | `ApiResponse<List<MenuItemResponse>>` | Returns full global menu catalog. |
| `POST` | `/api/menu/restaurant/{restaurantId}` | `ROLE_ADMIN` | Path `restaurantId`, JSON `MenuItemRequest` | `ApiResponse<MenuItemResponse>` | Adds a new dish to a restaurant menu. |
| `PUT` | `/api/menu/{itemId}` | `ROLE_ADMIN` | Path `itemId`, JSON `MenuItemRequest` | `ApiResponse<MenuItemResponse>` | Updates dish price, name, image, description. |
| `DELETE` | `/api/menu/{itemId}` | `ROLE_ADMIN` | Path `itemId` | `ApiResponse<Void>` | Deletes dish from restaurant menu. |
| `PATCH` | `/api/menu/{itemId}/toggle` | `ROLE_ADMIN` | Path `itemId` | `ApiResponse<MenuItemResponse>` | Toggles in-stock / out-of-stock availability. |

---

## 4. Server-Side Cart Management (`/api/cart`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/cart` | `ROLE_CUSTOMER` | Authenticated principal | `ApiResponse<CartResponse>` (`id`, `restaurantId`, `restaurantName`, `items`, `totalPrice`, `totalItems`) | Retrieves customer's persistent server cart. |
| `POST` | `/api/cart/items` | `ROLE_CUSTOMER` | JSON `CartItemRequest`: `{ menuItemId, quantity }` | `ApiResponse<CartResponse>` | Adds dish to cart or increments quantity. Validates single restaurant constraint. |
| `PUT` | `/api/cart/items/{menuItemId}` | `ROLE_CUSTOMER` | Path `menuItemId`, param: `quantity` (int) | `ApiResponse<CartResponse>` | Modifies quantity of a dish in the active cart. |
| `DELETE` | `/api/cart/items/{menuItemId}` | `ROLE_CUSTOMER` | Path `menuItemId` | `ApiResponse<CartResponse>` | Removes dish from cart. |
| `DELETE` | `/api/cart` | `ROLE_CUSTOMER` | Authenticated principal | `ApiResponse<Void>` | Clears all items in customer's cart. |

---

## 5. Order Management & Orchestration (`/api/orders`, `/api/v1/orders`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `POST` | `/api/orders` | `ROLE_CUSTOMER` | JSON `OrderRequest`: `{ deliveryAddress, paymentMethod, specialInstructions, paymentToken, useCoins }` | `ApiResponse<OrderResponse>` | Converts active server cart into a placed order (`status: PLACED`). Broadcasts WS updates. |
| `GET` | `/api/orders/my` | `ROLE_CUSTOMER` | Authenticated user | `ApiResponse<List<OrderResponse>>` | Returns customer's active and historical orders. |
| `GET` | `/api/orders/{id}` | Customer (Own) / Admin / Rider | Path param: `id` (Long) | `ApiResponse<OrderResponse>` | Retrieves full order details, delivery status, items, billing breakdown. |
| `DELETE` | `/api/orders/{id}/cancel` | Customer / Admin | Path param: `id` (Long) | `ApiResponse<OrderResponse>` | Cancels order according to policy (`status: CANCELLED`). |
| `GET` | `/api/orders` | `ROLE_ADMIN` | None | `ApiResponse<List<OrderResponse>>` | Master order audit list for administrative oversight. |
| `GET` | `/api/orders/restaurant/{restaurantId}` | Admin / Restaurant | Path param: `restaurantId` | `ApiResponse<List<OrderResponse>>` | Orders placed at a specific restaurant branch. |
| `PATCH` | `/api/orders/{id}/status` | Admin / Restaurant | Path `id`, Query param: `status` | `ApiResponse<OrderResponse>` | Manual status override (`CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, etc.). |
| `GET` | `/api/v1/orders/{orderId}/twin` | Customer / Admin | Path `orderId` | `ApiResponse<OrderDigitalTwin>` | Order Brain digital twin: estimated delivery countdown, kitchen status. |
| `GET` | `/api/v1/orders/{orderId}/health` | Customer / Admin | Path `orderId` | `ApiResponse<OrderHealthSnapshot>` | Health snapshot of delivery progress and latency alerts. |
| `GET` | `/api/v1/orders/{orderId}/timeline` | Customer / Admin | Path `orderId`, Query: `customerOnly` (bool) | `ApiResponse<List<OrderOperationalTimeline>>` | Granular operational milestone log. |
| `GET` | `/api/v1/orders/{orderId}/risks` | Customer / Admin | Path `orderId` | `ApiResponse<List<OrderRisk>>` | Weather, traffic, and kitchen congestion risks. |
| `GET` | `/api/v1/orders/{orderId}/recovery` | Customer / Admin | Path `orderId` | `ApiResponse<List<OrderRecoveryAction>>` | Active recovery actions for delayed or disturbed orders. |
| `POST` | `/api/v1/orders/{orderId}/recovery/decision` | Customer / Admin | Path `orderId`, JSON payload | `ApiResponse<Void>` | Customer accepts/rejects replacement dish or coupon. |
| `GET` | `/api/v1/orders/{orderId}/alternatives` | Customer / Admin | Path `orderId`, Query: `menuItemId` | `ApiResponse<List<MenuItemResponse>>` | Suggested substitute items if an ordered dish runs out. |

---

## 6. Delivery Partner Operations (`/api/delivery`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/delivery/partner/my` | `ROLE_DELIVERY_PARTNER` | Authenticated rider | `ApiResponse<DeliveryPartner>` | Returns rider profile, online status, vehicle details, current ratings. |
| `GET` | `/api/delivery/partner/available` | `ROLE_DELIVERY_PARTNER` | None | `ApiResponse<List<OrderResponse>>` | Returns unassigned orders ready for pickup. |
| `POST` | `/api/delivery/partner/order/{orderId}/accept` | `ROLE_DELIVERY_PARTNER` | Path `orderId` | `ApiResponse<DeliveryResponse>` | Rider self-assigns and accepts an order run. |
| `POST` | `/api/delivery/partner/order/{orderId}/pickup` | `ROLE_DELIVERY_PARTNER` | Path `orderId` | `ApiResponse<DeliveryResponse>` | Marks order as picked up from kitchen (`status: OUT_FOR_DELIVERY`). |
| `POST` | `/api/delivery/partner/order/{orderId}/deliver` | `ROLE_DELIVERY_PARTNER` | Path `orderId` | `ApiResponse<DeliveryResponse>` | Completes delivery (`status: DELIVERED`) and settles earnings. |
| `POST` | `/api/delivery/partner/order/{orderId}/location` | `ROLE_DELIVERY_PARTNER` | Path `orderId`, JSON: `{ latitude, longitude }` | `ApiResponse<Void>` | REST endpoint for rider location GPS updates. |
| `POST` | `/api/delivery/assign/{orderId}/partner/{partnerId}` | `ROLE_ADMIN` | Path `orderId`, `partnerId` | `ApiResponse<DeliveryResponse>` | Admin manual dispatch override. |

---

## 7. Finance, Pricing & Payment (`/api/finance`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/finance/checkout` | Customer / Auth | `subtotal` (double), `discount` (double), `coinsUsed` (double), `userId` (Long) | `ApiResponse<Map<String, Object>>` | Authoritative server price breakdown: `subtotal`, `discount`, `cgst`, `sgst`, `packagingCharge`, `deliveryCharge`, `platformFee`, `walletDeduction`, `finalAmount`, `estimatedDeliveryTime`. |
| `POST` | `/api/finance/pay` | Customer / Auth | Header: `Idempotency-Key` (UUID/string), Params: `orderId`, `customerId`, `restaurantId`, `amount`, `walletDeduction`, `paymentMethod`, `gateway` | `ApiResponse<Transaction>` | Executes transaction payment routing. Validates against duplicate submission via idempotency key. |
| `POST` | `/api/finance/subscriptions` | Customer / Auth | Params: `userId`, `planType`, `billingCycle`, `price` | `ApiResponse<Subscription>` | Enrolls user into FoodIQ Gold VIP membership. |
| `POST` | `/api/finance/giftcards/purchase` | Customer / Auth | Params: `purchaserId`, `amount` | `ApiResponse<GiftCard>` | Issues digital gift card with redemption code. |
| `POST` | `/api/finance/giftcards/redeem` | Customer / Auth | Params: `userId`, `code` | `ApiResponse<Map<String, Object>>` | Credits gift card amount to user wallet. |
| `POST` | `/api/finance/refund` | `ROLE_ADMIN` | Params: `transactionId`, `amount`, `channel`, `reason` | `ApiResponse<Refund>` | Initiates customer refund. |
| `POST` | `/api/finance/settle` | `ROLE_ADMIN` | Params: `restaurantId`, `start`, `end` | `ApiResponse<Settlement>` | Calculates restaurant vendor payout batch. |
| `POST` | `/api/finance/payout` | `ROLE_ADMIN` | Params: `driverId`, `start`, `end` | `ApiResponse<Payout>` | Settles weekly driver earnings and bonuses. |

---

## 8. Wallet, Coins & Cashback (`/api/wallets`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/wallets/user/{userId}` | Customer / Auth | Path `userId` (Long) | `ApiResponse<Wallet>` (`balance`, `coins`, `transactions`) | Fetches user wallet balance and FoodIQ reward coins. |

---

## 9. Universal Search & Discovery (`/api/search`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/search/universal` | Public / Auth | `q` (string), `types` (list: RESTAURANT, MENU_ITEM), `sortBy` (relevance, rating, time), `lat` (double), `lon` (double), `page` (int), `limit` (int) | `ApiResponse<List<SearchResultItem>>` | High-speed multi-index search across restaurants, cuisines, and menu items. |
| `GET` | `/api/search/autocomplete` | Public | `q` (string) | `ApiResponse<List<SearchSuggestion>>` | Instant search suggestions as the user types. |
| `GET` | `/api/search/history` | Authenticated User | None | `ApiResponse<List<SearchHistoryItem>>` | Returns user's recent search queries. |
| `POST` | `/api/search/history` | Authenticated User | Query param: `q` | `ApiResponse<Void>` | Records user search query. |
| `DELETE` | `/api/search/history` | Authenticated User | Optional query param: `q` | `ApiResponse<Void>` | Clears specific item or entire user search history. |
| `GET` | `/api/search/trending` | Public | None | `ApiResponse<List<String>>` | Returns trending search keywords across the platform. |
| `POST` | `/api/search/voice` | Authenticated User | Multipart audio file | `ApiResponse<String>` | Transcribes voice search query into text using Whisper Groq. |

---

## 10. AI Taste DNA & Personalization (`/api/v1`, `/v1/users/me`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/v1/recommendations/home` | Public / Auth | Params: `weather`, `timeOfDay`, `location` | `ApiResponse<Map<String, List<TasteRecommendationDto>>>` | Returns personalized home sections: Reorders, Trending, Weather comfort meals. |
| `GET` | `/api/v1/recommendations` | Public / Auth | Params: `weather`, `timeOfDay`, `location`, `budget` | `ApiResponse<List<TasteRecommendationDto>>` | Filtered AI recommendations based on context. |
| `GET` | `/api/v1/recommendations/reorder` | Authenticated User | Authenticated user | `ApiResponse<List<TasteRecommendationDto>>` | Frequent orders and favorite dishes for instant reorder. |
| `GET` | `/api/v1/recommendations/trending` | Public | Param: `location` | `ApiResponse<List<TasteRecommendationDto>>` | Trending dishes in customer's local neighborhood. |
| `GET` | `/api/v1/recommendations/meal` | Public / Auth | Param: `budget` | `ApiResponse<List<TasteRecommendationDto>>` | AI meal builder matching nutritional/budget preferences. |
| `GET` | `/api/v1/profile/taste` | Authenticated User | Authenticated user | `ApiResponse<UserTasteProfile>` | Fetches user's multi-dimensional Taste DNA profile. |
| `PUT` | `/api/v1/profile/taste` | Authenticated User | JSON `UserTasteProfile` | `ApiResponse<UserTasteProfile>` | Updates taste preferences (Spice, Sweet, Healthy, Cuisines). |
| `POST` | `/api/v1/recommendations/feedback` | Public / Auth | JSON payload | `ApiResponse<Void>` | Logs recommendation click/conversion feedback. |
| `POST` | `/api/recommendations/combos` | Public / Auth | Query params: `cartItemIds` | `ApiResponse<List<RecommendationCombo>>` | Generates intelligent food combos (e.g. Burger + Fries + Shake). |
| `GET` | `/v1/users/me/taste-dna` | Authenticated User | Authenticated user | `ApiResponse<Map<String, Object>>` | Detailed Taste DNA dimensions. |
| `DELETE` | `/v1/users/me/taste-data` | Authenticated User | Authenticated user | `ApiResponse<Void>` | Clears taste history and resets recommendation weights. |

---

## 11. Conversational AI Assistant & Food Concierge (`/api/ai`, `/v1/ai`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `POST` | `/api/ai/chat` | Public / Auth | JSON: `{ "message": "string" }` | `ApiResponse<String>` | Legacy conversational assistant response. |
| `GET` | `/api/ai/suggest/{userId}` | Authenticated User | Path `userId` | `ApiResponse<String>` | Instant AI banner suggestion for user. |
| `POST` | `/v1/ai/food-concierge/message` | Authenticated User | JSON `AiMessageRequest` | `ApiResponse<AiMessageResponse>` | Food Concierge multi-turn conversation with tool-calling capabilities. |
| `GET` | `/v1/ai/conversations` | Authenticated User | Authenticated user | `ApiResponse<List<AiConversationSummaryResponse>>` | Lists past AI chat sessions. |
| `GET` | `/v1/ai/conversations/{conversationId}` | Authenticated User | Path `conversationId` (UUID) | `ApiResponse<AIConversation>` | Retrieves full chat transcript for a session. |
| `DELETE` | `/v1/ai/conversations/{conversationId}` | Authenticated User | Path `conversationId` (UUID) | `ApiResponse<Void>` | Deletes AI conversation session. |
| `POST` | `/v1/ai/cart/confirm` | Authenticated User | JSON payload | `ApiResponse<Void>` | Confirms and adds AI-suggested items to cart. |

---

## 12. Customer Support & Disputes (`/api/support`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/support/tickets` | Authenticated User | Authenticated user | `ApiResponse<List<SupportTicket>>` | Retrieves user's tickets (or all tickets for Support Executive/Admin). |
| `POST` | `/api/support/tickets` | Authenticated User | JSON: `{ orderId, type, description }` | `ApiResponse<SupportTicket>` | Creates support ticket with dispute tracking and chat thread. |

---

## 13. Reviews & Ratings (`/api/reviews`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `POST` | `/api/reviews` | Authenticated User | JSON `Review`: `{ restaurantId, menuItemId, rating, comment, ... }` | `Review` | Submits a verified review for a restaurant or food item. |
| `GET` | `/api/reviews/restaurant/{restaurantId}` | Public | Path `restaurantId` | `List<Review>` | Returns all reviews and star ratings for a restaurant. |
| `GET` | `/api/reviews/item/{menuItemId}` | Public | Path `menuItemId` | `List<Review>` | Returns customer reviews for a specific dish. |

---

## 14. Notifications & Alerts (`/api/notifications`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `GET` | `/api/notifications/inbox` | Authenticated User | `tab` (ALL, ORDERS, OFFERS), `page` (int), `limit` (int) | `ApiResponse<Page<NotificationMessage>>` | Retrieves user notification inbox. |
| `GET` | `/api/notifications/unread-count` | Authenticated User | Authenticated user | `ApiResponse<Long>` | Count of unread notifications for badge. |
| `PUT` | `/api/notifications/inbox/{id}/{action}` | Authenticated User | Path `id`, `action` (READ, ARCHIVE, DELETE) | `ApiResponse<Void>` | Modifies notification state. |
| `GET` | `/api/notifications/preferences` | Authenticated User | Authenticated user | `ApiResponse<UserNotificationPreference>` | User notification toggle settings. |
| `PUT` | `/api/notifications/preferences` | Authenticated User | JSON `UserNotificationPreference` | `ApiResponse<UserNotificationPreference>` | Updates push/email/SMS notification toggles. |

---

## 15. Real-Time STOMP WebSocket Protocol (`/api/ws`)

### Connection Specification
- **Endpoint:** `http://localhost:8080/api/ws` (with SockJS handshake) or native `ws://localhost:8080/api/ws/websocket`
- **Application Destination Prefix:** `/app`
- **Broker Destination Prefixes:** `/topic`, `/queue`
- **Authentication:** `WebSocketAuthChannelInterceptor` extracts `Authorization: Bearer <token>` from STOMP `CONNECT` headers or query params.

### Channel Subscriptions & Broadcasts

| Direction | Destination | Payload Format | Description |
|---|---|---|---|
| **Subscribe** (Client) | `/topic/order/{customerId}` | JSON `OrderResponse` | Real-time push whenever the customer's order status transitions (`PLACED` → `CONFIRMED` → `PREPARING` → `OUT_FOR_DELIVERY` → `DELIVERED`). |
| **Subscribe** (Client) | `/topic/location/{orderId}` | JSON `LocationMessage`: `{ orderId, deliveryPartnerId, latitude, longitude, status, timestamp }` | Real-time GPS stream of the assigned delivery partner moving toward the customer. |
| **Subscribe** (Client) | `/topic/notifications/{userId}` | JSON `NotificationMessage` | Push notification delivery for marketing offers, security alerts, and order confirmations. |
| **Subscribe** (Admin) | `/topic/admin/orders` | JSON `OrderResponse` | Administrative feed of all platform orders. |
| **Send** (Rider Client) | `/app/location/{orderId}` | JSON `LocationUpdateRequest`: `{ latitude, longitude }` | Sent by delivery partner mobile app every 3–5 seconds to broadcast coordinates. |

---

## 16. Media Storage Service (`/api/media`)

| Method | Endpoint | Access / Role | Request Payload / Params | Response Data | Description |
|---|---|---|---|---|---|
| `POST` | `/api/media/upload` | Authenticated User / Admin | Multipart form data: `file` | `ApiResponse<Map<String, String>>` (`url`, `publicId`) | Uploads image to Cloudinary using configured preset (`tomato_preset`). |
