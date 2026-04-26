plugins {
	id("com.android.application")
	id("org.jetbrains.kotlin.android")
}

android {
	namespace = "net.slashie.sunmoonclock"
	compileSdk = 34

	defaultConfig {
		applicationId = "net.slashie.sunmoonclock"
		minSdk = 24
		targetSdk = 34
		versionCode = 1
		versionName = "0.1"

		// Hardcoded URL the widget fetches. Change for your deployment.
		// 10.0.2.2 reaches the host machine from the Android emulator,
		// so the renderer running on http://localhost:3000 is reachable
		// at http://10.0.2.2:3000 from inside the emulator.
		buildConfigField("String", "CLOCK_URL", "\"http://10.0.2.2:3000/current\"")
	}

	buildFeatures {
		buildConfig = true
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}

	kotlinOptions {
		jvmTarget = "17"
	}

	buildTypes {
		release {
			isMinifyEnabled = false
		}
	}
}

dependencies {
	implementation("androidx.core:core-ktx:1.13.1")
	implementation("androidx.work:work-runtime-ktx:2.9.1")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
