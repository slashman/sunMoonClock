import SwiftUI
import WebKit

struct ContentView: View {
	private static let pageURL = URL(string: "https://slashie.net/tmc")!

	var body: some View {
		ClockWebView(url: Self.pageURL)
			.background(Color.black)
	}
}

private struct ClockWebView: UIViewRepresentable {
	let url: URL

	func makeUIView(context: Context) -> WKWebView {
		let config = WKWebViewConfiguration()
		config.websiteDataStore = .default()
		let webView = WKWebView(frame: .zero, configuration: config)
		webView.scrollView.bounces = true
		webView.scrollView.alwaysBounceVertical = true
		webView.isOpaque = false
		webView.backgroundColor = .black
		webView.scrollView.backgroundColor = .black
		let refresh = UIRefreshControl()
		refresh.tintColor = .white
		refresh.addTarget(context.coordinator, action: #selector(Coordinator.handleRefresh(_:)), for: .valueChanged)
		webView.scrollView.refreshControl = refresh
		context.coordinator.webView = webView
		webView.load(URLRequest(url: url))
		return webView
	}

	func updateUIView(_ uiView: WKWebView, context: Context) {}

	func makeCoordinator() -> Coordinator { Coordinator() }

	final class Coordinator: NSObject {
		weak var webView: WKWebView?

		@objc func handleRefresh(_ sender: UIRefreshControl) {
			webView?.reload()
			DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
				sender.endRefreshing()
			}
		}
	}
}
