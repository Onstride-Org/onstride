import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.smartup.gl_horses"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.smartup.gl_horses"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    flavorDimensions += "env"
    productFlavors {
        create("dev") {
            dimension = "env"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            resValue("string", "app_name", "OnStride Dev")
            manifestPlaceholders.putAll(
                mapOf(
                    "AF_DEV_KEY" to "jPxCdgKBwUvC8i3YEUb3fV",
                    "ONE_LINK_ID" to "zZLs",
                )
            )
        }
        create("staging") {
            dimension = "env"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            resValue("string", "app_name", "OnStride Staging")
            manifestPlaceholders.putAll(
                mapOf(
                    "AF_DEV_KEY" to "jPxCdgKBwUvC8i3YEUb3fV",
                    "ONE_LINK_ID" to "S3Lm",
                )
            )
        }
        create("prod") {
            dimension = "env"
            resValue("string", "app_name", "OnStride")
            manifestPlaceholders.putAll(
                mapOf(
                    "AF_DEV_KEY" to "jPxCdgKBwUvC8i3YEUb3fV",
                    "ONE_LINK_ID" to "S3Lm",
                )
            )
        }
    }

    // Load keystore props
    val keystoreProps = Properties()
    val propsFile = rootProject.file("key.properties")
    if (propsFile.exists()) {
        keystoreProps.load(FileInputStream(propsFile))
    } else {
        throw GradleException("Missing android/key.properties. Create it with storeFile, storePassword, keyAlias, keyPassword.")
    }

    val storeFilePath = keystoreProps.getProperty("storeFile")
        ?: throw GradleException("key.properties is missing 'storeFile'")
    val storePass = keystoreProps.getProperty("storePassword")
        ?: throw GradleException("key.properties is missing 'storePassword'")
    val keyAlias = keystoreProps.getProperty("keyAlias")
        ?: throw GradleException("key.properties is missing 'keyAlias'")
    val keyPass = keystoreProps.getProperty("keyPassword")
        ?: throw GradleException("key.properties is missing 'keyPassword'")

    val storeFileObj = file(storeFilePath)
    if (!storeFileObj.exists()) {
        throw GradleException("Keystore file not found at: $storeFilePath (resolved to ${storeFileObj.absolutePath})")
    }

    signingConfigs {
        create("release") {
            storeFile = storeFileObj
            storePassword = storePass
            this.keyAlias = keyAlias
            keyPassword = keyPass
        }
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                file("proguard-rules.pro"),
            )
        }
        getByName("debug") {
            isMinifyEnabled = true
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                file("proguard-rules.pro")
            )
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation("com.google.android.material:material:1.12.0")
    implementation(platform("com.google.firebase:firebase-bom:34.0.0"))
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
