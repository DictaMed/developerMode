/**
 * DictaMed - Système de validation des formulaires
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== FORM VALIDATION SYSTEM =====
class FormValidationSystem {
    constructor() {
        this.validators = new Map();
        this.init();
    }

    init() {
        this.initCharCounters();
        this.initOptionalSection();
        this.initDMIValidation();
    }

    initCharCounters() {
        try {
            const inputs = [
                { id: 'numeroDossier', counterId: 'numeroDossierCounter', maxLength: 50 },
                { id: 'nomPatient', counterId: 'nomPatientCounter', maxLength: 50 },
                { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter', maxLength: 50 },
                { id: 'nomPatientTest', counterId: 'nomPatientTestCounter', maxLength: 50 },
                { id: 'numeroDossierDMI', counterId: 'numeroDossierDMICounter', maxLength: 50 },
                { id: 'nomPatientDMI', counterId: 'nomPatientDMICounter', maxLength: 50 }
            ];

            let initializedCount = 0;
            inputs.forEach(({ id, counterId, maxLength }) => {
                try {
                    const input = document.getElementById(id);
                    const counter = document.getElementById(counterId);
                    
                    // Only process if both elements exist
                    if (!input || !counter) {
                        // Only log warning if we're in development and the elements are expected to exist
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                            if (!input) {
                                console.debug(`FormValidationSystem: Input element not found: ${id} (expected if not on this tab)`);
                            }
                            if (!counter) {
                                console.debug(`FormValidationSystem: Counter element not found: ${counterId} (expected if not on this tab)`);
                            }
                        }
                        return;
                    }
                    
                    // Vérification que maxLength est valide
                    if (typeof maxLength !== 'number' || maxLength <= 0) {
                        console.warn(`FormValidationSystem: Invalid maxLength for ${id}: ${maxLength}`);
                        maxLength = 50; // Valeur par défaut
                    }
                    
                    input.addEventListener('input', () => {
                        try {
                            this.updateCharCounter(input, counter, maxLength);
                        } catch (error) {
                            console.error(`FormValidationSystem: Error updating counter for ${id}:`, error);
                        }
                    });
                    
                    // Initialisation du compteur
                    this.updateCharCounter(input, counter, maxLength);
                    initializedCount++;
                } catch (inputError) {
                    console.error(`FormValidationSystem: Error setting up input ${id}:`, inputError);
                }
            });

            // Textarea counter avec gestion d'erreur améliorée
            try {
                const texteLibre = document.getElementById('texteLibre');
                const texteLibreCounter = document.getElementById('texteLibreCounter');
                
                if (texteLibre && texteLibreCounter) {
                    texteLibre.addEventListener('input', () => {
                        try {
                            texteLibreCounter.textContent = texteLibre.value.length;
                        } catch (error) {
                            console.error('FormValidationSystem: Error updating texteLibre counter:', error);
                        }
                    });
                    
                    // Initialisation
                    texteLibreCounter.textContent = texteLibre.value.length;
                    initializedCount++;
                } else {
                    // Only log warnings in development if elements are expected
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        if (!texteLibre) {
                            console.debug('FormValidationSystem: texteLibre element not found (expected if not on DMI tab)');
                        }
                        if (!texteLibreCounter) {
                            console.debug('FormValidationSystem: texteLibreCounter element not found (expected if not on DMI tab)');
                        }
                    }
                }
            } catch (textareaError) {
                console.error('FormValidationSystem: Error setting up textarea counter:', textareaError);
            }
            
            if (initializedCount > 0) {
                console.log(`✅ FormValidationSystem: ${initializedCount} char counters initialized`);
            } else {
                console.log('ℹ️ FormValidationSystem: No form elements found on current page');
            }
        } catch (error) {
            console.error('FormValidationSystem: Error in initCharCounters:', error);
        }
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

        // DMI mode validation
        if (input.id === 'numeroDossierDMI') {
            this.validateDMIMode();
        }
    }

    initOptionalSection() {
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

    validateDMIMode() {
        const numeroDossierElement = document.getElementById('numeroDossierDMI');
        const submitBtn = document.getElementById('submitDMI');
        
        // Only validate if DMI elements are available
        if (numeroDossierElement && submitBtn) {
            const numeroDossier = numeroDossierElement.value.trim();
            submitBtn.disabled = !numeroDossier;
        }
    }

    initDMIValidation() {
        this.validateDMIMode();
    }

    // Méthodes de validation utilitaires
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateRequired(value) {
        return value && value.trim().length > 0;
    }

    validateLength(value, minLength, maxLength) {
        const length = value.length;
        return length >= minLength && length <= maxLength;
    }

    validatePhoneNumber(phone) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone);
    }

    // Validation des formulaires par mode
    validateNormalMode() {
        const numeroDossierElement = document.getElementById('numeroDossier');
        const nomPatientElement = document.getElementById('nomPatient');
        
        // Only validate if elements exist
        if (!numeroDossierElement || !nomPatientElement) {
            return { isValid: false, errors: ['Éléments du formulaire non trouvés'] };
        }
        
        const numeroDossier = numeroDossierElement.value.trim();
        const nomPatient = nomPatientElement.value.trim();

        const errors = [];

        if (!this.validateRequired(numeroDossier)) {
            errors.push('Le numéro de dossier est requis');
        }

        if (!this.validateRequired(nomPatient)) {
            errors.push('Le nom du patient est requis');
        }

        if (numeroDossier && !this.validateLength(numeroDossier, 1, 50)) {
            errors.push('Le numéro de dossier doit contenir entre 1 et 50 caractères');
        }

        if (nomPatient && !this.validateLength(nomPatient, 1, 50)) {
            errors.push('Le nom du patient doit contenir entre 1 et 50 caractères');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateTestMode() {
        const numeroDossierElement = document.getElementById('numeroDossierTest');
        const nomPatientElement = document.getElementById('nomPatientTest');
        
        // Only validate if elements exist
        if (!numeroDossierElement || !nomPatientElement) {
            return { isValid: false, errors: ['Éléments du formulaire de test non trouvés'] };
        }
        
        const numeroDossier = numeroDossierElement.value.trim();
        const nomPatient = nomPatientElement.value.trim();

        const errors = [];

        if (!this.validateRequired(numeroDossier)) {
            errors.push('Le numéro de dossier est requis pour le test');
        }

        if (!this.validateRequired(nomPatient)) {
            errors.push('Le nom du patient est requis pour le test');
        }

        if (numeroDossier && !this.validateLength(numeroDossier, 1, 50)) {
            errors.push('Le numéro de dossier doit contenir entre 1 et 50 caractères');
        }

        if (nomPatient && !this.validateLength(nomPatient, 1, 50)) {
            errors.push('Le nom du patient doit contenir entre 1 et 50 caractères');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateDMIModeForm() {
        const numeroDossierElement = document.getElementById('numeroDossierDMI');
        const nomPatientElement = document.getElementById('nomPatientDMI');
        const texteLibreElement = document.getElementById('texteLibre');
        
        // Only validate if elements exist
        if (!numeroDossierElement) {
            return { isValid: false, errors: ['Éléments du formulaire DMI non trouvés'] };
        }
        
        const numeroDossier = numeroDossierElement.value.trim();
        const nomPatient = nomPatientElement ? nomPatientElement.value.trim() : '';
        const texteLibre = texteLibreElement ? texteLibreElement.value.trim() : '';

        const errors = [];

        if (!this.validateRequired(numeroDossier)) {
            errors.push('Le numéro de dossier est requis pour le mode DMI');
        }

        if (numeroDossier && !this.validateLength(numeroDossier, 1, 50)) {
            errors.push('Le numéro de dossier doit contenir entre 1 et 50 caractères');
        }

        if (nomPatient && !this.validateLength(nomPatient, 0, 50)) {
            errors.push('Le nom du patient doit contenir maximum 50 caractères');
        }

        if (texteLibre && !this.validateLength(texteLibre, 0, 5000)) {
            errors.push('Le texte libre doit contenir maximum 5000 caractères');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Affichage des erreurs de validation
    showValidationErrors(errors, containerId = 'validationErrors') {
        let container = document.getElementById(containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'validation-errors';
            document.body.appendChild(container);
        }

        if (errors.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        const errorHtml = `
            <div class="error-list">
                <h4>Veuillez corriger les erreurs suivantes :</h4>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;

        container.innerHTML = errorHtml;
        container.style.display = 'block';

        // Scroll to errors
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideValidationErrors(containerId = 'validationErrors') {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidationSystem;
} else {
    window.FormValidationSystem = FormValidationSystem;
}