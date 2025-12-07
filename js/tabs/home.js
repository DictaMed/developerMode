/**
 * DictaMed - Module Onglet Accueil
 * Version: 2.0.0 - Refactorisé pour une meilleure organisation
 */

// ===== HOME TAB MODULE =====
class HomeTab {
    constructor(appState, navigationSystem) {
        this.appState = appState;
        this.navigationSystem = navigationSystem;
    }

    init() {
        this.initEventListeners();
        this.setupHeroButtons();
    }

    initEventListeners() {
        // Les boutons sont déjà configurés dans le HTML avec onclick
        // Cette fonction peut être étendue pour d'autres interactions
        console.log('Module Accueil initialisé');
    }

    setupHeroButtons() {
        // Configuration des boutons du hero (déjà dans HTML)
        // Cette fonction peut être utilisée pour ajouter des animations ou analytics
        const heroButtons = document.querySelectorAll('.hero-cta .btn');
        heroButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Ajouter des analytics ou animations si nécessaire
                console.log('Hero button clicked:', e.target.textContent);
            });
        });
    }

    // Méthodes spécifiques à l'accueil
    showWelcomeMessage() {
        if (window.notificationSystem) {
            window.notificationSystem.info('Bienvenue sur DictaMed !', 'Accueil');
        }
    }

    updateFeatureCards() {
        // Animation des cartes de fonctionnalités
        const featureCards = document.querySelectorAll('.feature-card-modern');
        featureCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.6s ease forwards';
            }, index * 100);
        });
    }

    updateModeCards() {
        // Animation des cartes de modes
        const modeCards = document.querySelectorAll('.mode-card-modern');
        modeCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.6s ease forwards';
            }, (index + 3) * 100); // Délai après les feature cards
        });
    }

    // Lifecycle methods
    onTabLoad() {
        this.updateFeatureCards();
        this.updateModeCards();
    }

    onTabUnload() {
        // Nettoyage spécifique à l'onglet accueil
        console.log('Onglet accueil déchargé');
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeTab;
} else {
    window.HomeTab = HomeTab;
}