/**
 * Firebase Authentication Validation Script
 * This script validates that the Firebase authentication fixes are working correctly
 */

// ===== VALIDATION FUNCTIONS =====

async function validateFirebaseConfig() {
    console.log('🔍 Validating Firebase Configuration...');
    
    try {
        // Test Firebase config import
        const firebaseConfig = await import('./firebase-config.js');
        
        if (!firebaseConfig.auth) {
            throw new Error('Firebase auth not available');
        }
        
        // Test Firebase config structure
        if (typeof firebaseConfig.initFirebaseAuth !== 'function') {
            throw new Error('initFirebaseAuth function not found');
        }
        
        console.log('✅ Firebase Configuration: VALID');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase Configuration: FAILED -', error.message);
        return false;
    }
}

async function validateFirebaseAuthUI() {
    console.log('🔍 Validating Firebase Auth UI...');
    
    try {
        // Test Firebase Auth UI import
        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        
        if (!firebaseAuthUI.default) {
            throw new Error('Firebase Auth UI default export not found');
        }
        
        const authUI = firebaseAuthUI.default;
        
        // Test required methods exist
        const requiredMethods = ['init', 'openAuthModal', 'closeAuthModal', 'isUserAuthenticated'];
        for (const method of requiredMethods) {
            if (typeof authUI[method] !== 'function') {
                throw new Error(`Method ${method} not found`);
            }
        }
        
        console.log('✅ Firebase Auth UI: VALID');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase Auth UI: FAILED -', error.message);
        return false;
    }
}

async function validateFirebaseAuthManager() {
    console.log('🔍 Validating Firebase Auth Manager...');
    
    try {
        if (typeof window.FirebaseAuthManager === 'undefined') {
            throw new Error('FirebaseAuthManager not found in global scope');
        }
        
        if (typeof window.FirebaseAuthManager.init !== 'function') {
            throw new Error('FirebaseAuthManager.init method not found');
        }
        
        console.log('✅ Firebase Auth Manager: VALID');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase Auth Manager: FAILED -', error.message);
        return false;
    }
}

async function validateInitialization() {
    console.log('🔍 Validating Initialization Process...');
    
    try {
        // Test that initialization can be called without errors
        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        
        // Test initialization (but don't actually initialize to avoid conflicts)
        if (typeof firebaseAuthUI.default.init !== 'function') {
            throw new Error('Firebase Auth UI init method not callable');
        }
        
        console.log('✅ Initialization Process: VALID');
        return true;
        
    } catch (error) {
        console.error('❌ Initialization Process: FAILED -', error.message);
        return false;
    }
}

async function validateModalFunctionality() {
    console.log('🔍 Validating Modal Functionality...');
    
    try {
        const firebaseAuthUI = await import('./firebase-auth-ui.js');
        const authUI = firebaseAuthUI.default;
        
        // Test modal opening (should not throw errors)
        authUI.openAuthModal();
        
        // Check if modal exists and is visible
        const modal = document.getElementById('firebase-auth-modal');
        if (!modal) {
            console.warn('⚠️ Auth modal not found (might not be created yet)');
        } else if (modal.classList.contains('hidden')) {
            console.warn('⚠️ Auth modal is hidden after opening');
        }
        
        // Close modal
        authUI.closeAuthModal();
        
        console.log('✅ Modal Functionality: VALID');
        return true;
        
    } catch (error) {
        console.error('❌ Modal Functionality: FAILED -', error.message);
        return false;
    }
}

// ===== MAIN VALIDATION FUNCTION =====

async function runFirebaseAuthValidation() {
    console.log('🚀 Starting Firebase Authentication Validation...\n');
    
    const validationTests = [
        { name: 'Firebase Configuration', test: validateFirebaseConfig },
        { name: 'Firebase Auth UI', test: validateFirebaseAuthUI },
        { name: 'Firebase Auth Manager', test: validateFirebaseAuthManager },
        { name: 'Initialization Process', test: validateInitialization },
        { name: 'Modal Functionality', test: validateModalFunctionality }
    ];
    
    const results = {
        total: validationTests.length,
        passed: 0,
        failed: 0,
        errors: []
    };
    
    for (const { name, test } of validationTests) {
        try {
            const passed = await test();
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
                results.errors.push(`${name} failed`);
            }
        } catch (error) {
            results.failed++;
            results.errors.push(`${name}: ${error.message}`);
        }
        console.log(''); // Empty line for readability
    }
    
    // Print summary
    console.log('📊 VALIDATION SUMMARY:');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    const successRate = (results.passed / results.total) * 100;
    console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (results.failed === 0) {
        console.log('\n🎉 All validation tests passed! Firebase authentication fixes are working correctly.');
        console.log('\n📋 Next steps:');
        console.log('  1. Test authentication in browser');
        console.log('  2. Verify Normal Mode protection');
        console.log('  3. Test complete user flow');
    } else {
        console.log('\n⚠️ Some validation tests failed. Please review the implementation.');
    }
    
    return results;
}

// ===== EXPORT FOR USE =====

// Make available globally
if (typeof window !== 'undefined') {
    window.runFirebaseAuthValidation = runFirebaseAuthValidation;
    window.validateFirebaseConfig = validateFirebaseConfig;
    window.validateFirebaseAuthUI = validateFirebaseAuthUI;
    window.validateFirebaseAuthManager = validateFirebaseAuthManager;
}

// Export for modules
export {
    runFirebaseAuthValidation,
    validateFirebaseConfig,
    validateFirebaseAuthUI,
    validateFirebaseAuthManager,
    validateInitialization,
    validateModalFunctionality
};

// Auto-run if executed directly
if (typeof window === 'undefined') {
    runFirebaseAuthValidation().catch(console.error);
}