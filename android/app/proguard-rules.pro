# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ============================================
# REACT NATIVE
# ============================================
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *

-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.turbomodule.** { *; }
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }

# ============================================
# REACT NATIVE VOICE - CRITICAL
# ============================================
# Keep all voice recognition classes
-keep class com.wenkesj.voice.** { *; }
-keep class com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter { *; }

# Keep speech recognition related classes
-keep class android.speech.** { *; }
-keep class com.google.android.gms.** { *; }

# Don't obfuscate voice-related models
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exception

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# ============================================
# GOOGLE PLAY SERVICES
# ============================================
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

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
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# ============================================
# OKHTTP
# ============================================
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# ============================================
# GENERAL ANDROID
# ============================================
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Keep serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ============================================
# ANDROIDX
# ============================================
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**