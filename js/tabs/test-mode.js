/**
 * DictaMed - Module Onglet Mode Test
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== TEST MODE TAB MODULE =====
class TestModeTab {
    constructor(appState, navigationSystem, audioRecorderManager, dataSender) {
        this.appState = appState || window.appState;
        this.navigationSystem = navigationSystem || window.tabNavigationSystem;
        this.audioRecorderManager = audioRecorderManager || window.audioRecorderManager;
        this.dataSender = dataSender || window.dataSender;
        
        // Log dependency status
        console.log('📦 TestModeTab constructor - Dependencies status:', {
            appState: !!this.appState,
            navigationSystem: !!this.navigationSystem,
            audioRecorderManager: !!this.audioRecorderManager,
            dataSender: !!this.dataSender
        });
    }

    init() {
        try {
            console.log('🔧 TestModeTab init() started');
            
            // Verify dependencies before initialization
            if (!this.appState) {
                console.warn('⚠️ TestModeTab: appState not available, trying to get from global');
                this.appState = window.appState;
            }
            
            if (!this.navigationSystem) {
                console.warn('⚠️ TestModeTab: navigationSystem not available, trying to get from global');
                this.navigationSystem = window.tabNavigationSystem;
            }
            
            if (!this.audioRecorderManager) {
                console.warn('⚠️ TestModeTab: audioRecorderManager not available, trying to get from global');
                this.audioRecorderManager = window.audioRecorderManager;
            }
            
            if (!this.dataSender) {
                console.warn('⚠️ TestModeTab: dataSender not available, trying to get from global');
                this.dataSender = window.dataSender;
            }
            
            console.log('📊 TestModeTab dependencies after fallback resolution:', {
                appState: !!this.appState,
                navigationSystem: !!this.navigationSystem,
                audioRecorderManager: !!this.audioRecorderManager,
                dataSender: !!this.dataSender
            });
            
            // Initialize components with fallbacks
            this.initEventListeners();
            this.setupDemoFeatures();
            
            console.log('✅ TestModeTab init() completed successfully');
            
        } catch (error) {
            console.error('❌ TestModeTab init() failed:', error);
            // Don't throw, just log and continue
        }
    }

    initEventListeners() {
        // Configuration du bouton de soumission
        const submitBtn = document.getElementById('submitTest');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                try {
                    if (window.loadingOverlay) {
                        window.loadingOverlay.show('Envoi en cours...');
                    }
                    
                    if (!this.dataSender) {
                        console.error('DataSender non disponible');
                        if (window.notificationSystem) {
                            window.notificationSystem.error('Système d\'envoi non disponible', 'Erreur');
                        }
                        return;
                    }
                    
                    this.dataSender.send(window.APP_CONFIG.MODES.TEST).finally(() => {
                        if (window.loadingOverlay) {
                            window.loadingOverlay.hide();
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'envoi:', error);
                    if (window.notificationSystem) {
                        window.notificationSystem.error('Erreur lors de l\'envoi des données', 'Erreur');
                    }
                    if (window.loadingOverlay) {
                        window.loadingOverlay.hide();
                    }
                }
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
        
        if (guideText) {
            if (window.notificationSystem && window.notificationSystem.info) {
                try {
                    window.notificationSystem.info(guideText, 'Guide d\'enregistrement', 3000);
                } catch (error) {
                    console.warn('Erreur lors de l\'affichage du guide:', error);
                    // Fallback: afficher un toast simple
                    alert(guideText);
                }
            } else {
                console.log('Guide d\'enregistrement:', guideText);
                // Fallback si notificationSystem non disponible
                alert(guideText);
            }
        }
    }

    // Validation spécifique au mode test
    validateForm() {
        try {
            const numeroDossier = document.getElementById('numeroDossierTest')?.value?.trim() || '';
            const nomPatient = document.getElementById('nomPatientTest')?.value?.trim() || '';

            if (!numeroDossier || !nomPatient) {
                if (window.notificationSystem && window.notificationSystem.warning) {
                    try {
                        window.notificationSystem.warning('Veuillez remplir le numéro de dossier et le nom du patient pour le test', 'Champs requis');
                    } catch (error) {
                        console.warn('Erreur notification:', error);
                        alert('Veuillez remplir le numéro de dossier et le nom du patient pour le test');
                    }
                }
                return false;
            }

            let sectionCount = 0;
            if (this.audioRecorderManager && typeof this.audioRecorderManager.getSectionCount === 'function') {
                sectionCount = this.audioRecorderManager.getSectionCount();
            }

            if (sectionCount === 0) {
                if (window.notificationSystem && window.notificationSystem.warning) {
                    try {
                        window.notificationSystem.warning('Veuillez enregistrer au moins une section pour tester la fonctionnalité', 'Aucun enregistrement');
                    } catch (error) {
                        console.warn('Erreur notification:', error);
                        alert('Veuillez enregistrer au moins une section pour tester la fonctionnalité');
                    }
                }
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la validation:', error);
            return false;
        }
    }

    // Réinitialisation du formulaire
    resetForm() {
        try {
            const numeroDossier = document.getElementById('numeroDossierTest');
            const nomPatient = document.getElementById('nomPatientTest');
            
            if (numeroDossier) numeroDossier.value = '';
            if (nomPatient) nomPatient.value = '';
            
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
            if (this.audioRecorderManager && typeof this.audioRecorderManager.resetMode === 'function') {
                this.audioRecorderManager.resetMode(window.APP_CONFIG.MODES.TEST);
            }
            
            // Update section count
            if (this.audioRecorderManager && typeof this.audioRecorderManager.updateSectionCount === 'function') {
                this.audioRecorderManager.updateSectionCount();
            }
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
        }
    }

    // Gestion de l'affichage du Google Sheet
    showGoogleSheetResult() {
        try {
            const googleSheetCard = document.getElementById('googleSheetCard');
            if (googleSheetCard) {
                googleSheetCard.style.display = 'block';
                if (typeof googleSheetCard.scrollIntoView === 'function') {
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                console.warn('Element googleSheetCard non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors de l\'affichage du résultat Google Sheet:', error);
        }
    }

    hideGoogleSheetResult() {
        try {
            const googleSheetCard = document.getElementById('googleSheetCard');
            if (googleSheetCard) {
                googleSheetCard.style.display = 'none';
            }
        } catch (error) {
            console.error('Erreur lors du masquage du résultat Google Sheet:', error);
        }
    }

    // Lifecycle methods
    onTabLoad() {
        try {
            console.log('Mode Test chargé');
            this.updateSectionCount();
            this.hideGoogleSheetResult(); // Cacher le résultat précédent
            
            if (window.notificationSystem && window.notificationSystem.info) {
                try {
                    window.notificationSystem.info('Mode démonstration actif - Vos données seront visibles dans le Google Sheet public', 'Mode Test', 5000);
                } catch (error) {
                    console.warn('Erreur lors de l\'affichage de la notification:', error);
                    console.log('Mode démonstration actif');
                }
            } else {
                console.log('Mode démonstration actif - Vos données seront visibles dans le Google Sheet public');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du tab test:', error);
        }
    }

    onTabUnload() {
        try {
            console.log('Mode Test déchargé');
            // Cacher le Google Sheet quand on quitte le tab
            this.hideGoogleSheetResult();
        } catch (error) {
            console.error('Erreur lors du déchargement du tab test:', error);
        }
    }

    updateSectionCount() {
        try {
            if (this.audioRecorderManager && typeof this.audioRecorderManager.updateSectionCount === 'function') {
                this.audioRecorderManager.updateSectionCount();
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur de sections:', error);
        }
    }

    // Méthodes utilitaires spécifiques au mode test
    getPatientInfo() {
        try {
            return {
                numeroDossier: document.getElementById('numeroDossierTest')?.value?.trim() || '',
                nomPatient: document.getElementById('nomPatientTest')?.value?.trim() || ''
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des infos patient:', error);
            return {
                numeroDossier: '',
                nomPatient: ''
            };
        }
    }

    hasValidData() {
        try {
            const patientInfo = this.getPatientInfo();
            const hasRecordings = this.audioRecorderManager && 
                                 typeof this.audioRecorderManager.getSectionCount === 'function' && 
                                 this.audioRecorderManager.getSectionCount() > 0;
            
            return patientInfo.numeroDossier && patientInfo.nomPatient && hasRecordings;
        } catch (error) {
            console.error('Erreur lors de la vérification des données:', error);
            return false;
        }
    }

    // Méthodes spécifiques au mode démo
    getDemoStats() {
        try {
            const totalRecordings = this.audioRecorderManager && 
                                   typeof this.audioRecorderManager.getSectionCount === 'function' ? 
                                   this.audioRecorderManager.getSectionCount() : 0;
            
            return {
                totalRecordings,
                totalDuration: this.calculateTotalRecordingDuration(),
                formCompletion: this.getFormCompletionPercentage()
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            return {
                totalRecordings: 0,
                totalDuration: 0,
                formCompletion: 0
            };
        }
    }

    calculateTotalRecordingDuration() {
        try {
            let totalDuration = 0;
            const sections = window.APP_CONFIG?.SECTIONS?.test || [];
            
            if (!this.audioRecorderManager || typeof this.audioRecorderManager.getRecorder !== 'function') {
                return 0;
            }
            
            sections.forEach(sectionId => {
                try {
                    const recorder = this.audioRecorderManager.getRecorder(sectionId);
                    if (recorder && typeof recorder.hasRecording === 'function' && recorder.hasRecording()) {
                        // Estimation basée sur la taille du fichier audio
                        if (recorder.audioBlob && recorder.audioBlob.size) {
                            totalDuration += Math.round(recorder.audioBlob.size / 32000); // Estimation approximative
                        }
                    }
                } catch (sectionError) {
                    console.warn(`Erreur lors du calcul de la durée pour la section ${sectionId}:`, sectionError);
                }
            });
            
            return totalDuration;
        } catch (error) {
            console.error('Erreur lors du calcul de la durée totale:', error);
            return 0;
        }
    }

    getFormCompletionPercentage() {
        try {
            const patientInfo = this.getPatientInfo();
            const hasRecordings = this.audioRecorderManager && 
                                 typeof this.audioRecorderManager.getSectionCount === 'function' && 
                                 this.audioRecorderManager.getSectionCount() > 0;
            
            let completion = 0;
            if (patientInfo.numeroDossier) completion += 33;
            if (patientInfo.nomPatient) completion += 33;
            if (hasRecordings) completion += 34;
            
            return completion;
        } catch (error) {
            console.error('Erreur lors du calcul du pourcentage de completion:', error);
            return 0;
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestModeTab;
} else {
    window.TestModeTab = TestModeTab;
}