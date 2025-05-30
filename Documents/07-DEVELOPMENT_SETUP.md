# 07 - Development Environment Setup

## Table of Contents
1. [Prerequisites and System Requirements](#prerequisites-and-system-requirements)
2. [Development Tools Installation](#development-tools-installation)
3. [Android Development Setup](#android-development-setup)
4. [Server Development Setup](#server-development-setup)
5. [IDE Configuration](#ide-configuration)
6. [Project Import and Setup](#project-import-and-setup)
7. [Environment Variables and Configuration](#environment-variables-and-configuration)
8. [Development Workflow](#development-workflow)
9. [Debugging Setup](#debugging-setup)
10. [Testing Environment](#testing-environment)

---

## Prerequisites and System Requirements

### Minimum System Requirements

#### For Android Development
- **Operating System**: Windows 10/11, macOS 10.14+, or Ubuntu 18.04+
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 10 GB free space for Android Studio and SDK
- **Internet**: Stable connection for downloading dependencies

#### For Server Development
- **Node.js**: Version 14.x or higher
- **npm**: Version 6.x or higher (comes with Node.js)
- **Git**: Version 2.0 or higher

### Recommended System Specifications
```
CPU:     Intel i5/i7 or AMD equivalent (4+ cores)
RAM:     16 GB or more
Storage: SSD with 20+ GB free space
Network: Broadband internet connection
```

---

## Development Tools Installation

### 1. Java Development Kit (JDK)

#### Windows Installation
```bash
# Using Chocolatey (recommended)
choco install openjdk11

# Or download from Oracle/OpenJDK websites
# Install JDK 11 or JDK 17 (LTS versions)
```

#### macOS Installation
```bash
# Using Homebrew
brew install openjdk@11

# Add to PATH in ~/.zshrc or ~/.bash_profile
echo 'export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
```

#### Linux Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# CentOS/RHEL
sudo yum install java-11-openjdk-devel

# Arch Linux
sudo pacman -S jdk11-openjdk
```

#### Verify JDK Installation
```bash
java -version
javac -version

# Expected output:
# openjdk version "11.0.x" 2021-xx-xx
# OpenJDK Runtime Environment (build 11.0.x+x)
```

### 2. Android Studio Installation

#### Download and Install
1. **Download**: Visit [https://developer.android.com/studio](https://developer.android.com/studio)
2. **Install**: Follow platform-specific instructions
3. **Launch**: Complete the setup wizard

#### Initial Setup Wizard
```
1. Welcome Screen → Next
2. Install Type → Standard (recommended)
3. Select UI Theme → Choose preference
4. Verify Settings → Confirm SDK location
5. License Agreement → Accept all licenses
6. Downloading Components → Wait for completion
```

#### Android SDK Configuration
```
Tools → SDK Manager
├── SDK Platforms
│   ├── Android 12 (API 31) ✓
│   ├── Android 11 (API 30) ✓
│   ├── Android 10 (API 29) ✓
│   └── Android 8.1 (API 27) ✓
│
└── SDK Tools
    ├── Android SDK Build-Tools ✓
    ├── Android SDK Platform-Tools ✓
    ├── Android SDK Tools ✓
    ├── Android Emulator ✓
    ├── Intel x86 Emulator Accelerator ✓
    └── Google Play services ✓
```

### 3. Node.js and npm Installation

#### Windows
```bash
# Using Chocolatey
choco install nodejs

# Or download from nodejs.org
# Choose LTS version (Long Term Support)
```

#### macOS
```bash
# Using Homebrew
brew install node

# Using nvm (Node Version Manager) - recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using snap
sudo snap install node --classic
```

#### Verify Node.js Installation
```bash
node --version
npm --version

# Expected output:
# v16.x.x
# 8.x.x
```

### 4. Git Installation

#### Windows
```bash
# Using Chocolatey
choco install git

# Or download from git-scm.com
```

#### macOS
```bash
# Git comes pre-installed, but you can update it
brew install git
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo yum install git
```

#### Git Configuration
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
```

---

## Android Development Setup

### 1. Android Virtual Device (AVD) Setup

#### Create AVD through Android Studio
```
Tools → AVD Manager → Create Virtual Device

Device Selection:
├── Category: Phone
├── Device: Pixel 4 (recommended)
└── Next

System Image:
├── Release Name: Android 12 (API 31)
├── ABI: x86_64
├── Target: Google APIs
└── Download → Next

AVD Configuration:
├── AVD Name: Pixel_4_API_31
├── Startup Orientation: Portrait
├── Advanced Settings:
│   ├── RAM: 2048 MB
│   ├── Internal Storage: 2048 MB
│   ├── SD Card: 512 MB
│   └── Graphics: Hardware - GLES 2.0
└── Finish
```

#### Alternative: Hardware Device Setup
```
1. Enable Developer Options:
   Settings → About Phone → Tap "Build Number" 7 times

2. Enable USB Debugging:
   Settings → Developer Options → USB Debugging ✓

3. Connect device via USB

4. Verify connection:
   adb devices
   # Should show your device in the list
```

### 2. Android SDK Path Configuration

#### Environment Variables Setup

**Windows (System Environment Variables)**
```
ANDROID_HOME = C:\Users\[Username]\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT = C:\Users\[Username]\AppData\Local\Android\Sdk

Path additions:
- %ANDROID_HOME%\platform-tools
- %ANDROID_HOME%\tools
- %ANDROID_HOME%\tools\bin
```

**macOS/Linux (.bashrc/.zshrc)**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk    # macOS
export ANDROID_HOME=$HOME/Android/Sdk            # Linux
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### Verify SDK Setup
```bash
adb version
# Android Debug Bridge version 1.0.41

which adb
# Should show the full path to adb
```

---

## Server Development Setup

### 1. Node.js Project Initialization

#### Global Tool Installation
```bash
# Install useful global packages
npm install -g nodemon          # Auto-restart server
npm install -g npm-check-updates # Update dependencies
npm install -g eslint           # Code linting
npm install -g jest             # Testing framework
```

#### Project Dependencies for Simple Server
```bash
cd SERVER/simple-server

# Initialize package.json (if not exists)
npm init -y

# Install production dependencies
npm install express socket.io cors helmet morgan
npm install bcrypt jsonwebtoken joi winston
npm install dotenv compression rate-limiter-flexible

# Install development dependencies
npm install --save-dev nodemon jest supertest eslint
npm install --save-dev eslint-config-standard eslint-plugin-node
```

#### Package.json Configuration
```json
{
  "name": "remote-system-server",
  "version": "1.0.0",
  "description": "Remote System Control Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "keywords": ["remote-control", "socket.io", "express"],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  }
}
```

### 2. Server Configuration Files

#### Environment Configuration (.env)
```bash
# Create .env file in SERVER/simple-server/
touch .env

# Add configuration variables
cat > .env << EOF
# Server Configuration
PORT=8080
HOST=localhost
NODE_ENV=development

# Security
JWT_SECRET=your_super_secret_jwt_key_here
BCRYPT_ROUNDS=12

# Database (if needed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=remote_system
DB_USER=admin
DB_PASS=password

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/server.log

# CORS Settings
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
EOF
```

#### ESLint Configuration (.eslintrc.js)
```javascript
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

---

## IDE Configuration

### 1. Android Studio Configuration

#### Essential Plugins
```
File → Settings → Plugins

Install these plugins:
├── Rainbow Brackets
├── SonarLint
├── GitToolBox
├── ADB Idea
├── JSON Viewer
├── Material Theme UI
└── Key Promoter X
```

#### Code Style Settings
```
File → Settings → Editor → Code Style

Java:
├── Scheme: Default
├── Tabs and Indents:
│   ├── Use tab character: false
│   ├── Tab size: 4
│   ├── Indent: 4
│   └── Continuation indent: 8
└── Wrapping and Braces:
    └── Right margin: 120
```

#### Live Templates Setup
```
File → Settings → Editor → Live Templates

Create custom templates:
├── logd → Log.d(TAG, "$END$");
├── loge → Log.e(TAG, "$END$", $exception$);
├── todo → // TODO: $END$
└── fixme → // FIXME: $END$
```

### 2. Visual Studio Code Configuration (for Server)

#### Essential Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-jest"
  ]
}
```

#### Settings Configuration (settings.json)
```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "terminal.integrated.fontSize": 13,
  "workbench.colorTheme": "Dark+ (default dark)",
  "javascript.preferences.quoteStyle": "single",
  "typescript.preferences.quoteStyle": "single"
}
```

---

## Project Import and Setup

### 1. Clone the Repository

```bash
# Navigate to your development directory
cd ~/Development  # or C:\Development on Windows

# Clone the repository
git clone https://github.com/yourusername/Remote-System-APK.git
cd Remote-System-APK

# Verify repository structure
ls -la
# Should show: APK/, SERVER/, Documents/, etc.
```

### 2. Import Android Project

#### Android Studio Import
```
1. Open Android Studio
2. File → Open
3. Navigate to: Remote-System-APK/APK
4. Select the APK folder
5. Click "OK"
6. Wait for Gradle sync to complete
```

#### Gradle Sync Issues Resolution
```bash
# If Gradle sync fails, try:

# 1. Clean and rebuild
./gradlew clean
./gradlew build

# 2. Update Gradle wrapper
./gradlew wrapper --gradle-version 7.4

# 3. Invalidate caches
# In Android Studio: File → Invalidate Caches and Restart
```

### 3. Setup Server Project

#### Simple Server Setup
```bash
cd SERVER/simple-server

# Install dependencies
npm install

# Verify installation
npm list --depth=0

# Run development server
npm run dev

# Expected output:
# [nodemon] starting `node server.js`
# Server running on http://localhost:8080
```

#### Beast Server Setup (Advanced)
```bash
cd SERVER/beast

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

---

## Environment Variables and Configuration

### 1. Android Configuration

#### local.properties
```properties
# Location of Android SDK
sdk.dir=/Users/username/Library/Android/sdk

# Or on Windows:
# sdk.dir=C\:\\Users\\username\\AppData\\Local\\Android\\Sdk
```

#### gradle.properties
```properties
# Project-wide Gradle settings
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true

# Android specific
android.useAndroidX=true
android.enableJetifier=true
```

### 2. Server Configuration

#### Environment Files
```bash
# Development environment
cp .env.example .env.development

# Production environment (when deploying)
cp .env.example .env.production

# Test environment
cp .env.example .env.test
```

#### Configuration Management
```javascript
// config/config.js
const config = {
  development: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    dbUrl: process.env.DATABASE_URL || 'sqlite://db.sqlite',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret'
  },
  production: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET
  },
  test: {
    port: 0,
    host: 'localhost',
    dbUrl: ':memory:',
    jwtSecret: 'test-secret'
  }
}

module.exports = config[process.env.NODE_ENV || 'development']
```

---

## Development Workflow

### 1. Daily Development Routine

#### Start Development Session
```bash
# 1. Update code from repository
git pull origin main

# 2. Start Android emulator
emulator -avd Pixel_4_API_31

# 3. Start server in development mode
cd SERVER/simple-server
npm run dev

# 4. Open Android Studio
# File → Open Recent → Remote-System-APK
```

#### Development Commands
```bash
# Android development
./gradlew assembleDebug          # Build debug APK
./gradlew installDebug           # Install on device/emulator
./gradlew test                   # Run unit tests
./gradlew connectedAndroidTest   # Run instrumentation tests

# Server development
npm run dev                      # Development server with hot reload
npm test                         # Run tests
npm run lint                     # Check code style
npm run lint:fix                 # Fix linting issues
```

### 2. Code Quality Checks

#### Pre-commit Hooks Setup
```bash
# Install husky for git hooks
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

#### Android Code Quality
```bash
# Lint checking
./gradlew lint
./gradlew lintDebug

# Unit testing
./gradlew test

# Generate test reports
./gradlew jacocoTestReport
```

---

## Debugging Setup

### 1. Android Debugging

#### Enable Debugging Features
```
Android Studio → Run/Debug Configurations

Debug Configuration:
├── Name: app-debug
├── Module: app
├── Installation Options:
│   ├── Deploy: Default APK
│   └── Launch Options: Default Activity
├── Debugger:
│   ├── Debug type: Auto
│   └── Symbol Directories: (empty)
└── Profiling:
    └── Enable advanced profiling: ✓
```

#### Logging Setup
```java
// Use throughout Android code
public class Logger {
    private static final String TAG = "RemoteSystemAPK";
    
    public static void debug(String message) {
        if (BuildConfig.DEBUG) {
            Log.d(TAG, message);
        }
    }
    
    public static void error(String message, Throwable throwable) {
        Log.e(TAG, message, throwable);
    }
}
```

### 2. Server Debugging

#### Node.js Debugging with VS Code
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/SERVER/simple-server/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Attach to Server",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/SERVER/simple-server",
      "remoteRoot": "."
    }
  ]
}
```

#### Server Logging Configuration
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'remote-system-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

## Testing Environment

### 1. Android Testing Setup

#### Test Dependencies (app/build.gradle)
```gradle
dependencies {
    // Unit testing
    testImplementation 'junit:junit:4.13.2'
    testImplementation 'org.mockito:mockito-core:4.0.0'
    testImplementation 'org.robolectric:robolectric:4.7.3'
    
    // Android testing
    androidTestImplementation 'androidx.test.ext:junit:1.1.3'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.4.0'
    androidTestImplementation 'androidx.test:runner:1.4.0'
    androidTestImplementation 'androidx.test:rules:1.4.0'
}
```

#### Test Configuration
```java
// Test runner configuration in AndroidManifest.xml (androidTest)
<instrumentation
    android:name="androidx.test.runner.AndroidJUnitRunner"
    android:targetPackage="com.remotesystem.apk" />
```

### 2. Server Testing Setup

#### Test Scripts (package.json)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

#### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}
```

---

## Troubleshooting Common Issues

### 1. Android Studio Issues

#### Gradle Sync Problems
```bash
# Solution 1: Clean and rebuild
./gradlew clean
./gradlew build

# Solution 2: Clear Android Studio caches
# File → Invalidate Caches and Restart

# Solution 3: Update Gradle wrapper
./gradlew wrapper --gradle-version 7.4
```

#### Emulator Issues
```bash
# Cold boot the emulator
emulator -avd Pixel_4_API_31 -no-snapshot-load

# Wipe emulator data
emulator -avd Pixel_4_API_31 -wipe-data

# Check available AVDs
emulator -list-avds
```

### 2. Node.js Issues

#### Package Installation Problems
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated
npm update
```

#### Port Already in Use
```bash
# Find process using port 8080
lsof -ti:8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process
kill -9 $(lsof -ti:8080)  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

---

## Next Steps

After completing development setup:

1. **Build Project**: [08-BUILDING_THE_APK.md](08-BUILDING_THE_APK.md)
2. **Test Implementation**: [09-TESTING_GUIDE.md](09-TESTING_GUIDE.md)
3. **Configure Server**: [10-SERVER_SETUP.md](10-SERVER_SETUP.md)
4. **Deploy Application**: [11-DEPLOYMENT_GUIDE.md](11-DEPLOYMENT_GUIDE.md)

---

## Development Best Practices

### 1. Version Control
- Commit frequently with descriptive messages
- Use feature branches for new development
- Keep the main branch stable and deployable
- Include meaningful commit messages

### 2. Code Organization
- Follow established naming conventions
- Keep functions and classes focused and small
- Write comprehensive comments and documentation
- Use consistent code formatting

### 3. Testing Strategy
- Write tests before implementing features (TDD)
- Maintain high test coverage (>80%)
- Include both unit and integration tests
- Test error conditions and edge cases

### 4. Security Considerations
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation
- Follow security best practices for mobile and server development

This development setup provides a robust foundation for professional software development, suitable for Harvard-level academic projects and real-world application development.
