import SwiftUI

// Port of the sky-color model from web/src/smc.js (getSunStrength + skyColor.getColor).
// Keep in sync with that file — constants here mirror EARTH, SUNLIGHT, MOONLIGHT.
enum SkyColor {
	private static let atmosphereDiffraction = (r: 0.15, g: 0.48, b: 0.84)
	private static let sunlight = (r: 255.0, g: 255.0, b: 255.0)
	private static let moonlight = (r: 80.0, g: 80.0, b: 80.0)

	// Mirrors getSunStrength(hour) in smc.js. `hhmm` is an integer like 1430 for 14:30.
	private static func sunStrength(hhmm: Int) -> Double {
		var h = max(0, min(2359, hhmm))
		if h > 1200 { h = 2400 - h }
		let x = Double(h) / 439.73631426292
		return 1.0007721047271 * (1 - pow(1 + pow(x, 7.8143467692704), -0.913569795416587))
	}

	// Mirrors skyColor.getColor in smc.js, then darkens by `contrastFactor` so the
	// PNG (which uses the un-darkened sky inside the arch) reads against this backdrop.
	static func backdrop(at date: Date, contrastFactor: Double = 0.65) -> Color {
		let comps = Calendar.current.dateComponents([.hour, .minute], from: date)
		let hhmm = (comps.hour ?? 0) * 100 + (comps.minute ?? 0)
		let sun = sunStrength(hhmm: hhmm)
		let moon = 1 - sun

		func channel(_ light: Double, _ dark: Double, _ diff: Double) -> Double {
			let raw = light * sun * diff + dark * moon * diff
			return min(255, raw) * contrastFactor
		}

		let r = channel(sunlight.r, moonlight.r, atmosphereDiffraction.r)
		let g = channel(sunlight.g, moonlight.g, atmosphereDiffraction.g)
		let b = channel(sunlight.b, moonlight.b, atmosphereDiffraction.b)
		return Color(red: r / 255, green: g / 255, blue: b / 255)
	}
}
