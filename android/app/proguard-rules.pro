# CRITICAL: Add Google Sign-In ProGuard rules

# ============================================
# GOOGLE PLAY SERVICES & GOOGLE SIGN-IN
# ============================================
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

-keep class com.google.api.client.** { *; }
-dontwarn com.google.api.client.**

# Keep Google Sign-In classes
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }

# ============================================
# REACT NATIVE APP AUTH
# ============================================
-keep class net.openid.appauth.** { *; }
-dontwarn net.openid.appauth.**

# Keep OAuth redirect handling
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ============================================
# REACT NATIVE
# ============================================
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.turbomodule.** { *; }
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }

# ============================================
# FIREBASE
# ============================================
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ============================================
# KOTLIN
# ============================================
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**

# ============================================
# ANDROIDX
# ============================================
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ============================================
# OKHTTP
# ============================================
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Keep serializable
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable