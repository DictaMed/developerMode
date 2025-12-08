/**
 * DictaMed - Gestion de l'état de l'application
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== APPLICATION STATE =====
class AppState {
    constructor() {
        this.currentMode = window.APP_CONFIG.MODES.HOME;
        this.recordings = {
            normal: {},
            test: {}
        };
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.isInitialized = false;
    }

    setMode(mode) {
        if (Object.values(window.APP_CONFIG.MODES).includes(mode)) {
            this.currentMode = mode;
        }
    }

    getMode() {
        return this.currentMode;
    }

    getRecordingsForMode(mode) {
        return this.recordings[mode] || {};
    }

    hasRecording(sectionId) {
        const mode = this.currentMode;
        return this.recordings[mode] && this.recordings[mode][sectionId] && this.recordings[mode][sectionId].hasRecording();
    }

    getRecording(sectionId) {
        const mode = this.currentMode;
        return this.recordings[mode] && this.recordings[mode][sectionId] ? this.recordings[mode][sectionId] : null;
    }

    setRecording(sectionId, recorder) {
        if (!this.recordings[this.currentMode]) {
            this.recordings[this.currentMode] = {};
        }
        this.recordings[this.currentMode][sectionId] = recorder;
    }

    clear() {
        this.recordings = {
            normal: {},
            test: {}
        };
        this.lastSaveTime = null;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
} else {
    window.AppState = AppState;
}