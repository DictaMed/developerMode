/**
 * DictaMed - Système de sauvegarde automatique
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== AUTO-SAVE SYSTEM =====
class AutoSaveSystem {
    constructor(appState) {
        this.appState = appState;
        this.indicator = null;
        this.debounceTimer = null;
    }

    init() {
        this.createIndicator();
        this.startAutoSave();
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'autosave-indicator';
        this.indicator.innerHTML = '<div class="icon"></div><span class="text">Sauvegarde automatique</span>';
        this.indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        document.body.appendChild(this.indicator);
    }

    save() {
        try {
            const data = {
                mode: this.appState.getMode(),
                timestamp: Date.now(),
                forms: this.collectFormData()
            };
            
            localStorage.setItem('dictamed_autosave', JSON.stringify(data));
            this.appState.lastSaveTime = Date.now();
            this.showIndicator('saved');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showIndicator('error');
        }
    }

    collectFormData() {
        const data = {};
        const mode = this.appState.getMode();
        
        // Collect form data based on current mode
        if (mode === window.APP_CONFIG.MODES.NORMAL) {
            data.numeroDossier = document.getElementById('numeroDossier')?.value || '';
            data.nomPatient = document.getElementById('nomPatient')?.value || '';
        } else if (mode === window.APP_CONFIG.MODES.TEST) {
            data.numeroDossier = document.getElementById('numeroDossierTest')?.value || '';
            data.nomPatient = document.getElementById('nomPatientTest')?.value || '';
        } else if (mode === window.APP_CONFIG.MODES.DMI) {
            data.numeroDossier = document.getElementById('numeroDossierDMI')?.value || '';
            data.nomPatient = document.getElementById('nomPatientDMI')?.value || '';
            data.texteLibre = document.getElementById('texteLibre')?.value || '';
        }
        
        return data;
    }

    startAutoSave() {
        if (this.appState) {
            this.appState.autoSaveInterval = setInterval(() => {
                this.save();
            }, window.APP_CONFIG.AUTOSAVE_INTERVAL);
        }
        
        // Debounced save on form changes
        const debouncedSave = window.Utils.debounce(() => {
            this.save();
        }, 1000);
        
        document.addEventListener('input', debouncedSave);
    }

    showIndicator(state) {
        if (!this.indicator) return;
        
        this.indicator.style.opacity = '1';
        this.indicator.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            this.indicator.style.opacity = '0';
            this.indicator.style.transform = 'translateY(20px)';
        }, 2000);
    }

    clear() {
        localStorage.removeItem('dictamed_autosave');
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoSaveSystem;
} else {
    window.AutoSaveSystem = AutoSaveSystem;
}