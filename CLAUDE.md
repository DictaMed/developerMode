# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DictaMed is a French medical dictation web application that converts voice recordings into structured medical documents. It supports three operational modes: Normal (authenticated users), Test (public demo), and DMI (authenticated, with photo/text support).

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 - no framework
- **Backend**: Firebase (Firestore database, Firebase Auth)
- **Integration**: n8n webhooks for processing audio/text/photo data
- **Hosting**: Firebase Hosting

## Commands

```bash
# Firestore setup
npm run setup           # Initial Firestore configuration
npm run setup:reset     # Reset Firestore configuration
npm run verify          # Verify Firestore setup

# Firebase deployment
firebase deploy --only hosting    # Deploy to Firebase Hosting
firebase deploy --only firestore  # Deploy Firestore rules
```

## Architecture

### Entry Points
- `index.html` - Main SPA shell with sidebar navigation
- `js/main.js` - Application bootstrap and initialization orchestrator

### Script Loading Order (Critical)
Scripts must load in this order (defined in index.html):
1. Firebase SDK (external CDN)
2. Core modules (`js/core/`) - config, utils, error-handler
3. App state (`js/core/app-state.js`)
4. Components (`js/components/`) - notification, loading, auth, audio, navigation
5. Tab modules (`js/tabs/`) - home, normal-mode, test-mode
6. Main entry (`js/main.js`)

### Tab System
Content is loaded dynamically via `TabNavigationSystem.loadTabContent()`:
- `tab-home.html`, `tab-mode-normal.html`, `tab-mode-test.html`, `tab-mode-dmi.html`, etc.
- Each tab file is fetched and injected into `#tab-content` container
- Tab-specific initialization happens in `initTabContentEventListeners()`

### Key Classes

| Class | Location | Purpose |
|-------|----------|---------|
| `TabNavigationSystem` | `js/components/navigation.js` | Tab routing and sidebar management |
| `AppState` | `js/core/app-state.js` | Global application state |
| `EnhancedFirebaseAuthManager` | `js/components/enhanced-firebase-auth-manager.js` | Auth with 2FA, rate limiting, device tracking |
| `AudioRecorderManager` | `js/components/audio-recorder-manager.js` | Multi-section audio recording |
| `DataSender` | `js/components/data-sender.js` | Send audio/text/photo to n8n webhooks |
| `ModeVisibilityManager` | `js/main.js` | Show/hide modes based on auth state |

### Data Flow
1. User records audio/enters text/uploads photo in a mode tab
2. `DataSender.send()` collects data from all sections
3. Audio files are merged into single WAV file
4. Data is sent to n8n webhook based on file type (audio/text/photo)
5. Webhook endpoints configured in `js/config/webhooks-config.js`

### Mode Access Control
- **Public**: Test mode, Guide, FAQ, Home
- **Authenticated only**: Normal mode, DMI mode
- Controlled by `ModeVisibilityManager` and `checkTabAccess()` in navigation

## Configuration Files

- `js/core/config.js` - App constants (recording limits, timeouts, modes, sections)
- `js/config/webhooks-config.js` - n8n webhook URLs by file type (audio/text/photo)
- `firebase.json` - Firebase Hosting configuration
- `firestore.rules` - Firestore security rules

## Global Instances

Available on `window` after initialization:
- `appState`, `notificationSystem`, `loadingOverlay`
- `audioRecorderManager`, `dataSender`, `tabNavigationSystem`
- `FirebaseAuthManager`, `modeVisibilityManager`
- `DictaMed` namespace for helper functions

## Mode Sections

Defined in `APP_CONFIG.SECTIONS`:
- **Normal mode**: partie1, partie2, partie3, partie4
- **Test mode**: clinique, antecedents, biologie

## Important Patterns

- Components expose classes globally via `window.ClassName = ClassName`
- Initialization uses `safeInit()` helper for error resilience
- Event listeners tracked in `tabEventListeners` Map to prevent memory leaks
- Firebase Auth state changes trigger `ModeVisibilityManager.updateVisibility()`
- All user-facing text is in French
