# FoodIQ – Developer Environment Setup Guide

**Target Audience:** Flutter Developers, Mobile Engineers, QA Engineers  
**Project:** FoodIQ Mobile Application (`d:\food_delivery\foodiq_mobile`)

---

## 1. System Requirements & Prerequisites

- **Operating System:** Windows 10/11 (64-bit), macOS 13+, or Ubuntu 22.04+
- **JDK:** Java 17 Development Kit (Temurin 17 recommended)
- **Git:** Git 2.40+ installed and on system PATH
- **Available Storage:** Minimum 15 GB free space (Drive D:\ or E:\ recommended on this host due to low C:\ storage)

---

## 2. Flutter SDK Installation

### Recommended Location
Install the official Flutter SDK on **Drive D:\** (`D:\src\flutter`) or **Drive E:\** (`E:\flutter`) to preserve free space on Drive C:\.

### Windows Installation Steps:
1. Download the latest official Windows stable bundle from:  
   `https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.29.0-stable.zip`
2. Extract the archive into `D:\src\flutter`.
3. Add `D:\src\flutter\bin` to your User Environment **PATH**.
4. Open a new PowerShell terminal and verify:
   ```powershell
   flutter --version
   dart --version
   ```

---

## 3. Android SDK & Studio Configuration

1. Install **Android Studio** or download **Android SDK Command-Line Tools** from `developer.android.com`.
2. Install SDK components:
   - Android SDK Platform 34 (Android 14)
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools (includes `adb`)
   - Android SDK Command-line Tools (latest)
3. Set environment variables:
   - `ANDROID_HOME` = `C:\Users\<username>\AppData\Local\Android\Sdk` (or your custom SDK path)
   - Add `%ANDROID_HOME%\platform-tools` to PATH.
   - Add `%ANDROID_HOME%\cmdline-tools\latest\bin` to PATH.
4. Accept Android licenses:
   ```powershell
   flutter doctor --android-licenses
   ```
5. Run Flutter doctor to confirm all checks pass:
   ```powershell
   flutter doctor -v
   ```

---

## 4. Project Initialization & Dependencies

Navigate to the mobile project root:
```powershell
cd d:\food_delivery\foodiq_mobile
```

Install Dart and Flutter dependencies:
```powershell
flutter pub get
```

Ensure environment configuration is present:
```powershell
# Verify .env exists or copy from template
copy .env.example .env
```

Run static code analysis:
```powershell
flutter analyze
```

Execute the automated test suite:
```powershell
flutter test
```
