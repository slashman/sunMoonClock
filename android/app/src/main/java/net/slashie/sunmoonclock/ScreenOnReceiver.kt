package net.slashie.sunmoonclock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ScreenOnReceiver : BroadcastReceiver() {

	override fun onReceive(context: Context, intent: Intent) {
		if (intent.action == Intent.ACTION_USER_PRESENT) {
			ClockWidgetProvider.triggerImmediateRefresh(context)
		}
	}
}
