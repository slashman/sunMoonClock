package net.slashie.minstrelsclock

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class ClockWidgetProvider : AppWidgetProvider() {

	override fun onEnabled(context: Context) {
		super.onEnabled(context)
		schedulePeriodicRefresh(context)
	}

	override fun onDisabled(context: Context) {
		super.onDisabled(context)
		WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_WORK_NAME)
	}

	override fun onUpdate(
		context: Context,
		appWidgetManager: AppWidgetManager,
		appWidgetIds: IntArray,
	) {
		appWidgetIds.forEach { id ->
			val views = RemoteViews(context.packageName, R.layout.widget_clock)
			applyLaunchIntent(context, views)
			appWidgetManager.updateAppWidget(id, views)
		}
		triggerImmediateRefresh(context)
	}

	companion object {
		private const val PERIODIC_WORK_NAME = "smc_widget_periodic"
		private const val ONESHOT_WORK_NAME = "smc_widget_oneshot"

		private val networkConstraint = Constraints.Builder()
			.setRequiredNetworkType(NetworkType.CONNECTED)
			.build()

		private fun schedulePeriodicRefresh(context: Context) {
			val request = PeriodicWorkRequestBuilder<RefreshWorker>(15, TimeUnit.MINUTES)
				.setConstraints(networkConstraint)
				.build()
			WorkManager.getInstance(context).enqueueUniquePeriodicWork(
				PERIODIC_WORK_NAME,
				ExistingPeriodicWorkPolicy.KEEP,
				request,
			)
		}

		fun triggerImmediateRefresh(context: Context) {
			val request = OneTimeWorkRequestBuilder<RefreshWorker>()
				.setConstraints(networkConstraint)
				.build()
			WorkManager.getInstance(context).enqueueUniqueWork(
				ONESHOT_WORK_NAME,
				ExistingWorkPolicy.REPLACE,
				request,
			)
		}

		fun applyLaunchIntent(context: Context, views: RemoteViews) {
			val intent = Intent(context, MainActivity::class.java).apply {
				flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
			}
			val pending = PendingIntent.getActivity(
				context,
				0,
				intent,
				PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
			)
			views.setOnClickPendingIntent(R.id.widget_root, pending)
		}
	}
}
