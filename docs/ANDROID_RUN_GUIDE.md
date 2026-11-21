# FoodIQ – Android Run, Build & Deployment Guide

This guide details how to launch and build the FoodIQ Flutter application on physical Android devices, Android Virtual Devices (AVD), and produce release packages.

---

## 1. Running on a Physical Android Device (Recommended)

Running on a real Android smartphone is the most reliable method when host RAM or hardware virtualization is limited.

### Step 1: Enable Developer Options & USB Debugging
1. On your Android smartphone, open **Settings ➔ About Phone**.
2. Tap **Build Number** 7 times until you see "You are now a developer".
3. Go back to **Settings ➔ System ➔ Developer Options**.
4. Enable **USB Debugging**.

### Step 2: Connect Phone to PC
1. Connect via a USB data cable.
2. When prompted on the smartphone, check "Always allow from this computer" and tap **Allow**.
3. Verify connection in PowerShell:
   ```powershell
   adb devices
   ```
   Your device should appear as `[serial_number] device`.

### Step 3: Launch FoodIQ
```powershell
cd d:\food_delivery\foodiq_mobile
flutter run
```

---

## 2. Running on an Android Virtual Device (AVD / Emulator)

### Prerequisites:
- Hardware Virtualization (VT-x or AMD-V) enabled in BIOS/UEFI.
- At least 8 GB of host RAM.

### Step 1: Create a Lightweight Emulator
Using Android Studio Device Manager or command-line:
- **Device Profile:** Pixel 7a or Pixel 8
- **System Image:** Android 14 (API 34) - `google_apis` (x86_64)
- **RAM Allocation:** 2048 MB (2 GB)
- **Internal Storage:** 6 GB

### Step 2: Launch the Emulator
```powershell
flutter emulators --launch Pixel_8_API_34
```

### Step 3: Run FoodIQ
```powershell
flutter run -d emulator-5554
```

---

## 3. Backend Network Connectivity Configuration

Depending on where your Spring Boot backend is running, set the matching `API_BASE_URL` in `foodiq_mobile/.env`:

| Scenario | `API_BASE_URL` | Notes |
|---|---|---|
| **Android Emulator ➔ Local Backend** | `http://10.0.2.2:8080/api` | `10.0.2.2` is Android emulator's alias to host loopback `127.0.0.1`. |
| **Physical Phone ➔ Local Backend** | `http://192.168.1.X:8080/api` | Replace with your PC's Wi-Fi LAN IP (ensure firewall allows port 8080). |
| **Phone/Emulator ➔ Production Backend** | `https://deliveryapp-wwx8.onrender.com/api` | Cloud-hosted backend (Default in `.env`). |

---

## 4. Building APKs

### Debug APK (Fast, unoptimized with debugging symbols)
```powershell
flutter build apk --debug
```
Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK (Fully optimized, shrunk with ProGuard/R8)
```powershell
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Installing Built APK via ADB
```powershell
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```
