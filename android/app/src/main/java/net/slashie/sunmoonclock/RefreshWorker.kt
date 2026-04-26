package net.slashie.sunmoonclock

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

private const val TAG = "RefreshWorker"

class RefreshWorker(
	context: Context,
	params: WorkerParameters,
) : CoroutineWorker(context, params) {

	override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
		val mgr = AppWidgetManager.getInstance(applicationContext)
		val component = ComponentName(applicationContext, ClockWidgetProvider::class.java)
		val widgetIds = mgr.getAppWidgetIds(component)
		Log.d(TAG, "doWork: widgetIds=${widgetIds.size} url=${BuildConfig.CLOCK_URL}")
		if (widgetIds.isEmpty()) return@withContext Result.success()

		val bitmap = try {
			fetchBitmap(BuildConfig.CLOCK_URL)
		} catch (e: Exception) {
			Log.e(TAG, "fetch failed for ${BuildConfig.CLOCK_URL}", e)
			return@withContext Result.retry()
		}

		Log.d(TAG, "fetched bitmap ${bitmap.width}x${bitmap.height}, updating ${widgetIds.size} widget(s)")
		widgetIds.forEach { id ->
			val views = RemoteViews(applicationContext.packageName, R.layout.widget_clock)
			views.setImageViewBitmap(R.id.clock_image, bitmap)
			mgr.updateAppWidget(id, views)
		}
		Result.success()
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
