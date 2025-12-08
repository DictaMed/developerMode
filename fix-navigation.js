/**
 * Correction urgente pour la navigation - Force l'initialisation des boutons cliquables
 * Version: 1.0.0 - Hotfix pour onglets non cliquables
 */

console.log('🚨 CORRECTION NAVIGATION - Démarrage urgent...');

// Fonction principale de correction
function fixNavigationButtons() {
    console.log('🔧 Correction des boutons de navigation...');
    
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => fixNavigationButtons(), 500);
        });
        return;
    }
    
    try {
        // 1. Forcer l'initialisation des systèmes de navigation
        forceNavigationSystemInit();
        
        // 2. Attacher les event listeners directement
        attachDirectNavigationListeners();
        
        // 3. Vérifier que tout fonctionne
        testNavigationFunctionality();
        
        console.log('✅ Correction navigation appliquée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction navigation:', error);
    }
}

// Fonction pour forcer l'initialisation du système de navigation
function forceNavigationSystemInit() {
    console.log('🔄 Force initialisation du système de navigation...');
    
    // Attendre les scripts critiques
    const maxAttempts = 20;
    let attempts = 0;
    
    const waitForNavigation = setInterval(() => {
        attempts++;
        
        // Vérifier si les systèmes sont disponibles
        if (window.tabNavigationSystem && typeof window.TabNavigationSystem === 'function') {
            console.log('✅ TabNavigationSystem disponible');
            clearInterval(waitForNavigation);
            return;
        }
        
        // Vérifier si au moins les fonctions globales existent
        if (window.switchTab && typeof window.switchTab === 'function') {
            console.log('✅ switchTab fonction disponible');
            clearInterval(waitForNavigation);
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.warn('⚠️ Navigation system not available after max attempts');
            clearInterval(waitForNavigation);
            
            // Créer un système de navigation de secours
            createFallbackNavigationSystem();
        }
    }, 100);
}

// Créer un système de navigation de secours
function createFallbackNavigationSystem() {
    console.log('🆘 Création du système de navigation de secours...');
    
    window.switchTab = async function(tabId) {
        console.log(`🔄 Navigation de secours vers: ${tabId}`);
        
        // Cacher tous les onglets
        const allTabContents = document.querySelectorAll('.tab-content');
        allTabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Désactiver tous les boutons
        const allNavButtons = document.querySelectorAll('[data-tab]');
        allNavButtons.forEach(btn => btn.classList.remove('active'));
        
        // Activer l'onglet cible
        const targetContent = document.getElementById(`${tabId}-content`);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
        }
        
        // Activer le bouton correspondant
        const targetButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Charger le contenu si nécessaire
        if (targetContent && !targetContent.innerHTML.trim()) {
            loadTabContentFallback(tabId, targetContent);
        }
        
        console.log(`✅ Navigation de secours réussie vers: ${tabId}`);
    };
    
    // Fonction de chargement de contenu de secours
    async function loadTabContentFallback(tabId, container) {
        const tabFiles = {
            'mode-normal': 'tab-mode-normal.html',
            'mode-test': 'tab-mode-test.html',
            'mode-dmi': 'tab-mode-dmi.html',
            'guide': 'tab-guide.html',
            'faq': 'tab-faq.html'
        };
        
        const fileName = tabFiles[tabId];
        if (!fileName) {
            container.innerHTML = `<div class="error-content"><h2>Onglet: ${tabId}</h2><p>Contenu non disponible</p></div>`;
            return;
        }
        
        try {
            container.innerHTML = '<div class="loading-content"><p>Chargement...</p></div>';
            
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const content = await response.text();
            container.innerHTML = content;
            
            console.log(`✅ Contenu chargé pour: ${tabId}`);
            
        } catch (error) {
            console.error(`❌ Erreur chargement ${tabId}:`, error);
            container.innerHTML = `
                <div class="error-content">
                    <h2>❌ Erreur de chargement</h2>
                    <p>Impossible de charger l'onglet: <strong>${tabId}</strong></p>
                    <p><small>Erreur: ${error.message}</small></p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="switchTab('home')">🏠 Retour à l'accueil</button>
                        <button class="btn btn-secondary" onclick="location.reload()">🔄 Recharger la page</button>
                    </div>
                </div>
            `;
        }
    }
}

// Fonction pour attacher les event listeners directement
function attachDirectNavigationListeners() {
    console.log('🎯 Attachement direct des event listeners...');
    
    // Sélectionner tous les boutons avec data-tab
    const allNavButtons = document.querySelectorAll('[data-tab]');
    
    console.log(`🔍 ${allNavButtons.length} boutons trouvés`);
    
    allNavButtons.forEach((button, index) => {
        const tabId = button.getAttribute('data-tab');
        const tagName = button.tagName;
        const classes = button.className;
        
        console.log(`🔘 Bouton ${index}: <${tagName}> data-tab="${tabId}" classes="${classes}"`);
        
        // Supprimer les anciens listeners en clonant le bouton
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Attacher un nouveau listener
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const clickedTabId = newButton.getAttribute('data-tab');
            console.log(`🖱️ Clic détecté sur: ${clickedTabId}`);
            
            // Utiliser la fonction de navigation disponible
            if (window.switchTab) {
                window.switchTab(clickedTabId);
            } else if (window.tabNavigationSystem && window.tabNavigationSystem.switchTab) {
                window.tabNavigationSystem.switchTab(clickedTabId);
            } else {
                console.error('❌ Fonction de navigation non disponible');
                alert(`Navigation vers "${clickedTabId}" non disponible. Veuillez recharger la page.`);
            }
        });
        
        // Ajouter un indicateur visuel pour montrer que le bouton est cliquable
        newButton.style.cursor = 'pointer';
        newButton.style.userSelect = 'none';
        
        console.log(`✅ Listener attaché pour: ${tabId}`);
    });
}

// Fonction de test de la navigation
function testNavigationFunctionality() {
    console.log('🧪 Test de la fonctionnalité de navigation...');
    
    // Vérifier si les boutons sont cliquables
    const testButton = document.querySelector('[data-tab="mode-test"]');
    if (testButton) {
        console.log('🧪 Test avec bouton mode-test...');
        
        // Simuler un clic pour tester
        setTimeout(() => {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            console.log('🚀 Simulation du clic...');
            testButton.dispatchEvent(clickEvent);
        }, 1000);
    }
}

// Fonction globale de correction
window.fixNavigationButtons = fixNavigationButtons;

// Lancer la correction automatiquement
fixNavigationButtons();

// Lancer également après un délai en cas de problème
setTimeout(() => {
    console.log('🔄 Deuxième tentative de correction...');
    fixNavigationButtons();
}, 2000);

console.log('✅ Correction navigation prête. Utilisez window.fixNavigationButtons() si nécessaire.');