/**
 * DictaMed - Module Onglet Mode Normal
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== NORMAL MODE TAB MODULE =====
class NormalModeTab {
    constructor(appState, navigationSystem, audioRecorderManager, dataSender) {
        this.appState = appState;
        this.navigationSystem = navigationSystem;
        this.audioRecorderManager = audioRecorderManager;
        this.dataSender = dataSender;
    }

    init() {
        this.initEventListeners();
        this.setupOptionalSectionToggle();
    }

    initEventListeners() {
        // Configuration du bouton de soumission
        const submitBtn = document.getElementById('submitNormal');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (window.loadingOverlay) {
                    window.loadingOverlay.show('Envoi en cours...');
                }
                this.dataSender.send(window.APP_CONFIG.MODES.NORMAL).finally(() => {
                    if (window.loadingOverlay) {
                        window.loadingOverlay.hide();
                    }
                });
            });
        }

        // Configuration des compteurs de caractères
        this.setupCharacterCounters();
    }

    setupCharacterCounters() {
        const inputs = [
            { id: 'numeroDossier', counterId: 'numeroDossierCounter', maxLength: 50 },
            { id: 'nomPatient', counterId: 'nomPatientCounter', maxLength: 50 }
        ];

        inputs.forEach(({ id, counterId, maxLength }) => {
            const input = document.getElementById(id);
            const counter = document.getElementById(counterId);
            
            if (input && counter) {
                input.addEventListener('input', () => {
                    this.updateCharCounter(input, counter, maxLength);
                });
            }
        });
    }

    updateCharCounter(input, counter, maxLength) {
        const length = input.value.length;
        counter.textContent = `${length}/${maxLength}`;

        // Change color based on usage level
        counter.classList.remove('warning', 'danger');
        if (length >= maxLength) {
            counter.classList.add('danger');
        } else if (length >= maxLength * 0.8) {
            counter.classList.add('warning');
        }
    }

    setupOptionalSectionToggle() {
        const toggleBtn = document.getElementById('togglePartie4');
        const partie4 = document.querySelector('[data-section="partie4"]');
        
        if (toggleBtn && partie4) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = partie4.classList.contains('hidden');
                partie4.classList.toggle('hidden');
                toggleBtn.textContent = isHidden 
                    ? 'Masquer Partie 4' 
                    : 'Afficher Partie 4 (optionnelle)';
            });
        }
    }

    // Validation spécifique au mode normal
    validateForm() {
        const numeroDossierEl = document.getElementById('numeroDossier');
        const nomPatientEl = document.getElementById('nomPatient');
        
        // Only validate if elements exist
        if (!numeroDossierEl || !nomPatientEl) {
            console.warn('Form elements not found for validation');
            return false;
        }
        
        const numeroDossier = numeroDossierEl.value.trim();
        const nomPatient = nomPatientEl.value.trim();

        if (!numeroDossier || !nomPatient) {
            if (window.notificationSystem) {
                window.notificationSystem.warning('Veuillez remplir le numéro de dossier et le nom du patient', 'Champs requis');
            }
            return false;
        }

        const sectionCount = this.audioRecorderManager.getSectionCount();
        if (sectionCount === 0) {
            if (window.notificationSystem) {
                window.notificationSystem.warning('Veuillez enregistrer au moins une section avant d\'envoyer', 'Aucun enregistrement');
            }
            return false;
        }

        return true;
    }

    // Réinitialisation du formulaire
    resetForm() {
        const numeroDossierEl = document.getElementById('numeroDossier');
        const nomPatientEl = document.getElementById('nomPatient');
        
        if (numeroDossierEl) numeroDossierEl.value = '';
        if (nomPatientEl) nomPatientEl.value = '';
        
        // Reset character counters
        const counters = [
            { counter: 'numeroDossierCounter' },
            { counter: 'nomPatientCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        // Reset recordings
        this.audioRecorderManager.resetMode(window.APP_CONFIG.MODES.NORMAL);
        
        // Update section count
        this.audioRecorderManager.updateSectionCount();
    }

    // Lifecycle methods
    onTabLoad() {
        console.log('Mode Normal chargé');
        this.updateSectionCount();
    }

    onTabUnload() {
        console.log('Mode Normal déchargé');
        // Sauvegarde automatique avant de quitter
        if (window.autoSaveSystem) {
            window.autoSaveSystem.save();
        }
    }

    updateSectionCount() {
        if (this.audioRecorderManager) {
            this.audioRecorderManager.updateSectionCount();
        }
    }

    // Méthodes utilitaires spécifiques au mode normal
    getPatientInfo() {
        const numeroDossierEl = document.getElementById('numeroDossier');
        const nomPatientEl = document.getElementById('nomPatient');
        
        return {
            numeroDossier: numeroDossierEl ? numeroDossierEl.value.trim() : '',
            nomPatient: nomPatientEl ? nomPatientEl.value.trim() : ''
        };
    }

    hasValidData() {
        const patientInfo = this.getPatientInfo();
        return patientInfo.numeroDossier && patientInfo.nomPatient && this.audioRecorderManager.getSectionCount() > 0;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NormalModeTab;
} else {
    window.NormalModeTab = NormalModeTab;
}