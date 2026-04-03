package com.authentication.attendance;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.authentication.MainActivity;
import com.authentication.R;

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

    public static final String EXTRA_ATTENDANCE_ACTION = "attendance_action";

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────
    private long clockInEpoch = 0;
    private long breakStartEpoch = 0;
    private boolean isOnBreak = false;

    private Handler tickHandler;
    private Runnable tickRunnable;

    // ─────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        tickHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        if (intent != null) {
            clockInEpoch = intent.getLongExtra(EXTRA_CLOCK_IN_EPOCH, System.currentTimeMillis());
            breakStartEpoch = intent.getLongExtra(EXTRA_BREAK_START_EPOCH, 0);
            isOnBreak = intent.getBooleanExtra(EXTRA_IS_ON_BREAK, false);
        }

        startForeground(NOTIFICATION_ID, buildNotification());
        startTick();

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopTick();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ─────────────────────────────────────────────────────────
    // Timer Tick
    // ─────────────────────────────────────────────────────────
    private void startTick() {

        stopTick();

        tickRunnable = new Runnable() {
            @Override
            public void run() {

                updateNotification();

                tickHandler.postDelayed(this, 1000);
            }
        };

        tickHandler.post(tickRunnable);
    }

    private void stopTick() {

        if (tickHandler != null && tickRunnable != null) {
            tickHandler.removeCallbacks(tickRunnable);
        }
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

        long now = System.currentTimeMillis();

        long workElapsed = now - clockInEpoch;
        long breakElapsed = isOnBreak ? now - breakStartEpoch : 0;

        String title = isOnBreak ? "☕ On Break" : "⏱ Clocked In";

        String timerText = isOnBreak
                ? "Break: " + formatElapsed(breakElapsed) + " | Work: " + formatElapsed(workElapsed)
                : formatElapsed(workElapsed);

        PendingIntent openApp = buildActivityPendingIntent("OPEN_TIMECLOCK", 0);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.notification_icon)
                        .setContentTitle(title)
                        .setContentText(timerText)
                        .setSubText("Tap to open attendance")
                        .setContentIntent(openApp)
                        .setOngoing(true)
                        .setAutoCancel(false)
                        .setOnlyAlertOnce(true)
                        .setPriority(NotificationCompat.PRIORITY_LOW)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setCategory(NotificationCompat.CATEGORY_SERVICE);

        if (isOnBreak) {

            builder.addAction(
                    0,
                    "End Break",
                    buildActivityPendingIntent("END_BREAK", 10)
            );

            builder.addAction(
                    0,
                    "Clock Out",
                    buildActivityPendingIntent("CLOCK_OUT", 11)
            );

        } else {

            builder.addAction(
                    0,
                    "Start Break",
                    buildActivityPendingIntent("START_BREAK", 12)
            );

            builder.addAction(
                    0,
                    "Clock Out",
                    buildActivityPendingIntent("CLOCK_OUT", 11)
            );
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

            channel.setDescription("Live attendance timer");
            channel.enableVibration(false);
            channel.enableLights(false);
            channel.setShowBadge(false);

            NotificationManager manager =
                    (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}