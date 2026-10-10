// ─────────────────────────────────────────────────────────────────────────────
// android/app/src/main/java/com/authentication/attendance/AttendanceIntentModule.java
//
// NativeModule that gives JS access to the attendance_action intent extra
// that notification button taps deliver to MainActivity.
//
// Two scenarios are handled:
//
// A) COLD START (app was killed):
//    MainActivity.getIntent() carries the extra.
//    JS calls AttendanceIntentModule.getInitialAction() once on mount.
//
// B) WARM / FOREGROUND (app is running):
//    Android calls MainActivity.onNewIntent() which stores the new intent.
//    We also emit a DeviceEventEmitter 'AttendanceNotificationAction' event
//    so JS is notified immediately without polling.
//
// Usage in JS (TimeClockScreen):
//   import { NativeModules, DeviceEventEmitter } from 'react-native';
//   const action = await NativeModules.AttendanceIntent.getInitialAction();
//   // + listen to DeviceEventEmitter 'AttendanceNotificationAction'
// ─────────────────────────────────────────────────────────────────────────────
package com.idap360.attendance;

import android.app.Activity;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AttendanceIntentModule extends ReactContextBaseJavaModule {

    public static final String MODULE_NAME = "AttendanceIntent";
    // Shared with AttendanceForegroundService.EXTRA_ATTENDANCE_ACTION
    private static final String EXTRA_KEY  = "attendance_action";

    // Static reference so MainActivity.onNewIntent() can reach us
    private static AttendanceIntentModule instance;

    private final ReactApplicationContext reactContext;

    public AttendanceIntentModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        instance = this;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    // ── Called from MainActivity.onNewIntent() ────────────────────────────────
    // When the app is in the foreground/background and a notification button
    // is tapped, Android calls onNewIntent on the existing MainActivity instance.
    // MainActivity must forward that intent here so we can emit to JS.
    public static void onNewIntentReceived(Intent intent) {
        if (instance == null || intent == null) return;
        String action = intent.getStringExtra(EXTRA_KEY);
        if (action == null || action.isEmpty()) return;

        try {
            WritableMap params = Arguments.createMap();
            params.putString("action", action);
            instance.reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("AttendanceNotificationAction", params);
        } catch (Exception e) {
            android.util.Log.w("AttendanceIntentModule",
                "Failed to emit AttendanceNotificationAction: " + e.getMessage());
        }
    }

    // ── JS-callable methods ────────────────────────────────────────────────────

    /**
     * getInitialAction()
     *
     * Returns the attendance_action from the intent that launched the app,
     * or null if the app was opened normally (not from a notification button).
     *
     * Call this ONCE on TimeClockScreen mount.
     * After reading it, the extra is cleared so it is not re-consumed on
     * subsequent re-renders.
     */
    @ReactMethod
    public void getInitialAction(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.resolve(null);
                return;
            }

            Intent intent = activity.getIntent();
            if (intent == null) {
                promise.resolve(null);
                return;
            }

            String action = intent.getStringExtra(EXTRA_KEY);

            // Clear the extra so it is not consumed again on re-mount
            intent.removeExtra(EXTRA_KEY);

            promise.resolve(action); // resolves with null if not present
        } catch (Exception e) {
            promise.reject("INTENT_ERROR", e.getMessage(), e);
        }
    }

    // Required for RN event listener bookkeeping
    @ReactMethod public void addListener(String eventName) {}
    @ReactMethod public void removeListeners(double count) {}
}
