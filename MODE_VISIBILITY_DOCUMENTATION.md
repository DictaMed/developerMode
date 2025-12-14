# Mode Visibility Management - Documentation

## Overview

The Mode Visibility system controls the visibility of different operation modes based on the user's authentication status:

- **Mode Normal**: Visible only when the user is **authenticated** (logged in)
- **Mode DMI**: Visible only when the user is **authenticated** (logged in)
- **Mode Test**: Visible only when the user is **not authenticated** (logged out)

---

## Architecture

### Components

#### 1. **index.html** - UI Elements
```html
<!-- Mode Normal - Hidden by default, shown after login -->
<button class="fixed-nav-btn" id="modeNormalBtn" data-tab="mode-normal" style="display: none;">
    <span class="nav-icon">🏥</span>
    Mode Normal
</button>

<!-- Mode DMI - Hidden by default, shown after login -->
<button class="fixed-nav-btn" id="modeDmiBtn" data-tab="mode-dmi" style="display: none;">
    <span class="nav-icon">📝</span>
    mode DMI
</button>

<!-- Mode Test - Visible by default, hidden after login -->
<button class="fixed-nav-btn" id="modeTestBtn" data-tab="mode-test">
    <span class="nav-icon">🧪</span>
    Mode Test
</button>
```

#### 2. **js/main.js** - Core Logic
```javascript
/**
 * Update the visibility of mode buttons based on authentication status
 * - Mode Normal: visible only when authenticated
 * - Mode DMI: visible only when authenticated
 * - Mode Test: visible only when NOT authenticated
 */
function updateModeVisibility(isAuthenticated) {
    const modeNormalBtn = document.getElementById('modeNormalBtn');
    const modeDmiBtn = document.getElementById('modeDmiBtn');
    const modeTestBtn = document.getElementById('modeTestBtn');

    if (isAuthenticated) {
        // User is logged in: show Normal and DMI modes, hide Test mode
        modeNormalBtn.style.display = '';
        modeDmiBtn.style.display = '';
        modeTestBtn.style.display = 'none';
    } else {
        // User is not logged in: hide Normal and DMI modes, show Test mode
        modeNormalBtn.style.display = 'none';
        modeDmiBtn.style.display = 'none';
        modeTestBtn.style.display = '';
    }
}
```

The function is exposed globally via:
```javascript
window.DictaMed.updateModeVisibility = (isAuthenticated) => {
    updateModeVisibility(isAuthenticated);
};
```

#### 3. **js/components/navigation.js** - Navigation Integration
Integrated with the existing tab navigation system:
```javascript
updateNormalModeButtonVisibility() {
    // ... existing code ...

    // BUG FIX: Update all mode visibility based on authentication status
    if (window.DictaMed && typeof window.DictaMed.updateModeVisibility === 'function') {
        window.DictaMed.updateModeVisibility(isAuthenticated);
    }
}
```

#### 4. **js/components/auth-page-manager.js** - Auth Event Handling

**On Successful Login:**
```javascript
if (result.success) {
    // ... show success notification ...
    this.updateProfileDisplay();

    // Update mode visibility - Show Mode Normal
    if (window.DictaMed && typeof window.DictaMed.updateModeVisibility === 'function') {
        window.DictaMed.updateModeVisibility(true);
    }

    // Redirect to Normal Mode
    window.switchTab('mode-normal');
}
```

**On Logout:**
```javascript
async handleSignOut() {
    // ... sign out from Firebase ...
    this.updateProfileDisplay();

    // Update mode visibility - Show Mode Test
    if (window.DictaMed && typeof window.DictaMed.updateModeVisibility === 'function') {
        window.DictaMed.updateModeVisibility(false);
    }

    // Redirect to Home
    window.switchTab('home');
}
```

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ PAGE LOAD                                                   │
│ finalizeInitialization()                                     │
│   └─→ updateModeVisibility(isAuthenticated)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │ Firebase Auth State Listener          │
        │ (navigation.js)                       │
        │   └─→ updateNormalModeButtonVisibility()
        │        └─→ updateModeVisibility()     │
        └──────────────────────────────────────┘
                   ↙                    ↖
         ┌─────────────────┐  ┌─────────────────┐
         │   USER LOGS IN  │  │  USER LOGS OUT  │
         │ (handleSignIn)  │  │ (handleSignOut) │
         │   result.success│  │                 │
         │   ↓             │  │   await signOut()
         │   updateMode    │  │   ↓             │
         │   Visibility    │  │   updateMode    │
         │   (true)        │  │   Visibility    │
         │   ↓             │  │   (false)       │
         │ Show Mode Normal│  │ Show Mode Test  │
         └─────────────────┘  └─────────────────┘
```

---

## Visibility Rules

### Authentication State → Mode Visibility

| User Status | Mode Normal | Mode Test | Mode DMI |
|-------------|------------|-----------|----------|
| Logged In   | ✅ Visible | ❌ Hidden | ✅ Visible |
| Logged Out  | ❌ Hidden  | ✅ Visible | ✅ Visible |

---

## Integration Points

### 1. Page Initialization
**File**: `js/main.js` → `finalizeInitialization()`
- Called during app startup
- Detects current auth status and sets initial mode visibility

### 2. Auth State Changes
**File**: `js/components/navigation.js` → `initAuthStateListener()`
- Listens for Firebase auth state changes
- Calls `updateNormalModeButtonVisibility()` on any change
- This propagates to `updateModeVisibility()`

### 3. Successful Login
**File**: `js/components/auth-page-manager.js` → `handleSignIn()`
- After successful authentication
- Calls `updateModeVisibility(true)`
- Redirects to Mode Normal

### 4. Logout
**File**: `js/components/auth-page-manager.js` → `handleSignOut()`
- After successful sign out
- Calls `updateModeVisibility(false)`
- Redirects to Home

---

## Usage

### Manual Mode Visibility Update
```javascript
// Show Mode Normal (user authenticated)
window.DictaMed.updateModeVisibility(true);

// Show Mode Test (user not authenticated)
window.DictaMed.updateModeVisibility(false);
```

### Check Current User Status
```javascript
const currentUser = window.FirebaseAuthManager?.getCurrentUser?.();
const isAuthenticated = !!currentUser;
console.log('User is authenticated:', isAuthenticated);
```

---

## CSS Classes Used

- `auth-required-hidden` - Class added to hidden mode buttons
- `display: none` - Inline style to hide mode buttons
- `display: ''` - Inline style to show mode buttons

---

## Debugging

### Enable Debug Logging
```javascript
// Check mode button elements
console.log('Mode Normal Button:', document.getElementById('modeNormalBtn'));
console.log('Mode Test Button:', document.getElementById('modeTestBtn'));

// Check current auth status
console.log('Current User:', window.FirebaseAuthManager?.getCurrentUser?.());

// Check visibility function
console.log('updateModeVisibility:', window.DictaMed?.updateModeVisibility);
```

### Test Mode Visibility
```javascript
// Simulate logged-in state
window.DictaMed.updateModeVisibility(true);

// Simulate logged-out state
window.DictaMed.updateModeVisibility(false);
```

---

## Files Modified

1. **index.html**
   - Added `id="modeNormalBtn"` to Mode Normal button
   - Changed initial display state of Mode Normal to `display: none`
   - Changed initial display state of Mode Test to default (visible)

2. **js/main.js**
   - Added `updateModeVisibility()` function
   - Exposed via `window.DictaMed.updateModeVisibility`
   - Called in `finalizeInitialization()` for initial setup

3. **js/components/navigation.js**
   - Updated `updateNormalModeButtonVisibility()` to call `updateModeVisibility()`
   - Ensures sync between old and new mode visibility system

4. **js/components/auth-page-manager.js**
   - Added `updateModeVisibility(true)` after successful login
   - Added `updateModeVisibility(false)` after logout

---

## Future Enhancements

1. **Role-Based Mode Visibility**
   - Extend system to show/hide modes based on user roles
   - Example: Show "Admin Mode" only for admin users

2. **Mode-Specific Permissions**
   - Check permissions before allowing mode access
   - Prevent unauthorized access at entry point

3. **Analytics Tracking**
   - Log mode visibility changes for analytics
   - Track which modes users access

4. **Preference Persistence**
   - Save user's preferred mode to localStorage/Firestore
   - Auto-navigate to preferred mode on login

---

## Testing Checklist

- [ ] Mode Normal is hidden before login
- [ ] Mode Test is visible before login
- [ ] Mode Normal appears immediately after successful login
- [ ] Mode Test disappears immediately after successful login
- [ ] Mode Test appears immediately after logout
- [ ] Mode Normal disappears immediately after logout
- [ ] Page refresh preserves correct mode visibility
- [ ] Firebase auth state listener updates modes correctly
- [ ] Manual calls to `updateModeVisibility()` work correctly
- [ ] No console errors related to mode visibility

---

## Troubleshooting

### Problem: Modes not showing/hiding correctly

**Check:**
1. Is Firebase auth state correctly initialized?
   ```javascript
   console.log(window.FirebaseAuthManager?.getCurrentUser?.());
   ```

2. Are the HTML elements with correct IDs?
   ```javascript
   console.log(document.getElementById('modeNormalBtn'));
   console.log(document.getElementById('modeTestBtn'));
   ```

3. Is `window.DictaMed.updateModeVisibility` defined?
   ```javascript
   console.log(typeof window.DictaMed?.updateModeVisibility);
   ```

### Problem: Auth state changes don't trigger visibility update

**Check:**
1. Is the auth listener in `navigation.js` properly initialized?
2. Is Firebase properly configured?
3. Are there any console errors?

### Problem: Modes visible/hidden at wrong times

**Check:**
1. Verify the authentication status
2. Check browser console for errors
3. Review the auth event handlers in `auth-page-manager.js`

---

**Last Updated**: 2025-12-14
**Version**: 1.0.0
