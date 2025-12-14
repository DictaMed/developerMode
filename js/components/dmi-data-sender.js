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
            // Check authentication - DMI mode now requires authentication
            const currentUser = window.FirebaseAuthManager?.getCurrentUser?.() || null;
            if (!currentUser) {
                console.error('❌ DMIDataSender: User not authenticated');
                if (window.notificationSystem) {
                    window.notificationSystem.error('Vous devez être connecté pour accéder au mode DMI', 'Authentification requise');
                }
                return;
            }

            const submitBtn = document.getElementById('submitDMI');
            if (!submitBtn) {
                console.error('❌ DMIDataSender: submitBtn element not found');
                return;
            }

            console.log('📤 DMI: Starting data send...');
            console.log('   Current user:', currentUser.email);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Envoi en cours...';

            // Prepare payload
            const payload = await this.preparePayload();
            if (!payload) {
                console.warn('⚠️ DMI: Payload validation failed - missing required fields');
                if (window.notificationSystem) {
                    window.notificationSystem.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer les données DMI';
                return;
            }

            console.log('✅ DMI: Payload prepared, sending to server...');

            // 🔑 Envoyer CHAQUE TYPE DE DONNÉES à son webhook respectif
            const results = {
                text: null,
                photos: null
            };

            // 1. Envoyer le texte (si présent)
            if (payload.texte && payload.texte.trim().length > 0) {
                console.log('📤 DMI: Sending text data...');
                const textPayload = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || '',
                    mode: window.APP_CONFIG.MODES.DMI,
                    fileType: 'text',
                    timestamp: new Date().toISOString(),
                    numeroDossier: payload.NumeroDeDossier,
                    nomPatient: payload.NomDuPatient,
                    texte: payload.texte,
                    inputType: 'text'
                };

                const textEndpoint = window.APP_CONFIG.WEBHOOK_ENDPOINTS?.text;
                if (!textEndpoint) {
                    throw new Error('❌ Webhook endpoint not configured for text. Configure it in js/config/webhooks-config.js');
                }

                results.text = await this.sendToEndpoint(textEndpoint, textPayload, 'text');
            }

            // 2. Envoyer les photos (si présentes)
            if (payload.photos && payload.photos.length > 0) {
                console.log(`📤 DMI: Sending ${payload.photos.length} photo(s)...`);

                const photoEndpoint = window.APP_CONFIG.WEBHOOK_ENDPOINTS?.photo;
                if (!photoEndpoint) {
                    throw new Error('❌ Webhook endpoint not configured for photos. Configure it in js/config/webhooks-config.js');
                }

                for (let i = 0; i < payload.photos.length; i++) {
                    const photoPayload = {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName || '',
                        mode: window.APP_CONFIG.MODES.DMI,
                        fileType: 'photo',
                        timestamp: new Date().toISOString(),
                        numeroDossier: payload.NumeroDeDossier,
                        nomPatient: payload.NomDuPatient,
                        photo: payload.photos[i],
                        photoIndex: i + 1,
                        totalPhotos: payload.photos.length,
                        inputType: 'photo'
                    };

                    results.photos = await this.sendToEndpoint(photoEndpoint, photoPayload, `photo ${i + 1}`);
                }
            }

            // Vérifier que au moins un type a été envoyé
            const hasSuccess = results.text || results.photos;
            if (hasSuccess) {
                if (window.notificationSystem) {
                    window.notificationSystem.success('Vos données DMI ont été envoyées avec succès !', 'Envoi réussi');
                }

                if (confirm('Voulez-vous réinitialiser le formulaire DMI ?')) {
                    this.resetForm();
                }
            } else {
                if (window.notificationSystem) {
                    window.notificationSystem.warning('Aucune donnée à envoyer (texte ou photos requis).', 'Validation');
                }
            }

        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            if (window.notificationSystem) {
                window.notificationSystem.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
            }
        } finally {
            const submitBtn = document.getElementById('submitDMI');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer les données DMI';
            }
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
            inputType: 'text', // ✅ Specify data type: text (primary input)
            texte: texteLibre,
            photos: []
        };

        // Add Firebase user email (always available since authentication is now required)
        if (window.FirebaseAuthManager && window.FirebaseAuthManager.getCurrentUser) {
            const currentUser = window.FirebaseAuthManager.getCurrentUser();
            if (currentUser && currentUser.email) {
                payload.userEmail = currentUser.email;
                console.log('   User email added to payload:', currentUser.email);
            }
        }

        // Convert photos to Base64
        if (this.photoManagementSystem) {
            const photosData = await this.photoManagementSystem.getPhotosAsBase64();
            // ✅ Add type information for each photo
            payload.photos = photosData.map((photo, index) => ({
                data: photo,
                inputType: 'photo', // Specify data type: photo
                index: index,
                timestamp: new Date().toISOString()
            }));

            if (payload.photos.length > 0) {
                console.log(`   ${payload.photos.length} photos added with inputType: 'photo'`);
            }
        }

        // Log payload structure for debugging
        console.log('   Payload inputTypes:', {
            primaryInput: payload.inputType,
            hasText: !!payload.texte,
            photoCount: payload.photos.length,
            photoInputType: payload.photos.length > 0 ? 'photo' : 'none'
        });

        return payload;
    }

    /**
     * Envoyer les données à un webhook spécifique
     * @param {string} endpoint - URL du webhook
     * @param {object} payload - Données à envoyer
     * @param {string} dataType - Type de données (pour logging)
     */
    async sendToEndpoint(endpoint, payload, dataType = 'data') {
        try {
            console.log(`📤 DMI: Sending ${dataType} to ${endpoint.substring(0, 60)}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                window.APP_CONFIG.API_TIMEOUT || 30000
            );

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ DMI ${dataType} error: HTTP ${response.status}`, errorText);

                if (response.status === 404) {
                    throw new Error(`Webhook for ${dataType} not configured (404). Check js/config/webhooks-config.js`);
                } else if (response.status === 500) {
                    throw new Error(`Server error processing ${dataType} (500). Check n8n logs.`);
                } else {
                    throw new Error(`HTTP ${response.status} while sending ${dataType}`);
                }
            }

            const result = await response.json();
            console.log(`✅ DMI ${dataType} sent successfully:`, result);
            return result;

        } catch (error) {
            console.error(`❌ Error sending ${dataType}:`, error.message);
            throw error;
        }
    }

    resetForm() {
        const numeroDossierElement = document.getElementById('numeroDossierDMI');
        const nomPatientElement = document.getElementById('nomPatientDMI');
        const texteLibreElement = document.getElementById('texteLibre');

        if (numeroDossierElement) numeroDossierElement.value = '';
        if (nomPatientElement) nomPatientElement.value = '';
        if (texteLibreElement) texteLibreElement.value = '';

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