import { appState } from './state.js';
import { CONFIG } from './config.js';
import { Toast } from './utils.js';
import { AudioRecorder } from './audio.js';

// ===== NAVIGATION PAR ONGLETS =====
export function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

export function switchTab(tabId) {
    // Désactiver tous les onglets et contenus
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activer l'onglet et le contenu sélectionnés
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');

    // Mettre à jour le mode actuel
    if (tabId === 'mode-normal') {
        appState.currentMode = 'normal';
    } else if (tabId === 'mode-test') {
        appState.currentMode = 'test';
    }
}

// ===== COMPTEUR DE CARACTÈRES =====
export function initCharCounters() {
    const inputs = [
        { id: 'numeroDossier', counterId: 'numeroDossierCounter' },
        { id: 'nomPatient', counterId: 'nomPatientCounter' },
        { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter' },
        { id: 'nomPatientTest', counterId: 'nomPatientTestCounter' },
        { id: 'numeroDossierDMI', counterId: 'numeroDossierDMICounter' },
        { id: 'nomPatientDMI', counterId: 'nomPatientDMICounter' }
    ];

    inputs.forEach(({ id, counterId }) => {
        const input = document.getElementById(id);
        const counter = document.getElementById(counterId);

        if (input && counter) {
            input.addEventListener('input', () => {
                const length = input.value.length;
                const maxLength = input.maxLength;
                counter.textContent = `${length}/${maxLength}`;

                // Changer la couleur selon le niveau
                counter.classList.remove('warning', 'danger');
                if (length >= maxLength) {
                    counter.classList.add('danger');
                } else if (length >= maxLength * 0.8) {
                    counter.classList.add('warning');
                }

                // Validation pour le mode DMI
                if (id === 'numeroDossierDMI') {
                    validateDMIMode();
                }
            });
        }
    });

    // Compteur pour le textarea
    const texteLibre = document.getElementById('texteLibre');
    const texteLibreCounter = document.getElementById('texteLibreCounter');
    if (texteLibre && texteLibreCounter) {
        texteLibre.addEventListener('input', () => {
            texteLibreCounter.textContent = texteLibre.value.length;
        });
    }
}

// ===== PARTIE 4 OPTIONNELLE =====
export function initOptionalSection() {
    const toggleBtn = document.getElementById('togglePartie4');
    const partie4 = document.querySelector('[data-section="partie4"]');

    if (toggleBtn && partie4) {
        toggleBtn.addEventListener('click', () => {
            partie4.classList.toggle('hidden');
            toggleBtn.textContent = partie4.classList.contains('hidden')
                ? 'Afficher Partie 4 (optionnelle)'
                : 'Masquer Partie 4';
        });
    }
}

// ===== COMPTEUR DE SECTIONS =====
export function updateSectionCount() {
    const mode = appState.currentMode;
    const sections = CONFIG.SECTIONS[mode === 'normal' ? 'NORMAL' : 'TEST'];
    let count = 0;

    sections.forEach(sectionId => {
        const recorder = appState.audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            count++;
        }
    });

    // Mettre à jour l'affichage
    const countElements = document.querySelectorAll('.sections-count');
    countElements.forEach(el => {
        if (el.closest(`#mode-${mode}`)) {
            el.textContent = `${count} section(s) enregistrée(s)`;
        }
    });

    // Activer/désactiver le bouton d'envoi
    const submitBtn = mode === 'normal'
        ? document.getElementById('submitNormal')
        : document.getElementById('submitTest');

    if (submitBtn) {
        submitBtn.disabled = count === 0;
    }
}

// ===== RÉCAPITULATIF AVANT ENVOI =====
export function showSendSummary(mode) {
    const isTest = mode === 'test';
    const numeroDossier = document.getElementById(isTest ? 'numeroDossierTest' : 'numeroDossier').value;
    const nomPatient = document.getElementById(isTest ? 'nomPatientTest' : 'nomPatient').value;
    const sections = isTest ? CONFIG.SECTIONS.TEST : CONFIG.SECTIONS.NORMAL;

    let summary = `📋 Récapitulatif avant envoi (${mode.toUpperCase()}):\n\n`;
    summary += `👤 Patient: ${numeroDossier} - ${nomPatient}\n`;
    summary += `📊 Sections enregistrées:\n`;

    let sectionCount = 0;
    sections.forEach(sectionId => {
        const recorder = appState.audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            const validation = recorder.validateRecording();
            sectionCount++;
            const size = recorder.audioBlob ? (recorder.audioBlob.size / 1024).toFixed(1) : '0';
            summary += `   ✅ ${sectionId}: ${size}KB ${validation.valid ? '' : `(⚠️ ${validation.error})`}\n`;
        }
    });

    if (sectionCount === 0) {
        summary += '   ❌ Aucune section enregistrée\n';
    }

    summary += `\n🎯 ${sectionCount} section(s) prête(s) pour l'envoi`;

    return summary;
}

// ===== MODE SAISIE TEXTE =====

// Validation du mode DMI
export function validateDMIMode() {
    const numeroDossier = document.getElementById('numeroDossierDMI').value.trim();
    const submitBtn = document.getElementById('submitDMI');

    if (submitBtn) {
        submitBtn.disabled = !numeroDossier;
    }
}

// Gestion de l'upload de photos
export function initPhotosUpload() {
    const photosInput = document.getElementById('photosUpload');
    const photosPreview = document.getElementById('photosPreview');

    if (!photosInput || !photosPreview) return;

    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);

        // Limiter à 5 photos
        if (appState.uploadedPhotos.length + files.length > CONFIG.LIMITS.MAX_PHOTOS) {
            Toast.warning(`Vous avez atteint la limite de ${CONFIG.LIMITS.MAX_PHOTOS} photos. Supprimez des photos existantes pour en ajouter de nouvelles.`, 'Limite atteinte');
            return;
        }

        // Vérifier la taille et le format de chaque fichier
        files.forEach(file => {
            // Vérifier le format
            if (!file.type.startsWith('image/')) {
                Toast.error(`Le fichier "${file.name}" n'est pas une image valide.`, 'Format non supporté');
                return;
            }

            // Vérifier la taille (max 10MB)
            if (file.size > CONFIG.LIMITS.MAX_PHOTO_SIZE) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                Toast.error(`Le fichier "${file.name}" est trop volumineux (${sizeMB} MB). Limite : 10 MB.`, 'Fichier trop lourd');
                return;
            }

            // Ajouter la photo
            appState.uploadedPhotos.push(file);
        });

        // Réinitialiser l'input
        photosInput.value = '';

        // Mettre à jour la prévisualisation
        updatePhotosPreview();
    });
}

// Mettre à jour la prévisualisation des photos
export function updatePhotosPreview() {
    const photosPreview = document.getElementById('photosPreview');
    if (!photosPreview) return;

    photosPreview.innerHTML = '';

    appState.uploadedPhotos.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';

            photoItem.innerHTML = `
                <img src="${e.target.result}" alt="Photo ${index + 1}">
                <button class="photo-item-remove" data-index="${index}" title="Supprimer">×</button>
                <div class="photo-item-info">${file.name}</div>
            `;

            photosPreview.appendChild(photoItem);

            // Ajouter l'événement de suppression
            const removeBtn = photoItem.querySelector('.photo-item-remove');
            removeBtn.addEventListener('click', () => {
                appState.uploadedPhotos.splice(index, 1);
                updatePhotosPreview();
            });
        };

        reader.readAsDataURL(file);
    });
}

export function resetForm(mode) {
    if (mode === 'normal') {
        document.getElementById('username').value = '';
        document.getElementById('accessCode').value = '';
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';

        // Réinitialiser les compteurs de caractères
        const counters = [
            { input: 'numeroDossier', counter: 'numeroDossierCounter' },
            { input: 'nomPatient', counter: 'nomPatientCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });

        const sections = CONFIG.SECTIONS.NORMAL;
        sections.forEach(sectionId => {
            const recorder = appState.audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    } else {
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';

        // Réinitialiser les compteurs de caractères
        const counters = [
            { input: 'numeroDossierTest', counter: 'numeroDossierTestCounter' },
            { input: 'nomPatientTest', counter: 'nomPatientTestCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });

        const sections = CONFIG.SECTIONS.TEST;
        sections.forEach(sectionId => {
            const recorder = appState.audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    }

    updateSectionCount();
}

export function resetDmiForm() {
    document.getElementById('numeroDossierDMI').value = '';
    document.getElementById('nomPatientDMI').value = '';
    document.getElementById('texteLibre').value = '';
    document.getElementById('texteLibreCounter').textContent = '0';
    appState.uploadedPhotos = [];
    updatePhotosPreview();
    validateDMIMode();
}

export function initAudioRecorders() {
    const recordingSections = document.querySelectorAll('.recording-section');

    recordingSections.forEach(section => {
        const sectionId = section.getAttribute('data-section');
        const recorder = new AudioRecorder(section);
        appState.audioRecorders.set(sectionId, recorder);
    });
}

export function initializeMode() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        if (tabId === 'mode-normal') {
            appState.currentMode = 'normal';
        } else if (tabId === 'mode-test') {
            appState.currentMode = 'test';
        }
    }
    console.log('Mode initial:', appState.currentMode);
}
