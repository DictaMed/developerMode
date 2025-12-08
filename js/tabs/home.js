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
                card.style.animation = 'slideInUp 0.8s ease forwards';
            }, index * 150);
        });
    }

    updateModeCards() {
        // Animation des cartes de modes
        const modeCards = document.querySelectorAll('.mode-card-modern');
        modeCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.8s ease forwards';
            }, (index + 3) * 150); // Délai après les feature cards
        });
    }

    animateHeroStats() {
        // Animation des statistiques du hero
        const stats = document.querySelectorAll('.stat-item');
        stats.forEach((stat, index) => {
            setTimeout(() => {
                stat.style.animation = 'statFloat 0.8s ease forwards';
            }, index * 200);
        });
    }

    animateTestimonials() {
        // Animation des témoignages
        const testimonials = document.querySelectorAll('.testimonial-card');
        testimonials.forEach((testimonial, index) => {
            setTimeout(() => {
                testimonial.style.animation = 'testimonialSlideIn 0.8s ease forwards';
            }, index * 200);
        });
    }

    initScrollAnimations() {
        // Animation au scroll pour les nouveaux éléments
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observer les nouvelles sections
        document.querySelectorAll('.testimonials-section, .mode-features').forEach(el => {
            observer.observe(el);
        });
    }

    addInteractiveEffects() {
        // Effets interactifs pour les nouvelles cartes
        const featureCards = document.querySelectorAll('.feature-card-modern');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const highlight = card.querySelector('.feature-highlight');
                if (highlight) {
                    highlight.style.transform = 'scale(1.05)';
                    highlight.style.transition = 'transform 0.3s ease';
                }
            });

            card.addEventListener('mouseleave', () => {
                const highlight = card.querySelector('.feature-highlight');
                if (highlight) {
                    highlight.style.transform = 'scale(1)';
                }
            });
        });

        // Effets pour les cartes de modes
        const modeCards = document.querySelectorAll('.mode-card-modern');
        modeCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const badge = card.querySelector('.mode-badge');
                if (badge) {
                    badge.style.transform = 'scale(1.1) rotate(2deg)';
                    badge.style.transition = 'all 0.3s ease';
                }
            });

            card.addEventListener('mouseleave', () => {
                const badge = card.querySelector('.mode-badge');
                if (badge) {
                    badge.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });
    }

    // Lifecycle methods
    onTabLoad() {
        // Animer les éléments existants
        this.updateFeatureCards();
        this.updateModeCards();
        
        // Animer les nouveaux éléments
        setTimeout(() => {
            this.animateHeroStats();
            this.animateTestimonials();
        }, 800); // Délai après les animations principales
        
        // Initialiser les effets interactifs
        setTimeout(() => {
            this.addInteractiveEffects();
        }, 1200);
        
        // Initialiser les animations au scroll
        this.initScrollAnimations();
        
        console.log('Page d\'accueil améliorée chargée avec animations');
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