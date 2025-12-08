/**
 * Diagnostic pour la navigation - Debug des onglets non cliquables
 */

console.log('🔍 DIAGNOSTIC NAVIGATION - Démarrage...');

// Fonction de diagnostic principal
function diagnoseNavigation() {
    console.log('\n=== DIAGNOSTIC NAVIGATION ===');
    
    // 1. Vérifier les boutons de navigation
    console.log('\n1. BOUTONS DE NAVIGATION:');
    const fixedNavBtns = document.querySelectorAll('.fixed-nav-btn');
    console.log(`- Boutons fixed-nav-btn trouvés: ${fixedNavBtns.length}`);
    
    fixedNavBtns.forEach((btn, index) => {
        const tabId = btn.getAttribute('data-tab');
        const classes = btn.className;
        console.log(`  Bouton ${index}: data-tab="${tabId}", classes="${classes}"`);
        
        // Vérifier les event listeners
        const events = getEventListeners(btn);
        console.log(`    Event listeners: ${Object.keys(events).join(', ')}`);
    });
    
    // 2. Vérifier les autres boutons avec data-tab
    console.log('\n2. AUTRES BOUTONS data-tab:');
    const allDataTabButtons = document.querySelectorAll('[data-tab]');
    console.log(`- Total boutons avec data-tab: ${allDataTabButtons.length}`);
    
    allDataTabButtons.forEach((btn, index) => {
        const tabId = btn.getAttribute('data-tab');
        const tagName = btn.tagName;
        const classes = btn.className;
        console.log(`  ${index}: <${tagName}> data-tab="${tabId}" classes="${classes}"`);
    });
    
    // 3. Vérifier le système de navigation
    console.log('\n3. SYSTÈME DE NAVIGATION:');
    if (window.tabNavigationSystem) {
        console.log('✅ TabNavigationSystem existe');
        console.log(`- Instance:`, window.tabNavigationSystem);
        console.log(`- Active tab: ${window.tabNavigationSystem.getActiveTab()}`);
    } else {
        console.log('❌ TabNavigationSystem non trouvé');
    }
    
    // 4. Vérifier les fonctions globales
    console.log('\n4. FONCTIONS GLOBALES:');
    console.log(`- window.switchTab: ${typeof window.switchTab}`);
    console.log(`- window.tabNavigationSystem: ${typeof window.tabNavigationSystem}`);
    
    // 5. Vérifier les onglets/containers
    console.log('\n5. CONTENEURS D\'ONGLETS:');
    const tabContainers = [
        'tab-content',
        'guide-content', 
        'faq-content',
        'mode-normal-content',
        'mode-test-content',
        'mode-dmi-content'
    ];
    
    tabContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        console.log(`- ${containerId}: ${container ? '✅ Trouvé' : '❌ Non trouvé'}`);
        if (container) {
            const display = window.getComputedStyle(container).display;
            const classes = container.className;
            console.log(`    Display: ${display}, Classes: "${classes}"`);
        }
    });
    
    console.log('\n=== FIN DIAGNOSTIC ===\n');
}

// Fonction pour attacher les event listeners manuellement
function forceAttachNavigationListeners() {
    console.log('🔧 Force attachement des listeners de navigation...');
    
    const buttons = document.querySelectorAll('[data-tab]');
    buttons.forEach(btn => {
        // Supprimer les anciens listeners (optionnel)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Ajouter un nouveau listener
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const tabId = newBtn.getAttribute('data-tab');
            console.log(`🔄 Bouton cliqué: ${tabId}`);
            
            if (window.tabNavigationSystem && window.tabNavigationSystem.switchTab) {
                window.tabNavigationSystem.switchTab(tabId);
            } else if (window.switchTab) {
                window.switchTab(tabId);
            } else {
                console.error('❌ Système de navigation non disponible');
                alert(`Erreur: Impossible de naviguer vers "${tabId}". Système non initialisé.`);
            }
        });
        
        console.log(`✅ Listener attaché pour: ${tabId}`);
    });
}

// Auto-diagnostic au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            diagnoseNavigation();
        }, 1000);
    });
} else {
    setTimeout(() => {
        diagnoseNavigation();
    }, 1000);
}

// Fonctions globales pour diagnostic manuel
window.diagnoseNavigation = diagnoseNavigation;
window.forceAttachNavigationListeners = forceAttachNavigationListeners;

console.log('✅ Diagnostic navigation chargé. Utilisez:');
console.log('- window.diagnoseNavigation() pour le diagnostic complet');
console.log('- window.forceAttachNavigationListeners() pour forcer les listeners');