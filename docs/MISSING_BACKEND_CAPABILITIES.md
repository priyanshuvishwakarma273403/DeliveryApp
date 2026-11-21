# FoodIQ – Missing Backend Capabilities & Extension Specification

**Audit Target:** Existing Spring Boot Backend (`foodDelivery/foodDelivery`)  
**Scope:** Enhancements and endpoints required to deliver a complete, seamless mobile production experience without breaking compatibility with the existing React website.

---

## 1. Summary of Identified Gaps

During our comprehensive audit of the React website codebase and the Spring Boot backend modules, we identified 5 specific areas where the existing backend provides partial or admin-only capabilities, requiring standard REST extensions for the mobile application:

1. **Customer Profile Retrieval & Updating (`/api/users/me`):**  
   The current `UserController.java` only exposes endpoints for `ROLE_ADMIN` (`GET /users`, `PATCH /users/{id}/role`, `DELETE /users/{id}`). There is no clean, authenticated endpoint allowing a customer (`ROLE_CUSTOMER`) to view and update their own name, phone number, and avatar.
2. **Multi-Address Management Persistence (`/api/users/me/addresses`):**  
   The MySQL `User` entity contains only a single scalar column `address VARCHAR(255)`. The React frontend works around this by saving multiple addresses in browser local storage (`locationStore`). For a native mobile app where users re-install or switch devices, addresses must be persisted to the backend.
3. **Saved Favorites (`/api/users/me/favorites`):**  
   The React frontend tracks favorite restaurants and dishes locally in memory/Zustand. Exposing a backend persistence endpoint allows seamless synchronization between website and mobile app.
4. **Mobile Push Notification Token Registration (`/api/notifications/fcm-token`):**  
   The current backend dispatches notifications via STOMP WebSockets and email. When a mobile app is backgrounded or terminated, WebSockets are disconnected by Android OS power management. A standard FCM device token registration endpoint is necessary for background order alerts.
5. **Idempotency Key Handling on Order Placement:**  
   The `FinancialController.java` (`POST /finance/pay`) already supports an `Idempotency-Key` header. Adding idempotency protection to `OrderController.java` (`POST /orders`) prevents duplicate order creation on unstable mobile cell towers.

---

## 2. Technical Extension Specifications

### Extension 1: Customer Profile API (`UserController.java`)

#### A. Endpoint: `GET /api/users/me`
- **Access:** Any authenticated user (`ROLE_CUSTOMER`, `ROLE_DELIVERY_PARTNER`, `ROLE_ADMIN`)
- **Headers:** `Authorization: Bearer <token>`
- **Response (`ApiResponse<UserResponse>`):**
```json
{
  "success": true,
  "message": "User profile fetched successfully",
  "data": {
    "id": 14,
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "+91 9876543210",
    "role": "CUSTOMER",
    "address": "Connaught Place, New Delhi",
    "active": true,
    "createdAt": "2026-08-15T10:30:00"
  }
}
```

#### B. Endpoint: `PUT /api/users/me`
- **Access:** Any authenticated user
- **Request Body (`UpdateProfileRequest`):**
```json
{
  "name": "Rahul Sharma",
  "phone": "+91 9876543210",
  "address": "Connaught Place, New Delhi"
}
```
- **Response (`ApiResponse<UserResponse>`):** Updated user profile.

---

### Extension 2: Customer Address Book API

To support multiple addresses (Home, Work, Other) without altering the existing relational table schema, we can store a structured JSON list of addresses in MongoDB or introduce a lightweight `@Entity UserAddress` in MySQL.

#### Endpoints:
- `GET /api/users/me/addresses` – Returns list of saved user addresses.
- `POST /api/users/me/addresses` – Adds a new labeled address (`title`, `street`, `landmark`, `city`, `latitude`, `longitude`, `isDefault`).
- `PUT /api/users/me/addresses/{id}` – Updates an existing address.
- `DELETE /api/users/me/addresses/{id}` – Removes a saved address.

---

### Extension 3: Push Notification Device Token (`NotificationController.java`)

#### Endpoint: `POST /api/notifications/device-token`
- **Access:** Authenticated user
- **Request Body:**
```json
{
  "token": "fcm_device_registration_token_here",
  "platform": "ANDROID",
  "deviceModel": "Pixel 8 Pro"
}
```
- **Purpose:** Stores the device token for dispatching high-priority Android notifications when order status changes (`CONFIRMED`, `OUT_FOR_DELIVERY`, `DELIVERED`).

---

### Extension 4: Customer Order Cancellation Rules

Currently `OrderController.java` provides `DELETE /api/orders/{id}/cancel`. We must ensure the backend service strictly validates order status:
- Orders in `PLACED` state can be cancelled directly by customer with full refund.
- Orders in `PREPARING`, `READY_FOR_PICKUP`, or `OUT_FOR_DELIVERY` cannot be cancelled without contacting support, preventing kitchen food waste and financial dispute.

---

## 3. Implementation Plan

1. Implement the minimal backend enhancements in `foodDelivery/foodDelivery` by adding the `/api/users/me` profile endpoints in `UserController.java` and updating `UserService.java`.
2. Ensure complete backwards-compatibility: existing React website API contracts remain 100% untouched.
3. Validate all changes with unit and integration tests.
