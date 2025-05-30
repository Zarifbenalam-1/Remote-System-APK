# 08 - Building the APK

## Table of Contents
1. [Build System Overview](#build-system-overview)
2. [Gradle Build Configuration](#gradle-build-configuration)
3. [Build Variants and Flavors](#build-variants-and-flavors)
4. [Debug Build Process](#debug-build-process)
5. [Release Build Process](#release-build-process)
6. [Code Signing and Security](#code-signing-and-security)
7. [Build Optimization](#build-optimization)
8. [Continuous Integration](#continuous-integration)
9. [Build Troubleshooting](#build-troubleshooting)
10. [Distribution and Installation](#distribution-and-installation)

---

## Build System Overview

The Remote System APK uses **Gradle** as its build system, which is the standard for Android development. The build process involves multiple stages:

```
Source Code → Compilation → Resource Processing → 
Packaging → Signing → Optimization → APK Generation
```

### Build Types Available
- **Debug**: Development builds with debugging enabled
- **Release**: Production builds optimized for distribution
- **Custom**: Additional build types for testing environments

### Build Outputs
- **APK Files**: Android Application Package files
- **AAB Files**: Android App Bundle (for Play Store)
- **Mapping Files**: ProGuard/R8 obfuscation mappings
- **Build Reports**: Compilation and optimization reports

---

## Gradle Build Configuration

### 1. Project Structure
```
APK/
├── app/                    # Main application module
│   ├── build.gradle       # App-level build configuration
│   ├── proguard-rules.pro # Code obfuscation rules
│   └── src/               # Source code and resources
├── build.gradle           # Project-level build configuration
├── gradle.properties      # Gradle configuration properties
├── settings.gradle        # Project settings
└── gradle/                # Gradle wrapper files
```

### 2. Project-level build.gradle
```gradle
// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    ext.kotlin_version = "1.6.21"
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:7.2.1"
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        
        // Additional plugins
        classpath 'com.google.gms:google-services:4.3.10'
        classpath 'com.google.firebase:firebase-crashlytics-gradle:2.8.1'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}

// Project-wide properties
ext {
    compileSdkVersion = 32
    targetSdkVersion = 32
    minSdkVersion = 21
    buildToolsVersion = "32.0.0"
    
    // Library versions
    appCompatVersion = "1.4.2"
    materialVersion = "1.6.1"
    constraintLayoutVersion = "2.1.4"
}
```

### 3. App-level build.gradle
```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
    id 'kotlin-kapt'
}

android {
    compileSdk rootProject.ext.compileSdkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion

    defaultConfig {
        applicationId "com.remotesystem.apk"
        minSdk rootProject.ext.minSdkVersion
        targetSdk rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        
        // Custom fields accessible in code
        buildConfigField "String", "SERVER_BASE_URL", '"http://localhost:8080"'
        buildConfigField "boolean", "ENABLE_LOGGING", "true"
        
        // NDK configuration (if using native code)
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix ".debug"
            debuggable true
            minifyEnabled false
            shrinkResources false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            buildConfigField "String", "BUILD_TYPE_NAME", '"Debug"'
            resValue "string", "app_name", "Remote System Debug"
        }
        
        release {
            debuggable false
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            buildConfigField "String", "BUILD_TYPE_NAME", '"Release"'
            resValue "string", "app_name", "Remote System"
            
            // Enable code obfuscation
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        
        staging {
            initWith debug
            applicationIdSuffix ".staging"
            buildConfigField "String", "SERVER_BASE_URL", '"http://staging.server.com"'
            buildConfigField "String", "BUILD_TYPE_NAME", '"Staging"'
            resValue "string", "app_name", "Remote System Staging"
        }
    }

    productFlavors {
        free {
            dimension "version"
            applicationIdSuffix ".free"
            versionNameSuffix "-free"
            buildConfigField "boolean", "IS_PREMIUM", "false"
        }
        
        premium {
            dimension "version"
            applicationIdSuffix ".premium"
            versionNameSuffix "-premium"
            buildConfigField "boolean", "IS_PREMIUM", "true"
        }
    }
    
    flavorDimensions "version"

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = '11'
    }

    buildFeatures {
        viewBinding true
        dataBinding true
        buildConfig true
    }

    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/NOTICE.txt'
    }

    testOptions {
        unitTests {
            includeAndroidResources = true
            returnDefaultValues = true
        }
    }
    
    lint {
        abortOnError false
        checkReleaseBuilds false
        disable 'MissingTranslation'
    }
}

dependencies {
    // Core Android libraries
    implementation "androidx.appcompat:appcompat:$rootProject.ext.appCompatVersion"
    implementation "androidx.core:core-ktx:1.8.0"
    implementation "androidx.activity:activity-ktx:1.5.0"
    implementation "androidx.fragment:fragment-ktx:1.5.0"
    
    // UI libraries
    implementation "com.google.android.material:material:$rootProject.ext.materialVersion"
    implementation "androidx.constraintlayout:constraintlayout:$rootProject.ext.constraintLayoutVersion"
    implementation 'androidx.recyclerview:recyclerview:1.2.1'
    implementation 'androidx.cardview:cardview:1.0.0'
    
    // Network libraries
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.9.3'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.9.3'
    
    // Socket.IO for real-time communication
    implementation 'io.socket:socket.io-client:2.0.1'
    
    // Security
    implementation 'androidx.security:security-crypto:1.1.0-alpha04'
    
    // Lifecycle components
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.5.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.5.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.1'
    
    // JSON processing
    implementation 'com.google.code.gson:gson:2.9.0'
    
    // Image loading
    implementation 'com.github.bumptech.glide:glide:4.13.2'
    kapt 'com.github.bumptech.glide:compiler:4.13.2'
    
    // Testing libraries
    testImplementation 'junit:junit:4.13.2'
    testImplementation 'org.mockito:mockito-core:4.6.1'
    testImplementation 'org.robolectric:robolectric:4.8.1'
    testImplementation 'androidx.test:core:1.4.0'
    
    androidTestImplementation 'androidx.test.ext:junit:1.1.3'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.4.0'
    androidTestImplementation 'androidx.test:runner:1.4.0'
    androidTestImplementation 'androidx.test:rules:1.4.0'
}
```

### 4. gradle.properties
```properties
# Project-wide Gradle settings
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true
org.gradle.caching=true

# Android specific settings
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=true
android.nonFinalResIds=true

# Build performance optimizations
kotlin.code.style=official
kotlin.incremental=true
kotlin.incremental.multiplatform=true
kotlin.parallel.tasks.in.project=true

# Security settings (for CI/CD)
android.builder.sdkDownload=true
android.overrideVersionCheck=true
```

---

## Build Variants and Flavors

### Understanding Build Variants
Build variants are combinations of build types and product flavors:

```
Build Variant = Build Type + Product Flavor

Examples:
├── freeDebug       (free + debug)
├── freeRelease     (free + release)
├── premiumDebug    (premium + debug)
└── premiumRelease  (premium + release)
```

### Configuration by Variant
```gradle
android {
    buildTypes {
        debug {
            buildConfigField "String", "API_ENDPOINT", '"https://api-dev.example.com"'
            manifestPlaceholders = [appIcon: "@mipmap/ic_launcher_debug"]
        }
        release {
            buildConfigField "String", "API_ENDPOINT", '"https://api.example.com"'
            manifestPlaceholders = [appIcon: "@mipmap/ic_launcher"]
        }
    }
    
    productFlavors {
        free {
            buildConfigField "int", "MAX_CONNECTIONS", "1"
            resValue "string", "feature_set", "Basic"
        }
        premium {
            buildConfigField "int", "MAX_CONNECTIONS", "10"
            resValue "string", "feature_set", "Premium"
        }
    }
}
```

### Source Set Organization
```
app/src/
├── main/                   # Common code and resources
├── debug/                  # Debug-specific code
├── release/                # Release-specific code
├── free/                   # Free version specific code
├── premium/                # Premium version specific code
├── freeDebug/              # Free debug specific code
└── premiumRelease/         # Premium release specific code
```

---

## Debug Build Process

### 1. Building Debug APK

#### Command Line Build
```bash
# Navigate to project root
cd /path/to/Remote-System-APK/APK

# Build debug APK
./gradlew assembleDebug

# Build specific variant
./gradlew assembleFreeDebug
./gradlew assemblePremiumDebug

# Clean and build
./gradlew clean assembleDebug

# Build with specific properties
./gradlew assembleDebug -Pandroid.testInstrumentationRunnerArguments.class=com.example.TestClass
```

#### Android Studio Build
```
1. Open project in Android Studio
2. Select build variant: Build → Select Build Variant → freeDebug
3. Build APK: Build → Build Bundle(s) / APK(s) → Build APK(s)
4. Or use keyboard shortcut: Ctrl+F9 (Windows/Linux) or Cmd+F9 (Mac)
```

### 2. Debug Build Configuration
```gradle
android {
    buildTypes {
        debug {
            applicationIdSuffix ".debug"
            debuggable true
            minifyEnabled false
            shrinkResources false
            testCoverageEnabled true
            
            // Debug-specific configurations
            buildConfigField "boolean", "DEBUG_MODE", "true"
            buildConfigField "String", "LOG_LEVEL", '"VERBOSE"'
            
            // Manifest placeholders
            manifestPlaceholders = [
                appName: "Remote System Debug",
                appIcon: "@mipmap/ic_launcher_debug"
            ]
            
            // Signing config (uses debug keystore)
            signingConfig signingConfigs.debug
        }
    }
}
```

### 3. Debug APK Location
```
APK/app/build/outputs/apk/debug/
├── app-free-debug.apk           # Free debug variant
├── app-premium-debug.apk        # Premium debug variant
├── app-free-debug-unaligned.apk # Unaligned version
└── output-metadata.json         # Build metadata
```

---

## Release Build Process

### 1. Preparing for Release Build

#### Create Release Keystore
```bash
# Generate release keystore
keytool -genkey -v -keystore release-key.keystore -alias remotesystem -keyalg RSA -keysize 2048 -validity 10000

# Enter information when prompted:
# - Keystore password: [SECURE_PASSWORD]
# - Key password: [SECURE_PASSWORD]
# - Distinguished name info (Name, Organization, etc.)
```

#### Configure Signing in build.gradle
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../release-key.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "remotesystem"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. Release Build Commands
```bash
# Set environment variables
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"

# Build release APK
./gradlew assembleRelease

# Build specific release variant
./gradlew assembleFreeRelease
./gradlew assemblePremiumRelease

# Build Android App Bundle (for Play Store)
./gradlew bundleRelease

# Generate signed APK with specific flavor
./gradlew assemblePremiumRelease -Pandroid.injected.signing.store.file=release-key.keystore \
    -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
    -Pandroid.injected.signing.key.alias=remotesystem \
    -Pandroid.injected.signing.key.password=$KEY_PASSWORD
```

### 3. Release Build Optimization
```gradle
android {
    buildTypes {
        release {
            // Code obfuscation and optimization
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            // Disable debugging
            debuggable false
            jniDebuggable false
            renderscriptDebuggable false
            
            // Optimize for release
            zipAlignEnabled true
            
            // Version info
            buildConfigField "String", "BUILD_TIME", "\"${new Date().format('yyyy-MM-dd HH:mm:ss')}\""
            buildConfigField "String", "GIT_COMMIT", "\"${getGitCommitHash()}\""
        }
    }
}

// Helper function to get Git commit hash
def getGitCommitHash() {
    try {
        def stdout = new ByteArrayOutputStream()
        exec {
            commandLine 'git', 'rev-parse', '--short', 'HEAD'
            standardOutput = stdout
        }
        return stdout.toString().trim()
    } catch (Exception e) {
        return "unknown"
    }
}
```

---

## Code Signing and Security

### 1. Keystore Management

#### Security Best Practices
```bash
# Create secure keystore location
mkdir -p ~/.android/keystores
chmod 700 ~/.android/keystores

# Move keystore to secure location
mv release-key.keystore ~/.android/keystores/

# Set proper permissions
chmod 600 ~/.android/keystores/release-key.keystore
```

#### Environment Variable Setup
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_KEYSTORE_PATH="$HOME/.android/keystores/release-key.keystore"
export ANDROID_KEYSTORE_PASSWORD="your_secure_password"
export ANDROID_KEY_ALIAS="remotesystem"
export ANDROID_KEY_PASSWORD="your_secure_password"
```

### 2. ProGuard Configuration (proguard-rules.pro)
```proguard
# Add project specific ProGuard rules here.

# Keep application class
-keep public class com.remotesystem.apk.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom views
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
    public void set*(...);
    *** get*();
}

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep serializable classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep network libraries
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep class com.google.gson.** { *; }

# Keep Socket.IO
-keep class io.socket.** { *; }

# Keep security libraries
-keep class androidx.security.crypto.** { *; }

# Remove logging
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Optimization settings
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose
```

---

## Build Optimization

### 1. Gradle Performance Optimization

#### gradle.properties Optimizations
```properties
# JVM settings
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Parallel builds
org.gradle.parallel=true
org.gradle.workers.max=4

# Configure on demand
org.gradle.configureondemand=true

# Daemon
org.gradle.daemon=true

# Build cache
org.gradle.caching=true

# Kotlin compiler optimizations
kotlin.incremental=true
kotlin.incremental.multiplatform=true
kotlin.parallel.tasks.in.project=true
```

#### Build Cache Configuration
```gradle
// In settings.gradle
buildCache {
    local {
        enabled = true
        directory = new File(rootDir, 'build-cache')
        removeUnusedEntriesAfterDays = 30
    }
}
```

### 2. APK Size Optimization

#### Resource Optimization
```gradle
android {
    buildTypes {
        release {
            shrinkResources true
            minifyEnabled true
            
            // Keep only specific densities
            resConfigs "en", "xxhdpi"
        }
    }
    
    // Split APKs by architecture
    splits {
        abi {
            enable true
            reset()
            include 'x86', 'x86_64', 'arm64-v8a', 'armeabi-v7a'
            universalApk false
        }
    }
}
```

### 3. Build Performance Monitoring
```gradle
// Add to build.gradle for build time analysis
apply plugin: 'build-scan'

buildScan {
    termsOfServiceUrl = 'https://gradle.com/terms-of-service'
    termsOfServiceAgree = 'yes'
    
    publishAlways()
    
    tag 'CI'
    tag 'release'
    
    link 'GitHub', 'https://github.com/username/Remote-System-APK'
}
```

---

## Continuous Integration

### 1. GitHub Actions Configuration

#### .github/workflows/android.yml
```yaml
name: Android CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 11
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
        
    - name: Cache Gradle packages
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
          ${{ runner.os }}-gradle-
          
    - name: Grant execute permission for gradlew
      run: chmod +x APK/gradlew
      
    - name: Run unit tests
      run: cd APK && ./gradlew test
      
    - name: Run lint
      run: cd APK && ./gradlew lint
      
    - name: Build debug APK
      run: cd APK && ./gradlew assembleDebug
      
    - name: Upload APK artifact
      uses: actions/upload-artifact@v3
      with:
        name: debug-apk
        path: APK/app/build/outputs/apk/debug/*.apk

  build-release:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 11
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
        
    - name: Decode Keystore
      env:
        ENCODED_STRING: ${{ secrets.KEYSTORE_BASE64 }}
      run: |
        echo $ENCODED_STRING | base64 -di > APK/release-key.keystore
        
    - name: Build release APK
      env:
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      run: |
        cd APK
        ./gradlew assembleRelease
        
    - name: Upload release APK
      uses: actions/upload-artifact@v3
      with:
        name: release-apk
        path: APK/app/build/outputs/apk/release/*.apk
```

### 2. CI/CD Environment Setup
```bash
# Prepare keystore for CI/CD
base64 -i release-key.keystore | pbcopy  # macOS
base64 -i release-key.keystore | xclip -selection clipboard  # Linux

# Add to GitHub Secrets:
# KEYSTORE_BASE64: [base64 encoded keystore]
# KEYSTORE_PASSWORD: [keystore password]
# KEY_PASSWORD: [key password]
```

---

## Build Troubleshooting

### 1. Common Build Errors

#### Out of Memory Error
```bash
# Solution: Increase heap size
export GRADLE_OPTS="-Xmx4096m -XX:MaxPermSize=512m"

# Or in gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

#### Dependency Conflicts
```gradle
// Force specific version
configurations.all {
    resolutionStrategy {
        force 'com.squareup.okhttp3:okhttp:4.9.3'
        force 'com.google.code.gson:gson:2.9.0'
    }
}

// Exclude conflicting dependencies
implementation('com.some.library:library:1.0.0') {
    exclude group: 'com.conflicting.library', module: 'module'
}
```

#### ProGuard Issues
```proguard
# Debug ProGuard issues
-printmapping mapping.txt
-printseeds seeds.txt
-printusage usage.txt

# Keep problematic classes
-keep class com.problematic.** { *; }
-dontwarn com.problematic.**
```

### 2. Build Analysis Commands
```bash
# Analyze APK content
./gradlew :app:analyzeDebugBundle

# Generate dependency report
./gradlew :app:dependencies

# Check for unused dependencies
./gradlew :app:unusedDependencies

# Build time analysis
./gradlew build --profile

# Scan for build performance
./gradlew build --scan
```

---

## Distribution and Installation

### 1. APK Installation Methods

#### ADB Installation
```bash
# Install debug APK
adb install APK/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install APK/app/build/outputs/apk/release/app-release.apk

# Reinstall (replace existing)
adb install -r app-debug.apk

# Install on specific device
adb -s DEVICE_ID install app-debug.apk
```

#### Manual Installation
```
1. Copy APK to device storage
2. Enable "Unknown Sources" in device settings
3. Use file manager to navigate to APK
4. Tap APK file to install
5. Follow installation prompts
```

### 2. Distribution Channels

#### Google Play Store (AAB)
```bash
# Build Android App Bundle
./gradlew bundleRelease

# Output location
APK/app/build/outputs/bundle/release/app-release.aab
```

#### Direct Distribution
```bash
# Create distribution folder
mkdir -p distribution/v1.0.0

# Copy APKs
cp APK/app/build/outputs/apk/release/*.apk distribution/v1.0.0/

# Create checksums
cd distribution/v1.0.0
sha256sum *.apk > checksums.txt
```

### 3. Version Management
```gradle
// Automated version management
def getVersionName() {
    def tag = getLatestGitTag()
    return tag ?: "1.0.0-SNAPSHOT"
}

def getVersionCode() {
    def commitCount = getGitCommitCount()
    return commitCount ?: 1
}

android {
    defaultConfig {
        versionCode getVersionCode()
        versionName getVersionName()
    }
}
```

---

## Build Scripts and Automation

### 1. Custom Build Scripts

#### build-all.sh
```bash
#!/bin/bash

# Build all variants script
set -e

echo "🚀 Building Remote System APK - All Variants"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build debug variants
echo "🔧 Building debug variants..."
./gradlew assembleFreeDebug assemblePremiumDebug

# Build release variants (if keystore configured)
if [ -f "release-key.keystore" ]; then
    echo "📦 Building release variants..."
    ./gradlew assembleFreeRelease assemblePremiumRelease
else
    echo "⚠️  Skipping release builds (no keystore found)"
fi

# Run tests
echo "🧪 Running tests..."
./gradlew test

# Generate reports
echo "📊 Generating reports..."
./gradlew lint

echo "✅ Build completed successfully!"
echo "📁 APKs available in: app/build/outputs/apk/"

# List generated APKs
find app/build/outputs/apk/ -name "*.apk" -exec ls -lh {} \;
```

#### deploy.sh
```bash
#!/bin/bash

# Deployment script
VERSION=$(grep "versionName" app/build.gradle | awk '{print $2}' | tr -d '"')
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BUILD_DIR="builds/${VERSION}_${TIMESTAMP}"

echo "📦 Deploying Remote System APK v${VERSION}"

# Create build directory
mkdir -p "$BUILD_DIR"

# Copy APKs
cp app/build/outputs/apk/release/*.apk "$BUILD_DIR/"

# Copy AABs if available
if ls app/build/outputs/bundle/release/*.aab 1> /dev/null 2>&1; then
    cp app/build/outputs/bundle/release/*.aab "$BUILD_DIR/"
fi

# Generate checksums
cd "$BUILD_DIR"
sha256sum * > checksums.txt

echo "✅ Deployment complete: $BUILD_DIR"
```

---

## Next Steps

After building the APK:

1. **Test the Application**: [09-TESTING_GUIDE.md](09-TESTING_GUIDE.md)
2. **Setup Server**: [10-SERVER_SETUP.md](10-SERVER_SETUP.md)
3. **Deploy System**: [11-DEPLOYMENT_GUIDE.md](11-DEPLOYMENT_GUIDE.md)
4. **Configure Network**: [12-NETWORK_CONFIGURATION.md](12-NETWORK_CONFIGURATION.md)

---

## Academic Value

This build system demonstrates:

- **Software Engineering**: Professional build automation and CI/CD
- **Android Development**: Complete APK build process and optimization
- **Security**: Code signing and obfuscation practices
- **DevOps**: Continuous integration and automated deployment
- **Quality Assurance**: Automated testing and code analysis

The comprehensive build system showcases industry-standard practices suitable for Harvard Computer Science coursework and professional software development.
