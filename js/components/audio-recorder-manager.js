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
        try {
            const recordingSections = document.querySelectorAll('.recording-section-enhanced');

            // Vérification de nullité pour les sections d'enregistrement
            if (!recordingSections || recordingSections.length === 0) {
                // Schedule retry after short delay for tab loading
                console.debug('ℹ️ AudioRecorderManager: No recording sections found, scheduling retry...');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            recordingSections.forEach(section => {
                try {
                    if (!section) {
                        console.warn('⚠️ AudioRecorderManager: Null section encountered');
                        return;
                    }
                    
                    const sectionId = section.getAttribute('data-section');
                    if (!sectionId) {
                        console.warn('⚠️ AudioRecorderManager: Section missing data-section attribute');
                        return;
                    }
                    
                    if (typeof window.AudioRecorder === 'undefined') {
                        throw new Error('AudioRecorder constructor not available');
                    }
                    
                    const recorder = new window.AudioRecorder(section);
                    this.recorders.set(sectionId, recorder);
                    
                    if (this.appState && typeof this.appState.setRecording === 'function') {
                        this.appState.setRecording(sectionId, recorder);
                    } else {
                        console.warn(`⚠️ AudioRecorderManager: AppState not available for section ${sectionId}`);
                    }
                } catch (sectionError) {
                    console.error(`❌ AudioRecorderManager: Error initializing section ${section?.getAttribute('data-section')}:`, sectionError);
                    // Continue avec les autres sections au lieu de tout arrêter
                }
            });
            
            console.log(`✅ AudioRecorderManager initialized with ${this.recorders.size} recorders`);
        } catch (error) {
            console.error('❌ AudioRecorderManager initialization failed:', error);
            // Ne pas propager l'erreur pour éviter de casser l'application entière
        }
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

        if (!sections) {
            console.warn(`⚠️ AudioRecorderManager: No sections found for mode ${mode}`);
            return 0;
        }

        sections.forEach(sectionId => {
            const recorder = this.recorders.get(sectionId);
            if (recorder) {
                const hasRecording = recorder.hasRecording();
                if (hasRecording) {
                    count++;
                    console.log(`   ✅ Section ${sectionId}: has recording (${recorder.audioBlob?.size || 0} bytes)`);
                } else {
                    console.log(`   ❌ Section ${sectionId}: no recording`);
                }
            } else {
                console.warn(`   ⚠️ Section ${sectionId}: recorder not found in recorders Map`);
            }
        });

        return count;
    }

    updateSectionCount() {
        try {
            console.log('🔍 updateSectionCount() CALLED');

            if (!this.appState) {
                console.error('❌ ERROR: this.appState is null/undefined');
                return;
            }

            const mode = this.appState.getMode();
            console.log(`   Mode: ${mode}, HOME: ${window.APP_CONFIG.MODES.HOME}`);

            if (mode === window.APP_CONFIG.MODES.HOME) {
                console.log('   → Skipping update (mode is HOME)');
                return;
            }

            console.log(`📊 Getting section count for mode: ${mode}`);
            const count = this.getSectionCount();
            console.log(`📊 Section count updated for mode ${mode}: ${count} recording(s)`);

            // Update display - FIX: Use direct element IDs instead of searching for parent
            // Mode-specific counter element IDs:
            // - normal mode: #sectionsCount
            // - test mode: #sectionsCountTest
            let counterElementId;
            if (mode === window.APP_CONFIG.MODES.NORMAL) {
                counterElementId = 'sectionsCount';
            } else if (mode === window.APP_CONFIG.MODES.TEST) {
                counterElementId = 'sectionsCountTest';
            }

            if (counterElementId) {
                const counterEl = document.getElementById(counterElementId);
                if (counterEl) {
                    counterEl.textContent = `${count} section(s) enregistrée(s)`;
                    console.log(`✅ Updated counter element (#${counterElementId}) in ${mode} mode: "${counterEl.textContent}"`);
                } else {
                    console.warn(`⚠️ AudioRecorderManager: Counter element #${counterElementId} not found in DOM`);
                }
            } else {
                console.log(`ℹ️ AudioRecorderManager: No counter element for mode ${mode}`);
            }

            // Enable/disable submit button
            const submitBtn = mode === window.APP_CONFIG.MODES.NORMAL
                ? document.getElementById('submitNormal')
                : document.getElementById('submitTest');

            if (submitBtn) {
                const wasDisabled = submitBtn.disabled;
                submitBtn.disabled = count === 0;
                if (wasDisabled && !submitBtn.disabled) {
                    console.log(`✅ Submit button ENABLED for mode ${mode}`);
                } else if (!wasDisabled && submitBtn.disabled) {
                    console.log(`❌ Submit button DISABLED for mode ${mode}`);
                }
            } else {
                console.warn(`⚠️ AudioRecorderManager: Submit button not found for mode ${mode}`);
            }
        } catch (error) {
            console.error('❌ ERROR in updateSectionCount():', error);
            console.error('   Stack:', error.stack);
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