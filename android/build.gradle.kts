plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

// Included build: consumers use `includeBuild("shared/android")` and depend on "ai.hey:tokens-compose".
group = "ai.hey"
version = "0.4.0"

android {
    namespace = "ai.hey.tokens"
    compileSdk = 36
    defaultConfig { minSdk = 28 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }

dependencies {
    val bom = platform(libs.compose.bom)
    implementation(bom)
    api(libs.compose.ui.graphics)
    api(libs.compose.ui.unit)
}
