package net.slashie.minstrelsclock

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.TimeZone

private const val TAG = "RefreshWorker"
private const val PREFS_NAME = "smc_widget_prefs"
private const val KEY_HAS_EVER_LOADED = "has_ever_loaded"

class RefreshWorker(
	context: Context,
	params: WorkerParameters,
) : CoroutineWorker(context, params) {

	override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
		val mgr = AppWidgetManager.getInstance(applicationContext)
		val component = ComponentName(applicationContext, ClockWidgetProvider::class.java)
		val widgetIds = mgr.getAppWidgetIds(component)
		val url = buildUrl(BuildConfig.CLOCK_URL, TimeZone.getDefault().id)
		Log.d(TAG, "doWork: widgetIds=${widgetIds.size} url=$url")
		if (widgetIds.isEmpty()) return@withContext Result.success()

		val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

		val bitmap = try {
			fetchBitmap(url)
		} catch (e: Exception) {
			Log.e(TAG, "fetch failed for $url", e)
			if (!prefs.getBoolean(KEY_HAS_EVER_LOADED, false)) {
				widgetIds.forEach { id ->
					val views = RemoteViews(applicationContext.packageName, R.layout.widget_clock)
					views.setViewVisibility(R.id.clock_image, View.GONE)
					views.setViewVisibility(R.id.clock_error, View.VISIBLE)
					ClockWidgetProvider.applyLaunchIntent(applicationContext, views)
					mgr.updateAppWidget(id, views)
				}
			}
			return@withContext Result.retry()
		}

		Log.d(TAG, "fetched bitmap ${bitmap.width}x${bitmap.height}, updating ${widgetIds.size} widget(s)")
		widgetIds.forEach { id ->
			val views = RemoteViews(applicationContext.packageName, R.layout.widget_clock)
			views.setImageViewBitmap(R.id.clock_image, bitmap)
			views.setViewVisibility(R.id.clock_image, View.VISIBLE)
			views.setViewVisibility(R.id.clock_error, View.GONE)
			ClockWidgetProvider.applyLaunchIntent(applicationContext, views)
			mgr.updateAppWidget(id, views)
		}
		prefs.edit().putBoolean(KEY_HAS_EVER_LOADED, true).apply()
		Result.success()
	}

	private fun buildUrl(base: String, tz: String): String {
		val sep = if (base.contains('?')) '&' else '?'
		return base + sep + "tz=" + URLEncoder.encode(tz, "UTF-8")
	}

	private fun fetchBitmap(url: String): Bitmap {
		val conn = (URL(url).openConnection() as HttpURLConnection).apply {
			connectTimeout = 8_000
			readTimeout = 12_000
			requestMethod = "GET"
		}
		try {
			conn.inputStream.use { input ->
				return BitmapFactory.decodeStream(input)
					?: error("decodeStream returned null")
			}
		} finally {
			conn.disconnect()
		}
	}
}
