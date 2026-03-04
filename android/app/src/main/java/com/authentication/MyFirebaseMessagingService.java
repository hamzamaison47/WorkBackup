package com.authentication;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.RemoteMessage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Custom FCM Service — extends ReactNativeFirebaseMessagingService so that:
 *  1. RNFirebase JS-layer handlers (onMessage, onNotificationOpenedApp, setBackgroundMessageHandler)
 *     continue to work correctly.
 *  2. We retain control over notification display (channel, icon, tap PendingIntent).
 *
 * Rule: messages with a "notification" payload arrive here ONLY when the app is in the foreground
 * (system handles them automatically when killed/background for notification-payload messages).
 * Data-only messages arrive here in all app states.
 */
public class MyFirebaseMessagingService extends ReactNativeFirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "dynamics_channel";
    private static final String CHANNEL_NAME = "Dynamics Notifications";

    // Atomic counter ensures each notification gets a unique ID so they stack in the tray.
    private static final AtomicInteger NOTIFICATION_COUNTER = new AtomicInteger(0);

    @Override
    public void onNewToken(String token) {
        // MUST call super — this propagates the token to the RNFirebase JS layer
        // so that onTokenRefresh listeners in FirebaseService.js fire correctly.
        super.onNewToken(token);
        Log.d(TAG, "FCM token refreshed (native layer logged only)");
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // MUST call super first — this dispatches the message to the RNFirebase JS layer.
        // Without this, setBackgroundMessageHandler / onMessage in JS will never fire.
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "onMessageReceived from: " + remoteMessage.getFrom());

        Map<String, String> data = remoteMessage.getData();

        // Only manually post a notification for DATA-ONLY messages.
        // For messages that include a "notification" payload while app is killed/background,
        // the FCM SDK posts the system tray notification automatically — do NOT double-post.
        // When app is in foreground, "notification" payload msgs still arrive here; RNFirebase's
        // onMessage JS listener in FirebaseService.js handles the foreground Alert.
        if (remoteMessage.getNotification() == null && data != null && !data.isEmpty()) {
            // Data-only message: we are responsible for displaying it in all app states.
            String title = data.containsKey("title") ? data.get("title") : "Dynaface";
            String body  = data.containsKey("body")  ? data.get("body")  :
                           data.containsKey("message") ? data.get("message") : "New notification";

            postNotification(title, body);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void postNotification(String title, String body) {
        ensureNotificationChannel();

        // Build a tap intent that re-opens MainActivity
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int notifId = NOTIFICATION_COUNTER.incrementAndGet();

        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, notifId, intent, piFlags);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.notification_icon) // white/transparent silhouette icon
                        .setContentTitle(title)
                        .setContentText(body)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .setContentIntent(pendingIntent);

        NotificationManager nm =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (nm != null) {
            nm.notify(notifId, builder.build());
            Log.d(TAG, "Posted notification id=" + notifId);
        }
    }

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Dynaface workflow & approval notifications");
            channel.enableVibration(true);
            channel.setShowBadge(true);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }
}