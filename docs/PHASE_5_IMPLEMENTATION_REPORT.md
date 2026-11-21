# FoodIQ – Phase 5 Implementation Report

**Project:** FoodIQ Mobile Application  
**Phase:** Phase 5 – Real-Time Live STOMP Order Tracking, GPS Stream, Order Brain Digital Twin, Notifications & Order History  
**Completion Date:** November 2026  
**Status:** Completed and Verified  

---

## 1. Executive Summary

Phase 5 equips FoodIQ with real-time reactive order telemetry and fleet intelligence:
- **Zero Polling Real-Time Streaming:** The mobile app connects via persistent STOMP WebSocket (`wss://deliveryapp-wwx8.onrender.com/api/ws/websocket`), subscribing dynamically to `/topic/order/{id}` for instant status transitions and `/topic/location/{orderId}` for rider GPS telemetry.
- **Accurate Geodesic Routing & ETA:** Incorporates the `Haversine` formula to dynamically calculate distance remaining and live minute-by-minute ETA countdown.
- **Order Brain Digital Twin Integration:** Directly integrates with Spring Boot's `/v1/orders/{id}/twin`, `/v1/orders/{id}/health`, and `/v1/orders/{id}/timeline` to surface kitchen preparation progress, SLA risk flags, and operational timelines.
- **Lifecycle Management:** Complete order history (`GET /orders/my`), detailed receipts, and customer-driven cancellation handling (`DELETE /orders/{id}/cancel`).
- **Live Notifications System:** Integrated with `/api/notifications/inbox` and `/api/notifications/unread-count` with categorised filter tabs and real-time badges.

---

## 2. Architecture & Modules Implemented

### 2.1 Live STOMP & Order Tracking Module (`lib/features/orders/`)
- **[RiderLocationModel](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/domain/models/rider_location_model.dart):** Captures high-frequency GPS coordinate streams (`latitude`, `longitude`, `speed`, `heading`, `timestamp`).
- **[OrderDigitalTwinModel](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/domain/models/order_digital_twin_model.dart):** Models the server-side Order Brain digital twin (`kitchenProgress`, `predictedFoodReadyAt`, `slaRisk`, `delayRisk`, `overallHealth`).
- **[OrderStatus](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/domain/models/order_status_enum.dart):** Finite state machine representing order lifecycle stages (`placed` -> `confirmed` -> `preparing` -> `outForDelivery` -> `delivered` / `cancelled`).
- **[OrderTimelineModel](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/domain/models/order_timeline_model.dart):** Granular operational audit milestones.
- **[OrderRemoteDataSourceImpl](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/data/datasources/order_remote_datasource.dart):** Combines REST API clients and `StompService` subscriptions.
- **[OrderRepositoryImpl](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/data/repositories/order_repository_impl.dart):** Manages order data contracts and active WebSocket subscriptions.
- **[OrderHistoryNotifier](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/controllers/order_history_controller.dart):** Riverpod provider for order history with pull-to-refresh.
- **[LiveTrackingController](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/controllers/live_tracking_controller.dart):** Auto-subscribes to `/topic/order/{id}` and `/topic/location/{id}` on mount, dynamically recomputes Haversine ETA, and cleans up on dispose.
- **[LiveTrackingMap](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/widgets/live_tracking_map.dart):** Live canvas rendering kitchen origin, rider moving pin with pulsing halo, destination marker, route curve, and floating ETA banner.
- **[OrderStatusTimeline](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/widgets/order_status_timeline.dart):** Multi-step vertical milestone progression tracker.
- **[OrderTwinCard](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/widgets/order_twin_card.dart):** AI Order Brain telemetry card showing kitchen cooking progress bar and health status.
- **[OrderItemCard](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/widgets/order_item_card.dart):** Clean card for the order history feed.
- **[CancelOrderDialog](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/widgets/cancel_order_dialog.dart):** Cancellation confirmation dialog with structured reason collection.
- **[OrderHistoryScreen](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/screens/order_history_screen.dart):** Customer order history screen with pull-to-refresh.
- **[OrderDetailTrackingScreen](file:///d:/food_delivery/foodiq_mobile/lib/features/orders/presentation/screens/order_detail_tracking_screen.dart):** Complete live tracking screen combining map, status timeline, digital twin, rider contact tile, and itemized bill.

### 2.2 Notifications Module (`lib/features/notifications/`)
- **[NotificationModel](file:///d:/food_delivery/foodiq_mobile/lib/features/notifications/domain/models/notification_model.dart):** Models MongoDB notification documents (`title`, `body`, `type`, `event`, `isRead`).
- **[NotificationRemoteDataSourceImpl](file:///d:/food_delivery/foodiq_mobile/lib/features/notifications/data/datasources/notification_remote_datasource.dart):** Queries `/api/notifications/inbox` and `/api/notifications/unread-count`.
- **[NotificationInboxNotifier](file:///d:/food_delivery/foodiq_mobile/lib/features/notifications/presentation/controllers/notification_controller.dart):** AsyncNotifier managing real-time inbox state.
- **[NotificationTile](file:///d:/food_delivery/foodiq_mobile/lib/features/notifications/presentation/widgets/notification_tile.dart):** Inbox notification tile with read/unread indicators and category icons.
- **[NotificationsInboxScreen](file:///d:/food_delivery/foodiq_mobile/lib/features/notifications/presentation/screens/notifications_inbox_screen.dart):** Filterable inbox (All, Orders, Offers, System).

### 2.3 Integration
- **Customer Dashboard Shell:** Tab 2 wired directly to `OrderHistoryScreen`. AppBar equipped with unread notifications badge icon linking to `NotificationsInboxScreen`.
- **App Router:** Registered `/orders`, `/orders/:id`, and `/notifications`.

---

## 3. Unit Test Verification

Added four new test suites:
1. `test/unit/rider_location_model_test.dart`: Validates coordinate deserialization and default coordinates.
2. `test/unit/order_digital_twin_model_test.dart`: Validates kitchen progress, ETA predictions, and SLA risk flags.
3. `test/unit/order_status_enum_test.dart`: Validates string-to-enum mapping and sequential step indices.
4. `test/unit/notification_model_test.dart`: Validates notification parsing and immutable read status mutations.

Total test suites across project: **18 test suites**.

---

## 4. Next Phase Readiness

The core end-to-end customer journey from discovery, cart, checkout, payments, to real-time live tracking is complete.

The project is ready for **Phase 6: Customer Profile, 12 Tabs, AI Taste DNA, FoodIQ Gold, Wallet & Coins, Support & AI Food Concierge**.
