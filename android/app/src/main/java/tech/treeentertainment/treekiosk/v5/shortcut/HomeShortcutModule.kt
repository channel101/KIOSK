package tech.treeentertainment.treekiosk.v5.shortcut

import android.app.PendingIntent
import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.*
import tech.treeentertainment.treekiosk.v5.MainActivity
import tech.treeentertainment.treekiosk.v5.R

class HomeShortcutModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "HomeShortcut"

    @ReactMethod
    fun addShortcut(
        id: String,
        label: String,
        url: String,
        promise: Promise,
    ) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Android 8.0 미만")
            return
        }

        val shortcutManager =
            reactContext.getSystemService(ShortcutManager::class.java)
                ?: run {
                    promise.reject("NO_MANAGER", "ShortcutManager 없음")
                    return
                }

        if (!shortcutManager.isRequestPinShortcutSupported) {
            promise.reject("NOT_SUPPORTED", "런처가 홈화면 바로가기 미지원")
            return
        }

        val exists = shortcutManager.pinnedShortcuts.any { it.id == id } ||
                     shortcutManager.dynamicShortcuts.any { it.id == id }

        if (exists) {
            promise.resolve("EXISTS")
            return
        }

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url), reactContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val shortcut = ShortcutInfo.Builder(reactContext, id)
            .setShortLabel(label.take(10))
            .setLongLabel(label)
            .setIcon(Icon.createWithResource(reactContext, R.mipmap.ic_launcher))
            .setIntent(intent)
            .build()

        val callbackIntent = shortcutManager.createShortcutResultIntent(shortcut)
        val successCallback = PendingIntent.getBroadcast(
            reactContext,
            0,
            callbackIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val requested = shortcutManager.requestPinShortcut(shortcut, successCallback.intentSender)

        if (requested) {
            promise.resolve("REQUESTED")
        } else {
            promise.reject("FAILED", "Shortcut 요청 실패")
        }
    }
}