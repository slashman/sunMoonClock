package net.slashie.sunmoonclock

import android.app.Application
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat

class ClockApp : Application() {

	override fun onCreate() {
		super.onCreate()
		val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
		ContextCompat.registerReceiver(
			this,
			ScreenOnReceiver(),
			filter,
			ContextCompat.RECEIVER_NOT_EXPORTED,
		)
	}
}
