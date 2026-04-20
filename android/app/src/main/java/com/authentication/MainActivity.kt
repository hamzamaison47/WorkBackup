package com.authentication

import android.content.Intent
import com.authentication.attendance.AttendanceIntentModule
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "Authentication"

  /**
   * React Native New Architecture delegate
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Called when a notification action is pressed while the app
   * is already running (foreground or background).
   */
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)

    intent?.let {
      setIntent(it) // ensures getIntent() returns latest intent
      AttendanceIntentModule.onNewIntentReceived(it)
    }
  }
}