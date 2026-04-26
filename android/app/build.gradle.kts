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

		// URL the widget fetches the clock PNG from. Hardcoded per deployment.
		buildConfigField("String", "CLOCK_URL", "\"https://slashie.net/time/current\"")
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
