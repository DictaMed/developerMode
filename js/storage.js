import { appState } from './state.js';
import { Toast } from './utils.js';
import { CONFIG } from './config.js';

// ===== AUTO-SAVE AVEC LOCALSTORAGE =====
export const AutoSave = {
    indicator: null,
    debounceTimer: null,

    init() {
        // Créer l'indicateur
        if (!this.indicator) {
            this.indicator = document.createElement('div');
            this.indicator.className = 'autosave-indicator';
            this.indicator.innerHTML = '<div class="icon"></div><span class="text">Sauvegarde automatique</span>';
            document.body.appendChild(this.indicator);
        }

        // Restaurer les données sauvegardées
        this.restore();

        // Démarrer l'auto-save
        this.startAutoSave();
    },

    save() {
        try {
            const mode = appState.currentMode;
            const data = {
                mode,
                timestamp: Date.now(),
                forms: {}
            };

            // Sauvegarder UNIQUEMENT l'authentification en mode normal
            if (mode === 'normal') {
                data.forms = {
                    username: document.getElementById('username')?.value || '',
                    accessCode: document.getElementById('accessCode')?.value || ''
                };
            }
            // Ne rien sauvegarder en mode test

            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTOSAVE, JSON.stringify(data));
            appState.lastSaveTime = Date.now();

            this.showIndicator('saved');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },

    restore() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTOSAVE);
            if (!saved) return;

            const data = JSON.parse(saved);

            // Vérifier si les données ne sont pas trop anciennes (24h)
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > dayInMs) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTOSAVE);
                return;
            }

            // Restaurer UNIQUEMENT l'authentification en mode normal
            if (data.mode === 'normal' && document.getElementById('username')) {
                Object.entries(data.forms).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element && value) {
                        element.value = value;
                        element.dispatchEvent(new Event('input'));
                    }
                });

                Toast.info('Identifiants restaurés', 'Reprise de session');
            }
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        }
    },

    startAutoSave() {
        // Sauvegarder toutes les 30 secondes
        appState.autoSaveInterval = setInterval(() => {
            this.save();
        }, 30000);

        // Sauvegarder UNIQUEMENT pour les champs d'authentification
        const authInputs = document.querySelectorAll('#username, #accessCode');
        authInputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.showIndicator('saving');
                this.debounceTimer = setTimeout(() => {
                    this.save();
                }, 2000);
            });
        });
    },

    showIndicator(state) {
        if (!this.indicator) return;

        this.indicator.className = 'autosave-indicator show ' + state;

        setTimeout(() => {
            this.indicator.classList.remove('show');
        }, 2000);
    },

    clear() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTOSAVE);
    }
};

// ===== GESTION DE LA SAUVEGARDE DES DONNÉES D'AUTHENTIFICATION =====
export const AuthManager = {
    STORAGE_KEY: CONFIG.STORAGE_KEYS.AUTH,

    // Sauvegarder les identifiants
    saveCredentials() {
        const username = document.getElementById('username')?.value.trim();
        const accessCode = document.getElementById('accessCode')?.value.trim();
        const rememberAuth = document.getElementById('rememberAuth')?.checked;

        if (rememberAuth && username && accessCode) {
            const credentials = {
                username: username,
                accessCode: accessCode,
                savedAt: new Date().toISOString()
            };

            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));
                Toast.success('Vos informations d\'authentification ont été enregistrées.', 'Sauvegarde réussie');
                console.log('✅ Identifiants sauvegardés');
            } catch (e) {
                console.error('Erreur lors de la sauvegarde:', e);
                Toast.error('Impossible de sauvegarder vos identifiants.', 'Erreur');
            }
        } else if (!rememberAuth) {
            // Si la case est décochée, supprimer les identifiants sauvegardés
            this.clearCredentials();
        }
    },

    // Restaurer les identifiants au chargement
    restoreCredentials() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const credentials = JSON.parse(saved);
                const usernameInput = document.getElementById('username');
                const accessCodeInput = document.getElementById('accessCode');
                const rememberAuthCheckbox = document.getElementById('rememberAuth');

                if (usernameInput && accessCodeInput && rememberAuthCheckbox) {
                    usernameInput.value = credentials.username || '';
                    accessCodeInput.value = credentials.accessCode || '';
                    rememberAuthCheckbox.checked = true;

                    console.log('✅ Identifiants restaurés');
                }
            }
        } catch (e) {
            console.error('Erreur lors de la restauration:', e);
        }
    },

    // Effacer les identifiants
    clearCredentials() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ Identifiants effacés');
        } catch (e) {
            console.error('Erreur lors de l\'effacement:', e);
        }
    },

    // Initialiser les event listeners
    init() {
        // Restaurer au chargement
        this.restoreCredentials();

        // Sauvegarder quand la checkbox change
        const rememberAuthCheckbox = document.getElementById('rememberAuth');
        if (rememberAuthCheckbox) {
            rememberAuthCheckbox.addEventListener('change', () => {
                if (rememberAuthCheckbox.checked) {
                    this.saveCredentials();
                } else {
                    this.clearCredentials();
                    Toast.info('Vos identifiants ne seront plus enregistrés.', 'Information');
                }
            });
        }

        // Sauvegarder quand les champs changent (si checkbox cochée)
        const usernameInput = document.getElementById('username');
        const accessCodeInput = document.getElementById('accessCode');

        [usernameInput, accessCodeInput].forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    const rememberAuth = document.getElementById('rememberAuth')?.checked;
                    if (rememberAuth) {
                        this.saveCredentials();
                    }
                });
            }
        });
    }
};
