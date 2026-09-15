package com.dynaface365.attendance;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.dynaface365.app.MainActivity;
import com.dynaface365.app.R;

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
        }

        startForeground(NOTIFICATION_ID, buildNotification());

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
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
                        .setColor(0xFF0A66C2)         // Brand primary color (Dynaface blue)
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