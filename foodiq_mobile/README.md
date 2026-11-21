# FoodIQ Mobile – Production Flutter Application

FoodIQ is the official cross-platform mobile client for the FoodIQ (Tomato) Food Delivery Platform, providing high-performance, real-time food ordering, discovery, and tracking on Android and iOS.

## Architectural Highlights
- **Framework:** Flutter 3.x (Dart 3.x)
- **Architecture:** Feature-First Clean Architecture (Presentation, Domain, Data)
- **State Management:** Riverpod 2.x
- **Routing:** GoRouter with declarative role guards
- **HTTP Client:** Centralized Dio with JWT AuthInterceptor and retry mechanisms
- **Real-Time:** STOMP over WebSocket for live order status and continuous rider GPS stream
- **Security:** Hardware-backed token storage via Flutter Secure Storage (Keystore/Keychain)
