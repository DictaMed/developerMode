/**
 * DictaMed - Gestionnaire de photos
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== PHOTO MANAGEMENT SYSTEM =====
class PhotoManagementSystem {
    constructor() {
        this.uploadedPhotos = [];
        this.init();
    }

    init() {
        this.initPhotosUpload();
    }

    initPhotosUpload() {
        const photosInput = document.getElementById('photosUpload');
        const photosPreview = document.getElementById('photosPreview');
        
        if (!photosInput || !photosPreview) return;
        
        photosInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });
    }

    handleFileSelection(files) {
        // Limit to 5 photos
        if (this.uploadedPhotos.length + files.length > window.APP_CONFIG.MAX_PHOTOS) {
            if (window.notificationSystem) {
                window.notificationSystem.warning(`Vous avez atteint la limite de ${window.APP_CONFIG.MAX_PHOTOS} photos. Supprimez des photos existantes pour en ajouter de nouvelles.`, 'Limite atteinte');
            }
            return;
        }
        
        // Validate each file
        files.forEach(file => {
            if (!this.validateFile(file)) {
                return;
            }
            
            this.addPhoto(file);
        });
        
        this.updatePreview();
    }

    validateFile(file) {
        // Check format
        if (!file.type.startsWith('image/')) {
            if (window.notificationSystem) {
                window.notificationSystem.error(`Le fichier "${file.name}" n'est pas une image valide.`, 'Format non supporté');
            }
            return false;
        }
        
        // Check size
        if (file.size > window.APP_CONFIG.MAX_PHOTO_SIZE) {
            const sizeMB = window.Utils.formatFileSize(file.size);
            if (window.notificationSystem) {
                window.notificationSystem.error(`Le fichier "${file.name}" est trop volumineux (${sizeMB}). Limite : ${window.Utils.formatFileSize(window.APP_CONFIG.MAX_PHOTO_SIZE)}.`, 'Fichier trop lourd');
            }
            return false;
        }
        
        return true;
    }

    addPhoto(file) {
        this.uploadedPhotos.push(file);
    }

    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.updatePreview();
    }

    updatePreview() {
        const photosPreview = document.getElementById('photosPreview');
        if (!photosPreview) return;
        
        photosPreview.innerHTML = '';
        
        this.uploadedPhotos.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const photoItem = this.createPhotoItem(e.target.result, file, index);
                photosPreview.appendChild(photoItem);
            };
            
            reader.readAsDataURL(file);
        });
    }

    createPhotoItem(src, file, index) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        photoItem.innerHTML = `
            <img src="${src}" alt="Photo ${index + 1}">
            <button class="photo-item-remove" data-index="${index}" title="Supprimer">×</button>
            <div class="photo-item-info">${file.name}</div>
        `;
        
        // Add remove event
        const removeBtn = photoItem.querySelector('.photo-item-remove');
        removeBtn.addEventListener('click', () => {
            this.removePhoto(index);
        });
        
        return photoItem;
    }

    getPhotos() {
        return this.uploadedPhotos;
    }

    clear() {
        this.uploadedPhotos = [];
        this.updatePreview();
    }

    async getPhotosAsBase64() {
        const photos = [];
        for (const file of this.uploadedPhotos) {
            const base64 = await window.Utils.fileToBase64(file);
            photos.push({
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                base64: base64
            });
        }
        return photos;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoManagementSystem;
} else {
    window.PhotoManagementSystem = PhotoManagementSystem;
}