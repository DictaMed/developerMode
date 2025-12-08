/**
 * DictaMed - Audio Recorder Manager (Simplified)
 * Version: 3.0.0 - Simplified while preserving all functionality
 * Improvements: Reduced complexity, eliminated redundancy, streamlined error handling
 */

class AudioRecorderManager {
    constructor(appState) {
        this.appState = appState;
        this.recorders = new Map();
    }

    init() {
        try {
            const recordingSections = document.querySelectorAll('.recording-section-enhanced');

            if (!recordingSections || recordingSections.length === 0) {
                console.debug('ℹ️ AudioRecorderManager: No recording sections found, scheduling retry...');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            recordingSections.forEach(section => {
                try {
                    if (!section?.getAttribute('data-section')) return;
                    
                    if (typeof window.AudioRecorder === 'undefined') {
                        throw new Error('AudioRecorder constructor not available');
                    }
                    
                    const sectionId = section.getAttribute('data-section');
                    const recorder = new window.AudioRecorder(section);
                    this.recorders.set(sectionId, recorder);
                    
                    // Set recording in app state safely
                    if (this.appState?.setRecording) {
                        this.appState.setRecording(sectionId, recorder);
                    }
                } catch (sectionError) {
                    console.error(`❌ AudioRecorderManager: Error initializing section ${section?.getAttribute('data-section')}:`, sectionError);
                    // Continue with other sections instead of stopping everything
                }
            });
            
            console.log(`✅ AudioRecorderManager initialized with ${this.recorders.size} recorders`);
        } catch (error) {
            console.error('❌ AudioRecorderManager initialization failed:', error);
        }
    }

    getRecorder(sectionId) {
        return this.recorders.get(sectionId);
    }

    getAllRecorders() {
        return this.recorders;
    }

    getSectionCount() {
        const mode = this.appState?.getMode();
        const sections = window.APP_CONFIG?.SECTIONS?.[mode];
        
        if (!sections) return 0;
        
        return sections.filter(sectionId => {
            const recorder = this.recorders.get(sectionId);
            return recorder?.hasRecording?.();
        }).length;
    }

    updateSectionCount() {
        const mode = this.appState?.getMode();
        
        if (mode === window.APP_CONFIG?.MODES?.HOME) return;
        
        const count = this.getSectionCount();
        
        // Update display elements
        document.querySelectorAll('.sections-count').forEach(el => {
            if (el.closest(`#mode-${mode}`)) {
                el.textContent = `${count} section(s) enregistrée(s)`;
            }
        });

        // Enable/disable submit button
        const submitBtn = mode === window.APP_CONFIG?.MODES?.NORMAL 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        if (submitBtn) {
            submitBtn.disabled = count === 0;
        }
    }

    resetMode(mode) {
        const sections = window.APP_CONFIG?.SECTIONS?.[mode];
        if (!sections) return;
        
        sections.forEach(sectionId => {
            const recorder = this.recorders.get(sectionId);
            if (recorder?.hasRecording?.()) {
                recorder.resetRecording?.();
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioRecorderManager;
} else {
    window.AudioRecorderManager = AudioRecorderManager;
}