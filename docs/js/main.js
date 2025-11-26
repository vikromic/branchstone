document.addEventListener('DOMContentLoaded', function () {
    // Add a class to the body to indicate that JS is active and animations can be applied.
    document.body.classList.add('js-animations-active');

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize smooth scroll
    initSmoothScroll();

    // Initialize parallax effects
    initParallaxEffects();

    // Initialize magnetic hover effects
    initMagneticHover();

    function initializeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNavMenu = document.getElementById('mobile-nav-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const body = document.body;

        if (!mobileMenuToggle || !mobileNavMenu || !mobileMenuOverlay) return;

        // Set initial ARIA attributes
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileNavMenu.setAttribute('aria-hidden', 'true');

        function toggleMobileMenu() {
            const isActive = mobileNavMenu.classList.contains('active');
            const willBeActive = !isActive;

            mobileMenuToggle.classList.toggle('active');
            mobileNavMenu.classList.toggle('active');
            mobileMenuOverlay.classList.toggle('active');

            // Update ARIA attributes
            mobileMenuToggle.setAttribute('aria-expanded', willBeActive);
            mobileNavMenu.setAttribute('aria-hidden', !willBeActive);

            body.style.overflow = willBeActive ? 'hidden' : '';
            if (willBeActive) {
                body.classList.add('menu-open');
                // Focus first menu item for keyboard navigation
                const firstLink = mobileNavMenu.querySelector('a');
                if (firstLink) {
                    setTimeout(() => firstLink.focus(), 100);
                }
            } else {
                body.classList.remove('menu-open');
                // Return focus to toggle button
                mobileMenuToggle.focus();
            }
        }

        function closeMobileMenu() {
            mobileMenuToggle.classList.remove('active');
            mobileNavMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');

            // Update ARIA attributes
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileNavMenu.setAttribute('aria-hidden', 'true');

            body.style.overflow = '';
            body.classList.remove('menu-open');

            // Return focus to toggle button
            mobileMenuToggle.focus();
        }

        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);

        // Close menu on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNavMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        // Close menu when clicking a nav link
        const navLinks = mobileNavMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Set current page title in mobile header
        const mobilePageTitle = document.getElementById('mobile-page-title');
        if (mobilePageTitle) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const pageTitles = {
                'index.html': 'Home',
                'gallery.html': 'Gallery',
                'about.html': 'About',
                'contact.html': 'Contact'
            };

            const title = pageTitles[currentPage] || 'Home';
            mobilePageTitle.textContent = title;
            mobilePageTitle.setAttribute('data-translate', `nav.${title.toLowerCase()}`);
        }

        // Hover Reveal Effect
        const hoverBg = document.getElementById('menu-hover-bg');
        if (hoverBg) {
            navLinks.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    const img = link.getAttribute('data-hover-img');
                    if (img) {
                        hoverBg.style.backgroundImage = `url('${img}')`;
                        hoverBg.classList.add('visible');
                    }
                });

                link.addEventListener('mouseleave', () => {
                    hoverBg.classList.remove('visible');
                });
            });
        }
    }

    function initializeLightbox() {
        const lightbox = document.getElementById('lightbox');
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (!lightbox || galleryItems.length === 0) return;

        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxSize = document.getElementById('lightbox-size');
        const lightboxMaterials = document.getElementById('lightbox-materials');
        const lightboxDescription = document.getElementById('lightbox-description');
        const closeLightbox = document.querySelector('.close-lightbox');
        const inquireBtn = document.querySelector('.inquire-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const sliderIndicator = document.getElementById('slider-indicator');

        let currentImages = [];
        let currentIndex = 0;
        let touchStartX = 0;
        let touchEndX = 0;
        let previousFocusedElement = null;

        // Pinch-to-zoom variables
        let scale = 1;
        let lastScale = 1;
        let translateX = 0;
        let translateY = 0;
        let lastTranslateX = 0;
        let lastTranslateY = 0;
        let lastTap = 0;

        function updateSlider() {
            if (currentImages.length === 0) return;

            lightboxImg.src = currentImages[currentIndex];
            lightboxImg.alt = lightboxTitle.textContent || '';

            // Update slider buttons visibility
            if (prevBtn) prevBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
            if (nextBtn) nextBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';

            // Update indicator
            if (sliderIndicator && currentImages.length > 1) {
                sliderIndicator.textContent = `${currentIndex + 1} / ${currentImages.length}`;
                sliderIndicator.style.display = 'block';
                // Add screen reader announcement
                sliderIndicator.setAttribute('role', 'status');
                sliderIndicator.setAttribute('aria-live', 'polite');
            } else if (sliderIndicator) {
                sliderIndicator.style.display = 'none';
            }

            // Announce image change to screen readers
            if (lightboxTitle) {
                const announcement = `Image ${currentIndex + 1} of ${currentImages.length}: ${lightboxTitle.textContent}`;
                announceToScreenReader(announcement);
            }
        }

        function showNext() {
            if (currentImages.length > 0) {
                currentIndex = (currentIndex + 1) % currentImages.length;
                updateSlider();
            }
        }

        function showPrev() {
            if (currentImages.length > 0) {
                currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
                updateSlider();
            }
        }

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                // Store currently focused element to restore later
                previousFocusedElement = document.activeElement;

                // Get images array from dataset or use single image
                const imagesJson = item.dataset.images;
                currentImages = imagesJson ? JSON.parse(imagesJson) : [item.dataset.img];
                currentIndex = 0;

                lightboxTitle.textContent = item.dataset.title;
                // Use translations for labels if available
                const sizeLabel = window.getTranslation ? window.getTranslation('lightbox.size') : 'Size:';
                const materialsLabel = window.getTranslation ? window.getTranslation('lightbox.materials') : 'Materials:';
                lightboxSize.textContent = `${sizeLabel} ${item.dataset.size}`;
                lightboxMaterials.textContent = `${materialsLabel} ${item.dataset.materials}`;
                lightboxDescription.textContent = item.dataset.description;

                updateSlider();
                lightbox.style.display = 'flex';
                lightbox.setAttribute('aria-hidden', 'false');

                // Focus close button for accessibility
                setTimeout(() => {
                    if (closeLightbox) closeLightbox.focus();
                }, 100);

                // Trap focus within lightbox
                enableFocusTrap();
            });
        });

        function close() {
            lightbox.style.display = 'none';
            lightbox.setAttribute('aria-hidden', 'true');
            currentImages = [];
            currentIndex = 0;
            resetZoom();

            // Disable focus trap
            disableFocusTrap();

            // Restore focus to previously focused element
            if (previousFocusedElement) {
                previousFocusedElement.focus();
                previousFocusedElement = null;
            }
        }

        // Screen reader announcement helper
        function announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        }

        // Focus trap helpers
        let focusTrapHandler = null;

        function enableFocusTrap() {
            const focusableElements = lightbox.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            focusTrapHandler = (e) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            };

            document.addEventListener('keydown', focusTrapHandler);
        }

        function disableFocusTrap() {
            if (focusTrapHandler) {
                document.removeEventListener('keydown', focusTrapHandler);
                focusTrapHandler = null;
            }
        }

        function resetZoom() {
            scale = 1;
            lastScale = 1;
            translateX = 0;
            translateY = 0;
            lastTranslateX = 0;
            lastTranslateY = 0;
            if (lightboxImg) {
                lightboxImg.style.transform = 'scale(1) translate(0, 0)';
                lightboxImg.style.transition = 'transform 0.3s ease';
            }
        }

        function applyZoom() {
            if (lightboxImg) {
                lightboxImg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
            }
        }

        // Close with ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') {
                close();
            } else if (e.key === 'ArrowLeft' && lightbox.style.display === 'flex') {
                showPrev();
            } else if (e.key === 'ArrowRight' && lightbox.style.display === 'flex') {
                showNext();
            }
        });

        // Unified Touch Handling
        function handleTouchStart(e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                lastScale = scale;
            } else if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
            }
        }

        function handleTouchMove(e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

                if (!this.initialDist) {
                    this.initialDist = dist;
                } else {
                    scale = Math.max(1, Math.min(4, lastScale * (dist / this.initialDist)));
                    lightboxImg.style.transition = 'none';
                    applyZoom();
                }
            } else if (e.touches.length === 1 && scale > 1) {
                e.preventDefault();
                const touch = e.touches[0];
                const deltaX = touch.clientX - touchStartX;
                translateX = lastTranslateX + deltaX / scale;
                applyZoom();
            }
        }

        function handleTouchEnd(e) {
            if (e.touches.length === 0) {
                this.initialDist = null;
                lastTranslateX = translateX;
                lastTranslateY = translateY;
                lightboxImg.style.transition = 'transform 0.3s ease';

                // Reset if zoomed out too much
                if (scale < 1.1) {
                    resetZoom();
                }
            }

            // Handle Swipe (only if not zoomed)
            if (e.changedTouches.length > 0 && scale === 1) {
                touchEndX = e.changedTouches[0].clientX;
                handleSwipe();
            }
        }

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe left - next image
                showNext();
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe right - previous image
                showPrev();
            }
        }

        // Double-tap to zoom
        function handleDoubleTap(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                if (scale === 1) {
                    // Zoom in to 2x at tap position
                    scale = 2;
                    const rect = lightboxImg.getBoundingClientRect();
                    const x = e.clientX || (e.touches && e.touches[0].clientX);
                    const y = e.clientY || (e.touches && e.touches[0].clientY);
                    translateX = (rect.width / 2 - (x - rect.left)) / 2;
                    translateY = (rect.height / 2 - (y - rect.top)) / 2;
                } else {
                    resetZoom();
                }
                applyZoom();
            }
            lastTap = currentTime;
        }

        // Close with X button
        if (closeLightbox) closeLightbox.addEventListener('click', close);

        // Attach events
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) close();
            });

            // Attach touch events to the lightbox container for broader swipe area
            // But we need to be careful not to interfere with pinch-zoom on the image
            // So we'll keep pinch-zoom on the image, but maybe swipe can be on the container?
            // Actually, let's keep it on the image for consistency with the existing logic, 
            // but ensure the handlers are correct.

            if (lightboxImg) {
                lightboxImg.addEventListener('touchstart', handleTouchStart, { passive: false });
                lightboxImg.addEventListener('touchmove', handleTouchMove, { passive: false });
                lightboxImg.addEventListener('touchend', handleTouchEnd, { passive: false });
                lightboxImg.addEventListener('click', handleDoubleTap);
                lightboxImg.style.touchAction = 'none';
                lightboxImg.style.userSelect = 'none';
            }

            // Also allow swiping on the container itself (if clicking outside image)
            lightbox.addEventListener('touchstart', (e) => {
                if (e.target === lightbox) {
                    touchStartX = e.touches[0].clientX;
                }
            }, { passive: true });

            lightbox.addEventListener('touchend', (e) => {
                if (e.target === lightbox) {
                    touchEndX = e.changedTouches[0].clientX;
                    handleSwipe();
                }
            }, { passive: true });
        }

        // Slider buttons
        if (prevBtn) prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrev();
        });

        if (nextBtn) nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
        });

        if (inquireBtn) {
            inquireBtn.addEventListener('click', () => {
                // Get the artwork details to include in the inquiry
                const artworkTitle = lightboxTitle.textContent || 'this artwork';
                const artworkSize = lightboxSize.textContent.replace('Size: ', '') || '';

                // Create a pre-filled message template
                const message = `I'm interested in "${artworkTitle}" (${artworkSize}). Please provide more information about availability and pricing.`;

                // Store the message in localStorage to access it on the contact page
                localStorage.setItem('inquiryMessage', message);

                // Navigate to the contact page
                window.location.href = 'contact.html';
            });
        }
    }

    function initializeAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add will-change for performance
                    entry.target.style.willChange = 'transform, opacity, filter';

                    // Staggered animation with blur-to-focus
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');

                        // Remove will-change after animation completes
                        setTimeout(() => {
                            entry.target.style.willChange = 'auto';
                        }, 1000);
                    }, index * 100); // 100ms delay between elements
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    function initSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // CSS-based smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    function initParallaxEffects() {
        // Disable parallax on mobile for better performance
        if (window.innerWidth <= 768) return;

        let ticking = false;

        const parallaxElements = [
            { selector: '.hero-bg-image', speed: 0.3 },
            { selector: '.featured-item', speed: 0.08 },
            { selector: '.home-about-image', speed: 0.12 },
            { selector: '.gallery-item', speed: 0.15 }
        ];

        function updateParallax() {
            const scrolled = window.pageYOffset;

            parallaxElements.forEach(item => {
                const elements = document.querySelectorAll(item.selector);
                elements.forEach((el, index) => {
                    const rect = el.getBoundingClientRect();
                    const elementTop = rect.top + scrolled;
                    const elementHeight = rect.height;
                    const viewportHeight = window.innerHeight;

                    // Only apply parallax when element is in viewport
                    if (rect.top < viewportHeight && rect.bottom > 0) {
                        const distance = scrolled - elementTop + viewportHeight;
                        const movement = distance * item.speed;

                        // For gallery items, add slight variation
                        const variation = item.selector === '.gallery-item' ? (index % 3 - 1) * 0.05 : 0;
                        const finalMovement = movement + (movement * variation);

                        el.style.transform = `translateY(${finalMovement}px)`;
                    }
                });
            });

            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });
        updateParallax(); // Initial call
    }

    function initMagneticHover() {
        // Magnetic hover effect for gallery items
        function addMagneticEffect(element) {
            element.addEventListener('mousemove', function (e) {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const moveX = x * 0.08;
                const moveY = y * 0.08;

                element.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });

            element.addEventListener('mouseleave', function () {
                element.style.transform = '';
            });
        }

        // Apply to existing gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            addMagneticEffect(item);
        });

        // Create a mutation observer to watch for new gallery items
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('gallery-item')) {
                        addMagneticEffect(node);
                    }
                });
            });
        });

        const galleryGrid = document.querySelector('.gallery-grid');
        if (galleryGrid) {
            observer.observe(galleryGrid, { childList: true });
        }
    }

    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Function to detect system theme preference
        function getSystemThemePreference() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Check if user has set a theme preference, otherwise use system preference
        const userPreference = localStorage.getItem('theme');
        const currentTheme = userPreference || getSystemThemePreference();

        // Apply the current theme
        document.documentElement.setAttribute('data-theme', currentTheme);

        // Listen for system theme changes
        if (!userPreference && window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
            });
        }

        // Add click event to toggle theme
        themeToggle.addEventListener('click', function () {
            let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme); // Store user preference
        });
    }

    // --- Page Specific Logic ---

    // Load featured artworks on home page
    const featuredGrid = document.getElementById('featured-artworks');
    if (featuredGrid) {
        fetch('js/artworks.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Take first 6 artworks for featured section
                const featuredArtworks = data.slice(0, 6);

                featuredArtworks.forEach((artwork, index) => {
                    const item = document.createElement('a');
                    item.href = 'gallery.html';
                    item.className = 'featured-item animate-on-scroll';
                    item.setAttribute('aria-label', `View ${artwork.title} in gallery`);

                    item.innerHTML = `
                        <img src="${artwork.image}" alt="${artwork.title}" loading="${index < 3 ? 'eager' : 'lazy'}">
                        <div class="featured-item-info">
                            <h3>${artwork.title}</h3>
                            <p>${artwork.size}</p>
                        </div>
                    `;

                    featuredGrid.appendChild(item);
                });

                // Re-initialize animations for featured items
                initializeAnimations();
            })
            .catch(error => {
                console.error('Error loading featured artworks:', error);
                // Show user-friendly error message
                featuredGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">Unable to load artworks. Please refresh the page.</p>';
            });
    }

    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        // This is the Gallery page
        fetch('js/artworks.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                data.forEach(artwork => {
                    const item = document.createElement('div');
                    item.className = `gallery-item ${artwork.layout || ''} animate-on-scroll`;
                    item.setAttribute('role', 'button');
                    item.setAttribute('tabindex', '0');
                    item.setAttribute('aria-label', `View ${artwork.title}, ${artwork.size}`);
                    item.dataset.title = artwork.title;
                    item.dataset.size = artwork.size;
                    item.dataset.materials = artwork.materials;
                    item.dataset.description = artwork.description;
                    item.dataset.img = artwork.image;
                    // Store images array as JSON string
                    if (artwork.images && artwork.images.length > 0) {
                        item.dataset.images = JSON.stringify(artwork.images);
                    }

                    const unavailableDot = !artwork.available ? '<span class="unavailable-dot" aria-label="Currently unavailable"></span>' : '';

                    item.innerHTML = `
                        <img src="${artwork.image}" alt="${artwork.title}">
                        <div class="gallery-item-info">
                            <h3>${artwork.title} ${unavailableDot}</h3>
                            <p>${artwork.size}</p>
                        </div>
                    `;

                    // Add keyboard support for gallery items
                    item.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            item.click();
                        }
                    });

                    galleryGrid.appendChild(item);
                });

                // Re-initialize animations for dynamically created gallery items
                initializeAnimations();
                initializeLightbox(); // Init lightbox after images are loaded

                // Mobile gallery enhancements
                if (window.innerWidth <= 768) {
                    initMobileGallery(data.length);
                }
            })
            .catch(error => {
                console.error('Error fetching artworks:', error);
                // Show user-friendly error message
                galleryGrid.innerHTML = '<p style="text-align: center; padding: 4rem 2rem;">Unable to load gallery. Please refresh the page.</p>';
            });
    }

    function initMobileGallery(itemCount) {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Vertical scroll: Observe gallery items for fade-in animation
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe all gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            observer.observe(item);
        });

        // Add subtle scroll hint
        setTimeout(() => {
            addScrollHint();
        }, 800);
    }

    function addScrollHint() {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            bottom: 4rem;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(139, 120, 93, 0.6);
            font-size: 1.5rem;
            animation: scrollHint 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 100;
            opacity: 0.8;
        `;
        hint.innerHTML = '↓';
        document.body.appendChild(hint);

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scrollHint {
                0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
                50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Remove hint after scroll
        let scrolled = false;
        window.addEventListener('scroll', () => {
            if (!scrolled && window.scrollY > 50) {
                hint.style.transition = 'opacity 0.4s ease';
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 400);
                scrolled = true;
            }
        }, { once: true, passive: true });

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (hint.parentNode) {
                hint.style.transition = 'opacity 0.4s ease';
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 400);
            }
        }, 4000);
    }


    // Language toggle functionality
    function initializeLanguageToggle() {
        const langToggle = document.getElementById('lang-toggle');
        if (!langToggle) return;

        // Update ARIA label based on current language
        function updateLanguageLabel() {
            const currentLang = window.currentLang || 'en';
            const langName = currentLang === 'en' ? 'English' : 'Ukrainian';
            langToggle.setAttribute('aria-label', `Switch language (current: ${langName})`);
        }

        updateLanguageLabel();

        langToggle.addEventListener('click', function() {
            const langOptions = this.querySelectorAll('.lang-option');
            langOptions.forEach(option => {
                option.classList.toggle('active-lang');
            });

            // Update ARIA label after language switch
            setTimeout(updateLanguageLabel, 100);

            // Translation logic is handled in translations.js
        });
    }

    // --- Global Initializers ---
    initializeThemeToggle();
    initializeAnimations();
    initializeLanguageToggle();
});

// Add event listener for images to ensure they're properly loaded
document.addEventListener('load', function (e) {
    if (e.target.tagName === 'IMG') {
        e.target.classList.add('image-loaded');
    }
}, true);