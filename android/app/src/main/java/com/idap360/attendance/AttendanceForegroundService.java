package com.idap360.attendance;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.idap360.app.MainActivity;
import com.idap360.app.R;

public class AttendanceForegroundService extends Service {

    // ─────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────
    public static final String CHANNEL_ID = "attendance_timer_channel";
    public static final String CHANNEL_NAME = "Attendance Timer";
    public static final int NOTIFICATION_ID = 1001;

    public static final String EXTRA_CLOCK_IN_EPOCH = "clockInEpoch";
    public static final String EXTRA_BREAK_START_EPOCH = "breakStartEpoch";
    public static final String EXTRA_IS_ON_BREAK = "isOnBreak";

    public static final String EXTRA_TOTAL_BREAK_MS = "totalBreakMs";
    public static final String EXTRA_ATTENDANCE_ACTION = "attendance_action";

    // Persisted timer state. onStartCommand gets a null intent when the
    // system restarts a START_STICKY service, so the epochs must survive
    // process death on disk rather than only in memory.
    private static final String PREFS_NAME = "attendance_timer_state";
    private static final String KEY_CLOCK_IN_EPOCH = "clockInEpoch";
    private static final String KEY_BREAK_START_EPOCH = "breakStartEpoch";
    private static final String KEY_TOTAL_BREAK_MS = "totalBreakMs";
    private static final String KEY_IS_ON_BREAK = "isOnBreak";

    // Upper bound on a plausible shift. Persisted state older than this is
    // treated as stale leftovers rather than a live clock-in.
    private static final long MAX_ACTIVE_MS = 24L * 60L * 60L * 1000L;

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────
    private long clockInEpoch = 0;
    private long breakStartEpoch = 0;
    private long totalBreakMs = 0;
    private boolean isOnBreak = false;

    // ─────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        loadState();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent != null) {
            long initialClockIn = intent.getLongExtra(EXTRA_CLOCK_IN_EPOCH, 0);
            if (initialClockIn > 0) {
                clockInEpoch = initialClockIn;
            }
            breakStartEpoch = intent.getLongExtra(EXTRA_BREAK_START_EPOCH, 0);
            totalBreakMs = intent.getLongExtra(EXTRA_TOTAL_BREAK_MS, 0);
            isOnBreak = intent.getBooleanExtra(EXTRA_IS_ON_BREAK, false);
            saveState();
        }

        // A system restart delivers a null intent; onCreate() has already
        // reloaded the epochs from disk. If there is nothing usable there, stop
        // rather than show a notification whose chronometer counts up from the
        // Unix epoch (the ~56-year elapsed time).
        boolean stale = clockInEpoch <= 0
                || System.currentTimeMillis() - clockInEpoch > MAX_ACTIVE_MS;
        if (stale) {
            clearState();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        startForeground(NOTIFICATION_ID, buildNotification());

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        // Deliberately does NOT clear persisted state: onDestroy also runs
        // when the system reclaims the service, and the START_STICKY restart
        // needs the epochs. Clock-out clears them explicitly via
        // clearPersistedState().
        super.onDestroy();
    }

    // ─────────────────────────────────────────────────────────
    // Persisted State
    // ─────────────────────────────────────────────────────────
    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private void loadState() {
        SharedPreferences p = prefs();
        clockInEpoch    = p.getLong(KEY_CLOCK_IN_EPOCH, 0);
        breakStartEpoch = p.getLong(KEY_BREAK_START_EPOCH, 0);
        totalBreakMs    = p.getLong(KEY_TOTAL_BREAK_MS, 0);
        isOnBreak       = p.getBoolean(KEY_IS_ON_BREAK, false);
    }

    private void saveState() {
        prefs().edit()
               .putLong(KEY_CLOCK_IN_EPOCH, clockInEpoch)
               .putLong(KEY_BREAK_START_EPOCH, breakStartEpoch)
               .putLong(KEY_TOTAL_BREAK_MS, totalBreakMs)
               .putBoolean(KEY_IS_ON_BREAK, isOnBreak)
               .apply();
    }

    private void clearState() {
        clearPersistedState(this);
    }

    /** Called on clock-out, before the service is stopped. */
    public static void clearPersistedState(Context ctx) {
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
           .edit().clear().apply();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ─────────────────────────────────────────────────────────
    // Notification Update
    // ─────────────────────────────────────────────────────────
    private void updateNotification() {

        NotificationManager manager =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {

        String title;
        String timerText = null;
        long chronometerBase;

        if (isOnBreak) {
            title = "☕ On Break";
            chronometerBase = breakStartEpoch; // Chronometer shows: now - breakStartEpoch
            
            long workMsBeforeBreak = breakStartEpoch - clockInEpoch - totalBreakMs;
            if (workMsBeforeBreak > 0) {
                timerText = "Total work so far: " + formatElapsed(workMsBeforeBreak);
            }
        } else {
            title = "⏱ Clocked In";
            // Clocked in minus all previous breaks
            chronometerBase = clockInEpoch + totalBreakMs; // Chronometer shows: now - (clockInEpoch + totalBreakMs)
            
            if (totalBreakMs > 0) {
                timerText = "Total breaks taken: " + formatElapsed(totalBreakMs);
            }
        }

        PendingIntent openApp = buildActivityPendingIntent("OPEN_TIMECLOCK", 0);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.notification_icon)
                        .setColor(0xFFF4B400)         // Brand primary — kept in sync by scripts/sync-native-theme.js
                        .setColorized(true)
                        .setContentTitle(title)
                        .setSubText("IDAP360 Attendance")
                        .setContentIntent(openApp)
                        .setOngoing(true)
                        .setAutoCancel(false)
                        .setOnlyAlertOnce(true)
                        .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setUsesChronometer(true)
                        .setShowWhen(true)
                        .setWhen(chronometerBase);

        if (timerText != null) {
            builder.setContentText(timerText)
                   .setStyle(new NotificationCompat.BigTextStyle().bigText(timerText));
        }



        return builder.build();
    }

    // ─────────────────────────────────────────────────────────
    // PendingIntent Builder
    // ─────────────────────────────────────────────────────────
    private PendingIntent buildActivityPendingIntent(String action, int requestCode) {

        Intent intent = new Intent(this, MainActivity.class);

        intent.setFlags(
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        );

        intent.putExtra(EXTRA_ATTENDANCE_ACTION, action);

        return PendingIntent.getActivity(
                this,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    // ─────────────────────────────────────────────────────────
    // Time Formatter
    // ─────────────────────────────────────────────────────────
    private static String formatElapsed(long ms) {

        long totalSec = ms / 1000;

        long h = totalSec / 3600;
        long m = (totalSec % 3600) / 60;
        long s = totalSec % 60;

        return String.format("%d:%02d:%02d", h, m, s);
    }

    // ─────────────────────────────────────────────────────────
    // Notification Channel
    // ─────────────────────────────────────────────────────────
    private void createNotificationChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            CHANNEL_NAME,
                            NotificationManager.IMPORTANCE_LOW
                    );

            channel.setDescription("Shows your live attendance timer and work duration");
            channel.enableVibration(false);
            channel.enableLights(false);
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager =
                    (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}