import SwiftUI

@main
struct SunMoonClockApp: App {
	var body: some Scene {
		WindowGroup {
			ContentView()
				.ignoresSafeArea(.all, edges: .bottom)
		}
	}
}
