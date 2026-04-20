# iOS Notifications Complete Setup Guide

## Issues Fixed

### 1. ✅ AppDelegate APNS Token Forwarding (CRITICAL)
**Problem**: Apple didn't know to forward APNS tokens to Firebase
**File**: `ios/Authentication/AppDelegate.mm`
**Fix**: Added two callback methods:
- `didRegisterForRemoteNotificationsWithDeviceToken:` → forwards token to Firebase
- `didFailToRegisterForRemoteNotificationsWithError:` → logs registration failures

### 2. ✅ Foreground Notification Display (CRITICAL)
**Problem**: `onMessage` handler was receiving messages but not displaying them
**File**: `src/store/FirebaseService.js` line 485
**Fix**: Uncommented `this.showForegroundNotification(remoteMessage, navigation);`

### 3. ✅ Background Message Handler (CRITICAL)
**Problem**: No handler for notifications when app is backgrounded
**File**: `src/store/FirebaseService.js`
**Fix**: Added `setBackgroundMessageHandler()` to handle background state notifications

## Complete Notification Flow - iOS

```
User's Device (iOS)
    ↓
API sends notification to FCM service (Firebase Cloud Messaging)
    ↓
FCM routes to device with APNS payload
    ↓
iOS receives on APNS → Apple native notification handler
    ↓
AppDelegate.mm: didRegisterForRemoteNotificationsWithDeviceToken()
    ↓
Forwards APNS token to [FIRMessaging messaging].APNSToken
    ↓
App State Detection:
    
    ├─ FOREGROUND: onMessage() → showForegroundNotification() [Alert.alert]
    ├─ BACKGROUND: setBackgroundMessageHandler() [native iOS shows notification]
    └─ KILLED: getInitialNotification() → handleNotificationTap() [navigation]
```

## Configuration Checklist

✅ **iOS Native Configuration**
- [x] Info.plist: `FirebaseAppDelegateProxyEnabled = true`
- [x] Info.plist: `UIBackgroundModes` includes `remote-notification`
- [x] Authentication.entitlements: `aps-environment = development`
- [x] AppDelegate.mm: `[FIRApp configure]` called in didFinishLaunchingWithOptions
- [x] AppDelegate.mm: APNS token forwarding callbacks added
- [x] GoogleService-Info.plist: present in ios/Authentication/

✅ **Firebase Configuration**
- [x] firebase.json: `messaging_ios_auto_register_for_remote_messages = true`

✅ **JavaScript Configuration**
- [x] FirebaseService.js imports: `setBackgroundMessageHandler`
- [x] setupMessageHandlers(): foreground handler enabled
- [x] setupMessageHandlers(): background handler implemented
- [x] setupMessageHandlers(): onNotificationOpenedApp handler for background tap
- [x] setupMessageHandlers(): getInitialNotification handler for killed state tap

## Expected Behavior After Fix

### Foreground (App Open)
1. Notification arrives → `onMessage` callback fires
2. Displays native iOS Alert with notification title/body
3. User can tap "View" to navigate to workflow/notifications
4. Or tap "Dismiss" to close

### Background (App Backgrounded)
1. Notification arrives → Silent (no interruption)
2. Firebase native handler shows notification in notification center
3. User taps notification → `onNotificationOpenedApp` fires
4. App navigates to workflow/notifications screen

### Killed (App Not Running)
1. Notification arrives while app is terminated
2. Firebase native handler shows notification in notification center
3. User taps notification → OS launches app
4. `getInitialNotification` fires on app startup
5. App navigates to workflow/notifications screen (after 1s delay for nav stack)

## Testing Notifications

### Step 1: Verify APNS Token Flow
```javascript
// In console, should see:
// [AppDelegate] APNS device token received, forwarding to Firebase
```

### Step 2: Verify FCM Token Obtained
```javascript
// Should see in console:
// New FCM Token obtained: [firebase-token-value]
```

### Step 3: Send Test Notification from API
- Ensure token is sent to your backend notification service
- Backend sends notification to Firebase using token
- Monitor device for notification arrival

### Step 4: Test Each State
- **Foreground**: Keep app open → should see Alert popup
- **Background**: Swipe app away → lock device → send notification → check notification center
- **Killed**: Force-kill app → send notification → check notification center → tap notification

## Key Differences from Android

| Aspect | Android | iOS |
|--------|---------|-----|
| **Service Handler** | MyFirebaseMessagingService.onMessageReceived | Native APNS + JS handlers |
| **Native Posting** | Explicit NotificationCompat.Builder | Firebase SDK + Apple UserNotification |
| **Background Handling** | Service runs when app backgrounded | Firebase + OS notification center |
| **Killed State** | Service receives notification | OS notification center, app launches on tap |

## Troubleshooting

### Issue: APNS tokens not being forwarded
✅ Check: `[FIRMessaging messaging].APNSToken` is set in AppDelegate.mm
✅ Check: `FirebaseAppDelegateProxyEnabled = true` in Info.plist

### Issue: Foreground notifications not showing
✅ Check: `showForegroundNotification()` is not commented out in setupMessageHandlers
✅ Check: `Alert` is imported from 'react-native'

### Issue: Background notifications not arriving
✅ Check: `setBackgroundMessageHandler()` is registered
✅ Check: `UIBackgroundModes` includes `remote-notification` in Info.plist

### Issue: Tapping notification doesn't navigate
✅ Check: `onNotificationOpenedApp` and `getInitialNotification` handlers are set up
✅ Check: `handleNotificationTap()` method receives navigation prop correctly

---

**Status**: ✅ Complete - iOS notifications should now work for foreground, background, and killed states
