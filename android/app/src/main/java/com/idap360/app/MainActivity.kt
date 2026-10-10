package com.idap360.app

import android.content.Intent
import com.idap360.attendance.AttendanceIntentModule
import com.oblador.vectoricons.VectorIconsPackage
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "Authentication"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Called when a notification action button (Clock-Out / Break) is tapped while
   * the app is already running. Forwards the intent to AttendanceIntentModule so
   * JS receives the AttendanceNotificationAction event.
   */
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let {
      setIntent(it) // ensures getIntent() returns the latest intent
      AttendanceIntentModule.onNewIntentReceived(it)
    }
  }
}