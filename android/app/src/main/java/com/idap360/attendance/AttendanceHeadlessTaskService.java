// ─────────────────────────────────────────────────────────────────────────────
// android/app/src/main/java/com/authentication/attendance/AttendanceHeadlessTaskService.java
//
// A React Native HeadlessJsTaskService that executes the JS 'AttendanceAction'
// headless task when the app is killed and a notification button is tapped.
//
// React Native's HeadlessJsTaskService handles:
//   • Starting the JS runtime if it isn't running
//   • Passing taskData to AppRegistry.getRunnable('AttendanceAction')
//   • Keeping a wake lock for the duration of the task
// ─────────────────────────────────────────────────────────────────────────────
package com.idap360.attendance;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class AttendanceHeadlessTaskService extends HeadlessJsTaskService {

    @Nullable
    @Override
    protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras == null) return null;

        String action = extras.getString("action", "");

        // Build the taskData that JS receives as the first argument
        // of AttendanceHeadlessTask(taskData)
        com.facebook.react.bridge.WritableMap taskData = Arguments.createMap();
        taskData.putString("action", action);

        return new HeadlessJsTaskConfig(
            "AttendanceAction",  // must match AppRegistry.registerHeadlessTask name
            taskData,
            5000,   // timeout ms — task must finish within 5 s or it is killed
            true    // allowedInForeground — safe to run even if app is open
        );
    }
}
