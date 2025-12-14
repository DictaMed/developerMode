/**
 * DictaMed - Text Input Handler v2.0
 * Composant pour saisir et envoyer du texte médical
 */

class TextInputHandler {
    constructor(multiInputHandler) {
        this.multiInputHandler = multiInputHandler;
        this.logger = window.logger?.createLogger('TextInputHandler') || console;
        this.containerSelector = null;
        this.isProcessing = false;
    }

    /**
     * Initialiser le composant avec un sélecteur de conteneur
     */
    init(containerSelector) {
        this.containerSelector = containerSelector;
        const container = document.querySelector(containerSelector);

        if (!container) {
            this.logger.warn(`Conteneur non trouvé: ${containerSelector}`);
            return;
        }

        this.setupUI(container);
        this.logger.info('✅ TextInputHandler initialisé');
    }

    /**
     * Créer l'interface utilisateur
     */
    setupUI(container) {
        // Vérifier si déjà initialisé
        if (container.dataset.textInputInitialized) {
            return;
        }

        const html = `
            <div class="text-input-section" data-text-input-handler>
                <div class="form-group">
                    <label for="textInput">Saisissez votre texte médical:</label>
                    <textarea
                        id="textInput"
                        class="form-control text-input-area"
                        placeholder="Entrez vos notes médicales ici (min 5 caractères, max 50000)..."
                        rows="8"
                    ></textarea>
                    <small class="form-text text-muted">
                        <span id="charCount">0</span> / 50000 caractères
                    </small>
                </div>

                <div class="button-group">
                    <button
                        id="clearTextBtn"
                        class="btn btn-secondary"
                        type="button"
                    >
                        🗑️ Effacer
                    </button>
                    <button
                        id="sendTextBtn"
                        class="btn btn-primary"
                        type="button"
                    >
                        📤 Envoyer
                    </button>
                </div>

                <div id="textStatus" class="alert d-none" role="alert"></div>
            </div>
        `;

        container.innerHTML = html;
        container.dataset.textInputInitialized = 'true';

        this.attachEventListeners(container);
    }

    /**
     * Attacher les événements
     */
    attachEventListeners(container) {
        const textInput = container.querySelector('#textInput');
        const charCount = container.querySelector('#charCount');
        const clearBtn = container.querySelector('#clearTextBtn');
        const sendBtn = container.querySelector('#sendTextBtn');
        const statusDiv = container.querySelector('#textStatus');

        // Compteur de caractères
        if (textInput && charCount) {
            textInput.addEventListener('input', () => {
                charCount.textContent = textInput.value.length;

                // Validation en temps réel
                const length = textInput.value.trim().length;
                if (length < 5) {
                    sendBtn.disabled = true;
                    textInput.classList.add('is-invalid');
                } else if (length > 50000) {
                    sendBtn.disabled = true;
                    textInput.classList.add('is-invalid');
                } else {
                    sendBtn.disabled = false;
                    textInput.classList.remove('is-invalid');
                }
            });
        }

        // Bouton effacer
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (textInput) {
                    textInput.value = '';
                    charCount.textContent = '0';
                    sendBtn.disabled = true;
                    statusDiv.classList.add('d-none');
                }
            });
        }

        // Bouton envoyer
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.handleSendText(textInput, statusDiv);
            });
        }

        // Envoyer avec Ctrl+Enter
        if (textInput) {
            textInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.handleSendText(textInput, statusDiv);
                }
            });
        }
    }

    /**
     * Traiter l'envoi du texte
     */
    async handleSendText(textInput, statusDiv) {
        if (this.isProcessing) {
            this.logger.warn('Envoi déjà en cours...');
            return;
        }

        const text = textInput.value.trim();

        // Validation
        if (!text) {
            this.showStatus('❌ Veuillez entrer du texte', 'danger', statusDiv);
            return;
        }

        if (text.length < 5) {
            this.showStatus('❌ Texte trop court (minimum 5 caractères)', 'danger', statusDiv);
            return;
        }

        if (text.length > 50000) {
            this.showStatus('❌ Texte trop long (maximum 50000 caractères)', 'danger', statusDiv);
            return;
        }

        this.isProcessing = true;
        this.showStatus('⏳ Envoi du texte...', 'info', statusDiv);

        try {
            // Déterminer le mode
            const currentMode = this.getCurrentMode();

            // Envoyer via MultiInputHandler
            const result = await this.multiInputHandler.handleText(text, currentMode);

            this.showStatus('✅ Texte envoyé avec succès!', 'success', statusDiv);

            // Vider le formulaire
            textInput.value = '';
            textInput.parentElement.querySelector('#charCount').textContent = '0';

            this.logger.info('✅ Texte traité et envoyé', result);

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'envoi du texte:', error);
            this.showStatus(
                `❌ Erreur: ${error.message}`,
                'danger',
                statusDiv
            );
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Afficher un message de statut
     */
    showStatus(message, type, statusDiv) {
        statusDiv.innerHTML = message;
        statusDiv.className = `alert alert-${type}`;
        statusDiv.classList.remove('d-none');

        // Auto-masquer les messages de succès/info après 5s
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusDiv.classList.add('d-none');
            }, 5000);
        }
    }

    /**
     * Déterminer le mode actuel
     */
    getCurrentMode() {
        // Chercher l'indicateur de mode dans le DOM
        const modeIndicator = document.querySelector('[data-current-mode]');
        if (modeIndicator) {
            return modeIndicator.dataset.currentMode;
        }

        // Fallback sur le mode par défaut
        return window.APP_CONFIG?.MODES?.NORMAL || 'normal';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextInputHandler;
} else {
    window.TextInputHandler = TextInputHandler;
}
