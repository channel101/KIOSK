package tech.treeentertainment.treekiosk.v5.kiosk

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import tech.treeentertainment.treekiosk.v5.accessibility.KioskPrefs

class KioskModule(
    private val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
    override fun getName() = "KioskModule"

    @ReactMethod
    fun enableKiosk() {
        KioskPrefs.setEnabled(context, true)
    }

    @ReactMethod
    fun disableKiosk() {
        KioskPrefs.setEnabled(context, false)
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        val expectedComponent =
            "${context.packageName}/tech.treeentertainment.treekiosk.v5.accessibility.KioskAccessibilityService"

        val enabledServices =
            Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
            ) ?: ""

        promise.resolve(enabledServices.split(":").any { it.equals(expectedComponent, true) })
    }

    @ReactMethod
    fun isKioskEnabled(promise: Promise) {
        promise.resolve(KioskPrefs.isEnabled(context))
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val pkg = context.packageName

        val accessibilityIntent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)

        try {
            val pm = context.packageManager
            val handlers = pm.queryIntentActivities(accessibilityIntent, 0)
            val preferred = handlers.firstOrNull {
                val name = it.activityInfo.packageName
                name.contains("settings", true) || name.contains("samsung", true)
            }

            if (preferred != null) {
                val comp = ComponentName(preferred.activityInfo.packageName, preferred.activityInfo.name)
                val i = Intent().setComponent(comp).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
                context.startActivity(i)
                return
            }
        } catch (e: Exception) {
            // ignore and fall back
        }

        // Fallback: open generic accessibility settings, then app details if that fails
        try {
            accessibilityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(accessibilityIntent)
        } catch (e: Exception) {
            val details = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                data = Uri.parse("package:$pkg")
            }
            context.startActivity(details)
        }
    }
}
