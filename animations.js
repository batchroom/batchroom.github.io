/* UI/UX ENHANCEMENTS - Scroll Reveal & Advanced Interactions */

class UIEnhancer {
    constructor() {
        this.initScrollReveal();
        this.initEnhancedInteractions();
        this.initPageTransitions();
    }

    /* Scroll Reveal Animation */
    initScrollReveal() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements for scroll reveal
        document.addEventListener('DOMContentLoaded', () => {
            const revealElements = document.querySelectorAll('.section-card, .compose-card, .profile-card, .batch-grid, .message-list, .hero');
            revealElements.forEach(el => {
                el.classList.add('reveal');
                observer.observe(el);
            });
        });
    }

    /* Enhanced Button Interactions */
    initEnhancedInteractions() {
        document.addEventListener('DOMContentLoaded', () => {
            this.enhanceButtons();
            this.enhanceFormInputs();
            this.enhanceCards();
        });
    }

    enhanceButtons() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            // Add ripple effect
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });

            // Enhanced hover feedback
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', () => {
                if (!button.matches(':active')) {
                    button.style.transform = 'translateY(0)';
                }
            });
        });
    }

    enhanceFormInputs() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Enhanced focus animations
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });

            // Real-time validation feedback
            input.addEventListener('input', () => {
                this.validateInput(input);
            });
        });
    }

    enhanceCards() {
        const cards = document.querySelectorAll('.batch-card, .message-card');
        cards.forEach(card => {
            // Enhanced hover with tilt effect
            card.addEventListener('mouseenter', (e) => {
                this.addTiltEffect(e, card);
            });

            card.addEventListener('mouseleave', () => {
                this.removeTiltEffect(card);
            });

            // Enhanced click feedback
            card.addEventListener('click', () => {
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
            });
        });
    }

    /* Ripple Effect for Buttons */
    createRipple(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        // Add ripple styles if not already present
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                }
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    /* Tilt Effect for Cards */
    addTiltEffect(event, card) {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    }

    removeTiltEffect(card) {
        card.style.transform = '';
    }

    /* Input Validation Feedback */
    validateInput(input) {
        const value = input.value.trim();
        const formGroup = input.closest('.form-group');
        
        if (!formGroup) return;

        // Remove existing validation states
        formGroup.classList.remove('valid', 'invalid');
        
        if (value.length > 0) {
            if (input.hasAttribute('required') && value.length < 2) {
                formGroup.classList.add('invalid');
            } else if (input.type === 'email' && !this.isValidEmail(value)) {
                formGroup.classList.add('invalid');
            } else {
                formGroup.classList.add('valid');
            }
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /* Page Transitions */
    initPageTransitions() {
        // Add page transition styles
        if (!document.querySelector('#page-transition-styles')) {
            const style = document.createElement('style');
            style.id = 'page-transition-styles';
            style.textContent = `
                body {
                    opacity: 1;
                    transition: opacity 0.3s ease-in-out;
                }
                body.page-transitioning {
                    opacity: 0;
                }
            `;
            document.head.appendChild(style);
        }

        // Enhance navigation links
        document.addEventListener('DOMContentLoaded', () => {
            const links = document.querySelectorAll('a[href$=".html"]');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    this.handlePageTransition(e, link);
                });
            });
        });
    }

    handlePageTransition(event, link) {
        event.preventDefault();
        const href = link.getAttribute('href');
        
        // Add transitioning class
        document.body.classList.add('page-transitioning');
        
        // Navigate after transition
        setTimeout(() => {
            window.location.href = href;
        }, 300);
    }

    /* Enhanced Toast Notifications */
    showEnhancedToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast enhanced';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${this.getToastIcon(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Add enhanced toast styles
        if (!document.querySelector('#enhanced-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-toast-styles';
            style.textContent = `
                .toast.enhanced {
                    background: white;
                    color: var(--text);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    border-left: 4px solid var(--accent);
                    min-width: 300px;
                    max-width: 400px;
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .toast-icon {
                    font-size: 20px;
                }
                .toast-message {
                    flex: 1;
                    font-weight: 500;
                }
                .toast.enhanced.success {
                    border-left-color: #16a34a;
                }
                .toast.enhanced.error {
                    border-left-color: #dc2626;
                }
            `;
            document.head.appendChild(style);
        }

        toast.classList.add(type);
        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        return icons[type] || icons.info;
    }

    /* Loading States */
    showLoadingState(container, message = 'Loading...') {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-state';
        loadingElement.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;

        // Add loading styles
        if (!document.querySelector('#loading-state-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-state-styles';
            style.textContent = `
                .loading-state {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                }
                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #e2e8f0;
                    border-top: 3px solid var(--accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                .loading-text {
                    margin-top: 16px;
                    color: var(--text-soft);
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }

        container.style.position = 'relative';
        container.appendChild(loadingElement);
    }

    hideLoadingState(container) {
        const loadingElement = container.querySelector('.loading-state');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            setTimeout(() => loadingElement.remove(), 300);
        }
    }
}

/* Initialize UI Enhancements */
new UIEnhancer();

/* Export for use in other files */
window.UIEnhancer = UIEnhancer;
