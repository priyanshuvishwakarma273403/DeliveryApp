# FoodIQ – Mobile Environment Configuration & Security Guide

**Configuration Target:** `foodiq_mobile/.env` & `foodiq_mobile/.env.example`

---

## 1. Security Architecture & Threat Model

> [!CAUTION]
> **Mobile Client Security Principle:**  
> Values packaged into an Android APK or iOS IPA file can be decompiled, inspected, and extracted using standard reverse-engineering tools (e.g. `apktool`, `jadx`).  
> **NEVER package private credentials into the mobile app.**

### Strictly Forbidden in Mobile `.env`:
- Database passwords (`MYSQL_PASSWORD`, `MONGODB_URI`)
- JWT secret signing keys (`JWT_SECRET`)
- Payment gateway private secret keys (e.g. Razorpay Key Secret, Stripe Secret Key)
- Cloudinary API Secret
- Server administrator private keys

### Permitted in Mobile `.env`:
- Public REST API Base URL
- Public STOMP WebSocket URL
- Environment identifier (`development`, `staging`, `production`)
- Public client keys (e.g. Google OAuth Client ID, Razorpay Key ID)
- Client network timeout thresholds

---

## 2. Configuration Parameters

```properties
# ==============================================================================
# FoodIQ Mobile Environment Configuration
# ==============================================================================

# Backend REST API Context Root
API_BASE_URL=https://deliveryapp-wwx8.onrender.com/api

# WebSocket STOMP Live Endpoint
WEBSOCKET_URL=wss://deliveryapp-wwx8.onrender.com/api/ws/websocket

# Environment Profile: development | staging | production
ENVIRONMENT=production

# Network Timeout Thresholds (in milliseconds)
CONNECT_TIMEOUT=20000
RECEIVE_TIMEOUT=25000
```

---

## 3. Environment Profiles

### 1. Local Development (`development`)
- Used when running the Spring Boot backend locally on port 8080.
- Android Emulator URL: `http://10.0.2.2:8080/api`
- Physical Android Phone URL: `http://192.168.X.X:8080/api`
- WebSocket URL: `ws://10.0.2.2:8080/api/ws/websocket`

### 2. Cloud Production (`production`)
- Used for testing against the live cloud infrastructure.
- API URL: `https://deliveryapp-wwx8.onrender.com/api`
- WebSocket URL: `wss://deliveryapp-wwx8.onrender.com/api/ws/websocket`
