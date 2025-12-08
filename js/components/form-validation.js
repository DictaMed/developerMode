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
        const inputs = [
            { id: 'numeroDossier', counterId: 'numeroDossierCounter', maxLength: 50 },
            { id: 'nomPatient', counterId: 'nomPatientCounter', maxLength: 50 },
            { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter', maxLength: 50 },
            { id: 'nomPatientTest', counterId: 'nomPatientTestCounter', maxLength: 50 },
            { id: 'numeroDossierDMI', counterId: 'numeroDossierDMICounter', maxLength: 50 },
            { id: 'nomPatientDMI', counterId: 'nomPatientDMICounter', maxLength: 50 }
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

        // Textarea counter
        const texteLibre = document.getElementById('texteLibre');
        const texteLibreCounter = document.getElementById('texteLibreCounter');
        if (texteLibre && texteLibreCounter) {
            texteLibre.addEventListener('input', () => {
                texteLibreCounter.textContent = texteLibre.value.length;
            });
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
        const numeroDossier = document.getElementById('numeroDossier').value.trim();
        const nomPatient = document.getElementById('nomPatient').value.trim();

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
        const numeroDossier = document.getElementById('numeroDossierTest').value.trim();
        const nomPatient = document.getElementById('nomPatientTest').value.trim();

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
        const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
        const nomPatient = document.getElementById('nomPatientDMI').value.trim();
        const texteLibre = document.getElementById('texteLibre').value.trim();

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