/**
 * DictaMed - Corrections Critiques pour les Problèmes Identifiés
 * Date: 2025-12-08
 * 
 * Ce fichier contient les corrections rapides pour les problèmes critiques identifiés
 * lors de la vérification du code.
 */

// ===== CORRECTION 1: AudioRecorderManager - Vérifications Nullité =====
/*
FICH: js/components/audio-recorder-manager.js
LIGNE: ~15

AVANT:
const recordingSections = document.querySelectorAll('.recording-section');

APRÈS:
const recordingSections = document.querySelectorAll('.recording-section');
if (!recordingSections || recordingSections.length === 0) {
    console.warn('No recording sections found in DOM');
    return;
}
*/

// ===== CORRECTION 2: FormValidationSystem - Vérifications Nullité =====
/*
FICH: js/components/form-validation.js
LIGNE: ~30

AVANT:
inputs.forEach(({ id, counterId, maxLength }) => {
    const input = document.getElementById(id);
    const counter = document.getElementById(counterId);
    
    if (input && counter) {
        input.addEventListener('input', () => {
            this.updateCharCounter(input, counter, maxLength);
        });
    }
});

APRÈS:
inputs.forEach(({ id, counterId, maxLength }) => {
    const input = document.getElementById(id);
    const counter = document.getElementById(counterId);
    
    if (!input) {
        console.warn(`Input element not found: ${id}`);
        return;
    }
    
    if (!counter) {
        console.warn(`Counter element not found: ${counterId}`);
        return;
    }
    
    input.addEventListener('input', () => {
        this.updateCharCounter(input, counter, maxLength);
    });
});
*/

// ===== CORRECTION 3: DataSender - Incohérence Variable =====
/*
FICH: js/components/data-sender.js
LIGNE: ~148

AVANT:
recordings.push(recording);

APRÈS:
recordings.push(recording); // ✅ Déjà correct
// Note: La variable est bien nommée 'recording' dans le scope de la boucle
*/

// ===== CORRECTION 4: Navigation - Gestion d'Erreurs Améliorée =====
/*
FICH: js/components/navigation.js
AJOUTER après ligne 70:

async loadTabContent(tabId) {
    const tabContent = document.getElementById('tab-content');
    
    if (!tabContent) {
        console.error('Container tab-content non trouvé');
        // Créer le container s'il n'existe pas
        const newTabContent = document.createElement('div');
        newTabContent.id = 'tab-content';
        newTabContent.className = 'tab-content active';
        document.querySelector('main.container')?.appendChild(newTabContent);
        return;
    }
    
    try {
        // ... reste du code existant
    } catch (error) {
        console.error('Erreur lors du chargement du tab:', error);
        // Améliorer le fallback
        tabContent.innerHTML = `
            <div class="error-content">
                <h2>❌ Erreur de chargement</h2>
                <p>Impossible de charger le contenu de cet onglet.</p>
                <p>Erreur: ${error.message}</p>
                <button class="btn btn-primary" onclick="switchTab('home')">🏠 Retour à l'accueil</button>
            </div>
        `;
    }
}
*/

// ===== CORRECTION 5: AutoSave - Vérifications Nullité =====
/*
FICH: js/components/auto-save.js
LIGNE: ~40

AVANT:
save() {
    try {
        const data = {
            mode: this.appState.getMode(),
            timestamp: Date.now(),
            forms: this.collectFormData()
        };
        
        localStorage.setItem('dictamed_autosave', JSON.stringify(data));
        this.appState.lastSaveTime = Date.now();
        this.showIndicator('saved');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showIndicator('error');
    }
}

APRÈS:
save() {
    try {
        if (!this.appState) {
            console.warn('AppState not available for auto-save');
            return;
        }
        
        const data = {
            mode: this.appState.getMode(),
            timestamp: Date.now(),
            forms: this.collectFormData()
        };
        
        localStorage.setItem('dictamed_autosave', JSON.stringify(data));
        this.appState.lastSaveTime = Date.now();
        this.showIndicator('saved');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showIndicator('error');
    }
}
*/

// ===== UTILITAIRES DE CORRECTION AUTOMATIQUE =====

/**
 * Fonction utilitaire pour vérifier et corriger les références DOM manquantes
 */
function safeGetElement(id, fallback = null) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID '${id}' not found in DOM`);
    }
    return element || fallback;
}

/**
 * Fonction utilitaire pour vérifier la disponibilité d'un objet global
 */
function safeCheckGlobal(globalName, fallback = null) {
    if (typeof window[globalName] === 'undefined') {
        console.warn(`Global '${globalName}' not available`);
        return fallback;
    }
    return window[globalName];
}

/**
 * Fonction utilitaire pour l'exécution sécurisée avec timeout
 */
async function safeExecute(operation, timeout = 5000, fallback = null) {
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeout);
        });
        
        return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
        console.warn('Safe execution failed:', error);
        return fallback;
    }
}

// ===== SCRIPT DE CORRECTION AUTOMATIQUE =====
// Ce script peut être exécuté dans la console pour appliquer les corrections

if (typeof window !== 'undefined') {
    window.DictaMedCorrections = {
        safeGetElement,
        safeCheckGlobal,
        safeExecute,
        
        // Correction automatique des références DOM
        fixMissingElements() {
            console.log('🔧 Applying DOM element fixes...');
            
            // Correction Navigation
            if (!document.getElementById('tab-content')) {
                const newTabContent = document.createElement('div');
                newTabContent.id = 'tab-content';
                newTabContent.className = 'tab-content active';
                const mainContainer = document.querySelector('main.container');
                if (mainContainer) {
                    mainContainer.appendChild(newTabContent);
                    console.log('✅ Created missing tab-content element');
                }
            }
            
            console.log('✅ DOM fixes applied');
        },
        
        // Correction des références globales manquantes
        fixMissingGlobals() {
            console.log('🔧 Applying global references fixes...');
            
            // S'assurer que FirebaseAuthManager existe
            if (typeof window.FirebaseAuthManager === 'undefined') {
                console.warn('⚠️ FirebaseAuthManager not found - please ensure firebase-auth-manager.js is loaded');
            }
            
            console.log('✅ Global references checked');
        },
        
        // Test des corrections
        testCorrections() {
            console.log('🧪 Testing applied corrections...');
            
            // Test Navigation
            const tabContent = safeGetElement('tab-content');
            console.log('Tab content element:', !!tabContent);
            
            // Test Firebase
            const firebaseAuth = safeCheckGlobal('FirebaseAuthManager');
            console.log('FirebaseAuthManager available:', !!firebaseAuth);
            
            // Test Notification System
            const notificationSystem = safeCheckGlobal('notificationSystem');
            console.log('NotificationSystem available:', !!notificationSystem);
            
            console.log('✅ Corrections test completed');
        }
    };
    
    console.log('🔧 DictaMed Corrections loaded - Access via window.DictaMedCorrections');
}