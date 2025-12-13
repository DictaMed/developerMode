/**
 * FAQ Accordion Script - Modern, Accessible, and Performance Optimized
 * Handles FAQ accordion functionality with proper ARIA support
 */

class FAQAccordion {
    constructor() {
        this.questions = document.querySelectorAll('.faq-question');
        this.answers = document.querySelectorAll('.faq-answer');
        this.currentOpen = null;
        this.animationDuration = 400;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupReducedMotionSupport();
        this.setupFocusManagement();
        this.preloadCriticalResources();
        this.logAnalytics();
    }

    setupEventListeners() {
        this.questions.forEach((question, index) => {
            // Click event with event delegation for better performance
            question.addEventListener('click', (e) => this.handleQuestionClick(e, index));
            
            // Focus and blur events for better UX
            question.addEventListener('focus', () => this.handleFocus(question));
            question.addEventListener('blur', () => this.handleBlur(question));
            
            // Mouse events for enhanced hover effects
            question.addEventListener('mouseenter', () => this.handleMouseEnter(question));
            question.addEventListener('mouseleave', () => this.handleMouseLeave(question));
        });

        // Handle window resize for responsive behavior
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });

        // Handle escape key globally
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            
            if (!activeElement.classList.contains('faq-question')) {
                return;
            }

            const currentIndex = Array.from(this.questions).indexOf(activeElement);
            let nextIndex;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % this.questions.length;
                    this.questions[nextIndex].focus();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = currentIndex === 0 ? this.questions.length - 1 : currentIndex - 1;
                    this.questions[nextIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    this.questions[0].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    this.questions[this.questions.length - 1].focus();
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.handleQuestionClick(e, currentIndex);
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    this.closeAllFAQs();
                    break;
            }
        });
    }

    setupReducedMotionSupport() {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            this.animationDuration = 0;
            document.documentElement.style.setProperty('--transition-duration', '0s');
        }
    }

    setupFocusManagement() {
        // Store the previously focused element
        this.previousFocus = null;
        
        // Restore focus when FAQ is closed
        this.questions.forEach(question => {
            question.addEventListener('blur', (e) => {
                setTimeout(() => {
                    if (!question.contains(document.activeElement)) {
                        this.previousFocus = question;
                    }
                }, 0);
            });
        });
    }

    preloadCriticalResources() {
        // Preload email link for better performance
        const emailLink = document.querySelector('a[href^="mailto:"]');
        if (emailLink) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'prefetch';
            preloadLink.href = emailLink.href;
            document.head.appendChild(preloadLink);
        }
    }

    logAnalytics() {
        // Track FAQ interactions for analytics (replace with your analytics solution)
        if (typeof gtag !== 'undefined') {
            this.questions.forEach((question, index) => {
                question.addEventListener('click', () => {
                    gtag('event', 'faq_question_opened', {
                        question_number: index + 1,
                        question_text: question.textContent.trim()
                    });
                });
            });
        }
    }

    handleQuestionClick(event, index) {
        event.preventDefault();
        
        const question = this.questions[index];
        const answer = this.answers[index];
        const isOpen = question.getAttribute('aria-expanded') === 'true';

        // Store focus before manipulation
        this.previousFocus = question;

        if (isOpen) {
            this.closeFAQ(question, answer);
        } else {
            this.openFAQ(question, answer);
            
            // Scroll to question if it's not fully visible
            setTimeout(() => {
                this.scrollToQuestionIfNeeded(question);
            }, this.animationDuration);
        }

        // Track interaction
        this.trackInteraction(question, !isOpen);
    }

    handleFocus(question) {
        question.setAttribute('data-focused', 'true');
        
        // Add subtle animation or visual feedback
        if (!question.matches(':focus-visible')) {
            question.style.transform = 'translateX(2px)';
        }
    }

    handleBlur(question) {
        question.removeAttribute('data-focused');
        question.style.transform = '';
    }

    handleMouseEnter(question) {
        if (!question.matches(':focus-visible')) {
            question.style.transform = 'translateX(2px)';
        }
    }

    handleMouseLeave(question) {
        if (!question.matches(':focus-visible')) {
            question.style.transform = '';
        }
    }

    handleGlobalKeydown(event) {
        // Close all FAQs when escape is pressed globally
        if (event.key === 'Escape' && this.currentOpen) {
            this.closeAllFAQs();
            if (this.previousFocus) {
                this.previousFocus.focus();
            }
        }
    }

    handleResize() {
        // Recalculate any size-dependent properties
        this.answers.forEach(answer => {
            if (answer.classList.contains('active')) {
                answer.style.maxHeight = 'none';
            }
        });
    }

    openFAQ(question, answer) {
        // Close any currently open FAQ
        if (this.currentOpen && this.currentOpen !== question) {
            this.closeFAQ(this.currentOpen, this.currentOpen.nextElementSibling);
        }

        // Update ARIA attributes
        question.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');

        // Add active class for styling
        question.classList.add('active');
        answer.classList.add('active');

        // Calculate and set max-height for smooth animation
        answer.style.maxHeight = '0px';
        answer.style.overflow = 'hidden';
        
        // Force reflow
        answer.offsetHeight;
        
        const scrollHeight = answer.scrollHeight;
        answer.style.maxHeight = scrollHeight + 'px';

        this.currentOpen = question;

        // Announce to screen readers
        this.announceToScreenReader(`Question opened: ${question.textContent.trim()}`);
    }

    closeFAQ(question, answer) {
        // Update ARIA attributes
        question.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');

        // Remove active class
        question.classList.remove('active');
        answer.classList.remove('active');

        // Animate close
        answer.style.maxHeight = '0px';

        if (this.currentOpen === question) {
            this.currentOpen = null;
        }

        // Announce to screen readers
        this.announceToScreenReader(`Question closed: ${question.textContent.trim()}`);
    }

    closeAllFAQs() {
        this.questions.forEach((question, index) => {
            const answer = this.answers[index];
            if (question.getAttribute('aria-expanded') === 'true') {
                this.closeFAQ(question, answer);
            }
        });
    }

    scrollToQuestionIfNeeded(question) {
        const rect = question.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (rect.top < 0 || rect.bottom > viewportHeight) {
            question.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    trackInteraction(question, isOpening) {
        // Custom analytics tracking
        const questionText = question.textContent.trim();
        const questionNumber = question.getAttribute('data-question-number');
        
        // You can integrate with your analytics service here
        console.log(`FAQ Interaction: ${isOpening ? 'Opened' : 'Closed'} question ${questionNumber}: ${questionText}`);
        
        // Example: Send to analytics service
        if (typeof analytics !== 'undefined') {
            analytics.track('FAQ Interaction', {
                action: isOpening ? 'opened' : 'closed',
                question_number: questionNumber,
                question_text: questionText
            });
        }
    }

    announceToScreenReader(message) {
        // Create a temporary element for screen reader announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Public method to open a specific FAQ item
    openSpecificFAQ(questionNumber) {
        const question = document.querySelector(`[data-question-number="${questionNumber}"]`);
        const answer = question?.nextElementSibling;
        
        if (question && answer) {
            this.openFAQ(question, answer);
            this.scrollToQuestionIfNeeded(question);
        }
    }

    // Public method to close all FAQs
    closeAll() {
        this.closeAllFAQs();
    }

    // Public method to get current open FAQ
    getCurrentOpen() {
        return this.currentOpen;
    }

    // Method to handle hash navigation (for direct linking to FAQ items)
    handleHashNavigation() {
        const hash = window.location.hash;
        if (hash) {
            const questionNumber = hash.replace('#', '');
            if (questionNumber && !isNaN(questionNumber)) {
                setTimeout(() => {
                    this.openSpecificFAQ(questionNumber);
                }, 100);
            }
        }
    }
}

// Additional utility functions
class FAQUtils {
    static copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            return new Promise((resolve, reject) => {
                if (document.execCommand('copy')) {
                    resolve();
                } else {
                    reject(new Error('Copy command failed'));
                }
                document.body.removeChild(textArea);
            });
        }
    }

    static generateFAQLink(questionNumber) {
        const baseUrl = window.location.href.split('#')[0];
        return `${baseUrl}#${questionNumber}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global FAQ instance
    window.faqAccordion = new FAQAccordion();
    
    // Handle hash navigation
    window.faqAccordion.handleHashNavigation();
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        window.faqAccordion.handleHashNavigation();
    });

    // Add click handlers for email links to track interactions
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'email_click', {
                    email_address: link.href.replace('mailto:', '')
                });
            }
        });
    });

    // Add loading state management
    const container = document.querySelector('.faq-container');
    if (container) {
        container.classList.add('loaded');
    }

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`FAQ page loaded in ${loadTime}ms`);
            
            if (loadTime > 3000) {
                console.warn('FAQ page loading time is slower than expected');
            }
        });
    }
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FAQAccordion, FAQUtils };
}