/**
 * DictaMed - Photo Input Handler v2.0
 * Composant pour uploader et envoyer des photos médicales
 */

class PhotoInputHandler {
    constructor(multiInputHandler) {
        this.multiInputHandler = multiInputHandler;
        this.logger = window.logger?.createLogger('PhotoInputHandler') || console;
        this.containerSelector = null;
        this.isProcessing = false;
        this.selectedFile = null;
        this.previewUrl = null;
    }

    /**
     * Initialiser le composant
     */
    init(containerSelector) {
        this.containerSelector = containerSelector;
        const container = document.querySelector(containerSelector);

        if (!container) {
            this.logger.warn(`Conteneur non trouvé: ${containerSelector}`);
            return;
        }

        this.setupUI(container);
        this.logger.info('✅ PhotoInputHandler initialisé');
    }

    /**
     * Créer l'interface utilisateur
     */
    setupUI(container) {
        // Vérifier si déjà initialisé
        if (container.dataset.photoInputInitialized) {
            return;
        }

        const html = `
            <div class="photo-input-section" data-photo-input-handler>
                <div class="form-group">
                    <label>Uploadez une photo médicale:</label>
                    <div class="photo-upload-area" id="photoDropZone">
                        <div class="upload-icon">📷</div>
                        <p class="upload-text">
                            Cliquez pour sélectionner ou glissez une photo ici
                        </p>
                        <input
                            type="file"
                            id="photoInput"
                            class="photo-input-hidden"
                            accept="image/jpeg,image/png,image/webp"
                            style="display: none;"
                        />
                        <small class="form-text text-muted">
                            Formats: JPEG, PNG, WebP (max 20MB)
                        </small>
                    </div>
                </div>

                <div id="photoPreview" class="photo-preview d-none">
                    <img id="previewImg" src="" alt="Aperçu" class="preview-image" />
                    <button
                        id="removePhotoBtn"
                        class="btn btn-sm btn-danger"
                        type="button"
                    >
                        ❌ Supprimer
                    </button>
                </div>

                <div class="form-group">
                    <label for="photoDescription">Description (optionnel):</label>
                    <textarea
                        id="photoDescription"
                        class="form-control photo-description-area"
                        placeholder="Ex: Radiographie thoracique de face, Front view chest X-ray..."
                        rows="3"
                    ></textarea>
                </div>

                <div class="button-group">
                    <button
                        id="sendPhotoBtn"
                        class="btn btn-primary"
                        type="button"
                        disabled
                    >
                        📤 Envoyer Photo
                    </button>
                </div>

                <div id="photoStatus" class="alert d-none" role="alert"></div>
            </div>
        `;

        container.innerHTML = html;
        container.dataset.photoInputInitialized = 'true';

        this.attachEventListeners(container);
    }

    /**
     * Attacher les événements
     */
    attachEventListeners(container) {
        const dropZone = container.querySelector('#photoDropZone');
        const fileInput = container.querySelector('#photoInput');
        const preview = container.querySelector('#photoPreview');
        const previewImg = container.querySelector('#previewImg');
        const removeBtn = container.querySelector('#removePhotoBtn');
        const sendBtn = container.querySelector('#sendPhotoBtn');
        const statusDiv = container.querySelector('#photoStatus');

        // Clic pour sélectionner fichier
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
        }

        // Sélection fichier
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0], previewImg, preview, sendBtn);
            });
        }

        // Drag & drop
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0], previewImg, preview, sendBtn);
                }
            });
        }

        // Supprimer photo
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.selectedFile = null;
                this.previewUrl = null;
                fileInput.value = '';
                preview.classList.add('d-none');
                sendBtn.disabled = true;
                statusDiv.classList.add('d-none');
            });
        }

        // Envoyer photo
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const description = container.querySelector('#photoDescription').value;
                this.handleSendPhoto(description, statusDiv);
            });
        }
    }

    /**
     * Traiter la sélection de fichier
     */
    handleFileSelect(file, previewImg, preview, sendBtn) {
        if (!file) {
            return;
        }

        // Valider type
        const allowedTypes = window.APP_CONFIG?.PHOTO_CONFIG?.allowedMimes || [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            this.logger.error(`Format non supporté: ${file.type}`);
            this.showStatus(
                `❌ Format non supporté: ${file.type}. Formats acceptés: JPEG, PNG, WebP`,
                'danger'
            );
            return;
        }

        // Valider taille
        const maxSize = window.APP_CONFIG?.PHOTO_CONFIG?.maxSizeBytes || 20 * 1024 * 1024;
        if (file.size > maxSize) {
            const sizeInMB = (maxSize / 1024 / 1024).toFixed(0);
            this.logger.error(`Fichier trop gros: ${file.size} > ${maxSize}`);
            this.showStatus(
                `❌ Fichier trop gros. Maximum: ${sizeInMB}MB`,
                'danger'
            );
            return;
        }

        // Stocker le fichier
        this.selectedFile = file;

        // Afficher l'aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewUrl = e.target.result;
            previewImg.src = this.previewUrl;
            preview.classList.remove('d-none');
            sendBtn.disabled = false;
        };
        reader.readAsDataURL(file);

        this.logger.info(`✅ Photo sélectionnée: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    /**
     * Traiter l'envoi de la photo
     */
    async handleSendPhoto(description, statusDiv) {
        if (this.isProcessing) {
            this.logger.warn('Envoi déjà en cours...');
            return;
        }

        if (!this.selectedFile) {
            this.showStatus('❌ Veuillez sélectionner une photo', 'danger', statusDiv);
            return;
        }

        this.isProcessing = true;
        this.showStatus('⏳ Envoi de la photo...', 'info', statusDiv);

        try {
            // Déterminer le mode
            const currentMode = this.getCurrentMode();

            // Envoyer via MultiInputHandler
            const result = await this.multiInputHandler.handlePhoto(
                this.selectedFile,
                this.selectedFile.type,
                description,
                currentMode
            );

            this.showStatus('✅ Photo envoyée avec succès!', 'success', statusDiv);

            // Réinitialiser
            this.selectedFile = null;
            this.previewUrl = null;
            const fileInput = document.querySelector('#photoInput');
            if (fileInput) fileInput.value = '';
            const descriptionArea = document.querySelector('#photoDescription');
            if (descriptionArea) descriptionArea.value = '';
            const preview = document.querySelector('#photoPreview');
            if (preview) preview.classList.add('d-none');

            this.logger.info('✅ Photo traitée et envoyée', result);

        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'envoi de la photo:', error);
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
        if (!statusDiv) {
            statusDiv = document.querySelector('#photoStatus');
        }

        if (!statusDiv) return;

        statusDiv.innerHTML = message;
        statusDiv.className = `alert alert-${type}`;
        statusDiv.classList.remove('d-none');

        // Auto-masquer les messages de succès après 5s
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.classList.add('d-none');
            }, 5000);
        }
    }

    /**
     * Déterminer le mode actuel
     */
    getCurrentMode() {
        // Chercher l'indicateur de mode
        const modeIndicator = document.querySelector('[data-current-mode]');
        if (modeIndicator) {
            return modeIndicator.dataset.currentMode;
        }

        return window.APP_CONFIG?.MODES?.NORMAL || 'normal';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoInputHandler;
} else {
    window.PhotoInputHandler = PhotoInputHandler;
}
