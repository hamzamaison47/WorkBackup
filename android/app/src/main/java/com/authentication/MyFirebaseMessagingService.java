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
    public void onMessageReceived(RemoteMessage remoteMessage) 
    {    
        super.onMessageReceived(remoteMessage);    
        Log.d(TAG, "onMessageReceived from: " + remoteMessage.getFrom());    
        Map<String, String> data = remoteMessage.getData();    
        
        // Get title/body from notification payload OR data payload    
        String title = "Dynaface";    
        String body = "New notification";    
        if (remoteMessage.getNotification() != null) {        
            // Notification payload        
            title = remoteMessage.getNotification().getTitle() != null ? remoteMessage.getNotification().getTitle() : title;        
            body = remoteMessage.getNotification().getBody() != null ? remoteMessage.getNotification().getBody() : body;    
        } else if (data != null && !data.isEmpty()) {        
            // Data-only payload      
            title = data.containsKey("title") ? data.get("title") : title;        
            body = data.containsKey("body") ? data.get("body") : data.containsKey("message") ? data.get("message") : body;    
        }    
        postNotification(title, body);
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
                        .setSmallIcon(R.drawable.notification_icon)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle()
                                .bigText(body)
                                .setBigContentTitle(title))
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