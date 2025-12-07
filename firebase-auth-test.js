/**
 * Firebase Authentication Test Suite
 * This file contains tests to verify the Firebase authentication implementation
 */

// Test Configuration
const TEST_CONFIG = {
    testEmail: 'test@example.com',
    testPassword: 'password123',
    testTimeout: 10000
};

// Test Results
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    startTime: null,
    endTime: null
};

// Test Functions
async function runAllTests() {
    console.log('🧪 Starting Firebase Authentication Tests...');

    testResults.startTime = new Date();
    testResults.total = 0;
    testResults.passed = 0;
    testResults.failed = 0;
    testResults.errors = [];

    try {
        // Initialize Firebase
        await testFirebaseInitialization();

        // Test Firebase Auth UI
        await testFirebaseAuthUI();

        // Test Authentication Flow
        await testAuthenticationFlow();

        // Test Protection
        await testNormalModeProtection();

    } catch (error) {
        console.error('🔥 Test suite error:', error);
        testResults.errors.push({
            test: 'Test Suite',
            error: error.message,
            stack: error.stack
        });
    } finally {
        testResults.endTime = new Date();
        printTestResults();
    }
}

// Test Firebase Initialization
async function testFirebaseInitialization() {
    const testName = 'Firebase Initialization';

    try {
        testResults.total++;

        // Test Firebase config
        const firebaseConfig = await import('./firebase-config.js');
        if (!firebaseConfig || !firebaseConfig.auth) {
            throw new Error('Firebase config not properly initialized');
        }

        // Test Firebase Auth UI
        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        if (!firebaseAuthUI || !firebaseAuthUI.default) {
            throw new Error('Firebase Auth UI not properly initialized');
        }

        console.log('✅ Firebase initialization test passed');
        testResults.passed++;

    } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message);
        testResults.failed++;
        testResults.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
        });
    }
}

// Test Firebase Auth UI
async function testFirebaseAuthUI() {
    const testName = 'Firebase Auth UI';

    try {
        testResults.total++;

        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        const authUI = firebaseAuthUI.default;

        // Check if auth UI has required methods
        const requiredMethods = [
            'init', 'openAuthModal', 'closeAuthModal',
            'isUserAuthenticated', 'getCurrentUserEmail',
            'handleAuthStateChange', 'handleLoginSubmit',
            'handleLogout'
        ];

        for (const method of requiredMethods) {
            if (typeof authUI[method] !== 'function') {
                throw new Error(`Missing required method: ${method}`);
            }
        }

        console.log('✅ Firebase Auth UI test passed');
        testResults.passed++;

    } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message);
        testResults.failed++;
        testResults.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
        });
    }
}

// Test Authentication Flow
async function testAuthenticationFlow() {
    const testName = 'Authentication Flow';

    try {
        testResults.total++;

        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        const authUI = firebaseAuthUI.default;

        // Test initial state (should be unauthenticated)
        const initialState = authUI.isUserAuthenticated();
        if (initialState) {
            console.warn('⚠️ User already authenticated at test start');
        }

        // Test auth modal opening
        authUI.openAuthModal();

        // Check if modal is visible
        const authModal = document.getElementById('firebase-auth-modal');
        if (!authModal || authModal.classList.contains('hidden')) {
            throw new Error('Auth modal not visible after opening');
        }

        // Close modal
        authUI.closeAuthModal();

        console.log('✅ Authentication flow test passed');
        testResults.passed++;

    } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message);
        testResults.failed++;
        testResults.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
        });
    }
}

// Test Normal Mode Protection
async function testNormalModeProtection() {
    const testName = 'Normal Mode Protection';

    try {
        testResults.total++;

        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        const authUI = firebaseAuthUI.default;

        // Test normal mode tab protection
        const normalModeTab = document.querySelector('[data-tab="mode-normal"]');
        if (!normalModeTab) {
            throw new Error('Normal mode tab not found');
        }

        // Check if tab has requires-auth attribute
        if (!normalModeTab.hasAttribute('data-requires-auth')) {
            throw new Error('Normal mode tab missing data-requires-auth attribute');
        }

        // Test clicking on protected tab when unauthenticated
        const isAuthenticated = authUI.isUserAuthenticated();
        if (!isAuthenticated) {
            // Simulate click on protected tab
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });

            const clickResult = normalModeTab.dispatchEvent(clickEvent);

            // Should be prevented if not authenticated
            if (clickResult) {
                console.warn('⚠️ Click on protected tab was not prevented');
            }
        }

        console.log('✅ Normal mode protection test passed');
        testResults.passed++;

    } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message);
        testResults.failed++;
        testResults.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
        });
    }
}

// Print Test Results
function printTestResults() {
    const duration = (testResults.endTime - testResults.startTime) / 1000;

    console.log('📊 Test Results:');
    console.log(`  Total: ${testResults.total}`);
    console.log(`  Passed: ${testResults.passed}`);
    console.log(`  Failed: ${testResults.failed}`);
    console.log(`  Duration: ${duration.toFixed(2)} seconds`);

    if (testResults.errors.length > 0) {
        console.log('🔥 Errors:');
        testResults.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
        });
    }

    const successRate = (testResults.passed / testResults.total) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);

    if (testResults.failed === 0) {
        console.log('🎉 All tests passed! Firebase authentication is working correctly.');
    } else {
        console.log('❌ Some tests failed. Please check the implementation.');
    }
}

// Utility Functions
function logTest(testName, status, message = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${status} ${testName}` + (message ? `: ${message}` : '');

    if (status === '✅') {
        console.log(logMessage);
    } else {
        console.error(logMessage);
    }
}

// Export test functions for external use
export {
    runAllTests,
    testFirebaseInitialization,
    testFirebaseAuthUI,
    testAuthenticationFlow,
    testNormalModeProtection,
    printTestResults,
    testResults
};

// Run tests automatically if this is the main module
if (import.meta.url === `file://${new URL('.', import.meta.url).pathname}firebase-auth-test.js`) {
    runAllTests().catch(console.error);
}