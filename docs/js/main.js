document.addEventListener('DOMContentLoaded', function () {
    // Add a class to the body to indicate that JS is active and animations can be applied.
    document.body.classList.add('js-animations-active');

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
            } else if (sliderIndicator) {
                sliderIndicator.style.display = 'none';
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

        // Touch/swipe support for mobile
        function handleTouchStart(e) {
            touchStartX = e.changedTouches[0].screenX;
        }

        function handleTouchEnd(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) {
                // Swipe left - next image
                showNext();
            }
            if (touchEndX > touchStartX + 50) {
                // Swipe right - previous image
                showPrev();
            }
        }

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
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
            });
        });

        function close() {
            lightbox.style.display = 'none';
            currentImages = [];
            currentIndex = 0;
        }

        // Close with X button
        if (closeLightbox) closeLightbox.addEventListener('click', close);

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

        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) close();
            });

            // Touch events for swipe
            const imageWrapper = lightbox.querySelector('.lightbox-image-wrapper');
            if (imageWrapper) {
                imageWrapper.addEventListener('touchstart', handleTouchStart, false);
                imageWrapper.addEventListener('touchend', handleTouchEnd, false);
            }
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
        // Initialize Lenis for smooth scrolling
        if (typeof Lenis !== 'undefined') {
            const lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }

            requestAnimationFrame(raf);
        }

        // Cinematic Reveal Animations
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add a slight delay based on index if siblings are animating together
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' }); // Trigger slightly later for drama

        animatedElements.forEach(element => {
            observer.observe(element);
        });
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
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        // Show skeleton loader while loading
        const skeletonCount = 6;
        let skeletonHTML = '';
        for (let i = 0; i < skeletonCount; i++) {
            skeletonHTML += '<div class="skeleton-item"></div>';
        }
        galleryGrid.innerHTML = skeletonHTML;

        // This is the Gallery page
        fetch('js/artworks.json')
            .then(response => response.json())
            .then(data => {
                // Clear skeletons
                galleryGrid.innerHTML = '';

                data.forEach(artwork => {
                    const item = document.createElement('div');
                    item.className = `gallery-item ${artwork.layout || ''}`;
                    item.dataset.title = artwork.title;
                    item.dataset.size = artwork.size;
                    item.dataset.materials = artwork.materials;
                    item.dataset.description = artwork.description;
                    item.dataset.img = artwork.image;
                    // Store images array as JSON string
                    if (artwork.images && artwork.images.length > 0) {
                        item.dataset.images = JSON.stringify(artwork.images);
                    }

                    const statusBadge = !artwork.available ? '<span class="status-badge sold" data-translate="gallery.sold">Sold</span>' : '';

                    item.innerHTML = `
                        <img src="${artwork.image}" alt="${artwork.title}">
                        <div class="gallery-item-info">
                            <h3>${artwork.title} ${statusBadge}</h3>
                            <p>${artwork.size}</p>
                        </div>
                    `;
                    galleryGrid.appendChild(item);
                });

                // Apply translations to newly added elements
                if (window.applyTranslations) {
                    window.applyTranslations();
                }

                initializeLightbox(); // Init lightbox after images are loaded
            })
            .catch(error => {
                console.error('Error fetching artworks:', error);
                galleryGrid.innerHTML = '<p>Unable to load gallery. Please try again later.</p>';
            });
    }

    function initializeImageOverlays() {
        // We've replaced the image overlay with responsive text content cards
        // This function remains for backwards compatibility but doesn't do anything
    }

    // --- Global Initializers ---
    initializeThemeToggle();
    initializeAnimations();
    initializeImageOverlays();

    // Contact Form Handling
    const contactForm = document.querySelector('form[action*="formspree"]');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            const btn = this.querySelector('button[type="submit"]');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Sending...';
                btn.disabled = true;
                btn.style.opacity = '0.7';
                btn.style.cursor = 'wait';

                // Reset after a timeout in case of error/navigation
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                }, 5000);
            }
        });
    }
});

// Add event listener for images to ensure they're properly loaded
document.addEventListener('load', function (e) {
    if (e.target.tagName === 'IMG') {
        e.target.classList.add('image-loaded');
    }
}, true);