package net.slashie.minstrelsclock

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.view.WindowCompat

class MainActivity : Activity() {

	private lateinit var webView: WebView

	@SuppressLint("ClickableViewAccessibility")
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		WindowCompat.setDecorFitsSystemWindows(window, false)
		window.statusBarColor = Color.TRANSPARENT
		window.navigationBarColor = Color.TRANSPARENT
		setContentView(R.layout.activity_main)

		webView = findViewById(R.id.web_view)
		webView.setBackgroundColor(Color.BLACK)
		webView.webViewClient = WebViewClient()
		webView.settings.javaScriptEnabled = true
		webView.settings.domStorageEnabled = true
		webView.overScrollMode = View.OVER_SCROLL_NEVER
		webView.isVerticalScrollBarEnabled = false
		webView.isHorizontalScrollBarEnabled = false
		webView.setOnTouchListener { _, event -> event.action == MotionEvent.ACTION_MOVE }

		if (savedInstanceState == null) {
			webView.loadUrl(PAGE_URL)
		} else {
			webView.restoreState(savedInstanceState)
		}
	}

	override fun onSaveInstanceState(outState: Bundle) {
		super.onSaveInstanceState(outState)
		webView.saveState(outState)
	}

	override fun onBackPressed() {
		if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
	}

	companion object {
		private const val PAGE_URL = "https://slashie.net/tmc"
	}
}
