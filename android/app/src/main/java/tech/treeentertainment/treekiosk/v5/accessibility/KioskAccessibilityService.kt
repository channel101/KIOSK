package tech.treeentertainment.treekiosk.v5.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import tech.treeentertainment.treekiosk.v5.MainActivity

class KioskAccessibilityService : AccessibilityService() {

    private val kioskPackage =
        "tech.treeentertainment.treekiosk.v5"

    private var lastBringTime = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        if (!KioskPrefs.isEnabled(this)) return

        val pkg = event.packageName?.toString() ?: return

        if (pkg != kioskPackage) {
            bringKioskToFront()
        }
    }

    override fun onInterrupt() {}

    private fun bringKioskToFront() {
        val now = System.currentTimeMillis()
        if (now - lastBringTime < 500) return
        lastBringTime = now

        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        startActivity(intent)
    }
}