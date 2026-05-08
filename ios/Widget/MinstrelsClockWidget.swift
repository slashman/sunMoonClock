import WidgetKit
import SwiftUI

@main
struct MinstrelsClockWidgetBundle: WidgetBundle {
	var body: some Widget {
		MinstrelsClockWidget()
	}
}

struct MinstrelsClockWidget: Widget {
	let kind: String = "MinstrelsClockWidget"

	var body: some WidgetConfiguration {
		let config = StaticConfiguration(kind: kind, provider: ClockTimelineProvider()) { entry in
			ClockWidgetView(entry: entry)
				.containerBackgroundCompat(SkyColor.backdrop(at: entry.date))
		}
		.configurationDisplayName("The Minstrel")
		.description("A live sun and moon clock for your home screen.")
		.supportedFamilies([.systemMedium])

		// iOS 17+ automatically insets widget content from the cell edges; disable
		// those margins so the clock PNG can fill the cell vertically.
		if #available(iOSApplicationExtension 17.0, *) {
			return config.contentMarginsDisabled()
		} else {
			return config
		}
	}
}

struct ClockEntry: TimelineEntry {
	let date: Date
	let imageData: Data?
	let isPlaceholder: Bool
}

struct ClockTimelineProvider: TimelineProvider {
	func placeholder(in context: Context) -> ClockEntry {
		ClockEntry(date: Date(), imageData: nil, isPlaceholder: true)
	}

	func getSnapshot(in context: Context, completion: @escaping (ClockEntry) -> Void) {
		Task {
			let data = (try? await fetchClockImage()) ?? loadCachedImage()
			completion(ClockEntry(date: Date(), imageData: data, isPlaceholder: false))
		}
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<ClockEntry>) -> Void) {
		Task {
			let now = Date()
			let fresh = try? await fetchClockImage()
			if let fresh = fresh { saveCachedImage(fresh) }
			// On failure, fall back to the last good PNG from disk so transient blips
			// keep the clock visible. The error view only renders when there is no
			// cache yet — i.e. first install while offline.
			let data = fresh ?? loadCachedImage()
			// Success: ask for the next reload at the top of the next minute. iOS will
			// throttle further but this is the right ask. Failure: retry in 2 minutes.
			let nextReload = Calendar.current.date(byAdding: .second, value: fresh == nil ? 120 : 60, to: now) ?? now.addingTimeInterval(60)
			let entry = ClockEntry(date: now, imageData: data, isPlaceholder: false)
			completion(Timeline(entries: [entry], policy: .after(nextReload)))
		}
	}

	private func fetchClockImage() async throws -> Data {
		let url = ClockEndpoint.currentURL()
		var request = URLRequest(url: url)
		request.timeoutInterval = 10
		let (data, response) = try await URLSession.shared.data(for: request)
		guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
			throw URLError(.badServerResponse)
		}
		return data
	}

	private func cachedImageURL() -> URL? {
		FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.appendingPathComponent("last-clock.png")
	}

	private func saveCachedImage(_ data: Data) {
		guard let url = cachedImageURL() else { return }
		try? data.write(to: url, options: .atomic)
	}

	private func loadCachedImage() -> Data? {
		guard let url = cachedImageURL() else { return nil }
		return try? Data(contentsOf: url)
	}
}

struct ClockWidgetView: View {
	let entry: ClockEntry

	// The renderer outputs 384x288 PNGs whose visible content (arch + scene)
	// sits within rows 24..242. Cropping out the transparent border lets the
	// widget cell host the art at a near-2:1 aspect with less empty sky-blue
	// padding. If the renderer's container height or mask changes, update.
	private static let contentTopInset: CGFloat = 24
	private static let contentBottomInset: CGFloat = 0

	var body: some View {
		if let data = entry.imageData,
		   let cgImage = UIImage(data: data)?.cgImage,
		   let cropped = cgImage.cropping(to: CGRect(
			   x: 0,
			   y: Self.contentTopInset,
			   width: CGFloat(cgImage.width),
			   height: CGFloat(cgImage.height) - Self.contentTopInset - Self.contentBottomInset)) {
			Image(decorative: cropped, scale: 1, orientation: .up)
				.resizable()
				.interpolation(.none)
				.aspectRatio(contentMode: .fit)
				.frame(maxWidth: .infinity, maxHeight: .infinity)
		} else if entry.isPlaceholder {
			ProgressView()
				.frame(maxWidth: .infinity, maxHeight: .infinity)
		} else {
			Text("Couldn’t reach the minstrel")
				.foregroundColor(.white)
				.multilineTextAlignment(.center)
				.padding()
				.frame(maxWidth: .infinity, maxHeight: .infinity)
		}
	}
}

private extension View {
	@ViewBuilder
	func containerBackgroundCompat(_ color: Color) -> some View {
		if #available(iOSApplicationExtension 17.0, *) {
			self.containerBackground(color, for: .widget)
		} else {
			self.background(color)
		}
	}
}
