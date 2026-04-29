import Foundation

enum ClockEndpoint {
	static func currentURL(timeZone: TimeZone = .current) -> URL {
		guard let base = Bundle.main.object(forInfoDictionaryKey: "CLOCK_URL") as? String,
			var components = URLComponents(string: base)
		else {
			fatalError("CLOCK_URL missing from Info.plist; check Shared.xcconfig")
		}
		var items = components.queryItems ?? []
		items.append(URLQueryItem(name: "tz", value: timeZone.identifier))
		components.queryItems = items
		guard let url = components.url else {
			fatalError("Failed to build clock URL from \(base)")
		}
		return url
	}
}
