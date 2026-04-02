// ─────────────────────────────────────────────────────────────────────────────
// android/app/src/main/java/com/authentication/attendance/AttendanceServiceModule.java
//
// React Native NativeModule that exposes three methods to JavaScript:
//   startService(clockInEpoch)
//   stopService()
//   updateBreakState(isOnBreak, breakStartEpoch)
//
// JS calls these via NativeModules.AttendanceService.*
// ─────────────────────────────────────────────────────────────────────────────
package com.authentication.attendance;

import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AttendanceServiceModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public AttendanceServiceModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AttendanceService"; // accessed in JS as NativeModules.AttendanceService
    }

    // ── JS-callable methods ────────────────────────────────────────────────────

    /**
     * Start the foreground service. Call this after a successful clock-in.
     *
     * @param clockInEpoch  Unix epoch ms when the employee clocked in (as double
     *                      because RN bridges all numbers as double)
     */
    @ReactMethod
    public void startService(double clockInEpoch) {
        Intent intent = new Intent(reactContext, AttendanceForegroundService.class);
        intent.putExtra(AttendanceForegroundService.EXTRA_CLOCK_IN_EPOCH, (long) clockInEpoch);
        intent.putExtra(AttendanceForegroundService.EXTRA_IS_ON_BREAK, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent);
        } else {
            reactContext.startService(intent);
        }
    }

    /**
     * Stop the foreground service and dismiss the persistent notification.
     * Call this after a successful clock-out.
     */
    @ReactMethod
    public void stopService() {
        Intent intent = new Intent(reactContext, AttendanceForegroundService.class);
        reactContext.stopService(intent);
    }

    /**
     * Update the notification to reflect break state.
     *
     * @param isOnBreak       true = show break timer; false = show work timer
     * @param breakStartEpoch Unix epoch ms when the break started (0 if not on break)
     */
    @ReactMethod
    public void updateBreakState(boolean isOnBreak, double breakStartEpoch) {
        Intent intent = new Intent(reactContext, AttendanceForegroundService.class);
        intent.putExtra(AttendanceForegroundService.EXTRA_IS_ON_BREAK,       isOnBreak);
        intent.putExtra(AttendanceForegroundService.EXTRA_BREAK_START_EPOCH, (long) breakStartEpoch);

        // Re-sending the start intent re-calls onStartCommand with updated extras.
        // The service is already running so Android will NOT create a new instance —
        // it just calls onStartCommand again, which updates our state and ticks.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent);
        } else {
            reactContext.startService(intent);
        }
    }

    // Required for RN event listener bookkeeping — no-op here
    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(double count) {}
}
