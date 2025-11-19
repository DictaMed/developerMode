import { appState } from './state.js';
import { CONFIG } from './config.js';
import { Toast, Loading, fileToBase64 } from './utils.js';
import { showSendSummary, resetForm, resetDmiForm, updatePhotosPreview, validateDMIMode } from './ui.js';
import { AutoSave } from './storage.js';

// ===== ENVOI DES DONNÉES AMÉLIORÉ =====
export async function sendData(mode) {
    try {
        const submitBtn = mode === 'normal'
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');

        if (!submitBtn) {
            console.error('Bouton d\'envoi non trouvé pour le mode:', mode);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Afficher le récapitulatif avant envoi
        const summary = showSendSummary(mode);
        console.log('📋', summary);
        Toast.info('Vérification des données avant envoi...', 'Préparation', 2000);

        // Préparer le payload avec gestion d'erreur améliorée
        const payload = await preparePayload(mode);

        if (!payload) {
            const errorMsg = mode === 'normal'
                ? 'Veuillez remplir tous les champs obligatoires (identifiant, code d\'accès, numéro de dossier et nom du patient) et enregistrer au moins une section.'
                : 'Veuillez remplir le numéro de dossier et le nom du patient, et enregistrer au moins une section.';

            Toast.warning(errorMsg, 'Champs manquants');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        // Vérifier qu'il y a des sections enregistrées
        const hasRecordings = Object.keys(payload.sections || {}).length > 0;
        if (!hasRecordings) {
            Toast.warning('Veuillez enregistrer au moins une section avant d\'envoyer.', 'Aucun enregistrement');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        // Déterminer l'endpoint
        const endpoint = mode === 'normal'
            ? CONFIG.API_ENDPOINTS.NORMAL
            : CONFIG.API_ENDPOINTS.TEST;

        console.log('🔄 Envoi des données vers:', endpoint);
        console.log('📊 Payload:', {
            mode: payload.mode,
            patient: payload.NumeroDeDossier ? `${payload.NumeroDeDossier} - ${payload.NomDuPatient || 'N/A'}` : 'N/A',
            sectionsCount: Object.keys(payload.sections || {}).length
        });

        // Mettre à jour le statut
        submitBtn.textContent = 'Transmission en cours...';

        // Envoyer les données avec timeout et retry
        const response = await Promise.race([
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout après 30 secondes')), 30000)
            )
        ]);

        console.log('📡 Réponse reçue:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (response.ok) {
            Toast.success('Votre dossier a été envoyé et traité avec succès !', 'Envoi réussi');

            if (mode === 'test') {
                // Mode Test : Afficher le Google Sheet et notification
                const googleSheetCard = document.getElementById('googleSheetCard');
                if (googleSheetCard) {
                    googleSheetCard.style.display = 'block';
                    // Faire défiler vers la carte Google Sheet
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Notification pour consulter le Google Sheet
                setTimeout(() => {
                    Toast.info('Consultez le Google Sheet pour voir vos données transcrites en temps réel.', 'Résultats disponibles', 8000);
                }, 1000);

                // NE PAS réinitialiser en mode test pour permettre de voir les résultats
            } else {
                // Mode Normal : Réinitialiser automatiquement
                resetForm(mode);
                AutoSave.clear();
                Toast.success('Formulaire réinitialisé pour un nouveau patient.', 'Prêt', 3000);
            }
        } else {
            // Gérer les erreurs HTTP
            let errorMessage = `Le serveur a renvoyé une erreur (${response.status})`;

            try {
                const errorText = await response.text();
                console.error('Détails de l\'erreur:', errorText);

                if (response.status === 413) {
                    errorMessage = 'Les fichiers audio sont trop volumineux. Veuillez enregistrer des sections plus courtes.';
                } else if (response.status === 400) {
                    errorMessage = 'Les données envoyées ne sont pas valides. Vérifiez vos enregistrements.';
                } else if (response.status >= 500) {
                    errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
                }
            } catch (e) {
                console.error('Erreur lors de la lecture de la réponse:', e);
            }

            Toast.error(errorMessage, 'Erreur d\'envoi');
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);

        // Messages d'erreur plus spécifiques
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet et réessayez.', 'Erreur réseau');
        } else if (error.message.includes('Timeout')) {
            Toast.error('La connexion a pris trop de temps. Vérifiez votre connexion et réessayez.', 'Timeout');
        } else {
            Toast.error(`Une erreur inattendue s'est produite: ${error.message}`, 'Erreur technique');
        }
    } finally {
        const submitBtn = mode === 'normal'
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
        }
    }
}

async function preparePayload(mode) {
    const payload = {
        mode: mode,
        recordedAt: new Date().toISOString(),
        sections: {}
    };

    try {
        if (mode === 'normal') {
            // Mode Normal - Validation complète
            const username = document.getElementById('username')?.value.trim();
            const accessCode = document.getElementById('accessCode')?.value.trim();
            const numeroDossier = document.getElementById('numeroDossier')?.value.trim();
            const nomPatient = document.getElementById('nomPatient')?.value.trim();

            // Validation des champs obligatoires
            const missingFields = [];
            if (!username) missingFields.push('identifiant');
            if (!accessCode) missingFields.push('code d\'accès');
            if (!numeroDossier) missingFields.push('numéro de dossier');
            if (!nomPatient) missingFields.push('nom du patient');

            if (missingFields.length > 0) {
                console.warn('Champs manquants:', missingFields);
                return null;
            }

            payload.username = username;
            payload.accessCode = accessCode;
            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;

            // Collecter les enregistrements avec gestion d'erreur
            const sections = CONFIG.SECTIONS.NORMAL;
            let index = 0;
            let hasValidRecording = false;

            for (const sectionId of sections) {
                const recorder = appState.audioRecorders.get(sectionId);
                if (recorder && recorder.hasRecording()) {
                    try {
                        // Validation de l'enregistrement
                        const validation = recorder.validateRecording();
                        if (!validation.valid) {
                            console.warn(`Section ${sectionId} invalide:`, validation.error);
                            continue;
                        }

                        index++;
                        const base64 = await recorder.getBase64Audio();
                        const format = recorder.getAudioFormat();
                        const mimeType = recorder.getMimeType();

                        // Vérifications de sécurité supplémentaires
                        if (!base64 || base64.length === 0) {
                            console.warn(`Enregistrement vide pour la section: ${sectionId}`);
                            continue;
                        }

                        payload.sections[sectionId] = {
                            audioBase64: base64,
                            fileName: `msgVocal${index}.${format}`,
                            mimeType: mimeType,
                            format: format,
                            sectionName: sectionId,
                            fileSize: recorder.audioBlob.size
                        };

                        hasValidRecording = true;
                        console.log(`✅ Section ${sectionId} préparée (${format}, ${(base64.length / 1024).toFixed(1)}KB, ${(recorder.audioBlob.size / 1024).toFixed(1)}KB)`);
                    } catch (sectionError) {
                        console.error(`Erreur lors de la préparation de la section ${sectionId}:`, sectionError);
                        // Continuer avec les autres sections
                    }
                }
            }

            if (!hasValidRecording) {
                console.warn('Aucune section enregistrée trouvée');
                return null;
            }

        } else {
            // Mode Test - Validation simplifiée
            const numeroDossier = document.getElementById('numeroDossierTest')?.value.trim();
            const nomPatient = document.getElementById('nomPatientTest')?.value.trim();

            const missingFields = [];
            if (!numeroDossier) missingFields.push('numéro de dossier');
            if (!nomPatient) missingFields.push('nom du patient');

            if (missingFields.length > 0) {
                console.warn('Champs manquants en mode test:', missingFields);
                return null;
            }

            payload.NumeroDeDossier = numeroDossier;
            payload.NomDuPatient = nomPatient;

            // Collecter les enregistrements avec gestion d'erreur
            const sections = CONFIG.SECTIONS.TEST;
            let index = 0;
            let hasValidRecording = false;

            for (const sectionId of sections) {
                const recorder = appState.audioRecorders.get(sectionId);
                if (recorder && recorder.hasRecording()) {
                    try {
                        // Validation de l'enregistrement
                        const validation = recorder.validateRecording();
                        if (!validation.valid) {
                            console.warn(`Section ${sectionId} invalide:`, validation.error);
                            continue;
                        }

                        index++;
                        const base64 = await recorder.getBase64Audio();
                        const format = recorder.getAudioFormat();
                        const mimeType = recorder.getMimeType();

                        // Vérifications de sécurité supplémentaires
                        if (!base64 || base64.length === 0) {
                            console.warn(`Enregistrement vide pour la section: ${sectionId}`);
                            continue;
                        }

                        payload.sections[sectionId] = {
                            audioBase64: base64,
                            fileName: `msgVocal${index}.${format}`,
                            mimeType: mimeType,
                            format: format,
                            sectionName: sectionId,
                            fileSize: recorder.audioBlob.size
                        };

                        hasValidRecording = true;
                        console.log(`✅ Section ${sectionId} préparée (${format}, ${(base64.length / 1024).toFixed(1)}KB, ${(recorder.audioBlob.size / 1024).toFixed(1)}KB)`);
                    } catch (sectionError) {
                        console.error(`Erreur lors de la préparation de la section ${sectionId}:`, sectionError);
                        // Continuer avec les autres sections
                    }
                }
            }

            if (!hasValidRecording) {
                console.warn('Aucune section enregistrée trouvée en mode test');
                return null;
            }
        }

        // Validation finale du payload
        if (Object.keys(payload.sections).length === 0) {
            console.warn('Payload créé mais sans sections valides');
            return null;
        }

        console.log(`🎯 Payload préparé pour le mode ${mode}:`, {
            patient: `${payload.NumeroDeDossier} - ${payload.NomDuPatient}`,
            sections: Object.keys(payload.sections).length,
            timestamp: payload.recordedAt
        });

        return payload;

    } catch (error) {
        console.error('Erreur lors de la préparation du payload:', error);
        return null;
    }
}

// Envoi des données du mode DMI
export async function sendDmiData() {
    try {
        const submitBtn = document.getElementById('submitDMI');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Préparer le payload
        const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
        const nomPatient = document.getElementById('nomPatientDMI').value.trim();
        const texteLibre = document.getElementById('texteLibre').value.trim();

        if (!numeroDossier) {
            Toast.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données DMI';
            return;
        }

        const payload = {
            mode: 'dmi',
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            texte: texteLibre,
            photos: []
        };

        // Convertir les photos en Base64
        for (const file of appState.uploadedPhotos) {
            const base64 = await fileToBase64(file);
            payload.photos.push({
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                base64: base64
            });
        }

        // Envoyer au webhook du mode test (same as mode test)
        const endpoint = CONFIG.API_ENDPOINTS.TEST;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            Toast.success('Vos données DMI ont été envoyées avec succès !', 'Envoi réussi');

            // Réinitialiser le formulaire si souhaité
            if (confirm('Voulez-vous réinitialiser le formulaire DMI ?')) {
                resetDmiForm();
            }
        } else {
            const errorText = await response.text();
            Toast.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
            console.error('Détails:', errorText);
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
    } finally {
        const submitBtn = document.getElementById('submitDMI');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer les données DMI';
    }
}
