/**
 * DictaMed - Module Onglet Mode Test
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== TEST MODE TAB MODULE =====
class TestModeTab {
    constructor(appState, navigationSystem, audioRecorderManager, dataSender) {
        this.appState = appState;
        this.navigationSystem = navigationSystem;
        this.audioRecorderManager = audioRecorderManager;
        this.dataSender = dataSender;
    }

    init() {
        this.initEventListeners();
        this.setupDemoFeatures();
    }

    initEventListeners() {
        // Configuration du bouton de soumission
        const submitBtn = document.getElementById('submitTest');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (window.loadingOverlay) {
                    window.loadingOverlay.show('Envoi en cours...');
                }
                this.dataSender.send(window.APP_CONFIG.MODES.TEST).finally(() => {
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
            { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter', maxLength: 50 },
            { id: 'nomPatientTest', counterId: 'nomPatientTestCounter', maxLength: 50 }
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

    setupDemoFeatures() {
        // Configuration spécifique aux fonctionnalités de démonstration
        this.setupDemoInstructions();
        this.setupTestModeIndicators();
    }

    setupDemoInstructions() {
        // Affichage d'instructions spécifiques au mode test
        const demoSection = document.querySelector('.demo-instructions');
        if (demoSection) {
            // Ajouter des tooltips ou des guides interactifs
            this.addInteractiveGuides();
        }
    }

    setupTestModeIndicators() {
        // Indicateurs visuels spécifiques au mode test
        const submitBtn = document.getElementById('submitTest');
        if (submitBtn) {
            submitBtn.setAttribute('title', 'Mode démonstration - Données envoyées vers un Google Sheet public');
        }
    }

    addInteractiveGuides() {
        // Guides interactifs pour aider les utilisateurs en mode test
        const recordingSections = document.querySelectorAll('.recording-section');
        recordingSections.forEach(section => {
            const sectionTitle = section.querySelector('h3');
            if (sectionTitle) {
                sectionTitle.addEventListener('mouseenter', () => {
                    this.showRecordingGuide(section);
                });
            }
        });
    }

    showRecordingGuide(section) {
        // Guide contextuel pour l'enregistrement
        const guides = {
            'clinique': 'Décrivez les symptômes et observations cliniques du patient',
            'antecedents': 'Mentionnez les antécédents médicaux pertinents',
            'biologie': 'Rapportez les résultats d\'analyses biologiques'
        };

        const sectionId = section.getAttribute('data-section');
        const guideText = guides[sectionId];
        
        if (guideText && window.notificationSystem) {
            window.notificationSystem.info(guideText, 'Guide d\'enregistrement', 3000);
        }
    }

    // Validation spécifique au mode test
    validateForm() {
        const numeroDossier = document.getElementById('numeroDossierTest').value.trim();
        const nomPatient = document.getElementById('nomPatientTest').value.trim();

        if (!numeroDossier || !nomPatient) {
            if (window.notificationSystem) {
                window.notificationSystem.warning('Veuillez remplir le numéro de dossier et le nom du patient pour le test', 'Champs requis');
            }
            return false;
        }

        const sectionCount = this.audioRecorderManager.getSectionCount();
        if (sectionCount === 0) {
            if (window.notificationSystem) {
                window.notificationSystem.warning('Veuillez enregistrer au moins une section pour tester la fonctionnalité', 'Aucun enregistrement');
            }
            return false;
        }

        return true;
    }

    // Réinitialisation du formulaire
    resetForm() {
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';
        
        // Reset character counters
        const counters = [
            { counter: 'numeroDossierTestCounter' },
            { counter: 'nomPatientTestCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        // Reset recordings
        this.audioRecorderManager.resetMode(window.APP_CONFIG.MODES.TEST);
        
        // Update section count
        this.audioRecorderManager.updateSectionCount();
    }

    // Gestion de l'affichage du Google Sheet
    showGoogleSheetResult() {
        const googleSheetCard = document.getElementById('googleSheetCard');
        if (googleSheetCard) {
            googleSheetCard.style.display = 'block';
            googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    hideGoogleSheetResult() {
        const googleSheetCard = document.getElementById('googleSheetCard');
        if (googleSheetCard) {
            googleSheetCard.style.display = 'none';
        }
    }

    // Lifecycle methods
    onTabLoad() {
        console.log('Mode Test chargé');
        this.updateSectionCount();
        this.hideGoogleSheetResult(); // Cacher le résultat précédent
        
        if (window.notificationSystem) {
            window.notificationSystem.info('Mode démonstration actif - Vos données seront visibles dans le Google Sheet public', 'Mode Test', 5000);
        }
    }

    onTabUnload() {
        console.log('Mode Test déchargé');
        // Cacher le Google Sheet quand on quitte le tab
        this.hideGoogleSheetResult();
    }

    updateSectionCount() {
        if (this.audioRecorderManager) {
            this.audioRecorderManager.updateSectionCount();
        }
    }

    // Méthodes utilitaires spécifiques au mode test
    getPatientInfo() {
        return {
            numeroDossier: document.getElementById('numeroDossierTest').value.trim(),
            nomPatient: document.getElementById('nomPatientTest').value.trim()
        };
    }

    hasValidData() {
        const patientInfo = this.getPatientInfo();
        return patientInfo.numeroDossier && patientInfo.nomPatient && this.audioRecorderManager.getSectionCount() > 0;
    }

    // Méthodes spécifiques au mode démo
    getDemoStats() {
        return {
            totalRecordings: this.audioRecorderManager.getSectionCount(),
            totalDuration: this.calculateTotalRecordingDuration(),
            formCompletion: this.getFormCompletionPercentage()
        };
    }

    calculateTotalRecordingDuration() {
        let totalDuration = 0;
        const sections = window.APP_CONFIG.SECTIONS.test;
        
        sections.forEach(sectionId => {
            const recorder = this.audioRecorderManager.getRecorder(sectionId);
            if (recorder && recorder.hasRecording()) {
                // Estimation basée sur la taille du fichier audio
                if (recorder.audioBlob) {
                    totalDuration += Math.round(recorder.audioBlob.size / 32000); // Estimation approximative
                }
            }
        });
        
        return totalDuration;
    }

    getFormCompletionPercentage() {
        const patientInfo = this.getPatientInfo();
        const hasRecordings = this.audioRecorderManager.getSectionCount() > 0;
        
        let completion = 0;
        if (patientInfo.numeroDossier) completion += 33;
        if (patientInfo.nomPatient) completion += 33;
        if (hasRecordings) completion += 34;
        
        return completion;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestModeTab;
} else {
    window.TestModeTab = TestModeTab;
}