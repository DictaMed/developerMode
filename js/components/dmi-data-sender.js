/**
 * DictaMed - Expéditeur de données DMI
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== DMI DATA SENDER =====
class DMIDataSender {
    constructor(photoManagementSystem) {
        this.photoManagementSystem = photoManagementSystem;
    }

    async send() {
        try {
            const submitBtn = document.getElementById('submitDMI');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';

            // Prepare payload
            const payload = await this.preparePayload();
            if (!payload) {
                if (window.notificationSystem) {
                    window.notificationSystem.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer les données DMI';
                return;
            }

            // Send to webhook
            const response = await fetch(window.APP_CONFIG.ENDPOINTS.dmi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (window.notificationSystem) {
                    window.notificationSystem.success('Vos données DMI ont été envoyées avec succès !', 'Envoi réussi');
                }
                
                if (confirm('Voulez-vous réinitialiser le formulaire DMI ?')) {
                    this.resetForm();
                }
            } else {
                const errorText = await response.text();
                if (window.notificationSystem) {
                    window.notificationSystem.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
                }
                console.error('Détails:', errorText);
            }

        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            if (window.notificationSystem) {
                window.notificationSystem.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
            }
        } finally {
            const submitBtn = document.getElementById('submitDMI');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données DMI';
        }
    }

    async preparePayload() {
        const numeroDossierElement = document.getElementById('numeroDossierDMI');
        const nomPatientElement = document.getElementById('nomPatientDMI');
        const texteLibreElement = document.getElementById('texteLibre');
        
        const numeroDossier = numeroDossierElement ? numeroDossierElement.value.trim() : '';
        const nomPatient = nomPatientElement ? nomPatientElement.value.trim() : '';
        const texteLibre = texteLibreElement ? texteLibreElement.value.trim() : '';

        if (!numeroDossier) {
            return null;
        }

        const payload = {
            mode: window.APP_CONFIG.MODES.DMI,
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            texte: texteLibre,
            photos: []
        };

        // Add Firebase user email if connected
        if (window.FirebaseAuthManager && window.FirebaseAuthManager.getCurrentUser && window.FirebaseAuthManager.getCurrentUser()) {
            const currentUser = window.FirebaseAuthManager.getCurrentUser();
            if (currentUser && currentUser.email) {
                payload.userEmail = currentUser.email;
            }
        }

        // Convert photos to Base64
        if (this.photoManagementSystem) {
            payload.photos = await this.photoManagementSystem.getPhotosAsBase64();
        }

        return payload;
    }

    resetForm() {
        document.getElementById('numeroDossierDMI').value = '';
        document.getElementById('nomPatientDMI').value = '';
        document.getElementById('texteLibre').value = '';
        
        const texteLibreCounter = document.getElementById('texteLibreCounter');
        if (texteLibreCounter) {
            texteLibreCounter.textContent = '0';
        }
        
        if (this.photoManagementSystem) {
            this.photoManagementSystem.clear();
        }
        
        const submitBtn = document.getElementById('submitDMI');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DMIDataSender;
} else {
    window.DMIDataSender = DMIDataSender;
}