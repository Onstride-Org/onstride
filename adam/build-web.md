# Flutter Web Build - Status & Instructions

## COMPLETED STEPS

### Phase 1 - Core Setup

1. **Flutter Web Enabled** - Web platform support added to the project
2. **Web Directory Created** - `web/` folder with index.html, manifest.json, icons
3. **Code Generation Complete** - All packages and main project have generated files
4. **Platform Compatibility Fixed** - Removed `dart:io` Platform usages that break web:
   - `lib/main.dart` - Fixed `Platform.isAndroid` to use `defaultTargetPlatform`
   - `lib/core/common/services/push_notifications_service.dart` - Fixed Platform usages
   - Added `kIsWeb` guards for Stripe initialization
5. **Firebase Options Updated** - Added web configuration to `firebase_options_dev.dart`
6. **Firebase Hosting Configured** - Added hosting config to `firebase.json`
7. **Production Build Successful** - `flutter build web -t lib/main_dev.dart` works

---

## REMAINING MANUAL STEPS

### Step 1 - Firebase Console Setup (Required)

You need to register a **web app** in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `gl-horses-develop`
3. Click "Add app" > Web (</> icon)
4. Register app name: `gl-horses-web`
5. Copy the generated config values
6. Update `lib/core/firebase/firebase_options_dev.dart`:

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'YOUR_WEB_API_KEY',
  appId: 'YOUR_WEB_APP_ID',           // e.g., 1:930733642707:web:xxxxx
  messagingSenderId: '930733642707',
  projectId: 'gl-horses-develop',
  storageBucket: 'gl-horses-develop.firebasestorage.app',
  authDomain: 'gl-horses-develop.firebaseapp.com',
);
```

### Step 2 - Google Sign-In for Web (Required for Auth)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the Firebase project
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID for Web application
5. Add authorized JavaScript origins:
   - `http://localhost:8080` (for development)
   - `https://gl-horses-develop.web.app` (for production)
6. Add the client ID to `web/index.html`:

```html
<head>
  ...
  <meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com">
  ...
</head>
```

### Step 3 - Firebase Authentication

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable "Google" provider
3. Add authorized domains for web

### Step 4 - Deploy to Firebase Hosting

```bash
# Login to Firebase (one-time)
npx firebase-tools login

# Deploy
npx firebase-tools deploy --only hosting
```

---

## QUICK COMMANDS

### Development

```bash
# Run in Chrome (debug mode)
flutter run -d chrome -t lib/main_dev.dart

# Run with specific port
flutter run -d chrome -t lib/main_dev.dart --web-port 8080
```

### Production Build

```bash
# Build for web
flutter build web -t lib/main_dev.dart

# Build for production (prod config)
flutter build web -t lib/main_prod.dart
```

### Code Generation (if needed)

```bash
# Generate code in all packages
make build_runner_all

# Generate in main project
dart run build_runner build --delete-conflicting-outputs
```

---

## KNOWN ISSUES

### 1. Google Sign-In Error
**Error:** `ClientID not set`
**Fix:** Add google-signin-client_id meta tag to `web/index.html`

### 2. Firebase Installation Error
**Error:** `Installations: Create Installation request failed`
**Fix:** Register the web app in Firebase Console and update the appId

### 3. Stripe on Web
**Status:** Disabled for web (`kIsWeb` guard in `main.dart`)
**Note:** Stripe web SDK requires different setup. Payment features will need web-specific implementation.

---

## FILES MODIFIED FOR WEB SUPPORT

| File | Change |
|------|--------|
| `lib/main.dart` | Removed `dart:io`, fixed Platform checks, guarded Stripe |
| `lib/core/firebase/firebase_options_dev.dart` | Added web FirebaseOptions |
| `lib/core/common/services/push_notifications_service.dart` | Fixed Platform.isAndroid, Platform.operatingSystem |
| `firebase.json` | Added hosting configuration |
| `web/index.html` | Created by flutter create |

---

## TL;DR - Next Actions

1. Register web app in Firebase Console
2. Set up Google OAuth credentials
3. Update `firebase_options_dev.dart` with real web appId
4. Add `google-signin-client_id` to `web/index.html`
5. Run `npx firebase-tools login && npx firebase-tools deploy --only hosting`
