/**
 * EMERGENCY AUTH BUTTON FIX
 * Run this directly in browser console if buttons still don't work
 */

console.log('🚨 EMERGENCY AUTH BUTTON FIX ACTIVATED');

// IMMEDIATE BUTTON FIX
function emergencyButtonFix() {
    console.log('🔧 Applying emergency button fixes...');
    
    const buttons = [
        { id: 'loginBtn', action: 'login' },
        { id: 'registerBtn', action: 'register' },
        { id: 'showMigrationBtn', action: 'migration' }
    ];
    
    buttons.forEach(({ id, action }) => {
        const button = document.getElementById(id);
        if (button) {
            console.log(`🔧 Fixing ${id}...`);
            
            // Remove all existing event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Force CSS
            newButton.style.pointerEvents = 'auto';
            newButton.style.cursor = 'pointer';
            newButton.style.position = 'relative';
            newButton.style.zIndex = '999';
            newButton.style.userSelect = 'none';
            newButton.style.display = 'inline-block';
            newButton.style.visibility = 'visible';
            newButton.style.opacity = '1';
            
            // Add direct click handler
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🖱️ ${id} clicked!`);
                
                // Visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'none';
                }, 100);
                
                // Open modal directly
                const modal = document.getElementById(`${action}Modal`);
                if (modal) {
                    modal.style.display = 'flex';
                    modal.style.zIndex = '10000';
                    console.log(`✅ ${action} modal opened`);
                } else {
                    console.log(`❌ ${action}Modal not found`);
                    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} system initializing. Try again.`);
                }
            });
            
            console.log(`✅ ${id} fixed`);
        } else {
            console.log(`❌ ${id} not found`);
        }
    });
}

// REMOVE BLOCKING ELEMENTS
function removeBlockingElements() {
    console.log('🧹 Removing blocking elements...');
    
    // Remove loading overlays
    document.querySelectorAll('.loading-overlay').forEach(overlay => {
        overlay.remove();
        console.log('✅ Removed loading overlay');
    });
    
    // Close all modals
    document.querySelectorAll('.auth-modal').forEach(modal => {
        modal.style.display = 'none';
        console.log('✅ Closed modal:', modal.id);
    });
    
    // Check for invisible blocking elements
    document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' && style.zIndex !== 'auto' && parseInt(style.zIndex) > 1000) {
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                console.log('⚠️ Potential blocking element:', el);
            }
        }
    });
}

// TEST BUTTON FUNCTIONALITY
function testButtonFunctionality() {
    console.log('🧪 Testing button functionality...');
    
    const buttons = ['loginBtn', 'registerBtn', 'showMigrationBtn'];
    let workingButtons = 0;
    
    buttons.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            // Test if button is clickable
            const rect = button.getBoundingClientRect();
            const style = window.getComputedStyle(button);
            
            console.log(`${id}:`, {
                visible: style.visibility !== 'hidden',
                display: style.display,
                pointerEvents: style.pointerEvents,
                cursor: style.cursor,
                position: style.position,
                zIndex: style.zIndex,
                hasEventListeners: getEventListeners ? getEventListeners(button).length > 0 : 'unknown'
            });
            
            if (style.pointerEvents !== 'none' && style.visibility !== 'hidden') {
                workingButtons++;
            }
        }
    });
    
    console.log(`📊 Buttons working: ${workingButtons}/${buttons.length}`);
    return workingButtons === buttons.length;
}

// RUN ALL FIXES
function runAllEmergencyFixes() {
    console.log('🚨 Running all emergency fixes...');
    
    removeBlockingElements();
    emergencyButtonFix();
    
    setTimeout(() => {
        const success = testButtonFunctionality();
        if (success) {
            console.log('✅ Emergency fix completed successfully!');
        } else {
            console.log('⚠️ Emergency fix completed but some buttons may still need attention');
        }
    }, 1000);
}

// AUTO-RUN
runAllEmergencyFixes();

// MAKE AVAILABLE GLOBALLY
window.emergencyButtonFix = emergencyButtonFix;
window.removeBlockingElements = removeBlockingElements;
window.testButtonFunctionality = testButtonFunctionality;
window.runAllEmergencyFixes = runAllEmergencyFixes;

console.log('🚨 EMERGENCY FIX READY');
console.log('Available commands:');
console.log('  - emergencyButtonFix() - Fix buttons');
console.log('  - removeBlockingElements() - Remove blockers');
console.log('  - testButtonFunctionality() - Test buttons');
console.log('  - runAllEmergencyFixes() - Run all fixes');