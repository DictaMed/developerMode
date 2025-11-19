import { Toast, Loading } from './utils.js';
import { AutoSave, AuthManager } from './storage.js';
import { initTabs, initCharCounters, initOptionalSection, updateSectionCount, validateDMIMode, initPhotosUpload, initAudioRecorders, initializeMode } from './ui.js';
import { sendData, sendDmiData } from './api.js';

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de DictaMed...');

    // Initialiser le mode selon l'onglet actif
    initializeMode();

    // Initialiser les systèmes de base
    Toast.init();
    AutoSave.init();
    AuthManager.init();

    // Initialiser les composants
    initTabs();
    initCharCounters();
    initOptionalSection();
    initAudioRecorders();
    initPhotosUpload();
    updateSectionCount();
    validateDMIMode();

    // Événements pour les boutons d'envoi
    const submitNormalBtn = document.getElementById('submitNormal');
    const submitTestBtn = document.getElementById('submitTest');
    const submitDmiBtn = document.getElementById('submitDMI');

    if (submitNormalBtn) {
        submitNormalBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendData('normal').finally(() => Loading.hide());
        });
    }

    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendData('test').finally(() => Loading.hide());
        });
    }

    if (submitDmiBtn) {
        submitDmiBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendDmiData().finally(() => Loading.hide());
        });
    }

    // ===== MASQUER LE MESSAGE DE SWIPE APRÈS INTERACTION =====
    const tabsContainer = document.querySelector('.tabs-container');
    const swipeHint = document.querySelector('.swipe-hint');

    if (tabsContainer && swipeHint) {
        let hasScrolled = false;

        tabsContainer.addEventListener('scroll', () => {
            if (!hasScrolled) {
                hasScrolled = true;
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        });

        // Masquer également après 10 secondes si pas de scroll
        setTimeout(() => {
            if (!hasScrolled && swipeHint) {
                swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    swipeHint.style.display = 'none';
                }, 500);
            }
        }, 10000);
    }

    console.log('✅ DictaMed initialisé avec succès!');
});
