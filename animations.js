/* UI/UX ENHANCEMENTS - Enhanced Interactive Features */

class UIEnhancer {
    constructor() {
        this.initScrollReveal();
        this.initEnhancedInteractions();
        this.initMemoryCounter();
        this.initSharePanel();
        this.initPageTransitions();
    }

    /* Memory Counter Animation */
    initMemoryCounter() {
        this.memoryCount = 0;
        this.updateMemoryCounter = (newCount) => {
            const counter = document.querySelector('.memory-counter .count');
            if (counter && newCount > this.memoryCount) {
                this.memoryCount = newCount;
                counter.parentElement.classList.add('animating');
                counter.textContent = newCount;
                setTimeout(() => {
                    counter.parentElement.classList.remove('animating');
                }, 600);
            }
        };
    }

    /* Share Panel */
    initSharePanel() {
        this.createSharePanel();
        this.initShareButton();
    }

    createSharePanel() {
        const sharePanel = document.createElement('div');
        sharePanel.id = 'sharePanel';
        sharePanel.className = 'share-panel';
        sharePanel.innerHTML = `
            <div class="share-panel-content">
                <h3>Share your memory wall</h3>
                <button id="copyLinkBtn" class="btn btn-secondary">📋 Copy Link</button>
                <button id="whatsappBtn" class="btn btn-secondary">💬 Share via WhatsApp</button>
                <button id="closeShareBtn" class="btn btn-secondary">✕ Close</button>
            </div>
        `;
        document.body.appendChild(sharePanel);
    }

    initShareButton() {
        const shareBtn = document.getElementById('shareBtn');
        const sharePanel = document.getElementById('sharePanel');
        const closeBtn = document.getElementById('closeShareBtn');
        const copyBtn = document.getElementById('copyLinkBtn');
        const whatsappBtn = document.getElementById('whatsappBtn');

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                sharePanel.style.display = 'flex';
                setTimeout(() => sharePanel.classList.add('show'), 10);
            });
        }

        const closePanel = () => {
            sharePanel.classList.remove('show');
            setTimeout(() => {
                sharePanel.style.display = 'none';
            }, 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closePanel);
        if (sharePanel) sharePanel.addEventListener('click', (e) => {
            if (e.target === sharePanel) closePanel();
        });

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    this.showToast('Link copied to clipboard!', 'success');
                } catch (err) {
                    this.showToast('Failed to copy link', 'error');
                }
            });
        }

        if (whatsappBtn && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            whatsappBtn.addEventListener('click', () => {
                const text = `Join our batch memory wall: ${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            });
        } else if (whatsappBtn) {
            whatsappBtn.style.display = 'none';
        }
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

        document.addEventListener('DOMContentLoaded', () => {
            const revealElements = document.querySelectorAll('.section-card, .compose-card, .profile-card, .batch-grid, .message-list, .hero');
            revealElements.forEach(el => {
                el.classList.add('reveal');
                observer.observe(el);
            });
        });
    }

    /* Enhanced Interactions */
    initEnhancedInteractions() {
        this.initButtonEffects();
        this.initCardTilt();
        this.initNewMemoryHighlight();
    }

    /* Button Micro-Interactions */
    initButtonEffects() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn')) {
                this.createRipple(e, e.target);
                e.target.style.transform = 'translateY(0) scale(0.97)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            }
        });
    }

    createRipple(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    /* Card Tilt Effect */
    initCardTilt() {
        if (window.innerWidth > 768) {
            document.addEventListener('mousemove', (e) => {
                const cards = document.querySelectorAll('.batch-card, .message-card');
                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    const angle = Math.atan2(y, x) * (180 / Math.PI) / 10;
                    
                    if (Math.abs(x) < rect.width / 2 && Math.abs(y) < rect.height / 2) {
                        card.style.transform = `perspective(1000px) rotateZ(${angle}deg) translateY(-2px)`;
                    }
                });
            });

            document.addEventListener('mouseleave', () => {
                const cards = document.querySelectorAll('.batch-card, .message-card');
                cards.forEach(card => {
                    card.style.transform = '';
                });
            });
        }
    }

    /* New Memory Highlight */
    initNewMemoryHighlight() {
        const observeNewMemories = () => {
            const messageList = document.getElementById('messageList');
            if (messageList) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.classList && node.classList.contains('message-card')) {
                                node.style.animation = 'newMemoryHighlight 1s ease-out, memoryCardEntry 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards';
                                
                                // Update memory counter
                                const currentCount = document.querySelectorAll('.message-card').length;
                                this.updateMemoryCounter(currentCount);
                            }
                        });
                    });
                });
                observer.observe(messageList, { childList: true });
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeNewMemories);
        } else {
            observeNewMemories();
        }
    }

    /* Page Transitions */
    initPageTransitions() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href && !e.target.href.includes('#')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = e.target.href;
                }, 200);
            }
        });
    }

    /* Toast Notification */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast visible';
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
        
        if (type === 'error') {
            toast.style.background = '#dc2626';
        } else if (type === 'success') {
            toast.style.background = '#16a34a';
        }

        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }
}

// Initialize UI Enhancer
new UIEnhancer();
