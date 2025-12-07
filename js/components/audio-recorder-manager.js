/**
 * DictaMed - Gestionnaire des enregistreurs audio
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== AUDIO RECORDER MANAGER =====
class AudioRecorderManager {
    constructor(appState) {
        this.appState = appState;
        this.recorders = new Map();
    }

    init() {
        const recordingSections = document.querySelectorAll('.recording-section');
        
        recordingSections.forEach(section => {
            const sectionId = section.getAttribute('data-section');
            const recorder = new window.AudioRecorder(section);
            this.recorders.set(sectionId, recorder);
            this.appState.setRecording(sectionId, recorder);
        });
    }

    getRecorder(sectionId) {
        return this.recorders.get(sectionId);
    }

    getAllRecorders() {
        return this.recorders;
    }

    getSectionCount() {
        let count = 0;
        const mode = this.appState.getMode();
        const sections = window.APP_CONFIG.SECTIONS[mode];
        
        if (!sections) return 0;
        
        sections.forEach(sectionId => {
            const recorder = this.recorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                count++;
            }
        });

        return count;
    }

    updateSectionCount() {
        const mode = this.appState.getMode();
        
        if (mode === window.APP_CONFIG.MODES.HOME) {
            return;
        }
        
        const count = this.getSectionCount();
        
        // Update display
        const countElements = document.querySelectorAll('.sections-count');
        countElements.forEach(el => {
            if (el.closest(`#mode-${mode}`)) {
                el.textContent = `${count} section(s) enregistrée(s)`;
            }
        });

        // Enable/disable submit button
        const submitBtn = mode === window.APP_CONFIG.MODES.NORMAL 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        if (submitBtn) {
            submitBtn.disabled = count === 0;
        }
    }

    resetMode(mode) {
        const sections = window.APP_CONFIG.SECTIONS[mode];
        if (!sections) return;
        
        sections.forEach(sectionId => {
            const recorder = this.recorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioRecorderManager;
} else {
    window.AudioRecorderManager = AudioRecorderManager;
}