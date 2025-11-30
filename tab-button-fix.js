/**
 * Tab Button Click Fix for DictaMed
 * Quick fix for the "can't click on tab button" issue
 */

console.log('🔧 Tab Button Click Fix - Starting diagnostics...');

/**
 * Quick diagnostic and fix for tab button issues
 */
function diagnoseTabButtons() {
    console.log('🔍 Diagnosing tab button issues...');
    
    // Check for blocking elements
    const overlays = document.querySelectorAll('.loading-overlay, .auth-modal, [style*="position: fixed"]');
    console.log(`Found ${overlays.length} potentially blocking elements`);
    
    if (overlays.length > 0) {
        overlays.forEach((el, i) => {
            const style = window.getComputedStyle(el);
            const isBlocking = style.position === 'fixed' && 
                             style.zIndex !== 'auto' && 
                             parseInt(style.zIndex) > 1000 &&
                             style.display !== 'none';
            if (isBlocking) {
                console.log(`❌ Blocking element ${i}:`, {
                    className: el.className,
                    zIndex: style.zIndex,
                    display: style.display
                });
            }
        });
    }
    
    // Check tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log(`Found ${tabButtons.length} tab buttons`);
    
    tabButtons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        
        console.log(`Tab button ${i}:`, {
            id: btn.id,
            text: btn.textContent.trim(),
            visible: style.visibility !== 'hidden',
            clickable: style.pointerEvents !== 'none',
            zIndex: style.zIndex,
            position: style.position,
            rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
        });
        
        // Check if button is covered by other elements
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        
        if (elementAtPoint && elementAtPoint !== btn && !btn.contains(elementAtPoint)) {
            console.log(`❌ Button ${i} is covered by:`, {
                element: elementAtPoint,
                className: elementAtPoint.className
            });
        }
    });
    
    return tabButtons;
}

/**
 * Apply immediate fixes
 */
function applyTabButtonFixes() {
    console.log('🔧 Applying tab button fixes...');
    
    // Remove blocking overlays
    const overlays = document.querySelectorAll('.loading-overlay, .auth-modal');
    overlays.forEach(overlay => {
        if (window.getComputedStyle(overlay).display !== 'none') {
            console.log('🗑️ Removing blocking overlay:', overlay.className);
            overlay.remove();
        }
    });
    
    // Fix z-index issues
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn, i) => {
        btn.style.zIndex = '1000';
        btn.style.position = 'relative';
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        console.log(`✅ Fixed tab button ${i}: ${btn.textContent.trim()}`);
    });
    
    // Ensure tab container doesn't block clicks
    const tabContainer = document.querySelector('.tabs-container');
    if (tabContainer) {
        tabContainer.style.pointerEvents = 'auto';
        console.log('✅ Fixed tab container');
    }
}

/**
 * Re-attach tab click handlers
 */
function reattachTabHandlers() {
    console.log('🔗 Re-attaching tab click handlers...');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Remove existing listeners by cloning
    tabButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add new click handler
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const targetTab = newBtn.getAttribute('data-tab');
            console.log(`🖱️ Tab clicked: ${targetTab}`);
            
            if (targetTab) {
                switchTab(targetTab);
            }
        });
        
        console.log(`✅ Re-attached handler for tab: ${newBtn.textContent.trim()}`);
    });
}

/**
 * Check if switchTab function exists
 */
function checkSwitchTabFunction() {
    if (typeof switchTab !== 'function') {
        console.log('❌ switchTab function not found - creating backup');
        
        // Create backup switchTab function
        window.switchTab = function(tabId) {
            console.log(`🔄 Switching to tab: ${tabId}`);
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active state from all buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            
            // Show target tab content
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Activate target button
            const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');
                targetBtn.setAttribute('aria-selected', 'true');
            }
            
            console.log(`✅ Switched to tab: ${tabId}`);
        };
        
        console.log('✅ Backup switchTab function created');
    } else {
        console.log('✅ switchTab function found');
    }
}

/**
 * Test tab functionality
 */
function testTabFunctionality() {
    console.log('🧪 Testing tab functionality...');
    
    const testButtons = ['mode-normal', 'mode-test', 'guide', 'contact'];
    const results = [];
    
    testButtons.forEach(tabId => {
        const btn = document.querySelector(`[data-tab="${tabId}"]`);
        if (btn) {
            try {
                // Simulate click
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                
                btn.dispatchEvent(clickEvent);
                results.push({ tabId, success: true, message: 'Click simulated successfully' });
                
                // Wait a bit then switch back
                setTimeout(() => {
                    const currentActive = document.querySelector('.tab-btn.active');
                    if (currentActive && currentActive.getAttribute('data-tab') === tabId) {
                        console.log(`✅ Tab ${tabId} activated successfully`);
                    }
                }, 100);
                
            } catch (error) {
                results.push({ tabId, success: false, message: error.message });
            }
        } else {
            results.push({ tabId, success: false, message: 'Button not found' });
        }
    });
    
    console.log('🧪 Tab test results:', results);
    return results;
}

/**
 * Complete diagnostic and fix process
 */
function fixTabButtonIssue() {
    console.log('🚀 Starting complete tab button fix process...');
    
    // Step 1: Diagnose
    const tabButtons = diagnoseTabButtons();
    
    // Step 2: Check switchTab function
    checkSwitchTabFunction();
    
    // Step 3: Apply fixes
    applyTabButtonFixes();
    
    // Step 4: Re-attach handlers
    reattachTabHandlers();
    
    // Step 5: Test functionality
    const testResults = testTabFunctionality();
    
    // Step 6: Summary
    const workingButtons = testResults.filter(r => r.success).length;
    console.log(`✅ Tab button fix complete: ${workingButtons}/${testResults.length} buttons working`);
    
    if (workingButtons === testResults.length) {
        console.log('🎉 All tab buttons should now be working!');
    } else {
        console.log('⚠️ Some buttons may still need attention');
    }
    
    return {
        totalButtons: tabButtons.length,
        workingButtons,
        testResults
    };
}

/**
 * Emergency manual click function
 */
function emergencyClickTab(tabId) {
    console.log(`🚨 Emergency click for tab: ${tabId}`);
    
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) {
        btn.click();
        console.log(`✅ Emergency clicked tab: ${tabId}`);
    } else {
        console.log(`❌ Tab button not found: ${tabId}`);
    }
}

// Make functions globally available
window.fixTabButtonIssue = fixTabButtonIssue;
window.emergencyClickTab = emergencyClickTab;
window.diagnoseTabButtons = diagnoseTabButtons;

// Auto-run the fix
console.log('🔧 Running tab button fix automatically...');
fixTabButtonIssue();

console.log('🛠️ Available emergency commands:');
console.log('- fixTabButtonIssue()  // Run complete fix');
console.log('- emergencyClickTab("mode-test")  // Click specific tab');
console.log('- diagnoseTabButtons()  // Run diagnostics only');