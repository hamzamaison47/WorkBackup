#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>
#import <UIKit/UIKit.h>

@interface AppDelegate () <UNUserNotificationCenterDelegate>
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  
  NSLog(@"[AppDelegate] App launched - initializing Firebase notifications");
  
  // Step 1: Set UserNotificationCenter delegate for handling notifications in all app states
  NSLog(@"[AppDelegate] Setting UNUserNotificationCenter delegate");
  [UNUserNotificationCenter currentNotificationCenter].delegate = self;
  
  // Step 2: Request user notification permissions (equivalent to Android's requestPermission)
  NSLog(@"[AppDelegate] Requesting user notification permissions");
  UNAuthorizationOptions options = UNAuthorizationOptionAlert | 
                                   UNAuthorizationOptionBadge | 
                                   UNAuthorizationOptionSound;
  
  [[UNUserNotificationCenter currentNotificationCenter] 
    requestAuthorizationWithOptions:options 
    completionHandler:^(BOOL granted, NSError * _Nullable error) {
      if (granted) {
        NSLog(@"[AppDelegate] ✅ User notification permissions granted");
        // Step 3: Register for remote notifications (needed for APNS)
        dispatch_async(dispatch_get_main_queue(), ^{
          NSLog(@"[AppDelegate] Registering for remote notifications");
          [[UIApplication sharedApplication] registerForRemoteNotifications];
        });
      } else {
        NSLog(@"[AppDelegate] ❌ User denied notification permissions: %@", error.localizedDescription);
      }
    }];
  
  self.moduleName = @"Authentication";
  self.initialProps = @{};
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
    return YES;
  }
  return [super application:application openURL:url options:options];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// APNS Token Registration for Firebase
// These callbacks are called when the OS gives us the APNS token
// Essential for receiving remote push notifications
- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSLog(@"[AppDelegate] ========== APNS TOKEN RECEIVED START ==========");
  
  // Convert binary token to hex string for logging
  const unsigned char *bytes = (const unsigned char *)deviceToken.bytes;
  NSMutableString *tokenString = [NSMutableString stringWithCapacity:deviceToken.length * 2];
  for (NSUInteger i = 0; i < deviceToken.length; i++) {
    [tokenString appendFormat:@"%02x", bytes[i]];
  }
  NSLog(@"[AppDelegate] APNS Device Token (first 40 chars): %@", 
        [tokenString substringToIndex:MIN((NSUInteger)40, tokenString.length)]);
  
  // Forward to Firebase - CRITICAL step
  // This ensures Firebase SDK has the APNS token needed to work with FCM
  NSLog(@"[AppDelegate] Forwarding APNS token to Firebase");
  [FIRMessaging messaging].APNSToken = deviceToken;
  
  NSLog(@"[AppDelegate] ✅ APNS token successfully forwarded to Firebase");
  NSLog(@"[AppDelegate] ========== APNS TOKEN RECEIVED END ==========");
}

- (void)application:(UIApplication *)application
    didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  NSLog(@"[AppDelegate] ❌ FAILED TO REGISTER FOR REMOTE NOTIFICATIONS");
  NSLog(@"[AppDelegate] Error Code: %ld", (long)error.code);
  NSLog(@"[AppDelegate] Error Domain: %@", error.domain);
  NSLog(@"[AppDelegate] Error Description: %@", error.localizedDescription);
  NSLog(@"[AppDelegate] Error Suggestion: %@", error.localizedFailureReason);
  
  NSLog(@"[AppDelegate] Make sure:");
  NSLog(@"[AppDelegate] 1. Valid APNs certificate in Apple Developer account");
  NSLog(@"[AppDelegate] 2. Provisioning profile includes remote notification capability");
  NSLog(@"[AppDelegate] 3. push-notification entitlement is set in app.entitlements");
}

// MARK: - UserNotificationCenter Delegate Methods (iOS Notification Handling)

/**
 * Called when a notification arrives while the app is in the FOREGROUND
 * This is equivalent to Android's onMessageReceived when the app is open
 * Same behavior: post notification to system tray with badge, sound, and alert
 */
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSLog(@"[AppDelegate] ========== FOREGROUND NOTIFICATION START ==========");
  NSLog(@"[AppDelegate] Notification received while app is FOREGROUND");
  
  UNNotificationContent *content = notification.request.content;
  NSLog(@"[AppDelegate] Title: %@", content.title);
  NSLog(@"[AppDelegate] Body: %@", content.body);
  NSLog(@"[AppDelegate] Badge: %@", content.badge);
  NSLog(@"[AppDelegate] Sound: %@", content.sound);
  NSLog(@"[AppDelegate] User Info: %@", content.userInfo);
  
  // Show ALL notification indicators like Android does:
  // - Banner/Alert (like Android notification in tray)
  // - Badge (like Android app badge icon)
  // - Sound (like Android notification sound)
  
  UNNotificationPresentationOptions presentationOptions;
  
  if (@available(iOS 14.0, *)) {
    // iOS 14+: Use banner style
    NSLog(@"[AppDelegate] Using iOS 14+ banner style");
    presentationOptions = UNNotificationPresentationOptionBanner |
                         UNNotificationPresentationOptionSound |
                         UNNotificationPresentationOptionBadge;
  } else {
    // iOS 12-13: Use alert style
    NSLog(@"[AppDelegate] Using iOS 12-13 alert style");
    presentationOptions = UNNotificationPresentationOptionAlert |
                         UNNotificationPresentationOptionSound |
                         UNNotificationPresentationOptionBadge;
  }
  
  NSLog(@"[AppDelegate] ✅ Foreground notification will be presented with all options");
  NSLog(@"[AppDelegate] ========== FOREGROUND NOTIFICATION END ==========");
  
  completionHandler(presentationOptions);
}

/**
 * Called when the user taps a notification or the app is launched from a notification
 * Handles both:
 * - BACKGROUND state: User was in another app, taps notification, app comes to foreground
 * - KILLED state: App was not running, user taps notification, app is launched
 * Equivalent to Android's notification tap opening MainActivity
 */
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  NSLog(@"[AppDelegate] ========== NOTIFICATION TAP/LAUNCH START ==========");
  NSLog(@"[AppDelegate] User interaction: notification tapped or app launched");
  
  UNNotification *notification = response.notification;
  UNNotificationContent *content = notification.request.content;
  
  NSLog(@"[AppDelegate] Action: %@", response.actionIdentifier);
  NSLog(@"[AppDelegate] Title: %@", content.title);
  NSLog(@"[AppDelegate] Body: %@", content.body);
  
  NSString *appState;
  switch ([[UIApplication sharedApplication] applicationState]) {
    case UIApplicationStateBackground:
      appState = @"BACKGROUND";
      break;
    case UIApplicationStateInactive:
      appState = @"INACTIVE";
      break;
    case UIApplicationStateActive:
      appState = @"FOREGROUND";
      break;
    default:
      appState = @"UNKNOWN";
  }
  NSLog(@"[AppDelegate] App State: %@", appState);
  NSLog(@"[AppDelegate] User Info: %@", content.userInfo);
  
  // Firebase SDK + RNFirebase automatically route this notification to:
  // - onNotificationOpenedApp() listener (if app was backgrounded)
  // - getInitialNotification() listener (if app was killed/launched fresh)
  // The JS handlers will then navigate to the appropriate screen
  
  NSLog(@"[AppDelegate] ✅ Notification interaction forwarded to Firebase SDK and JS handlers");
  NSLog(@"[AppDelegate] ========== NOTIFICATION TAP/LAUNCH END ==========");
  
  completionHandler();
}

@end