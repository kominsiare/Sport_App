plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val pllayzStorePassword = System.getenv("PLLAYZ_ANDROID_STORE_PASSWORD")
val pllayzKeyPassword = System.getenv("PLLAYZ_ANDROID_KEY_PASSWORD")
val pllayzStoreFile = file(
    "${System.getProperty("user.home")}/.config/pllayz/android/pllayz-release.jks"
)

android {
    namespace = "io.pllayz.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "io.pllayz.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (
            pllayzStoreFile.exists() &&
            pllayzStorePassword != null &&
            pllayzKeyPassword != null
        ) {
            create("pllayzRelease") {
                storeFile = pllayzStoreFile
                storePassword = pllayzStorePassword
                keyAlias = "pllayz"
                keyPassword = pllayzKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("pllayzRelease")
                ?: signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
